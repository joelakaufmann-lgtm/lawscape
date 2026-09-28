# LawScape Roadmap

Updated September 27, 2026 · Release 0.6.0 · Direction: Astra Plan v1.4

Legal learning should be fun, including learning how attorneys in different
jurisdictions approach the same dilemma. LawScape puts that learning inside
an original classic RPG: inspect the record, make a judgment, send a useful
reply, and build a practice. The next major work is live grading and a small
Cloudflare multiplayer pilot. Neither is active in this local release.

## Available now — local firm apprenticeship

- Seven isometric rooms: the main office, Jim and Linda's offices, the
  conference room, apartment, courtroom, and **The Sidebar** lounge.
- **Derek Balam, Bailiff**: a uniformed courtroom NPC with a badge and
  conversation. The Honorable A.I. sleeps in a high-backed judicial chair behind
  the raised bench. The court-closed notice and status dialogue make clear that
  this is a scripted preview; no AI judge service or hearing is running.
- Detailed desks and computer equipment, bound treatise shelves, drawer
  cabinets, upholstered chairs and sofa, conference/counsel tables and seating.
- **Unified BarMail:** open subject lines for practice questions or partner
  writing assignments inside one computer interface. Committed writing and
  partner feedback stay in the email conversation. The **Work Phone** replaces
  the prior Office Upgrade and grants inbox access in every zone.
- **B.A.R.T., robot butler and bartender:** three alcoholic drinks at The Sidebar
  apply zero Ethics damage and 40 seconds of half-speed movement. Water is free
  and has no effect. Drinks in Jim's office retain their existing consequences.
- **Billable-hours high scores:** the local top ten completed, disbarred runs
  persist independently from character saves. The timer counts visible time in
  open questions, writing assignments and feedback, excluding inbox browsing.
  The board is local and client-editable; it is not a verified online ranking.
- Human-proportioned original canvas attorneys; a shared creator and wardrobe
  with 16 hairstyles, 18 hair colors, seven facial-hair choices, 12 tie colors,
  six shirt colors, five suit colors, face shapes, builds, skin and eye colors,
  glasses, and angle/standing/walking/seated previews. Trousers are the default
  for everyone. A skirt suit is an optional choice for every gender.
- Six writing assignments, two original six-document synthetic files, flawed
  AI summaries, passage-linked review, saved drafts and a connected capstone.
  Committing locks an answer; an authored partner reply arrives after a short
  delay. Study gold is credited once, with a bounded revision opportunity.
- **Transparent local grading:** issue/action/evidence selections receive
  authored checklist feedback. Free-text replies and notes are retained for
  self-comparison; they are not AI graded. These new exercises use fictional
  State of Juris office policies and do not deduct Ethics.
- **The Sidebar local preview:** an explorable bar, seats, scripted robot bartender,
  commons, evidence/writing tables and an AI & agents table. Topic drafts save
  in the current browser. No shared messages, live agents, other-player
  presence, or network transport exists. Drafts will never auto-send later.
- 171 ethics questions: 20 California, 33 New York, 69 US MPRE-style,
  28 England & Wales SQE-style and all 21 original dilemmas. Question packs
  open directly from Firm jurisdictions. Source-review limits are recorded in
  the [catalog](docs/JURISDICTIONS.md); references remain available on the shelf.
- Firm jurisdiction requests save locally and can become a player-reviewed
  GitHub issue draft. They are not a public request queue or approved packs.
- Gold, upgrades, reward accessories, Ethics consequences and **full-reset
  disbarment**. Zero Ethics immediately ends the character and clears their
  run. No reinstatement bypass is planned. The answer key and local save are
  editable study material, not trustworthy online scores or wallets.

## Global curriculum — every LegalQuant jurisdiction

The goal is ethical questions from **every jurisdiction where there is a
LegalQuant**. The supplied July 1, 2026 community snapshot provides 27 geographic
starting points, listed in [JURISDICTIONS.md](docs/JURISDICTIONS.md) and visible in
**Journal → Firm jurisdictions**. Only aggregate place names are published;
member identifiers, profile details and private introductions are excluded.

These are future targets. Begin with local contributors and an identified legal
reviewer, determine the actual legal system/regulator (including subnational
systems), select dated primary sources, author original dilemmas, review the
answer key and test feedback before marking a pack available. Expand beyond this
incomplete snapshot as LegalQuants join or identify missing jurisdictions.
The present question packs remain distinct from full jurisdiction-specific firm curricula.
Canada remains a planned province-specific expansion.

## Next — live grading of written work

The current draft → commit → partner reply loop is the interface foundation.
The next implementation must assess the actual prose against a reviewed
record and jurisdiction-specific rubric, while preserving inspectable feedback.

1. **Review the curriculum first.** Name the jurisdiction, approved source
   version, effective/as-of dates, skill objectives, acceptable alternatives,
   rubric version, and reviewing attorney. Keep jurisdiction packs at the firm
   level. A request or bundled reference shelf does not activate a reviewed pack.
2. **Build the server attempt service.** Authenticate the player, validate the
   task and run, snapshot the committed answer and record versions, then enqueue
   grading. The server owns completion, rewards and ended-run status. Use an
   idempotent reward ledger so reloads, retries and duplicate callbacks cannot
   pay twice. A late result cannot revive a disbarred run.
3. **Evaluate a provider before selection.** Compare candidate graders on a
   held-out attorney-reviewed set including defensible alternative answers,
   incomplete responses, unsupported assertions, quote errors and prompt
   injection in student text. Measure disagreement, latency and per-attempt
   cost. Provider choice and spend caps remain open decisions.
4. **Validate each result.** Require structured rubric findings, supporting
   passage IDs, exact excerpts checked against the source, a confidence or
   abstention signal, and model/prompt/rubric versions. Distinguish legal
   correctness, record fidelity, judgment and writing quality. Generated
   feedback is fallible; deterministic code validates and applies the result.
5. **Make uncertainty playable.** Show pending, retryable, needs-review and
   completed states. Preserve the original submission and correspondence;
   allow a clearly bounded revision and a dispute/review route. Do not impose
   irreversible Ethics loss on uncertain or disputed AI grading. Start the
   live-grading pilot with study feedback and gold only.

Acceptance: attorney review of the benchmark and error policy; tested duplicate
jobs, reloads, timeouts, invalid citations, tampered run IDs, provider outages
and ended runs; explicit identification of authored versus live feedback. No
API key, grading secret, or authoritative reward computation in the browser.

## Next — ten-person Cloudflare multiplayer pilot

Start with ten individually invited human accounts and one shared **Sidebar**
room. The private offices and local apprenticeship can remain solo while the
room service is validated. This is a proposed architecture, not deployed code.

| Component | Planned responsibility |
| --- | --- |
| Browser | Render avatars, interpolation, room roster, topic chat and reconnect state; request actions |
| Worker | Validate individual sessions, invites and incoming payloads; route room and grading requests |
| Durable Object for the room | Authoritative room membership, positions, topic membership and ordered WebSocket broadcasts |
| D1 | Accounts, run/attempt records, receipts, progression and moderation records with explicit retention rules |
| Grading service | Provider access, validated feedback and idempotent settlement, separate from public chat |

Cloudflare documents [Durable Object WebSocket servers with hibernation](https://developers.cloudflare.com/durable-objects/examples/websocket-hibernation-server/),
[D1 storage](https://developers.cloudflare.com/d1/), and
[Worker secrets](https://developers.cloudflare.com/workers/configuration/secrets/).
These support the proposed service boundaries; authentication, persistence and
recovery behavior still need implementation and end-to-end testing.

- Use individual invite approvals and emailed login codes, not a shared
  password. Choose the delivery/authentication service during the online build.
- Show human display names and customized avatars, room capacity, actual
  presence, reconnect status and message delivery state. Never simulate online
  people. Validate identity and movement on the server; restrict customization
  to the supported appearance schema.
- Wire the existing stable topic IDs (`commons`, `evidence`, `writing`,
  `agents`) to shared chat. Bound message length and rate, render untrusted text
  safely, support mute/block/report and moderator removal, and decide chat
  retention before the first invitation. No automatic export of local drafts.
- Add **clearly labeled AI agents** as a separate, opt-in phase of the same
  room: identify the owning human, display an AI badge, and permit controlled
  agent-to-human and agent-to-agent conversation at the agents table. Give
  owners a stop control and enforce turn, rate and cost limits to prevent
  unbounded agent loops. Scripted B.A.R.T. is not a live AI agent.
- Keep room chat and agent messages outside the grading, account, wallet and
  moderation authority paths. Agent identities cannot impersonate people or
  gain authority by posting instructions in chat.
- Add a **shared billable-hours board** backed by server-owned run IDs and
  terminal events. Decide how visible activity, idle sessions, reconnects and
  overlapping tabs affect credited time; audit abuse before ranking players.
  Do not import editable local times as verified multiplayer scores.
- Persist rewards server-side; local saves may seed appearance, never trusted
  gold or assessment history. Record terminal runs server-side and start each
  replacement character with no retained inventory or progression.

Acceptance: ten distinct invited sessions; entry/exit and full-room handling;
reconnect after suspension; server restart and duplicate-message behavior;
identity spoofing, movement validation and unauthorized entry checks; moderation
controls; agent attribution and stop/loop limits; a tested spend cap and rollback
procedure. Public deployment follows the reviewed private pilot.

## Following — jurisdiction packs, court, and art

- **Global Law Firm:** reviewed packs for California, Nevada and Arizona first,
  followed by contributor-supported jurisdictions. Each task carries its own
  legal system and version; England & Wales stays distinct from Scotland and
  Northern Ireland. Publish a reviewed-pack catalog and moderated request queue.
- **AI judge agents and court simulation:** wake the current judge only after
  the court service is ready. Support interchangeable judge-agent profiles,
  selected explicitly per exercise, with an identified provider/model/version,
  jurisdiction and reviewed hearing record. Keep demeanor distinct from the
  legal rubric. Add witnesses, objections, evidence-linked reasons, abstention
  and human review. Evaluate each judge against attorney-reviewed examples and
  adversarial participant submissions; do not let chat become an instruction
  channel for the judge. Show which agent is active and when it is unavailable.
  Provider selection, cost limits and live court tests remain future work.
  A disputed or uncertain ruling cannot irreversibly end a run. Court access
  must never restore an ended character's inventory or gold.
- **Art direction:** keep original classic RPG styling. Compare this improved
  2D canvas office with the planned bounded WebGL office prototype on desktop
  and mobile before choosing a final renderer. More garments, professional
  accessories, room upgrades, sound and animation follow the comparison.
- **Assessed mode:** serve tasks without answer keys and validate submissions
  and results server-side. JavaScript obfuscation is not a security boundary.
  Preserve transparent explanations in study mode.

## Build record and contributions

See [local build notes](docs/archive/local-apprenticeship-build.md),
[README](README.md), and [CONTRIBUTING](CONTRIBUTING.md). The California and New York question source reviews are recorded with their
packs. Existing reference archives and the original 118 questions were retained
without a new substantive review. All clients and game matters are synthetic. Actual attorney content review and learner playtesting are
still needed before claims about educational effectiveness or legal accuracy.
