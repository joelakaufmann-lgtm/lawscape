// Player state + persistence. Single mutable `state` object, saved to localStorage.
//
// Economy: GOLD is earned by answering BarMail ethics scenarios correctly and
// spent on office/apartment upgrades. ETHICS is the health bar — wrong answers
// damage it, two correct answers in a row heal it, and at 0 you are disbarred
// and the save is wiped.

import { freshApprenticeship } from './apprenticeship.js';
import { normalizeAppearance } from './data/appearance.js';
import { freshCanadaProgress, normalizeCanadaProgress } from './canada.js';
import { petKind, sanitizePetName } from './data/pets.js';

const SAVE_KEY = 'lawscape_save_v2'; // Preserve the legacy origin/key on migration.
// 7: arcade credits, drunk-at-work ledger, espresso cooldown, pet, per-pack
//    correct counts, Canada promoted from 'canada-test' to 'canada'.
export const SCHEMA_VERSION = 7;
// 'local' writes the character to localStorage; 'server' means an online
// account owns the character and save() must never write it to this browser.
let persistence = 'local';
export function setPersistence(mode) { persistence = mode === 'server' ? 'server' : 'local'; }
export function persistenceMode() { return persistence; }

function newRunId() {
  // Workers forbid random values during module evaluation, where the singleton
  // below is first built; handlers always replace that placeholder run.
  try { return globalThis.crypto?.randomUUID?.() || `run-${Date.now()}-${Math.random().toString(36).slice(2)}`; }
  catch { return 'run-pending'; }
}

export const BASE_MAX_ETHICS = 100;
export const MISSED_LIMIT = 300; // study-list entries kept per character
export const MONEYBAGS_MAX_ETHICS = 50;

export function freshState() {
  return {
    schemaVersion: SCHEMA_VERSION,
    runId: newRunId(),
    runStatus: 'active',
    apprenticeship: freshApprenticeship(),
    canada: freshCanadaProgress(),
    silhouette: 'tailored',
    glasses: false,
    facialHair: 0,
    faceShape: 0,
    outfit: 'trousers',
    tieColor: '#6e2436',
    shirtColor: '#f3eee1',
    sidebar: { topic: 'commons', drafts: {} },
    sidebarDrinks: 0,
    slowUntil: 0,
    name: 'Alex Barrister',
    gender: 'nonbinary',   // 'male' | 'female' | 'nonbinary'
    suitColor: '#1f3a5f',
    skin: 0,
    hair: 0,               // hair color index (PAL.hair)
    hairStyle: 0,          // stable style index; see data/appearance.js
    eye: 0,                // eye color index (PAL.eyes)
    gold: 0,
    ethics: BASE_MAX_ETHICS,
    streak: 0,             // consecutive correct answers
    wrongStreak: 0,        // consecutive wrong answers
    casesDone: 0,          // total scenarios answered
    correctDone: 0,        // total answered correctly
    documentsReviewed: 0,  // completed one-minute document-review cycles
    billableStudyMs: 0,    // visible time spent reading/answering BarMail
    tipsPurchased: 0,      // ethics tips purchased from Linda Firestone
    hintsPurchased: 0,     // 100-gold relevant-rule research from Riley
    hrEmailsSent: 0,       // emails to HR (bug reports / working-conditions complaints)
    moneybagsStolen: false,    // client gold taken from Jim Hardsell's safe
    moneybagsPurchases: 0,     // upgrade purchases made after taking the gold
    seen: [],              // scenario ids already served this cycle
    practicePack: 'juris', // 'juris' | 'mixed' | 'sqe' | 'mpre' | 'ca' | 'ny' | 'canada'; new attorneys start on the originals
    packCorrect: {},       // correct answers per practice pack id, e.g. { sqe: 5 } (wardrobe unlocks)
    arcadeCredits: 0,      // Briefcase Dash rounds already paid for
    drunkPenaltyFor: 0,    // slowUntil value of the drinking episode already charged at work
    lastEspressoAt: 0,     // epoch ms of the last office espresso (cooldown)
    lastSnackAt: 0,        // epoch ms of the last office fridge snack (cooldown)
    missed: [],            // wrong answers to review: [{ id, choiceIndex, at }], newest last
    pet: null,             // null | { kind: 'cat' | 'dog', name, adoptedAt }
    upgrades: [],
    zone: 'office',
    pos: { x: 6, y: 10 },
    lastRestAt: 0,
    whiskeyDrinks: 0,      // first drink teaches impairment; a second prompts help
    docReviewStartedAt: 0, // epoch ms when the current document-review session began (0 = not reviewing)
    lastDocReviewAt: 0,    // epoch ms of the last paid review cycle (keeps the cadence across saves)
    lastStudyTickAt: 0,    // epoch ms of the last credited billable-study tick (server clamps credit)
    hintScenarioId: null,  // scenario whose rule Riley has already researched this attempt
    endedAt: 0,            // epoch ms when the run ended (0 while active)
  };
}

// Keep one stable object reference so both the ES-module source and the
// generated, file://-friendly browser bundle observe loaded/reset state.
export const state = freshState();

// Replace the singleton's contents in place. `preserve` keeps client-only
// fields (such as the live tile position) when a server document arrives.
export function replaceState(next, { preserve = [] } = {}) {
  const kept = Object.fromEntries(preserve.filter((key) => key in state).map((key) => [key, state[key]]));
  for (const key of Object.keys(state)) delete state[key];
  Object.assign(state, next, kept);
}

// Player-parameterised rule helpers. Rule modules must use these (never the
// singleton) so the same code can run inside a server account object.
export function playerHasUpgrade(player, id) {
  return player.upgrades.includes(id);
}

export function playerMaxEthics(player) {
  if (player.moneybagsStolen) return MONEYBAGS_MAX_ETHICS;
  return BASE_MAX_ETHICS
    + (playerHasUpgrade(player, 'mattress') ? 20 : 0)
    + (playerHasUpgrade(player, 'kitchen') ? 10 : 0)
    + (playerHasUpgrade(player, 'liz_chair') ? 10 : 0);
}

export function healPlayer(player, n) {
  player.ethics = Math.min(playerMaxEthics(player), player.ethics + n);
}

// Returns true if the player just got disbarred.
export function damagePlayer(player, n) {
  player.ethics = Math.max(0, player.ethics - n);
  if (player.ethics <= 0) player.runStatus = 'ended';
  return player.ethics <= 0;
}

export function hasUpgrade(id) { return playerHasUpgrade(state, id); }
export function maxEthics() { return playerMaxEthics(state); }
export function healEthics(n) { healPlayer(state, n); }
export function damageEthics(n) { return damagePlayer(state, n); }

export function save() {
  if (persistence === 'server') return true; // the account service owns this character
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
    return true;
  } catch { return false; /* storage unavailable — play session-only */ }
}

export function hasSave() {
  try { return !!localStorage.getItem(SAVE_KEY); } catch { return false; }
}

// Normalise a saved or server-held character document into a complete state
// object. Returns null when the document is unusable or from a newer schema.
export function normalizeSave(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return null;
  if (data.schemaVersion > SCHEMA_VERSION) return null;
  const next = Object.assign(freshState(), data);
  next.schemaVersion = SCHEMA_VERSION;
  next.canada = normalizeCanadaProgress(data.canada);
  Object.assign(next, normalizeAppearance(next));
  next.sidebar = data.sidebar && typeof data.sidebar === 'object' && !Array.isArray(data.sidebar) ? data.sidebar : { topic: 'commons', drafts: {} };
  if (!next.sidebar.drafts || typeof next.sidebar.drafts !== 'object' || Array.isArray(next.sidebar.drafts)) next.sidebar.drafts = {};
  next.apprenticeship = Object.assign(freshApprenticeship(), data.apprenticeship || {});
  for (const key of ['attempts', 'requests', 'cosmetics', 'equipped']) {
    if (!Array.isArray(next.apprenticeship[key])) next.apprenticeship[key] = [];
  }
  for (const key of ['drafts', 'reviews', 'reviewDrafts']) {
    if (!next.apprenticeship[key] || typeof next.apprenticeship[key] !== 'object' || Array.isArray(next.apprenticeship[key])) next.apprenticeship[key] = {};
  }
  if (!Array.isArray(next.upgrades)) next.upgrades = [];
  const renamed = { office_window: 'work_phone', artwork: 'snack_fridge' }; // pre-0.7.0 and pre-0.9.0 ids
  next.upgrades = [...new Set(next.upgrades.map((id) => renamed[id] || id))];
  for (const key of ['slowUntil', 'docReviewStartedAt', 'lastDocReviewAt', 'lastStudyTickAt', 'endedAt', 'lastRestAt', 'billableStudyMs', 'arcadeCredits', 'drunkPenaltyFor', 'lastEspressoAt', 'lastSnackAt']) {
    if (!Number.isFinite(next[key]) || next[key] < 0) next[key] = 0;
  }
  if (!next.packCorrect || typeof next.packCorrect !== 'object' || Array.isArray(next.packCorrect)) next.packCorrect = {};
  next.pet = next.pet && typeof next.pet === 'object' && petKind(next.pet.kind)
    ? { kind: next.pet.kind, name: sanitizePetName(next.pet.name), adoptedAt: Number.isFinite(next.pet.adoptedAt) ? next.pet.adoptedAt : 0 }
    : null;
  if (next.practicePack === 'canada-test') next.practicePack = 'canada';
  if (typeof next.hintScenarioId !== 'string') next.hintScenarioId = null;
  if (!Array.isArray(next.seen)) next.seen = [];
  next.missed = Array.isArray(next.missed)
    ? next.missed.filter((m) => m && typeof m === 'object' && typeof m.id === 'string' && Number.isInteger(m.choiceIndex)).map((m) => ({ id: m.id, choiceIndex: m.choiceIndex, at: Number.isFinite(m.at) ? m.at : 0 })).slice(-MISSED_LIMIT)
    : [];
  if (!next.pos || !Number.isFinite(next.pos.x) || !Number.isFinite(next.pos.y)) next.pos = { x: 6, y: 10 };
  next.ethics = Math.min(next.ethics, playerMaxEthics(next));
  if (next.ethics <= 0) next.runStatus = 'ended';
  return next;
}

export function load() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return false;
    const next = normalizeSave(JSON.parse(raw));
    if (!next) return false;
    replaceState(next);
    return true;
  } catch { return false; }
}

// Identity only: an online account may be seeded from a local character's
// name, gender and appearance. Gold, Ethics and history never leave the browser.
export function readLocalSeed() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!data || typeof data !== 'object' || Array.isArray(data)) return null;
    const fresh = freshState();
    return {
      name: typeof data.name === 'string' && data.name.trim() ? data.name.trim().slice(0, 80) : fresh.name,
      gender: ['male', 'female', 'nonbinary'].includes(data.gender) ? data.gender : fresh.gender,
      ...normalizeAppearance(data),
    };
  } catch { return null; }
}

// Full wipe — used by "Reset Save" and by disbarment. You keep nothing.
export function reset() {
  try { localStorage.removeItem(SAVE_KEY); } catch { /* ignore */ }
  replaceState(freshState());
}
