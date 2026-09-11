import { v } from 'convex/values';
import type { Doc } from '../_generated/dataModel';
import type { QueryCtx } from '../_generated/server';
import { mediaKind } from '../schema';

export const profileView = v.object({
  _id: v.id('profiles'), isDemo: v.boolean(), username: v.string(), name: v.string(), bio: v.string(),
  avatarUrl: v.union(v.string(), v.null()), hasAvatar: v.boolean(), avatarVersion: v.number(), website: v.string(), location: v.string(),
  postsCount: v.number(), followersCount: v.number(), followingCount: v.number(), isFollowing: v.boolean(), isOwn: v.boolean(),
});
export async function publicProfile(ctx: QueryCtx, profile: Doc<'profiles'>, me: Doc<'profiles'> | null) {
  const followed = me && me._id !== profile._id
    ? await ctx.db.query('follows').withIndex('by_followerId_and_followingId', q => q.eq('followerId', me._id).eq('followingId', profile._id)).unique() : null;
  return { _id: profile._id, isDemo: profile.isDemo ?? false, username: profile.username, name: profile.name, bio: profile.bio,
    avatarUrl: profile.avatarUrl ?? null, hasAvatar: !!profile.avatarId, avatarVersion: profile.avatarUpdatedAt ?? 0, website: profile.website, location: profile.location,
    postsCount: profile.postsCount, followersCount: profile.followersCount, followingCount: profile.followingCount,
    isFollowing: !!followed, isOwn: me?._id === profile._id };
}
export const postView = v.object({
  _id: v.id('posts'), _creationTime: v.number(), author: profileView, kind: mediaKind,
  width: v.number(), height: v.number(), duration: v.optional(v.number()), caption: v.string(),
  likesCount: v.number(), commentsCount: v.number(), isLiked: v.boolean(), isOwn: v.boolean(),
});
export async function publicPost(ctx: QueryCtx, post: Doc<'posts'>, me: Doc<'profiles'>) {
  const author = await ctx.db.get('profiles', post.authorId);
  if (!author) throw new Error('Post author missing');
  const like = await ctx.db.query('likes').withIndex('by_userId_and_postId', q => q.eq('userId', me._id).eq('postId', post._id)).unique();
  return { _id: post._id, _creationTime: post._creationTime, author: await publicProfile(ctx, author, me),
    kind: post.kind, width: post.width, height: post.height, duration: post.duration, caption: post.caption,
    likesCount: post.likesCount, commentsCount: post.commentsCount, isLiked: !!like, isOwn: post.authorId === me._id };
}
