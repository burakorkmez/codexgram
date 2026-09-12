# Explore screen

The signed-in route uses `src/components/social/explore.tsx`; the development-only `/design-preview/explore` route uses `src/components/explore-screen.tsx`. Both render the same `ExploreLayout` in `src/components/explore-layout.tsx`.

The shared layout follows `design/explore-screen-ref.png`: flat camera mark, branded header, search field, five visible suggested profiles with follow controls, topic chips, tall three-column cards with author overlays, hearts/counts, and two-line captions. Explore uses Expo Router native tabs, as do all other app screens and previews.


Live profiles, authenticated media, follows, likes, pagination, profile navigation, post details, and the composer remain connected to the existing backend. Search queries people remotely and filters loaded posts by author/caption; topics match caption keywords. Filtered results offer Load more rather than automatically fetching every page. No backend deployment or seed changes were made. Preview controls use local demo state.

Three screenshot/comparison iterations were performed on the booted iPhone 17 Pro Max (1320 × 2868). The comparison crops the reference to its screen area (130, 76, 810, 1600), excluding the surrounding device mockup, and normalizes the simulator image to that area. Final section positions and card heights closely align. This is not a pixel-identical reproduction: bundled photos have different subjects/framing/resolution, live account data differs, and the simulator's status area, emoji rendering, and home indicator differ from the reference.

Artifacts:
- `artifacts/explore/iteration-1.png`, `iteration-2.png`, `final.png`: preview simulator captures.
- `artifacts/explore/comparison-1.png`, `comparison-2.png`, `comparison-final.png`: reference comparisons.
- `artifacts/explore/live-final.png`: signed-in screen with actual database content.

Validation: `npm run typecheck`, `git diff --check`; simulator checks for preview follow/unfollow, Food filtering, matching card/detail like counts (95 → 96, restored), live Food filtering and coffee search, and Explore → Home → Explore navigation. Live follows/likes retain existing mutations; the interaction checks that changed follows/likes used the local preview.
