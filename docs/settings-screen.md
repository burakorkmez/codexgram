# Settings screen

`src/components/settings-screen.tsx` is shared by the live and preview profile gear buttons. It follows `design/settings-screen-ref.png`: large Settings title below the status bar, Account and Support & Legal groups, inset separators, outlined icons and chevrons, version label, blue Sign Out and pink Delete Account buttons, and native bottom tabs.

The existing app logo is preserved. Settings uses responsive width and height scaling with a scrollable body and native bottom tabs. Use the back arrow to return to the profile.

Edit profile opens the existing editor. Saved posts selects the existing gallery, navigation switches tabs, and Sign Out uses Clerk in the live account. Preview sign-out does not affect the signed-in account. Account and About show information. Notifications, Privacy, Blocked users, support/reporting, and legal pages explicitly report that they are unavailable. Delete Account now confirms permanent deletion and requests Clerk/Convex cleanup; see `docs/account-deletion.md`.

Validation: TypeScript and whitespace checks pass. Simulator visual verification and navigation checks are recorded in `artifacts/settings`.
