# LawScape Roadmap

Updated October 29, 2026 · Release 0.8.0 · Direction: Astra Plan v1.4

Legal learning should be fun, including learning how attorneys in different
jurisdictions approach the same dilemma. LawScape puts that learning inside
an original classic RPG: inspect the record, make a judgment, send a useful
reply, and build a practice. Release 0.7.0 ships the invite-only Cloudflare
pilot (presence, the Associates' Floor and server-owned progress); live grading
and room chat are the next major work. The local release stays single-player.

## Available now — local firm apprenticeship

- Nine isometric locations: the main office, Jim and Linda's offices, the
  Associates' Floor, Juris Avenue, the
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
- 196 ethics questions: 20 California, 33 New York, 25 Canada, 69 US MPRE-style,
  28 England & Wales SQE-style and all 21 original dilemmas. New attorneys start
  on the originals; question packs open directly from Firm jurisdictions.
  Source-review limits are recorded in the [catalog](docs/JURISDICTIONS.md);
  references remain available on the shelf.
- **Juris Avenue:** a walkable street joining the law office, the apartments,
  the courthouse and The Sidebar, shared online. Travel stays as a shortcut.
- Wardrobe jewelry and accessories, formal wear behind the Wardrobe Rack, an
  earned barrister's wig, an office espresso machine, adoptable apartment pets,
  a paid arcade cabinet, a streak gold multiplier and an impaired-at-work
  Ethics penalty (0.8.0).
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
Canada is now a playable question pack; practitioner approval of its answer key and a full continuing-matter curriculum remain pending.

## In progress — Canada: professional responsibility and practice skills

**Status: 25 questions playable as a full pack (0.8.0); Canadian practitioner
review of the answer key pending.** The pack adds 25 multiple-choice questions
and five email assignments to BarMail, with a
[complete review package](canada-test/review.html) and
[HTML overview](canada-test/overview.html). It uses Ontario, British Columbia
and Saskatchewan settings, explicit roles and forums, and linked primary sources.
Questions pay gold, cost Ethics and join mixed practice like every pack; the
inbox labels the review status. The email assignments remain ungraded. The
continuing-matter engine remains future work.

- **25 multiple-choice ethics questions in the local test:** across the
  proposal's five topics—Ontario staffing and professional roles; BC referrals,
  recording notice, and undertakings/trust conditions; and Saskatchewan language
  rights. Include explanations, plausible alternatives, and fact variations.
- **Five email assignments in the local test:** one per topic, approximately
  100–200 words each, with fictional records, sample replies and proposed human
  review rubrics. Drafts, committed replies and revisions are retained locally.
  Authored guidance supports self-comparison; no AI grades the prose. Expansion
  to 5–10 assignments and connected follow-up correspondence remains planned.
- **Continuing practice files:** connect quick questions and written advice to
  later decisions and consequences. Preserve the proposal's province-specific
  rules, meaningful inquiry, defensible alternatives, and explanatory debriefs.
- **A developed Canadian identity:** build regional office settings, varied
  characters, Canadian spelling, appropriate English/French context, and local
  visual details with contributor input. Go beyond maple syrup and familiar
  symbols while retaining the game's office humour and professional pressure.

Milestones: confirm provincial scope, contributors, sources, and reviewers →
author and review the question bank and emails → integrate the continuing files
and Canadian setting → pilot with Canadian practitioners and learners. Track
each content format separately. Further provinces and territories follow their
own scoping and review; do not reuse one province's answer as a national rule.

Acceptance: qualified review of each exercise's facts, authorities, answer key
or rubric, alternatives, and feedback; testing of implemented interactions and
saved progress; and learner feedback on clarity, usefulness, and cultural detail.
See the [Canadian integration feedback](planning/canada-integration-feedback.md)
for the proposed curriculum and design direction.

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

## Shipped in 0.7.0 — ten-person Cloudflare multiplayer pilot

Ten individually invited accounts share every firm room plus the new
**Associates' Floor**; only the apartment stays private. The browser renders
avatars, name tags, desk plates and the roster; the Worker verifies Cloudflare
Access sign-ins; one FirmRoom Durable Object owns membership, positions, desks
and ordered broadcasts; one Account Durable Object per email owns progress
through the shared reducer with an idempotent action ledger. Operator steps,
quotas and rollback live in [docs/ONLINE.md](docs/ONLINE.md). Still open from
the original pilot scope: room chat, the shared billable-hours board, and
labeled AI agents. The table below records the deployed responsibilities.

| Component | Planned responsibility |
| --- | --- |
| Browser | Render avatars, interpolation, room roster, topic chat and reconnect state; request actions |
| Worker | Validate individual sessions, invites and incoming payloads; route room and grading requests |
| Durable Object for the room | Authoritative room membership, positions, topic membership and ordered WebSocket broadcasts |
| Account Durable Object (SQLite) | One per invited email: character document, idempotent action ledger, ended-run records. D1 is deferred until retention and moderation records need it |
| Grading service | Provider access, validated feedback and idempotent settlement, separate from public chat |

Cloudflare documents [Durable Object WebSocket servers with hibernation](https://developers.cloudflare.com/durable-objects/examples/websocket-hibernation-server/),
[D1 storage](https://developers.cloudflare.com/d1/), and
[Worker secrets](https://developers.cloudflare.com/workers/configuration/secrets/).
These support the proposed service boundaries; authentication, persistence and
recovery behavior still need implementation and end-to-end testing.

- Done: Cloudflare Access one-time email PINs on `/api` and `/ws`, with the
  invited emails listed in the Access policy. No shared password.
- Show human display names and customized avatars, room capacity, actual
  presence, reconnect status and message delivery state. Never simulate online
  people. Validate identity and movement on the server; restrict customization
  to the supported appearance schema.
- Next: wire the existing stable topic IDs (`commons`, `evidence`, `writing`,
  `agents`) to shared chat. Bound message length and rate, render untrusted text
  safely, support mute/block/report and moderator removal, and decide chat
  retention before enabling it. No automatic export of local drafts.
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
- Done: rewards persist server-side through the shared reducer; local saves
  seed only name and appearance. Terminal runs are recorded on the account and
  a replacement character starts with nothing.

Acceptance: ten distinct invited sessions; entry/exit and full-room handling;
reconnect after suspension; server restart and duplicate-message behavior;
identity spoofing, movement validation and unauthorized entry checks; moderation
controls; agent attribution and stop/loop limits; a tested spend cap and rollback
procedure. Public deployment follows the reviewed private pilot.

## Following — jurisdiction packs, court, and art

- **Global Law Firm:** reviewed packs for California, Nevada and Arizona first,
  followed by contributor-supported jurisdictions, including the planned
  [Canada pilot](#planned--canada-professional-responsibility-and-practice-skills).
  Each task carries its own
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
