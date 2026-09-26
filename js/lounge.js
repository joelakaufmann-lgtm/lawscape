import { WHISKEY_SLOW_MS } from './data/work.js';

export const BAR_DRINKS = [
  { id: 'old-fashioned', name: 'The Reasonable Old Fashioned', cost: 5, note: 'Orange peel, a polished glass, and no pending deadlines.', slows: true },
  { id: 'wine', name: 'House Red · Reserved Judgment', cost: 5, note: 'Served in stemware by a very precise robot.', slows: true },
  { id: 'ale', name: 'After-Hours Ale', cost: 3, note: 'The office is closed. Your walking pace takes a short break.', slows: true },
  { id: 'water', name: 'Sparkling water', cost: 0, note: 'Complimentary. No movement or Ethics effect.', slows: false },
];

export function orderBarDrink(player, id, now = Date.now()) {
  const drink = BAR_DRINKS.find((item) => item.id === id);
  if (!drink || player.zone !== 'sidebar' || player.runStatus === 'ended' || player.ethics <= 0) throw new Error('Drinks are served in The Sidebar during an active run.');
  if (player.apprenticeship.attempts.some((a) => a.status === 'pending')) throw new Error('Wait for your partner reply before making purchases.');
  if (player.gold < drink.cost) throw new Error(`You need ${drink.cost} gold for that drink.`);
  player.gold -= drink.cost;
  player.sidebarDrinks = (player.sidebarDrinks || 0) + 1;
  // Each alcoholic drink refreshes the short effect; it never damages Ethics.
  if (drink.slows) player.slowUntil = Math.max(player.slowUntil || 0, now + WHISKEY_SLOW_MS);
  return { drink, ethicsDamage: 0, slowUntil: player.slowUntil || 0 };
}

export function movementMultiplier(player, now = Date.now()) { return player.slowUntil > now ? 0.5 : 1; }

const BOARD_KEY = 'lawscape_billable_board_v1';
let sessionBoard = [];
let unsavedEntries = [];
function validEntry(entry) {
  return entry && typeof entry.runId === 'string' && typeof entry.name === 'string'
    && Number.isFinite(entry.billableMs) && entry.billableMs >= 0 && Number.isFinite(entry.endedAt);
}
export function readBillableBoard() {
  try {
    const saved = localStorage.getItem(BOARD_KEY);
    const raw = saved === null ? sessionBoard : JSON.parse(saved);
    if (Array.isArray(raw)) sessionBoard = raw.filter(validEntry);
  } catch { /* retain the session copy if storage is unavailable */ }
  const unique = new Map([...sessionBoard,...unsavedEntries].map((entry) => [entry.runId,entry]));
  return [...unique.values()].sort((a,b) => b.billableMs-a.billableMs || a.endedAt-b.endedAt).slice(0,10);
}
export function archiveDisbarredRun(player, now = Date.now()) {
  if (player.ethics > 0 && player.runStatus !== 'ended') return { recorded: false, persisted: false };
  const entries = readBillableBoard();
  if (entries.some((entry) => entry.runId === player.runId)) return { recorded: false, duplicate: true };
  if (!player.runId || !Number.isFinite(player.billableStudyMs) || player.billableStudyMs < 0) return { recorded: false, persisted: false };
  sessionBoard = [...entries, { runId: player.runId, name: String(player.name).slice(0,80), billableMs: Math.floor(player.billableStudyMs), endedAt: now }]
    .sort((a,b) => b.billableMs-a.billableMs || a.endedAt-b.endedAt).slice(0,10);
  try { localStorage.setItem(BOARD_KEY,JSON.stringify(sessionBoard)); unsavedEntries=[]; return { recorded: true, persisted: true }; }
  catch { unsavedEntries=[...sessionBoard]; return { recorded: true, persisted: false }; }
}
