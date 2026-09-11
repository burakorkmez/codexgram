import { v } from 'convex/values';
import { env, internalAction, internalMutation, internalQuery, type MutationCtx } from './_generated/server';
import { internal } from './_generated/api';
import type { Id } from './_generated/dataModel';
import schema from './schema';
import { members, comments, postPlan, SEED_POSTS, SEED_VERSION } from './lib/seed_data';

function requireDevelopment() {
  if (env.CONVEX_CLOUD_URL !== 'https://savory-raven-325.eu-west-1.convex.cloud') throw new Error('Seeding is restricted to the codexgram development deployment.');
}
const seedKey = (i: number) => `${SEED_VERSION}:member:${i}`;
export const asset = internalQuery({ args: { key: v.string() }, returns: v.union(schema.doc('seedAssets'), v.null()), handler: async (ctx, { key }) => {
  requireDevelopment(); return ctx.db.query('seedAssets').withIndex('by_key', q => q.eq('key', key)).unique();
}});
export const registerAsset = internalMutation({ args: { key: v.string(), storageId: v.id('_storage'), width: v.number(), height: v.number() }, returns: v.id('_storage'), handler: async (ctx, args) => {
  requireDevelopment(); const existing = await ctx.db.query('seedAssets').withIndex('by_key', q => q.eq('key', args.key)).unique();
  if (existing) return existing.storageId;
  if (!await ctx.db.system.get('_storage', args.storageId)) throw new Error('Missing seed media.');
  await ctx.db.insert('seedAssets', args); return args.storageId;
}});
export const storeAsset = internalAction({ args: { key: v.string(), base64: v.string(), width: v.number(), height: v.number() }, returns: v.id('_storage'), handler: async (ctx, args): Promise<Id<'_storage'>> => {
  requireDevelopment();
  const existing = await ctx.runQuery(internal.seed.asset, { key: args.key }); if (existing) return existing.storageId;
  if (args.base64.length > 160_000) throw new Error('Seed image must be under 120 KB.');
  const bytes = Uint8Array.from(atob(args.base64), c => c.charCodeAt(0));
  const storageId = await ctx.storage.store(new Blob([bytes], { type: 'image/png' }));
  try {
    const accepted: Id<'_storage'> = await ctx.runMutation(internal.seed.registerAsset, { key: args.key, storageId, width: args.width, height: args.height });
    if (accepted !== storageId) await ctx.storage.delete(storageId);
    return accepted;
  } catch (e) { await ctx.storage.delete(storageId); throw e; }
}});
async function follow(ctx: MutationCtx, followerId: Id<'profiles'>, followingId: Id<'profiles'>) {
  if (followerId === followingId || await ctx.db.query('follows').withIndex('by_followerId_and_followingId', q => q.eq('followerId', followerId).eq('followingId', followingId)).unique()) return;
  const from = await ctx.db.get('profiles', followerId); const to = await ctx.db.get('profiles', followingId);
  if (!from || !to) throw new Error('Missing seed profile.');
  await ctx.db.insert('follows', { followerId, followingId });
  await ctx.db.patch('profiles', followerId, { followingCount: from.followingCount + 1 });
  await ctx.db.patch('profiles', followingId, { followersCount: to.followersCount + 1 });
}
export const initialize = internalMutation({ args: { username: v.string() }, returns: v.object({ profiles: v.number(), viewer: v.string() }), handler: async (ctx, args) => {
  requireDevelopment();
  const viewer = await ctx.db.query('profiles').withIndex('by_username', q => q.eq('username', args.username.toLowerCase())).unique();
  if (!viewer || viewer.isDemo) throw new Error('Choose an existing real profile username for seeding.');
  const ids: Id<'profiles'>[] = [];
  for (let i = 0; i < members.length; i++) {
    const existing = await ctx.db.query('profiles').withIndex('by_seedKey', q => q.eq('seedKey', seedKey(i))).unique();
    if (existing) { ids.push(existing._id); continue; }
    const [handle, name, location, bio] = members[i]; const username = `demo.${handle}`;
    if (await ctx.db.query('profiles').withIndex('by_username', q => q.eq('username', username)).unique()) throw new Error(`Username ${username} is already in use; seed stopped without overwriting it.`);
    const avatar = await ctx.db.query('seedAssets').withIndex('by_key', q => q.eq('key', `avatar-${i % 6}`)).unique();
    ids.push(await ctx.db.insert('profiles', { tokenIdentifier: `fictional:${seedKey(i)}`, seedKey: seedKey(i), isDemo: true, username, name, location, bio,
      searchText: `${username} ${name}`, website: '', avatarId: avatar?.storageId, avatarUpdatedAt: Date.now(), postsCount: 0, followersCount: 0, followingCount: 0 }));
  }
  for (let i = 0; i < ids.length; i++) {
    for (let step = 1; step <= 12; step++) await follow(ctx, ids[i], ids[(i + step) % ids.length]);
    await follow(ctx, ids[i], viewer._id);
    if (i < 12) await follow(ctx, viewer._id, ids[i]);
  }
  return { profiles: ids.length, viewer: viewer.username };
}});
export const existingPost = internalQuery({ args: { index: v.number() }, returns: v.union(v.id('posts'), v.null()), handler: async (ctx, { index }) => {
  requireDevelopment(); return (await ctx.db.query('posts').withIndex('by_seedKey', q => q.eq('seedKey', postPlan(index).key)).unique())?._id ?? null;
}});
export const insertPost = internalMutation({ args: { index: v.number(), storageId: v.id('_storage'), width: v.number(), height: v.number() }, returns: v.object({ postId: v.id('posts'), storageId: v.id('_storage') }), handler: async (ctx, args) => {
  requireDevelopment(); if (!Number.isInteger(args.index) || args.index < 0 || args.index >= SEED_POSTS) throw new Error('Invalid seed index.');
  const plan = postPlan(args.index);
  const existing = await ctx.db.query('posts').withIndex('by_seedKey', q => q.eq('seedKey', plan.key)).unique(); if (existing) return { postId: existing._id, storageId: existing.storageId };
  const author = await ctx.db.query('profiles').withIndex('by_seedKey', q => q.eq('seedKey', seedKey(plan.author))).unique();
  if (!author?.isDemo) throw new Error('Initialize seed profiles first.');
  const uploadId = await ctx.db.insert('uploads', { ownerId: author._id, purpose: 'post', kind: 'image', width: args.width, height: args.height, state: 'published', storageId: args.storageId, expiresAt: 0 });
  const postId = await ctx.db.insert('posts', { authorId: author._id, uploadId, storageId: args.storageId, kind: 'image', width: args.width, height: args.height, caption: plan.caption, likesCount: 0, commentsCount: 0, seedKey: plan.key });
  await ctx.db.patch('uploads', uploadId, { postId });
  await ctx.db.patch('profiles', author._id, { postsCount: author.postsCount + 1 });
  let likes = 0; let replies = 0;
  for (let offset = 1; offset <= 24; offset++) {
    const profile = await ctx.db.query('profiles').withIndex('by_seedKey', q => q.eq('seedKey', seedKey((plan.author + offset) % 24))).unique();
    if (!profile) throw new Error('Missing seed profile.');
    if (offset <= 12 + args.index % 10) { await ctx.db.insert('likes', { userId: profile._id, postId }); likes++; }
    if (offset <= (args.index % 9 === 0 ? 24 : 6)) {
      await ctx.db.insert('comments', { authorId: profile._id, postId, text: comments[(args.index + offset) % comments.length], requestId: `${plan.key}:comment:${offset}` }); replies++;
    }
  }
  await ctx.db.patch('posts', postId, { likesCount: likes, commentsCount: replies }); return { postId, storageId: args.storageId };
}});
export const populate = internalAction({ args: { start: v.number(), count: v.number() }, returns: v.object({ created: v.number(), skipped: v.number() }), handler: async (ctx, args): Promise<{ created: number; skipped: number }> => {
  requireDevelopment(); if (!Number.isInteger(args.start) || args.start < 0 || !Number.isInteger(args.count) || args.count < 1 || args.count > 12) throw new Error('Use batches of 1–12 posts.');
  let created = 0; let skipped = 0;
  for (let i = args.start; i < Math.min(args.start + args.count, SEED_POSTS); i++) {
    if (await ctx.runQuery(internal.seed.existingPost, { index: i })) { skipped++; continue; }
    const asset = await ctx.runQuery(internal.seed.asset, { key: postPlan(i).asset }); if (!asset) throw new Error('Upload seed assets first.');
    const blob = await ctx.storage.get(asset.storageId); if (!blob) throw new Error('Missing seed image.');
    // Every post owns its file, so deleting one can never break another's media.
    const storageId = await ctx.storage.store(blob);
    try {
      const accepted = await ctx.runMutation(internal.seed.insertPost, { index: i, storageId, width: asset.width, height: asset.height });
      if (accepted.storageId !== storageId) { await ctx.storage.delete(storageId); skipped++; } else created++;
    }
    catch (e) { await ctx.storage.delete(storageId); throw e; }
  }
  return { created, skipped };
}});
export const summary = internalQuery({ args: { username: v.string() }, returns: v.object({ profiles: v.number(), posts: v.number(), likes: v.number(), comments: v.number(), viewerFollowers: v.number(), viewerFollowing: v.number() }), handler: async (ctx, args) => {
  requireDevelopment(); let profiles = 0; let posts = 0; let likes = 0; let comments = 0;
  for (let i = 0; i < members.length; i++) if (await ctx.db.query('profiles').withIndex('by_seedKey', q => q.eq('seedKey', seedKey(i))).unique()) profiles++;
  for (let i = 0; i < SEED_POSTS; i++) { const post = await ctx.db.query('posts').withIndex('by_seedKey', q => q.eq('seedKey', postPlan(i).key)).unique(); if (post) { posts++; likes += post.likesCount; comments += post.commentsCount; } }
  const viewer = await ctx.db.query('profiles').withIndex('by_username', q => q.eq('username', args.username)).unique();
  return { profiles, posts, likes, comments, viewerFollowers: viewer?.followersCount ?? 0, viewerFollowing: viewer?.followingCount ?? 0 };
}});
