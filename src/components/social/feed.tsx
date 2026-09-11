import { usePaginatedQuery } from 'convex/react';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { FlatList, Pressable, Text, View, type ViewToken } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api, type SocialPost } from '@/lib/social';
import { Header, ConnectionStatus, LoadMore, ui } from './ui';
import { PostCard } from './post-card';

export function LiveHome() {
  const insets = useSafeAreaInsets(); const router = useRouter();
  const { results, status, loadMore } = usePaginatedQuery(api.posts.list, { feed: 'home' }, { initialNumItems: 20 });
  const [visible, setVisible] = useState<string[]>([]);
  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken<SocialPost>[] }) => setVisible(viewableItems.map(item => item.item._id))).current;
  return <View style={[ui.screen, { paddingTop: insets.top }]}><Header /><ConnectionStatus />
    <FlatList data={results} keyExtractor={item => item._id} renderItem={({ item }) => <PostCard post={item} visible={visible.includes(item._id)} />} onViewableItemsChanged={onViewableItemsChanged} viewabilityConfig={{ itemVisiblePercentThreshold: 60 }} onEndReached={() => { if (status === 'CanLoadMore') loadMore(20); }} onEndReachedThreshold={0.5} contentContainerStyle={{ paddingBottom: 24 }}
      ListEmptyComponent={status !== 'LoadingFirstPage' ? <View style={{ padding: 32, gap: 16, alignItems: 'center' }}><Text style={ui.title}>Your feed starts here</Text><Text style={[ui.muted, { textAlign: 'center' }]}>Share your first moment, or discover people to follow.</Text><Pressable style={ui.button} onPress={() => router.push('/compose')}><Text style={ui.buttonText}>Create a post</Text></Pressable><Pressable onPress={() => router.navigate('/explore')}><Text style={ui.link}>Explore the community</Text></Pressable></View> : null}
      ListFooterComponent={<LoadMore status={status} loadMore={loadMore} />} />
  </View>;
}
