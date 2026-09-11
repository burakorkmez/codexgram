# Messaging

Implemented private, live one-to-one text messaging on the existing Convex development deployment (`savory-raven-325`). No additional Clerk or Convex dashboard configuration is required.

Start a conversation with the compose button in Messages, or the Message button on another real member’s profile. Conversation pairs are canonical and reused. The inbox is ordered by the latest message, supports All/Unread filtering, and loads additional conversations. History loads the latest 30 messages and offers earlier pages. Incoming messages update reactively; opening an active conversation at the bottom marks the loaded messages read.

Sends show a pending state, then a sent check. Failed sends offer a tap-to-retry action using the original request ID. The outbox survives navigation during the signed-in app session and resets on account change; it does not persist unsent messages through a force quit. Every backend operation checks authentication and conversation membership. The app never lets the client select its sender identity. These are access-controlled messages, not end-to-end encrypted messages.

The five reference conversations are explicitly labeled local demos. Their messages and photo attachments stay in memory for the mounted Messages-tab session. They do not contact other people or create backend messages. Online/read indicators and original timestamps in these demos are sample data. New demo sends do not simulate replies or read receipts. Fictional seeded profiles cannot receive live messages.

The supplied `design/messages-tab-ref.png` and `design/chat-screen-ref.png` drive the layout. Inbox portraits use clipped regions of the supplied inbox reference; the chat uses its existing reference avatar and lake assets. The layout adapts to the screen dimensions and keyboard safe area. The iOS 26 native tab bar retains its system appearance, so it differs from the older bar pictured in the reference.

Groups, calling, live photo attachments, presence, read receipts, message editing/deletion, and push notifications are not implemented. Their reference controls explain the available scope. The live chat shows “Private conversation” rather than a simulated online status.

Validation on September 11, 2026:

- 18 backend tests passed (including five messaging suites covering pair reuse, access isolation, retry identity, text limits, unread races, and history pagination).
- Application TypeScript, Convex deployment checks, whitespace validation, and production iOS bundle export passed.
- Multiple Simulator screenshot passes compared both screens with the supplied references; inbox spacing and portraits were refined, along with composer padding above the software keyboard.
- Simulator checks passed for local send/clear, unread filtering/clearing, preserved demo messages on return, and the new-conversation picker.
- Two-account behavior is covered with mocked authenticated clients in `convex-test`. A physical two-device exchange and a device network-failure/retry test remain manual acceptance checks; the current development database only has one real signed-up member.

Final Simulator captures: `artifacts/messaging/inbox-final.png` and `artifacts/messaging/chat-final.png`.
