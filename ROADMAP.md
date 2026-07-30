# LawScape Roadmap

LawScape is an old-school-MMORPG-styled legal ethics game. You play a new
attorney who answers ethically loaded emails from partners and clients,
earning gold for sound professional-responsibility judgment and losing
Ethics health for violations — until the Ethics bar hits zero and you are
disbarred.

## The thesis

LawScape is built on one conviction with two halves:

1. **Legal learning should be fun.** Professional responsibility is usually
   taught as an outline and feared as an exam. It sticks better as a game —
   with gold, streaks, upgrades, office politics, and real consequences for
   bad judgment.
2. **It should be fun to learn about ethics in other countries.** The same
   dilemma — the unearned advance fee, the adverse authority, the talkative
   opposing party — lands in every inbox on Earth, and different
   jurisdictions answer it differently. Playing those differences is the most
   entertaining comparative-law classroom we can build.

Everything on this roadmap serves that thesis.

## Beta status — read this before competing with your friends

This release is a **beta**, and one design decision follows from that on
purpose:

- **The answer key ships in the open.** The complete scenario data —
  including which reply is correct and the explanation for every wrong one —
  lives in human-readable JavaScript under `js/data/` and is visible to
  anyone who opens the page source or DevTools. The game also explains the
  governing rule after every answer. In beta, LawScape is a study tool first
  and a competition second.
- **Future releases will make the answer key hidden.** Planned work includes
  shipping scenario data in an obfuscated form, withholding the correct
  answer until you commit to a reply, and a scored mode that saves the
  explanations for the end of a session — so streaks, records, and bragging
  rights actually mean something.
- **Wrong answers now hurt (beta rebalance).** Ethics damage escalates
  **30 → 45 → 60** across a consecutive mistake streak, up from 20/30/40.
  Three straight violations can disbar a brand-new attorney. Riley Readsalot
  still halves every tier.
- **Found a bug? Email HR.** BarMail includes an in-character **Email HR**
  desk for bug reports and complaints about the working conditions of the
  virtual firm. HR has not replied since 1987; your message becomes a
  prefilled GitHub issue you can review, edit, and file with the developers.
  Nothing is transmitted automatically.

## Current launch candidate

- Third-person isometric world with six zones: the **Main Office**, partner
  offices for **Jim Hardsell** and **Linda Firestone**, a **Conference Room**,
  your **Apartment**, and a furnished but intentionally empty **Courtroom**.
- **BarMail** ethics minigame: an in-game computer with an email inbox.
  Scenarios are drawn from the professional-responsibility topics covered by
  a local `Ethics Agents` authoring corpus (Arizona ERs under
  Ariz. R. Sup. Ct. 42 and the Nevada Rules of Professional Conduct):
  trust accounts and safekeeping property, conflicts of interest, candor to
  the tribunal, the no-contact rule, confidentiality, solicitation and
  advertising, fee splitting, subordinate-lawyer duties, spoliation,
  reporting misconduct, and more.
- Three progressive difficulty tiers with 69 original **MPRE-style** workplace
  emails clearly labeled as adaptations and linked to NCBE’s public preparation
  page.
- A 28-question **UK SQE-style** pack (England & Wales) with source notes and
  SRA sample-question links, plus a BarMail **practice-pack selector** (Mixed
  Inbox / UK SQE Ethics / US MPRE / State of Juris) — the first passport stamp
  toward the Global Law Firm.
- Repeatable **Document Review** at the filing cabinet: the attorney sits for a
  one-minute work cycle and earns five gold.
- A searchable **Ethics Treatise Rule Library** generated from local Nevada,
  Arizona, and California files, including the California rules, formal-opinion
  corpus, and discipline/admissions reference pointers.
- Office NPCs and upgrades: Liz Loza’s reminders, Riley Readsalot’s paralegal
  protection, Jim Hardsell’s studied silence, Linda Firestone’s five-gold
  ethics tips, a coffee machine that restores two Ethics points, and optional
  100-gold relevant-rule research from Riley when both upgrades are owned.
- Gold rewards for correct answers, escalating Ethics-bar damage for wrong
  ones (**30, then 45, then 60** as mistakes stack, each with a rule-cited
  explanation; Riley halves it), streak healing for two correct in a row,
  and permadeath: **YOU GOT DISBARRED — GAME OVER** wipes the save.
- **✍ Email HR**: the feedback desk inside BarMail. File a Bug Report, a
  Working-Conditions Complaint, or a Suggestion to Management; enjoy the
  auto-reply; then let the terminal turn your grievance into a prefilled
  GitHub issue for the developers.
- Local save via `localStorage`. MIT licensed.

## Planned — future editions

### Jurisdiction selection & the Global Law Firm (headline feature)

Today the core scenarios are set in the fictional State of Juris citing the
parallel Arizona and Nevada rules, and the beta's UK SQE-style pack already
brings England & Wales into the inbox through the practice-pack selector.
The next major edition makes jurisdiction a first-class choice at character
creation:

- **Pick your jurisdiction** — start your attorney under a single scenario
  pack: **California, Nevada, or Arizona** at launch, mirroring the three
  `ethics-check-*` authoring corpora. The inbox, rule citations, and treatise
  shelf follow the selected jurisdiction’s operative rules.
- **Work at the Global Law Firm** — or skip the choice and join a firm with
  offices everywhere. BarMail arrives from around the world: a trust-account
  question under one country’s rules today, a conflicts waiver under
  another’s tomorrow — each email labeled with its jurisdiction and graded
  under that jurisdiction’s authority. Learning how other countries resolve
  the same dilemma is meant to be the fun part, not homework.
- **Build out ethical rules from around the world.** The expansion map is not
  hypothetical. LawScape grew out of the LegalQuants (LQ) community, whose
  member directory (reviewed July 2026) spans roughly 27 countries and
  regions on five continents: the United States (including California, New
  York, Washington, D.C., Massachusetts, North Carolina, Ohio, and Utah),
  Canada, Uruguay, Argentina, England & Wales, Ireland, France, Belgium, the
  Netherlands, Germany, Switzerland, Austria, Italy, Greece, Finland, Russia,
  Türkiye, the UAE, Israel, India, Thailand, Malaysia, Singapore, Hong Kong,
  mainland China, Australia, and New Zealand. Every one of those is a
  candidate scenario pack — see [CONTRIBUTING.md](CONTRIBUTING.md) if you
  practice in one of them (or in one we missed).

### Court Simulation (the other headline)

The courtroom is now open and furnished, but no people or matters are on its
calendar. A future edition will add a full court simulation:

- Hearing and trial minigames: objections, candor-to-the-tribunal dilemmas
  (ER 3.3 / NRPC 3.3), witness-coaching traps (ER 3.4), and trial publicity
  calls (ER 3.6).
- Judge NPCs who remember your Ethics record; sanctions hearings when your
  Ethics bar is low.
- Disciplinary proceedings: if you get disbarred, face the Presiding
  Disciplinary Judge and argue for reinstatement instead of a hard reset.

### Other planned features

- **Hidden answer key / scored mode**: the beta’s open answer key (above)
  becomes optional — obfuscated data and end-of-session explanations for
  players who want their record to mean something.
- **Law Library zone**: research minigame to earn a hint before answering
  a BarMail scenario.
- **Ethics CLE system**: spend gold on CLE courses that restore Ethics.
- **More HR**: an HR NPC who is never at their desk, and auto-replies that
  escalate in passive aggression as your ticket count grows.
- **Cosmetics**: robes, briefcases, office art, apartment views.
- **Sound**: OSRS-style level-up jingle on streak heals.

## Contributing

Scenario contributions are welcome — each scenario needs a realistic email,
one defensible correct response, plausible wrong answers, and an explanation
grounded in a real rule of professional conduct (no invented authority).
Jurisdiction packs from around the world are the most-wanted contribution of
all. See [CONTRIBUTING.md](CONTRIBUTING.md) and `js/data/ethics.js` for the
format.
