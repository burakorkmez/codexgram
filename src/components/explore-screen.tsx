import { useUser } from '@clerk/expo';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useRef, useState } from 'react';
import { Alert, FlatList, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Share, StyleSheet, Text, TextInput, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFeed } from '@/context/feed-context';
import { explorePosts, suggestedPeople, topics } from '@/lib/explore-data';
import { initialPosts, media, type Post } from '@/lib/feed-data';
import { FeedIcon } from './feed-icon';

type Sheet = 'people' | 'topics' | 'compose' | 'post' | null;
const blue = '#087EFF';
const ink = '#0D1529';
const muted = '#7F89A4';
export function ExploreTab() {
  const { user } = useUser();
  const { posts, setPosts } = useFeed();
  const [query, setQuery] = useState('');
  const [topic, setTopic] = useState('All');
  const [followed, setFollowed] = useState<string[]>([]);
  const [liked, setLiked] = useState<string[]>([]);
  const [sheet, setSheet] = useState<Sheet>(null);
  const [selected, setSelected] = useState<Post | null>(null);
  const [caption, setCaption] = useState('');
  const searchRef = useRef<TextInput>(null);
  const listRef = useRef<FlatList<Post>>(null);
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const s = width / 390;
  const v = (height - insets.top - Math.min(insets.bottom, 34)) / 815;
  const fs = (n: number) => n * s;
  const tileWidth = (width - fs(14) - fs(12)) / 3;
  const allPosts = [...posts.filter(post => post.id.startsWith('local-')), ...explorePosts];
  const needle = query.trim().toLowerCase().replace(/^#/, '');
  const filtered = allPosts.filter(post => (topic === 'All' || post.tags.includes(topic.toLowerCase())) && `${post.name} ${post.title} ${post.caption} ${post.tags.join(' ')}`.toLowerCase().includes(needle));
  const toggleFollow = (name: string) => setFollowed(current => current.includes(name) ? current.filter(value => value !== name) : [...current, name]);
  const toggleLike = (id: string) => setLiked(current => current.includes(id) ? current.filter(value => value !== id) : [...current, id]);
  const openPost = (post: Post) => { setSelected(post); setSheet('post'); };
  const chooseTopic = (value: string) => { setTopic(value); setSheet(null); listRef.current?.scrollToOffset({ offset: 0, animated: true }); };
  const followButton = (name: string) => <Pressable accessibilityRole="button" accessibilityLabel={`${followed.includes(name) ? 'Unfollow' : 'Follow'} ${name}`} onPress={() => toggleFollow(name)} style={[styles.follow, { height: 19 * v, borderRadius: fs(12), backgroundColor: followed.includes(name) ? '#E8F1FF' : blue }]}><Text style={{ fontSize: fs(8.6), color: followed.includes(name) ? blue : 'white', fontWeight: '500' }}>{followed.includes(name) ? 'Following' : 'Follow'}</Text></Pressable>;
  return (
    <View style={[styles.screen, { paddingTop: Math.max(40, insets.top - 14) }]}>
      <StatusBar style="dark" />
      <View style={{ height: 49 * v, paddingHorizontal: fs(14), flexDirection: 'row', alignItems: 'center', gap: fs(9) }}>
        <Image source={require('../../assets/images/codexgram-mark.png')} style={{ width: fs(35), height: fs(35) }} />
        <Text style={{ flex: 1, color: ink, fontSize: fs(23), fontWeight: '700', letterSpacing: -0.8 }}>Codexgram</Text>
        <Pressable accessibilityRole="button" accessibilityLabel="Search Explore" onPress={() => { listRef.current?.scrollToOffset({ offset: 0, animated: true }); searchRef.current?.focus(); }} style={[styles.headerButton, { width: fs(34), height: fs(34), borderRadius: fs(20) }]}><FeedIcon name="search" size={fs(22)} /></Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="Create a post" onPress={() => { setCaption(''); setSheet('compose'); }} style={[styles.headerButton, { width: fs(34), height: fs(34), borderRadius: fs(20), backgroundColor: '#EDF3FC' }]}><FeedIcon name="plus" size={fs(23)} color={blue} /></Pressable>
      </View>
      <FlatList ref={listRef} data={filtered} numColumns={3} keyExtractor={item => item.id} contentInsetAdjustmentBehavior="automatic" keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }} columnWrapperStyle={{ gap: fs(6), paddingHorizontal: fs(7) }} ListHeaderComponent={<>
        <View style={[styles.search, { marginHorizontal: fs(14), height: 34 * v, borderRadius: fs(22), marginTop: 2 * v, paddingHorizontal: fs(13), gap: fs(12) }]}><FeedIcon name="search" size={fs(19)} color={muted} /><TextInput ref={searchRef} accessibilityLabel="Search people, posts, or topics" placeholder="Search people, posts, or topics..." placeholderTextColor={muted} value={query} onChangeText={setQuery} autoCorrect={false} autoCapitalize="none" clearButtonMode="while-editing" style={{ flex: 1, height: '100%', fontSize: fs(12), color: ink }} /></View>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginHorizontal: fs(14), marginTop: 10 * v, marginBottom: 6 * v }}><Text accessibilityRole="header" style={{ fontSize: fs(13.5), fontWeight: '700', color: ink, letterSpacing: -0.4 }}>Suggested for you</Text><Pressable accessibilityRole="button" accessibilityLabel="See all suggested people" onPress={() => setSheet('people')} hitSlop={10} style={{ flexDirection: 'row', alignItems: 'center', gap: fs(7) }}><Text style={{ color: blue, fontSize: fs(10.5) }}>See all</Text><View style={{ transform: [{ rotate: '180deg' }] }}><FeedIcon name="back" size={fs(11)} /></View></Pressable></View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: fs(16) }}>
          {suggestedPeople.map(person => <View key={person.name} style={{ width: fs(57), alignItems: 'center' }}><Pressable accessibilityRole="button" accessibilityLabel={`View posts by ${person.name}`} onPress={() => { setQuery(person.name); setTopic('All'); }}><Image source={person.image} style={{ width: fs(58), height: fs(58), borderRadius: fs(29) }} /></Pressable><Text numberOfLines={1} style={{ fontSize: fs(10), color: ink, fontWeight: '600', marginTop: 2 * v, letterSpacing: -0.5 }}>{person.name}</Text><Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8} style={{ fontSize: fs(8.5), color: muted, marginTop: 1 * v, marginBottom: 4 * v, letterSpacing: -0.35 }}>{person.topic}</Text>{followButton(person.name)}</View>)}
        </View>
        <View style={{ flexDirection: 'row', gap: fs(5), marginHorizontal: fs(14), marginTop: 16 * v, marginBottom: 10 * v, height: 23 * v }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: fs(5) }} style={{ flex: 1 }}>{topics.map(value => <Pressable key={value} accessibilityRole="button" accessibilityState={{ selected: topic === value }} onPress={() => chooseTopic(value)} style={{ backgroundColor: topic === value ? blue : '#EEF1F6', borderRadius: fs(16), paddingHorizontal: fs(value === 'All' ? 14 : 9), alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: topic === value ? 'white' : '#54617D', fontSize: fs(9) }}>{value}</Text></Pressable>)}</ScrollView>
          <Pressable accessibilityRole="button" accessibilityLabel="Choose a topic" onPress={() => setSheet('topics')} style={{ width: fs(24), alignItems: 'center', justifyContent: 'center', borderRadius: fs(15), backgroundColor: '#EEF1F6' }}><View style={{ transform: [{ rotate: '-90deg' }] }}><FeedIcon name="back" size={fs(12)} color="#54617D" /></View></Pressable>
        </View>
      </>} renderItem={({ item, index }) => <View style={[styles.card, { width: tileWidth, borderRadius: fs(8), marginBottom: 7 * v }]}>
        <View style={{ height: (index < 3 ? 162 : 155) * v, borderRadius: fs(7), overflow: 'hidden' }}>
          <Pressable accessibilityRole="button" accessibilityLabel={`Open ${item.title}`} onPress={() => openPost(item)} style={StyleSheet.absoluteFill}><Image source={item.photo} style={StyleSheet.absoluteFill} contentFit="cover" /></Pressable>
          <LinearGradient pointerEvents="none" colors={['#00000022', 'transparent', 'transparent', '#00000055']} locations={[0, 0.28, 0.72, 1]} style={StyleSheet.absoluteFill} />
          <View style={{ position: 'absolute', top: fs(5), left: fs(5), right: fs(5), flexDirection: 'row', alignItems: 'center', gap: fs(4) }} pointerEvents="box-none"><Image source={item.avatar} style={{ width: fs(24), height: fs(24), borderRadius: fs(12), borderWidth: 1, borderColor: 'white' }} /><Text numberOfLines={1} style={{ flex: 1, color: 'white', fontSize: fs(8.2), fontWeight: '600', letterSpacing: -0.3 }}>{item.name}</Text><Pressable accessibilityRole="button" accessibilityLabel={`Options for ${item.title}`} onPress={() => openPost(item)} hitSlop={8}><Text style={{ color: 'white', fontSize: fs(11), fontWeight: '700' }}>•••</Text></Pressable></View>
          <Pressable accessibilityRole="button" accessibilityLabel={`${liked.includes(item.id) ? 'Unlike' : 'Like'} ${item.title}`} accessibilityState={{ selected: liked.includes(item.id) }} onPress={() => toggleLike(item.id)} style={{ position: 'absolute', bottom: fs(4), left: fs(7), flexDirection: 'row', alignItems: 'center', gap: fs(4), minHeight: fs(20) }}><FeedIcon name="heart" size={fs(15)} color={liked.includes(item.id) ? '#FF4565' : 'white'} filled={liked.includes(item.id)} /><Text style={{ color: 'white', fontSize: fs(10), fontWeight: '600' }}>{item.likes + (liked.includes(item.id) ? 1 : 0)}</Text></Pressable>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel={`Read ${item.title}`} onPress={() => openPost(item)} style={{ minHeight: 35 * v, paddingHorizontal: fs(8), paddingVertical: 5 * v }}><Text numberOfLines={2} style={{ fontSize: fs(11), lineHeight: 13 * v, color: ink, letterSpacing: -0.3 }}>{item.title}</Text></Pressable>
      </View>} ListEmptyComponent={<View style={{ padding: 36, alignItems: 'center', gap: 12 }}><Text style={styles.title}>No results found</Text><Text style={styles.body}>Try another name, topic, or keyword.</Text><Pressable onPress={() => { setQuery(''); setTopic('All'); }}><Text style={{ color: blue }}>Clear filters</Text></Pressable></View>} />
      <Modal visible={sheet !== null} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setSheet(null)}>
        <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.sheetHeader}><Text style={styles.title}>{sheet === 'people' ? 'Suggested for you' : sheet === 'topics' ? 'Explore topics' : sheet === 'compose' ? 'Create a demo post' : selected?.name}</Text><Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={() => setSheet(null)} style={{ padding: 10 }}><FeedIcon name="close" /></Pressable></View>
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 24, gap: 18 }}>
            {sheet === 'people' && <><Text style={styles.body}>Discover the fictional Codexgram demo community.</Text>{suggestedPeople.map(person => <View key={person.name} style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}><Image source={person.image} style={{ width: 52, height: 52, borderRadius: 26 }} /><View style={{ flex: 1 }}><Text style={styles.personName}>{person.name}</Text><Text style={styles.body}>{person.topic}</Text></View><View style={{ width: 85 }}>{followButton(person.name)}</View></View>)}</>}
            {sheet === 'topics' && topics.map(value => <Pressable key={value} accessibilityRole="button" onPress={() => chooseTopic(value)} style={[styles.topicRow, topic === value && { backgroundColor: '#E8F1FF' }]}><Text style={{ color: topic === value ? blue : ink, fontSize: 17 }}>{value}</Text></Pressable>)}
            {sheet === 'post' && selected && <><Image source={selected.photo} style={{ width: '100%', aspectRatio: 1, borderRadius: 18 }} /><Text style={styles.title}>{selected.title}</Text><Text style={styles.body}>{selected.caption}</Text><Text style={{ color: blue }}>{selected.tags.map(tag => `#${tag}`).join(' ')}</Text><Pressable style={styles.primary} onPress={() => toggleLike(selected.id)}><Text style={styles.primaryText}>{liked.includes(selected.id) ? 'Liked' : 'Like'} · {selected.likes + (liked.includes(selected.id) ? 1 : 0)}</Text></Pressable><Pressable style={styles.topicRow} onPress={() => { void Share.share({ message: `${selected.title} — ${selected.name} on Codexgram` }).catch(() => Alert.alert('Unable to share', 'Please try again.')); }}><Text style={{ color: blue, textAlign: 'center' }}>Share post</Text></Pressable></>}
            {sheet === 'compose' && <><Text style={styles.body}>Try a sample post in the local demo feed.</Text><Image source={media.lake} style={{ width: '100%', aspectRatio: 2, borderRadius: 16 }} /><TextInput accessibilityLabel="Post caption" value={caption} onChangeText={setCaption} placeholder="Write a caption…" multiline maxLength={500} style={styles.captionInput} /><Pressable accessibilityRole="button" disabled={!caption.trim()} style={[styles.primary, !caption.trim() && { opacity: 0.4 }]} onPress={() => { setPosts(current => [{ ...initialPosts[0], id: `local-${Date.now()}`, name: user?.username ?? 'you', title: caption.trim(), caption: 'Local demo post', tags: ['demo'], likes: 0, comments: 0, time: 'Just now', carousel: false }, ...current]); setQuery(''); setTopic('All'); setSheet(null); listRef.current?.scrollToOffset({ offset: 0, animated: true }); }}><Text style={styles.primaryText}>Add to preview</Text></Pressable></>}
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FCFDFE' }, headerButton: { alignItems: 'center', justifyContent: 'center', backgroundColor: '#F3F5F9' }, search: { backgroundColor: '#F0F2F7', flexDirection: 'row', alignItems: 'center' }, follow: { alignSelf: 'stretch', alignItems: 'center', justifyContent: 'center' }, card: { backgroundColor: '#FCFDFE', boxShadow: '0px 2px 4px #14233C0D' }, sheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 18, borderBottomWidth: 1, borderBottomColor: '#EEF1F6' }, title: { fontSize: 21, fontWeight: '700', color: ink }, body: { fontSize: 15, lineHeight: 22, color: muted }, personName: { fontSize: 16, fontWeight: '600', color: ink }, topicRow: { borderRadius: 16, padding: 16, backgroundColor: '#F0F2F7' }, primary: { borderRadius: 20, padding: 16, alignItems: 'center', backgroundColor: blue }, primaryText: { color: 'white', fontSize: 16, fontWeight: '600' }, captionInput: { minHeight: 100, borderRadius: 16, padding: 16, backgroundColor: '#F0F2F7', color: ink, fontSize: 16 },
});
