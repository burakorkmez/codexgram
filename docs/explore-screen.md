# Explore screen

Implemented in `src/components/explore-screen.tsx`, shared by the signed-in Explore route and the development-only `/design-preview/explore` route.

The layout follows `design/explore-screen-ref.png`: branded header, search, five suggested profiles, follow controls, topic chips, and a three-column image grid. The existing transparent native tabs remain in place as previously requested, rather than replacing them with the reference's custom tab bar.

Search matches usernames, captions, and topics. Topic filters combine with the search query. Suggested portraits filter by creator; See all opens the people list. Cards open post details, hearts update counts, and the plus button opens the local demo composer. New demo posts also appear in Home through the shared feed context. Following and Explore likes are local screen state, not backend mutations.

Assets reuse existing profile photos and the supplied reference's portrait crops. The Santorini asset comes from the visible photo region in the reference. Some photo framing and resolution differ from the mockup; the native status and tab bars also differ by design.

Validation: TypeScript and whitespace checks; simulator checks for following/unfollowing, Food filtering, empty search, coffee search, and consistent likes between the grid and detail sheet. Screenshots and visual comparisons are saved in `artifacts/explore/`.
