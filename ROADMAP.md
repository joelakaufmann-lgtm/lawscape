# LawScape Roadmap

LawScape is an old-school-MMORPG-styled legal ethics game. You play a new
attorney who answers ethically loaded emails from partners and clients,
earning gold for sound professional-responsibility judgment and losing
Ethics health for violations — until the Ethics bar hits zero and you are
disbarred.

## Current version (v1.0)

- Third-person isometric world: your **Law Office** and your **Apartment**,
  both upgradeable with gold.
- **BarMail** ethics minigame: an in-game computer with an email inbox.
  Scenarios are drawn from the professional-responsibility topics covered by
  a local `Ethics Agents` authoring corpus (Arizona ERs under
  Ariz. R. Sup. Ct. 42 and the Nevada Rules of Professional Conduct):
  trust accounts and safekeeping property, conflicts of interest, candor to
  the tribunal, the no-contact rule, confidentiality, solicitation and
  advertising, fee splitting, subordinate-lawyer duties, spoliation,
  reporting misconduct, and more.
- Gold rewards for correct answers, Ethics-bar damage (with a rule-cited
  explanation) for wrong ones, streak healing for two correct in a row,
  and permadeath: **YOU GOT DISBARRED — GAME OVER** wipes the save.
- Local save via `localStorage`. MIT licensed.

## Planned — future editions

### Court Simulation (headline feature)

The courthouse currently appears in the travel menu but is **closed**.
A future edition will open it with a full court simulation:

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
- **Difficulty tiers**: subtler fact patterns (screening, imputation,
  prospective-client conflicts under ER 1.18) unlocked by reputation.
- **Law Library zone**: research minigame to earn a hint before answering
  a BarMail scenario.
- **Ethics CLE system**: spend gold on CLE courses that restore Ethics.
- **Cosmetics**: robes, briefcases, office art, apartment views.
- **Sound**: OSRS-style level-up jingle on streak heals.
- **Mobile/touch controls.**

## Contributing

Scenario contributions are welcome — each scenario needs a realistic email,
one defensible correct response, plausible wrong answers, and an explanation
grounded in a real rule of professional conduct (no invented authority).
See `js/data/ethics.js` for the format.
