import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export const mediaKind = v.union(v.literal('image'), v.literal('video'));
export default defineSchema({
  conversations: defineTable({ participantA: v.id('profiles'), participantB: v.id('profiles'), latestSequence: v.number() })
    .index('by_participantA_and_participantB', ['participantA', 'participantB']),
  inbox: defineTable({ userId: v.id('profiles'), conversationId: v.id('conversations'), otherId: v.id('profiles'),
    hasMessages: v.boolean(), unread: v.boolean(), lastReadSequence: v.number(), latestIncomingSequence: v.number(),
    lastMessageAt: v.number(), preview: v.string() })
    .index('by_userId_and_conversationId', ['userId', 'conversationId'])
    .index('by_userId_and_hasMessages_and_lastMessageAt', ['userId', 'hasMessages', 'lastMessageAt'])
    .index('by_userId_and_hasMessages_and_unread_and_lastMessageAt', ['userId', 'hasMessages', 'unread', 'lastMessageAt']),
  messages: defineTable({ conversationId: v.id('conversations'), senderId: v.id('profiles'), text: v.string(), requestId: v.string(), sequence: v.number() })
    .index('by_conversationId_and_sequence', ['conversationId', 'sequence'])
    .index('by_senderId_and_requestId', ['senderId', 'requestId']),
  bookmarks: defineTable({ userId: v.id('profiles'), postId: v.id('posts') })
    .index('by_userId_and_postId', ['userId', 'postId']).index('by_postId', ['postId']),
  commentLikes: defineTable({ userId: v.id('profiles'), commentId: v.id('comments'), postId: v.id('posts') })
    .index('by_userId_and_commentId', ['userId', 'commentId']).index('by_commentId', ['commentId']).index('by_postId', ['postId']),
  seedAssets: defineTable({ key: v.string(), storageId: v.id('_storage'), width: v.number(), height: v.number() }).index('by_key', ['key']),
  profiles: defineTable({
    isDemo: v.optional(v.boolean()), seedKey: v.optional(v.string()),
    tokenIdentifier: v.string(), username: v.string(), name: v.string(), bio: v.string(),
    avatarUrl: v.optional(v.string()), avatarId: v.optional(v.id('_storage')), avatarUpdatedAt: v.optional(v.number()),
    website: v.string(), location: v.string(), searchText: v.string(),
    postsCount: v.number(), followersCount: v.number(), followingCount: v.number(),
  }).index('by_seedKey', ['seedKey']).index('by_tokenIdentifier', ['tokenIdentifier']).index('by_username', ['username'])
    .searchIndex('search_profiles', { searchField: 'searchText' }),
  posts: defineTable({
    seedKey: v.optional(v.string()), authorId: v.id('profiles'), uploadId: v.id('uploads'), storageId: v.id('_storage'),
    kind: mediaKind, width: v.number(), height: v.number(), duration: v.optional(v.number()),
    caption: v.string(), likesCount: v.number(), commentsCount: v.number(),
  }).index('by_seedKey', ['seedKey']).index('by_authorId', ['authorId']),
  likes: defineTable({ userId: v.id('profiles'), postId: v.id('posts') })
    .index('by_userId_and_postId', ['userId', 'postId']).index('by_postId', ['postId']),
  comments: defineTable({ authorId: v.id('profiles'), postId: v.id('posts'), text: v.string(), requestId: v.string() })
    .index('by_postId', ['postId']).index('by_authorId_and_requestId', ['authorId', 'requestId']),
  follows: defineTable({ followerId: v.id('profiles'), followingId: v.id('profiles') })
    .index('by_followerId_and_followingId', ['followerId', 'followingId']).index('by_followingId', ['followingId']),
  uploads: defineTable({
    ownerId: v.id('profiles'), purpose: v.union(v.literal('post'), v.literal('avatar')),
    kind: mediaKind, width: v.number(), height: v.number(), duration: v.optional(v.number()),
    state: v.union(v.literal('pending'), v.literal('ready'), v.literal('published')),
    storageId: v.optional(v.id('_storage')), postId: v.optional(v.id('posts')), expiresAt: v.number(),
  }).index('by_ownerId', ['ownerId']),
});
