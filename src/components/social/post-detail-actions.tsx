import { useMutation, useQuery } from 'convex/react';
import { useState } from 'react';
import { Alert, Pressable, Share, View } from 'react-native';
import { api, errorMessage, type SocialPost } from '@/lib/social';
import { FeedIcon } from '../feed-icon';

export function DetailActions({ post, scale }: { post: SocialPost; scale: number }) {
  const saved = useQuery(api.postInteractions.isBookmarked, { postId: post._id });
  const save = useMutation(api.postInteractions.setBookmark); const [pending, setPending] = useState<boolean | null>(null);
  const selected = pending ?? saved ?? false;
  return <><Pressable accessibilityRole="button" accessibilityLabel="Share post" onPress={() => void Share.share({ message: `${post.author.username}: ${post.caption}\ncodexgram://post/${post._id}` }).catch(e => Alert.alert('Could not share', errorMessage(e)))} style={{ padding: 7 * scale }}><FeedIcon name="send" size={23 * scale} color="#0C1239" /></Pressable><View style={{ flex: 1 }} /><Pressable accessibilityRole="button" accessibilityLabel={selected ? 'Remove bookmark' : 'Bookmark post'} accessibilityState={{ selected, disabled: pending !== null || saved === undefined }} disabled={pending !== null || saved === undefined} onPress={async () => { setPending(!selected); try { await save({ postId: post._id, saved: !selected }); } catch (e) { Alert.alert('Could not save bookmark', errorMessage(e)); } finally { setPending(null); } }} style={{ padding: 7 * scale }}><FeedIcon name="bookmark" size={23 * scale} filled={selected} color={selected ? '#087EFF' : '#0C1239'} /></Pressable></>;
}
