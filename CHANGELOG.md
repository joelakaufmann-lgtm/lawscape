# LawScape changelog

## 0.9.0 — October 30, 2026

- **Three new treatise shelves, verbatim:** the New York Rules of Professional
  Conduct (22 NYCRR Part 1200, as amended through July 1, 2026), the Federation
  of Law Societies of Canada Model Code of Professional Conduct (2024, with
  Commentary) and the SRA Standards and Regulations for England & Wales
  (Principles, Code of Conduct for Solicitors, Code of Conduct for Firms). The
  extracts live under `content/references/` with source and retrieval notes.
- **Study list:** every question answered wrongly is kept until it is answered
  correctly. The Record panel lists them and exports a Markdown study list (or
  copies it as text) with your reply, the preferred reply and its rationale.
- **Authored rationale on every question:** the 21 LawScape originals, 69
  MPRE-style and 28 SQE-style questions now carry a per-question explanation
  for the correct answer; the generic closing sentence is gone. The generated
  packs fail to build if a rationale is missing. (Content needs legal review.)
- **Partner feedback follows your score:** each writing assignment has four
  authored replies (0 to 3 checklist picks right), so a 3/3 reply is no longer
  greeted with the rebuke written for 0/3.
- **Office Snack Fridge** replaces the dot painting as the 2,000-gold office
  upgrade: grab a snack for +8 Ethics on a two-minute cooldown. Existing saves
  that owned the painting own the fridge.
- Rooms: sitting on the couch no longer hides you behind it (seated figures
  draw above the furniture they sit on); the Better Mattress now swaps in a 2×2
  queen bed, and both beds have a real headboard with posts and a padded panel;
  Riley sits at the paralegal desk once hired; the plant in Jim's office is gone.
- BarMail: Canada email assignments scroll again; reopening BarMail returns to
  the view you left instead of resetting to "All mail"; payouts show their
  basis (base × upgrades × streak); New York short dilemmas pay by difficulty
  like every other question; the emptied-tier notice explains what a new round
  does and what unlocks the next level; the originals pack carries a standing
  mixed Arizona/Nevada notice and list badge; the loss screen names the ways to
  recover Ethics.
- The espresso cooldown now shows a moment with a random rule from the shelf
  (or a rule of thumb) instead of a bare error.

## 0.8.0 — October 29, 2026

- Added **Juris Avenue**, a walkable street outside every building. Leaving the
  office, the Associates' Floor, the courthouse, The Sidebar or your apartment
  now puts you on the pavement in front of its door; the Travel button and T
  key remain as quick travel. The street is a shared online zone.
- Rooms rearranged from play-testing: Liz now sits at her computer on a broken
  chair that the "New Chair for Liz Loza" upgrade replaces; the stray chair in
  the middle of the office is gone; the treatise shelf's bottom row is centred
  and each shelf carries its own plaque; Jim's and Linda's chairs face their
  desks and their monitors face them; both partners sit; Jim's bar cart and
  Linda's bookshelf are against the wall; conference plants line the walls and
  the near chairs face the table; courtroom benches face the judge; the
  apartment plant and coffee machine sit against the walls.
- Redrew the skirt suit (waistband, pencil silhouette, hosiery, no slit).
- **Wardrobe:** pocket square, gold earrings, sunglasses, pearl necklace and
  gold wristwatch for study gold; a tuxedo and an evening gown once you own
  the apartment Wardrobe Rack (one formal outfit at a time); a powdered
  barrister's wig earned by answering five England & Wales questions
  correctly. Wardrobe items are now data-driven and render on remote players.
- **Espresso Machine** office upgrade (1,000 gold): +5 Ethics on a 90-second
  cooldown, and it sobers you up.
- **Adopt a pet** from the apartment furniture catalog (2,000 gold): a cat or a
  dog you name, which wanders your apartment.
- **Briefcase Dash** now costs 5 gold for three rounds; credits are held by the
  account service, so online play cannot be gamed from the browser.
- Arriving at the firm or the courthouse while a drink still slows you costs
  10 Ethics, once per drink. Home, the street and The Sidebar are safe.
- Consecutive correct answers multiply question gold (×1.1, ×1.2 … capped at
  ×1.5 from the sixth in a row); the result screen shows the bonus.
- New attorneys start on the **LawScape original dilemmas** pack. Nothing is
  locked; existing saves keep their chosen pack.
- **Canada** is now a full question pack: 25 questions with gold by difficulty,
  Ethics damage and streaks, included in Mixed practice (196 questions total).
  The five Canadian writing emails remain an ungraded exercise. Practitioner
  review of the answer key is still pending and is labelled as such.
- Creator gains a **Surprise me** button that randomises the attorney.
- Save schema is now 7 (older saves load unchanged; the pre-0.8.0 Canada pack
  id maps to the new pack). The 0.6.0 economy replay oracle is retired.

## 0.7.0 — October 29, 2026

- Added an invite-only online firm on Cloudflare: Access email sign-in, a
  Worker serving the site plus `/api` and `/ws`, an Account Durable Object
  that owns each player's progress, and a FirmRoom Durable Object that
  broadcasts live presence. See `docs/ONLINE.md`.
- Added the shared **Associates' Floor**: eight claimable open desks with
  brass nameplates, BarMail and document review from a claimed desk, and a
  "Who's in" roster with status tags.
- Other attorneys now appear in every firm room (not the apartment) with
  name tags; the minimap plots them.
- Moved every progress rule into a shared reducer (`js/economy.js`,
  `js/actions.js`) that solo play applies locally and the online account
  service applies with its own clock. A replay test proves the solo economy
  is unchanged. Save schema is now 6 (older saves load unchanged).
- Document review now keeps its cadence across saves and reloads; the
  Associates' Floor is also a solo bonus room.

## 0.6.0 — September 27, 2026

- Added 20 original California questions and 33 New York questions, bringing
  the total to 171 while preserving all 118 existing questions and their IDs.
- Added direct question-pack entry from Firm jurisdictions, clear jurisdiction
  labels, and cited explanations for both correct and incorrect new answers.
- Corrected New York draft answers and citations against the source review
  recorded with the pack, including 2025 and 2026 amendments.
- Reorganized question sources and California references under `content/`.
  The reference shelf still works, and the root README now starts with play.
- Added a player guide and documentation index; archived historical design plans.
- Renamed Sidebar's local drafting controls to Table notes and clarified bug
  reports, local saves, authored writing feedback and planned multiplayer.
- Fixed a mobile overlay that could cover Help; all five quick actions now fit
  on one row and the assignment reminder sits below the world.
- Preserved avatars, seven locations, all apprenticeship activities and saves.

## 0.5.0 — September 27, 2026

- Expanded the avatar creator and wardrobe, with shared appearance previews.
- Added room furnishings, courtroom characters and B.A.R.T. in The Sidebar.
- Unified BarMail writing and ethics practice; added the Work Phone upgrade.
- Added local billable-time records for completed runs and Sidebar drinks.
- Shipped six writing assignments, two synthetic files and a connected capstone,
  with authored checklist feedback, saved drafts and study gold.
- Verified and deployed the complete static package to GitHub Pages, including
  the 118-question pool, reference shelf, seven locations and demo media.
