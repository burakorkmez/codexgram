import { ConvexError, v } from 'convex/values';
import { internalMutation, mutation, query } from './_generated/server';
import { internal } from './_generated/api';
import { requireProfile } from './lib/auth';

export const isBookmarked = query({ args: { postId: v.id('posts') }, returns: v.boolean(), handler: async (ctx, args) => {
  const me = await requireProfile(ctx);
  return !!await ctx.db.query('bookmarks').withIndex('by_userId_and_postId', q => q.eq('userId', me._id).eq('postId', args.postId)).unique();
}});
export const setBookmark = mutation({ args: { postId: v.id('posts'), saved: v.boolean() }, returns: v.null(), handler: async (ctx, args) => {
  const me = await requireProfile(ctx);
  if (!await ctx.db.get('posts', args.postId)) throw new ConvexError('This post has been deleted.');
  const existing = await ctx.db.query('bookmarks').withIndex('by_userId_and_postId', q => q.eq('userId', me._id).eq('postId', args.postId)).unique();
  if (args.saved && !existing) await ctx.db.insert('bookmarks', { userId: me._id, postId: args.postId });
  if (!args.saved && existing) await ctx.db.delete('bookmarks', existing._id);
  return null;
}});
export const setCommentLike = mutation({ args: { commentId: v.id('comments'), liked: v.boolean() }, returns: v.null(), handler: async (ctx, args) => {
  const me = await requireProfile(ctx); const comment = await ctx.db.get('comments', args.commentId);
  if (!comment || !await ctx.db.get('posts', comment.postId)) throw new ConvexError('This comment has been deleted.');
  const existing = await ctx.db.query('commentLikes').withIndex('by_userId_and_commentId', q => q.eq('userId', me._id).eq('commentId', args.commentId)).unique();
  if (args.liked && !existing) await ctx.db.insert('commentLikes', { userId: me._id, commentId: args.commentId, postId: comment.postId });
  if (!args.liked && existing) await ctx.db.delete('commentLikes', existing._id);
  return null;
}});
export const cleanupComment = internalMutation({ args: { commentId: v.id('comments') }, returns: v.null(), handler: async (ctx, args) => {
  const rows = await ctx.db.query('commentLikes').withIndex('by_commentId', q => q.eq('commentId', args.commentId)).take(100);
  for (const row of rows) await ctx.db.delete('commentLikes', row._id);
  if (rows.length === 100) await ctx.scheduler.runAfter(0, internal.postInteractions.cleanupComment, args);
  return null;
}});
