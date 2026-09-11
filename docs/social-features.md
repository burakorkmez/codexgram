# Posts, likes, comments and follows

Implemented September 11, 2026. Live screens use Convex; `/design-preview` retains the fictional, local-only design examples. Messages are still a clearly labeled local demo.

## Setup

- Clerk's **Integrations → Convex** integration must be enabled. It is confirmed enabled for this app.
- `CLERK_JWT_ISSUER_DOMAIN` has been set on the existing development deployment `savory-raven-325` to `https://proud-escargot-1543.clerk.accounts.dev`.
- `.env.local` contains `EXPO_PUBLIC_CONVEX_URL` and `EXPO_PUBLIC_CONVEX_SITE_URL`. `.env` supplies the existing Clerk publishable key. The Clerk secret key is never referenced by client or social backend code.
- No Clerk webhook, manual table creation, or additional storage provider is needed. Profiles are created transactionally during username onboarding.
- Use Node 22.13 or newer for Expo SDK 57. The machine's default Node 22.12 is below the SDK requirement; verification uses a temporary npm-provided Node 22 runtime.
- Run `npx convex dev` and `npx expo start --dev-client` while developing. This implementation is deployed only to development.
- `expo-video` adds a native module: rebuild existing development clients with `npx expo run:ios` (or your existing EAS development-build workflow). A Metro reload alone cannot add it.

A different Clerk instance or production deployment needs its own issuer configured. Do not point production at the development issuer.

## Implemented behavior

- Clerk-authenticated Convex provider, profile loading, unique lowercase usernames, editable display name, bio, website, location, and photo.
- One image (10 MB) or MP4/MOV video (30 seconds, 50 MB), optional 2,200-character caption, progress, retry and duplicate-safe publication.
- An active upload can be cancelled with confirmation. Once publication has started, keep the composer open until the server responds. Drafts survive a failure only while the composer remains mounted.
- Home includes your posts and followed profiles; Explore includes all members' posts and user search. Profiles have live grids, counts, and paginated follower/following lists.
- Likes and follows update immediately and roll back if their mutation fails. Repeated requests do not create duplicate records.
- Flat, chronological comments (2,000 characters maximum), retry-safe sends, and deletion by the comment's author only.
- Own-post deletion immediately hides the post and deletes media, then deletes likes/comments in bounded scheduled batches. A post author cannot independently remove someone else's comment.
- Videos play inline using native controls and pause when their card is offscreen, navigation loses focus, or the app backgrounds.
- Empty, loading, reconnecting, upload-failure, and deleted-content states.

## Backend design

`convex/schema.ts` defines profiles, posts, follows, likes, comments, and upload sessions. Public operations derive the caller from the verified token identifier; client arguments never determine the acting identity. Public profile responses omit Clerk identifiers. Relationships use stable profile IDs, so renaming does not break them.

`convex/http.ts` implements authenticated upload and media routes. It does not expose public storage URLs. An upload belongs to a profile before any bytes are accepted. The backend checks actual byte size, supported MIME type, file signature, and MP4/MOV movie-header duration. Video headers are inspected without decoding/compressing the file; files still need to be playable by iOS. Failed/cancelled sessions are discarded, and unpublished uploads expire after one hour. Publication is keyed to the upload session, which is retained as an idempotency record.

Media delivery supports HTTP byte ranges with chunks capped at 8 MB, below Convex's HTTP response limit. Requests carry Clerk's Convex token. An expired token or failed media request shows a retry control which obtains a fresh token. Profile images inherited from Clerk retain Clerk's original image URL; uploaded profile photos use the authenticated media route.

The Home feed scans indexed, bounded pages of posts and checks indexed follow relationships, preserving the underlying cursor even when a page contains no matching posts. This avoids loading every follow into memory and works for a modest tester population. Sparse Home feeds can require additional page requests; larger deployments would benefit from a materialized per-user feed. Counts are transactionally maintained, not computed by scanning relationships.

## Verification

Commands:

```sh
npm run typecheck
npx tsc --noEmit -p convex/tsconfig.json
npm test
npx convex dev --once
npx expo export --platform ios
```

Verification passed: 11 backend tests, app and backend TypeScript checks, an iOS Metro export, deployment to `savory-raven-325`, and a native iOS simulator build. The rebuilt app retained the existing Clerk sign-in and successfully reached Convex username onboarding. A live anonymous media request returned HTTP 401.

Backend tests exercise two mocked identities and an unauthenticated caller: onboarding uniqueness, issuer isolation, follow/feed scope, idempotent likes/follows/publication/comments, cross-user ownership denials, actual upload-size/video-duration checks, protected media, range reads, post deletion cleanup, expired uploads, profile rename stability, and avatar ownership.

Device acceptance still required before calling this tester-ready:

1. Sign in with each of two real accounts and choose distinct usernames.
2. Publish a library image and a short MP4/MOV; check progress, caption, playback, and media retry.
3. Discover the second user, follow/unfollow, like/unlike, comment, and check live counts on both devices.
4. Verify only your own delete actions appear; delete your comment and post and check both accounts update.
5. Try picker cancellation, upload cancellation, airplane mode/reconnect, publication retry, app backgrounding and relaunch.
6. Check 10 MB image, 30-second video and 50 MB video boundaries on physical iPhone, including larger ranged video playback.

References: [Expo SDK 57 video](https://docs.expo.dev/versions/v57.0.0/sdk/video/), [Expo SDK 57 ImagePicker](https://docs.expo.dev/versions/v57.0.0/sdk/imagepicker/), [Convex with Clerk](https://docs.convex.dev/auth/clerk), [Convex limits](https://docs.convex.dev/production/state/limits).


## Development seed

Run `npm run seed -- burakorkmez` from the project root (or replace the username with another existing real profile). The script is restricted to development deployment `savory-raven-325`; it refuses deploy-key overrides or a different configured deployment. All server seed functions are internal and independently enforce the development URL.

The seed creates 24 explicitly fictional profiles, 162 image posts, 2,665 likes, and 1,296 comments using the app's existing sample photo assets. It inserts real like/comment/follow records so counts, pagination, search, and interactions work through the normal APIs. Some posts have 24 comments to exercise pagination; `demo.alex.rivera` has 27 posts to exercise a longer profile grid. Your profile follows 12 sample members, and all 24 follow you. Existing real profiles, posts, comments, and uploads are preserved.

`seedKey` indexes, unique relationship lookups, and a media catalog make reruns idempotent. Rerunning fills missing seed records and sample follows without resetting existing profile/post content or double-counting relationships. Each seeded post owns a separate stored copy of its image. Profile avatars reuse the existing fictional design assets. Demo profiles are visibly marked and cannot authenticate or reply to messages. This does not add live messaging or seed video clips.

The seed runner uses small batches and may safely be restarted after an interrupted run. `npx convex run seed:summary '{"username":"burakorkmez"}'` reports the seeded totals.

## Post-detail refinement (September 11, 2026)

The detail screen now uses a full-width white layout, caption hashtag pills, the expanded like/comment/share/bookmark action row, Newest/Oldest comment sorting, inline relative timestamps, comment hearts, Reply links, and an avatar beside the fixed comment composer. Hashtag pills reflect hashtags in the stored caption; sample tags are not injected into real posts. Reply prefills an @mention in a regular comment. Long-press your own comment text to delete it.

Bookmarks and comment likes are authenticated Convex records, scoped to the current user and cleaned up when their parent content is deleted. Sharing opens the native share sheet with an app link. No dashboard setup is required. Verified with 20 passing backend tests, application/Convex type checks, and Simulator comparison and interaction passes.
