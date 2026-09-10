import { Image } from 'expo-image';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChatScreen, chatAvatar, initialMessages } from './chat-screen';
import { FeedIcon } from './feed-icon';

export function MessagesTab() {
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState(initialMessages);
  const insets = useSafeAreaInsets();
  return <View style={[styles.screen, { paddingTop: insets.top }]}>
    <StatusBar style="dark" />
    <Text accessibilityRole="header" style={styles.heading}>Messages</Text>
    <Pressable accessibilityRole="button" accessibilityLabel="Open chat with alex.rivera" onPress={() => setChatOpen(true)} style={styles.conversation}>
      <Image source={chatAvatar} style={{ width: 60, height: 60, borderRadius: 30 }} />
      <View style={{ flex: 1, gap: 6 }}><Text style={styles.name}>alex.rivera</Text><Text numberOfLines={1} style={styles.preview}>{messages[messages.length - 1]?.text || 'Photo'}</Text></View>
      <View style={{ alignItems: 'flex-end', gap: 10 }}><Text style={styles.time}>{messages[messages.length - 1]?.time}</Text><View style={{ transform: [{ rotate: '180deg' }] }}><FeedIcon name="back" size={15} color="#8A90A7" /></View></View>
    </Pressable>
    <Text style={styles.demo}>Demo conversation · messages stay on this device for this session</Text>
    <Modal visible={chatOpen} animationType="slide" presentationStyle="fullScreen" onRequestClose={() => setChatOpen(false)}>
      <ChatScreen messages={messages} setMessages={setMessages} onBack={() => setChatOpen(false)} />
    </Modal>
  </View>;
}
const styles = StyleSheet.create({ screen: { flex: 1, backgroundColor: '#FCFDFE' }, heading: { paddingHorizontal: 24, paddingVertical: 20, fontSize: 30, fontWeight: '700', color: '#0D1529', letterSpacing: -0.7 }, conversation: { marginHorizontal: 18, padding: 14, borderRadius: 20, backgroundColor: '#F2F4F8', flexDirection: 'row', alignItems: 'center', gap: 14 }, name: { fontSize: 17, fontWeight: '700', color: '#0D1529' }, preview: { fontSize: 14, color: '#7F89A4' }, time: { fontSize: 11, color: '#8A90A7' }, demo: { margin: 24, fontSize: 12, color: '#8A90A7', textAlign: 'center' } });
