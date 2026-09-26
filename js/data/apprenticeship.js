// Original, fictional training records. These are not statements of real law.
// Transparent authored rubrics are intentional for this offline study build.
export const CURRICULUM_VERSION = 'firm-1.0';
export const TRAINING_JURISDICTION = 'State of Juris · fictional firm policy';
export const FIRM_PACKS = [
  { id: 'juris', label: 'State of Juris', status: 'Local practice', note: 'Two synthetic matters. Practice evidence handling and communication under supplied fictional office policies.' },
  { id: 'us-nv', label: 'Nevada', status: 'Needs source review', note: 'Existing reference material; a reviewed firm curriculum is not yet available.' },
  { id: 'gb-ew', label: 'England & Wales', status: 'Needs source review', note: 'Legacy SQE-style study is in BarMail. A reviewed firm curriculum is not yet available.' },
  { id: 'us-ca', label: 'California', status: 'Not yet available', note: 'A reference shelf is not a complete training pack.' },
  { id: 'us-az', label: 'Arizona', status: 'Not yet available', note: 'Source coverage and authored tasks still need review.' },
];

export const DOCUMENT_PACKS = [
  {
    id: 'lantern', title: 'The Lantern File', subtitle: 'A missing approval. A very confident summary.',
    client: 'Lantern Studio', date: '14 September 2026',
    brief: 'Jim wants a launch update before lunch. Find three passages that require follow-up: uncertain release authority, a timing conflict, and an unsupported AI assertion. Do not flag routine background just because it sounds official.',
    documents: [
      { id: 'L1', title: '01 · Matter instruction', date: '10 September', paragraphs: [
        'Lantern Studio retained the fictional Hardsell & Firestone team to organize the record for a proposed exhibition launch. No proceeding has been filed.',
        'The project is called the Lantern Launch. The studio uses a blue lantern on its letterhead.',
      ] },
      { id: 'L2', title: '02 · Release email', date: '11 September', paragraphs: [
        'From Mara Vale, studio coordinator: Please send the prototype drawings to Sol at Kite Fabrication. Our director is traveling. I do not know whether Sol has approval to receive this version.',
        'Mara asks for a reply by noon on 14 September. Her email signature lists the studio reception number.',
      ] },
      { id: 'L3', title: '03 · Signed schedule', date: '9 September', paragraphs: [
        'The signed project schedule records delivery on 20 September. Any change must be confirmed in writing by both project leads under this fictional project arrangement.',
        'The schedule names Mara Vale and Sol Reed as project contacts. A contact listing does not itself authorize release of every document.',
      ] },
      { id: 'L4', title: '04 · Call note', date: '12 September', paragraphs: [
        'Mara reported: Sol thinks the delivery date moved to 18 September. I have not found a written confirmation from both project leads.',
        'The call lasted eight minutes. The note was entered by Liz Loza that afternoon.',
      ] },
      { id: 'L5', title: '05 · AI draft — unchecked', date: '14 September', paragraphs: [
        'The AI draft states: The director approved release to Kite, the parties agreed to 18 September, and the exhibition is guaranteed to open on time. It supplies no supporting record citations.',
        'This is a deliberately flawed, prewritten training draft. No live AI service generated it during play.',
      ] },
      { id: 'L6', title: '06 · Fictional office policy', date: 'Current for this exercise', paragraphs: [
        'Before releasing a prototype, verify the recipient, version and recorded approval with the supervising partner. If approval is unclear, hold the release and identify the missing confirmation.',
        'For this file, distinguish signed dates, reports and unresolved changes. Every factual assertion in the partner update must cite a record passage; a draft summary is not independent evidence.',
      ] },
    ],
    findings: [
      { anchor: 'L2.1', label: 'Uncertain release approval', why: 'Mara expressly does not know whether the recipient is approved. Check the version and authority before release under L6.1.' },
      { anchor: 'L4.1', label: 'Unconfirmed date change', why: 'The call reports 18 September, while L3.1 records 20 September and written confirmation for changes. Preserve both accounts.' },
      { anchor: 'L5.1', label: 'Unsupported AI assertions', why: 'The record does not establish director approval, agreement on 18 September, or a guaranteed opening. Compare L2.1, L3.1 and L4.1.' },
    ],
  },
  {
    id: 'harbor', title: 'The Harbor File', subtitle: 'Two versions. One detail nobody mentioned.',
    client: 'Harbor Workshop', date: '22 September 2026',
    brief: 'Linda needs a reliable status update. Flag three passages that need follow-up: a changed draft obligation, uncertain inspection evidence, and a summary that hides adverse facts.',
    documents: [
      { id: 'H1', title: '01 · Client objective', date: '17 September', paragraphs: [
        'Harbor Workshop wants to purchase six display cabinets from North Pier Makers before a studio open day on 30 September. Its manager asks for a clear list of unresolved decisions.',
        'The client favors practical options over promises. No claim or legal outcome has been assessed.',
      ] },
      { id: 'H2', title: '02 · Draft A', date: '18 September', paragraphs: [
        'Draft A, paragraph 4: The buyer may inspect the cabinets before paying the final installment. This document is marked DRAFT and has no signatures.',
        'Draft A describes six oak display cabinets. Its file name is harbor-draft-a.',
      ] },
      { id: 'H3', title: '03 · Draft B', date: '20 September', paragraphs: [
        'Draft B, paragraph 4: The buyer must pay the final installment before inspecting the cabinets. This document is marked DRAFT and has no signatures.',
        'The cover email asks the buyer to review the change. The record contains no reply accepting Draft B.',
      ] },
      { id: 'H4', title: '04 · Inspection log', date: '21 September', paragraphs: [
        'A workshop log says two cabinets may have damaged hinges. The note does not identify the inspector, and photographs were requested but are not in this file.',
        'The same log says the other four cabinets appeared ready for packing. This is a report, not a warranty.',
      ] },
      { id: 'H5', title: '05 · AI status draft — unchecked', date: '22 September', paragraphs: [
        'The AI draft says: All six cabinets passed inspection and the signed deal preserves inspection before payment. There are no open issues. It cites no document passages.',
        'This summary was authored to contain errors for the exercise. Check it against both drafts and the log.',
      ] },
      { id: 'H6', title: '06 · Fictional office policy', date: 'Current for this exercise', paragraphs: [
        'Identify each document by version and status. Do not describe an unsigned draft as an executed agreement or resolve a disputed factual question by selecting the more favorable account.',
        'Partner updates must include material unfavorable information, the evidence gaps, a named follow-up and a realistic next step. Only the client can select its commercial preference in this exercise.',
      ] },
    ],
    findings: [
      { anchor: 'H3.1', label: 'Payment and inspection order changed', why: 'Compare H2.1 and H3.1: Draft B puts payment first. Neither draft is signed; explain the change and seek instructions.' },
      { anchor: 'H4.1', label: 'Unverified adverse inspection report', why: 'Two possible defects require follow-up. The missing inspector and photographs limit what can be asserted; they do not justify hiding the report.' },
      { anchor: 'H5.1', label: 'AI draft contradicts the file', why: 'H2.1 and H3.1 are unsigned drafts, H3.1 changes the sequence, and H4.1 reports possible defects. The all-clear summary is unsupported.' },
    ],
  },
];

export const WRITING_TASKS = [
  {
    id: 'release', pack: 'lantern', title: 'Before you press send', skill: 'Professional responsibility', partner: 'Linda Firestone',
    prompt: 'Mara wants the drawings sent now. Jim has forwarded her email with “pls handle.” Write Linda a short reply explaining what the file establishes, what is missing, and the next step. Your answer stays inside this fictional firm.',
    sources: ['L2.1', 'L6.1'],
    issues: ['A lunch deadline proves authority to release.', 'Recipient approval and the approved version are uncertain.', 'All outside sharing is permanently forbidden.'], issue: 1,
    actions: ['Hold release; ask the partner to verify recipient, version and approval.', 'Send the newest file and ask permission afterward.', 'Tell Mara the director already approved it.'], action: 0, evidence: 'L2.1',
    reply: 'Speed is lovely. An invented approval is less lovely. L2.1 leaves authority unresolved. Under our fictional policy at L6.1, hold the release and obtain the missing confirmation. In your prose, say who will check it and when you will update Mara.',
  },
  {
    id: 'timeline', pack: 'lantern', title: 'The date that moved itself', skill: 'Evidence handling', partner: 'Jim Hardsell',
    prompt: 'Jim asks: “Is delivery the 18th or the 20th? Please make the ambiguity less ambiguous.” Explain the signed schedule, later report and verification needed without silently choosing a date.',
    sources: ['L3.1', 'L4.1', 'L6.2'],
    issues: ['The signed schedule and later unconfirmed report differ.', 'A later phone call always replaces a signed date.', 'There is no delivery date anywhere in the file.'], issue: 0,
    actions: ['Promise the 18th.', 'Discard the call note.', 'Report both dates; obtain written confirmation from the project leads.'], action: 2, evidence: 'L4.1',
    reply: 'L3.1 records the 20th; L4.1 reports the 18th without the required confirmation. Give me both, with their different status. Ask for the missing written confirmation. “I made it sound certain” is not one of our billing codes.',
  },
  {
    id: 'ai-check', pack: 'lantern', title: 'Confidently incorrect', skill: 'Research and source checking', partner: 'Linda Firestone',
    prompt: 'The unchecked AI draft sounds ready for a client. Identify its unsupported claims and send Linda a restrained replacement summary with evidence references and open questions.',
    sources: ['L5.1', 'L2.1', 'L3.1', 'L4.1'],
    issues: ['A polished draft is a source.', 'The draft only needs a friendlier tone.', 'The draft invents approval, agreement and certainty.'], issue: 2,
    actions: ['Forward it with an AI disclaimer.', 'Replace unsupported claims with record-based statements and unresolved questions.', 'Add a fabricated citation to improve confidence.'], action: 1, evidence: 'L5.1',
    reply: 'Compare each claim in L5.1 to the underlying records. Approval is unclear, the date change is unconfirmed, and no exhibit guarantees the opening. A useful replacement tells us what we know, how we know it, and what we still need. AI confidence does not fill a file gap.',
  },
  {
    id: 'versions', pack: 'harbor', title: 'One sentence, different deal', skill: 'Analysis', partner: 'Linda Firestone',
    prompt: 'Compare paragraph 4 in Draft A and Draft B. Explain the practical change to Linda, label each document’s status, and ask for the client instruction needed before responding.',
    sources: ['H2.1', 'H3.1', 'H3.2', 'H6.1'],
    issues: ['Both versions promise inspection first.', 'Draft B moves payment before inspection; neither version is signed.', 'Draft B is a court order.'], issue: 1,
    actions: ['Describe the change and ask whether the client accepts that commercial sequence.', 'Declare Draft B binding.', 'Tell the client nothing changed.'], action: 0, evidence: 'H3.1',
    reply: 'H2.1 permits inspection before payment; H3.1 reverses the sequence. Explain the practical consequence and obtain instructions. Both are unsigned drafts. Do not smuggle a conclusion about enforceability into a comparison of text.',
  },
  {
    id: 'adverse', pack: 'harbor', title: 'The inconvenient two cabinets', skill: 'Supervision', partner: 'Jim Hardsell',
    prompt: 'Jim wants “the good version” of the inspection news. Write a candid internal update that includes the possible defects, limits of the log and a concrete follow-up.',
    sources: ['H4.1', 'H4.2', 'H6.2'],
    issues: ['The possible defects matter, but the report needs verification.', 'Missing photos prove there are no defects.', 'All six cabinets are certainly defective.'], issue: 0,
    actions: ['Omit the two cabinets.', 'Guarantee an inspection result.', 'Report the uncertainty; identify the inspector and obtain the missing photographs.'], action: 2, evidence: 'H4.1',
    reply: 'Include both sides: four reportedly looked ready, two may have hinge damage. H4.1 does not establish who inspected them or provide photographs. Ask for both. By “good version” I apparently meant “the accurate one.” Please quote me selectively.',
  },
  {
    id: 'client-update', pack: 'harbor', title: 'Useful by five o’clock', skill: 'Written communication', partner: 'Linda Firestone',
    prompt: 'Prepare Linda’s internal draft of a short client update. Correct the unchecked all-clear summary, distinguish the two unsigned versions, disclose the inspection uncertainty and identify a client decision. Do not send it to anyone.',
    sources: ['H5.1', 'H2.1', 'H3.1', 'H4.1', 'H6.2'],
    issues: ['Only spelling needs checking.', 'The client has already accepted Draft B.', 'The all-clear draft conflicts with unsigned versions and an unresolved defect report.'], issue: 2,
    actions: ['Tell the client the deal is signed.', 'Give a source-based update, request inspection evidence and ask about payment sequencing.', 'Delete the adverse facts.'], action: 1, evidence: 'H5.1',
    reply: 'Use H2.1 and H3.1 to explain the versions, H4.1 for the qualified defect report, and H6.2 for the required next steps. Ask the client about payment sequencing. Keep the prose civil and useful. “All clear” is a status we earn, not a font choice.',
  },
];

export const CAPSTONE = {
  id: 'capstone', pack: 'harbor', title: 'The partner’s desk', skill: 'Connected matter', partner: 'Linda Firestone',
  prompt: 'Close your first firm day: write a handoff comparing Lantern and Harbor. For each file, give the material uncertainty, an exact evidence reference, and a next step. Explain what you corrected in the AI drafts. End with the decisions that still need a human. These are separate matters; do not mix their facts.',
  sources: ['L2.1', 'L4.1', 'L5.1', 'H3.1', 'H4.1', 'H5.1', 'H6.2'],
  evidencePrompt: 'Choose the office policy that supports this handoff approach',
  issues: ['Both files are ready for an unconditional all-clear.', 'Both contain unresolved facts and unsupported summaries, but different decisions.', 'An AI summary removes the need to inspect exhibits.'], issue: 1,
  actions: ['Send both flawed summaries.', 'Promise both clients their preferred outcome.', 'Separate the files, cite the record and assign specific verification and client decisions.'], action: 2, evidence: 'H6.2',
  reply: 'Lantern needs release authority (L2.1) and date confirmation (L4.1). Harbor needs instructions about the changed payment sequence (H3.1) and better inspection evidence (H4.1). Both AI drafts overstate the record (L5.1 and H5.1). Under H6.2, your handoff should preserve those distinctions and identify who owns each next action. You have survived a day in which “pls fix” was considered a complete brief.',
};

export const COSMETICS = [
  { id: 'tie-brass', label: 'Partner’s gold tie', price: 30, note: 'A little ambition. Absolutely no grading advantage.', tie: '#cba64b' },
  { id: 'case-oxblood', label: 'Oxblood briefcase', price: 60, note: 'Carries documents and unreasonable expectations.', briefcase: '#713c46' },
];

export function evidenceAt(anchor) {
  const [id, number] = String(anchor).split('.');
  for (const pack of DOCUMENT_PACKS) {
    const doc = pack.documents.find((item) => item.id === id);
    if (doc && doc.paragraphs[Number(number) - 1]) return { pack, doc, text: doc.paragraphs[Number(number) - 1], anchor };
  }
  return null;
}
