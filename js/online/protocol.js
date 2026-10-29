// Online presence protocol shared by the browser client and the room service.
//
// Everything here is pure data and validation so the same rules run in the
// browser bundle and inside the Cloudflare Worker. Message shapes:
//
// Client → server (JSON text, every message `{ v: 1, t, seq, ... }`):
//   join   { zone, x, y }              enter the firm at a tile
//   zone   { zone, x, y }              change rooms (releases any desk)
//   move   { path: [[x, y], ...] }     walk a validated tile path
//   sit    { desk }                    claim an Associates' Floor desk
//   stand  {}                          release the desk
//   status { kind, pack?, taskId? }    what the player is doing (label composed server-side)
//   look   { appearance, equipped }    wardrobe change
//   resync {}                          ask for a fresh snapshot
//   ping   {}                          answered automatically by the service
//
// Server → client (every broadcast carries a room-monotonic `seq`):
//   snapshot { seq, you: { pid, name }, players: [player...], desks: { deskId: { pid, name, since } } }
//   joined   { seq, p: player }        left   { seq, pid, reason }
//   zone     { seq, pid, zone, x, y }  moved  { seq, pid, path, at }
//   desk     { seq, deskId, pid|null, name|null }
//   status   { seq, pid, label, activity }
//   look     { seq, pid, look }
//   error    { code, detail }          (unicast, no seq)
//   pong     {}
// player = { pid, name, zone, x, y, path, facing, activity, desk, label, look }

import { ZONES } from '../world/zones.js';
import { normalizeAppearance } from '../data/appearance.js';
import { COSMETICS, WRITING_TASKS, CAPSTONE } from '../data/apprenticeship.js';
import { PRACTICE_PACKS } from '../data/practice-packs.js';

export const PROTOCOL_VERSION = 1;
export const SHARED_ZONES = Object.keys(ZONES).filter((id) => id !== 'apartment');
export const STATUS_KINDS = ['idle', 'study', 'review', 'journal', 'library', 'desk', 'lounge'];
export const CLOSE_CODES = { idle: 4001, replaced: 4002, full: 4003, abuse: 4008 };
export const LIMITS = {
  messageBytes: 2048,
  pathSteps: 64,
  messagesPerSecond: 20,
  burst: 40,
  tilesPerSecond: 5,
  labelChars: 40,
  nameChars: 40,
  roomCapacity: 10,
  idleMs: 120_000,
};
export const ERROR_CODES = ['bad_message', 'bad_zone', 'bad_move', 'desk_taken', 'bad_desk', 'full', 'rate', 'not_joined'];

const isInt = (value) => Number.isInteger(value);

export function sanitizeName(value) {
  return String(value ?? '').replace(/[\u0000-\u001f\u007f]/g, '').replace(/\s+/g, ' ').trim().slice(0, LIMITS.nameChars) || 'Attorney';
}

export function clampLabel(value) {
  const text = String(value ?? '').replace(/\s+/g, ' ').trim();
  return text.length > LIMITS.labelChars ? `${text.slice(0, LIMITS.labelChars - 1)}…` : text;
}

// Desk seats on the Associates' Floor, keyed by desk id.
export function deskSeats() {
  return Object.fromEntries(ZONES.associates.props
    .filter((prop) => prop.type === 'opendesk')
    .map((prop) => [prop.deskId, { x: prop.seat.x, y: prop.seat.y, deskX: prop.x, deskY: prop.y }]));
}

function tileInZone(zone, x, y) {
  const def = ZONES[zone];
  return !!def && isInt(x) && isInt(y) && x >= 0 && y >= 0 && x < def.w && y < def.h && def.tile(x, y) !== 'x'
    && !(def.walls && (x === 0 || y === 0));
}

export function validateClientMessage(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return { ok: false, code: 'bad_message' };
  if (raw.v !== PROTOCOL_VERSION || typeof raw.t !== 'string') return { ok: false, code: 'bad_message' };
  const seq = isInt(raw.seq) ? raw.seq : 0;
  switch (raw.t) {
    case 'join':
    case 'zone': {
      if (!SHARED_ZONES.includes(raw.zone)) return { ok: false, code: 'bad_zone' };
      if (!tileInZone(raw.zone, raw.x, raw.y)) return { ok: false, code: 'bad_move' };
      return { ok: true, msg: { t: raw.t, seq, zone: raw.zone, x: raw.x, y: raw.y } };
    }
    case 'move': {
      const path = raw.path;
      if (!Array.isArray(path) || !path.length || path.length > LIMITS.pathSteps) return { ok: false, code: 'bad_move' };
      const steps = [];
      for (const step of path) {
        if (!Array.isArray(step) || step.length !== 2 || !isInt(step[0]) || !isInt(step[1])) return { ok: false, code: 'bad_move' };
        const prev = steps.at(-1);
        if (prev && Math.abs(prev[0] - step[0]) + Math.abs(prev[1] - step[1]) !== 1) return { ok: false, code: 'bad_move' };
        steps.push([step[0], step[1]]);
      }
      return { ok: true, msg: { t: 'move', seq, path: steps } };
    }
    case 'sit': {
      if (typeof raw.desk !== 'string' || !deskSeats()[raw.desk]) return { ok: false, code: 'bad_desk' };
      return { ok: true, msg: { t: 'sit', seq, desk: raw.desk } };
    }
    case 'stand':
    case 'resync':
    case 'ping':
      return { ok: true, msg: { t: raw.t, seq } };
    case 'status': {
      if (!STATUS_KINDS.includes(raw.kind)) return { ok: false, code: 'bad_message' };
      const msg = { t: 'status', seq, kind: raw.kind };
      if (typeof raw.pack === 'string' && PRACTICE_PACKS.some((pack) => pack.id === raw.pack)) msg.pack = raw.pack;
      if (typeof raw.taskId === 'string' && [...WRITING_TASKS, CAPSTONE].some((task) => task.id === raw.taskId)) msg.taskId = raw.taskId;
      return { ok: true, msg };
    }
    case 'look': {
      const equipped = Array.isArray(raw.equipped) ? raw.equipped.filter((id) => COSMETICS.some((item) => item.id === id)).slice(0, COSMETICS.length) : [];
      return { ok: true, msg: { t: 'look', seq, appearance: normalizeAppearance(raw.appearance || {}), equipped } };
    }
    default:
      return { ok: false, code: 'bad_message' };
  }
}

// Human-readable status tag composed from a whitelisted kind plus numbers the
// service trusts (the account's streak and review count), never free text.
export function composeStatusLabel(kind, detail = {}, progress = {}) {
  const streak = isInt(progress.streak) ? progress.streak : 0;
  const reviewed = isInt(progress.documentsReviewed) ? progress.documentsReviewed : 0;
  switch (kind) {
    case 'review': return clampLabel(`Document review · cycle ${reviewed + 1}`);
    case 'study': {
      const pack = PRACTICE_PACKS.find((item) => item.id === detail.pack);
      const name = pack ? pack.label.replace(/ · TEST PACK$/, ' test') : 'ethics';
      return clampLabel(`Studying ${name} · streak x${streak}`);
    }
    case 'journal': {
      const task = [...WRITING_TASKS, CAPSTONE].find((item) => item.id === detail.taskId);
      return clampLabel(task ? `Writing: ${task.title}` : 'In the journal');
    }
    case 'library': return 'At the Rule Library';
    case 'desk': return 'At an open desk';
    case 'lounge': return 'At The Sidebar bar';
    default: {
      const zone = ZONES[detail.zone];
      return clampLabel(zone ? `Exploring ${zone.name.replace(/^Hardsell & Firestone — /, '')}` : 'Exploring the firm');
    }
  }
}

// Client-side: what to tell the room, from what the interface is showing.
// Pure so it can be unit-tested; main.js builds the context object.
export function deriveStatus(ctx = {}) {
  if (ctx.reviewing) return { kind: 'review' };
  if (ctx.mailOpen && ctx.scenarioOpen) return { kind: 'study', pack: ctx.pack };
  if (ctx.journalOpen) return ctx.taskId ? { kind: 'journal', taskId: ctx.taskId } : { kind: 'journal' };
  if (ctx.rulesOpen) return { kind: 'library' };
  if (ctx.seated) return { kind: 'desk' };
  if (ctx.activity === 'sitting' && ctx.zone === 'sidebar') return { kind: 'lounge' };
  return { kind: 'idle' };
}

export function sameStatus(a, b) {
  return !!a && !!b && a.kind === b.kind && (a.pack ?? null) === (b.pack ?? null) && (a.taskId ?? null) === (b.taskId ?? null);
}

// Activity pose other players should render for a status kind.
export function activityForStatus(kind, seated) {
  if (kind === 'review') return 'reviewing';
  if (seated || kind === 'desk' || kind === 'lounge') return 'sitting';
  return null;
}
