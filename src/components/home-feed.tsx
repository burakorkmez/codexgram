import { Image, type ImageSource } from 'expo-image';
import { media, stories, initialPosts, type Post } from '@/lib/feed-data';
import { useFeed } from '@/context/feed-context';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Alert, FlatList, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Share, StyleSheet, Text, TextInput, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FeedIcon, type IconName } from './feed-icon';

const colors = { ink: '#0D1529', muted: '#7C879F', blue: '#087EFF', background: '#FAFBFD', border: '#EEF1F5' };
type Sheet = { kind: 'story' | 'comments' | 'menu' | 'search' | 'compose'; post?: Post; name?: string; image?: ImageSource } | null;
type Props = { userName?: string; onExplore: () => void };

export function HomeFeed({ userName, onExplore }: Props) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const s = width / 390;
  const storyWidth = (width - 26 * s) / 5;
  const v = Math.max(0.85, (height - insets.top - Math.min(insets.bottom, 34)) / 850);
  const { posts, setPosts, unliked, setUnliked, saved, setSaved, comments, setComments } = useFeed();
  const [sheet, setSheet] = useState<Sheet>(null);
  const [input, setInput] = useState('');
  const [page, setPage] = useState<Record<string, number>>({});
  const fs = (n: number) => n * s;
  const open = (next: Sheet) => { setInput(''); setSheet(next); };
  const toggle = (values: string[], id: string) => values.includes(id) ? values.filter(value => value !== id) : [...values, id];
  const roundButton = (icon: IconName, label: string, onPress: () => void, blue = false) => (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={({ pressed }) => [styles.roundButton, { width: fs(38), height: fs(38), backgroundColor: blue ? '#E8F1FF' : '#F4F6FA', opacity: pressed ? 0.6 : 1 }]}>
      <FeedIcon name={icon} size={fs(22)} color={blue ? colors.blue : colors.ink} />
    </Pressable>
  );
  const action = (icon: IconName, label: string, onPress: () => void, count?: number, active = false) => (
    <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ selected: active }} hitSlop={7} onPress={onPress} style={[styles.action, { minHeight: fs(29), gap: fs(6), marginRight: fs(20) }]}>
      <FeedIcon name={icon} size={fs(18)} color={icon === 'heart' && active ? '#FF3659' : colors.ink} filled={active && (icon === 'heart' || icon === 'bookmark')} />
      {count !== undefined && <Text style={{ color: colors.ink, fontSize: fs(11) }}>{count}</Text>}
    </Pressable>
  );

  function renderPost({ item: post }: { item: Post }) {
    const liked = !unliked.includes(post.id);
    const isSaved = saved.includes(post.id);
    const cardWidth = width - fs(26);
    return (
      <View style={[styles.card, { marginHorizontal: fs(8), marginBottom: 8 * v, borderRadius: fs(16), paddingHorizontal: fs(5), paddingBottom: 4 * v }]}>
        <View style={[styles.postHeader, { height: (post.compact ? 53 : 49) * v, paddingHorizontal: fs(4) }]}>
          <Pressable accessibilityLabel={`View ${post.name}, fictional demo profile`} onPress={() => open({ kind: 'story', name: post.name, image: post.avatar })}>
            <Image source={post.avatar} style={{ width: fs(39), height: fs(39), borderRadius: fs(22) }} />
          </Pressable>
          <View style={{ flex: 1, marginLeft: fs(10), gap: 3 * v }}>
            <Text style={{ color: colors.ink, fontSize: fs(13), fontWeight: '700', letterSpacing: -0.35 }}>{post.name}</Text>
            <Text style={{ color: colors.muted, fontSize: fs(10), letterSpacing: -0.1 }}>{post.time} · {post.location}</Text>
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel={`More options for ${post.name}'s post`} hitSlop={10} onPress={() => open({ kind: 'menu', post })} style={{ padding: fs(6) }}><Text style={{ fontSize: fs(15), letterSpacing: 1.4, color: '#61708B' }}>•••</Text></Pressable>
        </View>
        <View style={{ borderRadius: fs(12), overflow: 'hidden', height: (post.compact ? 138 : 180) * v }}>
          {post.carousel ? <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false} onMomentumScrollEnd={event => setPage(current => ({ ...current, [post.id]: Math.round(event.nativeEvent.contentOffset.x / cardWidth) }))}>
            {[media.lake, media.casey, media.lake].map((photo, index) => <Image key={index} source={photo} contentFit="fill" style={{ width: cardWidth, height: 180 * v }} accessibilityLabel={`Demo mountain landscape ${index + 1}`} />)}
          </ScrollView> : <Image source={post.photo} contentFit="fill" style={StyleSheet.absoluteFill} accessibilityLabel={post.title} />}
          {post.carousel && <View pointerEvents="none" style={[styles.pageBadge, { top: 8 * v, right: fs(8), width: fs(34), height: 23 * v, alignItems: 'center', justifyContent: 'center' }]}><Text style={{ color: 'white', fontSize: fs(10) }}>{(page[post.id] ?? 0) + 1}/3</Text></View>}
        </View>
        <View style={{ paddingHorizontal: fs(5), paddingTop: 6 * v }}>
          <Text numberOfLines={1} style={{ color: colors.ink, fontSize: fs(11.8), fontWeight: '500', letterSpacing: -0.25, lineHeight: 16 * v }}>{post.title}</Text>
          <Text numberOfLines={1} style={{ color: colors.muted, fontSize: fs(10.5), lineHeight: 15 * v }}>{post.caption}</Text>
          <View style={{ flexDirection: 'row', gap: fs(5), paddingVertical: 4 * v }}>
            {post.tags.map(tag => <Pressable key={tag} accessibilityRole="button" accessibilityLabel={`Search ${tag}`} onPress={() => { open({ kind: 'search' }); setInput(tag); }} style={{ backgroundColor: '#EDF4FF', borderRadius: fs(12), paddingHorizontal: fs(8), paddingVertical: 3 * v }}><Text style={{ fontSize: fs(9), color: '#315EAA' }}>#{tag}</Text></Pressable>)}
          </View>
          <View style={styles.actions}>
            {action('heart', `${liked ? 'Unlike' : 'Like'} ${post.name}'s post`, () => setUnliked(toggle(unliked, post.id)), post.likes - (liked ? 0 : 1), liked)}
            {action('comment', `Comments on ${post.name}'s post`, () => open({ kind: 'comments', post }), post.comments + (comments[post.id]?.length ?? 0))}
            {action('send', 'Share post', () => { void Share.share({ message: `${post.title}\n${post.caption}\n— Codexgram demo` }).catch(() => Alert.alert('Unable to share', 'Please try again.')); })}
            <View style={{ flex: 1 }} />
            <Pressable accessibilityRole="button" accessibilityLabel={isSaved ? 'Unsave post' : 'Save post'} accessibilityState={{ selected: isSaved }} hitSlop={10} onPress={() => setSaved(toggle(saved, post.id))} style={{ padding: fs(2) }}><FeedIcon name="bookmark" size={fs(18)} filled={isSaved} /></Pressable>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View collapsable={false} style={[styles.screen, { paddingTop: Math.max(40, insets.top - 16) }]}>
      <StatusBar style="dark" />
      <View style={[styles.header, { height: 54 * v, paddingHorizontal: fs(14), gap: fs(10) }]}>
        <Image source={require('../../assets/images/codexgram-mark.png')} style={{ width: fs(38), height: fs(38) }} />
        <Text style={{ flex: 1, fontSize: fs(23), fontWeight: '700', letterSpacing: -1, color: '#070D1C' }}>Codexgram</Text>
        {roundButton('search', 'Search people and posts', onExplore)}
        {roundButton('plus', 'Create a post', () => open({ kind: 'compose' }), true)}
      </View>
      <FlatList contentInsetAdjustmentBehavior="automatic" data={posts} keyExtractor={post => post.id} renderItem={renderPost} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 12 }} ListHeaderComponent={
        <ScrollView horizontal showsHorizontalScrollIndicator={false} snapToInterval={storyWidth} decelerationRate="fast" style={{ marginHorizontal: fs(13), overflow: 'hidden' }} contentContainerStyle={{ paddingTop: 6 * v, paddingBottom: 9 * v }}>
          <Pressable accessibilityRole="button" accessibilityLabel="Your story" onPress={() => open({ kind: 'story', name: 'Your story' })} style={[styles.story, { width: storyWidth }]}>
            <View style={{ width: fs(50), height: fs(50), borderRadius: fs(27), backgroundColor: '#EAF2FF', alignItems: 'center', justifyContent: 'center', marginBottom: 5 * v }}><FeedIcon name="plus" color={colors.blue} size={fs(23)} /></View>
            <Text style={{ fontSize: fs(9.5), color: colors.muted }}>Your story</Text>
          </Pressable>
          {stories.map(story => <Pressable key={story.name} accessibilityRole="button" accessibilityLabel={`View ${story.name}'s demo story`} onPress={() => open({ kind: 'story', name: story.name, image: story.image })} style={[styles.story, { width: storyWidth }]}>
            <LinearGradient colors={story.ring as [string, string]} style={{ width: fs(55), height: fs(55), borderRadius: fs(28), padding: fs(1.3), marginTop: -2 * v, marginBottom: 3 * v }}><View style={{ flex: 1, borderRadius: fs(28), backgroundColor: 'white', padding: fs(2) }}><Image source={story.image} style={{ flex: 1, borderRadius: fs(28) }} /></View></LinearGradient>
            <Text style={{ fontSize: fs(9.5), color: colors.ink }}>{story.name}</Text>
          </Pressable>)}
        </ScrollView>
      } ListFooterComponent={<Text style={styles.demoNote}>Demo feed · fictional profiles and sample posts</Text>} />
      <Modal visible={!!sheet} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setSheet(null)}>
        <KeyboardAvoidingView style={styles.sheet} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.sheetHeader}><Text style={styles.sheetTitle}>{sheet?.kind === 'search' ? 'Explore' : sheet?.kind === 'compose' ? 'Create a demo post' : sheet?.kind === 'comments' ? 'Comments' : sheet?.name ?? 'Post options'}</Text><Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={() => setSheet(null)} style={{ padding: 10 }}><FeedIcon name="close" /></Pressable></View>
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 24, gap: 18 }}>
            {sheet?.kind === 'story' && <><Image source={sheet.image ?? media.lake} style={{ width: '100%', aspectRatio: 1, borderRadius: 22 }} /><Text style={styles.sheetBody}>A preview from the Codexgram demo community.</Text></>}
            {sheet?.kind === 'search' && <><TextInput autoFocus value={input} onChangeText={setInput} placeholder="Search people or hashtags" style={styles.input} accessibilityLabel="Search people or hashtags" />{posts.filter(post => `${post.name} ${post.tags.join(' ')} ${post.title}`.toLowerCase().includes(input.toLowerCase().replace('#', ''))).map(post => <Pressable key={post.id} onPress={() => open({ kind: 'story', name: post.name, image: post.photo })} style={styles.searchResult}><Image source={post.avatar} style={{ width: 48, height: 48, borderRadius: 24 }} /><View><Text style={styles.sheetTitle}>{post.name}</Text><Text style={styles.sheetBody}>Fictional demo profile</Text></View></Pressable>)}</>}
            {sheet?.kind === 'menu' && <><Text style={styles.sheetBody}>This is a fictional demo post. Likes, saves, and comments are stored for this preview session.</Text><Pressable style={styles.primaryButton} onPress={() => { if (sheet.post) setSaved(toggle(saved, sheet.post.id)); setSheet(null); }}><Text style={styles.primaryLabel}>{sheet.post && saved.includes(sheet.post.id) ? 'Remove from saved' : 'Save post'}</Text></Pressable></>}
            {sheet?.kind === 'comments' && <><Text style={styles.sheetBody}>Comments added here stay in this preview session.</Text>{(comments[sheet.post!.id] ?? []).map((comment, index) => <View key={index} style={styles.comment}><Text style={{ fontWeight: '700' }}>You</Text><Text>{comment}</Text></View>)}<TextInput value={input} onChangeText={setInput} placeholder="Add a comment…" style={styles.input} accessibilityLabel="Add a comment" /><Pressable accessibilityRole="button" disabled={!input.trim()} style={[styles.primaryButton, !input.trim() && { opacity: 0.4 }]} onPress={() => { const id = sheet.post!.id; setComments(current => ({ ...current, [id]: [...(current[id] ?? []), input.trim()] })); setInput(''); }}><Text style={styles.primaryLabel}>Post comment</Text></Pressable></>}
            {sheet?.kind === 'compose' && <><Text style={styles.sheetBody}>Try a sample post in the local demo feed.</Text><Image source={media.lake} style={{ width: '100%', aspectRatio: 2, borderRadius: 15 }} /><TextInput value={input} onChangeText={setInput} placeholder="Write a caption…" multiline style={styles.input} accessibilityLabel="Post caption" /><Pressable accessibilityRole="button" disabled={!input.trim()} style={[styles.primaryButton, !input.trim() && { opacity: 0.4 }]} onPress={() => { setPosts(current => [{ ...initialPosts[0], id: `local-${Date.now()}`, name: userName ?? 'you', title: input.trim(), caption: 'Local demo post', tags: ['demo'], likes: 1, comments: 0, time: 'Just now', carousel: false }, ...current]); setSheet(null); }}><Text style={styles.primaryLabel}>Add to preview</Text></Pressable></>}
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background }, header: { flexDirection: 'row', alignItems: 'center' },
  roundButton: { alignItems: 'center', justifyContent: 'center', borderRadius: 100 }, story: { alignItems: 'center', justifyContent: 'flex-end' },
  card: { backgroundColor: '#FFFFFF', boxShadow: '0px 3px 10px rgba(26,40,64,0.035)' }, postHeader: { flexDirection: 'row', alignItems: 'center' },
  pageBadge: { position: 'absolute', borderRadius: 20, backgroundColor: '#52606E' }, actions: { flexDirection: 'row', alignItems: 'center' }, action: { flexDirection: 'row', alignItems: 'center' },
  demoNote: { textAlign: 'center', color: colors.muted, fontSize: 11, padding: 20 },
  sheet: { flex: 1, backgroundColor: '#FCFDFE' }, sheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 18, borderBottomWidth: 1, borderBottomColor: colors.border },
  sheetTitle: { color: colors.ink, fontWeight: '700', fontSize: 20 }, sheetBody: { color: colors.muted, fontSize: 15, lineHeight: 23 },
  input: { borderWidth: 1, borderColor: '#DAE1EA', backgroundColor: 'white', borderRadius: 14, padding: 16, fontSize: 16, color: colors.ink },
  primaryButton: { padding: 16, borderRadius: 20, alignItems: 'center', backgroundColor: colors.blue }, primaryLabel: { color: 'white', fontSize: 16, fontWeight: '600' },
  searchResult: { flexDirection: 'row', alignItems: 'center', gap: 14 }, comment: { backgroundColor: '#EFF4FA', borderRadius: 12, padding: 14, gap: 6 },
});
