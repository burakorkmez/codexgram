import { ConvexError } from 'convex/values';
import type { QueryCtx, MutationCtx } from '../_generated/server';

export async function requireIdentity(ctx: Pick<QueryCtx, 'auth'>) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new ConvexError('Please sign in to continue.');
  return identity;
}
export async function requireProfile(ctx: QueryCtx | MutationCtx) {
  const identity = await requireIdentity(ctx);
  const profile = await ctx.db.query('profiles').withIndex('by_tokenIdentifier', q => q.eq('tokenIdentifier', identity.tokenIdentifier)).unique();
  if (profile?.isDemo) throw new ConvexError('Fictional demo profiles cannot sign in.');
  if (!profile) throw new ConvexError('Choose your username to continue.');
  return profile;
}
