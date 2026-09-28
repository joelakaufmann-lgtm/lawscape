> Historical design/build record. This is not the current player guide. See [How to play](../PLAYING.md).

# Lawscape local apprenticeship · Build notes


## Current update · 0.4.0 · The robot butler, BarMail and furnished rooms

Completed September 25, 2026. This local update adds the requested Sidebar
service, work phone, unified inbox, detailed furniture, sleeping judge and
billable-hours board. No deployment, commit/push or live AI service was performed.

### Playable additions

- **B.A.R.T., Robotic Butler & Bartender** stands behind The Sidebar bar in a
  black tailcoat, waistcoat, white gloves and bow tie, with an articulated metal
  head and serving tray. Click him or **Order a drink** for an Old Fashioned,
  house red, ale or complimentary sparkling water.
- Alcohol ordered in The Sidebar causes **zero Ethics damage** and halves
  walking speed for 40 seconds. Another drink refreshes the effect; it does not
  stack the penalty. The countdown survives reloads. Water has no effect. The
  existing office-whiskey Ethics consequence remains specific to the office.
- **Work Phone** replaces the old 2,000-gold Office Upgrade. It unlocks the
  entire BarMail interface from any room using the HUD button or B. Save schema
  5 converts an already-owned `office_window` to `work_phone` automatically,
  without charging again or changing progress. A charging phone appears on the
  office desk when owned.
- **BarMail now opens to a synthetic subject-line inbox** inside its computer
  interface. Partner writing assignments, drafts, sent attempts and replies sit
  alongside the selected ethics practice pack, including MPRE-style questions.
  Open a subject to answer it. Writing keeps its source briefing, editable draft,
  explicit checklist, committed attempt and delayed authored partner feedback.
  This build still uses local checklist scoring, not live prose grading.
- Billable time includes visible time inside opened questions, writing
  assignments and feedback; the inbox list and hidden tabs do not accrue time.
- A **Billable Hours Hall of Fame** board hangs in The Sidebar. Its detail view
  ranks the top ten locally recorded disbarred runs and shows the active run
  separately. A run is archived before the character reset; scores persist in
  separate browser storage while gold, upgrades and apprenticeship progress
  reset. Entries are deduplicated by run ID. Storage failures preserve a
  session-only copy and the game-over message explains that limitation.

### Furniture and courtroom

- Desks and tables now have separate legs, aprons, wood grain, beveled edges,
  drawers and handles. Workstations include monitor stands, mail on screen,
  keyboards, mice, cables, lined papers, pens and mugs; the second-monitor
  upgrade adds an actual second display.
- Treatise shelves have recessed shelves, vertical dividers, cornices and
  individual leather-bound volumes with gold spine bands and labels. The
  purchased library fills the shelves. Filing cabinets have separate drawers
  and labels; chairs have upholstery, backs, arms or casters; sofas and beds
  have seams, cushions and proper frames. Bar and courtroom counters have
  panels, trim and useful surface details.
- A raised judge's bench has an integrated high-backed chair, gavel, nameplate
  and a **sleeping robotic AI judge** visibly seated behind it. The courtroom
  is not in session. Clicking the bench or **Sleeping AI judge** explains the
  future docket; Derek Balam remains the bailiff.
- The roadmap separates these local features from future live grading,
  Cloudflare multiplayer/chat, server-validated shared scores, and interchangeable
  AI judge agents. No model, network conversation or adjudication is active.

### Validation of 0.4.0

- `npm run build`: regenerated the 28-module browser bundle and allowlisted
  static package. `npm test`: **42 tests passed**, plus static browser checks.
- New tests cover drink cost/location/terminal/pending guards, zero Ethics
  damage, slowdown and expiry; phone migration and access across all seven
  zones; terminal-score sorting, deduplication, reset persistence and storage
  failures; practice-pack inbox filtering and visible-message time accounting;
  and finite geometry/balanced canvas state for every prop and both robots.
- Browser QA on `localhost:8137` used fictional Morgan Example and Board Check,
  separate from the user's `127.0.0.1:8000` save. Opened an MPRE subject,
  answered it, committed a writing assignment, received its 3/3 partner reply
  inside BarMail, and returned to the assignment inbox and journal.
- Ordered an ale, verified unchanged Ethics and half-speed status after reload,
  bought the phone and treatise shelf through gameplay, and opened the full
  work-phone inbox from The Sidebar. A second bar order at **1 Ethics** left
  Ethics at 1. Inspected the populated library and sleeping judge in their rooms.
- Played a wrong answer through disbarment: the board recorded **0:02:14** for
  Morgan Example. The next character started at zero gold/time with no phone,
  while the score remained on the board. No fabricated scores were seeded.
- Inspected the inbox, embedded writing and bartender menu at **390 × 844**;
  restored the normal viewport afterward. The art remains original stylized
  2D illustration, with added detail rather than a new photorealistic renderer.
- Reloaded the fresh character and confirmed the same single historical score
  remained. The isolated browser session and packaged `dist/index.html` had no
  logged errors or warnings. Packaged HTML, CSS, bundle and README match source;
  `git diff --check` passed. The user's active preview was left in place; refresh
  it to load 0.4.0 and continue the existing save.

Source additions: `js/lounge.js`, `js/data/mail.js`, `js/entities/robots.js`,
and `tests/lounge-mail.test.mjs`. Integrations update the existing game, desk,
state migration, HUD, props, zones, styling and documentation.

## Previous update · 0.3.0 · Avatars, The Sidebar and Derek Balam

Completed September 25, 2026. This update implements the requested attorney
appearance improvements and local social space, and revises the roadmap for
live grading and Cloudflare multiplayer. It builds on the v1.4 apprenticeship
slice below. No deployment, commit/push or live service was performed.

### Appearance

- Replaced the short figure with an original articulated adult silhouette:
  longer legs, tapered jacket, separate neck/jaw/ears/nose/mouth, almond-shaped
  eyes with lids, irises, pupils and highlights, and more restrained movement.
- One shared editor drives the creator and wardrobe. It uses classic RPG
  category tabs, previous/next selectors, named color swatches, left/front/right
  previews, standing/walking/seated poses and a second view at world scale.
- 16 hairstyles and 18 hair colors; seven grooming options including clean
  shaven, stubble, moustache, goatee, short/full beard and moustache with goatee.
  Low and high ponytails now grow from the back of the head with curved tapered
  shapes and movement. Braids, locs, curls, crops, bob and half-up styles are included.
- 12 independent tie colors, six shirt colors, five suit colors, seven skin
  tones, six eye colors, three face shapes, three builds and glasses.
- Suit with trousers remains the default for every gender, including female.
  Suit with skirt is optional for all attorneys. Gender never resets or locks
  the other appearance choices. All basic appearance changes are free.
- The purchased gold tie remains an accessory. Picking a base tie color
  unequips it without deleting ownership. The existing wardrobe-rack purchase
  now adds a visible brass rail and displayed suits; it no longer gates colors.
- Save schema 4 migrates old characters without changing their first six hair
  IDs/colors, gold, upgrades or apprenticeship progress. Existing characters
  get trousers and default new fields. New appearance choices and lounge drafts
  persist; full-reset disbarment also clears them.

### Rooms and roadmap

- Added **The Sidebar**, a seventh explorable zone reached through Travel:
  green walls, a long bar, bottles and cups, three usable stools, topic tables,
  a noticeboard and Morgan Reed, an explicitly scripted NPC host.
- Room & Chat has commons, evidence, writing and AI/agents topics. Each stores
  its own 500-character draft locally, with a storage-status message. Send is
  disabled. There is no fabricated online roster or active AI conversation.
- Added **Derek Balam, Bailiff** to the courtroom with a uniform/badge, welcome,
  court-plans dialogue, journal handoff and route to The Sidebar. A contextual
  button makes the conversation accessible without a canvas click.
- Updated [ROADMAP.md](../ROADMAP.md) to separate implemented local features,
  live prose grading, and the ten-person invited Cloudflare multiplayer pilot.
  It covers reviewed jurisdiction rubrics, provider evaluation, validated
  feedback, server-owned rewards/ended runs, room chat/presence, moderation,
  individually approved login codes, and future owner-attributed AI agents with
  stop/rate/cost controls. Official Cloudflare architecture references are linked.
- Removed stale roadmap claims about an empty courtroom, timer-only document
  review, JavaScript obfuscation as score protection, and reinstatement replacing
  the chosen full-reset disbarment rule. README and in-game help reflect the update.

### Validation of 0.3.0

- `npm run build`: passed; regenerated the 25-module browser bundle and
  allowlisted static package. `npm test`: **37 tests passed**, plus static checks.
- Added migration and local-draft tests, tests for independent tie/accessory
  mapping, and canvas branch checks for all 2,016 hairstyle/facial-hair/outfit/
  pose/facing combinations. These check finite geometry and balanced canvas
  state; they do not claim to replace visual review.
- Pathfinding checks confirm new room interactions and exits are reachable.
- Browser QA used `localhost:8137` with fictional Morgan Example. Verified
  female/default trousers; optional skirt; low/high ponytails; locs, braids and
  full beard; face, skin and eye choices; shirt/tie choices; pose/direction
  previews; persistence into the shared wardrobe; and changing back to trousers.
- Played travel to The Sidebar, clicking and sitting on a stool, topic switching,
  saved per-topic drafts across reload, disabled Send, courtroom travel, Derek's
  welcome and follow-up dialogue, and the updated wardrobe.
- Inspected desktop and 390 × 844 mobile layouts. Fixed fieldset minimum width
  so all color swatches fit the narrow wardrobe. No errors or warnings appeared
  in the inspected browser log. Restored the normal viewport afterward.
- User's existing `127.0.0.1:8000` save was not loaded or modified during QA.
- The packaged `dist/index.html` opened successfully with no logged errors or
  warnings. Packaged HTML, CSS, bundle and README match the source; planning,
  archival copies and unrelated media remain excluded. `git diff --check`
  passed. The existing local preview was refreshed at its title screen.

The attorneys remain original stylized 2D figures, not photorealistic or a final
3D renderer. Live AI grading, network communication, agent execution, account
services and Cloudflare deployment are still planned work. The Sidebar UI is a
local preview and will not transmit its drafts automatically in a future build.

Source additions: `js/data/appearance.js`, `js/ui/appearance.js`,
`js/data/sidebar.js`, and `tests/appearance-sidebar.test.mjs`. Integration also
updates actor rendering, state, world/props, creator, wardrobe and main game flow.

## Previous implementation · 0.2.0 · Local firm apprenticeship

Built September 25, 2026, from remote-confirmed baseline `0de501bcc40a08568073a502e159faa60ceb6364`.
The user selected the newer Astra Plan v1.4 and authorized the local firm-apprenticeship experience.
The earlier attached HTML was reference material, not a separate authorization to spend, publish, or send messages.

## Play this build

- Open `index.html` directly, or run `npm start` and visit `http://127.0.0.1:8000`.
- Create an attorney or continue an existing character. Press **J** or choose **Journal**.
- Start with **Before you press send**, inspect its sources, write a reply, choose an issue/action/reference, and commit it.
- A partner reply arrives after approximately five seconds of active play, or when an overdue pending attempt resumes. Buy the 30-gold tie after a successful first checklist.
- Open **Evidence room** (also reached from the filing cabinet), flag source passages and write findings.
- Receive six writing replies and review both files to unlock the final handoff.
- Use **Firm jurisdictions** for local request drafts; the external GitHub form is an optional user-reviewed handoff.

## Implemented

- A responsive journal, writing inbox, evidence workspace, firm catalog/request form and wardrobe in the existing isometric world.
- Six assignments; two six-document fictional matters, Lantern and Harbor; one connected capstone. All 24 evidence paragraphs have stable references, and rubrics resolve to existing records.
- Autosaved drafts; committed answer snapshots with run, task, jurisdiction, curriculum and rubric version; pending partner replies; one credited reward per attempt; one invited revision; original correspondence retained.
- Deterministic assessment of explicit checklist choices. Prose and file-review notes are for self-comparison. The interface identifies authored feedback and does not claim AI assessment.
- Document flags with a transparent bonus for supported findings and a penalty for indiscriminate flags. File rewards issue once per character run.
- Independent avatar silhouette, glasses, jacket details, earned tie and briefcase, and existing wardrobe-rack suit colors. Cosmetics do not change checklist scores.
- Additive same-origin save migration. Existing progress stays intact. Full-reset disbarment now clears the run immediately rather than allowing a reload before the old restart button to retain it. Other tabs pause when the save changes.
- New files and quests are discarded with an ended character; pending attempts from that run cannot grant rewards to a replacement character.
- `npm test` now targets the supported test directory, leaving the existing archival copy untouched. The generated browser bundle and allowlisted `dist/` package were rebuilt.

## Validation

- `npm run build`: passed.
- `npm test`: **32 tests passed**, followed by static browser checks.
- `git diff --check`: passed.
- Unit coverage includes the complete six-task/two-file/capstone reward arc, duplicate rewards, snapshot isolation, pending work limits, revision caps, invalid submissions, source anchors, save migration, reload settlement, ended/stale runs, cosmetic purchases and request de-duplication.
- Browser checks used a separate test origin (`127.0.0.1:8137`) and a fictional test character; the user's existing `127.0.0.1:8000` save was not loaded or modified during testing.
- Browser-verified flows: creator/onboarding, all six writing assignments, commitment and lock, reload during pending review, reward delivery, a 30-gold wardrobe purchase, both document reviews, the unlocked capstone and its 175-gold reply, clickable feedback references, and a locally saved jurisdiction request. Final journal showed 6/6 replies, 2/2 files, a completed first day, and 535 gold (565 earned minus the tie). Desktop and 390-pixel mobile layouts were inspected. No runtime errors were observed in the inspected browser log.
- The packaged `dist/index.html` entrypoint also loaded successfully in the browser.
- Packaged index, stylesheet and bundle match the source build. Planning documents, archival copies and unrelated media are excluded from `dist/`.

## Boundaries and next decisions

This is a working local prototype, not completion of every phase of v1.4. No deployment, commit/push, account creation, paid service or external request submission was performed.

- **Legal content:** the new exercises use explicit fictional office policies and original synthetic records, not new legal advice. Real-jurisdiction firm packs remain unavailable pending current source/rubric review. Existing 118 legacy ethics/exam-style scenarios remain playable but were not newly cite-checked. England & Wales is labeled distinctly from the rest of the UK.
- **Scoring:** study gold reflects authored checklist choices, not the quality of free text. New exercises do not deduct Ethics. Existing ethics-game consequences remain in force. Rewards, review notes and saves are client-editable; this is not an authoritative online wallet, assessment, or credential.
- **Visuals:** this is an upgraded canvas avatar/UI prototype. The planned comparable WebGL office spike and final renderer choice remain open, as do a full wardrobe catalog and broader art production.
- **Firm catalog:** one fictional office is active. The catalog and local request route do not constitute reviewed selectable real-jurisdiction packs, a public request queue or server-side moderation.
- **Online phase:** Cloudflare, ten invited accounts, shared Sidebar room, server-authoritative attempts/wallets, provider evaluation and live AI grading remain later work.
- **Human evaluation:** attorney review of teaching content and actual learner playtesting remain required before claiming legal accuracy, educational effectiveness or release readiness.

Source modules: `js/data/apprenticeship.js` (records/rubrics), `js/apprenticeship.js` (state transitions), `js/ui/apprenticeship.js` (desk), `js/state.js` (migration), `js/main.js` (world integration). The generated bundle must be rebuilt after source changes.
