# LawScape documentation and jurisdiction cleanup proposal

Prepared September 27, 2026. **For owner approval; no implementation or publication yet.**

The clarified goal is to keep all existing in-game questions, make the public
project easier to understand, organize question packs under jurisdictions, and
add California questions because that pack is missing. Reference collections
should not dominate the repository's top-level presentation.

## Findings

- The current game has **118 questions**: 69 US MPRE-style, 28 England & Wales
  SQE-style, and 21 original LawScape dilemmas with mixed Arizona/Nevada source
  labels. None of these should be removed or silently relabeled.
- **There is no dedicated California question pack.** California currently has
  a reference-library entry, 79 rule records and five bundled reference files;
  its firm-pack status is “Not yet available.” References are not questions.
- The README is 264 lines / approximately 1,843 words. Detailed release changes
  precede basic play instructions, and the introduction repeats.
- The roadmap still calls the deployed 0.5.0 version a release candidate.
  Older plans describe a Justice Square, separate law library and
  reputation-locked courthouse that do not describe the current game.
- A New York draft has also been added to the working tree. Its executive
  summary describes 28 email questions and five short BarMail scenarios awaiting
  practitioner review. These are not part of the 118 live questions. This review
  has not validated their legal answers or independently rerun their checks.

## Recommended changes

| Priority | Change to approve | Benefit |
| --- | --- | --- |
| 1 | Rewrite the README to about 400–600 words, starting with Play, one screenshot and a short introduction. | A new visitor can quickly understand and start the game. |
| 1 | Add one player guide and align the in-game Help with it. | Clear first steps, controls, rewards, saves and consequences. |
| 1 | Move jurisdiction reference and authoring files into a consistent content directory. | California and other research folders stop crowding the repository root. |
| 1 | Make the jurisdictions section a catalog of actual question packs, with counts, status and a route to play. | Players can find relevant practice without confusing sources or plans with available questions. |
| 1 | Create and review **20 original California professional-responsibility questions**, then integrate the approved pack. | California becomes a playable option with its own questions. |
| 2 | Move detailed release changes into a changelog and label/archive older plans. | Current instructions are easy to distinguish from history. |
| 2 | Group developer documentation behind a small index and use explicit deployment file entries. | Technical detail stays discoverable without overwhelming players or accidentally publishing drafts. |

This is a presentation and organization cleanup, with a California content
addition. Preserve all existing questions, gameplay, avatars, locations and
save compatibility. Moving reference files should preserve the in-game library
and question explanations; removing that library is not proposed.

## What players should see first

Recommended README order:

1. **LawScape:** one sentence explaining the legal-career game.
2. **Play now:** direct public game link, one screenshot and optional demo video.
3. **Your first five minutes:** create an attorney; open Journal for the guided
   firm day or BarMail for a quick ethics question; read feedback; explore.
4. **Jurisdictions and practice packs:** a concise current-availability table.
5. **Know before you start:** browser saves, no account required, Ethics
   consequences, how feedback works and a short educational disclaimer.
6. **Find more:** player guide, report a bug, contribute, roadmap and developer
   documentation.

Example opening:

> LawScape is a free browser game where you build a legal career at Hardsell &
> Firestone. Create an attorney, answer workplace dilemmas, inspect case files,
> earn gold, and improve your office—all while protecting your Ethics.
>
> Start with **Journal** for your first firm assignment, or **BarMail** for a
> quick ethics question. No account or installation is required.

Keep the firm's humor. Put detailed prices, upgrade mechanics, migration notes,
renderer choices and hosting details in their appropriate guides.

## Jurisdictions and question catalog

Use the same labels and availability across README, `docs/JURISDICTIONS.md`,
the in-game jurisdiction desk and BarMail. Recommended catalog:

| Practice | Current questions | Status and proposed treatment |
| --- | ---: | --- |
| US MPRE-style | 69 | Playable; retain all. This is exam-style/model-rule study, not a state-specific pack. |
| England & Wales SQE-style | 28 | Playable; retain all. |
| LawScape original dilemmas | 21 | Playable; retain their actual mixed Arizona/Nevada source labels. |
| Fictional firm apprenticeship | Six writing assignments, two files and one capstone | Playable; separate this activity count from the multiple-choice question total. |
| California | 0 | Add 20 original questions; mark playable only after review and integration. |
| New York | Draft reports 28 + 5 | Preserve the draft and its review status. Include in the catalog as awaiting review, then integrate once approved. |
| Canada | Planned | Preserve the existing province-specific roadmap work; do not label it available. |

Available in-game catalog entries should let a player select the corresponding
BarMail pack directly. Keep a “Mixed practice” option. New California questions
should be available both in their own pack and in mixed practice, with the
jurisdiction clearly identified on each question and explanation.

Show future jurisdictions in a secondary “Coming next / Request a jurisdiction”
section. Put source collections under a subordinate “Sources and reference
material” link, not above the game introduction. Distinguish available practice
questions from a fully reviewed firm curriculum so one does not imply the other.

## California question addition

Recommend **20 original workplace-email questions** with varied difficulty,
plausible choices, a preferred answer and explanations. Suggested topics include
confidentiality, conflicts, client communication, fees, client funds, candor and
supervision. These are proposed topic areas, not conclusions about California law.

Implementation should verify current California primary sources, preserve
California-specific distinctions, record citations and source-check dates, and
produce a reviewable answer key. Existing bundled research may help locate
issues, but it should not substitute for checking the current sources.

After content review, integrate approved questions through the normal build,
practice filters, jurisdiction labels, feedback and tests. Keep existing question
identifiers so prior answers and saves remain intact. The intended destination
is the playable game; drafts are only an intermediate review stage. Label the
pack as unofficial educational practice, not official California Bar questions.

## Proposed organization

```text
README.md                         Play, introduction and navigation
LICENSE / SECURITY.md            Standard repository information
CHANGELOG.md                     Released changes
ROADMAP.md                       Current priorities and future work
CONTRIBUTING.md                   How to help

docs/
  README.md                      Documentation index
  PLAYING.md                     Player guide
  JURISDICTIONS.md                Question packs, counts and availability
  BUILD.md / DEPLOYMENT.md        Maintainer instructions
  archive/                       Dated older plans

content/
  references/california/         Existing California reference files
  questions/mpre/                Existing MPRE authoring sources
  questions/england-wales/        Existing SQE authoring sources
  questions/california/          Proposed California pack and source notes
  questions/new-york/             Existing New York draft and reviewer notes
```

This organizes authoring files; runtime modules can remain in `js/data/`.
Moving files requires coordinated updates to generators, packaged paths,
in-game source links, documentation links and tests. For California, update
`build-rule-library.mjs`, generated resource links and the site file list so
the shelf still works. Rebuild the bundle rather than editing generated code.

Keep current source material reachable where gameplay uses it. Publish the
player guide and explicitly needed reference/source files; keep archived plans,
maintainer instructions and unapproved drafts out of the playable artifact.
Replace the broad `docs/` deployment entry with named files.

## Player guidance to clarify

- **Start here:** Journal for a guided first assignment; BarMail for a quick
  question. Explain the difference before presenting detailed mechanics.
- **Ethics and rewards:** ethics questions can damage Ethics; zero ends the run.
  The fictional apprenticeship uses study gold and does not apply Ethics damage.
- **Feedback:** writing checklist choices receive authored feedback; saved prose
  is for self-comparison and is not currently graded by a live AI service.
- **Saves:** progress is stored in this browser, without cross-device sync.
- **Sidebar:** local notes and an explorable lounge; consider “Table notes” in
  place of “Room & Chat” while shared messaging is unavailable.
- **Courtroom:** exploration and scripted characters are available; hearings
  and live AI judging are planned.
- **Help:** pair the “Email HR” joke with “Report a bug” and explain the GitHub
  draft/submission step.

The small UI-copy changes are recommendations for approval alongside the docs.
They do not require changing game balance or the underlying activities.

## Implementation and acceptance after approval

1. Reorganize and rewrite documentation, preserving existing Canada roadmap,
   New York draft and cover-concept work. Do not sweep unrelated pending work
   into a cleanup commit.
2. Update moved file references and verify all existing 118 questions, source
   links, rule-library behavior and saved progress still work.
3. Draft and verify the California questions; obtain the requested content
   review before describing the pack as available or publishing it.
4. Integrate approved California content and synchronize jurisdiction labels,
   counts and entry points. Treat the New York draft's separate review status
   accurately.
5. Run the existing game tests, package/link checks and a focused desktop/mobile
   walkthrough. Prepare the updated release for publication under the approved
   scope.

**Recommended approval scope:** documentation reorganization, player guidance,
jurisdiction catalog and development of the 20-question California pack. Review
the new question content before it becomes playable. No existing game files,
existing documentation, GitHub branch or live site were changed while preparing
this proposal.
