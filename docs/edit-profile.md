# Edit profile

The Profile tab opens a full-screen editor based on `design/edit-profile-ref.png`, covering the native tab bar. It includes username, display name, bio with a live 150-character limit, website, location, a native photo picker, two save actions, and discard protection.

Profile changes are held in the current Profile screen session, consistent with the existing demo profile. They are not persisted to Clerk or an application database. Sign-out remains available in the Profile options menu; the editor has no sign-out button or divider.

Photo selection uses Expo ImagePicker (SDK 57) and accepts JPG/PNG files with a known size up to 5 MB. It does not request camera or microphone access. The native development app must be rebuilt after installing this module.

Validation covers usernames, required display names, length limits, and HTTP(S) website URLs. Simulator checks cover saving/reopening, required-name validation, discarding changes, and selecting a JPG/PNG through the native photo picker. Visual artifacts are in `artifacts/edit-profile/`.

Reference differences: the bio counter shows the actual string length (59), rather than the mock's 50; iOS status indicators follow the simulator's native layout.
