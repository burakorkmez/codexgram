import { Image, type ImageSource } from 'expo-image';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, AppState, Pressable, Text, View } from 'react-native';
import { useBackendToken } from '@/context/social-context';
import { siteUrl, type SocialProfile, type SocialPost } from '@/lib/social';
import { ui } from './ui';

export function useMediaSource(id: string, kind: 'post' | 'avatar', enabled = true, revision = 0) {
  const getToken = useBackendToken(); const [source, setSource] = useState<{ uri: string; headers: Record<string, string> } | null>(null);
  const [error, setError] = useState(false); const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (!enabled) return;
    let active = true;
    setSource(null); setError(false);
    void getToken().then(token => {
      if (!active) return;
      if (!token) { setError(true); return; }
      setSource({ uri: `${siteUrl}/media?kind=${kind}&id=${encodeURIComponent(id)}&v=${revision}`, headers: { Authorization: `Bearer ${token}` } });
    }).catch(() => { if (active) setError(true); });
    return () => { active = false; };
    // getToken is intentionally unstable in Clerk Expo. Refresh when the resource changes or on retry.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, kind, enabled, revision, attempt]);
  return { source, error, retry: () => setAttempt(n => n + 1) };
}
export function Avatar({ profile, size = 40 }: { profile: SocialProfile; size?: number }) {
  const { source } = useMediaSource(profile._id, 'avatar', profile.hasAvatar, profile.avatarVersion);
  const photo: ImageSource | undefined = profile.hasAvatar ? source ?? undefined : profile.avatarUrl ? { uri: profile.avatarUrl } : undefined;
  return photo ? <Image source={photo} cachePolicy="none" style={{ width: size, height: size, borderRadius: size / 2 }} /> : <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: '#E8F1FF', alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: '#087EFF', fontWeight: '700', fontSize: size * 0.4 }}>{profile.name[0]?.toUpperCase()}</Text></View>;
}
export function PostMedia({ post, visible = false, thumbnail = false }: { post: SocialPost; visible?: boolean; thumbnail?: boolean }) {
  const { source, error, retry } = useMediaSource(post._id, 'post'); const [failed, setFailed] = useState(false);
  const aspectRatio = thumbnail ? 1 : Math.max(0.65, Math.min(1.8, post.width / post.height));
  return <View style={{ width: '100%', aspectRatio, backgroundColor: '#EEF2F8', borderRadius: thumbnail ? 4 : 14, overflow: 'hidden', justifyContent: 'center' }}>
    {error || failed ? <Pressable onPress={() => { setFailed(false); retry(); }} style={{ padding: 12 }}><Text style={ui.muted}>Media unavailable. Tap to retry.</Text></Pressable>
      : !source ? <ActivityIndicator color="#087EFF" />
      : post.kind === 'video' ? <InlineVideo source={source} active={visible} thumbnail={thumbnail} onError={() => setFailed(true)} />
      : <Image source={source} cachePolicy="none" style={{ width: '100%', height: '100%' }} contentFit="cover" onError={() => setFailed(true)} accessibilityLabel={post.caption || 'Post image'} />}
  </View>;
}
function InlineVideo({ source, active, thumbnail, onError }: { source: { uri: string; headers: Record<string, string> }; active: boolean; thumbnail: boolean; onError: () => void }) {
  const [focused, setFocused] = useState(true);
  useFocusEffect(useCallback(() => { setFocused(true); return () => setFocused(false); }, []));
  const player = useVideoPlayer(source, player => { player.loop = false; });
  useEffect(() => { if (!active || !focused) player.pause(); }, [active, focused, player]);
  useEffect(() => {
    const app = AppState.addEventListener('change', state => { if (state !== 'active') player.pause(); });
    const listener = player.addListener('statusChange', event => { if (event.status === 'error') onError(); });
    return () => { app.remove(); listener.remove(); };
  }, [player, onError]);
  return <View style={{ flex: 1 }} pointerEvents={thumbnail || !active ? 'none' : 'auto'}><VideoView player={player} style={{ flex: 1 }} contentFit="cover" nativeControls={!thumbnail && active} fullscreenOptions={{ enable: false }} />{thumbnail && <Text style={{ position: 'absolute', right: 8, bottom: 8, color: 'white', backgroundColor: '#0008', padding: 4, borderRadius: 6 }}>▶ Video</Text>}</View>;
}
