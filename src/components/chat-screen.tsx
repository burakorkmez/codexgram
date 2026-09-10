import { Image, type ImageSource } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { StatusBar } from 'expo-status-bar';
import { useRef, useState, type Dispatch, type SetStateAction } from 'react';
import { Alert, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FeedIcon } from './feed-icon';

export const chatAvatar = require('../../assets/images/chat/avatar.png');
export type ChatMessage = { id: string; text: string; outgoing?: boolean; time: string; image?: ImageSource; read?: boolean; width?: number };
export const initialMessages: ChatMessage[] = [
  { id: '1', text: 'Hey! 👋\nThat photo you posted from\nColorado is amazing!', time: '10:24 AM', width: 208 },
  { id: '2', text: 'Thanks! 🙏\nIt was such a beautiful trip.', outgoing: true, time: '10:26 AM', read: true, width: 195 },
  { id: '3', text: 'Are you planning to go back\nanytime soon?', time: '10:28 AM', width: 208 },
  { id: '4', text: 'Hopefully this summer!\nCan’t get enough of views like this.', outgoing: true, time: '10:29 AM', image: require('../../assets/images/chat/lake.png'), read: true, width: 244 },
  { id: '5', text: 'Wow 😍\nLet me know if you go —\nI’d love to join sometime!', time: '10:31 AM', width: 188 },
  { id: '6', text: 'Definitely! I’ll keep you posted.', outgoing: true, time: '10:32 AM', width: 220 },
];
export function ChatScreen({ onBack, messages, setMessages }: { onBack: () => void; messages: ChatMessage[]; setMessages: Dispatch<SetStateAction<ChatMessage[]>> }) {
  const [draft, setDraft] = useState('');
  const [attachment, setAttachment] = useState<string>();
  const [picking, setPicking] = useState(false);
  const [viewer, setViewer] = useState<ImageSource | null>(null);
  const [muted, setMuted] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const shouldScroll = useRef(false);
  const pickerBusy = useRef(false);
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const s = width / 390;
  const v = (height - insets.top - Math.min(insets.bottom, 34)) / 784;
  const fs = (value: number) => value * s;
  const canSend = !!draft.trim() || !!attachment;
  const send = () => {
    if (!canSend) return;
    const time = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    shouldScroll.current = true;
    setMessages(current => [...current, { id: `${Date.now()}`, text: draft.trim(), outgoing: true, time, image: attachment ? { uri: attachment } : undefined }]);
    setDraft(''); setAttachment(undefined);
  };
  async function pickPhoto() {
    if (pickerBusy.current) return;
    pickerBusy.current = true; setPicking(true);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.9 });
      if (!result.canceled) setAttachment(result.assets[0].uri);
    } catch { Alert.alert('Unable to open photos', 'Please try again.'); }
    finally { pickerBusy.current = false; setPicking(false); }
  }
  return <KeyboardAvoidingView style={[styles.screen, { paddingTop: insets.top }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
    <StatusBar style="dark" />
    <View style={[styles.header, { height: 62 * v, paddingBottom: 8 * v, paddingHorizontal: fs(12), gap: fs(12) }]}>
      <Pressable accessibilityRole="button" accessibilityLabel="Back to messages" onPress={onBack} hitSlop={10}><FeedIcon name="back" size={fs(20)} /></Pressable>
      <Image source={chatAvatar} style={{ width: fs(49), height: fs(49), borderRadius: fs(25), marginLeft: fs(14) }} />
      <View style={{ flex: 1, gap: 4 * v }}><Text style={{ color: '#090E29', fontSize: fs(17), fontWeight: '700', letterSpacing: -0.5 }}>alex.rivera</Text><View style={{ flexDirection: 'row', gap: fs(5), alignItems: 'center' }}><View style={{ width: fs(8), height: fs(8), borderRadius: fs(4), backgroundColor: '#18CB2E' }} /><Text style={{ color: '#8A90A7', fontSize: fs(12) }}>Online</Text></View></View>
      <Pressable accessibilityRole="button" accessibilityLabel="Voice call" onPress={() => Alert.alert('Voice calls', 'Calling isn’t connected in this demo yet.')} hitSlop={8}><FeedIcon name="phone" size={fs(21)} color="#090E29" /></Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel="Video call" onPress={() => Alert.alert('Video calls', 'Video calling isn’t connected in this demo yet.')} hitSlop={8} style={{ marginLeft: fs(8) }}><FeedIcon name="video-call" size={fs(22)} color="#090E29" /></Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel="Chat options" onPress={() => Alert.alert('Chat options', 'This is a local demo conversation.', [{ text: muted ? 'Unmute conversation' : 'Mute conversation', onPress: () => setMuted(value => !value) }, { text: 'Cancel', style: 'cancel' }])} style={{ marginLeft: fs(6) }} hitSlop={8}><Text style={{ color: '#090E29', fontSize: fs(19), fontWeight: '700', letterSpacing: 1 }}>•••</Text></Pressable>
    </View>
    <ScrollView ref={scrollRef} keyboardShouldPersistTaps="handled" keyboardDismissMode="interactive" showsVerticalScrollIndicator={false} onContentSizeChange={() => { if (shouldScroll.current) { scrollRef.current?.scrollToEnd({ animated: true }); shouldScroll.current = false; } }} contentContainerStyle={{ paddingHorizontal: fs(11), paddingBottom: 10 * v }}>
      <Text style={{ color: '#8990A8', fontSize: fs(11), textAlign: 'center', marginTop: 12 * v, marginBottom: 10 * v }}>Today</Text>
      {messages.map(message => <View key={message.id} style={{ marginBottom: 4.5 * v, alignItems: message.outgoing ? 'flex-end' : 'flex-start' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: fs(10), maxWidth: '100%' }}>
          {!message.outgoing && <Image source={chatAvatar} style={{ width: fs(35), height: fs(35), borderRadius: fs(18) }} />}
          <View style={{ width: message.width ? fs(message.width) : undefined, maxWidth: fs(290), alignItems: message.outgoing ? 'flex-end' : 'flex-start' }}>
            {message.image && <Pressable accessibilityRole="button" accessibilityLabel="View shared photo" onPress={() => setViewer(message.image!)} style={{ width: message.width ? '98%' : fs(244), marginBottom: 1 }}><Image source={message.image} style={{ width: '100%', height: 136 * v, borderRadius: fs(16) }} contentFit="cover" /></Pressable>}
            {!!message.text && <View style={{ backgroundColor: message.outgoing ? '#087EFF' : '#F2F3F6', borderRadius: fs(16), paddingHorizontal: fs(14), paddingVertical: 9 * v, width: message.width ? '100%' : undefined }}><Text style={{ fontSize: fs(14), lineHeight: 19 * v, color: message.outgoing ? 'white' : '#0C112D', letterSpacing: -0.2 }}>{message.text}</Text></View>}
          </View>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: fs(8), marginTop: 4 * v, marginLeft: message.outgoing ? 0 : fs(47), marginRight: message.outgoing ? fs(5) : 0 }}><Text style={{ color: '#8A90A7', fontSize: fs(11), lineHeight: 13 * v }}>{message.time}</Text>{message.outgoing && <FeedIcon name={message.read ? 'double-check' : 'check'} size={fs(16)} color={message.read ? '#087EFF' : '#8A90A7'} />}</View>
      </View>)}
    </ScrollView>
    {attachment && <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 10 }}><Image source={{ uri: attachment }} style={{ width: 58, height: 58, borderRadius: 10 }} /><Text style={{ flex: 1, color: '#7F89A4' }}>Photo ready to send</Text><Pressable accessibilityRole="button" accessibilityLabel="Remove attachment" onPress={() => setAttachment(undefined)} style={{ padding: 10 }}><FeedIcon name="close" /></Pressable></View>}
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: fs(9), paddingHorizontal: fs(11), paddingTop: 7 * v, paddingBottom: Math.max(Math.min(insets.bottom, 34), 12) }}>
      <Pressable accessibilityRole="button" accessibilityLabel="Add attachment" disabled={picking} onPress={() => void pickPhoto()} style={[styles.circle, { width: fs(45), height: fs(45) }]}><FeedIcon name="plus" size={fs(24)} /></Pressable>
      <View style={[styles.inputWrap, { minHeight: fs(45), borderRadius: fs(25), paddingLeft: fs(15), paddingRight: fs(13), gap: fs(8) }]}><TextInput accessibilityLabel="Message" value={draft} onChangeText={setDraft} placeholder="Message..." placeholderTextColor="#8A90A7" multiline maxLength={2000} onFocus={() => scrollRef.current?.scrollToEnd({ animated: true })} style={{ flex: 1, color: '#0C112D', fontSize: fs(14), paddingVertical: 10, maxHeight: 110 }} /><Pressable accessibilityRole="button" accessibilityLabel="Choose photo" disabled={picking} onPress={() => void pickPhoto()} hitSlop={8}><FeedIcon name="photo" size={fs(22)} /></Pressable></View>
      <Pressable accessibilityRole="button" accessibilityLabel="Send message" accessibilityState={{ disabled: !canSend }} disabled={!canSend} onPress={send} style={[styles.circle, { width: fs(46), height: fs(46), backgroundColor: '#087EFF' }]}><FeedIcon name="chat-send" size={fs(23)} color="white" /></Pressable>
    </View>
    <Modal visible={!!viewer} animationType="fade" presentationStyle="fullScreen" onRequestClose={() => setViewer(null)}><View style={{ flex: 1, backgroundColor: '#080D18', paddingTop: insets.top }}><Pressable accessibilityRole="button" accessibilityLabel="Close photo" onPress={() => setViewer(null)} style={{ padding: 20, alignSelf: 'flex-end' }}><FeedIcon name="close" color="white" /></Pressable>{viewer && <Image source={viewer} contentFit="contain" style={{ flex: 1, marginBottom: insets.bottom }} />}</View></Modal>
  </KeyboardAvoidingView>;
}
const styles = StyleSheet.create({ screen: { flex: 1, backgroundColor: '#FCFDFE' }, header: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#ECEEF3' }, circle: { borderRadius: 100, backgroundColor: '#F1F3F6', alignItems: 'center', justifyContent: 'center' }, inputWrap: { flex: 1, backgroundColor: '#F1F3F6', flexDirection: 'row', alignItems: 'center' } });
