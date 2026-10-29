// Pure room logic for the shared firm floor. No Workers APIs here: every
// handler takes the room, a connection id and the clock, mutates the room and
// returns effect lists that the Durable Object adapter maps onto sockets:
//
//   { unicast: [{ cid, msg }], broadcast: [{ msg, except?: cid }], close: [{ cid, code, reason }] }
//
// Connections are keyed by `cid` (one per socket) and carry a `pid` (one per
// player, derived from the e-mail hash). A player who reconnects gets a new
// cid and the old socket is closed with 4002.

import {
  PROTOCOL_VERSION, LIMITS, CLOSE_CODES, validateClientMessage, composeStatusLabel, activityForStatus,
  deskSeats, sanitizeName,
} from '../js/online/protocol.js';
import { validatePath, plausiblePositions, expectedPosition, near } from './movement.mjs';

const V = PROTOCOL_VERSION;
const SIT_RANGE = 2;
const VIOLATION_WINDOW_MS = 60_000;
const VIOLATIONS_BEFORE_CLOSE = 3;

export function createRoom({ seq = 0 } = {}) {
  return { seq, conns: new Map() };
}

function effects() { return { unicast: [], broadcast: [], close: [] }; }

function merge(into, more) {
  into.unicast.push(...more.unicast);
  into.broadcast.push(...more.broadcast);
  into.close.push(...more.close);
  return into;
}

function nextSeq(room) { room.seq += 1; return room.seq; }

function broadcast(room, fx, msg, except) {
  const entry = { msg: { v: V, ...msg, seq: nextSeq(room) } };
  if (except) entry.except = except;
  fx.broadcast.push(entry);
}

function unicast(fx, cid, msg) { fx.unicast.push({ cid, msg: { v: V, ...msg } }); }
function error(fx, cid, code, detail) { unicast(fx, cid, { t: 'error', code, detail: detail ?? code }); }

function progressOf(conn) { return { streak: conn.streak, documentsReviewed: conn.documentsReviewed }; }

function labelFor(conn) {
  const status = conn.status || { kind: 'idle' };
  return composeStatusLabel(status.kind, { pack: status.pack, taskId: status.taskId, zone: conn.zone }, progressOf(conn));
}

export function playerView(conn, now = Date.now()) {
  const arrived = conn.path.length === 0 || (() => { const e = expectedPosition(conn, now); return e.x === conn.x && e.y === conn.y; })();
  return {
    pid: conn.pid, name: conn.name, zone: conn.zone, x: conn.x, y: conn.y,
    path: arrived ? [] : conn.path.map(([x, y]) => [x, y]),
    facing: conn.facing, activity: conn.activity, desk: conn.desk, label: conn.label, look: conn.look,
  };
}

export function desksOf(room) {
  const desks = {};
  for (const conn of room.conns.values()) {
    if (conn.desk) desks[conn.desk] = { pid: conn.pid, name: conn.name, since: conn.deskSince };
  }
  return desks;
}

export function snapshotFor(room, cid, now = Date.now()) {
  const me = room.conns.get(cid);
  return {
    v: V, t: 'snapshot', seq: room.seq,
    you: { pid: me?.pid ?? null, name: me?.name ?? 'Attorney' },
    players: [...room.conns.values()].filter((conn) => conn.joined).map((conn) => playerView(conn, now)),
    desks: desksOf(room),
  };
}

export function createConnection({ cid, pid, name, look = null, streak = 0, documentsReviewed = 0 }, now) {
  return {
    cid, pid, name: sanitizeName(name),
    streak: Number.isInteger(streak) ? streak : 0,
    documentsReviewed: Number.isInteger(documentsReviewed) ? documentsReviewed : 0,
    joined: false, zone: null, x: 0, y: 0, path: [], pathFrom: null, pathAt: now, facing: 1,
    activity: null, desk: null, deskSince: 0, status: { kind: 'idle' }, label: '', look,
    lastAt: now, bucket: { tokens: LIMITS.burst, at: now }, violations: [],
  };
}

// A new socket for `pid`. Replaces any socket the same player already holds,
// refuses an eleventh distinct player, otherwise seats the connection and
// sends it a snapshot.
export function onConnect(room, info, now) {
  const fx = effects();
  const replaced = [...room.conns.values()].filter((conn) => conn.pid === info.pid);
  for (const old of replaced) {
    const left = onLeave(room, old.cid, 'replaced', now);
    // The new socket's snapshot already reflects the release; do not tell it about itself.
    for (const entry of left.broadcast) entry.except = info.cid;
    merge(fx, left);
    fx.close.push({ cid: old.cid, code: CLOSE_CODES.replaced, reason: 'replaced' });
  }
  const players = new Set([...room.conns.values()].map((conn) => conn.pid));
  if (players.size >= LIMITS.roomCapacity) {
    fx.close.push({ cid: info.cid, code: CLOSE_CODES.full, reason: 'full' });
    return fx;
  }
  const conn = createConnection(info, now);
  room.conns.set(conn.cid, conn);
  fx.unicast.push({ cid: conn.cid, msg: snapshotFor(room, conn.cid, now) });
  return fx;
}

function releaseDesk(room, fx, conn) {
  if (!conn.desk) return;
  const deskId = conn.desk;
  conn.desk = null;
  conn.deskSince = 0;
  if (conn.activity === 'sitting') conn.activity = null;
  broadcast(room, fx, { t: 'desk', deskId, pid: null, name: null });
}

export function onLeave(room, cid, reason = 'left', now = Date.now()) {
  const fx = effects();
  const conn = room.conns.get(cid);
  if (!conn) return fx;
  releaseDesk(room, fx, conn);
  room.conns.delete(cid);
  if (conn.joined) broadcast(room, fx, { t: 'left', pid: conn.pid, reason });
  void now;
  return fx;
}

function takeToken(conn, now) {
  const bucket = conn.bucket;
  const elapsed = Math.max(0, now - bucket.at) / 1000;
  bucket.tokens = Math.min(LIMITS.burst, bucket.tokens + elapsed * LIMITS.messagesPerSecond);
  bucket.at = now;
  if (bucket.tokens < 1) return false;
  bucket.tokens -= 1;
  return true;
}

function byteLength(text) {
  return typeof TextEncoder === 'function' ? new TextEncoder().encode(text).length : Buffer.byteLength(text);
}

export function onMessage(room, cid, raw, now) {
  const fx = effects();
  const conn = room.conns.get(cid);
  if (!conn) return fx;
  conn.lastAt = now;

  if (typeof raw !== 'string' && !(raw && typeof raw === 'object')) { error(fx, cid, 'bad_message', 'text frames only'); return fx; }
  if (typeof raw === 'string' && byteLength(raw) > LIMITS.messageBytes) { error(fx, cid, 'bad_message', 'message too large'); return fx; }

  if (!takeToken(conn, now)) {
    conn.violations = conn.violations.filter((at) => now - at < VIOLATION_WINDOW_MS);
    conn.violations.push(now);
    if (conn.violations.length >= VIOLATIONS_BEFORE_CLOSE) {
      merge(fx, onLeave(room, cid, 'abuse', now));
      fx.close.push({ cid, code: CLOSE_CODES.abuse, reason: 'rate limit' });
    } else {
      error(fx, cid, 'rate', 'slow down');
    }
    return fx;
  }

  let parsed = raw;
  if (typeof raw === 'string') {
    try { parsed = JSON.parse(raw); } catch { error(fx, cid, 'bad_message', 'invalid JSON'); return fx; }
  }
  const checked = validateClientMessage(parsed);
  if (!checked.ok) { error(fx, cid, checked.code, `rejected ${typeof parsed?.t === 'string' ? parsed.t : 'message'}`); return fx; }
  const msg = checked.msg;

  switch (msg.t) {
    case 'ping': unicast(fx, cid, { t: 'pong' }); return fx;
    case 'resync': fx.unicast.push({ cid, msg: snapshotFor(room, cid, now) }); return fx;
    case 'join': return conn.joined ? changeZone(room, fx, conn, msg, now) : join(room, fx, conn, msg, now);
    case 'zone': return conn.joined ? changeZone(room, fx, conn, msg, now) : notJoined(fx, cid);
    case 'move': return conn.joined ? move(room, fx, conn, msg, now) : notJoined(fx, cid);
    case 'sit': return conn.joined ? sit(room, fx, conn, msg, now) : notJoined(fx, cid);
    case 'stand': return conn.joined ? stand(room, fx, conn) : notJoined(fx, cid);
    case 'status': return setStatus(room, fx, conn, msg);
    case 'look': return setLook(room, fx, conn, msg);
    default: error(fx, cid, 'bad_message'); return fx;
  }
}

function notJoined(fx, cid) { error(fx, cid, 'not_joined', 'send join first'); return fx; }

function place(conn, zone, x, y, now) {
  conn.zone = zone; conn.x = x; conn.y = y;
  conn.path = []; conn.pathFrom = null; conn.pathAt = now;
}

function join(room, fx, conn, msg, now) {
  place(conn, msg.zone, msg.x, msg.y, now);
  conn.joined = true; conn.facing = 1; conn.activity = null; conn.desk = null;
  conn.status = { kind: 'idle' };
  conn.label = labelFor(conn);
  broadcast(room, fx, { t: 'joined', p: playerView(conn, now) }, conn.cid);
  return fx;
}

function changeZone(room, fx, conn, msg, now) {
  releaseDesk(room, fx, conn);
  place(conn, msg.zone, msg.x, msg.y, now);
  broadcast(room, fx, { t: 'zone', pid: conn.pid, zone: conn.zone, x: conn.x, y: conn.y });
  refreshLabel(room, fx, conn);
  return fx;
}

// Idle labels name the room, so a zone change (or trusted progress update)
// may change the label without any status message from the client.
function refreshLabel(room, fx, conn) {
  const label = labelFor(conn);
  if (label === conn.label) return;
  conn.label = label;
  if (conn.joined) broadcast(room, fx, { t: 'status', pid: conn.pid, label: conn.label, activity: conn.activity });
}

function move(room, fx, conn, msg, now) {
  const checked = validatePath(conn.zone, plausiblePositions(conn, now), msg.path);
  if (!checked.ok) { error(fx, conn.cid, checked.code, checked.detail); return fx; }
  const from = expectedPosition(conn, now);
  conn.pathFrom = [from.x, from.y];
  conn.path = msg.path.map(([x, y]) => [x, y]);
  conn.pathAt = now;
  const last = conn.path.at(-1);
  conn.x = last[0]; conn.y = last[1];
  const first = conn.path[0];
  const sdx = (first[0] - from.x) - (first[1] - from.y);
  if (sdx !== 0) conn.facing = sdx > 0 ? 1 : -1;
  if (conn.desk) releaseDesk(room, fx, conn);
  if (conn.activity === 'sitting') conn.activity = null;
  broadcast(room, fx, { t: 'moved', pid: conn.pid, path: conn.path, at: now }, conn.cid);
  return fx;
}

function sit(room, fx, conn, msg, now) {
  const seat = deskSeats()[msg.desk];
  if (conn.zone !== 'associates' || !seat) { error(fx, conn.cid, 'bad_desk', 'not on the Associates’ Floor'); return fx; }
  const holder = [...room.conns.values()].find((other) => other.desk === msg.desk);
  if (holder && holder.cid !== conn.cid) { error(fx, conn.cid, 'desk_taken', `desk ${msg.desk} is taken`); return fx; }
  if (!near(expectedPosition(conn, now), seat, SIT_RANGE)) { error(fx, conn.cid, 'bad_desk', 'too far from the desk'); return fx; }
  if (conn.desk && conn.desk !== msg.desk) releaseDesk(room, fx, conn);
  conn.desk = msg.desk;
  conn.deskSince = now;
  conn.x = seat.x; conn.y = seat.y; conn.path = []; conn.pathFrom = null; conn.pathAt = now;
  conn.activity = 'sitting';
  broadcast(room, fx, { t: 'desk', deskId: msg.desk, pid: conn.pid, name: conn.name });
  return fx;
}

function stand(room, fx, conn) {
  releaseDesk(room, fx, conn);
  conn.activity = null;
  return fx;
}

function setStatus(room, fx, conn, msg) {
  conn.status = { kind: msg.kind, pack: msg.pack, taskId: msg.taskId };
  conn.label = labelFor(conn);
  conn.activity = activityForStatus(msg.kind, !!conn.desk);
  if (conn.joined) broadcast(room, fx, { t: 'status', pid: conn.pid, label: conn.label, activity: conn.activity });
  return fx;
}

function setLook(room, fx, conn, msg) {
  conn.look = { ...msg.appearance, equipped: msg.equipped };
  if (conn.joined) broadcast(room, fx, { t: 'look', pid: conn.pid, look: conn.look });
  return fx;
}

// Trusted numbers from the account service (never from the client).
export function onProgress(room, pid, { name, streak, documentsReviewed } = {}) {
  const fx = effects();
  for (const conn of room.conns.values()) {
    if (conn.pid !== pid) continue;
    if (typeof name === 'string') conn.name = sanitizeName(name);
    if (Number.isInteger(streak)) conn.streak = streak;
    if (Number.isInteger(documentsReviewed)) conn.documentsReviewed = documentsReviewed;
    refreshLabel(room, fx, conn);
    if (conn.desk) broadcast(room, fx, { t: 'desk', deskId: conn.desk, pid: conn.pid, name: conn.name });
  }
  return fx;
}

// Close everyone who has been silent longer than the idle limit. `lastSeen`
// lets the adapter fold in the runtime's auto-response (ping) timestamps.
export function sweepIdle(room, now, lastSeen = (conn) => conn.lastAt) {
  const fx = effects();
  for (const conn of [...room.conns.values()]) {
    if (now - lastSeen(conn) <= LIMITS.idleMs) continue;
    merge(fx, onLeave(room, conn.cid, 'idle', now));
    fx.close.push({ cid: conn.cid, code: CLOSE_CODES.idle, reason: 'idle' });
  }
  return fx;
}
