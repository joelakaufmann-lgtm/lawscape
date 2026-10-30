# LawScape

**[Play LawScape in your browser](https://joelakaufmann-lgtm.github.io/lawscape/)** · [How to play](docs/PLAYING.md) · [Jurisdictions](docs/JURISDICTIONS.md)

Build a legal career at Hardsell & Firestone, where the partners need answers,
the printer needs attention, and HR has been temporarily unstaffed since 1987.
Create an attorney, answer workplace dilemmas, inspect case files, earn gold
and improve your office while protecting your Ethics.

![An attorney exploring the LawScape office](media/demo-30s/captures/office-full.png)

Free to play. No account, installation or API key required for the solo game.
The current release is **0.9.0**: six rule shelves (Nevada, Arizona, California,
New York, the FLSC Model Code and the SRA Standards), a study-list export, a
walkable street, a bigger wardrobe, adoptable pets, and California, New York
and Canada practice. Prefer a quick look first?
[Watch the 30-second demo](media/lawscape-demo-30s.mp4).

## Three ways to play

| | Solo on GitHub Pages | Online firm on Cloudflare | Your own copy |
| --- | --- | --- | --- |
| **Who** | Anyone, right now | Invited players (email allow list) | You, your clinic, your firm |
| **Where** | [joelakaufmann-lgtm.github.io/lawscape](https://joelakaufmann-lgtm.github.io/lawscape/) | [lawscape.joelakaufmann.workers.dev](https://lawscape.joelakaufmann.workers.dev/) | Wherever you deploy it |
| **Sign-in** | None | Emailed one-time code (Cloudflare Access) | Your choice |
| **Progress** | Saved in your browser | Saved on the server, per account | Depends on how you run it |
| **Other players** | No | Yes: shared rooms, open desks, a roster | Yes, if you run the Worker |

### 1. Play solo, no account

Open the [GitHub Pages copy](https://joelakaufmann-lgtm.github.io/lawscape/)
or download the repository and open `game.html` from disk. Everything runs in
the browser and progress stays in that browser's storage. Clearing site data
loses the save. This is the full game: every question pack, the apprenticeship,
the street, the shelves and the arcade.

### 2. Play online with the firm (invite only)

An invite-only **online firm** runs on Cloudflare at
[lawscape.joelakaufmann.workers.dev](https://lawscape.joelakaufmann.workers.dev/).
Invited players sign in with a one-time code emailed by Cloudflare Access, keep
their attorney on the server, and see each other walk the firm, the street and
The Sidebar, claim open desks, and work on the shared Associates' Floor. Every
rule (gold, Ethics, purchases, arcade credits) runs on the server, so the
browser only sends what you did, never what it is worth.

To join, ask the maintainer to add your email to the allow list, then open the
link above and choose **Play online · invite only**. Your solo save is untouched.
Shared chat, per-player apartments with invites, and live courtroom hearings are
still future work. See [Playing online](docs/PLAYING.md#playing-online).

### 3. Run your own version

LawScape is MIT-licensed and has no runtime dependencies: plain ES modules,
one build script, Node 22 for tests. Fork it to change the firm, add a
jurisdiction pack, or host a private online firm for your own group.

```sh
git clone https://github.com/joelakaufmann-lgtm/lawscape.git
cd lawscape
npm run build && npm test     # no npm install needed for the solo game
npm start                     # http://127.0.0.1:8000
```

- **Static hosting:** publish the `dist/` folder (GitHub Pages, any static host)
  or open `game.html` from disk. See [docs/BUILD.md](docs/BUILD.md) and
  [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).
- **Your own online firm:** one Cloudflare Worker serves the site plus `/api`
  and `/ws`, with SQLite Durable Objects for accounts and the shared room, and
  Cloudflare Access for the email allow list. It fits the Workers Free plan for
  a small group. The step-by-step runbook is [docs/ONLINE.md](docs/ONLINE.md):
  `npm install` (Wrangler and `jose` only), create the Access application, set
  the team domain and audience in `wrangler.jsonc`, then `npm run online:deploy`.
- **Your own questions:** packs are Markdown and JSON under `content/` compiled
  by the `scripts/build-*.mjs` scripts, with source notes and review status.
  [CONTRIBUTING.md](CONTRIBUTING.md) explains the authoring and review standard.

## Your first five minutes

1. Choose **Create an Attorney** (or **Surprise me**), customize your character
   and enter the firm.
2. Open **Journal** for a guided first assignment, or **BarMail** at your office
   computer for a quick ethics question.
3. Open a subject line, read the facts, choose your response and read the
   explanation. In writing assignments, review the supplied file before replying.
4. Use **Journal → Firm jurisdictions** to choose a question pack. New attorneys
   start on the original dilemmas; each pack opens directly in BarMail and
   **Mixed practice** draws from all six.
5. Walk out onto Juris Avenue to reach the courthouse, The Sidebar and your
   apartment (or use **Travel** as a shortcut), talk to the partners, and use
   **Journal → Wardrobe** to change your look. Gold buys accessories, jewelry,
   formal wear, upgrades and a pet.

Click or tap to walk and interact. WASD and arrow keys also move your attorney.
The Work Phone upgrade lets you use BarMail outside the office. Wrong answers
collect on your study list, which you can export from **Record**.

## Jurisdictions and practice

| Question pack | Questions | What you practice |
| --- | ---: | --- |
| California | 20 | California professional responsibility |
| New York | 33 | 28 workplace emails and five short dilemmas |
| US MPRE-style | 69 | Model-rule and exam-style study |
| England & Wales SQE-style | 28 | Ethics in England and Wales |
| Canada | 25 | Ontario, BC and Saskatchewan practice; practitioner review pending |
| LawScape original dilemmas | 21 | Fictional office dilemmas with mixed Arizona/Nevada rule labels |

**196 questions total.** The inbox shows your current difficulty tier, so you
will not see every question at once. Every question carries an authored
rationale for the preferred answer. The **Ethics Treatise Shelf** upgrade opens a
searchable library of the Nevada, Arizona, California and New York rules, the
FLSC Model Code (Canada) and the SRA Standards (England & Wales), bundled
verbatim with source and retrieval notes.

The fictional **State of Juris apprenticeship** adds six writing assignments,
two synthetic document files and one connected capstone. These activities are
separate from the question count. The Canada pack also carries **five ungraded
email assignments**; practitioner review of the Canadian answer key is pending.
Full continuing-matter curricula remain planned.
[Open the Canada review package](canada-test/review.html) or
[see coverage, sources and review status](docs/JURISDICTIONS.md).

## Before you start

Wrong ethics answers damage Ethics; reaching zero ends the character run and
resets its gold, upgrades and drafts. Correct streaks, rest, coffee, the office
espresso machine and the snack fridge restore Ethics. Arriving at the firm or
the courthouse impaired costs Ethics too.

The fictional apprenticeship awards study gold without Ethics damage. Its
checklist choices receive authored feedback keyed to your score; your written
prose is saved for self-comparison, not graded by live AI. Sidebar notes are
local to your account or browser.

LawScape is unofficial educational practice, not legal advice or official bar
exam content. Read the jurisdiction and source note on each question. Solo
saves are editable study material, not a trustworthy score; the online firm's
numbers are server-owned.

## Find more

- [Player guide](docs/PLAYING.md) — controls, activities, saves and consequences.
- [Online runbook](docs/ONLINE.md) — Cloudflare setup, deploy gate, quotas, inviting players.
- [Report a bug](https://github.com/joelakaufmann-lgtm/lawscape/issues) — or use **Email HR · Report a bug** in BarMail.
- [Contribute](CONTRIBUTING.md), [roadmap](ROADMAP.md) and [release changes](CHANGELOG.md).
- [Documentation index](docs/README.md) — sources and maintainer instructions.

Code is distributed under the [MIT License](LICENSE).
