import { paginationOptsValidator, paginationResultValidator } from 'convex/server';
import { ConvexError, v } from 'convex/values';
import { mutation, query, type QueryCtx, type MutationCtx } from './_generated/server';
import type { Id } from './_generated/dataModel';
import { requireProfile } from './lib/auth';
import { profileView, publicProfile } from './lib/views';

async function requireConversation(ctx: QueryCtx | MutationCtx, id: Id<'conversations'>) {
  const me = await requireProfile(ctx);
  const conversation = await ctx.db.get('conversations', id);
  if (!conversation || (conversation.participantA !== me._id && conversation.participantB !== me._id)) throw new ConvexError('Not authorized to access this conversation.');
  const other = await ctx.db.get('profiles', conversation.participantA === me._id ? conversation.participantB : conversation.participantA);
  if (!other || other.deletionRequested) throw new ConvexError('This member is unavailable.');
  return { me, conversation };
}
export const start = mutation({
  args: { profileId: v.id('profiles') }, returns: v.id('conversations'),
  handler: async (ctx, args) => {
    const me = await requireProfile(ctx); const other = await ctx.db.get('profiles', args.profileId);
    if (!other || other.isDemo || other.deletionRequested) throw new ConvexError('Fictional demo profiles cannot receive messages.');
    if (other._id === me._id) throw new ConvexError('You cannot message yourself.');
    const [participantA, participantB] = [me._id, other._id].sort();
    const existing = await ctx.db.query('conversations').withIndex('by_participantA_and_participantB', q => q.eq('participantA', participantA).eq('participantB', participantB)).unique();
    if (existing) return existing._id;
    const id = await ctx.db.insert('conversations', { participantA, participantB, latestSequence: 0 });
    for (const userId of [participantA, participantB]) await ctx.db.insert('inbox', { userId, conversationId: id, otherId: userId === participantA ? participantB : participantA,
      hasMessages: false, unread: false, lastReadSequence: 0, latestIncomingSequence: 0, lastMessageAt: 0, preview: '' });
    return id;
  },
});
const conversationView = v.object({ _id: v.id('conversations'), other: profileView, latestSequence: v.number() });
export const get = query({ args: { id: v.id('conversations') }, returns: conversationView, handler: async (ctx, args) => {
  const { me, conversation } = await requireConversation(ctx, args.id);
  const other = await ctx.db.get('profiles', conversation.participantA === me._id ? conversation.participantB : conversation.participantA);
  if (!other) throw new ConvexError('This member is unavailable.');
  return { _id: conversation._id, other: await publicProfile(ctx, other, me), latestSequence: conversation.latestSequence };
}});
const inboxView = v.object({ _id: v.id('conversations'), other: profileView, preview: v.string(), lastMessageAt: v.number(), unread: v.boolean() });
export const list = query({ args: { unreadOnly: v.boolean(), paginationOpts: paginationOptsValidator }, returns: paginationResultValidator(inboxView), handler: async (ctx, args) => {
  const me = await requireProfile(ctx);
  const result = args.unreadOnly
    ? await ctx.db.query('inbox').withIndex('by_userId_and_hasMessages_and_unread_and_lastMessageAt', q => q.eq('userId', me._id).eq('hasMessages', true).eq('unread', true)).order('desc').paginate(args.paginationOpts)
    : await ctx.db.query('inbox').withIndex('by_userId_and_hasMessages_and_lastMessageAt', q => q.eq('userId', me._id).eq('hasMessages', true)).order('desc').paginate(args.paginationOpts);
  return { ...result, page: await Promise.all(result.page.map(async row => {
    const other = await ctx.db.get('profiles', row.otherId); if (!other) throw new Error('Missing conversation participant.');
    return { _id: row.conversationId, other: await publicProfile(ctx, other, me), preview: row.preview, lastMessageAt: row.lastMessageAt, unread: row.unread };
  })) };
}});
const messageView = v.object({ _id: v.id('messages'), _creationTime: v.number(), text: v.string(), outgoing: v.boolean(), requestId: v.string(), sequence: v.number() });
export const history = query({ args: { id: v.id('conversations'), paginationOpts: paginationOptsValidator }, returns: paginationResultValidator(messageView), handler: async (ctx, args) => {
  const { me } = await requireConversation(ctx, args.id);
  const result = await ctx.db.query('messages').withIndex('by_conversationId_and_sequence', q => q.eq('conversationId', args.id)).order('desc').paginate(args.paginationOpts);
  return { ...result, page: result.page.map(message => ({ _id: message._id, _creationTime: message._creationTime, text: message.text, outgoing: message.senderId === me._id, requestId: message.requestId, sequence: message.sequence })) };
}});
export const send = mutation({ args: { id: v.id('conversations'), text: v.string(), requestId: v.string() }, returns: v.id('messages'), handler: async (ctx, args) => {
  const { me, conversation } = await requireConversation(ctx, args.id); const text = args.text.trim();
  if (!text || text.length > 2000 || !args.requestId || args.requestId.length > 100) throw new ConvexError('Write a message of 1–2,000 characters.');
  const existing = await ctx.db.query('messages').withIndex('by_senderId_and_requestId', q => q.eq('senderId', me._id).eq('requestId', args.requestId)).unique();
  if (existing) { if (existing.conversationId !== args.id || existing.text !== text) throw new ConvexError('Retry does not match the original message.'); return existing._id; }
  const sequence = conversation.latestSequence + 1;
  const id = await ctx.db.insert('messages', { conversationId: args.id, senderId: me._id, text, requestId: args.requestId, sequence });
  await ctx.db.patch('conversations', args.id, { latestSequence: sequence });
  for (const userId of [conversation.participantA, conversation.participantB]) {
    const row = await ctx.db.query('inbox').withIndex('by_userId_and_conversationId', q => q.eq('userId', userId).eq('conversationId', args.id)).unique();
    if (!row) throw new Error('Missing inbox entry.');
    await ctx.db.patch('inbox', row._id, { hasMessages: true, preview: text.slice(0, 200), lastMessageAt: Date.now(),
      ...(userId !== me._id ? { unread: true, latestIncomingSequence: sequence } : {}) });
  }
  return id;
}});
export const markRead = mutation({ args: { id: v.id('conversations'), throughSequence: v.number() }, returns: v.null(), handler: async (ctx, args) => {
  const { me, conversation } = await requireConversation(ctx, args.id);
  if (!Number.isInteger(args.throughSequence) || args.throughSequence < 0 || args.throughSequence > conversation.latestSequence) throw new ConvexError('Invalid read position.');
  const row = await ctx.db.query('inbox').withIndex('by_userId_and_conversationId', q => q.eq('userId', me._id).eq('conversationId', args.id)).unique();
  if (!row) throw new Error('Missing inbox entry.');
  const lastReadSequence = Math.max(row.lastReadSequence, args.throughSequence);
  if (lastReadSequence !== row.lastReadSequence) await ctx.db.patch('inbox', row._id, { lastReadSequence, unread: row.latestIncomingSequence > lastReadSequence });
  return null;
}});
