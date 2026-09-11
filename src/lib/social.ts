import { ConvexError, type Infer } from 'convex/values';
import type { postView, profileView } from '../../convex/lib/views';
export { api } from '../../convex/_generated/api';
export type { Id } from '../../convex/_generated/dataModel';
export type SocialPost = Infer<typeof postView>;
export type SocialProfile = Infer<typeof profileView>;
export const siteUrl = process.env.EXPO_PUBLIC_CONVEX_SITE_URL ?? '';
export function errorMessage(error: unknown) {
  return error instanceof ConvexError && typeof error.data === 'string' ? error.data : 'Something went wrong. Check your connection and try again.';
}
export const palette = { ink: '#0D1529', muted: '#7C879F', blue: '#087EFF', background: '#FCFDFE', border: '#EEF1F5' };
