import { useClerk } from '@clerk/expo';
import { useMutation, usePaginatedQuery, useQuery } from 'convex/react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Modal, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBackendToken, useProfile } from '@/context/social-context';
import { api, errorMessage, type Id, type SocialProfile } from '@/lib/social';
import type { ProfileDraft } from '@/lib/profile-form';
import { sendUpload } from '@/lib/upload';
import { EditProfileScreen } from '../edit-profile-screen';
import { Avatar, PostMedia, useMediaSource } from './media';
import { FollowButton } from './post-card';
import { ConnectionStatus, LoadMore, ui } from './ui';
import { ProfileHeader, ProfileSummary, ProfileGalleryTabs, useProfileScale, type ProfilePanel } from '../profile-layout';
import { FeedIcon } from '../feed-icon';
import { SettingsScreen } from '../settings-screen';

export function OwnProfile() { const me = useProfile(); return <MemberProfile id={me._id} />; }
export function MemberRoute() { const { id } = useLocalSearchParams<{ id: Id<'profiles'> }>(); return <MemberProfile id={id} back />; }
function MemberProfile({ id, back = false }: { id: Id<'profiles'>; back?: boolean }) {
  const profile = useQuery(api.profiles.get, { id }); const posts = usePaginatedQuery(api.posts.list, { feed: 'profile', profileId: id }, { initialNumItems: 21 });
  const startChat = useMutation(api.messaging.start);
  const deleteAccount = useMutation(api.accounts.requestDeletion);
  const router = useRouter(); const { signOut } = useClerk(); const { s, v, width, insets } = useProfileScale();
  const [sheet, setSheet] = useState<'followers' | 'following' | 'edit' | 'settings' | null>(null);
  const [panel, setPanel] = useState<ProfilePanel>('posts');
  const gallery = panel === 'posts' ? posts.results : panel === 'videos' ? posts.results.filter(post => post.kind === 'video') : [];
  const hasPostFeed = panel === 'posts' || panel === 'videos';
  if (sheet === 'settings') return <SettingsScreen accountName={profile?.username ?? 'Your account'} onClose={() => setSheet(null)} onEdit={() => setSheet('edit')} onSaved={() => { setPanel('saved'); setSheet(null); }} onSignOut={signOut} onDelete={() => deleteAccount({})} />;
  return <View style={[ui.screen, { paddingTop: Math.max(40, insets.top - 9) }]}>
    <ProfileHeader back={back} onSettings={() => setSheet('settings')} /><ConnectionStatus />
    {!profile ? profile === undefined ? <ActivityIndicator color="#087EFF" /> : <View style={ui.center}><Text style={ui.title}>Profile unavailable</Text></View> : <>
      <FlatList data={gallery} numColumns={3} keyExtractor={item => item._id} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 100 }} columnWrapperStyle={{ gap: 4 * s, paddingHorizontal: 6 * s }} ListHeaderComponent={<>
        <ProfileSummary avatar={<Avatar profile={profile} size={108 * s} />} username={profile.username} name={profile.name} bio={profile.bio}
          onEdit={profile.isOwn ? () => setSheet('edit') : undefined} onDiscover={() => router.navigate('/explore')}
          stats={[
            { label: 'Posts', count: profile.postsCount, onPress: () => setPanel('posts') },
            { label: 'Followers', count: profile.followersCount, onPress: () => setSheet('followers') },
            { label: 'Following', count: profile.followingCount, onPress: () => setSheet('following') },
          ]}>
          {!profile.isOwn && <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 16 * v }}><FollowButton profile={profile} />{!profile.isDemo && <Pressable accessibilityRole="button" style={[ui.button, { flex: 1 }]} onPress={async () => { try { const chatId = await startChat({ profileId: profile._id }); router.push({ pathname: '/chat/[id]', params: { id: chatId } }); } catch (e) { Alert.alert('Could not open chat', errorMessage(e)); } }}><Text style={ui.buttonText}>Message</Text></Pressable>}</View>}
        </ProfileSummary>
        <ProfileGalleryTabs panel={panel} onChange={setPanel} />
        <View style={{ height: 4 * v }} />
      </>}
        renderItem={({ item }) => <Pressable accessibilityRole="button" accessibilityLabel={`Open post${item.caption ? `: ${item.caption}` : ''}`} onPress={() => router.push({ pathname: '/post/[id]', params: { id: item._id } })} style={{ width: (width - 20 * s) / 3, marginBottom: 4 * s, borderRadius: 7 * s, overflow: 'hidden' }}><View pointerEvents="none"><PostMedia post={item} thumbnail aspectRatio={1 / 0.925} /></View></Pressable>}
        onEndReached={() => { if (hasPostFeed && posts.status === 'CanLoadMore') posts.loadMore(21); }}
        ListEmptyComponent={(!hasPostFeed || posts.status !== 'LoadingFirstPage') ? <View style={{ alignItems: 'center', padding: 38, gap: 16 }}><FeedIcon name={panel === 'posts' ? 'grid' : panel === 'videos' ? 'video' : panel === 'saved' ? 'bookmark' : 'tagged'} size={36} color="#7E88A2" /><Text style={[ui.muted, { textAlign: 'center' }]}>{panel === 'saved' ? 'Saved posts gallery is not available yet.' : panel === 'tagged' ? 'Tagged posts are not available yet.' : panel === 'videos' ? 'No videos to show.' : 'No posts yet. Your moments will appear here.'}</Text></View> : null}
        ListFooterComponent={<>{hasPostFeed && <LoadMore status={posts.status} loadMore={posts.loadMore} />}{profile.isDemo && <Text style={[ui.muted, { padding: 20, fontSize: 11, textAlign: 'center' }]}>Fictional demo profile · This member cannot sign in or reply to messages.</Text>}</>} />
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
