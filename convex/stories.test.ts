/// <reference types="vite/client" />
import { convexTest } from 'convex-test';
import { afterEach, expect, test, vi } from 'vitest';
import schema from './schema';
import { api } from './_generated/api';
const modules = import.meta.glob('./**/*.ts');
afterEach(() => vi.useRealTimers());
async function setup() {
  vi.useFakeTimers(); const t = convexTest(schema, modules);
  const alice = t.withIdentity({ subject: 'alice', tokenIdentifier: 'https://clerk.test|alice' });
  const bob = t.withIdentity({ subject: 'bob', tokenIdentifier: 'https://clerk.test|bob' });
  await alice.mutation(api.profiles.create, { username: 'alice', name: 'Alice' });
  await bob.mutation(api.profiles.create, { username: 'bob', name: 'Bob' });
  const uploadId = await alice.mutation(api.uploads.begin, { purpose: 'story', kind: 'image', width: 100, height: 100 });
  return { t, alice, bob, uploadId };
}
test('story upload, retry-safe publication, authenticated viewing, and owner deletion', async () => {
  const { t, alice, bob, uploadId } = await setup();
  await expect(alice.mutation(api.stories.publish, { uploadId, caption: 'Hello' })).rejects.toThrow('incomplete');
  expect((await bob.fetch(`/upload?id=${uploadId}`, { method: 'POST' })).status).toBe(404);
  expect((await alice.fetch(`/upload?id=${uploadId}`, { method: 'POST', headers: { 'Content-Type': 'image/jpeg' }, body: new Uint8Array([255, 216, 255]) })).status).toBe(200);
  await expect(bob.mutation(api.stories.publish, { uploadId, caption: 'stolen' })).rejects.toThrow('Not authorized');
  await expect(alice.mutation(api.posts.publish, { uploadId, caption: 'wrong purpose' })).rejects.toThrow('Not authorized');
  await expect(alice.mutation(api.stories.publish, { uploadId, caption: 'x'.repeat(281) })).rejects.toThrow('280');
  const id = await alice.mutation(api.stories.publish, { uploadId, caption: 'Hello' });
  expect(await alice.mutation(api.stories.publish, { uploadId, caption: 'retry' })).toBe(id);
  const list = await bob.query(api.stories.list, { now: Date.now() });
  expect(list).toHaveLength(1); expect(list[0].caption).toBe('Hello'); expect(list[0].author.isOwn).toBe(false);
  expect(list[0]).not.toHaveProperty('storageId'); expect(list[0].author).not.toHaveProperty('tokenIdentifier');
  await expect(t.query(api.stories.list, { now: Date.now() })).rejects.toThrow('sign in');
  expect((await t.fetch(`/media?kind=story&id=${id}`)).status).toBe(401);
  expect((await bob.fetch(`/media?kind=story&id=${id}`)).status).toBe(200);
  await expect(bob.mutation(api.stories.remove, { id })).rejects.toThrow('Not authorized');
  await alice.mutation(api.stories.remove, { id });
  expect(await bob.query(api.stories.list, { now: Date.now() })).toHaveLength(0);
  expect((await bob.fetch(`/media?kind=story&id=${id}`)).status).toBe(404);
  await expect(alice.mutation(api.stories.publish, { uploadId, caption: 'retry' })).rejects.toThrow('deleted');
  await t.finishAllScheduledFunctions(() => vi.runAllTimers());
});
test('stories expire after 24h and scheduled cleanup removes the photo', async () => {
  const { t, alice, bob, uploadId } = await setup();
  await alice.fetch(`/upload?id=${uploadId}`, { method: 'POST', headers: { 'Content-Type': 'image/jpeg' }, body: new Uint8Array([255, 216, 255]) });
  const id = await alice.mutation(api.stories.publish, { uploadId, caption: '' });
  const storageId = await t.run(async ctx => (await ctx.db.get('stories', id))!.storageId);
  expect(await bob.query(api.stories.list, { now: Date.now() + 86400000 })).toHaveLength(0);
  await t.finishAllScheduledFunctions(() => vi.runAllTimers());
  expect(await t.run(ctx => ctx.db.get('stories', id))).toBeNull();
  expect(await t.run(ctx => ctx.storage.get(storageId))).toBeNull();
  expect(await t.run(ctx => ctx.db.get('uploads', uploadId))).toBeNull();
  expect((await bob.fetch(`/media?kind=story&id=${id}`)).status).toBe(404);
});
test('stories reject video uploads and unauthenticated creation', async () => {
  const { t, alice } = await setup();
  const args = { purpose: 'story' as const, kind: 'video' as const, width: 100, height: 100, duration: 5 };
  await expect(alice.mutation(api.uploads.begin, args)).rejects.toThrow();
  await expect(t.mutation(api.uploads.begin, { ...args, kind: 'image' })).rejects.toThrow('sign in');
  await t.finishAllScheduledFunctions(() => vi.runAllTimers());
});
