# Codexgram legal packet and landing page

Everything added for this task is in this folder. The owner confirmed testing-only use and requested placeholders for unconfirmed legal/business details. **This is a testing and attorney-review draft, not final effective terms.**

## Read in order

1. [Investigation](INVESTIGATION.md): repository evidence with file/line references, behavior, limits, third-party roles, deletion and backend map.
2. [Open questions](OPEN-QUESTIONS.md): user confirmation and remaining business/legal decisions.
3. [Terms of Service](TERMS-OF-SERVICE.md): canonical editable draft, ending in reviewer notes.
4. [Reviewer notes](REVIEWER-NOTES.md): unresolved legal/implementation issues and current primary-source references.

[source-manifest.json](source-manifest.json) records the inspected source snapshot with hashes. It excludes secrets and vendor dependency internals. The app was not modified or deployed.

## Landing page

Open [index.html](index.html) directly in a browser, or from the repository root run:

```sh
python3 -m http.server 4173 --bind 127.0.0.1 --directory legal
```

Then open `http://127.0.0.1:4173/`. The standalone site needs no build, npm install, auth keys or backend. It uses all three supplied PNGs unchanged, a copied local app logo, system fonts, responsive layouts, keyboard-accessible image dialogs and native expandable FAQs. Images remain ordinary links if JavaScript is disabled. No forms, analytics, remote fonts, store-download promises or fake signup controls were added.

[terms.html](terms.html) is the readable, printable terms page with highlighted placeholders and a contents menu. The canonical source is Markdown. After editing it, regenerate the HTML with:

```sh
python3 legal/build.py
```

The small standard-library builder supports the Markdown subset used in the terms: headings, paragraphs, bold, simple bullet lists and bracketed placeholders. It is not a general Markdown engine. Do not hand-edit generated `terms.html` or silently maintain two legal versions.

## Scope and handoff

The screenshots are labeled as product previews because they show fictional activity and simulated chat features. Real chat is text-only. Native app tabs were preserved; no Expo routes were changed. The existing app's Terms and Privacy links still show “not published” alerts: connect them only after the documents and URLs are finalized. The terms are marked `noindex` to reduce accidental search indexing; this is not access control.

Before publication, resolve every placeholder, finalize the privacy policy and provide functioning contact/notice/assent mechanisms, and have a qualified attorney review the packet. Copying this folder to a public host does not make those decisions or obtain users' agreement. There is no public deployment in this task.

## Privacy review

Read [PRIVACY-INVESTIGATION.md](PRIVACY-INVESTIGATION.md), then [PRIVACY-OPEN-QUESTIONS.md](PRIVACY-OPEN-QUESTIONS.md), then the canonical [PRIVACY-POLICY.md](PRIVACY-POLICY.md). The owner’s testing/placeholders direction is carried forward. [privacy.html](privacy.html) is the readable and printable version; the same `python3 legal/build.py` command regenerates both legal pages. Do not edit generated HTML directly.

[privacy-source-manifest.json](privacy-source-manifest.json) supplements the original snapshot with native declarations and the inspected installed Clerk dependency files. No real user data, credentials or live deployment settings were inspected. The audit separates code facts, provider documentation and operational unknowns. Privacy verification is recorded in [PRIVACY-VERIFICATION.md](PRIVACY-VERIFICATION.md).

## Support page

[support.html](support.html) is a simple static support page linked from the landing-page footer. Replace `[SUPPORT EMAIL]` and the unpublished-contact note when a contact is ready. It reuses the site styling and links to deletion information, privacy and terms. Built without tests or browser verification, as requested.
