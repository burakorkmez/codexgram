# Profile screen

`ProfileTab` in `src/components/profile-screen.tsx` is shared by the protected native Profile tab and `/design-preview/profile`.

The preview matches the supplied Alex Rivera reference with a photo, demo statistics, bio, interest tags, edit/discovery controls, four gallery filters, and a three-column image grid. Portrait and photo assets were extracted from the user-provided `design/profile-screen-ref.png`. The native transparent tab bar remains as requested, rather than reproducing the reference's flat tab bar.

Signed-in accounts show Clerk identity details, local post counts, and local posts instead of Alex's fictional identity and statistics. Saved reads the shared feed state. Videos and Tagged have empty states. Photo previews, profile sharing, demo follow controls, and editing work locally. Edits and follows are preview-session state, explicitly labeled in their sheets; they are not persisted to Clerk or a backend. Real sign-out remains available under Profile options.

Visual comparisons are in `artifacts/profile`. The third row in the supplied screenshot is partially obscured by its tab bar, so those extracted photo assets contain only their visible portions.

Validated in the iPhone simulator: profile layout, Saved empty state, populated Edit Profile fields, and Save changes returning to the profile.
