import { paginationOptsValidator, paginationResultValidator } from 'convex/server';
import { ConvexError, v } from 'convex/values';
import { query, mutation } from './_generated/server';
import { requireIdentity, requireProfile } from './lib/auth';
import { profileView, publicProfile } from './lib/views';

function normalize(username: string, name: string, bio = '', website = '', location = '') {
  username = username.trim().toLowerCase(); name = name.trim();
  if (!/^[a-z0-9._]{3,30}$/.test(username)) throw new ConvexError('Use 3–30 letters, numbers, dots or underscores for your username.');
  if (!name || name.length > 60 || bio.length > 150 || website.length > 200 || location.length > 200) throw new ConvexError('Check your profile field lengths.');
  if (website && !/^https?:\/\//i.test(website)) throw new ConvexError('Website must begin with https:// or http://.');
  return { username, name, bio: bio.trim(), website: website.trim(), location: location.trim(), searchText: `${username} ${name}` };
}
export const me = query({ args: {}, returns: v.union(profileView, v.null()), handler: async ctx => {
  const identity = await requireIdentity(ctx);
  const profile = await ctx.db.query('profiles').withIndex('by_tokenIdentifier', q => q.eq('tokenIdentifier', identity.tokenIdentifier)).unique();
  return profile ? publicProfile(ctx, profile, profile) : null;
}});
export const create = mutation({ args: { username: v.string(), name: v.string() }, returns: v.id('profiles'), handler: async (ctx, args) => {
  const identity = await requireIdentity(ctx);
  const existing = await ctx.db.query('profiles').withIndex('by_tokenIdentifier', q => q.eq('tokenIdentifier', identity.tokenIdentifier)).unique();
  if (existing) return existing._id;
  const fields = normalize(args.username, args.name);
  if (await ctx.db.query('profiles').withIndex('by_username', q => q.eq('username', fields.username)).unique()) throw new ConvexError('That username is already taken.');
  return ctx.db.insert('profiles', { ...fields, tokenIdentifier: identity.tokenIdentifier,
    avatarUrl: typeof identity.pictureUrl === 'string' && identity.pictureUrl.startsWith('https://') ? identity.pictureUrl : undefined,
    postsCount: 0, followersCount: 0, followingCount: 0 });
}});
export const update = mutation({ args: { username: v.string(), name: v.string(), bio: v.string(), website: v.string(), location: v.string() }, returns: v.null(), handler: async (ctx, args) => {
  const me = await requireProfile(ctx); const fields = normalize(args.username, args.name, args.bio, args.website, args.location);
  const taken = await ctx.db.query('profiles').withIndex('by_username', q => q.eq('username', fields.username)).unique();
  if (taken && taken._id !== me._id) throw new ConvexError('That username is already taken.');
  await ctx.db.patch('profiles', me._id, fields); return null;
}});
export const get = query({ args: { id: v.id('profiles') }, returns: v.union(profileView, v.null()), handler: async (ctx, args) => {
  const me = await requireProfile(ctx); const profile = await ctx.db.get('profiles', args.id);
  return profile ? publicProfile(ctx, profile, me) : null;
}});
export const search = query({ args: { text: v.string(), paginationOpts: paginationOptsValidator }, returns: paginationResultValidator(profileView), handler: async (ctx, args) => {
  const me = await requireProfile(ctx); const text = args.text.trim().slice(0, 100).replace(/^@/, '');
  const result = text
    ? await ctx.db.query('profiles').withSearchIndex('search_profiles', q => q.search('searchText', text)).paginate(args.paginationOpts)
    : await ctx.db.query('profiles').withIndex('by_creation_time').order('desc').paginate(args.paginationOpts);
  return { ...result, page: await Promise.all(result.page.map(profile => publicProfile(ctx, profile, me))) };
}});
