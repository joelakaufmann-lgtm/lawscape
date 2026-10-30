import { SCENARIOS } from './ethics.js';
import { CANADA_SCENARIOS } from './canada.js';

// Keep the desk, BarMail and question totals aligned with the actual pool.
// New attorneys start on the LawScape originals; the list order is the menu order.
const ALL = [...SCENARIOS, ...CANADA_SCENARIOS];
export const PRACTICE_PACKS = [
  { id: 'juris', label: 'LawScape original dilemmas', sourceType: 'lawscape', note: 'Fictional office dilemmas with their original mixed Arizona/Nevada rule labels. Where every new attorney starts.' },
  { id: 'mixed', label: 'Mixed practice', sourceType: null, note: 'All six question packs; read the jurisdiction on each email.' },
  { id: 'ca', label: 'California', sourceType: 'california-style', note: 'Original California professional-responsibility questions.' },
  { id: 'ny', label: 'New York', sourceType: 'new-york-style', note: '28 workplace emails and five short New York dilemmas.' },
  { id: 'mpre', label: 'US MPRE-style', sourceType: 'mpre-style', note: 'Model-rule and exam-style study, not a state-specific pack.' },
  { id: 'sqe', label: 'England & Wales SQE-style', sourceType: 'sqe-style', note: 'Original ethics questions for England and Wales. Five correct answers earn the powdered wig.' },
  { id: 'canada', label: 'Canada', sourceType: 'canada-style', review: 'pending', note: '25 questions + 5 emails · Ontario, BC and Saskatchewan · Practitioner review: pending.' },
].map(pack => ({ ...pack, count: ALL.filter(s => !pack.sourceType || s.sourceType === pack.sourceType).length }));

export const practicePack = id => PRACTICE_PACKS.find(pack => pack.id === id) || PRACTICE_PACKS[0];
export const packIdForSourceType = sourceType => PRACTICE_PACKS.find(pack => pack.sourceType && pack.sourceType === sourceType)?.id || null;
