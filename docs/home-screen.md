# Home screen

The signed-in `/(tabs)/home` route (URL `/home`) renders `HomeFeed`. It uses local fictional fixture profiles and posts; the existing Clerk guard remains in place. Sign-out is available through Profile.

A development-only `/design-preview` route renders the same component without account data. Both the route guard and the screen reject access in production. This route does not bypass authentication for `/home`.

The feed includes horizontally scrolling story previews, an image carousel, local like/save toggles, local comments, hashtag search, the system share sheet, and a local sample-post composer. Feed state is shared above the native tab routes and survives tab switches; it resets when the tab navigator remounts. This is not a backend integration. Home, Messages, Explore, and Profile are separate Expo Router NativeTabs routes. Messages has an empty state, Explore searches demo posts, and Profile displays account details, saved posts, and sign-out. The Profile reference is implemented; Messages and Explore remain basic screens.

The photo and portrait PNGs in `assets/images/feed` were extracted from the user-provided `design/home-screen-ref.png`. Text, cards, buttons, navigation, and icons are native UI, not a screenshot overlay. The lake image includes a baked counter, covered by the live counter in the matching position. The carousel reuses supplied demo landscape assets.

Comparison screenshots are in `artifacts/home`. The reference's device frame is excluded and its screen is normalized to the simulator viewport for comparison. The reference and iPhone 17 Pro Max have different screen proportions and system chrome, so status-bar and device-frame pixels are not an exact-match target.

Native tabs use SF Symbols on iOS and Material icons on Android. Automatic trigger insets are disabled; the vertical lists explicitly use automatic content inset adjustment. Screens extend behind the transparent native tab bar rather than reserving an opaque bottom safe-area strip. The development preview uses the same native layout under `/design-preview/home`.
