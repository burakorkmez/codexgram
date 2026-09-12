import { useClerk, useUser } from '@clerk/expo';
import { Image, type ImageSource } from 'expo-image';
import { usePathname } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFeed } from '@/context/feed-context';
import { stories } from '@/lib/feed-data';
import { FeedIcon } from './feed-icon';
import { ProfileHeader, ProfileSummary, ProfileGalleryTabs } from './profile-layout';
import { SettingsScreen } from './settings-screen';
import { EditProfileScreen } from './edit-profile-screen';
import type { ProfileDraft } from '@/lib/profile-form';

const gallery = [
  require('../../assets/images/profile/photo-1.png'), require('../../assets/images/profile/photo-2.png'), require('../../assets/images/profile/photo-3.png'),
  require('../../assets/images/profile/photo-4.png'), require('../../assets/images/profile/photo-5.png'), require('../../assets/images/profile/photo-6.png'),
  require('../../assets/images/profile/photo-7.png'), require('../../assets/images/profile/photo-8.png'), require('../../assets/images/profile/photo-9.png'),
];
const captions = ['Mountain mornings', 'Beach days', 'Sunset palms', 'City lights', 'The scenic route', 'Coffee time', 'Along the coast', 'Out exploring', 'A brighter tomorrow'];
type Panel = 'posts' | 'videos' | 'saved' | 'tagged';
type Sheet = 'edit' | 'menu' | 'followers' | 'following' | 'discover' | 'photo' | 'avatar' | null;
const ink = '#0D1529';
const muted = '#7E88A2';

export function ProfileTab() {
  const { user } = useUser();
  const { signOut } = useClerk();
  const { posts, saved } = useFeed();
  const isPreview = usePathname().startsWith('/design-preview');
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const s = width / 390;
  const v = (height - insets.top - Math.min(insets.bottom, 34)) / 815;
  const [panel, setPanel] = useState<Panel>('posts');
  const [sheet, setSheet] = useState<Sheet>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<{ source: ImageSource; caption: string } | null>(null);
  const [edited, setEdited] = useState<ProfileDraft | null>(null);
  const [followed, setFollowed] = useState<string[]>([]);
  const username = edited?.username ?? (isPreview ? 'alex.rivera' : user?.username ?? user?.primaryEmailAddress?.emailAddress?.split('@')[0] ?? 'Your profile');
  const name = edited?.name ?? (isPreview ? 'Alex Rivera' : user?.fullName ?? '');
  const bio = edited?.bio ?? (isPreview ? 'Product designer, coffee lover.\nExploring what’s next. ☕ 🌎' : 'Exploring what’s next.');
  const avatar = edited?.photoUri ? { uri: edited.photoUri } : !isPreview && user?.imageUrl ? { uri: user.imageUrl } : require('../../assets/images/profile/avatar.png');
  const images = panel === 'posts' ? (isPreview ? gallery.map((source, i) => ({ source, caption: captions[i] })) : posts.filter(post => post.id.startsWith('local-')).map(post => ({ source: post.photo, caption: post.title }))) : panel === 'saved' ? posts.filter(post => saved.includes(post.id)).map(post => ({ source: post.photo, caption: post.title })) : [];
  const fs = (n: number) => n * s;
  const openEditor = () => setSheet('edit');
  const tileWidth = (width - fs(12) - fs(8)) / 3;

  if (sheet === 'menu') return <SettingsScreen preview={isPreview} accountName={username} onClose={() => setSheet(null)} onEdit={openEditor} onSaved={() => { setPanel('saved'); setSheet(null); }} onSignOut={signOut} />;

  return (
    <View collapsable={false} style={[styles.screen, { paddingTop: Math.max(40, insets.top - 9) }]}>
      <StatusBar style="dark" />
      <ProfileHeader onSettings={() => setSheet('menu')} />
      <ScrollView contentInsetAdjustmentBehavior="automatic" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}>
        <ProfileSummary avatar={<Pressable accessibilityRole="button" accessibilityLabel="View profile photo" onPress={() => setSheet('avatar')}><Image source={avatar} style={{ width: fs(108), height: fs(108), borderRadius: fs(54) }} /></Pressable>} username={username} name={name} bio={bio} onEdit={openEditor} onDiscover={() => setSheet('discover')} stats={[
          { label: 'Posts', count: isPreview ? 24 : posts.filter(post => post.id.startsWith('local-')).length, onPress: () => setPanel('posts') },
          { label: 'Followers', count: isPreview ? 186 : 0, onPress: () => setSheet('followers') },
          { label: 'Following', count: (isPreview ? 142 : 0) + followed.length, onPress: () => setSheet('following') },
        ]} />
        <ProfileGalleryTabs panel={panel} onChange={setPanel} />
        {images.length ? <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: fs(4), paddingHorizontal: fs(6), paddingTop: 4 * v }}>{images.map((photo, i) => <Pressable key={`${panel}-${i}`} accessibilityRole="button" accessibilityLabel={photo.caption} onPress={() => { setSelectedPhoto(photo); setSheet('photo'); }}><Image source={photo.source} contentFit="fill" style={{ width: tileWidth, height: tileWidth * 0.925, borderRadius: fs(7) }} /></Pressable>)}</View> : <View style={styles.empty}><FeedIcon name={panel === 'saved' ? 'bookmark' : panel === 'videos' ? 'video' : panel === 'tagged' ? 'tagged' : 'grid'} size={36} color={muted} /><Text style={styles.sheetTitle}>{panel === 'saved' ? 'No saved posts yet' : panel === 'tagged' ? 'No tagged posts yet' : panel === 'videos' ? 'No videos yet' : 'No posts yet'}</Text><Text style={styles.sheetBody}>{panel === 'saved' ? 'Save a post from Home to find it here.' : 'Your moments will appear here.'}</Text></View>}
        {isPreview && <Text style={styles.demo}>Fictional demo profile · sample photos</Text>}
      </ScrollView>
      <Modal visible={sheet === 'edit'} animationType="slide" presentationStyle="fullScreen" onRequestClose={() => Alert.alert('Close editor?', 'Unsaved changes will be lost.', [{ text: 'Keep editing', style: 'cancel' }, { text: 'Discard', style: 'destructive', onPress: () => setSheet(null) }])}>
        {sheet === 'edit' && <EditProfileScreen initial={{ username, name, bio, website: edited?.website ?? (isPreview ? 'https://alexrivera.co' : ''), location: edited?.location ?? (isPreview ? 'San Francisco, CA' : ''), photoUri: edited?.photoUri }} avatar={isPreview && !edited?.photoUri ? require('../../assets/images/profile/edit-avatar.png') : avatar} onClose={() => setSheet(null)} onSave={profile => { setEdited(profile); setSheet(null); }} />}
      </Modal>
      <Modal visible={sheet !== null && sheet !== 'edit'} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setSheet(null)}>
        <KeyboardAvoidingView style={styles.sheet} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.sheetHeader}><Text style={styles.sheetTitle}>{sheet === 'edit' ? 'Edit Profile' : sheet === 'discover' ? 'Discover people' : sheet === 'followers' ? 'Followers' : sheet === 'following' ? 'Following' : sheet === 'photo' ? selectedPhoto?.caption : sheet === 'avatar' ? username : 'Profile options'}</Text><Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={() => setSheet(null)} style={styles.headerButton}><FeedIcon name="close" /></Pressable></View>
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 24, gap: 18 }}>
            {(sheet === 'followers' || sheet === 'following' || sheet === 'discover') && <><Text style={styles.sheetBody}>Fictional profiles from the demo community.</Text>{stories.filter(person => sheet !== 'following' || isPreview || followed.includes(person.name)).map(person => <View key={person.name} style={styles.person}><Image source={person.image} style={{ width: 48, height: 48, borderRadius: 24 }} /><Text style={{ flex: 1, color: ink, fontWeight: '600' }}>{person.name}</Text><Pressable accessibilityRole="button" accessibilityLabel={`${followed.includes(person.name) ? 'Unfollow' : 'Follow'} ${person.name}`} style={styles.followButton} onPress={() => setFollowed(current => current.includes(person.name) ? current.filter(name => name !== person.name) : [...current, person.name])}><Text style={{ color: '#087EFF', fontWeight: '600' }}>{followed.includes(person.name) ? 'Following' : 'Follow'}</Text></Pressable></View>)}</>}
            {sheet === 'avatar' && <Image source={avatar} style={{ width: '100%', aspectRatio: 1, borderRadius: 24 }} />}
            {sheet === 'photo' && selectedPhoto && <><Image source={selectedPhoto.source} contentFit="contain" style={{ width: '100%', aspectRatio: 1, borderRadius: 18 }} /><Text style={styles.sheetBody}>{isPreview ? 'A moment from Alex’s demo gallery.' : selectedPhoto.caption}</Text></>}

          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FCFDFE' }, header: { flexDirection: 'row', alignItems: 'center' }, headerButton: { minWidth: 40, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  overview: { flexDirection: 'row', alignItems: 'center' }, addPhoto: { position: 'absolute', backgroundColor: '#087EFF', borderWidth: 2, borderColor: 'white', alignItems: 'center', justifyContent: 'center' }, stats: { flex: 1, flexDirection: 'row', justifyContent: 'space-between' },
  editButton: { backgroundColor: '#F0F3F7', borderWidth: 1, borderColor: '#E6EAF1', alignItems: 'center', justifyContent: 'center' }, galleryTab: { flex: 1, alignItems: 'center', justifyContent: 'center' }, indicator: { position: 'absolute', bottom: 0, height: 2, borderRadius: 2, backgroundColor: '#087EFF' },
  empty: { alignItems: 'center', gap: 16, padding: 38 }, demo: { padding: 20, textAlign: 'center', color: muted, fontSize: 11 },
  sheet: { flex: 1, backgroundColor: '#FCFDFE' }, sheetHeader: { padding: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: '#EDF0F5' }, sheetTitle: { color: ink, fontSize: 21, fontWeight: '700' }, sheetBody: { color: muted, fontSize: 15, lineHeight: 23 }, fieldLabel: { color: ink, fontSize: 15, fontWeight: '600' }, input: { borderWidth: 1, borderColor: '#DCE2EC', borderRadius: 14, padding: 15, color: ink, fontSize: 16 }, primary: { backgroundColor: '#087EFF', padding: 16, borderRadius: 20, alignItems: 'center' }, primaryText: { color: 'white', fontWeight: '600', fontSize: 16 }, person: { flexDirection: 'row', alignItems: 'center', gap: 12 }, followButton: { backgroundColor: '#EAF2FF', paddingHorizontal: 14, paddingVertical: 9, borderRadius: 16 },
});
