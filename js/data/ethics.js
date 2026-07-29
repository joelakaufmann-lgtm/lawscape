// BarMail ethics scenarios — progressive professional-responsibility practice.
//
// Content was developed from a local professional-responsibility corpus
// (Arizona Ethical Rules under Ariz. R. Sup. Ct. 42, cited
// "ER x.x", and the Nevada Rules of Professional Conduct, cited "NRPC x.x").
// The game is set in the fictional State of Juris, which has adopted the same
// Model-Rules-based framework, so each explanation cites the real parallel
// rules. No invented cases, no invented rule text.
//
// grade: 'correct'    -> earn gold, streak++, streak of 2+ heals Ethics
//        'wrong'      -> lose WRONG_DMG Ethics, streak resets
//        'very_wrong' -> lose VERY_WRONG_DMG Ethics, streak resets
//
// Every non-correct choice carries a `why` explaining the violation and the
// rule, shown to the player when they lose Ethics.

import { MPRE_SCENARIOS } from './mpre.js';

export const WRONG_DMG = 10;
export const VERY_WRONG_DMG = 25;
export const STREAK_HEAL = 10;

const CORE_SCENARIOS = [
  {
    id: 'trust_advance',
    from: 'Jim Hardsell', role: 'Managing Partner', gold: 30,
    subject: 'Whitfield retainer — cash flow',
    body: 'The Whitfield engagement letter is signed and their $10,000 advance fee just hit. '
      + 'Payroll is tight this month — deposit it straight into the firm operating account. '
      + 'We’ll have it earned by the 30th anyway. Confirm when done.',
    rule: 'ER 1.15(c) / NRPC 1.15 — Safekeeping Property',
    choices: [
      { grade: 'correct',
        text: 'Deposit it into the client trust account and withdraw fees only as they are earned.' },
      { grade: 'very_wrong',
        text: 'Do as the partner says — the fee will be earned within the month anyway.',
        why: 'This is commingling. ER 1.15(c) requires fees paid in advance to go into the client trust account, "to be withdrawn by the lawyer only as fees are earned or expenses incurred." "We’ll earn it soon" is how trust-account discipline cases start, and misappropriation is routinely a disbarment-level offense.' },
      { grade: 'wrong',
        text: 'Split the difference: put half in trust, half in operating, and true it up at month end.',
        why: 'There is no half-commingling. Until earned, the entire advance is client property under ER 1.15(c). Depositing any unearned portion into the operating account is a trust-account violation regardless of later "truing up."' },
    ],
  },
  {
    id: 'candor_authority',
    from: 'Dana Whitfield', role: 'Client', gold: 30,
    subject: 'That bad case — just leave it out?',
    body: 'My brother-in-law (he did a year of law school) says there’s a court of appeals '
      + 'case directly against our position on the motion. Opposing counsel clearly hasn’t '
      + 'found it. You’re not going to hand them the win, right? Just leave it out of the brief.',
    rule: 'ER 3.3(a)(2) / NRPC 3.3 — Candor Toward the Tribunal',
    choices: [
      { grade: 'correct',
        text: 'Explain that you must disclose directly adverse controlling authority — and will argue why it is distinguishable.' },
      { grade: 'very_wrong',
        text: 'Agree — it’s opposing counsel’s job to find their own cases.',
        why: 'ER 3.3(a)(2) forbids knowingly failing to disclose legal authority in the controlling jurisdiction known to be directly adverse and not disclosed by opposing counsel. The duty of candor to the tribunal overrides tactical silence; violating it invites sanctions and discipline.' },
      { grade: 'wrong',
        text: 'Bury it in a footnote with no analysis so you technically mentioned it.',
        why: 'Cynical technical compliance still flirts with the candor rule. Disclosure under ER 3.3(a)(2) is the floor, and competent advocacy (ER 1.1) means confronting the adverse case and distinguishing it — a buried, unexplained footnote serves neither the court nor the client.' },
    ],
  },
  {
    id: 'ai_brief',
    from: 'Jim Hardsell', role: 'Managing Partner', gold: 25,
    subject: 'File the AI draft tonight',
    body: 'The reply brief is due at midnight. The new AI tool wrote a full draft and the '
      + 'citations look plausible. Nobody has time to pull the cases. File it as-is and '
      + 'we’ll clean it up if the judge asks questions.',
    rule: 'ER 1.1 (Competence), ER 3.3 (Candor) / NRPC 1.1, 3.3',
    choices: [
      { grade: 'correct',
        text: 'Verify every citation against the actual authorities before filing — even if it means asking for a short extension.' },
      { grade: 'very_wrong',
        text: 'File it as-is; the AI is usually right and the deadline controls.',
        why: 'Filing unverified AI output violates the duty of competence (ER 1.1) and risks presenting fabricated authority to the court (ER 3.3, ER 8.4(c)). Courts nationwide have sanctioned lawyers for exactly this. "The deadline controls" is not a defense to citing cases that do not exist.' },
      { grade: 'wrong',
        text: 'Spot-check two or three citations and file if those look fine.',
        why: 'A spot check is not verification. Every authority you sign and submit is your representation to the tribunal. ER 1.1 requires the thoroughness reasonably necessary for the representation — and AI tools hallucinate convincingly in the citations you did not check.' },
    ],
  },
  {
    id: 'former_client',
    from: 'Theo Ramble', role: 'Prospective Client', gold: 35,
    subject: 'Engagement: sue my ex-partner Gina Cortez',
    body: 'I want to hire you to sue my former business partner, Gina Cortez, over the '
      + 'dissolution of our company. You come highly recommended — I hear you did the '
      + 'company’s formation work a few years back, so you already know everything. '
      + 'When can we start?',
    rule: 'ER 1.9 / NRPC 1.9 — Duties to Former Clients',
    choices: [
      { grade: 'correct',
        text: 'Turn down the engagement: the matter is substantially related to work done for the former client, absent her informed written consent.' },
      { grade: 'very_wrong',
        text: 'Accept — Gina isn’t a client anymore, so there’s no conflict.',
        why: 'ER 1.9 bars representing a new client against a former client in the same or a substantially related matter without the former client’s informed consent, confirmed in writing. "You already know everything" is precisely the problem: that knowledge is confidential (ER 1.6/1.9(c)) and would be used against the person who confided it. Expect a disqualification motion and a bar charge.' },
      { grade: 'wrong',
        text: 'Accept, but promise yourself you won’t use anything you learned from the formation work.',
        why: 'A private promise is not a cure. The former-client conflict rule (ER 1.9) is prophylactic — in substantially related matters the law presumes the confidences matter. Only the former client’s informed consent, confirmed in writing, can clear the conflict.' },
    ],
  },
  {
    id: 'no_contact',
    from: 'Priya Malhotra', role: 'Client (CEO, Malhotra Logistics)', gold: 25,
    subject: 'Call their CEO directly',
    body: 'Opposing counsel is stonewalling every settlement overture. I golf with their '
      + 'CEO — he’s reasonable. Skip the lawyers: call him directly tomorrow and make '
      + 'the offer CEO-to-lawyer. He’ll take your call.',
    rule: 'ER 4.2 / NRPC 4.2 — Communication with Represented Persons',
    choices: [
      { grade: 'correct',
        text: 'Decline — you cannot contact a represented party about the matter without their lawyer’s consent. (The clients themselves may talk to each other.)' },
      { grade: 'very_wrong',
        text: 'Make the call — the CEO is free to talk to whoever he wants.',
        why: 'The no-contact rule (ER 4.2) forbids a lawyer from communicating about the matter with a person the lawyer knows is represented, absent that counsel’s consent or a court order. A represented organization’s CEO is squarely covered. The represented person’s own willingness is irrelevant — the rule protects the lawyer-client relationship, and only counsel can waive it.' },
      { grade: 'wrong',
        text: 'Draft the pitch and have your client read it to the CEO word-for-word.',
        why: 'Scripting your client to deliver your legal position skirts ER 8.4(a) — violating a rule "through the acts of another." Clients may genuinely talk to each other, but a lawyer-authored script delivered as dictation is the lawyer communicating, with extra steps.' },
    ],
  },
  {
    id: 'double_billing',
    from: 'Jim Hardsell', role: 'Managing Partner', gold: 25,
    subject: 'Bill it twice — both files benefit',
    body: 'That preemption research you did for the Hendricks matter is equally useful on '
      + 'Marlowe. Bill the full twelve hours to Hendricks AND the same twelve to Marlowe. '
      + 'Both clients got the value, so both can pay for it. That’s just good realization.',
    rule: 'ER 1.5(a) / NRPC 1.5 — Fees; ER 8.4(c) — Dishonesty',
    choices: [
      { grade: 'correct',
        text: 'Refuse — bill only the hours actually worked, allocated fairly between the files.' },
      { grade: 'very_wrong',
        text: 'Bill both files in full as instructed.',
        why: 'Billing twenty-four hours for twelve hours of work is charging a clearly unreasonable fee (ER 1.5(a)) and misrepresenting the bill to both clients (ER 8.4(c) — conduct involving dishonesty, fraud, deceit or misrepresentation). ABA Formal Op. 93-379 addressed exactly this: recycled work may not be double-billed. "The partner told me to" is no defense for a clear violation (ER 5.2(a)).' },
      { grade: 'wrong',
        text: 'Bill both, but knock 25% off each so it feels fairer.',
        why: 'A discounted misrepresentation is still a misrepresentation. The bill tells each client the hours were worked for them. Under ER 1.5 and 8.4(c) you may bill time once — allocate it, don’t multiply it.' },
    ],
  },
  {
    id: 'inadvertent_docs',
    from: 'Priya Malhotra', role: 'Client', gold: 30,
    subject: 'FW: FW: Their whole strategy memo!!',
    body: 'You will NOT believe this. Opposing counsel’s paralegal just emailed me their '
      + 'entire litigation strategy memo — clearly meant for their own client. I’m '
      + 'forwarding it to you. Read every word and let’s take them apart with it.',
    rule: 'ER 4.4(b) / NRPC 4.4(b) — Inadvertently Sent Documents',
    choices: [
      { grade: 'correct',
        text: 'Stop reading, promptly notify the sender, and seek guidance from the court on the document’s status.' },
      { grade: 'very_wrong',
        text: 'Read it all and build your case strategy around it — their mistake, your windfall.',
        why: 'ER 4.4(b) requires a lawyer who knows a document was inadvertently sent to promptly notify the sender. Mining an obviously misdirected, privileged strategy memo invites disqualification and discipline. Privileged material does not lose protection because a paralegal fat-fingered an email.' },
      { grade: 'wrong',
        text: 'Quietly delete it and never mention it to anyone.',
        why: 'Silent deletion skips the mandatory step: ER 4.4(b) requires prompt notice to the sender so they can take protective measures. You also cannot un-ring the bell for your client, who has read it — the situation needs to be surfaced, not buried.' },
    ],
  },
  {
    id: 'witness_vacation',
    from: 'Jim Hardsell', role: 'Managing Partner', gold: 30,
    subject: 'Ochoa deposition problem',
    body: 'Ochoa’s testimony will hurt us. He’s a former employee of the client, still '
      + 'friendly. Suggest to him that this would be a wonderful week to take that fishing '
      + 'trip in Baja — somewhere without cell service — until the discovery cutoff passes.',
    rule: 'ER 3.4(a), (f) / NRPC 3.4 — Fairness to Opposing Party and Counsel',
    choices: [
      { grade: 'correct',
        text: 'Refuse — you cannot ask a witness to make himself unavailable or obstruct access to evidence.' },
      { grade: 'very_wrong',
        text: 'Make the suggestion — a vacation recommendation isn’t a court order violation.',
        why: 'ER 3.4(a) forbids unlawfully obstructing another party’s access to evidence, and 3.4(f) forbids requesting that a non-client refrain from voluntarily giving relevant information (the narrow relative/employee exception does not cover hiding from a subpoena). "Take a trip until the cutoff" is witness-secreting dressed as travel advice — an integrity-of-process violation that draws both sanctions and discipline.' },
      { grade: 'wrong',
        text: 'Don’t suggest it yourself — have the client float the fishing trip idea.',
        why: 'ER 8.4(a) makes it misconduct to violate the rules "through the acts of another." Laundering the obstruction through the client adds a rule violation instead of avoiding one, and drags the client into sanctionable conduct.' },
    ],
  },
  {
    id: 'threat_criminal',
    from: 'Dana Whitfield', role: 'Client', gold: 30,
    subject: 'Turn up the heat',
    body: 'The contractor who botched my warehouse is dodging us. Here’s the play: tell his '
      + 'lawyer that unless he wires the settlement by Friday, we go to the district attorney '
      + 'about his "fraudulent" invoices AND file a bar complaint against his lawyer. '
      + 'They’ll fold in a day.',
    rule: 'ER 3.10 (Arizona-specific) — Threatening Criminal, Administrative or Disciplinary Action',
    choices: [
      { grade: 'correct',
        text: 'Refuse to threaten criminal or disciplinary action to gain leverage in the civil matter; negotiate on the civil merits.' },
      { grade: 'very_wrong',
        text: 'Send the Friday ultimatum exactly as the client wants.',
        why: 'Arizona’s ER 3.10 expressly forbids presenting, participating in presenting, or threatening to present criminal, administrative or disciplinary charges solely to obtain an advantage in a civil matter. This email is a textbook violation — and depending on wording can constitute extortion under criminal law. (Most states reach the same result through Rule 8.4 and 4.4.)' },
      { grade: 'wrong',
        text: 'Soften it: "My client is weighing all civil and criminal remedies available to him."',
        why: 'A veiled threat is still a threat when its purpose is civil leverage. Under ER 3.10 the analysis looks at substance, not phrasing — "weighing criminal remedies" delivered inside a settlement demand is designed to coerce, and keeps you in the rule’s cross-hairs.' },
    ],
  },
  {
    id: 'referral_split',
    from: 'Chuck Dorsey', role: 'Old friend (marketing consultant)', gold: 35,
    subject: 'Easy money for both of us',
    body: 'Buddy! My accident-consulting business meets injured people every day. Send them '
      + 'all to you, and you kick back 30% of every fee you earn from my referrals. '
      + 'Handshake deal, nothing in writing. Everybody wins!',
    rule: 'ER 7.2(b), former ER 5.4 (abrogated in Ariz. 2021 — ABS only) / NRPC 5.4, 7.2',
    choices: [
      { grade: 'correct',
        text: 'Decline the kickback arrangement — paying a percentage of fees for referrals is prohibited outside a court-approved structure.' },
      { grade: 'very_wrong',
        text: 'Shake on it — handshake deals with non-lawyers aren’t covered by the rules.',
        why: 'Paying someone a cut of fees for channeling clients violates the ban on giving anything of value for recommending your services (ER 7.2(b)) and, in most states, the fee-sharing ban of Rule 5.4. Arizona abrogated ER 5.4 in 2021, but non-lawyer fee sharing there is lawful only inside a licensed Alternative Business Structure — not via an undocumented 30% street-referral kickback. The secrecy ("nothing in writing") tells you what kind of deal this is.' },
      { grade: 'wrong',
        text: 'Agree, but cap it at 10% so it’s "reasonable."',
        why: 'The problem is the kickback, not the percentage. A smaller unlawful referral fee is still an unlawful referral fee under ER 7.2(b), and it creates a personal-interest conflict (ER 1.7(a)(2)) in every referred case.' },
    ],
  },
  {
    id: 'client_loan',
    from: 'Rosa Delgado', role: 'Client (personal injury)', gold: 25,
    subject: 'Really hard month',
    body: 'I’m so grateful for everything on my injury case. But I’m short on rent and my '
      + 'car needs brakes before I can even get to work. Could the firm lend me $2,000 '
      + 'against my settlement? You know the case is worth way more than that.',
    rule: 'ER 1.8(e) / NRPC 1.8(e) — Financial Assistance to Clients',
    choices: [
      { grade: 'correct',
        text: 'Decline the personal loan — the firm may advance court costs and litigation expenses, but not living expenses.' },
      { grade: 'wrong',
        text: 'Lend her the $2,000 — it’s compassionate and the case will cover it.',
        why: 'ER 1.8(e) prohibits providing financial assistance to a client in connection with pending or contemplated litigation, other than advancing court costs and litigation expenses. However kind the motive, living-expense loans give the lawyer a personal stake in settlement timing and are among the most commonly disciplined violations. Point her toward legitimate hardship resources instead.' },
      { grade: 'very_wrong',
        text: 'Lend it quietly in cash, off the books, so nobody has to know.',
        why: 'The off-the-books structure converts an ER 1.8(e) violation into ER 1.8(e) plus concealment (ER 8.4(c)). Hiding a prohibited transaction from your own firm and the file is how a rule violation becomes a character-and-fitness problem.' },
    ],
  },
  {
    id: 'sign_for_client',
    from: 'Jim Hardsell', role: 'Managing Partner', gold: 25,
    subject: 'Release needs a signature TODAY',
    body: 'The Vann settlement release must go back signed today or the deal collapses. '
      + 'Mrs. Vann is on a cruise, unreachable until Sunday. She told us last week she was '
      + '"fine with whatever." Just sign her name — she’ll ratify it when she’s back.',
    rule: 'ER 8.4(c), ER 1.2(a) / NRPC 8.4, 1.2 — Dishonesty; Allocation of Authority',
    choices: [
      { grade: 'correct',
        text: 'Refuse to sign her name — tell opposing counsel the client is briefly unreachable and get a short extension.' },
      { grade: 'very_wrong',
        text: 'Sign it — she pre-approved the deal in substance.',
        why: 'Signing a client’s name to a legal instrument without express written authorization is a misrepresentation to the counterparty (ER 8.4(c)) and usurps a decision that belongs to the client — settlement is the client’s call under ER 1.2(a). "She’ll ratify it" assumes the answer to the very question only she can decide.' },
      { grade: 'wrong',
        text: 'Have your assistant sign it "with permission" and notarize it later.',
        why: 'Adding a nonlawyer signer and an after-the-fact notarization compounds the problem: you remain responsible for conduct you direct (ER 5.3, 8.4(a)), and a backdated or false notarization is itself fraudulent.' },
    ],
  },
  {
    id: 'delete_emails',
    from: 'Priya Malhotra', role: 'Client', gold: 30,
    subject: 'Before we hand over documents...',
    body: 'Discovery responses are due next month. There’s a thread from 2024 where my ops '
      + 'manager joked about the safety inspections. It reads TERRIBLY out of context. '
      + 'IT can purge it from the server tonight before anything gets collected. OK to proceed?',
    rule: 'ER 3.4(a) / NRPC 3.4(a) — Destruction of Evidence (Spoliation)',
    choices: [
      { grade: 'correct',
        text: 'Absolutely not — instruct the client to preserve everything, issue a litigation hold, and address bad documents through advocacy.' },
      { grade: 'very_wrong',
        text: 'Tell IT to purge it — it hasn’t been requested by name yet.',
        why: 'ER 3.4(a) forbids unlawfully destroying or concealing material with potential evidentiary value, and counseling or assisting another to do it. Once litigation is pending or reasonably anticipated, deleting responsive documents is spoliation: adverse-inference instructions, sanctions, potential criminal obstruction — and discipline for the lawyer who blessed it.' },
      { grade: 'wrong',
        text: 'Tell the client you "can’t advise them to delete it," with a knowing wink.',
        why: 'A wink is counseling with extra deniability. ER 3.4(a) and 1.2(d) prohibit assisting a client’s unlawful destruction of evidence, and a lawyer who signals the path has assisted it. The client needed a litigation-hold instruction, not a nudge.' },
    ],
  },
  {
    id: 'padding_hours',
    from: 'Jim Hardsell', role: 'Managing Partner', gold: 25,
    subject: 'Your hours look light',
    body: 'Your timesheets are hurting the file’s realization. Everyone knows travel time, '
      + 'thinking in the shower, dreams about the case — it all counts. Round each entry up '
      + 'to the next full hour and resubmit by Friday. This is how the business works, associate.',
    rule: 'ER 5.2 / NRPC 5.2 — Subordinate Lawyers; ER 8.4(c)',
    choices: [
      { grade: 'correct',
        text: 'Decline to pad the entries and keep your timesheets accurate — following orders is no defense to a clear violation.' },
      { grade: 'very_wrong',
        text: 'Round everything up — the partner sets billing policy and takes the responsibility.',
        why: 'ER 5.2(a): a subordinate lawyer is bound by the rules "notwithstanding that the lawyer acted at the direction of another person." The supervisor-direction safe harbor (ER 5.2(b)) covers only reasonable resolutions of arguable questions — and billing time you did not work is not arguable; it is dishonesty under ER 8.4(c). Your license, your violation.' },
      { grade: 'wrong',
        text: 'Split the baby: pad only the entries the client probably won’t scrutinize.',
        why: 'Selective padding is just fraud with a risk filter. Every inflated entry is a misrepresentation under ER 8.4(c) and an unreasonable fee under ER 1.5(a), whether or not the client audits it.' },
    ],
  },
  {
    id: 'fake_reviews',
    from: 'Bex Novak', role: 'Marketing Agency', gold: 25,
    subject: 'Reputation package — 50 five-star reviews',
    body: 'Congrats on the new firm! Our "Trusted Counsel" package: fifty 5-star reviews '
      + 'from aged accounts, each with a short story about the big case you won for them. '
      + 'Totally natural-looking. We can also add "Voted #1 Trial Lawyer" to your site. '
      + 'Ready to launch Monday?',
    rule: 'ER 7.1 / NRPC 7.1 — False or Misleading Communications',
    choices: [
      { grade: 'correct',
        text: 'Refuse — fake client reviews and unverifiable "#1" claims are false and misleading lawyer advertising.' },
      { grade: 'very_wrong',
        text: 'Launch the package — everyone games the reviews.',
        why: 'ER 7.1 prohibits false or misleading communications about the lawyer or the lawyer’s services. Fabricated testimonials describing cases that never happened are false statements of fact, and "Voted #1" with no bona fide survey behind it is unverifiable puffery presented as fact. That the reviews come through a vendor changes nothing — ER 8.4(a) covers violations through the acts of another.' },
      { grade: 'wrong',
        text: 'Skip the fake reviews but keep the "Voted #1 Trial Lawyer" badge.',
        why: 'An award nobody voted on is still a misleading communication under ER 7.1. Comparative and superlative claims need substantiation; invented accolades are just smaller lies.' },
    ],
  },
  {
    id: 'hospital_solicit',
    from: 'Chuck Dorsey', role: 'Old friend (marketing consultant)', gold: 30,
    subject: 'Bus crash — get there first',
    body: 'That charter-bus crash on Route 9 — my cousin’s a nurse on the ward. Fourteen '
      + 'injured, all still admitted, none have lawyers yet. Swing by the hospital tonight '
      + 'with retainer agreements. First firm in the door signs them all!',
    rule: 'ER 7.3 / NRPC 7.3 — Solicitation of Clients',
    choices: [
      { grade: 'correct',
        text: 'Refuse — in-person solicitation of injured strangers for money is prohibited; wait for them to seek counsel.' },
      { grade: 'very_wrong',
        text: 'Go tonight with retainers before another firm does.',
        why: 'ER 7.3 bars in-person solicitation of professional employment for pecuniary gain from people with whom you have no prior relationship — bedside solicitation of accident victims is the paradigm the rule was written for, and using the nurse as a tip line implicates patient privacy on top of it. This is classic "ambulance chasing," and it is disciplinable.' },
      { grade: 'wrong',
        text: 'Don’t go yourself — send the cousin in with your business cards and a script.',
        why: 'A runner with a script is solicitation through an agent, which ER 8.4(a) and 7.3 squarely cover. Many states criminalize capping/running outright. The intermediary adds liability; it doesn’t launder it.' },
    ],
  },
  {
    id: 'confidences_dinner',
    from: 'Mom', role: 'Family', gold: 20,
    subject: 'Is it true about the Delgado settlement??',
    body: 'Sweetheart! Everyone at book club is buzzing that your firm represents Rosa '
      + 'Delgado from church in that big injury case. How much is she getting? Is it the '
      + 'seven figures Brenda says? I promise I won’t tell a soul (except Brenda).',
    rule: 'ER 1.6 / NRPC 1.6 — Confidentiality of Information',
    choices: [
      { grade: 'correct',
        text: 'Politely decline to confirm or discuss anything about any client — even with family.' },
      { grade: 'very_wrong',
        text: 'Share the number — it’s just Mom, and it’ll be public eventually.',
        why: 'ER 1.6 protects all information relating to the representation, and the duty has no family-and-friends exception. "It will be public eventually" is not "public now," and settlement amounts are often confidential by agreement. One book-club leak can breach the settlement, the rule, and the client’s trust simultaneously.' },
      { grade: 'wrong',
        text: 'Don’t give numbers, but confirm the representation and say "she’ll be very happy."',
        why: 'Even confirming the representation can be protected information under ER 1.6, and "she’ll be very happy" telegraphs the outcome. The rule covers information relating to the representation, not just the dollar figure.' },
    ],
  },
  {
    id: 'disputed_funds',
    from: 'Accounting', role: 'Firm Accounting', gold: 35,
    subject: 'Delgado settlement wire received — disbursement?',
    body: 'The $90,000 Delgado settlement hit the trust account. Per the fee agreement our '
      + 'share is $30,000, but Ms. Delgado emailed disputing $8,000 of the costs deducted. '
      + 'Partner says sweep the full $30,000 to operating today and argue about it later. '
      + 'Please confirm disbursement instructions.',
    rule: 'ER 1.15(d), (e) / NRPC 1.15 — Disputed Funds',
    choices: [
      { grade: 'correct',
        text: 'Disburse the client’s undisputed share promptly, take the undisputed fee, and hold the disputed $8,000 in trust until resolved.' },
      { grade: 'very_wrong',
        text: 'Sweep the full $30,000 — the fee agreement controls and she can sue if she disagrees.',
        why: 'ER 1.15(e) requires property in which two or more persons claim interests to be kept separate until the dispute is resolved. Taking disputed funds out of trust is conversion of contested client money — among the fastest routes to disbarment. The agreement doesn’t settle the dispute; it is what the dispute is about.' },
      { grade: 'wrong',
        text: 'Hold everything — freeze the entire $90,000 in trust until she stops complaining.',
        why: 'Over-freezing is also a violation: ER 1.15(d)-(e) requires prompt delivery of the portions the client is undisputedly entitled to. Only the genuinely disputed $8,000 stays in trust; the rest must move promptly.' },
    ],
  },
  {
    id: 'paralegal_hearing',
    from: 'Jim Hardsell', role: 'Managing Partner', gold: 25,
    subject: 'Coverage for Thursday’s status conference',
    body: 'Everyone’s in depositions Thursday. Riley the paralegal has watched a hundred '
      + 'status conferences and knows the Chen file cold. Have Riley appear for us and enter '
      + 'the scheduling stipulations. The judge barely looks up anyway.',
    rule: 'ER 5.5, ER 5.3 / NRPC 5.5, 5.3 — Unauthorized Practice of Law',
    choices: [
      { grade: 'correct',
        text: 'No — a nonlawyer cannot appear and act for a client in court; move the conference or find licensed coverage.' },
      { grade: 'very_wrong',
        text: 'Send Riley — it’s only scheduling, not "real" lawyering.',
        why: 'Appearing in court on a client’s behalf and entering stipulations is the practice of law. Sending a nonlawyer to do it assists unauthorized practice (ER 5.5(a)) and violates your supervisory duties (ER 5.3). Arizona’s Legal Paraprofessional program licenses limited practice for qualifying LPs in defined matters — an unlicensed paralegal at a status conference is not that.' },
      { grade: 'wrong',
        text: 'Have Riley appear but say "the firm" sends its apologies and just hand up a proposed order.',
        why: 'Handing up orders and speaking for the client at the podium is still an appearance. If no lawyer can attend, the compliant options are a continuance, remote appearance, or coverage counsel — not a nonlawyer stand-in with a softer script (ER 5.5, 5.3).' },
    ],
  },
  {
    id: 'report_misconduct',
    from: 'Sam Okafor', role: 'Associate at another firm', gold: 35,
    subject: 'In confidence — what would you do?',
    body: 'Off the record? I found proof a partner at my firm has been "borrowing" from '
      + 'client trust for two years — six figures, doctored ledgers, the works. He says '
      + 'he’ll pay it back and that if I report it he’ll end my career. It’s not my money '
      + 'and not my client. I keep my head down, right?',
    rule: 'ER 8.3(a) / NRPC 8.3 — Reporting Professional Misconduct',
    choices: [
      { grade: 'correct',
        text: 'Advise reporting it to the disciplinary authority — knowing misappropriation of trust funds is squarely reportable, and retaliation threats change nothing.' },
      { grade: 'very_wrong',
        text: 'Agree: keep your head down, it’s the partner’s problem and he says he’ll repay it.',
        why: 'ER 8.3(a) requires a lawyer who knows another lawyer committed a violation raising a substantial question of honesty, trustworthiness or fitness to inform the appropriate professional authority. Two years of six-figure trust theft with doctored ledgers is the core case for mandatory reporting. Staying silent makes the observer disciplinable too — the "snitch rule" has teeth precisely for this scenario.' },
      { grade: 'wrong',
        text: 'Suggest an anonymous note to the firm’s managing partner and nothing more.',
        why: 'Internal escalation can be a first step, but it does not discharge ER 8.3(a), which requires informing the appropriate professional authority — the disciplinary counsel, not just the boss of the person stealing. If the firm quietly buries it, clients stay exposed and the reporting duty stays unmet.' },
    ],
  },
  {
    id: 'decline_fraud',
    from: 'Vic Tremont', role: 'Prospective Client', gold: 35,
    subject: 'Need a creative lawyer ASAP (big retainer)',
    body: 'Heard you’re sharp. My lender is about to audit my company. I need you to '
      + 'paper up some backdated invoices and a consulting agreement — dated last year — '
      + 'so the numbers hold up. Strictly paperwork, nothing to litigate. I pay triple '
      + 'your rate, cash, today.',
    rule: 'ER 1.2(d), ER 1.16(a) / NRPC 1.2(d), 1.16 — Counseling Fraud; Declining Representation',
    choices: [
      { grade: 'correct',
        text: 'Turn down the engagement — a lawyer cannot assist conduct the lawyer knows is fraudulent, at any rate.' },
      { grade: 'very_wrong',
        text: 'Accept — drafting documents is what lawyers do; what the client uses them for is his business.',
        why: 'ER 1.2(d) forbids counseling or assisting a client in conduct the lawyer knows is criminal or fraudulent. Backdated invoices manufactured to deceive a lender are the fraud itself, not neutral "paperwork" — this is bank fraud with a law-license garnish, plus ER 8.4(c) and likely criminal exposure. The triple-rate cash offer is the tell.' },
      { grade: 'wrong',
        text: 'Decline the backdating but offer to "review" the documents after he creates them himself.',
        why: 'Reviewing and polishing documents you know were fabricated still assists the fraud (ER 1.2(d), 8.4(a)). When the proposed engagement is the crime, the only compliant move is a clean refusal — and ER 1.16(a) would mandate withdrawal if you were already in.' },
    ],
  },
];

const CORE_DIFFICULTY = {
  trust_advance: 1,
  double_billing: 1,
  client_loan: 1,
  sign_for_client: 1,
  padding_hours: 1,
  fake_reviews: 1,
  confidences_dinner: 1,
  candor_authority: 2,
  ai_brief: 2,
  former_client: 2,
  no_contact: 2,
  inadvertent_docs: 2,
  witness_vacation: 2,
  hospital_solicit: 2,
  paralegal_hearing: 2,
  delete_emails: 2,
  threat_criminal: 3,
  referral_split: 3,
  disputed_funds: 3,
  report_misconduct: 3,
  decline_fraud: 3,
};

export const SCENARIOS = [
  ...CORE_SCENARIOS.map((scenario) => ({
    ...scenario,
    difficulty: CORE_DIFFICULTY[scenario.id] || 2,
    sourceType: 'lawscape',
  })),
  ...MPRE_SCENARIOS,
];
