import { ConvexError, v } from 'convex/values';
import { query, mutation, internalMutation } from './_generated/server';
import { internal } from './_generated/api';
import { requireProfile } from './lib/auth';
import { profileView, publicProfile } from './lib/views';

export const storyView = v.object({ _id: v.id('stories'), _creationTime: v.number(), expiresAt: v.number(), caption: v.string(), author: profileView });
export const list = query({ args: { now: v.number() }, returns: v.array(storyView), handler: async (ctx, { now }) => {
  const me = await requireProfile(ctx);
  const stories = await ctx.db.query('stories').withIndex('by_expiresAt', q => q.gt('expiresAt', now)).order('desc').take(100);
  const result = await Promise.all(stories.map(async story => {
    const author = await ctx.db.get('profiles', story.authorId);
    return author ? { _id: story._id, _creationTime: story._creationTime, expiresAt: story.expiresAt, caption: story.caption, author: await publicProfile(ctx, author, me) } : null;
  }));
  return result.filter(story => story !== null);
} });
export const publish = mutation({ args: { uploadId: v.id('uploads'), caption: v.string() }, returns: v.id('stories'), handler: async (ctx, args) => {
  const me = await requireProfile(ctx); const upload = await ctx.db.get('uploads', args.uploadId);
  if (!upload || upload.ownerId !== me._id || upload.purpose !== 'story') throw new ConvexError('Not authorized to publish this story.');
  if (upload.storyId) {
    if (!await ctx.db.get('stories', upload.storyId)) throw new ConvexError('This story has expired or been deleted.');
    return upload.storyId;
  }
  if (upload.state !== 'ready' || !upload.storageId || upload.kind !== 'image' || upload.expiresAt <= Date.now()) throw new ConvexError('Story upload is incomplete or expired.');
  if (args.caption.length > 280) throw new ConvexError('Story captions can contain up to 280 characters.');
  // The authenticated upload endpoint validates the photo MIME type and file signature.
  const meta = await ctx.db.system.get('_storage', upload.storageId);
  if (!meta || meta.size > 10 * 1024 * 1024) throw new ConvexError('Choose a photo under 10 MB.');
  const expiresAt = Date.now() + 24 * 60 * 60 * 1000;
  const id = await ctx.db.insert('stories', { authorId: me._id, uploadId: upload._id, storageId: upload.storageId, caption: args.caption.trim(), expiresAt });
  await ctx.db.patch('uploads', upload._id, { state: 'published', storyId: id });
  await ctx.scheduler.runAt(expiresAt, internal.stories.expire, { id, uploadId: upload._id });
  return id;
} });
export const remove = mutation({ args: { id: v.id('stories') }, returns: v.null(), handler: async (ctx, { id }) => {
  const me = await requireProfile(ctx); const story = await ctx.db.get('stories', id);
  if (!story) return null;
  if (story.authorId !== me._id) throw new ConvexError('Not authorized to delete this story.');
  await ctx.storage.delete(story.storageId); await ctx.db.delete('stories', id);
  return null;
} });
export const expire = internalMutation({ args: { id: v.id('stories'), uploadId: v.id('uploads') }, returns: v.null(), handler: async (ctx, { id, uploadId }) => {
  const story = await ctx.db.get('stories', id);
  if (story && story.expiresAt > Date.now()) return null;
  if (story) { await ctx.storage.delete(story.storageId); await ctx.db.delete('stories', id); }
  const upload = await ctx.db.get('uploads', uploadId);
  if (upload?.storyId === id) await ctx.db.delete('uploads', uploadId);
  return null;
} });
