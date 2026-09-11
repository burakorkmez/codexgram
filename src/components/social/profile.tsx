import { useClerk } from '@clerk/expo';
import { useMutation, usePaginatedQuery, useQuery } from 'convex/react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Modal, Pressable, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBackendToken, useProfile } from '@/context/social-context';
import { api, errorMessage, type Id, type SocialProfile } from '@/lib/social';
import type { ProfileDraft } from '@/lib/profile-form';
import { sendUpload } from '@/lib/upload';
import { EditProfileScreen } from '../edit-profile-screen';
import { Avatar, PostMedia, useMediaSource } from './media';
import { FollowButton } from './post-card';
import { Header, ConnectionStatus, LoadMore, ui } from './ui';

export function OwnProfile() { const me = useProfile(); return <MemberProfile id={me._id} />; }
export function MemberRoute() { const { id } = useLocalSearchParams<{ id: Id<'profiles'> }>(); return <MemberProfile id={id} back />; }
function MemberProfile({ id, back = false }: { id: Id<'profiles'>; back?: boolean }) {
  const profile = useQuery(api.profiles.get, { id }); const posts = usePaginatedQuery(api.posts.list, { feed: 'profile', profileId: id }, { initialNumItems: 21 });
  const startChat = useMutation(api.messaging.start);
  const router = useRouter(); const { signOut } = useClerk(); const insets = useSafeAreaInsets(); const { width } = useWindowDimensions();
  const [sheet, setSheet] = useState<'followers' | 'following' | 'edit' | null>(null); const [signingOut, setSigningOut] = useState(false);
  return <View style={[ui.screen, { paddingTop: insets.top }]}><Header back={back} /><ConnectionStatus />
    {!profile ? profile === undefined ? <ActivityIndicator color="#087EFF" /> : <View style={ui.center}><Text style={ui.title}>Profile unavailable</Text></View> : <>
      <FlatList data={posts.results} numColumns={3} keyExtractor={item => item._id} columnWrapperStyle={{ gap: 3, paddingHorizontal: 8 }} ListHeaderComponent={<View style={{ padding: 20, gap: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 18 }}><Avatar profile={profile} size={92} /><View style={{ flex: 1 }}><Text style={ui.title}>{profile.username}</Text><Text style={[ui.text, { marginTop: 6 }]}>{profile.name}</Text></View></View>
        {profile.isDemo && <Text style={[ui.muted, { backgroundColor: '#EDF4FF', padding: 12, borderRadius: 12 }]}>Fictional demo profile · This member cannot sign in or reply to messages.</Text>}
        {!!profile.bio && <Text style={ui.text}>{profile.bio}</Text>}{!!profile.location && <Text style={ui.muted}>{profile.location}</Text>}{!!profile.website && <Text style={ui.link} selectable>{profile.website}</Text>}
        <View style={{ flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 8 }}><View style={{ alignItems: 'center' }}><Text style={ui.title}>{profile.postsCount}</Text><Text style={ui.muted}>Posts</Text></View>{(['followers', 'following'] as const).map(kind => <Pressable key={kind} accessibilityRole="button" onPress={() => setSheet(kind)} style={{ alignItems: 'center' }}><Text style={ui.title}>{kind === 'followers' ? profile.followersCount : profile.followingCount}</Text><Text style={ui.muted}>{kind === 'followers' ? 'Followers' : 'Following'}</Text></Pressable>)}</View>
        {profile.isOwn ? <View style={{ flexDirection: 'row', gap: 12 }}><Pressable style={[ui.button, { flex: 1 }]} onPress={() => setSheet('edit')}><Text style={ui.buttonText}>Edit profile</Text></Pressable><Pressable disabled={signingOut} onPress={() => { setSigningOut(true); void signOut().catch(() => { Alert.alert('Unable to sign out', 'Please try again.'); setSigningOut(false); }); }} style={[ui.button, { backgroundColor: '#EFF3F8' }]}><Text style={ui.link}>{signingOut ? 'Signing out…' : 'Sign out'}</Text></Pressable></View>
          : <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}><FollowButton profile={profile} />{!profile.isDemo && <Pressable style={[ui.button, { flex: 1 }]} onPress={async () => { try { const chatId = await startChat({ profileId: profile._id }); router.push({ pathname: '/chat/[id]', params: { id: chatId } }); } catch (e) { Alert.alert('Could not open chat', errorMessage(e)); } }}><Text style={ui.buttonText}>Message</Text></Pressable>}</View>}
      </View>}
        renderItem={({ item }) => <Pressable accessibilityRole="button" accessibilityLabel={`Open post${item.caption ? `: ${item.caption}` : ''}`} onPress={() => router.push({ pathname: '/post/[id]', params: { id: item._id } })} style={{ width: (width - 22) / 3, marginBottom: 4 }}><View pointerEvents="none"><PostMedia post={item} thumbnail /></View></Pressable>}
        onEndReached={() => { if (posts.status === 'CanLoadMore') posts.loadMore(21); }} ListEmptyComponent={posts.status !== 'LoadingFirstPage' ? <Text style={[ui.muted, { padding: 30, textAlign: 'center' }]}>No posts yet.</Text> : null} ListFooterComponent={<LoadMore status={posts.status} loadMore={posts.loadMore} />} />
      <Modal visible={sheet !== null} animationType="slide" presentationStyle="fullScreen" onRequestClose={() => { if (sheet !== 'edit') setSheet(null); }}>
        {sheet === 'edit' ? <LiveEdit profile={profile} close={() => setSheet(null)} /> : sheet && <Connections profileId={id} kind={sheet} close={() => setSheet(null)} />}
      </Modal>
    </>}
  </View>;
}
function Connections({ profileId, kind, close }: { profileId: Id<'profiles'>; kind: 'followers' | 'following'; close: () => void }) {
  const result = usePaginatedQuery(api.social.connections, { profileId, kind }, { initialNumItems: 20 }); const router = useRouter(); const insets = useSafeAreaInsets();
  return <View style={[ui.screen, { paddingTop: insets.top }]}><View style={ui.header}><Text style={[ui.title, { flex: 1 }]}>{kind === 'followers' ? 'Followers' : 'Following'}</Text><Pressable onPress={close} style={{ padding: 10 }}><Text style={ui.link}>Done</Text></Pressable></View><FlatList data={result.results} keyExtractor={item => item._id} renderItem={({ item }) => <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 }}><Pressable onPress={() => { close(); router.push({ pathname: '/member/[id]', params: { id: item._id } }); }}><Avatar profile={item} size={48} /></Pressable><Pressable style={{ flex: 1 }} onPress={() => { close(); router.push({ pathname: '/member/[id]', params: { id: item._id } }); }}><Text style={ui.text}>{item.username}</Text><Text style={ui.muted}>{item.name}</Text></Pressable><FollowButton profile={item} /></View>} ListEmptyComponent={result.status !== 'LoadingFirstPage' ? <Text style={[ui.muted, { padding: 24 }]}>No {kind} yet.</Text> : null} ListFooterComponent={<LoadMore status={result.status} loadMore={result.loadMore} />} /></View>;
}
function LiveEdit({ profile, close }: { profile: SocialProfile; close: () => void }) {
  const update = useMutation(api.profiles.update); const begin = useMutation(api.uploads.begin); const setAvatar = useMutation(api.uploads.setAvatar); const cancel = useMutation(api.uploads.cancel); const getToken = useBackendToken();
  const { source } = useMediaSource(profile._id, 'avatar', profile.hasAvatar, profile.avatarVersion); const [saving, setSaving] = useState(false);
  const initial: ProfileDraft = { username: profile.username, name: profile.name, bio: profile.bio, website: profile.website, location: profile.location, photoUri: '' };
  async function save(draft: ProfileDraft) {
    if (saving) return; setSaving(true); let uploadId: Id<'uploads'> | null = null;
    try {
      if (draft.photoUri) {
        const response = await fetch(draft.photoUri); const raw = await response.blob();
        if (!raw.size || raw.size > 5 * 1024 * 1024) throw new Error('Choose a photo under 5 MB.');
        const blob = raw.slice(0, raw.size, raw.type || (/\.png$/i.test(draft.photoUri) ? 'image/png' : 'image/jpeg'));
        const token = await getToken(); if (!token) throw new Error('Session expired.');
        uploadId = await begin({ purpose: 'avatar', kind: 'image', width: 1, height: 1 });
        await sendUpload(uploadId, blob, token, () => {});
      }
      await update({ username: draft.username, name: draft.name, bio: draft.bio, website: draft.website, location: draft.location });
      if (uploadId) { await setAvatar({ uploadId }); uploadId = null; }
      close();
    } catch (e) { Alert.alert('Could not save profile', errorMessage(e)); }
    finally { if (uploadId) void cancel({ id: uploadId }).catch(() => {}); setSaving(false); }
  }
  return <View style={{ flex: 1 }}><EditProfileScreen initial={initial} avatar={source ?? (profile.avatarUrl ? { uri: profile.avatarUrl } : require('../../../assets/images/logo.png'))} onSave={draft => void save(draft)} onClose={() => { if (!saving) close(); }} />{saving && <View style={{ position: 'absolute', inset: 0, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFFDD', gap: 12 }}><ActivityIndicator color="#087EFF" /><Text style={ui.text}>Saving your profile…</Text></View>}</View>;
}
