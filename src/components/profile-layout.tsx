import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FeedIcon } from './feed-icon';

export type ProfilePanel = 'posts' | 'videos' | 'saved' | 'tagged';
export function useProfileScale() {
  const { width, height } = useWindowDimensions(); const insets = useSafeAreaInsets();
  return { s: width / 390, v: (height - insets.top - Math.min(insets.bottom, 34)) / 815, width, insets };
}
export function ProfileHeader({ onSettings, back = false }: { onSettings: () => void; back?: boolean }) {
  const { s, v } = useProfileScale(); const router = useRouter();
  return <View style={{ height: 52 * v, paddingHorizontal: 20 * s, gap: 6 * s, flexDirection: 'row', alignItems: 'center' }}>
    {back ? <Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={() => router.back()} style={{ width: 28 * s, minHeight: 44, justifyContent: 'center' }}><FeedIcon name="back" size={23 * s} /></Pressable> : <Image source={require('../../assets/images/logo.png')} accessibilityLabel="Codexgram logo" style={{ width: 28 * s, height: 28 * s }} />}
    <Text style={{ flex: 1, color: '#0D1529', fontSize: 21.5 * s, fontWeight: '700', letterSpacing: -0.8 }}>Codexgram</Text>
    <Pressable accessibilityRole="button" accessibilityLabel="Settings" onPress={onSettings} style={{ minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' }}><FeedIcon name="settings" size={23 * s} /></Pressable>
  </View>;
}
export function ProfileSummary({ avatar, username, name, bio, stats, onEdit, onDiscover, children }: { avatar: ReactNode; username: string; name: string; bio: string; stats: { label: string; count: number; onPress: () => void }[]; onEdit?: () => void; onDiscover?: () => void; children?: ReactNode }) {
  const { s, v } = useProfileScale();
  return <View style={{ paddingHorizontal: 20 * s }}>
    <View style={{ height: 120 * v, flexDirection: 'row', alignItems: 'center', gap: 20 * s }}>
      <View style={{ width: 108 * s, height: 108 * s }}>{avatar}{onEdit && <Pressable accessibilityRole="button" accessibilityLabel="Edit your profile photo" onPress={onEdit} style={{ position: 'absolute', right: 3 * s, bottom: s, width: 27 * s, height: 27 * s, borderRadius: 15 * s, backgroundColor: '#087EFF', borderWidth: 2, borderColor: 'white', alignItems: 'center', justifyContent: 'center' }}><FeedIcon name="plus" size={19 * s} color="white" /></Pressable>}</View>
      <View style={{ flex: 1, flexDirection: 'row', marginLeft: -6 * s, marginRight: -8 * s, transform: [{ translateX: 7 * s }] }}>{stats.map(stat => <Pressable key={stat.label} accessibilityRole="button" accessibilityLabel={`${stat.count} ${stat.label}`} onPress={stat.onPress} style={{ flex: 1, alignItems: 'center', gap: 4 * v, minHeight: 44 }}><Text style={{ fontSize: 19 * s, fontWeight: '700', color: '#0D1529', letterSpacing: -0.5 }}>{stat.count}</Text><Text style={{ fontSize: 13.5 * s, color: '#7E88A2', letterSpacing: -0.4 }}>{stat.label}</Text></Pressable>)}</View>
    </View>
    <Text style={{ marginTop: 4 * v, fontSize: 17 * s, lineHeight: 22 * v, fontWeight: '700', color: '#0D1529', letterSpacing: -0.5 }}>{username}</Text>
    {!!name && <Text style={{ fontSize: 14 * s, lineHeight: 21 * v, color: '#7E88A2' }}>{name}</Text>}
    {!!bio && <Text style={{ fontSize: 13.5 * s, lineHeight: 18 * v, color: '#0D1529', marginTop: 3 * v, letterSpacing: -0.15 }}>{bio}</Text>}
    {onEdit && <View style={{ flexDirection: 'row', gap: 8 * s, height: Math.max(44, 41 * v), marginTop: 16 * v }}>
      <Pressable accessibilityRole="button" onPress={onEdit} style={{ flex: 1, borderRadius: 14 * s, backgroundColor: '#F0F3F7', borderWidth: 1, borderColor: '#E6EAF1', alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: '#0D1529', fontSize: 14 * s, fontWeight: '600', letterSpacing: -0.2 }}>Edit Profile</Text></Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel="Discover people" onPress={onDiscover} style={{ width: Math.max(44, 40 * s), borderRadius: 14 * s, backgroundColor: '#F0F3F7', borderWidth: 1, borderColor: '#E6EAF1', alignItems: 'center', justifyContent: 'center' }}><FeedIcon name="person-plus" size={23 * s} /></Pressable>
    </View>}
    {children}
  </View>;
}
export function ProfileGalleryTabs({ panel, onChange }: { panel: ProfilePanel; onChange: (panel: ProfilePanel) => void }) {
  const { s, v } = useProfileScale();
  return <View style={{ flexDirection: 'row', marginTop: 17 * v, height: Math.max(44, 45 * v), paddingHorizontal: 6 * s }}>{([{ key: 'posts', icon: 'grid', label: 'Posts' }, { key: 'videos', icon: 'video', label: 'Videos' }, { key: 'saved', icon: 'bookmark', label: 'Saved' }, { key: 'tagged', icon: 'tagged', label: 'Tagged' }] as const).map(item => <Pressable key={item.key} accessibilityRole="tab" accessibilityLabel={item.label} accessibilityState={{ selected: panel === item.key }} onPress={() => onChange(item.key)} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><FeedIcon name={item.icon} size={21 * s} color={panel === item.key ? '#087EFF' : '#8690A7'} />{panel === item.key && <View style={{ position: 'absolute', bottom: 0, left: 7 * s, right: 7 * s, height: 2, borderRadius: 2, backgroundColor: '#087EFF' }} />}</Pressable>)}</View>;
}
