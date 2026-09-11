import { paginationOptsValidator, paginationResultValidator } from 'convex/server';
import { ConvexError, v } from 'convex/values';
import { query, mutation, internalMutation } from './_generated/server';
import { internal } from './_generated/api';
import { requireProfile } from './lib/auth';
import { postView, publicPost } from './lib/views';

export const list = query({ args: { feed: v.union(v.literal('home'), v.literal('explore'), v.literal('profile')), profileId: v.optional(v.id('profiles')), paginationOpts: paginationOptsValidator }, returns: paginationResultValidator(postView), handler: async (ctx, args) => {
  const me = await requireProfile(ctx);
  const result = args.feed === 'profile'
    ? await ctx.db.query('posts').withIndex('by_authorId', q => q.eq('authorId', args.profileId ?? me._id)).order('desc').paginate(args.paginationOpts)
    : await ctx.db.query('posts').withIndex('by_creation_time').order('desc').paginate(args.paginationOpts);
  // Scan a bounded page, then test indexed relationships. Preserve the cursor even
  // when no rows match so sparse following feeds can continue through all pages.
  const page = await Promise.all(result.page.map(async post => {
    if (args.feed === 'home' && post.authorId !== me._id) {
      const follow = await ctx.db.query('follows').withIndex('by_followerId_and_followingId', q => q.eq('followerId', me._id).eq('followingId', post.authorId)).unique();
      if (!follow) return null;
    }
    return publicPost(ctx, post, me);
  }));
  return { ...result, page: page.filter(p => p !== null) };
}});
export const get = query({ args: { id: v.id('posts') }, returns: v.union(postView, v.null()), handler: async (ctx, args) => {
  const me = await requireProfile(ctx); const post = await ctx.db.get('posts', args.id);
  return post ? publicPost(ctx, post, me) : null;
}});
export const publish = mutation({ args: { uploadId: v.id('uploads'), caption: v.string() }, returns: v.id('posts'), handler: async (ctx, args) => {
  const me = await requireProfile(ctx); const upload = await ctx.db.get('uploads', args.uploadId);
  if (!upload || upload.ownerId !== me._id || upload.purpose !== 'post') throw new ConvexError('Not authorized to publish this upload.');
  if (upload.postId) {
    if (!await ctx.db.get('posts', upload.postId)) throw new ConvexError('This post has been deleted.');
    return upload.postId;
  }
  if (upload.state !== 'ready' || !upload.storageId || upload.expiresAt <= Date.now()) throw new ConvexError('Upload is incomplete or expired. Please select your media again.');
  if (args.caption.length > 2200) throw new ConvexError('Captions can contain up to 2,200 characters.');
  const metadata = await ctx.db.system.get('_storage', upload.storageId);
  if (!metadata || metadata.size > (upload.kind === 'image' ? 10 : 50) * 1024 * 1024) throw new ConvexError('Invalid media.');
  const postId = await ctx.db.insert('posts', { authorId: me._id, uploadId: upload._id, storageId: upload.storageId, kind: upload.kind,
    width: upload.width, height: upload.height, duration: upload.duration, caption: args.caption.trim(), likesCount: 0, commentsCount: 0 });
  await ctx.db.patch('uploads', upload._id, { state: 'published', postId });
  await ctx.db.patch('profiles', me._id, { postsCount: me.postsCount + 1 });
  return postId;
}});
export const remove = mutation({ args: { id: v.id('posts') }, returns: v.null(), handler: async (ctx, args) => {
  const me = await requireProfile(ctx); const post = await ctx.db.get('posts', args.id);
  if (!post) return null;
  if (post.authorId !== me._id) throw new ConvexError('Not authorized to delete this post.');
  await ctx.db.delete('posts', post._id);
  await ctx.db.patch('profiles', me._id, { postsCount: Math.max(0, me.postsCount - 1) });
  await ctx.storage.delete(post.storageId);
  await ctx.scheduler.runAfter(0, internal.posts.cleanup, { postId: post._id });
  return null;
}});
export const cleanup = internalMutation({ args: { postId: v.id('posts') }, returns: v.null(), handler: async (ctx, args) => {
  const likes = await ctx.db.query('likes').withIndex('by_postId', q => q.eq('postId', args.postId)).take(100);
  const comments = await ctx.db.query('comments').withIndex('by_postId', q => q.eq('postId', args.postId)).take(100);
  const bookmarks = await ctx.db.query('bookmarks').withIndex('by_postId', q => q.eq('postId', args.postId)).take(100);
  const commentLikes = await ctx.db.query('commentLikes').withIndex('by_postId', q => q.eq('postId', args.postId)).take(100);
  for (const row of bookmarks) await ctx.db.delete('bookmarks', row._id);
  for (const row of commentLikes) await ctx.db.delete('commentLikes', row._id);
  for (const row of likes) await ctx.db.delete('likes', row._id);
  for (const row of comments) await ctx.db.delete('comments', row._id);
  if (likes.length === 100 || comments.length === 100 || bookmarks.length === 100 || commentLikes.length === 100) await ctx.scheduler.runAfter(0, internal.posts.cleanup, args);
  return null;
}});
