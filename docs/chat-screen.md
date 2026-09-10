# Chat screen

The Messages tab now includes an Alex Rivera demo conversation. Opening it presents `src/components/chat-screen.tsx` full screen above the native tabs. Back returns to the conversation list.

The supplied `design/chat-screen-ref.png` drives the header, incoming/outgoing bubbles, timestamps, receipt icons, shared image, and composer. The avatar and lake image are extracted from the supplied reference. The reference's alex.rivera name and portrait pairing are preserved.

Text messages and photo attachments append locally, clear the composer, and scroll into view. Messages remain when closing/reopening the conversation during this mounted Messages-tab session; the list shows the latest text and time. Nothing is sent to another person or persisted to a messaging backend. The Online label and original receipts are sample data. New messages do not simulate replies or read receipts. Voice/video call buttons explain that calling is not connected. The options menu toggles a local mute preference only.

Photo buttons open the native image picker, with a removable attachment preview. Shared images open a full-screen viewer. The composer handles keyboard avoidance and multiline text; empty messages cannot be sent.

Validation: TypeScript and whitespace checks, production iOS export, simulator screenshot comparisons, local send/clear, back/reopen persistence, and photo viewer open/close. Artifacts are in `artifacts/chat/`.
