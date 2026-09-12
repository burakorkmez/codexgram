# Verification — 12 September 2026

- Existing backend suite: `npm test` — **28 tests passed, 5 files passed**. No backend code changed. Identities and Clerk deletion calls were mocked by the existing tests; no real-account deletion performed.
- `python3 legal/build.py` generated 16 sections (15 contractual sections plus reviewer notes) from the canonical Markdown. All **33 placeholder occurrences** are preserved and highlighted in HTML.
- `node --check legal/site.js` passed. Local HTML assets, links, fragment targets and duplicate IDs were checked with Python's HTML parser; all passed.
- Source hashes still match `source-manifest.json`; source application and backend were not changed.
- Chrome desktop visual review: hero, supplied imagery, feature sections, FAQ, footer and terms page. No captured console errors or warnings.
- Responsive checks: 320×740, 390×844 and 768×1024; no horizontal document overflow after fixes. Mobile terms text and section navigation render, including highlighted fields.
- Image preview opens with its explanatory caption; Escape closes it. FAQ expands. Deletion FAQ navigates to section 10 of the terms page. All three image sources load; full-image links remain available without JavaScript.
- Temporary viewport override was reset. Local preview remains available at `http://127.0.0.1:4173/` while the Python server is running. No public hosting or publication occurred.

Not tested: live OAuth/provider settings, real deletion, assistive technology beyond browser accessibility inspection, all browsers/devices, operating-system print/PDF output, or publication/contract enforceability. The Print / save PDF button uses the browser's native print dialog and a print stylesheet; no PDF artifact is claimed.

The repository's existing Vite config emitted a future config-loader compatibility warning during tests; it did not cause failures and was not changed.
