/// <reference types="vite/client" />
import { convexTest } from 'convex-test';
import { afterEach, expect, test, vi } from 'vitest';
import schema from './schema';
import { api, internal } from './_generated/api';
import type { Id } from './_generated/dataModel';
const modules = import.meta.glob('./**/*.ts');
const paginationOpts = { numItems: 20, cursor: null };
afterEach(() => vi.useRealTimers());
async function setup() {
  vi.useFakeTimers();
  const t = convexTest(schema, modules);
  const alice = t.withIdentity({ subject: 'alice', tokenIdentifier: 'https://clerk.test|alice' });
  const bob = t.withIdentity({ subject: 'bob', tokenIdentifier: 'https://clerk.test|bob' });
  const aliceId = await alice.mutation(api.profiles.create, { username: 'alice', name: 'Alice' });
  const bobId = await bob.mutation(api.profiles.create, { username: 'bob', name: 'Bob' });
  return { t, alice, bob, aliceId, bobId };
}
async function uploadPost(actor: Awaited<ReturnType<typeof setup>>['alice'], caption = 'Hello') {
  const uploadId = await actor.mutation(api.uploads.begin, { purpose: 'post', kind: 'image', width: 1200, height: 800 });
  const result = await actor.fetch(`/upload?id=${uploadId}`, { method: 'POST', headers: { 'Content-Type': 'image/jpeg' }, body: new Uint8Array([255, 216, 255, 224, 1, 2, 3, 4]) });
  expect(result.status).toBe(200);
  return { uploadId, postId: await actor.mutation(api.posts.publish, { uploadId, caption }) };
}
test('profiles are idempotent, normalized, unique and do not expose Clerk identity', async () => {
  const { t, alice, bob, aliceId } = await setup();
  expect(await alice.mutation(api.profiles.create, { username: 'different', name: 'Changed' })).toBe(aliceId);
  await expect(bob.mutation(api.profiles.update, { username: 'ALICE', name: 'Bob', bio: '', website: '', location: '' })).rejects.toThrow('already taken');
  await expect(t.query(api.profiles.me, {})).rejects.toThrow('sign in');
  expect(await alice.query(api.profiles.me, {})).not.toHaveProperty('tokenIdentifier');
  const foreignIssuer = t.withIdentity({ subject: 'alice', tokenIdentifier: 'https://different.test|alice' });
  expect(await foreignIssuer.query(api.profiles.me, {})).toBeNull();
});
test('upload, publication retry, feed scope, likes and follows work across two users', async () => {
  const { t, alice, bob, aliceId, bobId } = await setup(); const { uploadId, postId } = await uploadPost(alice);
  expect(await alice.mutation(api.posts.publish, { uploadId, caption: 'retry' })).toBe(postId);
  expect((await alice.query(api.posts.list, { feed: 'home', paginationOpts })).page).toHaveLength(1);
  expect((await bob.query(api.posts.list, { feed: 'home', paginationOpts })).page).toHaveLength(0);
  expect((await bob.query(api.posts.list, { feed: 'explore', paginationOpts })).page).toHaveLength(1);
  await bob.mutation(api.social.setFollow, { profileId: aliceId, following: true });
  await bob.mutation(api.social.setFollow, { profileId: aliceId, following: true });
  expect((await bob.query(api.posts.list, { feed: 'home', paginationOpts })).page).toHaveLength(1);
  expect((await alice.query(api.profiles.me, {}))?.followersCount).toBe(1);
  expect((await bob.query(api.profiles.me, {}))?.followingCount).toBe(1);
  expect((await bob.query(api.social.connections, { profileId: aliceId, kind: 'followers', paginationOpts })).page[0]._id).toBe(bobId);
  await bob.mutation(api.social.setLike, { postId, liked: true }); await bob.mutation(api.social.setLike, { postId, liked: true });
  expect((await alice.query(api.posts.get, { id: postId }))?.likesCount).toBe(1);
  await bob.mutation(api.social.setLike, { postId, liked: false }); await bob.mutation(api.social.setFollow, { profileId: aliceId, following: false });
  expect((await alice.query(api.posts.get, { id: postId }))?.likesCount).toBe(0);
  expect((await bob.query(api.posts.list, { feed: 'home', paginationOpts })).page).toHaveLength(0);
  await expect(alice.mutation(api.social.setFollow, { profileId: aliceId, following: true })).rejects.toThrow('yourself');
  await expect(t.mutation(api.social.setLike, { postId, liked: true })).rejects.toThrow('sign in');
});
test('only the owner can publish or cancel uploads, delete posts and delete comments', async () => {
  const { t, alice, bob } = await setup(); const { uploadId, postId } = await uploadPost(alice);
  await expect(bob.mutation(api.posts.publish, { uploadId, caption: 'stolen' })).rejects.toThrow('Not authorized');
  await expect(bob.mutation(api.uploads.cancel, { id: uploadId })).rejects.toThrow('Not authorized');
  await expect(bob.mutation(api.posts.remove, { id: postId })).rejects.toThrow('Not authorized');
  const commentId = await bob.mutation(api.social.addComment, { postId, text: 'Nice!', requestId: 'one' });
  expect(await bob.mutation(api.social.addComment, { postId, text: 'Nice!', requestId: 'one' })).toBe(commentId);
  await expect(alice.mutation(api.social.deleteComment, { id: commentId })).rejects.toThrow('Not authorized');
  expect((await alice.query(api.social.comments, { postId, paginationOpts })).page[0].text).toBe('Nice!');
  await bob.mutation(api.social.deleteComment, { id: commentId });
  expect((await alice.query(api.posts.get, { id: postId }))?.commentsCount).toBe(0);
  await expect(t.query(api.posts.get, { id: postId })).rejects.toThrow('sign in');
  await expect(t.query(api.social.comments, { postId, paginationOpts })).rejects.toThrow('sign in');
});
test('post deletion removes likes, comments, media and rejects later writes', async () => {
  const { t, alice, bob } = await setup(); const { postId } = await uploadPost(alice);
  await bob.mutation(api.social.setLike, { postId, liked: true });
  await bob.mutation(api.social.addComment, { postId, text: 'Hello', requestId: 'one' });
  const storageId = await t.run(async ctx => (await ctx.db.get('posts', postId))!.storageId);
  await alice.mutation(api.posts.remove, { id: postId });
  await t.finishAllScheduledFunctions(() => vi.runAllTimers());
  expect(await alice.query(api.posts.get, { id: postId })).toBeNull();
  expect(await t.run(ctx => ctx.storage.get(storageId))).toBeNull();
  expect(await t.run(ctx => ctx.db.query('likes').withIndex('by_postId', q => q.eq('postId', postId)).take(1))).toHaveLength(0);
  expect(await t.run(ctx => ctx.db.query('comments').withIndex('by_postId', q => q.eq('postId', postId)).take(1))).toHaveLength(0);
  await expect(bob.mutation(api.social.addComment, { postId, text: 'late', requestId: 'two' })).rejects.toThrow('deleted');
});
test('media HTTP routes enforce authentication and ownership, reject invalid files, support range reads', async () => {
  const { t, alice, bob } = await setup();
  const uploadId = await alice.mutation(api.uploads.begin, { purpose: 'post', kind: 'image', width: 50, height: 50 });
  expect((await t.fetch(`/upload?id=${uploadId}`, { method: 'POST' })).status).toBe(401);
  expect((await bob.fetch(`/upload?id=${uploadId}`, { method: 'POST' })).status).toBe(404);
  expect((await alice.fetch(`/upload?id=${uploadId}`, { method: 'POST', headers: { 'Content-Type': 'image/jpeg' }, body: 'not an image' })).status).toBe(400);
  await expect(alice.mutation(api.posts.publish, { uploadId, caption: '' })).rejects.toThrow('incomplete');
  const { postId } = await uploadPost(alice);
  expect((await t.fetch(`/media?id=${postId}`)).status).toBe(401);
  const file = await bob.fetch(`/media?id=${postId}`, { headers: { Range: 'bytes=0-2' } });
  expect(file.status).toBe(206); expect(file.headers.get('Content-Range')).toBe('bytes 0-2/8');
  expect(new Uint8Array(await file.arrayBuffer())).toEqual(new Uint8Array([255, 216, 255]));
});
test('video limits, abandoned upload cleanup and upload-completion races are enforced', async () => {
  const { t, alice } = await setup();
  await expect(alice.mutation(api.uploads.begin, { purpose: 'post', kind: 'video', width: 10, height: 10, duration: 31 })).rejects.toThrow('30 seconds');
  const uploadId = await alice.mutation(api.uploads.begin, { purpose: 'post', kind: 'image', width: 50, height: 50 });
  await alice.mutation(api.uploads.cancel, { id: uploadId });
  const storageId = await t.run(ctx => ctx.storage.store(new Blob(['data'])));
  await expect(t.mutation(internal.uploads.finish, { id: uploadId, tokenIdentifier: 'https://clerk.test|alice', storageId })).rejects.toThrow('expired');
  const second = await alice.mutation(api.uploads.begin, { purpose: 'post', kind: 'image', width: 50, height: 50 });
  await alice.fetch(`/upload?id=${second}`, { method: 'POST', headers: { 'Content-Type': 'image/jpeg' }, body: new Uint8Array([255, 216, 255]) });
  const stored = await t.run(async ctx => (await ctx.db.get('uploads', second))!.storageId!);
  await t.finishAllScheduledFunctions(() => vi.runAllTimers());
  expect(await t.run(ctx => ctx.db.get('uploads', second))).toBeNull();
  expect(await t.run(ctx => ctx.storage.get(stored))).toBeNull();
});
test('paginated explore returns all posts without overlap', async () => {
  const { alice } = await setup();
  const ids: Id<'posts'>[] = [];
  for (let i = 0; i < 4; i++) ids.push((await uploadPost(alice, String(i))).postId);
  const first = await alice.query(api.posts.list, { feed: 'explore', paginationOpts: { numItems: 2, cursor: null } });
  const second = await alice.query(api.posts.list, { feed: 'explore', paginationOpts: { numItems: 2, cursor: first.continueCursor } });
  expect(new Set([...first.page, ...second.page].map(p => p._id)).size).toBe(4);
});

function movie(seconds: number, version = 0) {
  const ftyp = new Uint8Array(16); new DataView(ftyp.buffer).setUint32(0, 16); ftyp.set(new TextEncoder().encode('ftypisom'), 4);
  const mvhd = new Uint8Array(version === 1 ? 40 : 28); const m = new DataView(mvhd.buffer); m.setUint32(0, mvhd.length); mvhd.set(new TextEncoder().encode('mvhd'), 4); mvhd[8] = version;
  m.setUint32(version === 1 ? 28 : 20, 1000);
  if (version === 1) m.setBigUint64(32, BigInt(seconds * 1000)); else m.setUint32(24, seconds * 1000);
  const moov = new Uint8Array(mvhd.length + 8); new DataView(moov.buffer).setUint32(0, moov.length); moov.set(new TextEncoder().encode('moov'), 4); moov.set(mvhd, 8);
  return new Blob([ftyp, moov], { type: 'video/mp4' });
}
test('server checks actual MP4 duration instead of trusting picker metadata', async () => {
  const { alice } = await setup();
  const id = await alice.mutation(api.uploads.begin, { purpose: 'post', kind: 'video', width: 100, height: 100, duration: 5 });
  expect((await alice.fetch(`/upload?id=${id}`, { method: 'POST', headers: { 'Content-Type': 'video/mp4' }, body: movie(31) })).status).toBe(400);
  expect((await alice.fetch(`/upload?id=${id}`, { method: 'POST', headers: { 'Content-Type': 'video/mp4' }, body: movie(30, 1) })).status).toBe(200);
  const postId = await alice.mutation(api.posts.publish, { uploadId: id, caption: '' });
  expect((await alice.query(api.posts.get, { id: postId }))?.duration).toBe(30);
});
test('upload enforces byte limits even without Content-Length', async () => {
  const { alice } = await setup();
  const id = await alice.mutation(api.uploads.begin, { purpose: 'post', kind: 'image', width: 50, height: 50 });
  const body = new Uint8Array(10 * 1024 * 1024 + 1); body.set([255, 216, 255]);
  expect((await alice.fetch(`/upload?id=${id}`, { method: 'POST', headers: { 'Content-Type': 'image/jpeg' }, body })).status).toBe(413);
  await expect(alice.mutation(api.posts.publish, { uploadId: id, caption: '' })).rejects.toThrow('incomplete');
});
test('profile edits keep relationships and ownership on stable ids', async () => {
  const { alice, bob, aliceId } = await setup();
  await bob.mutation(api.social.setFollow, { profileId: aliceId, following: true });
  const { postId } = await uploadPost(alice);
  await alice.mutation(api.profiles.update, { username: 'alice.new', name: 'A New Name', bio: 'Updated', website: 'https://example.com', location: 'Bali' });
  expect((await bob.query(api.posts.get, { id: postId }))?.author.username).toBe('alice.new');
  expect((await bob.query(api.profiles.get, { id: aliceId }))?.isFollowing).toBe(true);
  expect((await bob.query(api.profiles.search, { text: 'alice.new', paginationOpts })).page[0]._id).toBe(aliceId);
});
test('avatar uploads cannot become posts and another user cannot claim them', async () => {
  const { alice, bob, aliceId } = await setup();
  const id = await alice.mutation(api.uploads.begin, { purpose: 'avatar', kind: 'image', width: 50, height: 50 });
  await alice.fetch(`/upload?id=${id}`, { method: 'POST', headers: { 'Content-Type': 'image/jpeg' }, body: new Uint8Array([255, 216, 255]) });
  await expect(bob.mutation(api.uploads.setAvatar, { uploadId: id })).rejects.toThrow('Invalid');
  await expect(alice.mutation(api.posts.publish, { uploadId: id, caption: '' })).rejects.toThrow('Not authorized');
  await alice.mutation(api.uploads.setAvatar, { uploadId: id });
  expect((await alice.query(api.profiles.me, {}))?.hasAvatar).toBe(true);
  expect((await bob.fetch(`/media?kind=avatar&id=${aliceId}`)).status).toBe(200);
});

test('bookmarks and comment likes are persistent, private per user, and retry safe', async () => {
  const { t, alice, bob } = await setup(); const { postId } = await uploadPost(alice);
  const commentId = await bob.mutation(api.social.addComment, { postId, text: 'Lovely', requestId: 'heart' });
  for (let i = 0; i < 2; i++) {
    await alice.mutation(api.postInteractions.setBookmark, { postId, saved: true });
    await alice.mutation(api.postInteractions.setCommentLike, { commentId, liked: true });
  }
  expect(await alice.query(api.postInteractions.isBookmarked, { postId })).toBe(true);
  expect(await bob.query(api.postInteractions.isBookmarked, { postId })).toBe(false);
  expect((await alice.query(api.social.comments, { postId, paginationOpts })).page[0].isLiked).toBe(true);
  expect((await bob.query(api.social.comments, { postId, paginationOpts })).page[0].isLiked).toBe(false);
  expect(await t.run(ctx => ctx.db.query('commentLikes').withIndex('by_commentId', q => q.eq('commentId', commentId)).take(10))).toHaveLength(1);
  await expect(t.mutation(api.postInteractions.setBookmark, { postId, saved: true })).rejects.toThrow('sign in');
  await expect(t.mutation(api.postInteractions.setCommentLike, { commentId, liked: true })).rejects.toThrow('sign in');
  await expect(t.query(api.postInteractions.isBookmarked, { postId })).rejects.toThrow('sign in');
  await alice.mutation(api.postInteractions.setBookmark, { postId, saved: false });
  await alice.mutation(api.postInteractions.setCommentLike, { commentId, liked: false });
  expect(await alice.query(api.postInteractions.isBookmarked, { postId })).toBe(false);
  expect((await alice.query(api.social.comments, { postId, paginationOpts })).page[0].isLiked).toBe(false);
});
test('comment sorting and deletion clean up attached comment likes and bookmarks', async () => {
  const { t, alice, bob } = await setup(); const { postId } = await uploadPost(alice);
  const first = await bob.mutation(api.social.addComment, { postId, text: 'First', requestId: 'first' });
  vi.advanceTimersByTime(1000);
  const second = await bob.mutation(api.social.addComment, { postId, text: 'Second', requestId: 'second' });
  expect((await alice.query(api.social.comments, { postId, order: 'desc', paginationOpts })).page.map(c => c._id)).toEqual([second, first]);
  expect((await alice.query(api.social.comments, { postId, order: 'asc', paginationOpts })).page.map(c => c._id)).toEqual([first, second]);
  await alice.mutation(api.postInteractions.setCommentLike, { commentId: first, liked: true });
  await bob.mutation(api.social.deleteComment, { id: first });
  await t.finishAllScheduledFunctions(() => vi.runAllTimers());
  expect(await t.run(ctx => ctx.db.query('commentLikes').withIndex('by_commentId', q => q.eq('commentId', first)).take(1))).toHaveLength(0);
  await expect(alice.mutation(api.postInteractions.setCommentLike, { commentId: first, liked: true })).rejects.toThrow('deleted');
  await alice.mutation(api.postInteractions.setCommentLike, { commentId: second, liked: true });
  await bob.mutation(api.postInteractions.setBookmark, { postId, saved: true });
  await alice.mutation(api.posts.remove, { id: postId });
  await t.finishAllScheduledFunctions(() => vi.runAllTimers());
  expect(await t.run(ctx => ctx.db.query('commentLikes').withIndex('by_postId', q => q.eq('postId', postId)).take(1))).toHaveLength(0);
  expect(await bob.query(api.postInteractions.isBookmarked, { postId })).toBe(false);
  await expect(bob.mutation(api.postInteractions.setBookmark, { postId, saved: true })).rejects.toThrow('deleted');
});
