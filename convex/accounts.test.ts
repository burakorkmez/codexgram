/// <reference types="vite/client" />
import { convexTest } from 'convex-test';
import { afterEach, expect, test, vi } from 'vitest';
import schema from './schema';
import { api, internal } from './_generated/api';
const modules = import.meta.glob('./**/*.ts');
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); vi.unstubAllEnvs(); });
async function setup() {
  vi.useFakeTimers(); vi.stubEnv('CLERK_SECRET_KEY', 'test-only-secret');
  const t = convexTest(schema, modules);
  const alice = t.withIdentity({ subject: 'user_alice', tokenIdentifier: 'https://clerk.test|user_alice' });
  const bob = t.withIdentity({ subject: 'user_bob', tokenIdentifier: 'https://clerk.test|user_bob' });
  const aliceId = await alice.mutation(api.profiles.create, { username: 'alice', name: 'Alice' });
  const bobId = await bob.mutation(api.profiles.create, { username: 'bob', name: 'Bob' });
  return { t, alice, bob, aliceId, bobId };
}
async function post(actor: Awaited<ReturnType<typeof setup>>['alice']) {
  const uploadId = await actor.mutation(api.uploads.begin, { purpose: 'post', kind: 'image', width: 100, height: 100 });
  const response = await actor.fetch(`/upload?id=${uploadId}`, { method: 'POST', headers: { 'Content-Type': 'image/jpeg' }, body: new Uint8Array([255, 216, 255, 224, 1]) });
  expect(response.status).toBe(200);
  return actor.mutation(api.posts.publish, { uploadId, caption: 'A photo' });
}
test('request is authenticated, owner-derived, idempotent, and locks writes and uploads', async () => {
  const { t, alice, bob, aliceId, bobId } = await setup();
  const uploadId = await alice.mutation(api.uploads.begin, { purpose: 'avatar', kind: 'image', width: 1, height: 1 });
  await expect(t.mutation(api.accounts.requestDeletion, {})).rejects.toThrow('sign in');
  await expect(alice.mutation(api.accounts.requestDeletion, { profileId: bobId } as never)).rejects.toThrow();
  await alice.mutation(api.accounts.requestDeletion, {}); await alice.mutation(api.accounts.requestDeletion, {});
  expect(await alice.query(api.accounts.status, {})).toEqual({ state: 'pending' });
  expect(await bob.query(api.accounts.status, {})).toBeNull();
  expect(await t.run(ctx => ctx.db.query('accountDeletions').collect())).toHaveLength(1);
  await expect(alice.mutation(api.profiles.update, { username: 'changed', name: 'Alice', bio: '', website: '', location: '' })).rejects.toThrow('deletion');
  await expect(alice.mutation(api.profiles.create, { username: 'new', name: 'Alice' })).rejects.toThrow('deletion');
  await expect(bob.mutation(api.social.setFollow, { profileId: aliceId, following: true })).rejects.toThrow('unavailable');
  await expect(bob.mutation(api.messaging.start, { profileId: aliceId })).rejects.toThrow();
  expect(await t.query(internal.uploads.forUpload, { id: uploadId, tokenIdentifier: 'https://clerk.test|user_alice' })).toBeNull();
  const storageId = await t.run(ctx => ctx.storage.store(new Blob(['late upload'])));
  await expect(t.mutation(internal.uploads.finish, { id: uploadId, storageId, tokenIdentifier: 'https://clerk.test|user_alice' })).rejects.toThrow('expired');
});
test('missing configuration fails before changing the account', async () => {
  const { t, alice, aliceId } = await setup(); vi.stubEnv('CLERK_SECRET_KEY', '');
  await expect(alice.mutation(api.accounts.requestDeletion, {})).rejects.toThrow('temporarily unavailable');
  expect(await alice.query(api.accounts.status, {})).toBeNull();
  expect((await t.run(ctx => ctx.db.get('profiles', aliceId)))?.deletionRequested).toBeUndefined();
});
test('deletion cleans multiple batches and media, repairs counters, preserves unrelated accounts', async () => {
  const { t, alice, bob, aliceId, bobId } = await setup();
  const alicePost = await post(alice); const bobPost = await post(bob);
  const commentId = await alice.mutation(api.social.addComment, { postId: bobPost, text: 'Hello', requestId: 'a1' });
  const bobComment = await bob.mutation(api.social.addComment, { postId: alicePost, text: 'Hi', requestId: 'b1' });
  await bob.mutation(api.postInteractions.setCommentLike, { commentId, liked: true });
  await alice.mutation(api.postInteractions.setCommentLike, { commentId: bobComment, liked: true });
  await alice.mutation(api.social.setLike, { postId: bobPost, liked: true });
  await bob.mutation(api.social.setLike, { postId: alicePost, liked: true });
  await alice.mutation(api.postInteractions.setBookmark, { postId: bobPost, saved: true });
  await bob.mutation(api.postInteractions.setBookmark, { postId: alicePost, saved: true });
  await alice.mutation(api.social.setFollow, { profileId: bobId, following: true });
  await bob.mutation(api.social.setFollow, { profileId: aliceId, following: true });
  const conversationId = await alice.mutation(api.messaging.start, { profileId: bobId });
  for (let i = 0; i < 28; i++) await alice.mutation(api.messaging.send, { id: conversationId, text: `Message ${i}`, requestId: `msg-${i}` });
  await bob.mutation(api.messaging.send, { id: conversationId, text: 'Reply', requestId: 'reply' });
  const extraMedia = await t.run(async ctx => {
    const avatarId = await ctx.storage.store(new Blob(['avatar']));
    await ctx.db.patch('profiles', aliceId, { avatarId });
    const storyId = await ctx.storage.store(new Blob(['story']));
    const uploadId = await ctx.db.insert('uploads', { ownerId: aliceId, purpose: 'story', kind: 'image', width: 1, height: 1, state: 'published', storageId: storyId, expiresAt: Date.now() + 100000 });
    await ctx.db.insert('stories', { authorId: aliceId, uploadId, storageId: storyId, caption: 'A story', expiresAt: Date.now() + 100000 });
    for (let i = 0; i < 28; i++) await ctx.db.insert('uploads', { ownerId: aliceId, purpose: 'post', kind: 'image', width: 1, height: 1, state: 'pending', expiresAt: Date.now() + 100000 });
    const owned = await ctx.db.get('posts', alicePost); const other = await ctx.db.get('posts', bobPost);
    return { avatarId, storyId, owned: owned!.storageId, other: other!.storageId };
  });
  const fetchMock = vi.fn().mockResolvedValue(new Response('{}', { status: 200 })); vi.stubGlobal('fetch', fetchMock);
  await alice.mutation(api.accounts.requestDeletion, {});
  await expect(bob.mutation(api.messaging.send, { id: conversationId, text: 'late', requestId: 'late' })).rejects.toThrow('unavailable');
  await t.finishAllScheduledFunctions(() => vi.runAllTimers());
  expect(fetchMock).toHaveBeenCalledWith('https://api.clerk.com/v1/users/user_alice', expect.objectContaining({ method: 'DELETE', headers: { Authorization: 'Bearer test-only-secret' } }));
  expect(await alice.query(api.accounts.status, {})).toEqual({ state: 'complete' });
  await t.run(async ctx => {
    expect(await ctx.db.get('profiles', aliceId)).toBeNull();
    const bobProfile = await ctx.db.get('profiles', bobId);
    expect(bobProfile).toMatchObject({ username: 'bob', postsCount: 1, followersCount: 0, followingCount: 0 });
    expect(await ctx.db.get('posts', bobPost)).toMatchObject({ likesCount: 0, commentsCount: 0 });
    for (const table of ['stories', 'comments', 'likes', 'bookmarks', 'commentLikes', 'follows', 'conversations', 'messages', 'inbox'] as const) expect(await ctx.db.query(table).collect(), table).toHaveLength(0);
    expect(await ctx.db.query('uploads').withIndex('by_ownerId', q => q.eq('ownerId', aliceId)).collect()).toHaveLength(0);
    for (const storageId of [extraMedia.avatarId, extraMedia.storyId, extraMedia.owned]) expect(await ctx.storage.get(storageId)).toBeNull();
    expect(await ctx.storage.get(extraMedia.other)).not.toBeNull();
  });
  await expect(alice.mutation(api.profiles.create, { username: 'alice', name: 'Alice' })).rejects.toThrow('deletion');
  await alice.mutation(api.accounts.requestDeletion, {});
  expect(await t.run(ctx => ctx.db.query('accountDeletions').collect())).toHaveLength(1);
});
test('Clerk failure keeps data; explicit retry can finish with an already-deleted identity', async () => {
  const { t, alice, aliceId } = await setup();
  const mock = vi.fn().mockResolvedValue(new Response('{}', { status: 403 })); vi.stubGlobal('fetch', mock);
  await alice.mutation(api.accounts.requestDeletion, {}); await t.finishAllScheduledFunctions(() => vi.runAllTimers());
  expect(await alice.query(api.accounts.status, {})).toMatchObject({ state: 'failed' });
  expect(await t.run(ctx => ctx.db.get('profiles', aliceId))).not.toBeNull();
  mock.mockResolvedValue(new Response('{}', { status: 404 }));
  await alice.mutation(api.accounts.requestDeletion, {}); await t.finishAllScheduledFunctions(() => vi.runAllTimers());
  expect(await alice.query(api.accounts.status, {})).toEqual({ state: 'complete' });
});
test('temporary provider failures retry without dropping the deletion request', async () => {
  const { t, alice } = await setup();
  const mock = vi.fn().mockRejectedValueOnce(new Error('network failure')).mockResolvedValueOnce(new Response('{}', { status: 429 })).mockResolvedValue(new Response('{}', { status: 200 }));
  vi.stubGlobal('fetch', mock);
  await alice.mutation(api.accounts.requestDeletion, {}); await t.finishAllScheduledFunctions(() => vi.runAllTimers());
  expect(mock.mock.calls.length).toBeGreaterThanOrEqual(3);
  expect(await alice.query(api.accounts.status, {})).toEqual({ state: 'complete' });
});
