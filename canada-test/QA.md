# Canada pilot — technical verification

Pack **canada-0.1.0-review**. Implementation and checks completed September 28–29, 2026. **Canadian practitioner legal approval remains pending.**

## What was checked

| Check | Result and scope |
| --- | --- |
| Automated tests | **51 passed**: the 45 existing tests plus six Canada tests covering content structure and sources, opt-in selection, answer recording, email revisions, save migration/version archives, storage failure and original-source hashes. |
| Build and release checks | Browser bundle is current, static checks pass, and the allowlisted local site contains the Canada content and source files. Existing 171 questions remain separate from the 25-question test pack. |
| Real browser exercise flows | All 25 MCQs exercised through an incorrect answer, with all four explanations rendered; all five emails drafted and committed, with sample/rubric feedback. One email draft reloaded and one revision/export checked. |
| State and regression | Canadian MCQ attempts leave Ethics, gold, streaks and case counts unchanged. Reload and a new study round retain history. Switching packs restores the existing six writing assignments and capstone and excludes Canadian MCQs from mixed practice. |
| Practitioner review | Notes persist, HTML-like input is displayed as text, filters/search work, and Markdown/JSON exports contain all 30 items with the content digest. Blocked storage produces a visible session-only message. |
| Overview | Five detail targets open with pointer and keyboard input, Escape closes details, and focus returns. Text editing, working Save/reopen, client HTML export and template export were exercised. Exported copies reopen offline. |
| Layout | Chrome at 1280×800, 1440×900 with simulated 2× pixel density, 2560×1440, 430×932 and 390×844. Overview checked in both themes; game and full review checked on desktop and phone layouts. Expanded two-rule briefings remain scrollable above the mobile question. Screenshots inspected. |
| Palette | LawScape-derived overview palette passed the supplied contrast checker. Minimum tested text/background contrast: 6.15:1 light and 7.39:1 dark. This is not a full accessibility audit. |
| Transport | Packaged files were exercised both from disk and over a loopback HTTP server. No JavaScript page errors were recorded in the scripted flows. |
| Sources | Five official primary-source originals retained with byte counts and SHA-256 hashes; each hash matches the receipt. Retrieval does not establish legal completeness or correctness. |

## Evidence in the source ZIP

`canada-test/tests/` contains automated-test/build/release logs, the browser and overview-interaction reports, portable browser scripts, the palette report and selected screenshots. `PACKAGE-VALIDATION.json` at the archive root records the separate standalone rebuild, test run and inventory verification. `MANIFEST.json` inventories the archive payload; the adjacent ZIP checksum verifies the archive itself. Hashes establish byte identity, not legal approval.

The browser runs used fresh isolated profiles and fictional QA responses. The delivered review HTML and game contain no saved reviewer notes or QA answers. Browser state is stored separately on each device. Existing user browser progress was not used for testing.

## Boundaries of the evidence

- No Canadian practitioner has approved the proposed keys, samples or rubrics. Ontario exemptions, BC referral/recording/commitment exceptions and Saskatchewan language-rights procedure require the scoped review described in SOURCES.md.
- Five source retrievals are not a comprehensive case-law, legislative-amendment or privacy-law survey. The inaccessible LSO Rule 3 page was not relied upon.
- Phone sizes and Retina density were simulated in desktop Chrome; physical iOS/Android devices, touch/pinch behaviour, other browsers and assistive technologies were not exhaustively tested.
- Advanced shared-editor operations such as paint, marquee selection and diagram editing were not revalidated for this overview; it contains no diagrams. The core text edit/save/export/detail paths were checked.
- No educational-effectiveness study, French-language course validation, live AI grading or production deployment was performed.
- The repository base is LawScape 0.6.0 at commit `06265cb20a48183d16bb029246566e3e0fa1a8f7`. This pilot is an uncommitted workspace addition. A base commit identifies the starting point, not the exact pilot build; use the content and package hashes for that.

The local deployment is a review build. Nothing was published or sent to the collaborating practitioner.
