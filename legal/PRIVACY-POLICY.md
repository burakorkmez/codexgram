# Codexgram Privacy Policy

**Testing draft — not ready for publication until bracketed fields and reviewer issues are resolved.**

Effective date: [EFFECTIVE DATE]
Operator: [OPERATOR LEGAL NAME], established in [COUNTRY OF ESTABLISHMENT]
Applies to: Codexgram and [APP AND SITE URLS]
Privacy contact: [PRIVACY EMAIL] · [POSTAL ADDRESS]

## 1. About this policy

Codexgram is a testing social application for profiles, photo and video posts, image stories, social interactions and text conversations. This policy explains how its implemented features process personal information. “We” means the operator named above. Our intended testers and countries are [INTENDED TESTER AUDIENCE AND COUNTRIES].

This notice explains data processing; it is not a request for blanket consent. [CONFIRM APPLICABLE PRIVACY LAWS AND STATE PURPOSE-SPECIFIC LEGAL BASES WHERE REQUIRED, INCLUDING ANY SEPARATE CONSENT PROCESS.]

## 2. Information we receive

**Account and sign-in information.** You sign in through Google or Apple using Clerk, our authentication provider. This involves authentication identifiers, tokens and session information. Depending on your provider and its settings, Clerk may receive information such as your name, email address and profile picture. The app uses identity information to connect your session to your Codexgram profile and may use provider details to prefill or display account information. We do not provide a separate Codexgram password-entry flow.

**Profile information.** To create a profile, you provide a username and display name. You may add a bio, website, location text and profile image. We store profile identifiers, an authentication identifier, profile fields, avatar references, searchable name/username text and activity counts. The location field is information you enter; the implemented features do not request device GPS location.

**Content and interactions.** We process the photos and videos you upload, captions, comments, stories, likes, comment likes, follows and saved posts. Associated information includes authorship, identifiers, timestamps, media type, size, dimensions and duration where applicable, and upload/publication state. Uploaded files may include embedded information from the original file; the app has no explicit metadata-removal step. A video selected from your library can include audio.

**Messages.** We store the text of conversations, participant and sender identifiers, timestamps, message order and delivery-request identifiers. We also store inbox previews, unread status and read-position information to maintain your inbox. Real conversations currently support text. Simulated attachment, call, online-status or read-receipt features shown in demos do not establish equivalent live features.

**Requests and local state.** Searching profiles sends your search text to the backend; some post filtering happens on your device. The app does not implement a saved search history. Pending message drafts and some viewing/demo state are held in app memory. Network and provider logs may have different retention, as addressed below.

**Technical and deletion information.** Service connections expose request information, such as IP addresses and connection/request metadata, to the receiving service. Authentication software processes technical information described in Section 5. Account deletion creates a record containing identifying references, status, retry information and errors when needed. [CONFIRM ADDITIONAL HOSTING, SECURITY AND SUPPORT LOG DATA, PURPOSES AND RETENTION.]

## 3. How information is used

The implemented processing supports signing you in, creating and finding profiles, showing posts and stories, selecting a Home feed using follows, recording social interactions, saving posts, delivering conversations, maintaining unread state, validating and serving uploads, and processing deletion requests. Authentication and ownership checks use identifiers to control access. Retained deletion identifiers help prevent still-valid authentication tokens from recreating a deleted account.

Explore filters use ordinary matching rules; the application does not implement AI inference or send content to an AI model. The reviewed app does not implement payment collection, contact-list import, advertising targeting or a separate marketing analytics integration. Authentication-provider diagnostics are addressed separately below. [CONFIRM ANY OPERATOR PRACTICES OUTSIDE THE APP, INCLUDING SUPPORT, MARKETING, SALE OR ADVERTISING-RELATED SHARING, BEFORE PUBLICATION.]

## 4. Who receives information

**Other members.** Profiles, posts, comments, stories and exposed social relationships are available to signed-in members. Following someone changes your Home feed; it does not make their content private. The current app has no private-account or blocking control. Your saved-post collection is queried for your account rather than offered as a public collection.

Conversation access through the app is restricted to participants. Messages are stored on the backend and are not end-to-end encrypted. Member-facing access restrictions do not prevent the backend from processing message text.

**Service providers.** Clerk handles authentication and sessions. Convex hosts the application database, server functions and uploaded media. Google or Apple participates when you choose its sign-in option. These services receive information necessary for their respective flows, including technical request information. When the app displays a profile picture hosted by an external provider, your device may request it directly from that host. [CONFIRM PROVIDER ENTITIES, CONTRACTUAL ROLES, SUBPROCESSORS AND ANY ADDITIONAL OPERATIONAL RECIPIENTS.]

**Sharing you choose.** Using the device share sheet can send a post author's username, caption and app link to the destination you select. Other people can also retain screenshots or copies. We cannot recall those external copies through an app deletion action. Visiting a profile website or another external destination subjects that interaction to the destination's own practices.

## 5. Authentication storage and SDK diagnostics

On native devices, Clerk authentication tokens are stored using Expo SecureStore with an after-first-unlock setting. This is not a requirement to authenticate biometrically every time the app uses a token. Browser sign-in involves Clerk and the selected identity provider's browser/session storage. The app's web configuration does not use the native SecureStore token cache.

The testing configuration uses a Clerk development instance and does not explicitly turn off its SDK telemetry. The installed SDK supports sending development feature-usage events, SDK versions, an instance identifier and event-specific technical information to Clerk. It also contains a diagnostic-log collection path; its actual use and payloads in distributed builds remain to be verified. The app has no user-facing telemetry switch. [CONFIRM ACTIVE SDK DIAGNOSTICS, DATA FIELDS, PURPOSES, RETENTION AND REQUIRED CHOICES FOR THE DISTRIBUTED BUILD.]

The SDK can use browser local storage to limit repeated telemetry events. [ADD THE VERIFIED BROWSER COOKIE/STORAGE INVENTORY, PURPOSES, LIFETIMES AND ANY REQUIRED CONSENT CONTROLS.] The standalone preview/legal page supplied with this project adds no analytics, forms, cookies or browser-storage code. Its web host can still receive ordinary request information; [IDENTIFY WEBSITE HOST AND ITS LOGGING/RETENTION PRACTICES].

## 6. Device permissions

The app uses the operating system's camera and photo-selection interfaces so you can choose media to upload. You can decline access or change permissions in your device settings, although the corresponding feature may then be unavailable. Revoking a permission does not delete files already uploaded. The configured app does not request microphone access for recording, but an existing library video can contain sound.

A device permission choice is separate from any legal consent that may be required for processing. Selecting media is also separate from publishing it: upload processing can create temporary files before publication succeeds.

## 7. Storage and security

Profile, content, social, messaging and deletion records are stored in Convex; authentication records are handled by Clerk. Configured backend connections use HTTPS. The app checks authenticated identity, ownership for relevant changes, and conversation participation. Its authenticated media responses request private, non-persistent caching, and its image component disables its configured image cache. These settings do not erase screenshots, all operating-system caches or copies held by recipients.

These are specific implementation measures, not a promise that information can never be accessed improperly or lost. The app has no end-to-end message encryption. [CONFIRM ACTUAL STORAGE/PROCESSING COUNTRIES, OPERATOR ACCESS CONTROLS AND ANY REQUIRED INTERNATIONAL-TRANSFER SAFEGUARDS.] A regional development endpoint does not establish where all authentication data, logs, backups or support access reside.

## 8. Retention and deletion

Ordinary accounts, profiles, posts, messages and social records have no general automatic age or inactivity expiry in the current implementation. They remain until the applicable deletion action or cleanup. [SET AND DISCLOSE THE OPERATOR'S RETENTION PERIODS OR CRITERIA, INCLUDING INACTIVE ACCOUNTS.]

Stories are set to expire 24 hours after publication, with scheduled removal of their record and uploaded file. Pending/unpublished uploads have a one-hour expiry and scheduled cleanup; cancellation also attempts removal. Scheduled work or failures can delay physical deletion. These periods are not guarantees about copies outside the active application storage.

You can delete your own posts and comments. Post deletion removes its uploaded media and schedules associated interaction cleanup. Replacing an uploaded profile image deletes the prior image. Some published-upload metadata can remain until account cleanup.

Choosing Delete Account in Settings starts a staged process. The app restricts account use, requests deletion of your Clerk user, and then removes associated application records and uploaded files in batches. This includes entire conversations and their messages for both participants, including messages written by the other participant. A failed step can leave deletion pending and the account restricted; the app provides retry handling. Deleting Codexgram does not delete your Google or Apple account.

After completion, a deletion record containing your authentication identifier, profile reference and job metadata remains. There is no automatic purge schedule for this record. It helps prevent account recreation using still-valid tokens. [CONFIRM AND IMPLEMENT AN APPROPRIATE RETENTION PERIOD FOR THIS IDENTIFIABLE RECORD AND FAILED JOBS.]

The app cleanup does not establish deletion periods for provider logs, backups, authentication-provider records retained independently, device caches or copies kept by others. [SPECIFY VERIFIED PROVIDER/BACKUP RETENTION AND DELETION PROPAGATION.] Uninstalling or signing out is not the same as requesting account deletion.

## 9. Your choices and privacy requests

You can edit profile information, replace a profile image, manage follows, likes and bookmarks, delete your own posts/comments, sign out, change device permissions and request account deletion as described above. The current Privacy, Blocked Accounts and notification settings do not implement additional controls. There is no in-app data-export feature or privacy-request portal.

Depending on applicable law, you may have rights concerning access, correction, deletion, portability, restriction, objection, withdrawal of consent where processing relies on it, or complaints to a regulator. The lack of an app button does not remove a right that applies to you. [CONFIRM APPLICABLE RIGHTS, EXCEPTIONS, RESPONSE PERIODS, COMPLAINT AUTHORITY AND A WORKING REQUEST/IDENTITY-VERIFICATION PROCESS.]

Contact [PRIVACY EMAIL] to make a privacy request or raise a concern. [CONFIRM THAT THIS CHANNEL IS MONITORED AND CAN FULFIL REQUESTS BEFORE PUBLICATION.] Withdrawal of device permission alone does not submit a data-deletion request.

## 10. Intended audience

Codexgram is currently for testing. The intended audience and minimum age are [INTENDED TESTER AUDIENCE AND MINIMUM AGE]. The current app does not verify age or provide a parental-consent flow. [CONFIRM WHETHER CHILDREN MAY USE THE SERVICE, ANY REQUIRED ELIGIBILITY CONTROLS, AND THE PROCEDURE FOR HANDLING CHILDREN'S INFORMATION BEFORE DISTRIBUTION.]

## 11. Changes and contact

[CONFIRM HOW UPDATED NOTICES WILL BE PUBLISHED AND HOW MATERIAL CHANGES WILL BE COMMUNICATED, INCLUDING ANY CONSENT REQUIRED BY LAW.] The current app's privacy links display placeholder alerts, so a functioning notice location must be connected before this policy is published as effective.

Operator: [OPERATOR LEGAL NAME]
Postal address: [POSTAL ADDRESS]
Privacy email: [PRIVACY EMAIL]
Policy location: [PRIVACY POLICY URL]
[DPO OR LOCAL REPRESENTATIVE DETAILS, ONLY IF APPLICABLE]

## Reviewer notes — remove from the published notice

This draft follows the source inventory in PRIVACY-INVESTIGATION.md and the unresolved decisions in PRIVACY-OPEN-QUESTIONS.md. The owner confirmed testing use and requested placeholders. No jurisdiction, legal basis, minimum age, fixed general retention period, complete provider deletion, exclusive regional hosting or operational request process has been assumed.

Before publication, resolve all bracketed fields, verify deployed SDK/network and browser-storage behavior, reconcile native/store privacy disclosures with actual collection, assess retention of identifiable deletion records, complete provider/transfer review, and provide functioning policy links and a monitored request channel. No claim of legal compliance follows from this source audit. A qualified attorney should review the completed policy before publication.
