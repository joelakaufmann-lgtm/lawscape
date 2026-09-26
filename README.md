# LawScape

**A new way to learn legal ethics. Build your practice. Explore the world.**

LawScape turns professional responsibility into a playable law firm: create an
attorney, open a synthetic email, inspect the file, make a judgment, and live
with the consequences. The long-term goal is **ethics questions from every
jurisdiction where there is a LegalQuant**.

**Available today:** US MPRE-style practice, England & Wales SQE-style practice,
and an original fictional firm apprenticeship. The [global curriculum list](docs/JURISDICTIONS.md)
contains 27 geographic starting points; those are future targets, not 27 live packs.

[Watch the new captioned demo](media/release-0.5/lawscape-global-demo.mp4) ·
[Browse the screenshots and demo gallery](media/release-0.5/index.html) ·
[Build and test evidence](docs/BUILD.md) · [Deployment guide](docs/DEPLOYMENT.md)

![The LawScape office, with detailed workstations and a customizable attorney](media/release-0.5/screenshots/03-office.png)

This branch is a release candidate. The new build has not been deployed to the
public Pages site; publication requires the owner's final approval.

## Global curriculum preview · 0.5.0

This build implements the local firm-apprenticeship slice of Astra Plan v1.4.
Open **Journal** (J) to start a first day at Hardsell & Firestone:

- Six short writing assignments, two original six-document synthetic matters,
  deliberately flawed AI summaries, and one connected capstone.
- Drafts save automatically. Committing locks a copy of the answer; a partner
  replies after about five seconds, including across a reload. The reply awards
  study gold once. One invited revision preserves the original correspondence.
- Authored feedback assesses explicit issue, action and evidence selections.
  Free text and document-review notes are saved for self-comparison; they are
  **not AI graded**. The new exercises use fictional State of Juris office
  policies, award local study gold, and do not apply Ethics damage.
- The filing cabinet opens an evidence workspace with passage references,
  persistent notes, supported-finding checks and one reward receipt per file.
- Original adult-proportioned canvas attorneys with shaped faces, eyelids,
  irises and pupils; 16 hairstyles, 18 hair colors, seven facial-hair choices,
  12 tie colors, six shirt colors, five suit colors, three face shapes, glasses,
  and three builds. The shared creator/wardrobe offers angle and pose previews.
  Trousers remain the default for every gender; a skirt suit is optional.
- The Sidebar lounge has a bar, usable stools, a robot butler bartender, and tables for
  evidence, writing, and AI/agents. Room & Chat stores a separate local draft
  for each table; Send stays disabled until a future multiplayer service exists.
- B.A.R.T. serves after-hours drinks for 3–5 gold. They cause no Ethics damage
  and slow walking by half for 40 seconds; free sparkling water has no effect.
- BarMail now has a subject-line inbox containing ethics questions and writing
  correspondence in one computer interface. The 2,000-gold Work Phone replaces
  the old Office Upgrade and unlocks that inbox everywhere. Existing owners
  automatically receive it. Written drafts, sent attempts and partner replies
  stay in the same mail window.
- The Sidebar's local high-score board retains the top ten disbarred runs by
  billable time. Time counts while a question, writing assignment or feedback is
  visibly open, and pauses in the inbox list. The historical board survives
  character wipes without transferring possessions or progress.
- Derek Balam is the courtroom bailiff, with a badge and interactive dialogue.
  A sleeping robot judge sits behind the detailed bench; court is not in session.
  Live judge agents and hearings remain planned. A first 40-gold reply can buy the 30-gold reward tie;
  ordinary appearance choices are free.
- The firm desk labels real-jurisdiction packs as awaiting review or unavailable.
  Requests save locally, de-duplicate explicit aliases, and offer a GitHub issue
  draft for the player to review and submit. No request sends automatically.

Existing saves migrate additively on the same browser origin. The original
ethics game retains full-reset disbarment; a terminal event now clears the run
immediately, including its drafts, quest progress and cosmetics. Other tabs stop
play when the shared save changes. This remains a transparent, editable offline
save, **not a server-authoritative score or wallet**.

Cloudflare, accounts, multiplayer, real-jurisdiction source approval, live AI
grading and the final renderer comparison are later milestones. The canvas
avatar work is a prototype, not a decision to abandon the planned WebGL comparison.

LawScape is a free, old-school browser RPG about legal ethics. Create an
attorney, explore an isometric law firm, apartment, courtroom, and lounge, answer
professional-responsibility dilemmas in BarMail, review documents, earn gold,
and improve your practice without losing your license.

The game is plain HTML, CSS, and JavaScript. It has no account, backend,
tracking, external assets, or runtime dependencies.

The thesis is simple: **legal learning should be fun** — and it should be fun
to learn how lawyers in other countries answer the same ethical questions.
The beta ships Arizona- and Nevada-cited scenarios, a California reference
shelf, and a 28-question UK SQE-style pack — the first passport stamp. A full
jurisdiction selector (California, Nevada, Arizona) and a **Global Law Firm**
mode with questions from around the world are on the [roadmap](ROADMAP.md).

## Play now

[Existing public demo](https://joelakaufmann-lgtm.github.io/lawscape/) — may be an older version until this release is approved and deployed.

Double-click [`index.html`](index.html). It launches directly in a modern
browser—no installation or local server is required.

Controls:

- **Mouse or touch:** click/tap a floor tile to walk; select people and objects
  to interact.
- **Keyboard:** use WASD or arrow keys to move.
- **Shortcuts:** J opens the apprenticeship journal, B opens ethics BarMail,
  R opens your record, T opens travel, H opens
  help, and Escape closes the current window.

Your progress is stored only in that browser.

## What is playable

- 118 legal-ethics scenarios involving trust accounting, conflicts, candor,
  confidentiality, the no-contact rule, solicitation, fee splitting,
  spoliation, and reporting misconduct.
- Three progressive difficulty tiers, including 69 original MPRE-style and
  28 original UK SQE-style workplace-email scenarios.
- A BarMail practice-pack selector for a mixed inbox, UK SQE Ethics, US MPRE,
  or the fictional State of Juris core questions.
- Character creation with appearance options.
- Seven explorable zones: the main office, Jim Hardsell’s corner office, Linda
  Firestone’s office, a conference room, an apartment, the courtroom with
  Derek Balam, and The Sidebar lounge.
- Source-anchored synthetic document review at the filing cabinet, with up to
  75 study gold per file. Old timer-cycle counts remain in migrated records.
- A searchable ethics-treatise reader built from the project’s local Nevada,
  Arizona, and California material. The California shelf also links the bundled
  opinions, discipline, admissions, trust-account, and CLE references.
- Office characters Liz Loza, Riley Readsalot, Jim Hardsell, and Linda
  Firestone, each with a distinct role or interaction.
- Gold, Ethics health, answer streaks, rest, upgrades, and persistent saves.
- Wrong-answer damage rises from 30 to 45 and then 60 during a consecutive
  mistake streak; hiring Riley Readsalot for 2,000 gold halves that damage.
- Purchasable coffee restores two Ethics points per drink, and Linda sells
  five-gold ethics tips after steering new players toward hiring Riley.
- Optional relevant-rule hints cost 100 gold and require both Riley Readsalot
  and the Ethics Treatise Shelf; buying the shelf alone never reveals a rule.
- Office upgrades add Liz’s chair, houseplants, a work phone, and
  modern art; Liz’s mood and dialogue improve as working conditions do.
- The City View Apartment upgrade adds a wall-mounted skyline window and a
  couch where the player can enjoy the view. Before buying the kitchen, ramen
  costs five gold and restores five Ethics; afterward, a cooked meal costs five
  gold and restores 30. The Clock adds ten extra Ethics to rest.
- Jim’s bar cart teaches an impairment lesson: a drink costs two Ethics and
  slows movement for 40 seconds. A second attempt directs Nevada attorneys to
  the State Bar’s confidential
  [Lawyers Concerned for Lawyers](https://nvbar.org/for-lawyers/resources/wellbeing/lcl/)
  hotline at 866-828-0022.
- A professional record, NPC conversations, travel, minimap, and responsive
  desktop/mobile controls.
- Disbarment at zero Ethics, which immediately resets the complete character run.
- An in-character **✍ Email HR** desk in BarMail for bug reports and
  complaints about the working conditions of the virtual firm. HR never
  answers; your message becomes a prefilled GitHub issue you can review and
  file with the developers (nothing is sent automatically).

Furniture now includes layered wood surfaces, legs, drawers, upholstered chairs,
detailed monitors/keyboards/mice, bound treatises, and a raised judicial bench.

The courtroom is open for exploration and a conversation with Derek Balam.
The sleeping AI judge is an authored placeholder with no live model connection.
Hearings, live grading, and Cloudflare multiplayer have distinct planned
milestones and acceptance checks in [ROADMAP.md](ROADMAP.md).

LawScape is a **beta**, and the answer key intentionally ships in the open:
the scenario data under `js/data/` is human-readable, and the game explains
the governing rule after every answer. A future assessed mode will use server-controlled attempts and rewards;
client-side obfuscation cannot make an authoritative score. See [ROADMAP.md](ROADMAP.md).

## Run the developer preview

Node.js 22 or later is needed only for development:

```sh
npm start
```

Open `http://127.0.0.1:8000`.

After editing a source module under `js/`, refresh the direct-launch browser
bundle and run the checks:

```sh
npm run build
npm test
```

`js/lawscape.bundle.js` is generated and committed so players can open the game
from disk. Edit the source modules rather than the bundle.

Normal builds regenerate the public rule snapshot and additional-question
module automatically. To refresh either source independently:

```sh
npm run rules:build
npm run mpre:build
npm run sqe:build
```

## Publish on GitHub Pages

The site is built into an explicit `dist/` allowlist. Validation runs on review
branches and pull requests; pushing this branch does not publish it.

After final owner approval, merge the reviewed release into `main`, then
manually run **Deploy LawScape to GitHub Pages** with the approval input checked.
The workflow accepts `main` only and builds, tests and validates the package
before deployment. See [DEPLOYMENT.md](docs/DEPLOYMENT.md) for exact steps,
verification and rollback. No hosting credentials belong in the browser.

```sh
npm run build
npm test
npm run release:check
```

## Project structure

```text
index.html                 Browser entry point
css/style.css              Responsive game interface
js/main.js                 Game flow and interactions
js/data/                   Scenarios, rule library, upgrades, and economy data
js/engine/                 Isometric rendering and pathfinding
js/entities/               Player and NPC actors
js/ui/                     HUD and dialogue
js/world/                  Zones and interactive props
scripts/                   Zero-dependency build, checks, and preview server
tests/                     Node test suite
```

See [CONTRIBUTING.md](CONTRIBUTING.md) for contribution guidelines and
[SECURITY.md](SECURITY.md) for the project’s security model.

Packaged ethics-agent archives are intentionally excluded from the public
repository. The generated player-readable rule snapshot and supplied
`California References/` bundle are committed for the treatise shelf; gameplay
scenarios live in `js/data/ethics.js`, `js/data/mpre.js`, and generated
`js/data/mpre-additional.js` and `js/data/sqe.js`.

The MPRE-style scenarios are original LawScape adaptations for educational
practice. They are not official NCBE questions and do not reproduce secure
exam content. See [MPRE_Associate_Email_Scenarios.md](MPRE_Associate_Email_Scenarios.md),
[the additional 20-question set](MPRE_Associate_Email_Scenarios_Additional_20.md),
and [the additional 41-question set](MPRE_Associate_Email_Scenarios_Additional_41.md)
for local scenario notes and official reference links.

The [UK SQE Ethics Email Pack](SQE_Ethics_Email_Scenarios_UK.md) contains
28 original England-and-Wales scenarios with an explanatory answer key. It
uses public topic and format cues from the supplied Quizlet export, the
[SQE1 Prep ethics revision guide](https://sqe1prep.co.uk/blog/sqe1-ethics-professional-conduct-revision-guide),
and the [SRA/Kaplan SQE1 sample-question page](https://sqe.sra.org.uk/assessments/sqe1-assessments/sqe1-sample-questions).
It is not an official SQE question set.

## Educational disclaimer

LawScape is fictional educational software. It is not legal advice and does not
create an attorney-client relationship. Rule citations and explanations are
simplified for gameplay. Always consult the operative law and rules in the
relevant jurisdiction.

## License

MIT — see [LICENSE](LICENSE).
