import { StatusBar } from 'expo-status-bar';
import { errorMessage } from '@/lib/social';
import { useRef, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FeedIcon, type IconName } from './feed-icon';

const ink = '#080E3B';
type SettingsProps = {
  onClose: () => void;
  onEdit: () => void;
  onSaved: () => void;
  onDelete?: () => Promise<unknown>;
  onSignOut: () => Promise<void>;
  accountName: string;
  preview?: boolean;
};
type Row = { label: string; icon: IconName; action: () => void; detail?: string };

export function SettingsScreen({ onClose, onEdit, onSaved, onDelete, onSignOut, accountName, preview = false }: SettingsProps) {
  const { width, height } = useWindowDimensions(); const insets = useSafeAreaInsets();
  const s = width / 390; const v = (height - insets.top - insets.bottom) / 810;
  const [signingOut, setSigningOut] = useState(false);
  const [deleting, setDeleting] = useState(false); const deleteBusy = useRef(false);
  const confirmDeletion = () => {
    if (preview || !onDelete) { Alert.alert('Preview account', 'Account deletion is only available in your live account settings.'); return; }
    Alert.alert('Delete your account?', 'This permanently deletes your sign-in account, profile, posts, photos, videos, stories, comments, likes, saved posts, follows, and your conversations for both participants. This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete Account', style: 'destructive', onPress: async () => {
        if (deleteBusy.current) return; deleteBusy.current = true; setDeleting(true);
        try { await onDelete(); } catch (error) { Alert.alert('Could not delete account', errorMessage(error)); }
        finally { deleteBusy.current = false; setDeleting(false); }
      } },
    ]);
  };
  const unavailable = (title: string, message: string) => () => Alert.alert(title, message);
  const account: Row[] = [
    { label: 'Edit profile', icon: 'profile', action: onEdit },
    { label: 'Account', icon: 'settings', action: unavailable('Account', `Signed in as ${accountName}.`) },
    { label: 'Notifications', icon: 'bell', action: unavailable('Notifications', 'Notification preferences are not available yet.') },
    { label: 'Privacy', icon: 'lock', action: unavailable('Privacy', 'Privacy controls are not available yet.') },
    { label: 'Blocked users', icon: 'blocked', action: unavailable('Blocked users', 'Blocking controls are not available yet.') },
    { label: 'Saved posts', icon: 'bookmark', action: onSaved },
  ];
  const support: Row[] = [
    { label: 'Help & support', icon: 'help', action: unavailable('Help & support', 'A support contact has not been configured yet.') },
    { label: 'Report a problem', icon: 'support', action: unavailable('Report a problem', 'Problem reporting is not available yet.') },
    { label: 'Privacy Policy', icon: 'document', action: unavailable('Privacy Policy', 'A privacy policy has not been published yet.') },
    { label: 'Terms of Service', icon: 'document', action: unavailable('Terms of Service', 'Terms of service have not been published yet.') },
    { label: 'About', icon: 'info', detail: 'Version 1.0 (2026)', action: unavailable('Codexgram', 'Version 1.0 (2026)') },
  ];
  const group = (rows: Row[]) => <View style={[styles.card, { borderRadius: 14 * s }]}>{rows.map((row, index) => <Pressable key={row.label} accessibilityRole="button" accessibilityLabel={row.detail ? `${row.label}, ${row.detail}` : row.label} onPress={row.action} style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', minHeight: Math.max(44, 40.5 * v), backgroundColor: pressed ? '#F0F5FF' : 'transparent' })}>
    <View style={{ width: 64 * s, alignItems: 'center' }}><FeedIcon name={row.icon} size={21 * s} color={ink} /></View>
    <View style={{ flex: 1, minHeight: Math.max(44, 40.5 * v), flexDirection: 'row', alignItems: 'center', paddingRight: 17 * s, borderBottomWidth: index < rows.length - 1 ? StyleSheet.hairlineWidth : 0, borderBottomColor: '#E3E9F3', gap: 8 * s }}>
      <Text style={{ flex: 1, color: ink, fontSize: 14.5 * s, letterSpacing: -0.35 * s }}>{row.label}</Text>
      {row.detail ? <Text style={{ color: '#7B89AD', fontSize: 13.5 * s, letterSpacing: -0.4 * s }}>{row.detail}</Text> : <FeedIcon name="chevron-right" size={14 * s} color="#7B89AD" />}
    </View>
  </Pressable>)}</View>;
  return <View style={[styles.screen, { paddingTop: insets.top }]}>
    <StatusBar style="dark" />
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 14 * s, paddingBottom: insets.bottom + 100 }}>
      <Pressable accessibilityRole="button" accessibilityLabel="Back to profile" onPress={onClose} style={{ minHeight: 44, alignSelf: 'flex-start', paddingHorizontal: 8 * s, justifyContent: 'center' }}><FeedIcon name="back" size={24 * s} color={ink} /></Pressable>
      <Text accessibilityRole="header" style={{ color: ink, fontSize: 34 * s, lineHeight: 43 * s, fontWeight: '700', letterSpacing: -1.2 * s, marginHorizontal: 8 * s, marginBottom: 11 * v }}>Settings</Text>
      <Text accessibilityRole="header" style={[styles.section, { fontSize: 16 * s, marginHorizontal: 8 * s, marginBottom: 9 * v }]}>Account</Text>
      {group(account)}
      <Text accessibilityRole="header" style={[styles.section, { fontSize: 16 * s, marginHorizontal: 8 * s, marginTop: 17 * v, marginBottom: 8 * v }]}>Support &amp; Legal</Text>
      {group(support)}
      <Pressable accessibilityRole="button" disabled={signingOut || deleting} onPress={async () => {
        if (preview) { Alert.alert('Preview account', 'Sign out is available from your live profile.'); return; }
        setSigningOut(true); try { await onSignOut(); } catch { Alert.alert('Unable to sign out', 'Please try again.'); } finally { setSigningOut(false); }
      }} style={({ pressed }) => [styles.action, { height: Math.max(44, 46 * v), marginTop: 16 * v, borderRadius: 16 * s, backgroundColor: '#E6F0FF', opacity: pressed || signingOut ? 0.6 : 1, gap: 17 * s }]}><FeedIcon name="sign-out" size={24 * s} color="#007AFF" /><Text style={{ color: '#007AFF', fontSize: 16 * s, fontWeight: '500', letterSpacing: -0.4 * s }}>{signingOut ? 'Signing out…' : 'Sign Out'}</Text></Pressable>
      <Pressable accessibilityRole="button" disabled={deleting || signingOut} accessibilityState={{ disabled: deleting || signingOut, busy: deleting }} onPress={confirmDeletion} style={({ pressed }) => [styles.action, { height: Math.max(44, 44 * v), marginTop: 8 * v, borderRadius: 16 * s, backgroundColor: '#FDEAEF', opacity: pressed || deleting ? 0.6 : 1, gap: 18 * s }]}><FeedIcon name="trash" size={24 * s} color="#FF0000" /><Text style={{ color: '#FF0000', fontSize: 16 * s, fontWeight: '500', letterSpacing: -0.4 * s }}>{deleting ? 'Deleting account…' : 'Delete Account'}</Text></Pressable>
    </ScrollView>
  </View>;
}
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FCFDFE' },
  section: { color: ink, fontWeight: '600', letterSpacing: -0.45 },
  card: { borderWidth: StyleSheet.hairlineWidth, borderColor: '#E0E8F5', backgroundColor: '#FFFFFF80', overflow: 'hidden' },
  action: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
});
