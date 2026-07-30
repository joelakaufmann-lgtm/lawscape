# Contributing to LawScape

Thanks for helping improve LawScape.

## The thesis (why this project exists)

LawScape is built on one conviction with two halves:

1. **Legal learning should be fun.** Nobody ever fell in love with
   professional responsibility through an outline. Plenty of people will
   answer "one more BarMail" at a fictional law firm long past midnight.
2. **It should be fun to learn about ethics in other countries.** The same
   dilemmas — unearned fees, adverse authority, talkative opposing parties —
   land in inboxes everywhere, and different jurisdictions answer them
   differently. Playing those differences is the point.

That second half is where contributors matter most: the long-term goal of
this project is to **build out ethical rules from around the world** as
playable scenario packs.

## Where the game is heading

A planned release adds a jurisdiction choice at character creation:

- **Pick a jurisdiction** — play under a single scenario pack (**California,
  Nevada, or Arizona** at launch), with the inbox, rule citations, and
  treatise shelf following that jurisdiction's operative rules.
- **Work at the Global Law Firm** — a firm with offices everywhere and an
  inbox to match: BarMail questions arrive from around the world, each email
  labeled with its jurisdiction and graded under that jurisdiction's rules.

The first non-US pack already ships in beta: a 28-question **England & Wales
(UK SQE-style)** set with an explanatory answer key (see
[SQE_Ethics_Email_Scenarios_UK.md](SQE_Ethics_Email_Scenarios_UK.md) and
`js/data/sqe.js`), selectable from BarMail's practice-pack menu. Treat it as
the working model for what a jurisdiction pack looks like.

See [ROADMAP.md](ROADMAP.md) for the full picture, including the beta's
open-answer-key policy.

## Jurisdiction packs — the contribution we want most

LawScape grew out of the LegalQuants (LQ) community of lawyers who build
software. Per the LQ member directory (published member profiles, reviewed
July 2026), members are based or qualified in roughly 27 countries and
regions across five continents:

| Region | Jurisdictions with LQ members |
| --- | --- |
| Americas | United States (incl. California, New York, Washington, Washington D.C., Massachusetts, North Carolina, Ohio, Utah), Canada, Uruguay, Argentina |
| UK & Europe | England & Wales, Ireland, France, Belgium, Netherlands, Germany, Switzerland, Austria, Italy, Greece, Finland, Russia |
| Middle East | Türkiye, United Arab Emirates, Israel |
| Asia-Pacific | Hong Kong, mainland China, Singapore, India, Thailand, Malaysia, Australia, New Zealand |

Several members are dual- or triple-qualified (England & Wales + Hong Kong +
mainland China; Singapore + New York; California + Türkiye; England & Wales +
Canada) — exactly the comparative spirit the Global Law Firm mode is built
around. No African jurisdiction appears in the directory yet; be the first.

That map is the natural expansion path for the Global Law Firm. If you
practice in one of those jurisdictions — or one not listed — a scenario pack
for it is the single highest-value contribution you can make.

### What a jurisdiction pack needs

1. **Real rules only — no invented authority.** Cite the operative
   professional-conduct rules actually adopted in that jurisdiction (by its
   regulator, bar, or highest court), with a link to the official source. If
   the official text is not in English, include a faithful working
   translation clearly labeled as unofficial.
2. **Scenarios in the BarMail format** (see `js/data/ethics.js`): a realistic
   email, exactly one defensible correct reply, plausible wrong replies, and
   a rule-grounded explanation for every wrong reply.
3. **A snapshot date and official link** for the rule text, mirroring the
   generated rule-library modules.
4. **Neutral, educational wording** that never presents the game as legal
   advice. Ethics rules genuinely diverge between jurisdictions, so every
   explanation should say which jurisdiction's rule it applies.

Open a GitHub issue first — the in-game **Email HR** desk will happily format
one for you — describing the jurisdiction and your source material, so we can
agree on structure before you draft thirty scenarios.

## Local workflow

1. Run `npm start` and open `http://127.0.0.1:8000`.
2. Edit the source modules under `js/`, plus `index.html` or `css/style.css`.
3. Run `npm run build` to refresh the browser bundle and deployment package.
4. Run `npm test` before opening a pull request.

`js/lawscape.bundle.js` is generated. Please edit the source modules rather
than the bundle.

If you change a local ethics-rule authoring file, run `npm run rules:build`.
If you edit either additional-question Markdown source, run `npm run mpre:build`.
A normal `npm run build` refreshes both generated modules.
Review generated files for snapshot dates, source labels, and official links.

## Scenario contributions

Ethics scenarios belong in `js/data/ethics.js`. Each scenario needs:

- a unique identifier;
- a clear jurisdiction/rule reference;
- exactly one defensible correct answer;
- an explanation for every incorrect answer; and
- neutral, educational wording that does not present the game as legal advice.

Please cite primary legal authority in the pull-request description when adding
or materially changing a scenario.

MPRE-style contributions must be original adaptations, clearly identified as
unofficial practice material, and linked to NCBE’s public preparation page.
Do not copy secure, recalled, or live examination questions. Hand-authored
adaptations live in `js/data/mpre.js`; the additional source sets generate
`js/data/mpre-additional.js`.

## Bugs, feedback, and complaints to HR

- **In game:** open **BarMail → ✍ Email HR**, pick Bug Report,
  Working-Conditions Complaint, or Suggestion to Management, and let HR's
  auto-reply route you to a prefilled GitHub issue. HR has been "temporarily
  unstaffed" since 1987; nothing is transmitted until you review and file the
  issue yourself.
- **Directly:** <https://github.com/joelakaufmann-lgtm/lawscape/issues>

## Pull requests

Keep changes focused, describe the player-facing effect, and include the output
of `npm test`. Screenshots are useful for visible interface changes.
