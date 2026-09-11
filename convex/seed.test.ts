/// <reference types="vite/client" />
import { convexTest } from 'convex-test';
import { afterEach, expect, test, vi } from 'vitest';
import schema from './schema';
import { api, internal } from './_generated/api';
const modules = import.meta.glob('./**/*.ts');
afterEach(() => vi.unstubAllEnvs());
test('seed is development-only', async () => {
  vi.stubEnv('CONVEX_CLOUD_URL', 'https://production.convex.cloud');
  const t = convexTest(schema, modules);
  await expect(t.mutation(internal.seed.initialize, { username: 'burakorkmez' })).rejects.toThrow('restricted');
});
test('seeding twice preserves real profiles and posts and does not duplicate data or counters', async () => {
  vi.stubEnv('CONVEX_CLOUD_URL', 'https://savory-raven-325.eu-west-1.convex.cloud');
  const t = convexTest(schema, modules);
  const viewer = t.withIdentity({ subject: 'burak', tokenIdentifier: 'clerk|burak' });
  const viewerId = await viewer.mutation(api.profiles.create, { username: 'burakorkmez', name: 'Burak' });
  const storageId = await t.run(ctx => ctx.storage.store(new Blob(['sample'], { type: 'image/png' })));
  for (let i = 1; i <= 9; i++) await t.mutation(internal.seed.registerAsset, { key: `photo-${i}`, storageId, width: 100, height: 100 });
  await t.mutation(internal.seed.initialize, { username: 'burakorkmez' });
  const first = await t.action(internal.seed.populate, { start: 0, count: 3 });
  expect(first).toEqual({ created: 3, skipped: 0 });
  const totals = await t.query(internal.seed.summary, { username: 'burakorkmez' });
  expect(totals).toMatchObject({ profiles: 24, posts: 3, viewerFollowers: 24, viewerFollowing: 12 });
  await t.mutation(internal.seed.initialize, { username: 'burakorkmez' });
  expect(await t.action(internal.seed.populate, { start: 0, count: 3 })).toEqual({ created: 0, skipped: 3 });
  expect(await t.query(internal.seed.summary, { username: 'burakorkmez' })).toEqual(totals);
  const me = await viewer.query(api.profiles.me, {});
  expect(me).toMatchObject({ _id: viewerId, username: 'burakorkmez', postsCount: 0, isDemo: false });
  const home = await viewer.query(api.posts.list, { feed: 'home', paginationOpts: { numItems: 20, cursor: null } });
  expect(home.page).toHaveLength(3); expect(home.page.every(p => p.author.isDemo)).toBe(true);
  const files = await t.run(ctx => ctx.db.query('posts').withIndex('by_creation_time').take(10));
  expect(new Set(files.map(p => p.storageId)).size).toBe(3);
  expect(files.every(p => p.storageId !== storageId)).toBe(true);
  const fake = t.withIdentity({ subject: 'fake', tokenIdentifier: 'fictional:community-v1:member:0' });
  await expect(fake.query(api.posts.list, { feed: 'home', paginationOpts: { numItems: 20, cursor: null } })).rejects.toThrow('cannot sign in');
});
