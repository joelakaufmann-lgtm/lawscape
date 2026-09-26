// Player state + persistence. Single mutable `state` object, saved to localStorage.
//
// Economy: GOLD is earned by answering BarMail ethics scenarios correctly and
// spent on office/apartment upgrades. ETHICS is the health bar — wrong answers
// damage it, two correct answers in a row heal it, and at 0 you are disbarred
// and the save is wiped.

import { freshApprenticeship } from './apprenticeship.js';
import { normalizeAppearance } from './data/appearance.js';

const SAVE_KEY = 'lawscape_save_v2'; // Preserve the legacy origin/key on migration.

function newRunId() {
  return globalThis.crypto?.randomUUID?.() || `run-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export const BASE_MAX_ETHICS = 100;
export const MONEYBAGS_MAX_ETHICS = 50;

export function freshState() {
  return {
    schemaVersion: 5,
    runId: newRunId(),
    runStatus: 'active',
    apprenticeship: freshApprenticeship(),
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
  if (state.moneybagsStolen) return MONEYBAGS_MAX_ETHICS;
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
  if (state.ethics <= 0) state.runStatus = 'ended';
  return state.ethics <= 0;
}

export function save() {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
    return true;
  } catch { return false; /* storage unavailable — play session-only */ }
}

export function hasSave() {
  try { return !!localStorage.getItem(SAVE_KEY); } catch { return false; }
}

export function load() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return false;
    const data = JSON.parse(raw);
    if (!data || typeof data !== 'object' || Array.isArray(data)) return false;
    if (data.schemaVersion > 5) return false;
    replaceState(Object.assign(freshState(), data));
    state.schemaVersion = 5;
    Object.assign(state, normalizeAppearance(state));
    state.sidebar = data.sidebar && typeof data.sidebar === 'object' && !Array.isArray(data.sidebar) ? data.sidebar : { topic: 'commons', drafts: {} };
    if (!state.sidebar.drafts || typeof state.sidebar.drafts !== 'object' || Array.isArray(state.sidebar.drafts)) state.sidebar.drafts = {};
    state.apprenticeship = Object.assign(freshApprenticeship(), data.apprenticeship || {});
    for (const key of ['attempts', 'requests', 'cosmetics', 'equipped']) {
      if (!Array.isArray(state.apprenticeship[key])) state.apprenticeship[key] = [];
    }
    for (const key of ['drafts', 'reviews', 'reviewDrafts']) {
      if (!state.apprenticeship[key] || typeof state.apprenticeship[key] !== 'object' || Array.isArray(state.apprenticeship[key])) state.apprenticeship[key] = {};
    }
    if (!Array.isArray(state.upgrades)) state.upgrades = [];
    state.upgrades = [...new Set(state.upgrades.map((id) => id === 'office_window' ? 'work_phone' : id))];
    if (!Number.isFinite(state.slowUntil) || state.slowUntil < 0) state.slowUntil = 0;
    if (!Array.isArray(state.seen)) state.seen = [];
    state.ethics = Math.min(state.ethics, maxEthics());
    if (state.ethics <= 0) state.runStatus = 'ended';
    return true;
  } catch { return false; }
}

// Full wipe — used by "Reset Save" and by disbarment. You keep nothing.
export function reset() {
  try { localStorage.removeItem(SAVE_KEY); } catch { /* ignore */ }
  replaceState(freshState());
}
