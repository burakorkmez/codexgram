# Home and stories

Home's signed-in implementation is `src/components/social/feed.tsx`, with the Home variant of `PostCard`, `HomeHeader`, `HomeNavigation`, and `Stories`. The local design preview remains in `src/components/home-feed.tsx` with matching proportions. The existing `assets/images/logo.png` and app icon configuration were preserved.

Three visual refinement rounds compared simulator captures with `design/home-screen-ref.png`. The comparison removes the outer phone mockup using crop (150, 94, 792, 1600) and normalizes the simulator to the resulting screen size. Final screenshots are `artifacts/home/final.png` (fixed preview) and `live-final.png` (signed-in data), with matching `comparison-final.png` and `comparison-live-final.png`.

Matched: header, story-row placement, compact post headers, landscape media proportions, rounded white cards, caption/tag treatment, action row. Bottom navigation always uses Expo Router native tabs. Live posts without hashtags or a second caption line retain the card's minimum body height; no sample text is inserted. The preview's carousel badge belongs to its sample carousel; live single-image posts do not show a fabricated carousel count.

Remaining differences: the logo intentionally stays as requested; system status area/home indicator and some glyph rendering differ; photos, names, captions and counts reflect available data. The real story row shows its empty state until someone publishes a story; preview stories are local illustrative samples.

## Stories

- Tap **Your story**, take a photo with Camera or choose one from Library, then Publish. Stories have no captions.
- Post creation offers the same Camera and Library options and retains its caption field. Camera capture is photo-only; the post library still accepts videos.
- Camera access is requested on demand, with a settings link if permission is blocked. The iOS simulator shows an unavailable-camera message; capture requires a physical device.
- Photos use the existing authenticated upload endpoint and its MIME/signature/10 MB checks.
- Stories are visible to signed-in members, grouped by author in Home, newest authors first. The rail queries the latest 100 unexpired stories.
- The full-screen viewer advances after five seconds once the photo loads. Tap sides to navigate; hold or use Pause to pause. Playback pauses in the background. Close exits; authors can delete their own stories.
- Viewed rings are tracked for the current Home component session, not synchronized between devices.
- Scheduled mutations remove story media and upload records after 24 hours. Client expiry refreshes every 30 seconds and on foreground; HTTP media access also checks expiry.
- Publication retries reuse the upload's story ID rather than publishing duplicates. Deleted/expired stories cannot be republished from the same completed upload.

Backend changes were deployed to **development savory-raven-325**. No story fixtures were published to the live database.

## Validation

`npm run typecheck`, `npm test` (23 passing tests), and `git diff --check` pass. New `convex/stories.test.ts` cases cover authenticated upload/viewing, cross-account visibility, rejected unauthorized publication/deletion, wrong upload purpose, caption limits, retry-safe publication, video rejection, expiry and storage/upload cleanup. Existing social, messaging and seed tests pass.

The simulator verified the Home layout, live empty story rail, composer and native photo-library opening. End-to-end device publication and the full-screen viewer were not verified: the computer-use interface exposed no photo elements and coordinate selection repeatedly failed with `noWindowsAvailable`. The API upload-to-publication path was tested through convex-test's HTTP interface instead. This is a remaining manual device QA check, not a claimed passing UI test.

Story publication sends an empty caption for compatibility with the existing backend contract, and the viewer never renders caption text. Camera permission is configured in `app.json`; installed development clients must be rebuilt to include it.

Follow-up checks: simulator accessibility verified Camera and Library controls in both composers, no caption input in stories, and the retained 2,200-character post caption. Camera on the iOS simulator produces the expected physical-device fallback. Generated iOS Info.plist includes NSCameraUsageDescription.

The updated iOS development client was rebuilt and installed successfully; its installed Info.plist was checked for the camera permission description. TypeScript and whitespace checks pass. Physical camera capture is not verified in the simulator.
