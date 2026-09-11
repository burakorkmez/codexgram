# Codexgram — Implementation Plan

Status: authentication and the main UI were already implemented. On September 11, 2026, Convex profiles/onboarding, media posts, likes, comments, follows, and live discovery were implemented. See `docs/social-features.md` for setup, verification, and remaining device acceptance checks. Private text messaging is now implemented; see `docs/chat-screen.md` for verification and remaining two-device acceptance checks; the original checklist below also tracks work outside this implementation.

## 1. Product and agreed scope

Build a polished Instagram-style demo for trusted testers, targeting iPhone first.

### Chosen stack

- Expo SDK 57, React Native, TypeScript, Expo Router.
- Native tabs: **Home, Messages, Explore, Profile**.
- NativeWind for styling.
- Clerk for authentication and sessions.
- Convex for application data, backend logic, media storage, and live updates.

### Design

- Modern, clean, minimal, mobile-first.
- Light mode only.
- Final colors and visual details await the user's design reference.
- Keep visual tokens centralized so the reference can be applied consistently.

### Included

- Native Google and Apple signup/login through a custom welcome screen.
- Unique-username onboarding.
- Single-image or single-video posts with optional captions.
- Follow/unfollow, likes, flat comments.
- Delete your own posts and comments.
- One-to-one live text messages.
- View/edit profiles.
- Clearly labeled fictional demo content.

### Excluded

Android/web delivery, public launch, private accounts, follow requests, stories, carousels, in-app capture/editing, caption/comment editing, comment replies/likes, push notifications, payments, blocking/reporting, account deletion, background uploads, persistent offline drafts, and full UI automation.

The demo is free. There is no committed v2.

## 2. Starting point and implementation constraints

At planning time, the repository contains a minimal Stack layout and placeholder screen. Existing uncommitted modifications and deletions must be preserved.

Declared versions:

| Package | Current project declaration |
| --- | --- |
| Expo | `~57.0.21` |
| Expo Router | `~57.0.20` |
| React | `19.2.3` |
| React Native | `0.86.3` |
| TypeScript | `~6.0.3` |

Versions checked during the interview on September 10, 2026:

- Clerk Expo: `4.6.6`.
- Convex: `1.45.0`.
- NativeWind: `4.2.6`.

These are candidate implementation versions, not a verified working combination. Check package requirements and native builds before locking dependencies. Do not silently change the selected stack or downgrade Expo.

Read the exact [Expo SDK 57 documentation](https://docs.expo.dev/versions/v57.0.0/) before writing code. Use current [Clerk Expo documentation](https://clerk.com/docs/expo/getting-started/quickstart), [Convex Clerk integration documentation](https://docs.convex.dev/auth/clerk), and [NativeWind installation documentation](https://www.nativewind.dev/docs/getting-started/installation).

Native authentication requires a development build. The client uses Clerk's publishable key; provider credentials and configuration remain outside the client. The user confirmed keeping native sign-in with the required provider setup during implementation.

## 3. Screens and user journeys

### Authentication and onboarding

1. Show a custom welcome screen with native Google and Apple buttons.
2. Use a combined signup/sign-in experience.
3. After authentication, resolve the corresponding Convex profile.
4. New users choose a unique username before entering the tabs.
5. Prefill an editable display name and avatar when the provider supplies them.
6. Photo and bio remain optional.
7. Returning users enter Home after session/profile loading completes.
8. Provide sign-out from Profile.

Handle cancellation, provider errors, missing provider profile fields, session expiry, and interrupted onboarding.

### Home and posting

- Home shows the current user's posts and followed users' posts, newest first.
- Paginate results.
- Header plus button opens the composer.
- Select one image or video from the device library.
- Add an optional caption and publish.
- Show upload progress and prevent duplicate submissions.
- Publish only after successful upload and validation.
- Require the composer to stay open; warn before abandoning an active upload.
- Failed uploads expose retry; unused uploads are cleaned up.

Limits:

- Images: maximum 10 MB.
- Videos: maximum 30 seconds and 50 MB.
- No automatic compression or video-processing service.
- Videos show previews, play inline on tap, and stop offscreen.

Empty Home offers discovery and post creation.

### Explore and profiles

- Profiles and posts are visible to signed-in members; no anonymous browsing.
- Explore shows all members' posts, newest first, with user search.
- Search usernames and display names.
- Selecting a result opens the member's profile.
- Profiles show avatar, username, display name, bio, post grid, and follower/following counts and lists.
- Other profiles expose follow/unfollow and Message.
- Following takes effect immediately; there are no approval requests.
- Own profile exposes editing for all four profile fields.
- Username changes preserve relationships through stable IDs.

### Likes, comments, and deletion

- One like per user per post; support unlike.
- Comments are flat and displayed chronologically.
- Members can delete only their own comments and posts.
- Confirm destructive actions.
- Removing a post also removes associated likes, comments, and media.
- A post author cannot delete another person's comment independently.

### Messages

- Any real member can initiate a one-to-one conversation from another member's profile.
- Reuse the existing conversation for that pair.
- Messages tab lists conversations by latest message.
- Conversation screens show paginated history and live text updates.
- Show pending and failed sends; allow manual retry without duplicates.
- Only participants can access a conversation.

No self-chat, groups, live attachments, typing indicators, read receipts, or message editing/deletion. The supplied Messages reference adds inbox member search and an Unread filter to this scope.

Fictional seed profiles cannot authenticate or reply; clearly explain this before presenting a misleading chat experience.

## 4. Data, interfaces, and backend responsibilities

Clerk owns authentication identity and sessions. Convex owns editable app profiles and all social data.

| Entity | Minimum information |
| --- | --- |
| Profile | Stable ID, optional Clerk ID for seed profiles, unique normalized username, display name, avatar reference, bio, demo marker |
| Post | Author ID, media reference/type, dimensions, video duration where applicable, optional caption, creation time |
| Follow | Follower ID, followed-user ID |
| Like | User ID, post ID |
| Comment | Post ID, author ID, text, creation time |
| Conversation | Canonical participant pair, latest-message ordering information |
| Message | Conversation ID, sender ID, text, creation time, retry/deduplication identifier |
| Upload | Owner ID, storage reference, intended use, lifecycle state |

### Backend interfaces

Use typed Convex queries and mutations for profile onboarding/editing, feeds, search, follows, likes, comments, uploads, post publication/deletion, conversations, and messages.

- Derive the acting user from verified authentication.
- Never trust a client-supplied author or sender identity.
- Enforce ownership and conversation membership on the backend.
- Enforce unique usernames, follow pairs, like pairs, and conversation pairs transactionally.
- Use stable IDs rather than usernames for relationships.
- Authenticate upload creation, publication, and media access.
- Validate text, media metadata, and resource existence.
- Make retries safe for publication and message sending.
- Clean up abandoned uploads and deleted media through retry-safe background work.
- Bootstrap profiles idempotently after authentication; app-profile edits remain authoritative in Convex.

No separate REST server, billing service, analytics service, or video-processing service is required.

## 5. State, failure behavior, and operating defaults

- Convex is the source of truth; use live subscriptions where appropriate.
- Keep already loaded content visible during connection loss.
- Show connection status and actionable errors.
- Optimistic likes/follows must roll back on failure.
- Retain unsent text in the active screen for retry.
- Do not promise draft recovery after app termination.
- Stop media playback when offscreen or the app becomes inactive.
- Handle library-picker cancellation and unavailable media gracefully.
- Request only permissions required for selected features.
- Use development diagnostics and Convex logs without recording tokens, private message bodies, or unnecessary personal data.
- Start with a development environment and an internal iPhone build.

## 6. Step-by-step implementation checklist

### Step 1 — Verify foundation

- [ ] Preserve existing repository changes.
- [ ] Verify SDK/package compatibility and local iOS build prerequisites.
- [ ] Configure NativeWind and light-mode design tokens.
- [ ] Establish the four native tabs and supporting stack/modal navigation.
- [ ] Verify a minimal development build on iPhone.

**Complete when:** The app launches with functioning native navigation and styling.

### Step 2 — Configure authentication

- [ ] Configure Clerk, native app identifiers, Google, and Apple.
- [ ] Add the custom welcome screen and native provider buttons.
- [ ] Configure secure session persistence and protected navigation.
- [ ] Add sign-out and authentication failure states.

**Complete when:** Both providers work on iPhone and sessions survive restart.

### Step 3 — Establish Convex and profiles

- [x] Configure Clerk authentication in Convex.
- [x] Add data definitions, indexes, and authorization helpers.
- [x] Implement idempotent profile creation and username onboarding.
- [x] Implement profile editing and retrieval.

**Complete when:** Two real users have distinct profiles and cannot edit each other's data.

### Step 4 — Build media and posts

- [x] Add library selection and media validation.
- [x] Implement upload progress, publication, retry, and abandonment behavior.
- [x] Implement post display, video previews, playback, and deletion.
- [x] Add storage cleanup.

**Complete when:** Supported images/videos publish and play, and failed uploads never create visible incomplete posts.

### Step 5 — Build discovery and social interactions

- [x] Implement follow/unfollow and follower/following lists.
- [x] Implement Home, Explore, search, and profile grids.
- [x] Add likes, comments, and own-comment deletion.
- [x] Add pagination, empty states, and missing/deleted-content handling.

**Complete when:** Two accounts can discover each other and complete every social interaction.

### Step 6 — Build messaging

- [x] Create/reuse conversations from profiles.
- [x] Implement ordered chat lists and paginated live conversations.
- [x] Add pending/failed sends and duplicate-safe retries.
- [x] Verify participant-only access.

**Complete when:** Two devices exchange messages live without duplicate conversations or retry-generated messages.

### Step 7 — Seed and polish

- [x] Add an idempotent development-only seed routine.
- [ ] Source licensed sample imagery and a short video for a few fictional profiles.
- [x] Clearly mark fictional profiles and their messaging limitations.
- [ ] Apply the supplied design reference when available.
- [ ] Verify keyboard behavior, accessibility labels, contrast, and touch targets.

**Complete when:** The demo feels populated and polished without presenting fictional activity as real.

### Step 8 — Validate and deliver

- [ ] Run type checking and applicable lint checks.
- [x] Run focused backend permission and invariant tests.
- [ ] Complete the two-account iPhone acceptance walkthrough.
- [ ] Verify cancellation, connection loss, retries, app restart, and deletion.
- [ ] Prepare an internal development build for registered tester devices.
- [ ] Document setup, environment variables, seeding, and known limitations.

**Complete when:** The internal build passes the agreed acceptance checks on a real iPhone.

## 7. Test scenarios

Automate critical backend cases:

- Unauthenticated access is rejected.
- Users cannot alter another user's profile, posts, or comments.
- Nonparticipants cannot read or send conversation messages.
- Concurrent username claims cannot produce duplicates.
- Repeated likes/follows cannot produce duplicate relationships.
- Concurrent chat initiation reuses one conversation.
- Message/publication retries do not duplicate content.
- Post deletion removes dependent records and schedules media cleanup.
- Invalid or unauthorized uploads cannot be published.

Manually verify:

- Google and Apple first signup, returning login, cancellation, and logout.
- Missing provider name/avatar and interrupted onboarding.
- Image/video selection, size/duration boundaries, playback, and failed upload.
- Feed ordering, following changes, search, and pagination.
- Empty screens and content removed while being viewed.
- Live chat across two accounts and failed-send retry.
- Connection loss, restoration, and session persistence.
- Real iPhone layout, keyboard, safe areas, and native tabs.

## 8. Assumptions and unresolved risks

### Assumptions/defaults

- Working name: Codexgram.
- English only, one member role, no admin UI.
- No fixed deadline or spending cap.
- Modest trusted-tester usage.
- Basic accessibility is included.
- Development-only environment initially.
- Deleting a post removes dependent comments, likes, and media.
- No separate analytics or alerting integration.
- Backend/data-flow details in this document are architectural defaults; the product choices above were confirmed during the interview.

### Open risks

- Final design reference and palette are pending.
- Clerk/Convex configuration, provider credentials, Apple developer access, and signing remain unverified.
- Candidate library versions require combined native-build validation.
- Original-video formats, previews, upload handling, and playback need real-device testing.
- Member-only media access must be enforced beyond navigation; do not assume possession of a file URL proves authorization.
- Licensed sample assets remain to be selected.
- Storage and bandwidth usage need checking against the selected Convex account.
- This demo's exclusions must be revisited before public distribution.
