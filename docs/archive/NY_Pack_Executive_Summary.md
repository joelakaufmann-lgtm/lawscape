> Historical draft memo, superseded for playable content by [New York source review](../../content/questions/new-york/SOURCES.md). Original assertions below are not a current release status.

# LawScape New York Ethics Pack — Executive Summary

**Prepared for:** Joel Kaufmann, LawScape
**Purpose:** Reviewer briefing for a New York practitioner before the pack is approved for the firm curriculum
**Status:** Draft — content only; nothing under `js/` or `scripts/` has been changed
**Date:** September 27, 2026

---

## 1. Direct Answer

Two question sets and this summary are ready for New York practitioner review. The 28-question main pack and the five short BarMail scenarios test the **New York Rules of Professional Conduct (22 NYCRR Part 1200)** as adopted, not the ABA Model Rules, and are written in the game's existing formats so they can be wired in with a cloned build script once approved. Every answer rests on quoted black-letter Rule text or 22 NYCRR Part 1215; no ethics opinion, case, or Judiciary Law provision is relied on, because none is in the reference set. Six items are flagged below for the reviewer to verify against the official compilation before approval.

## 2. Deliverables

| File | Format | Contents |
|---|---|---|
| `NY_Ethics_Email_Scenarios.md` | SQE/MPRE Markdown pack format | 28 four-choice email scenarios, answer-key table (answer, primary authority, core reason), source framework and snapshot note. Parse-tested against a clone of `scripts/build-sqe-questions.mjs`: 28 questions, four choices each, answer key paired, answers distributed 7/7/7/7 across A–D. |
| `NY_Short_BarMail_Scenarios.js.txt` | `CORE_SCENARIOS` object format from `js/data/ethics.js` | Five three-choice scenarios (`correct` / `wrong` / `very_wrong`) with a rule-quoting `why` on every wrong choice. Syntax-checked as an ES module. Delivered as `.txt` so nothing is imported until reviewed. |
| `NY_Pack_Executive_Summary.md` | This document | Design, coverage map, New York divergences, verification items, reviewer checklist, integration path. |

## 3. Design

- **Fictional firm:** Van Rensselaer, Okafor & Delacroix LLP, with partners writing from Manhattan, Brooklyn, the Bronx, Queens, Staten Island, Long Island, Westchester/Hudson Valley, the Catskills, Albany, Saratoga, Lake Placid, the Thousand Islands, Syracuse, Ithaca, Rochester and Buffalo. Settings are real places; every person, client and matter is invented.
- **Difficulty tiers** follow the SQE build script's numbering convention: questions 1–4 (tier 1, 35 gold), 5–14 (tier 2, 45 gold), 15–28 (tier 3, 60 gold). Easier questions are placed first so a cloned build script assigns gold correctly without modification.
- **One defensible correct answer per question.** Wrong choices are drafted to be plausible under the Model Rules or under folk wisdom, so the pack rewards knowing the New York rule specifically.
- **Tone:** each email carries one regional detail (the F train, beef on weck, the Tipp Hill traffic light, the Saratoga paddock) and then gets to the rule. Nothing in the fun framing changes the facts that drive the answer.
- **Educational framing:** the instructions state that the pack is unofficial, is not MPRE material, and is not legal advice, matching `CONTRIBUTING.md` requirements for jurisdiction packs.

## 4. Rule Coverage Map

| Area | Main pack question(s) | Short scenario | Rule(s) tested |
|---|---|---|---|
| Escrow / IOLA administration | 1, 13 | Weekend "loan" from escrow | 1.15(a), (b)(1)–(2), (b)(4), (e) |
| Fees and engagement | 5, 6, 12 | — | 1.5(b), (d)(4), (g); Part 1215 |
| Communication and client authority | — | Bodega settlement offer | 1.2(a), 1.4(a)(1)(iii), 1.4(b) |
| Confidentiality | 15, 16, 27 | — | 1.6(a) definition, 1.6(b)(2), 1.9(c), 8.3(c)(1) |
| Current-client conflicts | 7 | — | 1.7(a)(2), 1.7(b) |
| Former and prospective clients | 8, 10 | — | 1.9(a), 1.18(b)–(d) |
| Imputation, screening, conflict systems | 9 | Plattsburgh conflicts database | 1.10(c)(2)–(3), (d), (e)–(g) |
| Specific conflicts (gifts, financial assistance) | 4, 22 | — | 1.8(c)(2), 1.8(e) |
| Withdrawal | 11 | — | 1.16(c)(5), (d), (e) |
| Candor and conduct before tribunals | 2, 17, 20 | — | 3.3(a)(2), 3.3(a)(3), 3.3(c), 3.5(a)(2) |
| Fairness to opposing party | 18, 19 | — | 3.4(b), 3.4(e) |
| Trial publicity | 21 | — | 3.6(a)–(c) |
| Represented and unrepresented persons | 3, 23, 24 | — | 4.2(a)–(b), 4.3, 4.4(b) |
| Post-incident communications | 14 | — | 4.5(a) |
| Supervision, UPL, nonlawyers | 25, 26 | — | 5.1(b), (d); 5.3(a)–(b); 5.5(b); 7.3(b); 8.4(a) |
| Advertising | — | 7 train ad | 7.1(a), (c), (d) |
| Restrictions on practice | — | Mineola non-compete | 5.6(a)(1) |
| Reporting misconduct | 27 | — | 8.3(a), (c)(1) |
| Discrimination and harassment | 28 | — | 8.4(g), 5.1(b), (d) |

Not covered by design: Rule 1.11 (government lawyers), Rule 1.12 (former judges and neutrals), Rule 1.17 (sale of practice), Rule 3.8 (prosecutors), Rule 5.8 (nonlegal professionals), Rule 7.5 (letterheads and names), and Rule 1.14 (diminished capacity). These are candidates for a second New York pack.

## 5. New York Divergences the Pack Deliberately Tests

These are the points where a player who knows only the Model Rules should get the question wrong. Each is stated from the Rule text on file.

1. **Nonrefundable retainers (Q5).** Rule 1.5(d)(4) flatly prohibits a "nonrefundable retainer fee," while permitting a plain-language "reasonable minimum fee clause." The Model Rules have no counterpart.
2. **Fee division (Q6).** Rule 1.5(g) requires the client's agreement "confirmed in writing" after disclosure of "the share each lawyer will receive," and joint responsibility must be assumed "by a writing given to the client."
3. **Lateral screening carve-out (Q9).** Rule 1.10(c)(3) denies screening in litigation and other adjudicative matters where the lateral "substantially participated in the management and direction of the matter" or "had substantial decision-making responsibility ... on a continuous day-to-day basis." The Model Rule contains no such carve-out.
4. **Mandatory conflict-checking system (short scenario 4).** Rule 1.10(e)–(g) makes a written engagement record and a conflict-checking system a freestanding obligation; substantial failure is itself a violation.
5. **Escrow mechanics (Q1, Q13, short scenario 3).** Rule 1.15(b)(1) requires a New York banking institution that provides dishonored-check reports under Part 1300 and prohibits overdraft protection; Rule 1.15(e) bars withdrawals to cash and limits signatories to New York-admitted lawyers. New York uses **IOLA**, not IOLTA.
6. **Confidential information definition and crime-prevention exception (Q15, Q16).** Rule 1.6(a) defines "confidential information" to include information "likely to be embarrassing or detrimental to the client," and Rule 1.6(b)(2) permits disclosure "to prevent the client from committing a crime" — any crime, not only those threatening death or bodily harm.
7. **Client-to-party communications (Q3).** Rule 4.2(b) permits the lawyer to cause and counsel a client's direct communication with a represented person only after "reasonable advance notice to the represented person's counsel." The Model Rule's comment-level treatment has no notice requirement.
8. **Threatening criminal charges (Q19).** Rule 3.4(e) retains the prohibition on threatening criminal charges "solely to obtain an advantage in a civil matter," which the Model Rules dropped.
9. **Defense-side post-incident contact (Q14).** Rule 4.5(a) imposes the 30-day (or 15-day) quiet period on lawyers for actual or potential defendants and their indemnitors — a defense-side rule with no Model Rule analogue.
10. **Harassment as misconduct (Q28).** Rule 8.4(g) as amended reaches harassment "whether or not unlawful" on enumerated protected categories, defines "conduct in the practice of law" to include coworker interactions and firm management, and carves out petty slights.
11. **Reporting (Q27).** Rule 8.3(a) uses a "knows" threshold and Rule 8.3(c)(1) excepts information protected by Rules 1.6, 1.9 or 1.18, which is the pivot of the question.

## 6. Materials Status and Items for Reviewer Verification

The pack was built from the `ethics-check-ny` reference set: the NYSBA edition of the Rules amended through June 1, 2026 (with a January 1, 2017 official-compilation cross-check), Part 1215 as reproduced in a 2002 NYSBA circular, and the Standards of Civility. **Not on file:** Part 1240, Part 118, Part 137, Part 1400, Part 130, the IOLA rules, the Judiciary Law, and all New York ethics opinions. The following items should be checked before approval.

| # | Item | Where it matters | What to verify |
|---|---|---|---|
| V1 | **Part 1215 fee threshold.** The on-file text is the 2002 circular stating a $3,000 threshold. | Q12 | Confirm the current Part 1215 text and threshold on nycourts.gov; adjust the dollar figure in choice A and the answer key if it has changed. |
| V2 | **Article 7 amendments.** The June 2026 NYSBA text shows Rule 7.1 retitled "Communications Concerning a Lawyer's Services" and Rule 7.3 retitled "Solicitation of Clients" with a live person-to-person prohibition (7.3(b)); Rule 7.4 is reserved. The former 7.3(c) filing regime and 7.3(e) 30-day rule do not appear in the 7.3 text on file. | Q25, short scenario 2 | Confirm the effective date of the Article 7 amendments and that 7.1(a), (c), (d) and 7.3(b) read as quoted. The `ethics-check-ny` SKILL.md pitfalls section still describes the pre-amendment regime and should be updated. |
| V3 | **Rule 4.5(b) cross-reference.** The on-file 4.5(b) still says plaintiff-side unsolicited communications "shall comply with Rule 7.3(e)," but 7.3(e) in the amended text concerns prepaid legal plans. This looks like an unconformed cross-reference. | Q14 (uses 4.5(a) only) | Confirm 4.5(a) text; note whether the courts have conformed 4.5(b). The question is drafted to avoid 4.5(b). |
| V4 | **Rule 5.5 text.** The 2026 NYSBA file lost the black-letter text of Rule 5.5 in PDF conversion; the pack quotes 5.5(b) from the 2017 official compilation ("A lawyer shall not aid a nonlawyer in the unauthorized practice of law"). | Q26 | Confirm 5.5(a)–(b) are unchanged in the current compilation. Consider whether to add a reviewer note on Judiciary Law §§ 478 and 484 (text not on file). |
| V5 | **Advance-fee retainers intentionally avoided.** Whether an advance payment of fees must be held in escrow in New York turns on ethics-opinion authority that is not on file. Q1 and short scenario 3 therefore use third-party escrow funds (contract deposit, closing proceeds), where Rule 1.15 is unambiguous. | Q1, Q5, Q11, short scenario 3 | If the reviewer wants an advance-fee question, it should be drafted with the governing NYSBA opinions in hand. Q11's refund language tracks Rule 1.16(e) ("promptly refunding any part of a fee paid in advance that has not been earned") and does not depend on where the advance was held. |
| V6 | **Rule 5.6 forfeiture clause.** Short scenario 5's `very_wrong` explanation reasons from the Rule text that a forfeiture-for-competition clause is a financial disincentive the Rule does not exempt; New York appellate case law on such clauses is not on file. | Short scenario 5 | Confirm and cite current Court of Appeals authority, or narrow the `very_wrong` explanation to the Rule text alone. The note is flagged inline in the file. |

Two further reviewer notes:

- **Departmental variation.** Discipline is administered per Department under Part 1240 (not on file). None of the questions turns on a Department-specific rule, but the reviewer should confirm that none of the fact patterns implicates a local rule (for example, First Department escrow or retainer-statement requirements in personal-injury matters).
- **Rule 3.4 opener.** The 2026 NYSBA conversion dropped the words "A lawyer shall not:" at the head of Rule 3.4; the 2017 compilation confirms them. Q18 and Q19 are drafted on that basis.

## 7. Reviewer Checklist

For each question, the reviewer is asked to confirm:

1. The correct answer is correct under the current New York Rule, and no other choice is defensible.
2. The "Primary authority" column cites the operative subdivision, and the "Core reason" paraphrase does not overstate the Rule.
3. No fact pattern depends on a Comment, an ethics opinion, a case, or a Judiciary Law provision that is not cited.
4. Regional references are accurate and inoffensive, and no real person, firm, judge, business or pending matter is identifiable.
5. The instructions and source framework satisfy the "real rules only, snapshot date, official link, named reviewer and scope" requirements in `CONTRIBUTING.md`. The reviewer's name, the regulator (Appellate Divisions, Joint Rules), the legal system (New York, common law, four Departments), the as-of date, and a rubric version should be recorded on approval.

## 8. Integration Path (after approval)

1. Move the approved pack to the repository root (or wherever the SQE/MPRE sources live), clone `scripts/build-sqe-questions.mjs` as `scripts/build-ny-questions.mjs` with the New York source name, `id` prefix (`ny_`), `sourceType: 'ny-rpc-style'`, and the official-source URLs from the pack's source framework.
2. Add `ny:build` to `package.json` and to the `prebuild` chain; generate `js/data/ny.js`.
3. Import `NY_SCENARIOS` (and, if adopted, `NY_SHORT_SCENARIOS`) in `js/data/ethics.js` and add New York to the firm-desk jurisdiction labelling, replacing "awaiting review" once the reviewer signs off.
4. Run `npm run build`, `npm test` and `npm run release:check`; review the generated module for snapshot date, source labels and official links.

## 9. Risk Posture

**Low to moderate.** The content is educational, fictional and rule-anchored, and the six verification items are discrete. The principal residual risks are (a) a stale Part 1215 threshold, (b) any Article 7 text that differs from the on-file NYSBA edition, and (c) the two explanations (V5, V6) that sit closest to opinion-level or case-law authority. Each is isolated to one or two questions and can be corrected without restructuring the pack.

## 10. Assumptions and Limitations

- The pack assumes a New York state-court practice setting; federal courts sitting in New York generally adopt the New York Rules by local rule, but no question depends on that.
- Gold values and difficulty tiers assume the SQE build script's conventions are reused unchanged.
- The NYSBA Preamble, Scope and Comments were consulted for orientation only and are not cited anywhere in the pack, consistent with their status as guidance not adopted by the Appellate Divisions.
- This summary and the pack are drafting aids for the reviewing attorney; they are not legal advice to any player.
