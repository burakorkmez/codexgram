import { usePaginatedQuery } from 'convex/react';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { FlatList, Pressable, ScrollView, Text, TextInput, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api } from '@/lib/social';
import { Avatar, PostMedia } from './media';
import { FollowButton } from './post-card';
import { Header, ConnectionStatus, LoadMore, ui } from './ui';

export function LiveExplore() {
  const insets = useSafeAreaInsets(); const { width } = useWindowDimensions(); const router = useRouter();
  const [text, setText] = useState(''); const [search, setSearch] = useState('');
  useEffect(() => { const timer = setTimeout(() => setSearch(text), 250); return () => clearTimeout(timer); }, [text]);
  const people = usePaginatedQuery(api.profiles.search, { text: search }, { initialNumItems: 12 });
  const posts = usePaginatedQuery(api.posts.list, { feed: 'explore' }, { initialNumItems: 21 });
  const member = (id: string) => router.push({ pathname: '/member/[id]', params: { id } });
  const peopleContent = <View style={{ gap: 14, padding: 16 }}><Text style={{ ...ui.text, fontWeight: '700' }}>{search ? 'People' : 'Discover people'}</Text>
    {search ? <>{people.results.map(profile => <View key={profile._id} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}><Pressable onPress={() => member(profile._id)}><Avatar profile={profile} size={48} /></Pressable><Pressable style={{ flex: 1 }} onPress={() => member(profile._id)}><Text style={{ ...ui.text, fontWeight: '600' }}>{profile.username}</Text><Text style={ui.muted}>{profile.name}</Text></Pressable><FollowButton profile={profile} /></View>)}{people.results.length === 0 && people.status !== 'LoadingFirstPage' && <Text style={ui.muted}>No people found. Try another username or name.</Text>}<LoadMore status={people.status} loadMore={people.loadMore} /></>
      : <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 16 }}>{people.results.filter(p => !p.isOwn).map(profile => <View key={profile._id} style={{ alignItems: 'center', width: 88, gap: 8 }}><Pressable onPress={() => member(profile._id)}><Avatar profile={profile} size={60} /></Pressable><Pressable onPress={() => member(profile._id)}><Text numberOfLines={1} style={{ ...ui.text, fontSize: 12 }}>{profile.username}</Text></Pressable><FollowButton profile={profile} /></View>)}{people.status === 'CanLoadMore' && <Pressable onPress={() => people.loadMore(12)} style={{ justifyContent: 'center', padding: 12 }}><Text style={ui.link}>More people</Text></Pressable>}</ScrollView>}
  </View>;
  return <View style={[ui.screen, { paddingTop: insets.top }]}><Header /><ConnectionStatus /><TextInput accessibilityLabel="Search people" value={text} onChangeText={setText} placeholder="Search usernames or display names…" autoCapitalize="none" autoCorrect={false} style={[ui.input, { marginHorizontal: 16, paddingVertical: 12 }]} />
    {text.trim() ? <ScrollView keyboardShouldPersistTaps="handled">{peopleContent}</ScrollView> : <FlatList numColumns={3} data={posts.results} keyExtractor={item => item._id} columnWrapperStyle={{ gap: 3, paddingHorizontal: 8 }} ListHeaderComponent={peopleContent} renderItem={({ item }) => <Pressable accessibilityRole="button" accessibilityLabel={`Open ${item.author.username}'s post`} onPress={() => router.push({ pathname: '/post/[id]', params: { id: item._id } })} style={{ width: (width - 22) / 3, marginBottom: 4 }}><View pointerEvents="none"><PostMedia post={item} thumbnail /></View></Pressable>} onEndReached={() => { if (posts.status === 'CanLoadMore') posts.loadMore(21); }} ListEmptyComponent={posts.status !== 'LoadingFirstPage' ? <Text style={[ui.muted, { textAlign: 'center', padding: 30 }]}>No posts yet. Share the first moment.</Text> : null} ListFooterComponent={<LoadMore status={posts.status} loadMore={posts.loadMore} />} />}
  </View>;
}
