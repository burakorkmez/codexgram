import { useMutation, usePaginatedQuery, useQuery } from 'convex/react';
import type { FunctionReturnType } from 'convex/server';
import { randomUUID } from 'expo-crypto';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Keyboard, KeyboardAvoidingView, Platform, Pressable, Text, TextInput, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useProfile } from '@/context/social-context';
import { api, errorMessage, type Id } from '@/lib/social';
import { FeedIcon } from '../feed-icon';
import { Avatar } from './media';
import { PostCard } from './post-card';
import { Header, ConnectionStatus, LoadMore, ui } from './ui';

type Comment = FunctionReturnType<typeof api.social.comments>['page'][number];
function relativeTime(timestamp: number, now: number) {
  const minutes = Math.max(0, Math.floor((now - timestamp) / 60000));
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (minutes < 1440) return `${Math.floor(minutes / 60)}h ago`;
  return `${Math.floor(minutes / 1440)}d ago`;
}
export function PostDetail() {
  const { id } = useLocalSearchParams<{ id: Id<'posts'> }>(); const insets = useSafeAreaInsets(); const me = useProfile();
  const { width } = useWindowDimensions(); const s = width / 390;
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');
  const post = useQuery(api.posts.get, { id });
  const comments = usePaginatedQuery(api.social.comments, { postId: id, order }, { initialNumItems: 20 });
  const add = useMutation(api.social.addComment); const remove = useMutation(api.social.deleteComment);
  const [text, setText] = useState(''); const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  const [replying, setReplying] = useState<string | null>(null); const [keyboardVisible, setKeyboardVisible] = useState(false); const [now, setNow] = useState(Date.now());
  const request = useRef({ id: randomUUID(), text: '' }); const input = useRef<TextInput>(null);
  const list = useRef<FlatList<Comment>>(null); const commentsTop = useRef(0); const scrollOffset = useRef(0); const restoreOffset = useRef<number | null>(null);
  const [postVisible, setPostVisible] = useState(true);
  function sortComments(next: 'asc' | 'desc') { if (next === order) return; restoreOffset.current = scrollOffset.current; setOrder(next); }
  useEffect(() => {
    if (comments.status === 'LoadingFirstPage' || restoreOffset.current === null) return;
    const offset = restoreOffset.current;
    const frame = requestAnimationFrame(() => { list.current?.scrollToOffset({ offset, animated: false }); restoreOffset.current = null; });
    return () => cancelAnimationFrame(frame);
  }, [comments.status, order]);
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60000);
    const show = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow', () => setKeyboardVisible(true));
    const hide = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide', () => setKeyboardVisible(false));
    return () => { clearInterval(timer); show.remove(); hide.remove(); };
  }, []);
  async function submit() {
    if (!text.trim() || busy) return; setBusy(true); setError('');
    if (request.current.text !== text.trim()) request.current = { id: randomUUID(), text: text.trim() };
    try { await add({ postId: id, text: request.current.text, requestId: request.current.id }); setText(''); setReplying(null); setNow(Date.now()); request.current = { id: randomUUID(), text: '' }; Keyboard.dismiss(); }
    catch (e) { setError(errorMessage(e)); } finally { setBusy(false); }
  }
  function deleteComment(item: Comment) {
    if (!item.isOwn) return;
    Alert.alert('Delete comment?', 'This cannot be undone.', [{ text: 'Cancel', style: 'cancel' }, { text: 'Delete', style: 'destructive', onPress: () => { void remove({ id: item._id }).catch(e => Alert.alert('Could not delete comment', errorMessage(e))); } }]);
  }
  return <KeyboardAvoidingView style={[ui.screen, { backgroundColor: 'white', paddingTop: insets.top }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}><Header title="Post" back compose={false} /><ConnectionStatus />
    {post === undefined ? <ActivityIndicator color="#087EFF" /> : post === null ? <View style={ui.center}><Text style={ui.title}>Post unavailable</Text><Text style={ui.muted}>This post may have been deleted.</Text></View> : <>
      <FlatList ref={list} keyboardShouldPersistTaps="handled" keyboardDismissMode="interactive" showsVerticalScrollIndicator={false} data={comments.results} keyExtractor={item => item._id} onScroll={e => { scrollOffset.current = e.nativeEvent.contentOffset.y; setPostVisible(e.nativeEvent.contentOffset.y < 250); }} scrollEventThrottle={100} contentContainerStyle={{ paddingBottom: 12 * s }} ListHeaderComponent={<><PostCard detail post={post} visible={postVisible} onComments={() => list.current?.scrollToOffset({ offset: Math.max(0, commentsTop.current - 100 * s), animated: true })} /><View onLayout={event => { commentsTop.current = event.nativeEvent.layout.y; }} style={{ marginHorizontal: 19 * s, borderTopWidth: 1, borderColor: '#EDF0F6', paddingTop: 14 * s, paddingBottom: 16 * s, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}><Text style={{ color: '#0C1239', fontSize: 16 * s, fontWeight: '700', letterSpacing: -0.4 }}>Comments</Text><Pressable accessibilityRole="button" accessibilityLabel={`Sort comments: ${order === 'desc' ? 'Newest' : 'Oldest'}`} onPress={() => Alert.alert('Sort comments', undefined, [{ text: 'Newest first', onPress: () => sortComments('desc') }, { text: 'Oldest first', onPress: () => sortComments('asc') }, { text: 'Cancel', style: 'cancel' }])} hitSlop={10} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 * s }}><Text style={{ fontSize: 14 * s, color: '#8190B3' }}>{order === 'desc' ? 'Newest' : 'Oldest'}</Text><View style={{ transform: [{ rotate: '-90deg' }] }}><FeedIcon name="back" size={12 * s} color="#8190B3" /></View></Pressable></View></>}
        renderItem={({ item }) => <CommentRow item={item} scale={s} now={now} onDelete={() => deleteComment(item)} onReply={() => { setReplying(item.author.username); setText(`@${item.author.username} `); input.current?.focus(); }} />}
        ListEmptyComponent={comments.status !== 'LoadingFirstPage' ? <Text style={[ui.muted, { padding: 20 }]}>Start the conversation.</Text> : null} ListFooterComponent={<LoadMore status={comments.status} loadMore={comments.loadMore} />} />
      {!!error && <Text accessibilityRole="alert" style={[ui.error, { paddingHorizontal: 16 }]}>{error}</Text>}
      {replying && <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 8 }}><Text style={[ui.muted, { flex: 1 }]}>Replying to {replying}</Text><Pressable accessibilityLabel="Cancel reply" onPress={() => { setReplying(null); setText(''); }} hitSlop={10}><FeedIcon name="close" size={16} /></Pressable></View>}
      <View style={{ backgroundColor: 'white', borderTopWidth: 1, borderColor: '#F0F2F7', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16 * s, paddingTop: 11 * s, paddingBottom: keyboardVisible ? 8 : Math.max(insets.bottom, 16) + 8, gap: 10 * s }}><Avatar profile={me} size={39 * s} /><TextInput ref={input} accessibilityLabel="Add a comment" editable={!busy} value={text} onChangeText={setText} maxLength={2000} multiline placeholder="Add a comment..." placeholderTextColor="#8796B8" style={{ flex: 1, maxHeight: 120, minHeight: 40 * s, borderRadius: 24 * s, backgroundColor: '#F5F6FA', borderWidth: 1, borderColor: '#E5EAF5', paddingHorizontal: 15 * s, paddingVertical: 9 * s, fontSize: 15 * s, color: '#0C1239' }} /><Pressable accessibilityRole="button" accessibilityState={{ disabled: busy || !text.trim() }} disabled={busy || !text.trim()} onPress={() => void submit()} style={{ backgroundColor: '#087EFF', borderRadius: 14 * s, minHeight: 40 * s, minWidth: 76 * s, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12 * s }}><Text style={{ color: 'white', fontWeight: '600', fontSize: 15 * s }}>{busy ? '…' : 'Post'}</Text></Pressable></View>
    </>}
  </KeyboardAvoidingView>;
}
function CommentRow({ item, scale: s, now, onDelete, onReply }: { item: Comment; scale: number; now: number; onDelete: () => void; onReply: () => void }) {
  const toggle = useMutation(api.postInteractions.setCommentLike); const [pending, setPending] = useState<boolean | null>(null); const liked = pending ?? item.isLiked; const router = useRouter();
  const openProfile = () => router.push({ pathname: '/member/[id]', params: { id: item.author._id } });
  return <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 17 * s, paddingHorizontal: 18 * s, paddingBottom: 17 * s }}><Pressable accessibilityLabel={`View ${item.author.username}`} onPress={openProfile}><Avatar profile={item.author} size={42 * s} /></Pressable><View style={{ flex: 1, gap: 3 * s }}><View style={{ flexDirection: 'row', alignItems: 'center', gap: 9 * s }}><Pressable onPress={openProfile} style={{ flexShrink: 1 }}><Text numberOfLines={1} style={{ color: '#0C1239', fontWeight: '700', fontSize: 14 * s, letterSpacing: -0.3 }}>{item.author.username}</Text></Pressable><Text style={{ color: '#8190B3', fontSize: 12 * s }}>{relativeTime(item._creationTime, now)}</Text></View><Pressable onLongPress={item.isOwn ? onDelete : undefined} accessibilityHint={item.isOwn ? 'Long press to delete your comment' : undefined}><Text style={{ color: '#0C1239', fontSize: 14 * s, lineHeight: 19 * s, letterSpacing: -0.25 }}>{item.text}</Text></Pressable><Pressable accessibilityRole="button" accessibilityLabel={`Reply to ${item.author.username}`} onPress={onReply} style={{ alignSelf: 'flex-start', paddingVertical: 3 * s }}><Text style={{ color: '#8190B3', fontSize: 13 * s }}>Reply</Text></Pressable></View><Pressable accessibilityRole="button" accessibilityLabel={liked ? 'Unlike comment' : 'Like comment'} accessibilityState={{ selected: liked }} disabled={pending !== null} onPress={async () => { setPending(!liked); try { await toggle({ commentId: item._id, liked: !liked }); } catch (e) { Alert.alert('Could not update like', errorMessage(e)); } finally { setPending(null); } }} hitSlop={10} style={{ paddingTop: 10 * s, paddingLeft: 2 * s }}><FeedIcon name="heart" size={18 * s} color={liked ? '#FF244E' : '#0C1239'} filled={liked} /></Pressable></View>;
}
