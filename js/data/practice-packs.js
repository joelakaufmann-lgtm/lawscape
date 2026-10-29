import { SCENARIOS } from './ethics.js';
import { CANADA_SCENARIOS } from './canada.js';

// Keep the desk, BarMail and question totals aligned with the actual pool.
export const PRACTICE_PACKS = [
  { id: 'mixed', label: 'Mixed practice', sourceType: null, note: 'All five question packs; read the jurisdiction on each email.' },
  { id: 'ca', label: 'California', sourceType: 'california-style', note: 'Original California professional-responsibility questions.' },
  { id: 'ny', label: 'New York', sourceType: 'new-york-style', note: '28 workplace emails and five short New York dilemmas.' },
  { id: 'mpre', label: 'US MPRE-style', sourceType: 'mpre-style', note: 'Model-rule and exam-style study, not a state-specific pack.' },
  { id: 'sqe', label: 'England & Wales SQE-style', sourceType: 'sqe-style', note: 'Original ethics questions for England and Wales.' },
  { id: 'juris', label: 'LawScape original dilemmas', sourceType: 'lawscape', note: 'Fictional office dilemmas with their original mixed Arizona/Nevada rule labels.' },
  { id: 'canada-test', label: 'Canada · TEST PACK', sourceType: 'canada-test', isTestPack: true, note: '25 questions + 5 emails · Ontario, BC and Saskatchewan · Practitioner review required. No Ethics or gold effects; separate from mixed practice.' },
].map(pack => ({ ...pack, count: pack.isTestPack ? CANADA_SCENARIOS.length : SCENARIOS.filter(s => !pack.sourceType || s.sourceType === pack.sourceType).length }));

export const practicePack = id => PRACTICE_PACKS.find(pack => pack.id === id) || PRACTICE_PACKS[0];
