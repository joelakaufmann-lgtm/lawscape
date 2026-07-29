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

- 29 legal-ethics scenarios involving trust accounting, conflicts, candor,
  confidentiality, the no-contact rule, solicitation, fee splitting,
  spoliation, and reporting misconduct.
- Three progressive difficulty tiers, including eight original MPRE-style
  workplace-email scenarios with source notes and official NCBE preparation
  links.
- Character creation with appearance options.
- Six explorable zones: the main office, Jim Hardsell’s corner office, Linda
  Firestone’s office, a conference room, an apartment, and a furnished but
  intentionally empty courtroom.
- One-minute document-review cycles at the filing cabinet that earn five gold.
- A searchable ethics-treatise reader built from the project’s local Nevada and
  Arizona rule material, with links to the current official sources.
- Office characters Liz Loza, Riley Readsalot, Jim Hardsell, and Linda
  Firestone, each with a distinct role or interaction.
- Gold, Ethics health, answer streaks, rest, upgrades, and persistent saves.
- Purchasable coffee that restores two Ethics points per drink and five-gold
  ethics tips from Linda.
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

When the local rule-authoring Markdown changes, regenerate the public,
browser-readable snapshot before building:

```sh
npm run rules:build
npm run build
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

Local authoring corpora and packaged ethics-agent archives are intentionally
excluded from the public repository. The generated, player-readable rule
snapshot is committed as `js/data/rules.js`; gameplay scenarios live in
`js/data/ethics.js` and `js/data/mpre.js`.

The MPRE-style scenarios are original LawScape adaptations for educational
practice. They are not official NCBE questions and do not reproduce secure
exam content. See [MPRE_Associate_Email_Scenarios.md](MPRE_Associate_Email_Scenarios.md)
for the local scenario notes and the official NCBE preparation link.

## Educational disclaimer

LawScape is fictional educational software. It is not legal advice and does not
create an attorney-client relationship. Rule citations and explanations are
simplified for gameplay. Always consult the operative law and rules in the
relevant jurisdiction.

## License

MIT — see [LICENSE](LICENSE).
