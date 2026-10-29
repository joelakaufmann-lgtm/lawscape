import test from 'node:test';
import assert from 'node:assert/strict';
import { createRoom, onConnect, onMessage, onLeave, onProgress, sweepIdle, snapshotFor, createConnection } from '../server/room-logic.mjs';
import { walkable, expectedPosition, validatePath } from '../server/movement.mjs';
import { LIMITS, CLOSE_CODES, composeStatusLabel, deskSeats } from '../js/online/protocol.js';

const T0 = 1_000_000;
const msg = (t, extra = {}) => JSON.stringify({ v: 1, t, seq: 1, ...extra });
const types = (list) => list.map((entry) => entry.msg.t);

function connect(room, n, now = T0, extra = {}) {
  const cid = `c${n}`;
  const fx = onConnect(room, { cid, pid: `p${n}`, name: `Player ${n}`, ...extra }, now);
  return { cid, fx };
}

function joined(room, n, zone = 'associates', x = 9, y = 11, now = T0) {
  const { cid } = connect(room, n, now);
  const fx = onMessage(room, cid, msg('join', { zone, x, y }), now);
  return { cid, fx };
}

test('connect sends a snapshot carrying the room seq and the joined roster', () => {
  const room = createRoom();
  const a = joined(room, 1);
  const b = connect(room, 2);
  assert.equal(b.fx.unicast.length, 1);
  const snap = b.fx.unicast[0].msg;
  assert.equal(snap.t, 'snapshot');
  assert.equal(snap.seq, room.seq);
  assert.deepEqual(snap.you, { pid: 'p2', name: 'Player 2' });
  assert.equal(snap.players.length, 1);
  assert.equal(snap.players[0].pid, 'p1');
  assert.equal(snap.players[0].label, composeStatusLabel('idle', { zone: 'associates' }, {}));
  assert.deepEqual(snap.desks, {});
  assert.equal(a.fx.broadcast.length, 1, 'the first join is broadcast to nobody but still counted');
  assert.equal(a.fx.broadcast[0].msg.t, 'joined');
  assert.equal(a.fx.broadcast[0].except, 'c1');
});

test('join requires a shared zone and a walkable tile; a second join acts like zone', () => {
  const room = createRoom();
  const { cid } = connect(room, 1);
  let fx = onMessage(room, cid, msg('join', { zone: 'apartment', x: 3, y: 3 }), T0);
  assert.equal(fx.unicast[0].msg.code, 'bad_zone');
  fx = onMessage(room, cid, msg('join', { zone: 'associates', x: 0, y: 5 }), T0);
  assert.equal(fx.unicast[0].msg.code, 'bad_move');
  fx = onMessage(room, cid, msg('move', { path: [[9, 10]] }), T0);
  assert.equal(fx.unicast[0].msg.code, 'not_joined');
  fx = onMessage(room, cid, msg('join', { zone: 'associates', x: 9, y: 11 }), T0);
  assert.equal(fx.broadcast[0].msg.t, 'joined');
  fx = onMessage(room, cid, msg('join', { zone: 'office', x: 6, y: 10 }), T0);
  assert.equal(fx.broadcast[0].msg.t, 'zone');
  assert.equal(fx.broadcast[0].except, undefined, 'zone changes go to the sender too');
  assert.equal(room.conns.get(cid).zone, 'office');
});

test('walkability skips per-player upgrade props and blocks solid shared furniture', () => {
  assert.equal(walkable('associates', 9, 11), true);
  assert.equal(walkable('associates', 10, 8), false, 'open desk B3');
  assert.equal(walkable('associates', 0, 5), false, 'wall rim');
  assert.equal(walkable('associates', 18, 5), false, 'out of bounds');
  assert.equal(walkable('office', 9, 8), true, 'second paralegal desk is a per-player upgrade');
  assert.equal(walkable('office', 6, 1), false, 'the office desk is shared furniture');
});

test('move: good path is accepted and broadcast to everyone but the sender', () => {
  const room = createRoom();
  const a = joined(room, 1);
  const b = joined(room, 2);
  const fx = onMessage(room, a.cid, msg('move', { path: [[9, 10], [9, 9], [9, 8]] }), T0 + 10);
  assert.equal(fx.unicast.length, 0);
  assert.equal(fx.broadcast.length, 1);
  assert.equal(fx.broadcast[0].msg.t, 'moved');
  assert.equal(fx.broadcast[0].except, a.cid);
  assert.deepEqual(fx.broadcast[0].msg.path, [[9, 10], [9, 9], [9, 8]]);
  assert.equal(fx.broadcast[0].msg.at, T0 + 10);
  const conn = room.conns.get(a.cid);
  assert.deepEqual([conn.x, conn.y], [9, 8], 'roster reports the destination');
  assert.deepEqual(expectedPosition(conn, T0 + 10), { x: 9, y: 11 });
  assert.deepEqual(expectedPosition(conn, T0 + 10 + 260), { x: 9, y: 10 });
  assert.deepEqual(expectedPosition(conn, T0 + 10 + 5000), { x: 9, y: 8 });
  void b;
});

test('move: non-adjacent steps, teleports, and paths through solid props are refused', () => {
  const room = createRoom();
  const { cid } = joined(room, 1);
  const strip = (conn) => JSON.stringify({ ...conn, lastAt: 0, bucket: null });
  const before = strip(room.conns.get(cid));
  let fx = onMessage(room, cid, msg('move', { path: [[9, 10], [9, 8]] }), T0);
  assert.equal(fx.unicast[0].msg.code, 'bad_move');
  fx = onMessage(room, cid, msg('move', { path: [[3, 5], [3, 6]] }), T0);
  assert.equal(fx.unicast[0].msg.code, 'bad_move', 'teleport far from the expected position');
  fx = onMessage(room, cid, msg('move', { path: [[9, 10], [10, 10], [10, 9], [10, 8]] }), T0);
  assert.equal(fx.unicast[0].msg.code, 'bad_move', 'through desk B3');
  fx = onMessage(room, cid, msg('move', { path: Array.from({ length: LIMITS.pathSteps + 1 }, (_, i) => [9, 10 - (i % 2)]) }), T0);
  assert.equal(fx.unicast[0].msg.code, 'bad_move', 'too long');
  assert.equal(strip(room.conns.get(cid)), before, 'state unchanged on refusal');
  assert.equal(room.seq, 1, 'no broadcast on refusal');
});

test('move: a second path must start near where the player should be by now', () => {
  const room = createRoom();
  const { cid } = joined(room, 1);
  onMessage(room, cid, msg('move', { path: [[9, 10], [9, 9], [9, 8], [9, 7], [9, 6]] }), T0);
  // 500 ms later the 4 t/s clock puts the player on the second tile (9,9).
  let fx = onMessage(room, cid, msg('move', { path: [[10, 9], [11, 9]] }), T0 + 500);
  assert.equal(fx.unicast.length, 0, 'adjacent to the expected tile');
  fx = onMessage(room, cid, msg('move', { path: [[11, 10], [11, 11]] }), T0 + 500);
  assert.equal(fx.unicast.length, 0, 'adjacent to the new destination region after a fresh path');
  const conn = room.conns.get(cid);
  conn.path = [[9, 10], [9, 9], [9, 8], [9, 7], [9, 6]]; conn.pathFrom = [9, 11]; conn.pathAt = T0; conn.x = 9; conn.y = 6;
  fx = onMessage(room, cid, msg('move', { path: [[9, 5]] }), T0 + 500);
  assert.equal(fx.unicast[0].msg.code, 'bad_move', 'ahead of the clock');
  fx = onMessage(room, cid, msg('move', { path: [[8, 11]] }), T0 + 500);
  assert.equal(fx.unicast.length, 0, 'a slowed client may still be at the start of the path');
});

test('validatePath exposes the raw rule', () => {
  assert.equal(validatePath('associates', { x: 9, y: 11 }, [[9, 10]]).ok, true);
  assert.equal(validatePath('associates', { x: 9, y: 11 }, [[9, 8]]).ok, false);
  assert.equal(validatePath('nowhere', { x: 9, y: 11 }, [[9, 10]]).code, 'bad_zone');
});

test('sit/stand: claims are acked to everyone, taken desks refused, desks released on zone change and leave', () => {
  const room = createRoom();
  const a = joined(room, 1);
  const b = joined(room, 2, 'associates', 11, 11);
  const seat = deskSeats().B3;
  let fx = onMessage(room, a.cid, msg('sit', { desk: 'B3' }), T0);
  assert.equal(fx.broadcast.length, 1);
  assert.deepEqual({ ...fx.broadcast[0].msg, seq: 0 }, { v: 1, t: 'desk', deskId: 'B3', pid: 'p1', name: 'Player 1', seq: 0 });
  assert.equal(fx.broadcast[0].except, undefined, 'the sender receives the desk ack');
  const conn = room.conns.get(a.cid);
  assert.deepEqual([conn.x, conn.y, conn.activity, conn.desk], [seat.x, seat.y, 'sitting', 'B3']);
  assert.deepEqual(snapshotFor(room, b.cid).desks, { B3: { pid: 'p1', name: 'Player 1', since: T0 } });

  fx = onMessage(room, b.cid, msg('sit', { desk: 'B3' }), T0);
  assert.equal(fx.unicast[0].msg.code, 'desk_taken');
  fx = onMessage(room, b.cid, msg('sit', { desk: 'A1' }), T0);
  assert.equal(fx.unicast[0].msg.code, 'bad_desk', 'too far away');
  fx = onMessage(room, b.cid, msg('sit', { desk: 'Z9' }), T0);
  assert.equal(fx.unicast[0].msg.code, 'bad_desk');

  fx = onMessage(room, a.cid, msg('sit', { desk: 'B3' }), T0);
  assert.equal(fx.broadcast.length, 1, 're-sitting your own desk is fine');
  fx = onMessage(room, a.cid, msg('stand'), T0);
  assert.deepEqual({ ...fx.broadcast[0].msg, seq: 0 }, { v: 1, t: 'desk', deskId: 'B3', pid: null, name: null, seq: 0 });
  assert.equal(conn.activity, null);

  onMessage(room, a.cid, msg('sit', { desk: 'B3' }), T0);
  fx = onMessage(room, a.cid, msg('zone', { zone: 'office', x: 6, y: 10 }), T0);
  assert.deepEqual(types(fx.broadcast).slice(0, 2), ['desk', 'zone']);
  assert.equal(fx.broadcast[0].msg.pid, null);
  fx = onMessage(room, a.cid, msg('sit', { desk: 'B3' }), T0);
  assert.equal(fx.unicast[0].msg.code, 'bad_desk', 'cannot sit from the office');

  onMessage(room, b.cid, msg('sit', { desk: 'B3' }), T0);
  fx = onLeave(room, b.cid, 'closed', T0);
  assert.deepEqual(types(fx.broadcast), ['desk', 'left']);
  assert.deepEqual(fx.broadcast[1].msg, { v: 1, t: 'left', pid: 'p2', reason: 'closed', seq: fx.broadcast[1].msg.seq });
  assert.deepEqual(snapshotFor(room, a.cid).desks, {});
});

test('status labels are composed from whitelisted kinds plus trusted numbers', () => {
  const room = createRoom();
  const { cid } = joined(room, 1);
  const conn = room.conns.get(cid);
  let fx = onMessage(room, cid, msg('status', { kind: 'review' }), T0);
  assert.equal(fx.broadcast[0].msg.label, 'Document review · cycle 1');
  assert.equal(fx.broadcast[0].msg.activity, 'reviewing');
  fx = onMessage(room, cid, msg('status', { kind: 'study', pack: 'mpre' }), T0);
  assert.equal(fx.broadcast[0].msg.label, composeStatusLabel('study', { pack: 'mpre' }, { streak: 0 }));
  assert.equal(fx.broadcast[0].msg.activity, null);
  fx = onMessage(room, cid, msg('status', { kind: 'journal', taskId: 'release' }), T0);
  assert.equal(fx.broadcast[0].msg.label, 'Writing: Before you press send');
  fx = onMessage(room, cid, msg('status', { kind: 'nonsense' }), T0);
  assert.equal(fx.unicast[0].msg.code, 'bad_message');

  onMessage(room, cid, msg('sit', { desk: 'B3' }), T0);
  fx = onMessage(room, cid, msg('status', { kind: 'library' }), T0);
  assert.equal(fx.broadcast[0].msg.activity, 'sitting', 'seated players keep the sitting pose');

  fx = onProgress(room, 'p1', { streak: 7, documentsReviewed: 3, name: 'Renamed  Attorney' });
  assert.equal(conn.streak, 7);
  assert.equal(conn.name, 'Renamed Attorney');
  assert.deepEqual(types(fx.broadcast), ['desk'], 'library label does not change; the desk plate carries the new name');
  onMessage(room, cid, msg('status', { kind: 'review' }), T0);
  fx = onProgress(room, 'p1', { documentsReviewed: 4 });
  assert.equal(fx.broadcast[0].msg.t, 'status');
  assert.equal(fx.broadcast[0].msg.label, 'Document review · cycle 5');
  assert.equal(onProgress(room, 'nobody', { streak: 1 }).broadcast.length, 0);
});

test('look is stored and broadcast as appearance plus equipped cosmetics', () => {
  const room = createRoom();
  const { cid } = joined(room, 1);
  const fx = onMessage(room, cid, msg('look', { appearance: { skin: 3, glasses: true, outfit: 'skirt' }, equipped: ['tie-brass', 'bogus'] }), T0);
  assert.equal(fx.broadcast[0].msg.t, 'look');
  assert.equal(fx.broadcast[0].msg.look.skin, 3);
  assert.equal(fx.broadcast[0].msg.look.glasses, true);
  assert.deepEqual(fx.broadcast[0].msg.look.equipped, ['tie-brass']);
});

test('rate limiting: burst, then error rate, then close 4008 after three violations in a minute', () => {
  const room = createRoom();
  const { cid } = joined(room, 1);
  let errors = 0;
  for (let i = 0; i < LIMITS.burst + 5; i++) {
    const fx = onMessage(room, cid, msg('ping'), T0 + i);
    if (fx.unicast[0]?.msg.code === 'rate') errors++;
    if (fx.close.length) {
      assert.equal(fx.close[0].code, CLOSE_CODES.abuse);
      assert.equal(errors, 2);
      assert.equal(room.conns.has(cid), false);
      assert.equal(fx.broadcast.at(-1).msg.t, 'left');
      return;
    }
  }
  assert.fail('expected the connection to be closed for abuse');
});

test('rate limiting refills at the configured rate', () => {
  const room = createRoom();
  const { cid } = joined(room, 1);
  for (let i = 0; i < LIMITS.burst; i++) onMessage(room, cid, msg('ping'), T0);
  assert.equal(onMessage(room, cid, msg('ping'), T0).unicast[0].msg.code, 'rate');
  assert.equal(onMessage(room, cid, msg('ping'), T0 + 1000).unicast[0].msg.t, 'pong');
});

test('oversized and malformed frames are refused without state change', () => {
  const room = createRoom();
  const { cid } = joined(room, 1);
  assert.equal(onMessage(room, cid, 'x'.repeat(LIMITS.messageBytes + 1), T0).unicast[0].msg.code, 'bad_message');
  assert.equal(onMessage(room, cid, '{not json', T0).unicast[0].msg.code, 'bad_message');
  assert.equal(onMessage(room, cid, JSON.stringify({ v: 2, t: 'ping' }), T0).unicast[0].msg.code, 'bad_message');
  assert.equal(onMessage(room, cid, JSON.stringify({ v: 1, t: 'resync' }), T0).unicast[0].msg.t, 'snapshot');
});

test('capacity: the eleventh distinct player is closed with 4003, a reconnect does not count twice', () => {
  const room = createRoom();
  for (let n = 1; n <= LIMITS.roomCapacity; n++) joined(room, n);
  const extra = connect(room, 11);
  assert.deepEqual(extra.fx.close, [{ cid: 'c11', code: CLOSE_CODES.full, reason: 'full' }]);
  assert.equal(extra.fx.unicast.length, 0);
  assert.equal(room.conns.size, LIMITS.roomCapacity);
  const again = onConnect(room, { cid: 'c1b', pid: 'p1', name: 'Player 1' }, T0);
  assert.equal(again.close[0].code, CLOSE_CODES.replaced);
  assert.equal(again.unicast.at(-1).msg.t, 'snapshot');
  assert.equal(room.conns.size, LIMITS.roomCapacity);
});

test('replace: a second socket for the same player closes the first and announces it', () => {
  const room = createRoom();
  joined(room, 1);
  joined(room, 2);
  onMessage(room, 'c1', msg('sit', { desk: 'B3' }), T0);
  const fx = onConnect(room, { cid: 'c1b', pid: 'p1', name: 'Player 1' }, T0);
  assert.deepEqual(types(fx.broadcast), ['desk', 'left']);
  assert.equal(fx.broadcast[1].msg.reason, 'replaced');
  assert.ok(fx.broadcast.every((entry) => entry.except === 'c1b'), 'the new socket is not told about its own old socket');
  assert.deepEqual(fx.close, [{ cid: 'c1', code: CLOSE_CODES.replaced, reason: 'replaced' }]);
  assert.equal(fx.unicast[0].cid, 'c1b');
  assert.equal(fx.unicast[0].msg.t, 'snapshot');
  assert.equal(room.conns.has('c1'), false);
  assert.equal(room.conns.has('c1b'), true);
  assert.equal(onLeave(room, 'c1', 'closed', T0).broadcast.length, 0, 'late close of the replaced socket is a no-op');
});

test('seq is monotonic across every broadcast and the snapshot reports it', () => {
  const room = createRoom();
  const a = joined(room, 1);
  const b = joined(room, 2);
  const seen = [];
  for (const fx of [
    onMessage(room, a.cid, msg('move', { path: [[9, 10]] }), T0),
    onMessage(room, a.cid, msg('status', { kind: 'library' }), T0),
    onMessage(room, a.cid, msg('zone', { zone: 'office', x: 6, y: 10 }), T0),
    onLeave(room, a.cid, 'closed', T0),
  ]) seen.push(...fx.broadcast.map((entry) => entry.msg.seq));
  for (let i = 1; i < seen.length; i++) assert.ok(seen[i] > seen[i - 1], `seq ${seen[i]} after ${seen[i - 1]}`);
  assert.equal(snapshotFor(room, b.cid).seq, seen.at(-1));
  assert.equal(room.seq, seen.at(-1));
});

test('idle sweep closes silent players with 4001 and honours the adapter clock', () => {
  const room = createRoom();
  joined(room, 1);
  joined(room, 2);
  onMessage(room, 'c2', msg('ping'), T0 + LIMITS.idleMs);
  let fx = sweepIdle(room, T0 + LIMITS.idleMs + 1);
  assert.deepEqual(fx.close, [{ cid: 'c1', code: CLOSE_CODES.idle, reason: 'idle' }]);
  assert.equal(fx.broadcast[0].msg.reason, 'idle');
  fx = sweepIdle(room, T0 + LIMITS.idleMs * 2 + 2, (conn) => conn.lastAt + LIMITS.idleMs);
  assert.equal(fx.close.length, 0, 'auto-response pings keep the socket alive');
});

test('a worst-case connection record fits a Durable Object attachment', () => {
  const conn = createConnection({ cid: 'x'.repeat(36), pid: 'abcdef012345', name: 'N'.repeat(LIMITS.nameChars) }, T0);
  conn.joined = true; conn.zone = 'associates'; conn.label = 'L'.repeat(LIMITS.labelChars);
  conn.path = Array.from({ length: LIMITS.pathSteps }, (_, i) => [10 + (i % 7), 10 + (i % 3)]);
  conn.pathFrom = [17, 12]; conn.status = { kind: 'journal', taskId: 'capstone', pack: 'canada-test' };
  conn.look = { skin: 6, hair: 17, hairStyle: 15, eye: 5, facialHair: 6, faceShape: 2, suitColor: '#1f3a5f', tieColor: '#6e2436', shirtColor: '#f3eee1', outfit: 'trousers', silhouette: 'tailored', glasses: true, equipped: ['tie-brass', 'case-oxblood', 'pin-silver', 'frames-tortoise'] };
  conn.violations = [T0, T0, T0]; conn.desk = 'B3'; conn.deskSince = T0;
  assert.ok(JSON.stringify({ cid: conn.cid, seq: 1e9, conn }).length < 1900);
});
