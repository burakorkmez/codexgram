import { useMutation, usePaginatedQuery, useQuery } from 'convex/react';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, AppState, FlatList, Pressable, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api, errorMessage, type Id } from '@/lib/social';
import { useMessages } from '@/context/messages-context';
import { ChatScreen, type ChatMessage } from '../chat-screen';
import { Avatar } from './media';
import { ConnectionStatus, LoadMore, ui } from './ui';

export const messageTime = (timestamp: number) => new Date(timestamp).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
export function inboxTime(timestamp: number) {
  const date = new Date(timestamp); const today = new Date();
  if (date.toDateString() === today.toDateString()) return messageTime(timestamp);
  today.setDate(today.getDate() - 1);
  return date.toDateString() === today.toDateString() ? 'Yesterday' : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
export function LiveChat() {
  const { id } = useLocalSearchParams<{ id: Id<'conversations'> }>(); const router = useRouter();
  const conversation = useQuery(api.messaging.get, { id });
  const history = usePaginatedQuery(api.messaging.history, { id }, { initialNumItems: 30 });
  const markRead = useMutation(api.messaging.markRead); const outbox = useMessages();
  const [atBottom, setAtBottom] = useState(true);
  const [focused, setFocused] = useState(true); const [active, setActive] = useState(AppState.currentState === 'active');
  useFocusEffect(useCallback(() => { setFocused(true); return () => setFocused(false); }, []));
  useEffect(() => { const subscription = AppState.addEventListener('change', state => setActive(state === 'active')); return () => subscription.remove(); }, []);
  const latest = history.results[0]?.sequence;
  useEffect(() => { if (focused && active && atBottom && latest) void markRead({ id, throughSequence: latest }).catch(() => {}); }, [id, latest, markRead, focused, active, atBottom]);
  const messages: ChatMessage[] = history.results.slice().reverse().map(item => ({ id: item._id, text: item.text, time: `${new Date(item._creationTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} · ${messageTime(item._creationTime)}`, outgoing: item.outgoing }));
  for (const item of outbox.pending.filter(item => item.conversationId === id && !history.results.some(saved => saved.outgoing && saved.requestId === item.id))) messages.push({ id: item.id, text: item.text, time: messageTime(item.createdAt), outgoing: true, status: item.status, retry: () => outbox.retry(item) });
  if (!conversation) return <View style={ui.center}><ActivityIndicator color="#087EFF" /><Pressable onPress={() => router.back()} style={{ padding: 20 }}><Text style={ui.link}>Back to messages</Text></Pressable></View>;
  return <ChatScreen live onAtBottom={setAtBottom} onBack={() => router.back()} messages={messages} onSend={text => outbox.send(id, text)} peer={{ name: conversation.other.username, avatar: size => <Avatar profile={conversation.other} size={size} /> }} beforeMessages={<><ConnectionStatus />{history.status === 'CanLoadMore' ? <Pressable onPress={() => history.loadMore(30)} style={{ padding: 12, alignSelf: 'center' }}><Text style={ui.link}>Load earlier messages</Text></Pressable> : history.status.startsWith('Loading') ? <ActivityIndicator color="#087EFF" /> : !messages.length ? <Text style={[ui.muted, { textAlign: 'center', padding: 24 }]}>Say hello to {conversation.other.username}.</Text> : null}</>} />;
}
export function NewConversation({ close }: { close: () => void }) {
  const [text, setText] = useState(''); const [opening, setOpening] = useState(false); const router = useRouter(); const insets = useSafeAreaInsets();
  const result = usePaginatedQuery(api.profiles.search, { text }, { initialNumItems: 30 }); const start = useMutation(api.messaging.start);
  const members = result.results.filter(item => !item.isOwn && !item.isDemo);
  return <View style={[ui.screen, { paddingTop: insets.top }]}><View style={ui.header}><Text style={[ui.title, { flex: 1 }]}>New message</Text><Pressable onPress={close} style={{ padding: 10 }}><Text style={ui.link}>Cancel</Text></Pressable></View>
    <TextInput accessibilityLabel="Search members to message" value={text} onChangeText={setText} placeholder="Search name or username" autoCapitalize="none" style={{ backgroundColor: '#F2F4F8', borderRadius: 16, padding: 16, margin: 18, fontSize: 16 }} />
    <FlatList keyboardShouldPersistTaps="handled" data={members} keyExtractor={item => item._id} renderItem={({ item }) => <Pressable disabled={opening} onPress={async () => { setOpening(true); try { const id = await start({ profileId: item._id }); close(); router.push({ pathname: '/chat/[id]', params: { id } }); } catch (e) { Alert.alert('Could not open chat', errorMessage(e)); } finally { setOpening(false); } }} style={{ padding: 18, flexDirection: 'row', alignItems: 'center', gap: 14 }}><Avatar profile={item} size={50} /><View><Text style={ui.text}>{item.username}</Text><Text style={ui.muted}>{item.name}</Text></View></Pressable>}
      ListEmptyComponent={result.status !== 'LoadingFirstPage' ? <Text style={[ui.muted, { padding: 24, textAlign: 'center' }]}>No members found. Another signed-up member can receive private messages. Fictional seed profiles cannot reply.</Text> : null} ListFooterComponent={<LoadMore status={result.status} loadMore={result.loadMore} />} />
  </View>;
}
