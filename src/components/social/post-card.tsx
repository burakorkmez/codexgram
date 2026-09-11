import { useMutation } from 'convex/react';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, Text, useWindowDimensions, View } from 'react-native';
import { api, errorMessage, type SocialPost, type SocialProfile } from '@/lib/social';
import { FeedIcon } from '../feed-icon';
import { Avatar, PostMedia } from './media';
import { DetailActions } from './post-detail-actions';
import { ui } from './ui';

export function FollowButton({ profile }: { profile: SocialProfile }) {
  const setFollow = useMutation(api.social.setFollow);
  const [pending, setPending] = useState<boolean | null>(null);
  const following = pending ?? profile.isFollowing;
  if (profile.isOwn) return null;
  async function toggle() {
    if (pending !== null) return; const next = !following; setPending(next);
    try { await setFollow({ profileId: profile._id, following: next }); }
    catch (e) { Alert.alert('Could not update follow', errorMessage(e)); }
    finally { setPending(null); }
  }
  return <Pressable accessibilityRole="button" accessibilityLabel={`${following ? 'Unfollow' : 'Follow'} ${profile.username}`} accessibilityState={{ selected: following, disabled: pending !== null }} disabled={pending !== null} onPress={() => void toggle()} style={{ backgroundColor: following ? '#EDF2F8' : '#087EFF', paddingVertical: 9, paddingHorizontal: 14, borderRadius: 18 }}><Text style={{ color: following ? '#63718A' : 'white', fontSize: 12, fontWeight: '600' }}>{following ? 'Following' : 'Follow'}</Text></Pressable>;
}
export function PostCard({ post, visible = false, onComments, detail = false }: { post: SocialPost; visible?: boolean; onComments?: () => void; detail?: boolean }) {
  const { width } = useWindowDimensions(); const s = detail ? width / 390 : 1;
  const tags = detail ? [...new Set(post.caption.match(/#[\p{L}\p{N}_]+/gu) ?? [])] : [];
  const caption = detail ? post.caption.replace(/#[\p{L}\p{N}_]+/gu, '').replace(/[ \t]{2,}/g, ' ').trim() : post.caption;
  const router = useRouter(); const like = useMutation(api.social.setLike); const remove = useMutation(api.posts.remove);
  const [pending, setPending] = useState<boolean | null>(null); const liked = pending ?? post.isLiked;
  const likes = post.likesCount + (liked === post.isLiked ? 0 : liked ? 1 : -1);
  async function toggleLike() {
    if (pending !== null) return; setPending(!liked);
    try { await like({ postId: post._id, liked: !liked }); } catch (e) { Alert.alert('Could not update like', errorMessage(e)); } finally { setPending(null); }
  }
  function options() {
    if (!post.isOwn) return;
    Alert.alert('Delete post?', 'This removes the post, its media, likes, and comments.', [{ text: 'Cancel', style: 'cancel' }, { text: 'Delete', style: 'destructive', onPress: () => { void remove({ id: post._id }).catch(e => Alert.alert('Could not delete post', errorMessage(e))); } }]);
  }
  const member = () => router.push({ pathname: '/member/[id]', params: { id: post.author._id } });
  const comments = () => onComments ? onComments() : router.push({ pathname: '/post/[id]', params: { id: post._id } });
  return <View style={detail ? { backgroundColor: 'white', paddingHorizontal: 10, paddingTop: 8 } : { backgroundColor: 'white', marginHorizontal: 10, marginBottom: 12, padding: 8, borderRadius: 18, boxShadow: '0px 3px 10px #1A284009' }}>
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 4, paddingBottom: 12 }}><Pressable accessibilityLabel={`View ${post.author.username}`} onPress={member}><Avatar profile={post.author} /></Pressable><Pressable onPress={member} style={{ flex: 1 }}><Text style={{ color: '#0D1529', fontWeight: '700', fontSize: 14 }}>{post.author.username}</Text><Text style={{ color: '#7C879F', fontSize: 11, marginTop: 3 }}>{post.author.isDemo ? 'Demo · ' : ''}{new Date(post._creationTime).toLocaleDateString()}{post.author.location ? ` · ${post.author.location}` : ''}</Text></Pressable>{post.isOwn ? <Pressable accessibilityRole="button" accessibilityLabel="Delete your post" onPress={options} hitSlop={12} style={{ padding: 8 }}><Text style={ui.muted}>•••</Text></Pressable> : <FollowButton profile={post.author} />}</View>
    <PostMedia post={post} visible={visible} />
    <View style={{ paddingHorizontal: detail ? 10 * s : 7, paddingTop: detail ? 12 * s : 7, paddingBottom: detail ? 10 * s : 7, gap: 10 * s }}>
      {!!caption && <Text style={detail ? { color: '#0C1239', fontSize: 16 * s, lineHeight: 22 * s, letterSpacing: -0.3 } : ui.text}>{caption}</Text>}
      {!!tags.length && <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7 * s }}>{tags.map(tag => <View key={tag} style={{ backgroundColor: '#EAF3FF', borderRadius: 18 * s, paddingVertical: 6 * s, paddingHorizontal: 11 * s }}><Text style={{ color: '#087EFF', fontSize: 12 * s, fontWeight: '500' }}>{tag}</Text></View>)}</View>}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: (detail ? 20 : 24) * s, paddingLeft: detail ? 8 * s : 0, marginTop: detail ? 4 * s : 0 }}>
        <Pressable accessibilityRole="button" accessibilityLabel={liked ? 'Unlike post' : 'Like post'} accessibilityState={{ selected: liked }} disabled={pending !== null} onPress={() => void toggleLike()} style={{ flexDirection: 'row', alignItems: 'center', gap: 7 * s, minHeight: 36 * s, width: detail ? 68 * s : undefined }}><FeedIcon name="heart" size={(detail ? 25 : 22) * s} filled={liked} color={liked ? '#FF244E' : '#0C1239'} /><Text style={detail ? { fontSize: 14 * s, fontWeight: '600', color: '#0C1239' } : ui.text}>{Math.max(0, likes)}</Text></Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="View comments" onPress={comments} style={{ flexDirection: 'row', alignItems: 'center', gap: 7 * s, minHeight: 36 * s, width: detail ? 62 * s : undefined }}><FeedIcon name="comment" size={(detail ? 24 : 21) * s} color="#0C1239" /><Text style={detail ? { fontSize: 14 * s, fontWeight: '600', color: '#0C1239' } : ui.text}>{post.commentsCount}</Text></Pressable>
        {detail && <DetailActions post={post} scale={s} />}
      </View>
    </View>
  </View>;
}
