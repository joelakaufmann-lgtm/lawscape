# LawScape

![LawScape — answer the rule, protect your license](assets/og-lawscape.png)

**Answer the rule. Build your practice. Protect your license.**

LawScape is a free, old-school browser RPG about legal ethics. Create an
attorney, explore an isometric law firm, apartment, and courtroom, answer
professional-responsibility dilemmas in BarMail, review documents, earn gold,
and improve your practice without losing your license.

The game is plain HTML, CSS, and JavaScript. It has no account, backend,
tracking, external assets, or runtime dependencies.

## Play now

Play LawScape  (https://joelakaufmann-lgtm.github.io/lawscape/)

Double-click [`index.html`](index.html). It launches directly in a modern
browser—no installation or local server is required.

Controls:

- **Mouse or touch:** click/tap a floor tile to walk; select people and objects
  to interact.
- **Keyboard:** use WASD or arrow keys to move.
- **Shortcuts:** B opens BarMail, R opens your record, T opens travel, H opens
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
- Six explorable zones: the main office, Jim Hardsell’s corner office, Linda
  Firestone’s office, a conference room, an apartment, and a furnished but
  intentionally empty courtroom.
- One-minute document-review cycles at the filing cabinet that earn five gold.
- A searchable ethics-treatise reader built from the project’s local Nevada,
  Arizona, and California material. The California shelf also links the bundled
  opinions, discipline, admissions, trust-account, and CLE references.
- Office characters Liz Loza, Riley Readsalot, Jim Hardsell, and Linda
  Firestone, each with a distinct role or interaction.
- Gold, Ethics health, answer streaks, rest, upgrades, and persistent saves.
- Wrong-answer damage rises from 20 to 30 and then 40 during a consecutive
  mistake streak; hiring Riley Readsalot for 2,000 gold halves that damage.
- Purchasable coffee restores two Ethics points per drink, and Linda sells
  five-gold ethics tips after steering new players toward hiring Riley.
- Optional relevant-rule hints cost 100 gold and require both Riley Readsalot
  and the Ethics Treatise Shelf; buying the shelf alone never reveals a rule.
- Office upgrades add Liz’s chair, houseplants, a tiny porthole window, and
  modern art; Liz’s mood and dialogue improve as working conditions do.
- The City View Apartment upgrade adds a wall-mounted skyline window and a
  couch positioned in front of an interactive television. The kitchen adds a
  stove, fridge, and ten max Ethics; the Clock adds ten extra Ethics to rest.
- Jim’s bar cart teaches an impairment lesson: a drink costs two Ethics and
  slows movement for 40 seconds. A second attempt directs Nevada attorneys to
  the State Bar’s confidential
  [Lawyers Concerned for Lawyers](https://nvbar.org/for-lawyers/resources/wellbeing/lcl/)
  hotline at 866-828-0022.
- A professional record, NPC conversations, travel, minimap, and responsive
  desktop/mobile controls.
- Disbarment at zero Ethics, which resets the saved game.

The courtroom is open for exploration but intentionally has no people or
hearings yet. Interactive court simulation remains a future feature described
in [ROADMAP.md](ROADMAP.md).

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

The repository includes automated validation and GitHub Pages workflows.

1. Create a GitHub repository and push the `main` branch.
2. In the repository, open **Settings → Pages**.
3. Set **Source** to **GitHub Actions**.
4. Run **Deploy LawScape to GitHub Pages** from the Actions tab, or push a
   commit to `main`.

The workflow builds a small `dist/` package containing only the playable site.

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
