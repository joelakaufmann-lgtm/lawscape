// Player state + persistence. Single mutable `state` object, saved to localStorage.
//
// Economy: GOLD is earned by answering BarMail ethics scenarios correctly and
// spent on office/apartment upgrades. ETHICS is the health bar — wrong answers
// damage it, two correct answers in a row heal it, and at 0 you are disbarred
// and the save is wiped.

const SAVE_KEY = 'lawscape_save_v2';

export const BASE_MAX_ETHICS = 100;

export function freshState() {
  return {
    name: 'Alex Barrister',
    gender: 'nonbinary',   // 'male' | 'female' | 'nonbinary'
    suitColor: '#1f3a5f',
    skin: 0,
    hair: 0,               // hair color index (PAL.hair)
    hairStyle: 0,          // 0 short, 1 long, 2 ponytail, 3 bun, 4 curly, 5 bald
    eye: 0,                // eye color index (PAL.eyes)
    gold: 0,
    ethics: BASE_MAX_ETHICS,
    streak: 0,             // consecutive correct answers
    wrongStreak: 0,        // consecutive wrong answers
    casesDone: 0,          // total scenarios answered
    correctDone: 0,        // total answered correctly
    documentsReviewed: 0,  // completed one-minute document-review cycles
    tipsPurchased: 0,      // ethics tips purchased from Linda Firestone
    hintsPurchased: 0,     // 100-gold relevant-rule research from Riley
    seen: [],              // scenario ids already served this cycle
    practicePack: 'mixed', // 'mixed' | 'sqe' | 'mpre' | 'juris'
    upgrades: [],
    zone: 'office',
    pos: { x: 6, y: 10 },
    lastRestAt: 0,
    whiskeyDrinks: 0,      // first drink teaches impairment; a second prompts help
  };
}

// Keep one stable object reference so both the ES-module source and the
// generated, file://-friendly browser bundle observe loaded/reset state.
export const state = freshState();

function replaceState(next) {
  for (const key of Object.keys(state)) delete state[key];
  Object.assign(state, next);
}

export function hasUpgrade(id) {
  return state.upgrades.includes(id);
}

export function maxEthics() {
  return BASE_MAX_ETHICS
    + (hasUpgrade('mattress') ? 20 : 0)
    + (hasUpgrade('kitchen') ? 10 : 0)
    + (hasUpgrade('liz_chair') ? 10 : 0);
}

export function healEthics(n) {
  state.ethics = Math.min(maxEthics(), state.ethics + n);
}

// Returns true if the player just got disbarred.
export function damageEthics(n) {
  state.ethics = Math.max(0, state.ethics - n);
  return state.ethics <= 0;
}

export function save() {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
  } catch { /* storage unavailable (private mode) — play session-only */ }
}

export function hasSave() {
  try { return !!localStorage.getItem(SAVE_KEY); } catch { return false; }
}

export function load() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return false;
    const data = JSON.parse(raw);
    replaceState(Object.assign(freshState(), data));
    return true;
  } catch { return false; }
}

// Full wipe — used by "Reset Save" and by disbarment. You keep nothing.
export function reset() {
  try { localStorage.removeItem(SAVE_KEY); } catch { /* ignore */ }
  replaceState(freshState());
}
