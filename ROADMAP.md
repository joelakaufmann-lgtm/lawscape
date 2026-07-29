# LawScape Roadmap

LawScape is an old-school-MMORPG-styled legal ethics game. You play a new
attorney who answers ethically loaded emails from partners and clients,
earning gold for sound professional-responsibility judgment and losing
Ethics health for violations — until the Ethics bar hits zero and you are
disbarred.

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
- Repeatable **Document Review** at the filing cabinet: the attorney sits for a
  one-minute work cycle and earns five gold.
- A searchable **Ethics Treatise Rule Library** generated from local Nevada,
  Arizona, and California files, including the California rules, formal-opinion
  corpus, and discipline/admissions reference pointers.
- Office NPCs and upgrades: Liz Loza’s reminders, Riley Readsalot’s paralegal
  protection, Jim Hardsell’s studied silence, Linda Firestone’s five-gold
  ethics tips, a coffee machine that restores two Ethics points, and optional
  100-gold relevant-rule research from Riley when both upgrades are owned.
- Gold rewards for correct answers, Ethics-bar damage (with a rule-cited
  explanation) for wrong ones, streak healing for two correct in a row,
  and permadeath: **YOU GOT DISBARRED — GAME OVER** wipes the save.
- Local save via `localStorage`. MIT licensed.

## Planned — future editions

### Court Simulation (headline feature)

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

- **More jurisdictions**: toggle between Arizona (ER), Nevada (NRPC), and
  California scenario packs, mirroring the three `ethics-check-*` skills.
- **Law Library zone**: research minigame to earn a hint before answering
  a BarMail scenario.
- **Ethics CLE system**: spend gold on CLE courses that restore Ethics.
- **Cosmetics**: robes, briefcases, office art, apartment views.
- **Sound**: OSRS-style level-up jingle on streak heals.

## Contributing

Scenario contributions are welcome — each scenario needs a realistic email,
one defensible correct response, plausible wrong answers, and an explanation
grounded in a real rule of professional conduct (no invented authority).
See `js/data/ethics.js` for the format.
