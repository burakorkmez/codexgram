import { useRouter, type ErrorBoundaryProps } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { ProfileGate } from '@/context/social-context';
import { LiveChat } from '@/components/social/messages';
import { ui } from '@/components/social/ui';
export default function ChatRoute() { return <ProfileGate><LiveChat /></ProfileGate>; }
export function ErrorBoundary({ retry }: ErrorBoundaryProps) {
  const router = useRouter();
  return <View style={[ui.center, { padding: 28, gap: 18 }]}><Text style={ui.title}>Conversation unavailable</Text><Text style={[ui.muted, { textAlign: 'center' }]}>We couldn’t open this conversation. Check your connection and that you’re signed in with the right account.</Text><Pressable onPress={() => void retry()} style={ui.button}><Text style={ui.buttonText}>Try again</Text></Pressable><Pressable onPress={() => router.replace('/(tabs)/messages')} style={{ padding: 12 }}><Text style={ui.link}>Back to messages</Text></Pressable></View>;
}
