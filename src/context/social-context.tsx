import { useAuth, useClerk, useUser } from '@clerk/expo';
import { useConvexAuth, useMutation, useQuery } from 'convex/react';
import { createContext, useContext, useState, type ReactNode } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, Text, TextInput, View } from 'react-native';
import { api, errorMessage, type SocialProfile } from '@/lib/social';
import { ui } from '@/components/social/ui';

const ProfileContext = createContext<SocialProfile | null>(null);
export function useProfile() {
  const profile = useContext(ProfileContext);
  if (!profile) throw new Error('A completed profile is required.');
  return profile;
}
export function ProfileGate({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const { signOut } = useClerk();
  const me = useQuery(api.profiles.me, isAuthenticated ? {} : 'skip');
  if (isLoading || (isAuthenticated && me === undefined)) return <View style={ui.center}><ActivityIndicator color="#087EFF" /><Text style={ui.muted}>Loading your profile…</Text></View>;
  if (!isAuthenticated) return <View style={ui.center}><Text style={ui.title}>Connecting your account</Text><Text style={ui.muted}>Unable to authenticate with Convex. Check your connection and that the Clerk Convex integration is enabled, then sign in again.</Text><Pressable style={ui.button} onPress={() => void signOut()}><Text style={ui.buttonText}>Back to sign in</Text></Pressable></View>;
  if (!me) return <Onboarding />;
  return <ProfileContext.Provider value={me}>{children}</ProfileContext.Provider>;
}
function Onboarding() {
  const { user } = useUser(); const { signOut } = useClerk(); const create = useMutation(api.profiles.create);
  const [username, setUsername] = useState(user?.username ?? '');
  const [name, setName] = useState(user?.fullName ?? ''); const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  async function submit() {
    if (busy) return; setBusy(true); setError('');
    try { await create({ username, name }); } catch (e) { setError(errorMessage(e)); } finally { setBusy(false); }
  }
  return <KeyboardAvoidingView style={ui.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}><View style={ui.center}><Text style={ui.title}>Make yourself at home</Text><Text style={ui.muted}>Choose a unique username so friends can find you.</Text><TextInput accessibilityLabel="Username" placeholder="Username" autoCapitalize="none" autoCorrect={false} maxLength={30} value={username} onChangeText={setUsername} style={[ui.input, { width: '100%' }]} /><TextInput accessibilityLabel="Display name" placeholder="Display name" maxLength={60} value={name} onChangeText={setName} style={[ui.input, { width: '100%' }]} />{!!error && <Text accessibilityRole="alert" style={ui.error}>{error}</Text>}<Pressable disabled={busy || !username.trim() || !name.trim()} style={[ui.button, (busy || !username.trim() || !name.trim()) && ui.disabled]} onPress={() => void submit()}><Text style={ui.buttonText}>{busy ? 'Creating profile…' : 'Continue'}</Text></Pressable><Pressable disabled={busy} onPress={() => void signOut()}><Text style={ui.link}>Sign out</Text></Pressable></View></KeyboardAvoidingView>;
}
// Match ConvexProviderWithClerk's integration/template selection for HTTP media.
export function useBackendToken() {
  const { getToken, sessionClaims } = useAuth();
  return () => getToken(sessionClaims?.aud === 'convex' ? {} : { template: 'convex' });
}
