/// <reference types="vite/client" />
import { convexTest } from 'convex-test';
import { expect, test } from 'vitest';
import schema from './schema';
import { api } from './_generated/api';
const modules = import.meta.glob('./**/*.ts');
const paginationOpts = { numItems: 20, cursor: null };
async function setup() {
  const t = convexTest(schema, modules);
  const alice = t.withIdentity({ subject: 'alice', tokenIdentifier: 'https://test|alice' });
  const bob = t.withIdentity({ subject: 'bob', tokenIdentifier: 'https://test|bob' });
  const eve = t.withIdentity({ subject: 'eve', tokenIdentifier: 'https://test|eve' });
  const aliceId = await alice.mutation(api.profiles.create, { username: 'alice', name: 'Alice' });
  const bobId = await bob.mutation(api.profiles.create, { username: 'bob', name: 'Bob' });
  const eveId = await eve.mutation(api.profiles.create, { username: 'eve', name: 'Eve' });
  const id = await alice.mutation(api.messaging.start, { profileId: bobId });
  return { t, alice, bob, eve, aliceId, bobId, eveId, id };
}
test('one canonical conversation is reused by either participant; empty threads stay out of inbox', async () => {
  const { alice, bob, aliceId, bobId, id } = await setup();
  expect(await bob.mutation(api.messaging.start, { profileId: aliceId })).toBe(id);
  expect(await alice.mutation(api.messaging.start, { profileId: bobId })).toBe(id);
  expect((await alice.query(api.messaging.list, { unreadOnly: false, paginationOpts })).page).toHaveLength(0);
  await expect(alice.mutation(api.messaging.start, { profileId: aliceId })).rejects.toThrow('yourself');
});
test('anonymous and non-participants cannot get, read, send, or change unread state', async () => {
  const { t, alice, eve, bobId, id } = await setup();
  await alice.mutation(api.messaging.send, { id, text: 'Private', requestId: 'one' });
  for (const actor of [t, eve]) {
    await expect(actor.query(api.messaging.get, { id })).rejects.toThrow();
    await expect(actor.query(api.messaging.history, { id, paginationOpts })).rejects.toThrow();
    await expect(actor.mutation(api.messaging.send, { id, text: 'Intrusion', requestId: 'hack' })).rejects.toThrow();
    await expect(actor.mutation(api.messaging.markRead, { id, throughSequence: 1 })).rejects.toThrow();
  }
  await expect(t.query(api.messaging.list, { unreadOnly: false, paginationOpts })).rejects.toThrow('sign in');
  await expect(t.mutation(api.messaging.start, { profileId: bobId })).rejects.toThrow('sign in');
  expect((await eve.query(api.messaging.list, { unreadOnly: false, paginationOpts })).page).toHaveLength(0);
});
test('retry is idempotent and cannot change text or conversation; limits and demo recipients enforced', async () => {
  const { t, alice, bob, bobId, eveId, id } = await setup();
  const message = await alice.mutation(api.messaging.send, { id, text: ' Hello ', requestId: 'one' });
  expect(await alice.mutation(api.messaging.send, { id, text: 'Hello', requestId: 'one' })).toBe(message);
  await expect(alice.mutation(api.messaging.send, { id, text: 'Edited', requestId: 'one' })).rejects.toThrow('Retry');
  const other = await alice.mutation(api.messaging.start, { profileId: eveId });
  await expect(alice.mutation(api.messaging.send, { id: other, text: 'Hello', requestId: 'one' })).rejects.toThrow('Retry');
  for (const text of ['   ', 'x'.repeat(2001)]) await expect(alice.mutation(api.messaging.send, { id, text, requestId: 'bad' })).rejects.toThrow('characters');
  await bob.mutation(api.messaging.send, { id, text: 'Same key, different sender', requestId: 'one' });
  expect((await alice.query(api.messaging.history, { id, paginationOpts })).page).toHaveLength(2);
  await t.run(ctx => ctx.db.patch('profiles', bobId, { isDemo: true }));
  await expect(alice.mutation(api.messaging.start, { profileId: bobId })).rejects.toThrow('Fictional');
});
test('unread follows incoming sequence; stale read cannot clear a newer message or regress read state', async () => {
  const { alice, bob, id } = await setup();
  const unread = () => bob.query(api.messaging.list, { unreadOnly: true, paginationOpts });
  await alice.mutation(api.messaging.send, { id, text: 'One', requestId: 'one' });
  await alice.mutation(api.messaging.send, { id, text: 'Two', requestId: 'two' });
  await bob.mutation(api.messaging.markRead, { id, throughSequence: 1 });
  expect((await unread()).page).toHaveLength(1);
  await bob.mutation(api.messaging.send, { id, text: 'Reply', requestId: 'reply' });
  expect((await unread()).page).toHaveLength(1);
  await bob.mutation(api.messaging.markRead, { id, throughSequence: 3 });
  await bob.mutation(api.messaging.markRead, { id, throughSequence: 1 });
  expect((await unread()).page).toHaveLength(0);
  await expect(bob.mutation(api.messaging.markRead, { id, throughSequence: 4 })).rejects.toThrow('Invalid');
  await expect(bob.mutation(api.messaging.markRead, { id, throughSequence: 1.5 })).rejects.toThrow('Invalid');
  expect((await alice.query(api.messaging.list, { unreadOnly: true, paginationOpts })).page).toHaveLength(1);
});
test('history paginates without duplication and inbox reflects the latest reply', async () => {
  const { alice, bob, id } = await setup();
  for (let i = 0; i < 7; i++) await alice.mutation(api.messaging.send, { id, text: `Message ${i}`, requestId: `${i}` });
  const first = await bob.query(api.messaging.history, { id, paginationOpts: { numItems: 3, cursor: null } });
  const second = await bob.query(api.messaging.history, { id, paginationOpts: { numItems: 3, cursor: first.continueCursor } });
  expect(first.page.map(item => item.sequence)).toEqual([7, 6, 5]);
  expect(second.page.map(item => item.sequence)).toEqual([4, 3, 2]);
  expect(first.page.every(item => !item.outgoing)).toBe(true);
  expect((await bob.query(api.messaging.list, { unreadOnly: false, paginationOpts })).page[0].preview).toBe('Message 6');
  await bob.mutation(api.messaging.send, { id, text: 'Reply', requestId: 'reply' });
  expect((await alice.query(api.messaging.list, { unreadOnly: false, paginationOpts })).page[0].preview).toBe('Reply');
});
