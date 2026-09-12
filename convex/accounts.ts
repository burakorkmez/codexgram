import { ConvexError, v } from 'convex/values';
import { env, mutation, query, internalMutation, internalQuery, internalAction, type MutationCtx } from './_generated/server';
import { internal } from './_generated/api';
import type { Id } from './_generated/dataModel';
import schema from './schema';
import { requireIdentity } from './lib/auth';

const state = v.union(v.literal('pending'), v.literal('cleanup'), v.literal('complete'), v.literal('failed'));
export const status = query({ args: {}, returns: v.union(v.object({ state, error: v.optional(v.string()) }), v.null()), handler: async ctx => {
  const identity = await requireIdentity(ctx);
  const job = await ctx.db.query('accountDeletions').withIndex('by_tokenIdentifier', q => q.eq('tokenIdentifier', identity.tokenIdentifier)).unique();
  return job ? { state: job.state, error: job.error } : null;
}});
// No client-supplied account identifier: only the current identity can request deletion.
export const requestDeletion = mutation({ args: {}, returns: v.null(), handler: async ctx => {
  const identity = await requireIdentity(ctx);
  if (!env.CLERK_SECRET_KEY) throw new ConvexError('Account deletion is temporarily unavailable. Please try again later.');
  const existing = await ctx.db.query('accountDeletions').withIndex('by_tokenIdentifier', q => q.eq('tokenIdentifier', identity.tokenIdentifier)).unique();
  if (existing && existing.state !== 'failed') return null;
  const profile = await ctx.db.query('profiles').withIndex('by_tokenIdentifier', q => q.eq('tokenIdentifier', identity.tokenIdentifier)).unique();
  if (!profile || profile.isDemo) throw new ConvexError('A real signed-in account is required.');
  const id = existing?._id ?? await ctx.db.insert('accountDeletions', { tokenIdentifier: identity.tokenIdentifier, clerkUserId: identity.subject, profileId: profile._id, state: 'pending', attempts: 0, nextAttemptAt: Date.now() + 60000 });
  if (existing) await ctx.db.patch('accountDeletions', id, { state: 'pending', attempts: 0, nextAttemptAt: Date.now() + 60000, error: undefined });
  await ctx.db.patch('profiles', profile._id, { deletionRequested: true });
  await ctx.scheduler.runAfter(0, internal.accounts.deleteIdentity, { id });
  await ctx.scheduler.runAfter(60000, internal.accounts.watchdog, { id });
  return null;
}});
export const getJob = internalQuery({ args: { id: v.id('accountDeletions') }, returns: v.union(schema.doc('accountDeletions'), v.null()), handler: (ctx, { id }) => ctx.db.get('accountDeletions', id) });
export const deleteIdentity = internalAction({ args: { id: v.id('accountDeletions') }, returns: v.null(), handler: async (ctx, { id }) => {
  const job = await ctx.runQuery(internal.accounts.getJob, { id });
  if (!job || job.state !== 'pending' || !job.clerkUserId) return null;
  const key = env.CLERK_SECRET_KEY;
  if (!key) { await ctx.runMutation(internal.accounts.identityResult, { id, result: 'failed' }); return null; }
  let result: 'deleted' | 'retry' | 'failed';
  try {
    const response = await fetch(`https://api.clerk.com/v1/users/${encodeURIComponent(job.clerkUserId)}`, { method: 'DELETE', headers: { Authorization: `Bearer ${key}` } });
    // DELETE is idempotent. A previous successful attempt may have lost its response.
    result = response.ok || response.status === 404 ? 'deleted' : response.status === 429 || response.status >= 500 ? 'retry' : 'failed';
  } catch { result = 'retry'; }
  await ctx.runMutation(internal.accounts.identityResult, { id, result });
  return null;
}});
export const identityResult = internalMutation({ args: { id: v.id('accountDeletions'), result: v.union(v.literal('deleted'), v.literal('retry'), v.literal('failed')) }, returns: v.null(), handler: async (ctx, { id, result }) => {
  const job = await ctx.db.get('accountDeletions', id); if (!job || job.state !== 'pending') return null;
  if (result === 'deleted') {
    await ctx.db.patch('accountDeletions', id, { state: 'cleanup', clerkUserId: undefined, error: undefined });
    await ctx.scheduler.runAfter(0, internal.accounts.cleanup, { id });
  } else if (result === 'retry') {
    await ctx.db.patch('accountDeletions', id, { attempts: job.attempts + 1, nextAttemptAt: Date.now() + Math.min(3600000, 5000 * 2 ** Math.min(job.attempts, 10)) });
  } else {
    await ctx.db.patch('accountDeletions', id, { state: 'failed', error: 'Could not delete your sign-in account. Your data has not been removed. Please try again or contact support.' });
  }
  return null;
}});
async function deleteFile(ctx: MutationCtx, id: Id<'_storage'>) { if (await ctx.db.system.get('_storage', id)) await ctx.storage.delete(id); }
async function again(ctx: MutationCtx, id: Id<'accountDeletions'>) { await ctx.scheduler.runAfter(0, internal.accounts.cleanup, { id }); return null; }
// Each transaction processes one bounded batch; cleanup survives app closure and sign-out.
export const cleanup = internalMutation({ args: { id: v.id('accountDeletions') }, returns: v.null(), handler: async (ctx, { id }) => {
  const job = await ctx.db.get('accountDeletions', id); if (!job || job.state !== 'cleanup') return null;
  const ownerId = job.profileId; const batch = 25;
  const posts = await ctx.db.query('posts').withIndex('by_authorId', q => q.eq('authorId', ownerId)).take(batch);
  if (posts.length) {
    for (const post of posts) { await deleteFile(ctx, post.storageId); await ctx.db.delete('posts', post._id); await ctx.scheduler.runAfter(0, internal.posts.cleanup, { postId: post._id }); }
    return again(ctx, id);
  }
  const stories = await ctx.db.query('stories').withIndex('by_authorId', q => q.eq('authorId', ownerId)).take(batch);
  if (stories.length) { for (const story of stories) { await deleteFile(ctx, story.storageId); await ctx.db.delete('stories', story._id); } return again(ctx, id); }
  const comments = await ctx.db.query('comments').withIndex('by_authorId_and_requestId', q => q.eq('authorId', ownerId)).take(batch);
  if (comments.length) {
    for (const comment of comments) {
      const post = await ctx.db.get('posts', comment.postId); if (post) await ctx.db.patch('posts', post._id, { commentsCount: Math.max(0, post.commentsCount - 1) });
      await ctx.db.delete('comments', comment._id); await ctx.scheduler.runAfter(0, internal.postInteractions.cleanupComment, { commentId: comment._id });
    }
    return again(ctx, id);
  }
  const likes = await ctx.db.query('likes').withIndex('by_userId_and_postId', q => q.eq('userId', ownerId)).take(batch);
  if (likes.length) {
    for (const like of likes) { const post = await ctx.db.get('posts', like.postId); if (post) await ctx.db.patch('posts', post._id, { likesCount: Math.max(0, post.likesCount - 1) }); await ctx.db.delete('likes', like._id); }
    return again(ctx, id);
  }
  const bookmarks = await ctx.db.query('bookmarks').withIndex('by_userId_and_postId', q => q.eq('userId', ownerId)).take(batch);
  if (bookmarks.length) { for (const row of bookmarks) await ctx.db.delete('bookmarks', row._id); return again(ctx, id); }
  const commentLikes = await ctx.db.query('commentLikes').withIndex('by_userId_and_commentId', q => q.eq('userId', ownerId)).take(batch);
  if (commentLikes.length) { for (const row of commentLikes) await ctx.db.delete('commentLikes', row._id); return again(ctx, id); }
  const outgoing = await ctx.db.query('follows').withIndex('by_followerId_and_followingId', q => q.eq('followerId', ownerId)).take(batch);
  const incoming = await ctx.db.query('follows').withIndex('by_followingId', q => q.eq('followingId', ownerId)).take(batch);
  if (outgoing.length || incoming.length) {
    for (const row of [...outgoing, ...incoming]) {
      if (!await ctx.db.get('follows', row._id)) continue;
      const follower = await ctx.db.get('profiles', row.followerId); const following = await ctx.db.get('profiles', row.followingId);
      if (follower) await ctx.db.patch('profiles', follower._id, { followingCount: Math.max(0, follower.followingCount - 1) });
      if (following) await ctx.db.patch('profiles', following._id, { followersCount: Math.max(0, following.followersCount - 1) });
      await ctx.db.delete('follows', row._id);
    }
    return again(ctx, id);
  }
  const conversation = await ctx.db.query('conversations').withIndex('by_participantA_and_participantB', q => q.eq('participantA', ownerId)).first()
    ?? await ctx.db.query('conversations').withIndex('by_participantB', q => q.eq('participantB', ownerId)).first();
  if (conversation) {
    const messages = await ctx.db.query('messages').withIndex('by_conversationId_and_sequence', q => q.eq('conversationId', conversation._id)).take(batch);
    for (const message of messages) await ctx.db.delete('messages', message._id);
    if (!messages.length) {
      for (const userId of [conversation.participantA, conversation.participantB]) {
        const inbox = await ctx.db.query('inbox').withIndex('by_userId_and_conversationId', q => q.eq('userId', userId).eq('conversationId', conversation._id)).unique();
        if (inbox) await ctx.db.delete('inbox', inbox._id);
      }
      await ctx.db.delete('conversations', conversation._id);
    }
    return again(ctx, id);
  }
  const uploads = await ctx.db.query('uploads').withIndex('by_ownerId', q => q.eq('ownerId', ownerId)).take(batch);
  if (uploads.length) { for (const upload of uploads) { if (upload.storageId) await deleteFile(ctx, upload.storageId); await ctx.db.delete('uploads', upload._id); } return again(ctx, id); }
  const profile = await ctx.db.get('profiles', ownerId);
  if (profile) { if (profile.avatarId) await deleteFile(ctx, profile.avatarId); await ctx.db.delete('profiles', profile._id); }
  // Retain only the auth tombstone to prevent unexpired JWTs recreating the deleted account.
  await ctx.db.patch('accountDeletions', id, { state: 'complete', error: undefined });
  return null;
}});

// Scheduled actions are at-most-once. Recover if a worker dies after Clerk responds
// but before recording the result; replaying DELETE safely receives a 404.
export const watchdog = internalMutation({ args: { id: v.id('accountDeletions') }, returns: v.null(), handler: async (ctx, { id }) => {
  const job = await ctx.db.get('accountDeletions', id);
  if (!job || job.state === 'complete' || job.state === 'failed') return null;
  if (job.state === 'cleanup') await ctx.scheduler.runAfter(0, internal.accounts.cleanup, { id });
  else if ((job.nextAttemptAt ?? 0) <= Date.now()) {
    await ctx.db.patch('accountDeletions', id, { nextAttemptAt: Date.now() + 60000 });
    await ctx.scheduler.runAfter(0, internal.accounts.deleteIdentity, { id });
  }
  await ctx.scheduler.runAfter(60000, internal.accounts.watchdog, { id });
  return null;
}});
