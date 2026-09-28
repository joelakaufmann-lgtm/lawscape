# California Admissions, Discipline, Trust Accounts, IOLTA, CLE — Reference Pointer

**GAP NOTICE.** The training corpus delivered to this skill did not include the full text of the California admissions, discipline, trust-account, IOLTA, and CLE rules. This file is a **reference pointer** — it lists the canonical primary sources for each topic so that downstream agents know where to look. Do **not** invent or paraphrase the text of these rules. When a question implicates any of these rules, either:

1. Ask the user to supply the current rule text (upload of the relevant California Rules of Court Title 9 sections, State Bar Rules, or Business and Professions Code sections), **or**
2. Pull the current rule from an official California judicial or State Bar source, or another reliable legal database, **or**
3. Flag the gap in the response and decline to quote rule text not present in this corpus.

## Primary Source Map

### Admissions to Practice

- **California Rules of Court, Title 9, Division 1 (rules 9.1–9.9.5).** General rules governing admission to the State Bar.
- **Rules of the State Bar of California, Title 4** (Admissions and Educational Standards) and **Admissions Rules** (Rules 4.1 et seq.).
- **California Business and Professions Code §§ 6060–6069** (qualifications for admission; moral character; State Bar examination; licensing fees).

### Pro Hac Vice and Out-of-State Attorneys

- **Cal. R. Ct. 9.40** — Counsel pro hac vice.
- **Cal. R. Ct. 9.41–9.48** — Various categories of out-of-state counsel (e.g., registered in-house counsel, registered legal services attorney, registered legal aid attorney, registered military spouse attorney).
- **Cal. R. Ct. 9.45** — Registered legal services attorneys.
- **Cal. R. Ct. 9.46** — Registered in-house counsel.

### Discipline — Substantive

- **California Business and Professions Code §§ 6075–6117** (substantive discipline provisions, including grounds, probation, disbarment).
- **Business and Professions Code § 6068** (duties of an attorney — including § 6068(e)(1) confidentiality; § 6068(f) respect for courts; § 6068(i) cooperation with State Bar investigations; § 6068(m) communication with clients; § 6068(o) self-reporting duties).
- **Business and Professions Code § 6103** (acts warranting disbarment or suspension — violation of oath or duties).
- **Business and Professions Code § 6106** (moral turpitude, dishonesty, corruption).
- **Business and Professions Code § 6125** (unauthorized practice of law by non-attorneys).
- **Business and Professions Code § 6126** (UPL — misdemeanor and injunctive relief).
- **Business and Professions Code § 6128** (deceit, collusion, delay in proceedings).

### Trust Accounts and IOLTA

- **Cal. R. Prof. Conduct 1.15** (Safekeeping Funds and Property of Clients and Other Persons). *(See `rpc.md` for the current text.)*
- **Business and Professions Code §§ 6211–6213** (IOLTA program; Interest on Lawyers' Trust Accounts Fund).
- **Rules of the State Bar, Title 2, Division 1, Chapter 4** (Trust Account and Client Trust Accounting Handbook requirements).
- **Client Trust Account Protection Program (CTAPP)** — annual compliance reporting by all active California licensees.

### Continuing Legal Education (MCLE)

- **Business and Professions Code § 6070** (MCLE authority).
- **Rules of the State Bar, Title 2, Division 4, Rules 2.50–2.95** (MCLE program requirements).
- 25 hours every three years, including specific subtopics (ethics, elimination of bias, competence issues, technology in the practice of law).

### State Bar Court — Disciplinary Forum

- The **California State Bar Court** is the forum for original disciplinary proceedings. It is an administrative tribunal of the State Bar; review of its decisions runs to the California Supreme Court.
- See `disciplinary-procedure.md` for the procedural framework.

### Annual Licensing and Good Standing

- **Business and Professions Code §§ 6140–6140.7** (annual licensing fees).
- **Rules of the State Bar, Title 2** (license status, inactive status, reinstatement).

## Citation Format

When a California court rule or State Bar rule is implicated:
- Rules of Court: `Cal. R. Ct. 9.40(a)` (not "CRC").
- State Bar Rules: `State Bar R. 4.1` or `Rules of the State Bar of California, Title 4, Rule 4.1`.
- Business and Professions Code: `Cal. Bus. & Prof. Code § 6068(e)(1)`.

## Working Around the Gap

If the user poses a question that requires quoting the operative text of any of the rules listed above, the response should:

1. Identify the governing primary source by citation (from the list above).
2. Candidly disclose that the operative text is not in this skill's reference corpus.
3. Recommend pulling the current rule from an official or reliable legal source, or asking the user to supply the text.
4. **Do not** reconstruct or paraphrase the rule text from memory. Cite the source only.
