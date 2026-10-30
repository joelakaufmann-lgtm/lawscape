# LawScape Canada — local test package

Version **canada-0.1.0-review** · September 28, 2026 · **Practitioner review required**

The package contains 25 original multiple-choice questions and five email assignments, integrated into the local LawScape game. It covers five focused topics in Ontario, British Columbia and Saskatchewan. This is an English-language pilot, not comprehensive Canadian coverage, accredited education or an official regulator question bank.

## Start here

1. Open [the complete practitioner review](review.html) in a browser. It contains all questions, every option explanation, email records, sample replies, rubrics, sources and a notes field for each of the 30 exercises.
2. Open [the editable overview](overview.html) for the meeting summary. It uses LawScape colours and includes explanation popups, editing and HTML/template exports.
3. To play, open [LawScape](../index.html), create or continue a character, then choose **Journal → Firm jurisdictions → Canada**. BarMail’s practice selector also offers the pack. Choose **All mail** to see both questions and emails, or **Writing assignments** for the five emails.
4. For a shared review, send the complete ZIP. Extract it before opening files. The files run locally without an account or a backend. This run does not publish a live URL or send anything to your practitioner.

## What the local test does

- Since LawScape 0.8.0 the 25 questions are a full practice pack: they follow the shared difficulty tiers, pay gold by difficulty, cost Ethics when wrong, count toward streaks and appear in mixed practice. The inbox and each question are labelled "practitioner review pending" until a Canadian practitioner signs off on the answer key. The review package here is unchanged.
- Each email supplies a fictional record and asks for approximately 100–200 words. Drafts save locally. Committing preserves a reply; a revision retains earlier replies. Authored partner guidance, a sample and a 10-point rubric are available for comparison. No software grades the free text.
- Practice responses can be exported from a committed Canadian email. A full character reset clears the character’s test progress, consistent with the game’s reset behaviour. Export work first if it needs to be retained.
- Reviewer notes save in the browser separately from the game and can be exported as Markdown or JSON. These exports contain the pack version and content hash. “Proposed ready” is a review decision, not formal approval or publication. There is no automatic sync or sending.
- If browser storage is blocked or full, a visible message identifies session-only work. Copy or export before closing. Local files may have browser-specific storage behaviour; use the local server if preferred.

## Curriculum and sources

| Topic | Questions | Email |
| --- | ---: | --- |
| Ontario — LTB representation and support roles | 5 | Assign a hearing and identify outstanding notice |
| BC — referral fees | 5 | Explain the proposed fee and request client instructions |
| BC — recording conversations | 5 | Respond to a preference for manual notes |
| Saskatchewan — criminal language rights | 5 | Confirm French-language instructions and procedural steps |
| BC — undertakings and trust conditions | 5 | Address a requested early release of funds |

Read [QUESTIONS.md](QUESTIONS.md), [EMAILS.md](EMAILS.md) and [SOURCES.md](SOURCES.md). Five official primary sources were retrieved. Their original bytes and SHA-256 receipts are retained in `sources/`; HTML originals have a `.source` suffix to avoid executing source-site scripts. Text extracts are reading aids. Source retrieval and package checks do not validate the legal answer key.

The LSO Rule 3 webpage returned HTTP 403 and is not relied upon. The Ontario exercises use the LTB direction and explicit assumptions. Current underlying exemptions need practitioner review. No comprehensive case-law or privacy-law survey was performed. Dates stated by a publisher are kept distinct from retrieval and legal-review dates.

## Practitioner review agenda

For every question, confirm the practitioner role and forum, factual sufficiency, proposed answer, distracting alternatives, exceptions, rule locator and source currency. Flag any defensible competing answer. Review each email’s sample, accepted alternatives, critical issues and rubric against the fictional record.

Specific priorities:

- Ontario: current licensing exemptions; support versus representation; no implied competence from a licence alone.
- BC referrals: actual referral reason, reasonableness, client consent and no increase in total fee.
- BC recording: prior notice versus consent and separate information-handling obligations; no comprehensive privacy opinion.
- Saskatchewan: competence and the client’s choice; section 530 timing, late applications and local procedural mechanics.
- BC commitments: actual terms, oral undertakings, effective variations and reporting qualified by confidentiality/privilege.

The review page exports decisions for all 30 items, including those still unreviewed. Record reviewer identity, scope, legal-effective dates and resolved changes before proposing a release. The pack itself remains marked unreviewed until that work is done.

## Edit and rebuild

`pack.json` is the canonical curriculum. The question book, email book, generated game module and review page are derived from it. Use stable IDs; a content hash change archives earlier game responses rather than silently regrading them. Do not change generated `js/data/canada.js` or `js/lawscape.bundle.js` directly.

From the repository root:

```sh
node scripts/build-canada.mjs
node scripts/build-canada-review.mjs
node scripts/build.mjs
npm test
npm run build
npm run release:check
```

The plain HTML package needs no server, but `npm start` starts the local server on port 8000. The curated test ZIP includes the playable site, editable JavaScript and curriculum, a no-dependency Node build, tests and a full SHA-256 inventory. Its `release:check` verifies that inventory; after intentional edits, a hash mismatch is expected. See its root `START-HERE.md` for the archive-specific commands.

The LegalDesign overview plan, claim ledger and palette authority are in the authoring folder of the source package. The overview is a companion to the full exercise records; editing its presentation does not change the curriculum or legal status.

Read [QA.md](QA.md) for the completed technical checks and their limits. These checks do not replace the Canadian practitioner's review.

## Deliberate limits

This pilot adds content and review tools, not the proposal’s continuing-matter engine, a new Canadian map, real recording, a French-language course, live AI grading or cross-provincial licensing simulation. Regional office details and client needs provide a Canadian setting without treating decorative symbols as legal or cultural coverage.
