import { ConvexError, v } from 'convex/values';
import { mutation, internalQuery, internalMutation } from './_generated/server';
import { internal } from './_generated/api';
import schema, { mediaKind } from './schema';
import { requireProfile } from './lib/auth';

export const begin = mutation({ args: { purpose: v.union(v.literal('post'), v.literal('avatar')), kind: mediaKind, width: v.number(), height: v.number(), duration: v.optional(v.number()) }, returns: v.id('uploads'), handler: async (ctx, args) => {
  const me = await requireProfile(ctx);
  if (![args.width, args.height].every(n => Number.isInteger(n) && n > 0 && n <= 30000)) throw new ConvexError('Invalid media dimensions.');
  if (args.kind === 'video' && (args.purpose === 'avatar' || !args.duration || !Number.isFinite(args.duration) || args.duration > 30 || args.duration <= 0)) throw new ConvexError('Videos must be 30 seconds or shorter.');
  const id = await ctx.db.insert('uploads', { ...args, ownerId: me._id, state: 'pending', expiresAt: Date.now() + 60 * 60 * 1000 });
  await ctx.scheduler.runAfter(60 * 60 * 1000, internal.uploads.expire, { id }); return id;
}});
export const forUpload = internalQuery({ args: { id: v.string(), tokenIdentifier: v.string() }, returns: v.union(schema.doc('uploads'), v.null()), handler: async (ctx, args) => {
  const id = ctx.db.normalizeId('uploads', args.id); if (!id) return null;
  const upload = await ctx.db.get('uploads', id); if (!upload) return null;
  const owner = await ctx.db.get('profiles', upload.ownerId);
  return owner?.tokenIdentifier === args.tokenIdentifier ? upload : null;
}});
export const finish = internalMutation({ args: { id: v.id('uploads'), tokenIdentifier: v.string(), storageId: v.id('_storage'), duration: v.optional(v.number()) }, returns: v.id('_storage'), handler: async (ctx, args) => {
  const upload = await ctx.db.get('uploads', args.id);
  const owner = upload && await ctx.db.get('profiles', upload.ownerId);
  if (!upload || owner?.tokenIdentifier !== args.tokenIdentifier || upload.expiresAt <= Date.now()) throw new ConvexError('Upload expired.');
  if (upload.storageId) return upload.storageId;
  await ctx.db.patch('uploads', upload._id, { storageId: args.storageId, state: 'ready', ...(args.duration ? { duration: args.duration } : {}) }); return args.storageId;
}});
export const cancel = mutation({ args: { id: v.id('uploads') }, returns: v.null(), handler: async (ctx, args) => {
  const me = await requireProfile(ctx); const upload = await ctx.db.get('uploads', args.id);
  if (!upload) return null;
  if (upload.ownerId !== me._id) throw new ConvexError('Not authorized to cancel this upload.');
  if (upload.state === 'published') return null;
  if (upload.storageId) await ctx.storage.delete(upload.storageId);
  await ctx.db.delete('uploads', upload._id); return null;
}});
export const expire = internalMutation({ args: { id: v.id('uploads') }, returns: v.null(), handler: async (ctx, args) => {
  const upload = await ctx.db.get('uploads', args.id);
  if (!upload || upload.state === 'published') return null;
  if (upload.storageId) await ctx.storage.delete(upload.storageId);
  await ctx.db.delete('uploads', upload._id); return null;
}});
export const setAvatar = mutation({ args: { uploadId: v.id('uploads') }, returns: v.null(), handler: async (ctx, args) => {
  const me = await requireProfile(ctx); const upload = await ctx.db.get('uploads', args.uploadId);
  if (!upload || upload.ownerId !== me._id || upload.purpose !== 'avatar' || !upload.storageId || upload.kind !== 'image') throw new ConvexError('Invalid avatar upload.');
  if (upload.state === 'published' && me.avatarId === upload.storageId) return null;
  if (upload.state !== 'ready' || upload.expiresAt <= Date.now()) throw new ConvexError('Avatar upload expired.');
  if (me.avatarId) await ctx.storage.delete(me.avatarId);
  await ctx.db.patch('profiles', me._id, { avatarId: upload.storageId, avatarUrl: undefined, avatarUpdatedAt: Date.now() });
  await ctx.db.patch('uploads', upload._id, { state: 'published' }); return null;
}});
export const media = internalQuery({ args: { id: v.string(), kind: v.union(v.literal('post'), v.literal('avatar')), tokenIdentifier: v.string() }, returns: v.union(v.id('_storage'), v.null()), handler: async (ctx, args) => {
  const me = await ctx.db.query('profiles').withIndex('by_tokenIdentifier', q => q.eq('tokenIdentifier', args.tokenIdentifier)).unique();
  if (!me) return null;
  if (args.kind === 'post') { const id = ctx.db.normalizeId('posts', args.id); return id ? (await ctx.db.get('posts', id))?.storageId ?? null : null; }
  const id = ctx.db.normalizeId('profiles', args.id); return id ? (await ctx.db.get('profiles', id))?.avatarId ?? null : null;
}});
