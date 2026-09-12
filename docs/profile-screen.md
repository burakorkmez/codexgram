# Profile screen

The live Profile tab (`src/components/social/profile.tsx`) and design preview (`src/components/profile-screen.tsx`) share the header, profile summary, gallery tabs in `src/components/profile-layout.tsx`.

The layout follows `design/profile-screen-ref.png`: large avatar beside the three statistics, username/name/bio below, a wide neutral Edit Profile button, discovery control, four gallery tabs, and a rounded three-column photo grid. Per the requested changes, the existing logo asset is preserved, the hashtag row and header search are omitted, and the header create button becomes a settings gear. The avatar's small plus still opens photo editing. All screens use Expo Router native tabs, per the permanent project preference.

Live profiles retain backend data, pagination, follower/following lists, persistent profile editing, post navigation, member follow/message controls, sharing, and sign-out. Location and website are available in profile settings. Videos filters loaded profile posts, with further pagination available. Saved and Tagged display explicit unavailable messages because the backend does not expose those gallery feeds; no backend changes were made for this visual update.

The preview uses fictional profile data and reference-derived photos. Content differences are intentional, including live accounts with no avatar or bio. The current logo and existing glyph designs differ from the reference intentionally. Removing hashtags moves the controls and gallery upward.

Validation: `npm run typecheck` passed. Simulator screenshots are `artifacts/profile/updated-preview.png` and `artifacts/profile/updated-live.png`. Settings and its Edit Profile action were exercised on the live profile without changing account data.
