import { paginationOptsValidator, paginationResultValidator } from 'convex/server';
import { ConvexError, v } from 'convex/values';
import { internal } from './_generated/api';
import { query, mutation } from './_generated/server';
import { requireProfile } from './lib/auth';
import { profileView, publicProfile } from './lib/views';

export const setLike = mutation({ args: { postId: v.id('posts'), liked: v.boolean() }, returns: v.null(), handler: async (ctx, args) => {
  const me = await requireProfile(ctx); const post = await ctx.db.get('posts', args.postId);
  if (!post) throw new ConvexError('This post has been deleted.');
  const existing = await ctx.db.query('likes').withIndex('by_userId_and_postId', q => q.eq('userId', me._id).eq('postId', post._id)).unique();
  if (args.liked && !existing) { await ctx.db.insert('likes', { userId: me._id, postId: post._id }); await ctx.db.patch('posts', post._id, { likesCount: post.likesCount + 1 }); }
  if (!args.liked && existing) { await ctx.db.delete('likes', existing._id); await ctx.db.patch('posts', post._id, { likesCount: Math.max(0, post.likesCount - 1) }); }
  return null;
}});
export const setFollow = mutation({ args: { profileId: v.id('profiles'), following: v.boolean() }, returns: v.null(), handler: async (ctx, args) => {
  const me = await requireProfile(ctx); const target = await ctx.db.get('profiles', args.profileId);
  if (!target || target.deletionRequested) throw new ConvexError('This profile is unavailable.');
  if (target._id === me._id) throw new ConvexError('You cannot follow yourself.');
  const existing = await ctx.db.query('follows').withIndex('by_followerId_and_followingId', q => q.eq('followerId', me._id).eq('followingId', target._id)).unique();
  if (!!existing === args.following) return null;
  if (existing) await ctx.db.delete('follows', existing._id);
  else await ctx.db.insert('follows', { followerId: me._id, followingId: target._id });
  const delta = args.following ? 1 : -1;
  await ctx.db.patch('profiles', me._id, { followingCount: Math.max(0, me.followingCount + delta) });
  await ctx.db.patch('profiles', target._id, { followersCount: Math.max(0, target.followersCount + delta) });
  return null;
}});
export const connections = query({ args: { profileId: v.id('profiles'), kind: v.union(v.literal('followers'), v.literal('following')), paginationOpts: paginationOptsValidator }, returns: paginationResultValidator(profileView), handler: async (ctx, args) => {
  const me = await requireProfile(ctx);
  const result = args.kind === 'followers'
    ? await ctx.db.query('follows').withIndex('by_followingId', q => q.eq('followingId', args.profileId)).order('desc').paginate(args.paginationOpts)
    : await ctx.db.query('follows').withIndex('by_followerId_and_followingId', q => q.eq('followerId', args.profileId)).paginate(args.paginationOpts);
  const profiles = await Promise.all(result.page.map(async row => {
    const profile = await ctx.db.get('profiles', args.kind === 'followers' ? row.followerId : row.followingId);
    return profile ? publicProfile(ctx, profile, me) : null;
  }));
  return { ...result, page: profiles.filter(p => p !== null) };
}});
const commentView = v.object({ _id: v.id('comments'), _creationTime: v.number(), author: profileView, text: v.string(), isOwn: v.boolean(), isLiked: v.boolean() });
export const comments = query({ args: { postId: v.id('posts'), order: v.optional(v.union(v.literal('asc'), v.literal('desc'))), paginationOpts: paginationOptsValidator }, returns: paginationResultValidator(commentView), handler: async (ctx, args) => {
  const me = await requireProfile(ctx);
  if (!await ctx.db.get('posts', args.postId)) return { page: [], isDone: true, continueCursor: '' };
  const result = await ctx.db.query('comments').withIndex('by_postId', q => q.eq('postId', args.postId)).order(args.order ?? 'asc').paginate(args.paginationOpts);
  return { ...result, page: await Promise.all(result.page.map(async row => {
    const author = await ctx.db.get('profiles', row.authorId);
    if (!author) throw new Error('Comment author missing');
    return { _id: row._id, _creationTime: row._creationTime, author: await publicProfile(ctx, author, me), text: row.text, isOwn: me._id === row.authorId, isLiked: !!await ctx.db.query('commentLikes').withIndex('by_userId_and_commentId', q => q.eq('userId', me._id).eq('commentId', row._id)).unique() };
  })) };
}});
export const addComment = mutation({ args: { postId: v.id('posts'), text: v.string(), requestId: v.string() }, returns: v.id('comments'), handler: async (ctx, args) => {
  const me = await requireProfile(ctx); const text = args.text.trim();
  if (!text || text.length > 2000 || !args.requestId || args.requestId.length > 100) throw new ConvexError('Comments must contain 1–2,000 characters.');
  const post = await ctx.db.get('posts', args.postId); if (!post) throw new ConvexError('This post has been deleted.');
  const existing = await ctx.db.query('comments').withIndex('by_authorId_and_requestId', q => q.eq('authorId', me._id).eq('requestId', args.requestId)).unique();
  if (existing) { if (existing.postId !== args.postId || existing.text !== text) throw new ConvexError('Retry does not match the original comment.'); return existing._id; }
  const id = await ctx.db.insert('comments', { authorId: me._id, postId: post._id, text, requestId: args.requestId });
  await ctx.db.patch('posts', post._id, { commentsCount: post.commentsCount + 1 }); return id;
}});
export const deleteComment = mutation({ args: { id: v.id('comments') }, returns: v.null(), handler: async (ctx, args) => {
  const me = await requireProfile(ctx); const comment = await ctx.db.get('comments', args.id);
  if (!comment) return null;
  if (comment.authorId !== me._id) throw new ConvexError('Not authorized to delete this comment.');
  await ctx.db.delete('comments', comment._id);
  await ctx.scheduler.runAfter(0, internal.postInteractions.cleanupComment, { commentId: comment._id });
  const post = await ctx.db.get('posts', comment.postId);
  if (post) await ctx.db.patch('posts', post._id, { commentsCount: Math.max(0, post.commentsCount - 1) });
  return null;
}});
