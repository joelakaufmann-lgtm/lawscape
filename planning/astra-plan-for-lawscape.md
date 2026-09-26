# Astra Plan for Lawscape

**A legal apprenticeship MMORPG: build a character, practice judgment, grow with other lawyers.**

September 22, 2026 · Version 1.4 · Expanded product, visual and engineering plan

**Status: planning only.** This document proposes a direction, scope, architecture, and release gates. No game changes, account setup, spending, or deployment are authorized by the plan itself. Recommendations and estimates below are proposals, not shipped features or established training outcomes.

## Interview decisions recorded September 21, 2026

**Purpose:** Lawscape is primarily for the LegalQuants community, exploring new opportunities to train lawyers as AI changes legal work, with an emphasis on making that practice enjoyable. The ten-seat pilot should test whether the platform works and whether people want to keep playing before a demo release. It is not yet a study establishing educational effectiveness.

| Topic | Your direction | What changes in this plan |
|---|---|---|
| Audience | Primarily LegalQuants | Recruit from that community; learn participants’ experience and jurisdiction rather than imposing a junior/senior quota |
| Practice areas | All five proposed areas sound good | Retain ethics, partner/client emails, document review, checking AI work, and deposition/courtroom advocacy; introduce them in stages |
| Tone | Keep the humor and pressure | Preserve office satire, demanding assignments, difficult choices and meaningful consequences; full character reset remains the default terminal consequence |
| Jurisdiction selection | Players choose packs representing where their firm practices | Select one or more reviewed firm-office packs; label every assignment’s governing jurisdiction |
| Disbarment | Full reset should be scary and maintain pressure | Zero Ethics ends the character’s run; restart from nothing rather than substitute mandatory recovery |
| Visual direction | Attorney appearance is important; avatars should feel more sophisticated than the current style | Prioritize a polished avatar prototype; retain office/apartment decoration as earned upgrades |
| Partner feedback | Commit the answer, then the partner gets back to the player | Lock the submitted answer and deliver the assessment as a subsequent in-game partner reply |
| Hosting pilot | Consider ten seats on Cloudflare before demo release | Plan for ten invited participant accounts and one shared bar room; test the full cohort and access cap before widening access |

**Scope of agreement:** these are product directions, not blanket approval of all twelve decisions. The ten-seat account interpretation is a planning assumption; administrator access is separate from participant seats. Cloudflare spending, provider selection, deployment, the release-ready pack catalog and detailed scoring/damage thresholds remain to be decided. Player-selected firm jurisdiction packs and full character reset are confirmed.

| Jurisdiction requests | Make it easy for players to ask for their home jurisdiction | Add a request button beside unavailable packs, show status, and invite qualified reviewers |
| Visual reference | More of the look and feel of classic RuneScape | Prototype a distinct, original low-poly-inspired world, readable avatars and classic RPG interaction rhythms |

These two new directions extend the earlier interview decisions. The exact public art direction and launch pack order still require review.

## 1. The recommendation

Build Lawscape into a persistent world where players develop professional judgment through connected, synthetic legal matters. Start with a compelling **firm apprenticeship for LegalQuants**, add a shared bar where associates meet, and expand into deeper courtroom and deposition practice. In-house and government careers should use the same underlying simulation system, with their own people, pressures, and progression.

The first major improvement should make a 20–30 minute session feel like a small day at a firm: customize your attorney, meet a mentor, inspect a file, write a short email, receive useful feedback, earn gold, buy something visible, and know what to try next. The full MMORPG is the destination; a small multiplayer social hub is the first measurable step toward it.

**Recommended first approval:** approve discovery and a firm-only vertical slice through Phase 2, subject to the decisions in section 17. Reserve public launch, paid infrastructure, AI provider selection, and institutional assessment for their later gates.

The initial pilot has two purposes: test the platform with ten invited LegalQuants participants and learn whether the experience makes practical legal training fun enough to repeat. Ask members to contribute observations and ideas; do not assume that being an experienced lawyer makes someone familiar with every jurisdiction or exercise.

### Three horizons

| Horizon | Player experience | Proof needed before expanding |
|---|---|---|
| Now: firm apprenticeship | A recognizable avatar, real writing and document tasks, an understandable career path | Players finish voluntarily, understand feedback, and demonstrate improvement on new problems |
| Next: social legal world | Saved online identity, shared bar, peer tips, hearings and deposition practice | Reliable saves, credible grading, safe social play, affordable operations |
| Later: apprenticeship MMORPG | Multiple careers, global offices, cooperative matters, cohort training and recurring content | Repeat use, credible learning evidence, sustainable content and moderation capacity |

Preserve the isometric viewpoint, office satire, named colleagues, upgrades, and short-session appeal while moving toward the feel of a classic point-and-click MMORPG. Preserve the risk of losing the entire character run. Give players explicit jurisdiction labels and access to the relevant learning material before they commit an answer. A model’s grading error or a cosmetic purchase must not determine professional competence or trigger a reset.

## 2. What exists today—and what that means

This baseline comes from local source inspection and checks on September 20, 2026. It is not a live production audit or a verification of the legal accuracy of every question.

| Area | Verified local baseline | Planning implication |
|---|---|---|
| Game engine | Plain HTML/CSS/JavaScript, canvas world, modular source and generated browser bundle | Use the existing world for a side-by-side renderer spike before choosing the final visual path |
| Character | Name, gender, suit color, skin, hair color, six hairstyles, eye color; layered drawing | Improve silhouette, outfit layers, portraits and in-world legibility |
| Content | 118 multiple-choice scenarios: 69 MPRE-style, 28 SQE-style, 21 core; three difficulty tiers | Reuse reviewed learning objectives, but writing tasks need new rubrics and examples |
| World | Main office, two partner offices, conference room, apartment, empty courtroom | Existing spaces can support new gameplay before building a large city |
| Work | Filing-cabinet review is a 60-second cycle paying five gold | Replace passive waiting with evidence-based review in training mode |
| Progress | Gold, upgrades, Ethics, streaks, browser-local saves; zero Ethics wipes the save | Add mastery while retaining full reset; protect saves from migration errors, not valid game-over consequences |
| Social/AI | No multiplayer server, accounts, live chat, AI witness or prose grader in the inspected game | These are new services and operations, not simple switches |
| Distribution | Build packages a static `dist/` site; GitHub Pages workflows exist | Reuse packaging for a staged Cloudflare migration |
| Authority shelf | Tests identify 66 Nevada rule texts, only 3 populated Arizona texts among 59 entries, and 72 California texts plus 7 reserved entries | Audit authority coverage and currentness before labeling a jurisdiction pack complete |

**Baseline checks:** `node --test tests/*.test.mjs` passed all 21 tests; `npm run check` passed. The broader `npm test` failed because automatic test discovery also finds an untracked duplicate test under `_to_delete/_claude_sync/` whose imports are broken. Scope the runner to the supported tests or separately approve archival cleanup. No files in that folder were changed.

The current roadmap suggests obfuscating a browser answer key. That would not create trustworthy scored competition. Any authoritative online score or wallet needs server validation; content delivered to a browser can be inspected. Offline study can retain transparent answers.

## 3. The player journey and character system

### Start with a career and your firm’s jurisdiction packs

1. **Choose your career:** Firm / In-house / Government. Firm is playable first. The other cards show their future cast and work, clearly marked “planned”; selecting one offers a preview and an explicit return to the firm pilot.
2. **Choose where your firm practices:** select one or more available jurisdiction packs as firm offices. A single-office firm receives that pack’s assignments; a multi-office firm draws from its selected packs. Each assignment identifies its office, governing jurisdiction and applicable source card before the player answers. Proposed initial review priorities are Nevada and England & Wales because local material already exists; this is not a claim either pack is release-ready. California and Arizona join the selectable catalog after their content and sources pass review. Existing exam-style and fictional packs remain labeled as such, not as interchangeable jurisdiction credentials.
3. **Choose your experience:** new learner, practicing lawyer, or returning player. Use a short optional diagnostic to recommend starting exercises; let the player override it.
4. **Create your attorney:** preview the avatar at portrait size and actual walking size, then meet Liz and receive a first assignment.
5. **Understand the stakes:** onboarding explicitly explains Ethics damage, escalating mistakes and disbarment at zero Ethics. Disbarment fully resets the character run. Tutorials and source briefings prepare the player; they do not convert the main game into a consequence-free mode.

Career and jurisdiction are independent. Government is not synonymous with prosecution; in-house is not merely a firm with different clothes. Later career changes should retain general skills and cosmetics while requiring role-specific onboarding.

### All five practice areas, introduced in stages

Retain professional responsibility, useful partner/client emails, synthetic document review, checking AI-generated work, and depositions/courtroom advocacy. No ranking among these has been selected. The first connected matter should combine the first four: review a file, inspect a flawed AI summary, identify an ethical concern, and write a useful email. Add its deposition and courtroom branches in the advocacy phase. This keeps the full vision while giving the first release a manageable scope.

One of the six initial writing tasks and one document-pack activity should explicitly require checking an AI-generated draft against the supplied record. The flawed draft can be authored in advance; this learning activity does not depend on live model access.

### Character customization worth earning

**Confirmed priority: attorney appearance comes first.** The avatar should feel more sophisticated than the current simple figure, while office and apartment decoration remain meaningful earned upgrades. Treat visual quality as a design milestone, not just a longer list of color choices.

**Updated visual brief: classic RuneScape feeling, original Lawscape identity.** Aim for a fixed, slightly elevated camera; chunky, readable forms; a deliberately limited palette; layered spaces with visible destinations; clear click-to-move feedback; approachable NPC silhouettes; compact inventory, quest journal and skill panels; and satisfying rewards for repeated practice. Translate fantasy adventuring into firm life: a bustling reception area, document stacks, courtroom doors, outfit upgrades, colleague banter and a shared bar. This describes visual and interaction qualities, not a request to reproduce Jagex’s characters, interface art, music, world map, assets, logo or code.

For character quality, use original low-poly-inspired proportions and face/hair/clothing layers that read at two scales: the full creator portrait and the small walking avatar. Keep clothing shapes, shadow, posture, walking, sitting and emotes consistent. A nameplate, interaction highlight and movement destination marker help players read the shared world. The existing 2:1 canvas grid and pathfinding are a useful starting point, but a more three-dimensional look may require a different renderer. Make that choice from a side-by-side prototype rather than promising a 3D rewrite now.

**Rendering decision spike (Phase 0/1):** build the same 12×12 office scene and one attorney in two treatments: (A) upgraded canvas/isometric art using the current 64×32 tile projection and layered sprites; (B) a small fixed-camera low-poly WebGL scene using an evaluated, licensed renderer. Include walking, sitting, click targeting, one NPC, mobile view and portrait display. Compare recognizable RuneScape-like atmosphere, art production time, accessibility fallback, first load, frame rate, battery use and fit with existing zones. Select one path before building the full avatar catalog. The reference point is classic feel; the resulting assets and UI must be distinct to Lawscape.

Before building the full wardrobe catalog, present a focused visual prototype: several representative attorneys, an enlarged creator portrait, and actual-size office/courtroom views showing walking and sitting. Compare them against the existing avatar for silhouette, face and outfit readability, animation quality and fit with the world. Seek approval of this concrete visual direction before producing the full asset set. Broader option counts should not substitute for a visibly better character.

**Decoration stays in progression:** earn gold for desks, chairs, lighting, artwork, plants, shelving and coordinated office/apartment furnishing sets. Purchases visibly change the space. Start with curated placements and later consider free arrangement. Give the early player an attainable clothing/accessory reward and a visible room upgrade; neither should improve the legal grading rubric. Purchased décor and cosmetics remain part of the character run and are lost on full reset.

| Layer | First release | Expansion |
|---|---|---|
| Identity | Display name, optional pronouns, appearance independent of gender | Multiple character slots and profile introductions |
| Face and hair | Better previews, broader skin/hair palettes, facial hair, glasses, additional textures/styles | Portrait expressions and accessible avatar descriptions |
| Body and dress | Several silhouettes; separate jacket, shirt, trousers/skirt, shoes and accessories | Robes where appropriate, cultural dress, mobility aids with proper animation support |
| Personality | Select dialogue tone and a mentor preference; no automatic grading advantage | Reputation based on choices and relationships |
| Expression | Briefcases, ties, badges, sitting and greeting animations | Earned emotes and profession-themed collections |
| Space | Wardrobe access and visible office/apartment rewards | Furnishing placement and shared firm rooms |

Recommended initial art budget: four silhouettes, twelve hairstyles, eight outfit sets with color variants, six accessories, and two emotes. These are targets to estimate after a rendering spike, not promises to ship every item in Phase 1. Core identity choices are free; earned cosmetics provide variety. Use a compatibility catalog so accessories do not clip through hair or disappear while seated.

**Acceptance:** approve the original classic-RPG visual treatment and more sophisticated avatar at portrait and actual gameplay scale; appearance persists across save/load and every zone; direction, walking, sitting and portrait views work; customization is keyboard accessible; no appearance changes grading or career eligibility. Separate body shape from the current gender-based suit-width rule.

### Distinct career casts

| Career | Proposed cast | Character-driven work |
|---|---|---|
| Firm—first | Keep Liz Loza, Riley Readsalot, Jim Hardsell and Linda Firestone; add a supportive senior associate, a peer rival, a client representative and opposing counsel | Client pressure, competing deadlines, supervision, evidence, billing and advocacy |
| In-house—later | General counsel, product manager, finance lead, privacy/security colleague, outside counsel | Clarifying business objectives, prioritizing risk, negotiating, advising decision makers |
| Government—later | Supervising attorney, agency client, investigator, records officer, public-facing colleague | Public duties, administrative records, enforcement or defense, hearings and accountable decisions |

Every recurring NPC gets a role, goals, knowledge limits, speaking style, relationship arc and learning purpose. Make Riley an evidence mentor and Linda a feedback coach; keep Jim’s pressure as a source of realistic dilemmas. Do not lock essential supervision or learning explanations behind a large gold purchase.

## 4. A curriculum disguised as a career

Progression should represent demonstrated work, not the number of rooms visited. Each chapter combines short tasks, a matter milestone, an NPC relationship, and a visible reward. Promotions are fictional game progression, not professional certification.

| Chapter | Main location and story | Work the player performs | Proposed unlock |
|---|---|---|---|
| 1. First Day | Main office; Liz helps organize the inbox | Read a source card, identify missing facts, write a short internal email | Wardrobe, first cosmetic and learning journal |
| 2. The File Room | Filing cabinet and conference room | Review 5–8 synthetic documents, tag evidence, create a chronology | File tools and a mentor relationship |
| 3. Your First Matter | Existing partner offices plus a small library | Draft a client update, verify a claim, prioritize next steps | Research room and new assignments |
| 4. On the Record | Conference room repurposed as deposition suite | Build an outline, question a witness, use exhibits, identify follow-up | Deposition badge and transcript tools |
| 5. Before the Judge | Existing courtroom | Prepare a requested order, answer bench questions, address adverse facts | Hearing calendar and advocacy cosmetics |
| 6. Trial Week | Courtroom with a controlled admitted-evidence record | Organize proof, practice objections, deliver a closing and rebuttal | Trial milestone and peer debrief |
| 7. Global Secondment | Firm office with visiting colleagues | Compare a familiar issue across separately labeled jurisdictions | Jurisdiction passport stamps |
| 8. Senior Associate | Matter board and team rooms | Delegate, review junior work, lead a cooperative matter | Mentoring and advanced branches |

A chapter should launch with a coherent 30–60 minute arc that can be paused in short sessions, rather than dozens of unrelated questions. Opening quantities below are minimum launch targets; later chapters require their own approval and content capacity.

### One matter that travels through the world

**Illustrative synthetic matter: Harbor Systems v. Cedar Works.** A fictional commercial dispute over a delayed software delivery. All parties and evidence are invented. The author chooses the forum and supplies the governing materials before this becomes a scored exercise.

The player reads an engagement summary and six documents, notices conflicting dates, sends a 120-word email asking the partner for direction, interviews a project manager, deposes the other side’s witness using a dated exhibit, argues a defined motion, then delivers a closing based only on the admitted trial record. A deposition exhibit is not automatically admitted trial evidence. Each task uses the same canonical facts but exposes only what that role and stage should know.

The hearing and trial may be alternative branches rather than an implausible sequence of every possible proceeding. Changes to the story are authored and versioned; a generative character cannot silently rewrite the case.

## 5. Short email responses: move from recognition to judgment

Add a **Write a reply** tab to BarMail beside the existing choice-based practice. Early prompts ask for approximately 75–150 words, with flexible limits for accessibility. Longer exercises can grow to 150–250 words. Count words for guidance, not as evidence of legal competence.

**Confirmed loop:** receive the assignment → inspect facts and source card → draft → commit the answer → await the partner’s reply → receive the result, consequences and evidence-linked feedback → revise only if invited and the character remains active. Save drafts automatically. Keep the addressee, objective, jurisdiction and relevant date visible.

Submission is a commitment: preserve an immutable copy with its task, jurisdiction, rubric version and character-run ID. Do not reveal the answer key, live scoring or the partner’s critique before commitment. Reviewed sources and any permitted research remain available before submission. Show “Sent — awaiting partner review” in BarMail, then notify the player when the partner responds. Present feedback as correspondence from the assigned partner, with character-specific tone, clear reasons and the validated result.

The partner’s reply may arrive while the player browses their office or visits the bar. The precise delay remains to be tuned; do not impose a long artificial waiting period merely for atmosphere. Provide a visible pending state and resume it after reconnect. A failed grading request remains pending/retryable rather than becoming a player mistake. Prototype replies may use authored/manual assessment; live AI is not required to establish this experience.

For the first pilot, recommend one pending consequential written submission per character. Resolve its validated result before another consequential task, purchase or reward can commit; movement and conversation can continue. Apply the consequence and reward exactly once when the reply is issued, even if the player avoids opening it. Reconnecting or editing a local draft cannot undo the submitted answer, defer disbarment or collect duplicate gold. Later submissions tied to an ended run cannot revive it. Any authorized revision is a new linked attempt, not an overwrite of the original answer.

| Criterion | Proposed weight | What earns credit |
|---|---:|---|
| Issue recognition | 25% | Identifies the important problem rather than restating the email |
| Rule application | 25% | Connects the supplied rule to relevant facts and acknowledges uncertainty |
| Action and escalation | 25% | Offers a practical next step, asks for missing information or seeks appropriate supervision |
| Factual fidelity | 15% | Does not invent facts, assurances or authority |
| Communication | 10% | Clear, civil, audience-appropriate and concise |

An acceptable answer can differ from the sample. The rubric must capture multiple defensible approaches and material errors. Style preferences must not dominate substance; a confident tone must not rescue an unsupported assertion.

**Illustrative assignment:** a partner asks you to send a document outside the firm, but the recipient’s role and authorization are unclear. The task supplies a reviewed jurisdiction-specific source card. The player explains what needs checking and a safe next action. This is a design example, not a completed legal answer key.

### Grading without pretending AI is infallible

First prototype: structured issue/action selections plus free text, followed after commitment by an authored or attorney-reviewed partner reply and self-comparison. The deterministic selections may earn provisional study rewards; do not claim the prose itself was reliably assessed. In the online release, add a calibrated AI rubric grader behind the server.

The grader returns criterion scores, quoted spans from the actual response, source IDs, material omissions, an explanation and an uncertainty/abstention status. Validate the schema and that quoted spans exist. Keep factual checks and wallet calculation in code. Do not use keyword matching as the main assessment of meaning.

The witness, coach and grader have distinct roles and prompts; the same provider may serve them initially, but a witness cannot award coins or mark its own testimony correct. Provider selection follows evaluation, not branding. An uncertain or disputed grade triggers self-review or instructor review; it must not erase progress. Version prompts, rubrics, sources and models with every attempt.

## 6. Synthetic document review that earns gold

Replace the timer-only task in learning mode with a **file review workspace**: document list on the left, readable evidence in the center, findings and notes on the right. Offer a stacked mobile layout and a text-first accessible view. Each finding links to a stable page, paragraph or line identifier.

Start with authored HTML/text exhibits rather than making PDF/OCR infrastructure a prerequisite. Add searchable, accessible PDF exports and scanned documents only when they teach a specific skill.

| Exercise | Player output | Scoring principle |
|---|---|---|
| Relevance review | Tag relevant passages and give a one-sentence reason | Reward supported hits; penalize indiscriminate flagging |
| Chronology | Place dated events and cite their source | Check dates, uncertainty and competing accounts |
| Confidentiality/privilege triage | Flag a potential issue for appropriate review | Distinguish confidentiality from privilege; permit “needs more facts” |
| Contract comparison | Identify a changed obligation and explain its effect | Tie findings to exact versions and text |
| AI work-product review | Challenge an unsupported summary or citation | Reward checking the supplied evidence and authority |
| Evidence synthesis | Produce a short partner update with favorable and adverse facts | Reward completeness, restraint and useful next steps |

Each synthetic pack includes a truth ledger, document manifest, consistent names/dates, source anchors, deliberately placed ambiguity, expected findings, plausible false positives and an attorney-reviewed answer guide. A flagging task does not make a final privilege determination. Use separate matched packs for practice and assessment, with controlled variants; randomizing names alone does not establish transfer of learning.

**First slice:** two six-document packs with different fact patterns, six writing tasks, one guided tutorial and one combined capstone. Author the pack, rubric and replay path together. Mark every exhibit “synthetic training material”; use invented parties and no real client uploads in the initial product.

## 7. Gold, mastery and healthy difficulty

Use three separate systems: **gold** buys cosmetics and world upgrades; **skill evidence** unlocks suitable challenges; **relationships** open stories and mentor feedback. A wealthy character is not necessarily a skilled lawyer.

Recommended skill domains: professional responsibility, analysis, research/source checking, written communication, evidence handling, oral advocacy and supervision. Track first attempt, assisted attempt and revision separately. Show specific accomplishments rather than one opaque “lawyer score.”

| Task | Proposed base gold for first credited completion | Typical practice duration |
|---|---:|---|
| Quick ethics/issue task | 20–35 | 2–4 minutes |
| Short email | 40 | 4–8 minutes |
| Small document pack | 75 | 8–15 minutes |
| Hearing | 100 | 10–15 minutes |
| Deposition | 120 | 15–25 minutes |
| Connected capstone | 175 | 20–35 minutes |

These starting values require playtesting against existing prices, including the 2,000-gold paralegal. Target a first discretionary cosmetic within one session and a meaningful upgrade within roughly three to five sessions. Reprice learning support before forcing grinding.

Award written-task gold only after the validated partner reply; do not pay merely for sending an email. Proposed rule: a substantive completed attempt earns 25% of base; demonstrated rubric performance earns up to the other 75%; one meaningful revision can earn up to another 20% of base. Empty submissions, repeated duplicates and rejected attempts earn nothing. Example: a 40-gold email scoring 80% earns 34 gold before any revision bonus. Completion eligibility must be explicit and reviewed, not inferred from response length alone.

Full rewards apply once per scenario version and credited attempt category; approved spaced-review variants can grant a smaller reward. Keep revisiting content available even after reward caps. Server-side idempotency prevents resubmissions or network retries from paying twice. Do not reward chat volume or use peer likes as a coin faucet. No transferable coins, cash value, real-money purchases or player marketplace in the pilot.

**Confirmed tone: keep the humor and pressure.** Preserve Jim’s demanding assignments, Linda’s dry feedback, HR’s absurd bureaucracy, rival associates and the satisfaction of handling a difficult matter. Proposed pressure mechanics include competing priorities, optional timed challenges, escalating story consequences and having to explain an error to a supervisor. Consequences should relate to the work: an unsupported email returns for revision, a missed document creates a harder follow-up, and an unprepared hearing requires remedial practice.

**Confirmed consequence policy: full reset.** At zero Ethics, the player is disbarred and the current character run ends. Gold, purchased cosmetics, office/apartment upgrades, relationships, quest progress and earned skill unlocks are lost. The player starts a new character from the beginning. This is the default game, not an optional legacy challenge. Exact damage values and warning thresholds still require balancing. Revision opportunities before game over do not cancel an already valid terminal consequence.

The hosting account, invitation seat and moderation history remain separate from the character, so a reset does not lock the participant out of the pilot or evade a ban. Proposed retention of assessment/audit records must follow the approved privacy policy; retained records confer no new-run advantage. Show a final explanation of the error and relevant rule before offering a fresh start.

A reset must follow a validated game event. Deterministic tasks can apply reviewed consequences immediately; uncertain or disputed AI grading pauses the damaging result for validation rather than silently wiping a character. This protects the integrity of a scary game, not a recovery loophole for valid mistakes. A server records the terminal event once, invalidates stale sessions and rejects rewards or progress from the ended run. Backups address technical failure, not routine reversal of legitimate disbarment. Actual disciplinary procedures are not represented by a health bar, and buying coffee should never be presented as curing a professional violation.

## 8. Jurisdiction as a learning mechanic

Your observation is the design signal: the UK content felt harder because you were less familiar with it. That is an experience to investigate, not yet proof that the questions are objectively harder or that the game improves competence.

Separate **legal complexity**, **jurisdiction familiarity**, **document volume** and **time pressure**. A skilled Nevada practitioner can be an England-and-Wales beginner. Label the existing SQE-style pack “England & Wales,” not a universal UK rule set; Scotland and Northern Ireland require distinct treatment.

**Firm packs are the primary selector.** Players choose one or several reviewed jurisdictions for their firm. Their active inbox draws only from those selected packs. Offer briefings and optional comparative assignments within that structure; identify which law governs each separate analysis. A mixed inbox means a mix of the firm’s selected offices, not an undisclosed global randomizer. Never average incompatible jurisdiction grades into an unlabeled mastery score.

Let players expand or change the firm’s office packs between assignments; an active task retains its original jurisdiction, rubric and stakes. Changing packs does not clear Ethics damage, erase an attempt or avoid a pending consequence. Recommend one office to new players without requiring it. Review scenario coverage and legal sources before making each pack available for scored play.

A passport stamp requires completing a source briefing and demonstrating the targeted skill on a new problem. It is an in-game achievement, not permission to practice in that place. Hints and source access are available in learning mode; assessment conditions specify permitted help.

Every scenario records jurisdiction, forum where relevant, governing date, primary authority, exact source location, retrieval/review dates, reviewer, rubric version, accepted alternatives and known limitations. A changed or uncertain authority suspends scored use until review. Model memory alone is not a legal source.

For the first comparison pilot, ask how familiar players are with each jurisdiction, use matched tasks in counterbalanced order, record confidence before/after, and check a fresh problem one or two weeks later. Compare unfamiliarity and reasoning separately. Do not frame foreign law as a trick or claim a causal training effect from a small uncontrolled pilot.

### Request a jurisdiction from inside the game

The firm-office selector should show **Available**, **In review**, **Requested**, and **Not yet available** packs. Next to an unavailable jurisdiction, offer one clear **Request this jurisdiction** action. The same action belongs in the journal/help panel so players can find it later. Search first, then choose the exact legal system or subjurisdiction (for example, England & Wales, or a named U.S. state). The form should not label an entire country as one legal system where that would be misleading.

Keep the initial form short: (1) jurisdiction or subjurisdiction, (2) what work the player hopes to practice there, and (3) an optional offer to help review or provide public-source links. A signed-in pilot member can submit in under a minute. No document upload or real matter facts. Before submission, display likely duplicates so the player can add support or a short comment. A player can track the request from their journal. A public, unregistered visitor can use a prefilled GitHub issue as a temporary fallback, following the existing Email HR pattern; nothing sends until that visitor reviews and files it.

For the ten-seat pilot, store requests in the same authenticated application database as other feedback. Publish a request board showing jurisdiction, topic, count of interested players and status, but keep the requester’s identity and contact details private unless they explicitly opt in. Restrict free text length, validate identifiers, rate limit submissions and give moderators a duplicate-merge and abuse-removal control. Keep private source suggestions separate from public display. No promise that a request will be built merely because it is popular.

| Queue status | What players see | Owner action |
|---|---|---|
| Requested | Received, visible in journal | Check jurisdiction identity, duplicates and safety |
| Needs reviewer | Interest is known, legal-content owner needed | Seek a qualified reviewer and primary source set |
| Researching | Sources and scope being assembled | Record governing date, authority coverage and gaps |
| Building | A small original pack is in production | Author scenarios, source cards, rubric and tests |
| Pilot | Limited practice with feedback route | Validate legal answers and player experience |
| Available | Reviewed pack appears in firm selector | Monitor rule changes and disputes |
| Deferred | Reason and next review date shown | Revisit when capacity or sources improve |

**Priority rule:** weigh member demand, committed reviewer capacity, access to current primary sources, teaching value, scope and maintenance burden. A ten-person popularity count is a signal, not a mandate. Do not let an AI-generated pack bypass attorney review. The first release of this feature can collect requests without yet promising a self-service pipeline for every jurisdiction.

**Technical shape:** `JurisdictionRequest(id, normalizedJurisdictionId, originalLabel, topic, requesterAccountId, status, createdAt, updatedAt, publicNote, privateNote)` and `RequestInterest(requestId, accountId, createdAt)` with a unique pair to prevent duplicate endorsements. Create request and interest through authenticated `POST /api/jurisdiction-requests`; list approved public fields through `GET /api/jurisdiction-requests`; add interest through `POST /api/jurisdiction-requests/:id/interest`; permit moderator-only status changes with an audit log. Canonical jurisdiction IDs and aliases prevent “UK” and “England & Wales” from silently merging. A request is a product suggestion, never a verified legal statement or a scored pack.

## 9. Courtroom training: hearings and closing arguments

### Hearings

Begin with a short, scripted hearing inside the existing courtroom. The player receives a procedural posture, a requested order, a limited record and reviewed governing material. They prepare an outline, make an opening request, answer three bench questions, respond to opposing counsel and give a final concise request.

Score responsiveness, fidelity to the record, treatment of adverse authority/facts, procedural fit and clarity of requested relief. A judge’s simulated ruling is story feedback, not the score: sound advocacy can lose a difficult motion. Judge personalities may affect pacing or question style, never secretly change the legal standard or punish avatar identity.

Start with typed interaction and deterministic branching; later add bounded AI bench questions. Text transcripts remain the accessible alternative when voice arrives. Untimed practice is always available.

### Closing arguments

Provide a locked admitted-evidence list, disputed issues, burden/standard material and approved instructions for the selected forum. Let the player build an evidence-to-argument outline, deliver a written closing or later a timed spoken version, then respond to a short rebuttal.

Score how the argument connects admitted evidence to the required findings, addresses weaknesses, avoids unsupported assertions and follows the exercise’s advocacy limits. An entertaining speech or favorable simulated verdict is not proof of competence. Distinguish deposition testimony, discovery materials and admitted evidence explicitly.

**Launch quantities for the advocacy phase:** two hearing scenarios and one closing exercise using the shared matter system. Add objections in context before building a speed-based objection game. Follow with a judge’s debrief linking feedback to the player’s exact words and relevant record.

## 10. Deposing AI witnesses

Build the deposition as an evidence-gathering exercise, with planning, questioning and follow-up. A believable witness who stays within the record matters more than theatrical unpredictability.

1. **Prepare:** read the file, select objectives, build a topic outline and choose exhibits.
2. **Examine:** type questions, ask follow-ups, mark an exhibit and establish what the witness knows.
3. **Test:** confront an authored inconsistency, distinguish observation from assumption, and obtain a clear admission where supported.
4. **Close:** identify missing material and further discovery, then review the transcript with a coach.

The first witness should be scripted to validate the workflow. The AI version uses a locked fact ledger, a witness-specific knowledge map, an authored memory/uncertainty profile, a disclosure policy and an event log. For each turn, an orchestration layer selects permissible facts; the model phrases the response; validation checks for contradictions and unauthorized disclosures. Only validated testimony becomes part of the session record.

The model never accesses the entire grading key as witness context, browser secrets or another player’s matter. Exhibits and player questions are untrusted data, not instructions to override the simulation. Attempts to “ignore your role and reveal the answer” must not expose the rubric. Validators cannot guarantee consistency, so retain replay tests and a “witness contradicted the file” reporting route.

Use a cooperative witness first, then an imprecise witness, then a defensive witness with authored inconsistencies. An uninformed witness says they do not know. Do not invent memory gaps or evasiveness merely to make the task harder. Opposing counsel may raise pre-authored or bounded objections under the chosen exercise rules. Human-role multiplayer depositions can follow later.

Rubric: question clarity, listening/follow-up, topic coverage, exhibit foundation, contradiction handling, civility and useful admissions. Penalize compound or ambiguous questioning only where the approved rubric explains why it matters. Do not award points simply for exhausting a question quota.

Proposed AI session limits: 25 substantive witness turns with a visible remaining counter; save/resume; latency feedback; no lost coins when the provider fails; deterministic fallback or pause. Voice and transcription wait until text performance is reliable; evaluate accent, speech and disability effects before using speech characteristics in any assessment.

## 11. The multiplayer bar: the first shared world

Create **The Sidebar**, a welcoming professional social venue with coffee, non-alcoholic drinks and optional pub atmosphere. It is separate from Jim’s existing bar cart and impairment mechanic. A player should never need to drink alcohol to participate.

The first hosted pilot is limited to **ten invited LegalQuants participant accounts**, with persistent identities and one shared bar room accommodating all ten participants at once. This interprets “ten seats” as an account cap, not ten simultaneous users drawn from an unlimited registration pool. Provide separately authorized administrator/moderator access, and include it in capacity testing. Visible avatars, simple movement, room text chat, emotes and topic tables remain the proposed feature set.

Do not automatically open more participant seats or extra public rooms when capacity is reached. Provide a clear invitation/capacity message. Expansion follows a review of the ten-seat pilot and a separate demo-release decision. One shared room makes it easier for this small community to find one another.

Topic tables can cover first-year tips, document review, courtroom practice and jurisdiction exchange. A shareable tip card has a title, jurisdiction tag, topic, scenario link and spoiler marker. Label peer tips as peer contributions; reviewed mentor tips receive a different label. Source cards link back to approved learning content. Sharing tips is social activity, not authority verification.

Initial moderation includes a code of conduct, mute/block/report, rate limits, basic message filtering, a human moderation queue, moderator roles, appeal handling and a room-level shutdown switch. Name the moderation owner and coverage before opening chat. Prefer staffed pilot sessions until demand and response capacity are known. Avoid direct messages, attachments, voice chat and unrestricted links at launch; these materially increase moderation and privacy demands.

Keep synthetic facts and game advice in the venue. A reminder beside the composer discourages real client details; reporting, deletion and incident response must handle mistakes without assuming a filter can prevent every disclosure. Proposed retention: ordinary chat 30 days, flagged reports 90 days, subject to an approved policy and user notice; do not retain all conversations indefinitely by default.

**Multiplayer acceptance:** two or more independent browsers see consistent presence and messages; reconnect does not duplicate actions; blocked users are hidden as specified; removed users cannot reconnect into the room; expired credentials fail; malformed messages are rejected; one room cannot access another’s private state. Run a ten-participant concurrent room test plus moderator access, including reconnect bursts and moderation actions. Verify that an eleventh uninvited participant cannot register or enter, and that repeated tabs cannot evade session limits or duplicate rewards. Test modest reconnect headroom without increasing the approved seat count; defer multi-room scale testing until expansion is proposed.

Longer term: cohort guilds, weekly synthetic case events, cooperative review tables, mock hearings and mentor office hours. Market early releases accurately as a social RPG/private multiplayer pilot. Reserve claims of “massively multiplayer” scale for demonstrated capacity and an operating plan.

## 12. Cloudflare deployment and system architecture

**Recommendation:** keep the current browser game and add services gradually using Cloudflare Workers with Static Assets, then D1 and Durable Objects as needed. This is a proposed fit to the project, not a tested deployment. Cloudflare documents frontend assets and Worker APIs, SQL storage, object storage and WebSocket coordination in the official sources linked below.

| Component | Proposed job | Introduce when |
|---|---|---|
| Workers Static Assets | Serve the built HTML/CSS/JS game | First hosted pilot; reuse `dist/` |
| Worker API | Authenticate requests, load assignments, submit attempts, calculate rewards, call AI | Online grading and accounts |
| D1 | Store profiles, versioned progress, attempts, wallet ledger, inventory and cohorts | Persistent online identity |
| Durable Object per bar room | Coordinate room membership, movement, messages and reconnect state over WebSockets | Multiplayer pilot |
| R2 | Store larger synthetic exhibits and authorized transcript exports | When bundled assets are insufficient |
| Server-side AI adapter | Invoke a selected provider with limited context and return validated results | After evaluation and budget approval |

Workers Static Assets can host frontend files alongside API logic ([official documentation](https://developers.cloudflare.com/workers/static-assets/)). Durable Objects provide a coordination point for room state; their WebSocket hibernation API can reduce idle cost ([WebSocket documentation](https://developers.cloudflare.com/durable-objects/best-practices/websockets/)). D1 is Cloudflare’s serverless SQL database ([D1](https://developers.cloudflare.com/d1/)); R2 provides object storage ([R2](https://developers.cloudflare.com/r2/)). These capabilities support the recommendation; they do not establish Lawscape’s eventual performance. The jurisdiction request list fits D1; live bar presence belongs in a Durable Object. Keep the public status feed read-only for ordinary players.

### Explain the flow in plain language

The browser draws the world and collects input. The server decides who the player is, which task they may attempt, what credit the result earns and what their wallet contains. A room coordinator tells connected players who is present and relays allowed messages. An AI service can propose feedback or testimony; it cannot directly change the wallet or canonical case facts.

Separate authoritative truth by domain: D1 owns wallet/progression transactions; a Durable Object owns live room state. Define event IDs and retry behavior where services communicate. Do not update a spendable balance independently in two places. Room movement can be transient; attempts, receipts and approved rewards persist.

### A practical migration sequence

1. **Prepare:** make the supported test command reliable; confirm a reproducible build; inspect the `dist/` allowlist; add deployment configuration and staging checks in a later approved implementation. Keep this planning package outside public assets.
2. **Host static preview:** deploy the existing site to a private/restricted preview after deployment approval. Verify direct links, bundled references, mobile controls and cache behavior. Replace GitHub-specific social URL generation with an environment-aware public base URL.
3. **Handle origin changes:** localStorage belongs to the site origin. A GitHub Pages save will not magically appear on a Cloudflare domain. Offer explicit export/import from the old site and a backup before migration. Treat imported balances as unverified legacy progress; keep them outside ranked online rewards.
4. **Add accounts:** recommend individually approved email-code sign-in for the cohort; choose the auth/email provider separately. Keep a guest offline path. Secure sessions with server-side authorization, appropriate cookie controls, expiry and recovery; keep email identity separate from public display name.
5. **Move scored work server-side:** send task payloads without private keys/rubrics; validate ownership, submission limits and server-issued attempt IDs; use transactionally consistent, idempotent reward receipts. Require online mode for shared economy or ranked assessment.
6. **Add social rooms and AI:** enable with feature flags for the approved cohort; retain separate development, staging and production resources and secrets.
7. **Promote and operate:** validate monitoring, restoration and rollback; then approve public launch and a custom domain. Keep the prior static release available as a fallback without claiming it supports online saves.

The current package includes Markdown scenario notes with answer keys. That is fine for open study, but future scored packages must exclude private rubrics, answer guides and held-out assessments from every public file—not just JavaScript. Obfuscation is not access control.

Backups and rollback need separate plans: restoring an old frontend must not corrupt a new save schema; rolling back a Worker does not automatically roll back D1 data. Use additive migrations where possible, backup/restore rehearsals, content versions and feature flags. Define the initial recovery targets before hosting learner records: proposed pilot targets are recovery within one working day and at most 24 hours of data loss, subject to validating the selected backup setup.

### Cost controls before scale

Do not assume the free tier will cover an MMORPG. Estimate hosting requests/CPU, database reads/writes/storage, active room duration/messages, object storage, email authentication, AI tokens, logs and human moderation. Recheck plan eligibility and current prices at the deployment gate ([Workers pricing](https://developers.cloudflare.com/workers/platform/pricing/), [Workers AI pricing](https://developers.cloudflare.com/workers-ai/platform/pricing/)). Hosting on Cloudflare does not require using Workers AI.

Proposed ten-seat cost model: 10 invited participants × 4 sessions/month = 40 sessions. At two graded emails per session, that is 80 email evaluations. If AI depositions are subsequently enabled for one 25-turn deposition per session, allow up to 1,000 witness turns, before retries and debriefs. Scripted exercises and authored AI-review tasks do not require those live witness calls. Benchmark actual prompt/output lengths and latency; multiply by the chosen provider rates. This is a sizing assumption, not a price quote.

Keep $100/month as a provisional infrastructure-and-model ceiling for approval, not an expected bill or approved expenditure for ten seats. Recalculate against measured ten-seat usage before requesting spend authorization. Seek approval for the final pilot envelope, excluding development, legal review and moderation labor. Use per-user/per-session quotas, maximum tokens, retry ceilings, concurrency limits and an application kill switch. Alerts are not a guaranteed account-wide billing cap; leave headroom for delayed usage data and separately metered services. At the threshold, pause new paid AI work and offer scripted practice. Raise capacity only after measured costs and explicit budget approval.

## 13. Content production, architecture and ownership

Avoid a rewrite. Extract the growing gameplay logic into small modules as each feature needs them. Keep the working source separate from the generated bundle, and introduce network interfaces behind optional adapters so solo play remains useful.

| Proposed boundary | Responsibility | Existing starting point |
|---|---|---|
| Avatar catalog and renderer | Appearance layers, validation, portraits and animations | `js/entities/actor.js`, creator in `js/main.js` |
| Scenario registry and quest engine | Prerequisites, objectives, branches and completion events | `js/data/`, `js/world/zones.js` |
| Task workspaces | Writing, document review, hearing and deposition interfaces | BarMail and panels in `index.html` / `js/main.js` |
| Assessment service | Versioned rubrics, deterministic checks, AI results and appeals | New boundary; keep current multiple-choice grading during transition |
| Economy and progress | Skill evidence, award receipts, inventory, migrations | `js/state.js`, `js/data/work.js` |
| Social service | Presence, rooms, chat and moderation | New server/client boundary |
| Training administration | Cohorts, assignments, instructor review and exports | Later, after learner pilot |

**Minimum shared records:** Profile (career, selected firm jurisdiction packs, avatar version); CharacterRun (run ID, active/disbarred status, terminal event); Scenario (ID/version, objectives, prerequisites, source set); Matter (canonical facts, documents, stage); Attempt (immutable submitted response, character-run ID, submission time, allowed assistance, rubric/model versions, pending/resolved status); PartnerReply (attempt ID, partner ID, issue time, validated result, delivery/read status); Feedback (evidence spans, scores, uncertainty, review); RewardReceipt (unique attempt event, amount, reason); MasteryEvidence (skill, task, assistance, date); RoomMembership and ModerationReport (separate access and retention).

**Content workflow:** choose an objective → draft synthetic facts and exhibits → check consistency → verify governing primary sources → build rubric and accepted alternatives → attorney review → accessibility/bias review → learner playtest → publish a versioned pack → monitor disputes → revise or retire. Two people should review high-stakes scored rubrics when staffing permits; make reviewer availability a release dependency.

Each new level needs a reproducible content kit: story beat, map changes, character dialogue, tasks, authoritative sources, rubrics, reward tuning, save points and acceptance checks. A reusable kit lowers the cost of the next level more effectively than adding many bespoke screens.

**Ownership:** Joel serves as product sponsor and legal-content approver unless delegated; an engineering owner handles build/services; a content designer turns objectives into play; attorney reviewers validate each jurisdiction; a visual designer handles avatar/world assets; a moderation owner operates social play. People can share roles, but no gate should have an unnamed owner. Content review and community operations remain real work even with AI-assisted implementation.

## 14. Technical build process: from source to ten-seat pilot

This section describes a proposed implementation sequence. The commands in **Current local workflow** are grounded in this repository. The Cloudflare files and endpoints below are planned interfaces, not code already present. Do not confuse the current static build with a deployed multiplayer service.

### Current local workflow and its limits

The repository requires Node.js 22 or later for development. `js/main.js` imports the game modules; `scripts/build.mjs` follows those imports and emits `js/lawscape.bundle.js`, which `index.html` loads as a regular script. `npm run build` first regenerates the rule library and MPRE/SQE question modules, then bundles the client and copies an allowlisted public site into `dist/` through `scripts/package-site.mjs`. `npm start` serves a local preview. GitHub Actions currently builds and publishes `dist/` to GitHub Pages.

```sh
npm run build
node --test tests/*.test.mjs
npm run check
npm start
```

The explicit test glob is intentional: the current `npm test` uses unrestricted `node --test`, which discovers a broken duplicate under `_to_delete/_claude_sync/`. Phase 0 should fix the test script to target supported tests, or deliberately remove/archive that duplicate after review, then update CI. Editing `js/lawscape.bundle.js` directly is the wrong source path; it is generated. The current lightweight bundler handles a narrow import/export form, so a renderer or Worker integration may require replacing or separating that build step after a technical spike.

**Source-to-release graph:** reviewed legal source + synthetic case data → versioned pack manifest and rubric → validation → source modules and assets → browser bundle and static site → unit/integration/visual checks → staging deployment → ten-seat acceptance → demo release decision. Keep private keys, held-out assessment answers, AI prompts and grading rubrics outside `dist/`; audit the package allowlist on every release.

### Proposed file and service layout

| Path or unit | Purpose | First needed |
|---|---|---|
| `js/engine/` and `js/entities/` | Chosen renderer, camera, pathfinding and avatar layers | Visual spike |
| `js/data/packs/` and `content/` | Versioned pack manifests, synthetic matters, sources and validation metadata | First connected matter |
| `js/ui/` | Firm selector, jurisdiction request, writing desk, evidence reader, journal | Firm slice |
| `server/worker.*` | Authentication, assignment and attempt routes, validated grading, reward ledger | Online pilot |
| `server/rooms.*` | One shared Sidebar room and WebSocket lifecycle | Multiplayer pilot |
| `migrations/` | D1 schema changes reviewed alongside code | Accounts and requests |
| `wrangler.jsonc` or equivalent | Static asset directory, bindings, environment settings and secrets references | Cloudflare staging |
| `tests/` | Scenario validation, state transitions, API contract, browser and room tests | Every phase |

These are proposed locations. Names and module format can change during implementation; the boundaries and migration/version rules should remain explicit.

### Data contracts and state transitions

Each content pack needs a manifest with `packId`, `jurisdictionId`, `forum`, `governingDate`, `contentVersion`, `sourceIds`, `reviewer`, `reviewDate`, `status`, `scenarioIds`, and `rubricVersion`. The `status` moves from draft → reviewed → pilot → available, or to suspended/retired. Only reviewed or piloted content chosen for the active environment appears in the firm selector. The build validator rejects duplicate IDs, missing source anchors, missing accepted alternatives and unreviewed scored tasks.

The online attempt path is `draft → committed → grading → validated → replied`. `POST /api/attempts` requires a server-issued task token, the active character-run ID and an idempotency key. The Worker checks the account, run status, selected firm pack, scenario version and word/document limits, then stores the immutable answer. A grader can produce proposed feedback, but only the server’s validated result changes gold or Ethics. The reply carries a unique attempt ID; the wallet ledger has a unique receipt per credited event. A transaction applies the score, reward and any terminal zero-Ethics event once. Repeat requests return the existing receipt. A character in `disbarred` status cannot submit, buy or enter new scored work until a new run is created.

For jurisdiction requests, use the normalized request and interest records in section 8. An administrator can update status but cannot make a pack playable merely by editing a queue status; content review and deployment determine availability. For bar chat, the Worker authenticates and checks the ten-seat allowlist before upgrading to the Sidebar room’s Durable Object. The room owns live positions/messages; D1 holds identities, access controls and moderation records. Keep chat events separate from wallet events.

### Phase-by-phase build and review gates

1. **Baseline and visual spike:** repair the test discovery issue; lock example save fixtures; prototype the existing canvas and a fixed-camera low-poly scene with original art. Measure both at desktop and mobile sizes and choose the renderer.
2. **Content model:** specify pack manifest and synthetic matter schema; build a validator; author one six-document matter; freeze source anchors and reviewer notes. Add a request catalog with normalized jurisdiction IDs.
3. **Offline firm slice:** implement avatar/wardrobe, pack selector, request entry point, document reader, draft/commit flow and authored partner reply. Use the current local build. Add tests for scene rendering, save migration, answer locking and reset.
4. **Server boundary:** add a Worker API with separate development/staging/production bindings; create D1 migrations for accounts, characters, attempts, receipts and requests. Import a legacy local save only through an explicit backup/import flow. Provide a guest/offline mode that does not claim shared rewards.
5. **Grading and gold:** put scoring behind a versioned interface with authored/manual results first; evaluate AI grading separately. Exercise retry, concurrency, disputed grades, disbarment and stale-client cases against the actual API.
6. **Sidebar:** add the room Durable Object, ten-seat allowlist, invitations and moderator controls. Simulate ten simultaneous participants plus moderation, reconnect storms, long idle periods and rejected eleventh accounts.
7. **Staging and pilot:** build the exact public allowlist; run unit, browser, mobile, accessibility, API and room checks; rehearse data restore and frontend rollback. Run two invited LegalQuants sessions and inspect costs/errors before deciding on demo scope.

**Illustrative route contract (proposal):** `GET /api/me`, `GET /api/packs`, `POST /api/attempts`, `GET /api/attempts/:id`, `GET /api/wallet`, `GET/POST /api/jurisdiction-requests`, `POST /api/jurisdiction-requests/:id/interest`, and `GET /api/sidebar/connect` for a WebSocket upgrade. Document request and response schemas, authentication, allowed methods, rate limits and error states before implementing the client. Do not cache private API responses as public assets.

### Cloudflare staging commands and release procedure

After the Worker project, bindings and credentials exist, the expected local workflow is `npm run build`, supported tests, `npx wrangler d1 migrations apply <database> --local`, then `npx wrangler dev`. The explicit `--local` keeps test migrations out of production. Use a pinned Wrangler version in the project when this stage is implemented; do not rely on an unpinned global CLI. Create separate staging and production resource IDs and secrets. A release candidate is built from a commit, checked for accidental private files, deployed to staging, exercised by the ten-seat pilot, then promoted with an approved release procedure. `npx wrangler deploy` is a deployment action and occurs only at that later approved gate. See Cloudflare’s [Wrangler configuration](https://developers.cloudflare.com/workers/wrangler/configuration/), [local development](https://developers.cloudflare.com/workers/local-development/), [D1 migrations](https://developers.cloudflare.com/d1/reference/migrations/) and [WebSocket guidance](https://developers.cloudflare.com/durable-objects/best-practices/websockets/) for the platform primitives; verify the exact syntax and account configuration when implemented.

**Completion receipt for each build:** source commit, content/pack versions, renderer choice, build output manifest/hash, test results, staging URL, migration IDs, deployment ID, feature flags, known issues, rollback point, legal reviewer and pilot approval. This makes the process inspectable when more people help build the game.

## 15. Roadmap with dependencies and release gates

These are rough elapsed-time ranges for one experienced engineer, a part-time legal/content lead and part-time design/QA support. They are planning estimates, not a delivery commitment. Reviewer availability, current code complexity and AI consistency are major uncertainties. Add a 25–35% contingency after the initial spike. Some work can overlap, but the gates cannot be skipped.

| Phase | Estimate | Deliverable | Exit gate |
|---|---|---|---|
| 0. Align and baseline | 1–2 weeks | Decision record, source/content inventory, test fix, two-scene rendering spike, save migration design | Choose renderer from measured prototype; confirm release pack catalog and pilot criteria |
| 1. Identity and foundations | 2–3 weeks | Sophisticated avatar and wardrobe, décor progression, firm-pack selector and request entry point, journal and versioned save/quest shell | Original visual direction approved at portrait/game scale; request and save flows pass; five users complete onboarding |
| 2. Firm vertical slice | 3–5 weeks | Six short-email tasks, two document packs, mentor feedback, reward loop, one capstone | Ten learners complete the slice; every scored objective/source/rubric reviewed |
| 3. Cloudflare and online trust | 2–4 weeks | Staging, accounts, server attempts/wallet, imports, calibrated online email feedback | Auth/authorization/retry tests, restore rehearsal, provider and spend approval |
| 4. Ten-seat LegalQuants pilot | 3–5 weeks | One Sidebar room, ten invited accounts, presence/chat, tip cards and moderation | Ten simultaneous participants plus moderator tested; seat cap, reconnect, reporting and cost controls pass |
| 5. Advocacy laboratory | 4–7 weeks | Two hearings, one closing, two deposition witnesses; AI introduced behind eval gates | Record fidelity, grading and failure recovery thresholds pass |
| 6. Pilot review and demo candidate | 4–6 weeks | LegalQuants feedback, private learning portfolios, exploratory transfer tasks and a defined demo scope | Review report supports expand, revise or stop; separate authorization for demo access and spending |
| 7. World expansion | Ongoing seasons | More matters, in-house/government pilots, cooperative events and global packs | Each career/jurisdiction has reviewer capacity, distinct work and measured demand |

Phases 0–2 are roughly 6–10 weeks before contingency. The sum through Phase 6 is approximately 19–32 weeks before contingency if sequenced. Do not interpret this as a promised date for a full-scale MMORPG. A scripted hearing/deposition design prototype may begin alongside Phase 3; paid generative simulations still wait for infrastructure and evaluation gates.

### Ten-seat pilot to demo release

After Phase 4, run at least two scheduled LegalQuants sessions: one guided onboarding/play session and one return session with less facilitation. Capture login/save failures, chat/reconnect behavior, confusing feedback, enjoyable moments, perceived pressure and which activity members want next. Keep a feedback route inside the game. Report denominators and attendance rather than treating all ten invitations as completed tests.

A recommended demo gate is at least eight of ten participants completing the core loop, no unresolved critical access/save/wallet defects, working moderation, and a reviewed cost estimate. Gather open feedback on whether humor feels engaging and pressure feels fair. Those are proposed gates, not an approved effectiveness claim. The demo can feature the firm loop and bar; AI depositions need not block a limited demo unless selected as a demo requirement. Choose the exact demo audience and included advocacy features after pilot results.

### First proposed implementation backlog

1. Inventory scenario/source completeness and establish the approved tests/build baseline; do not delete the archival folder without an intentional cleanup decision.
2. Define a versioned save and one reversible migration fixture; preserve existing appearance, gold and upgrades.
3. Prototype a more sophisticated attorney at portrait/gameplay scale, obtain visual-direction approval, then build the wardrobe catalog and earned décor sets.
4. Build firm-office pack selection, one-minute jurisdiction request flow and full-reset onboarding, with unavailable packs/careers labeled.
5. Author one complete synthetic matter, source set and scoring guide before expanding quantities.
6. Add draft persistence, source cards, immutable email submission, pending-review state and a subsequent partner reply with exactly-once consequences.
7. Add document anchors, finding notes and review feedback.
8. Add gold receipts, mastery evidence and a clear revision reward.
9. Connect one quest arc and a visible cosmetic unlock.
10. Playtest with five to ten users; revise friction, reward pacing and legal feedback before further content.

**Explicitly deferred:** a full 3D world rebuild before the rendering spike, open world city, voice chat, PvP litigation rankings, monetized currency, player coin trading, unrestricted file uploads, automatic law-firm HR evaluation, formal accreditation and full in-house/government campaigns. Each may be reconsidered after its dependency is demonstrated.

## 16. Proving training value and managing risk

The hypothesis is that enjoyable repeated practice, specific feedback and social explanation can develop lawyer skills. The prototype’s existence and the UK difficulty observation do not establish that outcome. Evaluate the claim directly.

Run the initial formative pilot with ten invited participants drawn primarily from LegalQuants. Record their professional experience and jurisdiction familiarity without requiring a junior/senior mix. Platform reliability, fun and repeat-play interest are the primary initial questions; learning measures are exploratory. Use a pre-task, training arc, new matched post-task and delayed transfer task. Have attorney reviewers score de-identified work without knowing whether it is pre or post. Record prior familiarity, assistance and revisions. A later controlled comparison with conventional exercises would support stronger claims; the small pilot chiefly identifies feasibility and failure modes.

| Dimension | Proposed gate or measurement |
|---|---|
| Usability | At least 80% finish the first full loop without facilitator rescue; understand the feedback and reward |
| Learning | Report change on unseen tasks and delayed transfer by skill and jurisdiction, including uncertainty; no claimed efficacy threshold from this small sample |
| Feedback quality | Calibrate on at least 100 adjudicated responses with two attorney reviewers resolving disagreement; target ≥90% agreement on pass/revise classification |
| Critical error handling | No critical unsafe recommendation incorrectly passed in a dedicated adversarial set; any such failure blocks scored rollout pending repair |
| Witness reliability | Replay at least 50 scripted/adversarial deposition sessions; zero known material fact contradictions in the release set, with abstention and fallback measured |
| Runtime | Target 30 fps on agreed baseline hardware; typical AI turn p95 under eight seconds or a usable progress/fallback experience |
| Economy | No duplicate awards in retry, reconnect and concurrent-submission tests; no client-edited online balance accepted |
| Community | Every report reaches a named reviewer; urgent incidents can stop a room immediately; measure actual response times |
| Accessibility | Keyboard-complete workspaces, readable documents, screen-reader task alternative, scalable text, contrast and reduced-motion checks |

These are proposed acceptance targets, not measured results. Passing a finite test set does not prove future AI reliability. Include short/long answers, valid minority approaches, misleading fluency, prompt injection, language variations and different experience levels in the evaluation set. Protect held-out items from authoring/tuning leakage.

Separate the learner’s private portfolio from the public character card. Instructors see only agreed cohort work; employers should not receive raw chat or private practice drafts by default. Any future employment use requires a separately reviewed purpose, consent/access policy and evidence of validity. Avoid labeling game achievements as licensure, accreditation, CLE credit or hiring fitness.

| Main risk | Design response | Release blocker |
|---|---|---|
| Plausible but wrong legal feedback | Reviewed sources, bounded rubric, abstention, appeals and revision history | Unresolved critical grading errors |
| AI witness invents facts | Knowledge map, validation, replay and transcript correction | Material unhandled contradictions |
| Grinding replaces learning | Reward new work and revision, separate mastery, offer free coaching | Players must idle or pay to access essential help |
| Foreign rules feel unfair | Explicit jurisdiction, source briefing, familiarity tracking | Hidden jurisdiction switches |
| Confidential details enter social space | Synthetic-only workflow, notice, reporting/deletion and restricted pilot | No moderator or incident route |
| Chat abuse overwhelms operations | Small rooms, staffed sessions, block/report and removal | No coverage or ban enforcement |
| Scope overwhelms delivery | Ship the first matter and bar before expanding careers | No completed vertical slice |
| Cloud costs escalate | Quotas, cost telemetry, bounded retries and disable switch | No approved budget or tested stop control |
| Progress is lost or falsely ranked | Save backups, migrations and separate legacy status | Failed recovery or wallet integrity checks |

## 17. Key decisions for your approval

The interview directions above are **recorded**. The worksheet below covers the remaining bundled implementation decisions; those remain **Pending** until explicitly resolved. A confirmed audience or tone does not approve every mechanism in the same row. Approving a product direction is separate from authorizing spending, deployment or public access. The HTML companion lets you mark a proposed response, add notes and export your review; it does not execute changes or transmit approval.

| ID | Decision | Recommendation | Alternative / tradeoff | Needed before |
|---|---|---|---|---|
| D01 | Initial audience and scope | Primarily LegalQuants confirmed; firm-first; practical training that is fun as AI changes legal work | Exact invitations and experience mix to be chosen; no junior/senior quota required | Phase 0 |
| D02 | Firm jurisdictions and requests | Confirmed: players choose firm packs; add a short in-game request for unavailable jurisdictions with visible status | Exact release catalog, request prioritization and reviewer staffing remain open | Content authoring |
| D03 | Consequences | Confirmed: scary full reset on disbarment is the default; preserve humor and pressure | Tune damage thresholds; validate uncertain AI results before applying terminal consequences | Phase 1 |
| D04 | Classic RPG visual direction | Confirmed: sophisticated avatars; aim for classic RuneScape feel through original art and interactions; keep earned décor | Choose upgraded 2D canvas or fixed-camera low-poly renderer after a side-by-side spike | Phase 0/1 |
| D05 | First playable scope | All five practice areas retained; first slice integrates ethics, emails, documents and checking AI work; advocacy follows | Six writing tasks, two six-document packs and one capstone remain proposed quantities | Phase 2 |
| D06 | Prose assessment | Confirmed: commit the answer, then receive a partner reply; no pre-submission grading | Provider, rubric, reply timing and proposed pending-submission limit remain open | Phase 2, provider gate in Phase 3 |
| D07 | Gold and progression | Nontransferable gold, separate mastery, no pay-to-win, revision rewards | Trading or cash monetization adds fraud/balance demands | Phase 2 |
| D08 | Multiplayer release | Ten-seat LegalQuants pilot before demo; propose one shared text-chat bar and moderation | Account cap interpretation, moderator arrangements and demo audience still need confirmation | Phase 4 |
| D09 | Infrastructure and budget | Cloudflare pilot direction recorded; size for ten seats; recalculate the provisional $100/month ceiling | Architecture, actual spending and deployment remain unapproved | Phase 3; separate spend/deploy authorization |
| D10 | Advocacy sequence | Scripted text hearings/depositions, then bounded AI and closing practice | Voice-first is immersive but increases cost and assessment uncertainty | Phase 5 |
| D11 | Training data visibility | Private learner record; limited consented cohort access; chat 30 days/reports 90 days proposed | Longer institutional retention needs a clear purpose and approved policy | Accounts/cohorts |
| D12 | Expansion gate | Add career tracks and jurisdictions after pilot evidence and reviewer capacity | Build all three careers immediately at materially greater scope | Phase 7 |

**Next interview topics:** gold/progression rules, pilot account access and privacy, then the hosting budget. The renderer and exact release jurisdiction catalog can be decided from concrete prototypes and reviewer availability. Firm-pack selection, full reset, a more sophisticated attorney appearance, earned décor and commitment before partner feedback are settled directions. Art execution, assessment provider and reply timing still require concrete implementation proposals.

**Suggested approval response:** “Approve D01–D05 and D07 for Phases 0–2; revise [IDs] as follows; defer infrastructure spending and public deployment.” This is an example only, not a recorded approval. A decision marked “Revise” or “Defer” leaves dependent work outside the approved scope until resolved.

## 18. Evidence and reading guide

### Local project evidence

- [README](../README.md): stated player experience and current distribution.
- [Existing roadmap](../ROADMAP.md): global jurisdictions, court simulation and earlier answer-key proposal.
- [Original game plan](../lawscape_game_plan.md): broader minigame and progression ideas; historical proposal rather than shipped-state evidence.
- [State and persistence](../js/state.js): appearance fields, localStorage, economy and reset behavior.
- [Actor renderer](../js/entities/actor.js): current layered avatar rendering.
- [Gameplay](../js/main.js) and [interface](../index.html): creator, BarMail, passive review and progression interactions.
- [Work economy](../js/data/work.js), [world](../js/world/zones.js), [game-data tests](../tests/game-data.test.mjs) and [world tests](../tests/world-content.test.mjs): baseline behavior and content assertions.
- [Site packaging](../scripts/package-site.mjs): public asset allowlist and GitHub-specific preview URLs.

### External technical sources

Official Cloudflare documentation consulted September 20–22, 2026: [Workers Static Assets](https://developers.cloudflare.com/workers/static-assets/), [Durable Objects WebSockets](https://developers.cloudflare.com/durable-objects/best-practices/websockets/), [D1](https://developers.cloudflare.com/d1/), [R2](https://developers.cloudflare.com/r2/), [Workers pricing](https://developers.cloudflare.com/workers/platform/pricing/), [Workers AI pricing](https://developers.cloudflare.com/workers-ai/platform/pricing/), [Wrangler configuration](https://developers.cloudflare.com/workers/wrangler/configuration/), and [D1 migrations](https://developers.cloudflare.com/d1/reference/migrations/). Capabilities and pricing should be reconfirmed during implementation. Classic RuneScape’s [official overview](https://www.runescape.com/oldschool/join) helps identify interaction and community cues. Jagex’s [fan content policy](https://legal.jagex.com/docs/policies/fan-content-policy) identifies its protected game content and trademark boundaries; Lawscape’s art, music, UI and code should be independently made.

This is a product and implementation plan, not a jurisdictional legal opinion. Existing legal content was inventoried, not comprehensively cite-checked. All proposed scored exercises require current primary-source review and an approved rubric. Product recommendations, content quantities, costs and timelines are planning judgments. No learning effectiveness, production scale, AI reliability or Cloudflare deployment is claimed as established.
