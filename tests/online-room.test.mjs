import test from 'node:test';
import assert from 'node:assert/strict';
import { newRoom, applyRoomMessage, playersInZone, deskOccupant, roomSummary } from '../js/online/room.js';
import { validateClientMessage, composeStatusLabel, deriveStatus, sameStatus, activityForStatus, deskSeats, SHARED_ZONES, LIMITS, clampLabel } from '../js/online/protocol.js';

const player = (pid, extra = {}) => ({ pid, name: `Attorney ${pid}`, zone: 'office', x: 3, y: 4, path: [], facing: 1, activity: null, desk: null, label: '', look: null, ...extra });
function joined() {
  const room = newRoom();
  applyRoomMessage(room, { t: 'snapshot', seq: 10, you: { pid: 'me', name: 'Me' }, players: [player('me'), player('a'), player('b', { zone: 'associates', desk: 'A1' })], desks: { A1: { pid: 'b', name: 'Attorney b', since: 5 } } });
  return room;
}

test('snapshot seeds the roster without the local player and positions desk holders on their seats', () => {
  const room = joined();
  assert.equal(room.connected, true); assert.equal(room.me.pid, 'me');
  assert.deepEqual(Object.keys(room.players).sort(), ['a', 'b']);
  assert.deepEqual({ x: room.players.b.x, y: room.players.b.y }, { x: deskSeats().A1.x, y: deskSeats().A1.y });
  assert.equal(deskOccupant(room, 'A1').name, 'Attorney b');
  assert.deepEqual(roomSummary(room), { count: 3, others: 2, byZone: { office: 1, associates: 1 } });
  assert.equal(playersInZone(room, 'office').length, 1);
});

test('join, move, zone, look and leave update records and emit effects; duplicates are ignored', () => {
  const room = joined();
  assert.deepEqual(applyRoomMessage(room, { t: 'joined', seq: 11, p: player('c') }), [{ type: 'spawn', pid: 'c' }]);
  assert.deepEqual(applyRoomMessage(room, { t: 'joined', seq: 11, p: player('c') }), [{ type: 'duplicate', seq: 11 }]);
  assert.deepEqual(applyRoomMessage(room, { t: 'moved', seq: 12, pid: 'c', path: [[3, 5], [3, 6]], at: 1 }), [{ type: 'walk', pid: 'c' }]);
  assert.deepEqual({ x: room.players.c.x, y: room.players.c.y, steps: room.players.c.path.length }, { x: 3, y: 6, steps: 2 });
  assert.deepEqual(applyRoomMessage(room, { t: 'zone', seq: 13, pid: 'c', zone: 'sidebar', x: 7, y: 10 }), [{ type: 'teleport', pid: 'c' }]);
  assert.equal(room.players.c.zone, 'sidebar'); assert.equal(room.players.c.path.length, 0);
  assert.deepEqual(applyRoomMessage(room, { t: 'look', seq: 14, pid: 'c', look: { skin: 2 } }), [{ type: 'look', pid: 'c' }]);
  assert.deepEqual(applyRoomMessage(room, { t: 'moved', seq: 15, pid: 'me', path: [[1, 1]] }), []);
  assert.deepEqual(applyRoomMessage(room, { t: 'left', seq: 16, pid: 'c', reason: 'closed' }), [{ type: 'despawn', pid: 'c' }]);
  assert.deepEqual(applyRoomMessage(room, { t: 'left', seq: 17, pid: 'ghost' }), []);
  assert.deepEqual(applyRoomMessage(room, { t: 'nonsense', seq: 18 }), []);
});

test('desk claims move holders to seats, free previous desks, release on leave and acknowledge the local player', () => {
  const room = joined();
  const effects = applyRoomMessage(room, { t: 'desk', seq: 11, deskId: 'B2', pid: 'a', name: 'Attorney a' });
  assert.deepEqual(effects, [{ type: 'desks' }, { type: 'pose', pid: 'a' }]);
  assert.equal(room.players.a.desk, 'B2'); assert.equal(room.players.a.activity, 'sitting');
  assert.deepEqual({ x: room.players.a.x, y: room.players.a.y }, { x: deskSeats().B2.x, y: deskSeats().B2.y });
  applyRoomMessage(room, { t: 'desk', seq: 12, deskId: 'B3', pid: 'a', name: 'Attorney a' });
  assert.equal(deskOccupant(room, 'B2'), null); assert.equal(room.players.a.desk, 'B3');
  assert.deepEqual(applyRoomMessage(room, { t: 'desk', seq: 13, deskId: 'B3', pid: null, name: null }), [{ type: 'desks' }, { type: 'pose', pid: 'a' }]);
  assert.equal(room.players.a.desk, null); assert.equal(room.players.a.activity, null);
  assert.deepEqual(applyRoomMessage(room, { t: 'desk', seq: 14, deskId: 'A4', pid: 'me', name: 'Me' }), [{ type: 'desks' }, { type: 'ack', t: 'sit', deskId: 'A4' }]);
  assert.deepEqual(applyRoomMessage(room, { t: 'desk', seq: 15, deskId: 'A4', pid: null, name: null }), [{ type: 'desks' }, { type: 'ack', t: 'stand', deskId: 'A4' }]);
  assert.deepEqual(applyRoomMessage(room, { t: 'left', seq: 16, pid: 'b' }), [{ type: 'despawn', pid: 'b' }, { type: 'desks' }]);
  assert.equal(deskOccupant(room, 'A1'), null);
});

test('status messages clamp labels, set poses and keep the local label separately', () => {
  const room = joined();
  const long = 'x'.repeat(80);
  assert.deepEqual(applyRoomMessage(room, { t: 'status', seq: 11, pid: 'a', label: long, activity: 'reviewing' }), [{ type: 'pose', pid: 'a' }]);
  assert.equal(room.players.a.label.length, LIMITS.labelChars); assert.equal(room.players.a.activity, 'reviewing');
  assert.deepEqual(applyRoomMessage(room, { t: 'status', seq: 12, pid: 'me', label: 'Studying' }), [{ type: 'me-status' }]);
  assert.equal(room.meLabel, 'Studying');
  assert.deepEqual(applyRoomMessage(room, { t: 'error', code: 'desk_taken', detail: 'B1' }), [{ type: 'error', code: 'desk_taken', detail: 'B1' }]);
});

test('client messages are validated against zones, adjacency, desks and whitelists', () => {
  assert.equal(SHARED_ZONES.includes('apartment'), false); assert.ok(SHARED_ZONES.includes('associates')); assert.ok(SHARED_ZONES.includes('street'));
  assert.equal(validateClientMessage({ v: 1, t: 'join', zone: 'street', x: 4, y: 2 }).ok, true);
  assert.equal(validateClientMessage({ v: 1, t: 'join', zone: 'apartment', x: 1, y: 1 }).code, 'bad_zone');
  assert.equal(validateClientMessage({ v: 1, t: 'join', zone: 'office', x: 0, y: 5 }).code, 'bad_move');
  assert.equal(validateClientMessage({ v: 1, t: 'join', zone: 'office', x: 6, y: 10, seq: 2 }).ok, true);
  assert.equal(validateClientMessage({ v: 2, t: 'join', zone: 'office', x: 6, y: 10 }).code, 'bad_message');
  assert.equal(validateClientMessage({ v: 1, t: 'move', path: [] }).code, 'bad_move');
  assert.equal(validateClientMessage({ v: 1, t: 'move', path: Array.from({ length: 65 }, (_, i) => [i, 0]) }).code, 'bad_move');
  assert.equal(validateClientMessage({ v: 1, t: 'move', path: [[1, 1], [2, 2]] }).code, 'bad_move');
  assert.deepEqual(validateClientMessage({ v: 1, t: 'move', path: [[1, 1], [1, 2]] }).msg.path, [[1, 1], [1, 2]]);
  assert.equal(validateClientMessage({ v: 1, t: 'sit', desk: 'Z9' }).code, 'bad_desk');
  assert.equal(validateClientMessage({ v: 1, t: 'sit', desk: 'A1' }).ok, true);
  assert.equal(validateClientMessage({ v: 1, t: 'status', kind: 'hacker' }).code, 'bad_message');
  assert.deepEqual(validateClientMessage({ v: 1, t: 'status', kind: 'study', pack: 'mpre', taskId: 'nope' }).msg, { t: 'status', seq: 0, kind: 'study', pack: 'mpre' });
  const look = validateClientMessage({ v: 1, t: 'look', appearance: { skin: 99, glasses: true }, equipped: ['tie-brass', 'crown'] }).msg;
  assert.equal(look.appearance.skin, 0); assert.equal(look.appearance.glasses, true); assert.deepEqual(look.equipped, ['tie-brass']);
  assert.equal(validateClientMessage({ v: 1, t: 'stand' }).ok, true);
  assert.equal(validateClientMessage(null).code, 'bad_message');
});

test('status labels are composed from trusted numbers and derived from interface context', () => {
  assert.equal(composeStatusLabel('study', { pack: 'canada' }, { streak: 2 }), 'Studying Canada · streak x2');
  assert.equal(composeStatusLabel('review', {}, { documentsReviewed: 4 }), 'Document review · cycle 5');
  assert.equal(composeStatusLabel('idle', { zone: 'sidebar' }), 'Exploring The Sidebar — Local Lounge');
  assert.equal(composeStatusLabel('journal', { taskId: 'missing' }), 'In the journal');
  assert.ok(composeStatusLabel('study', { pack: 'sqe' }, { streak: 123456 }).length <= LIMITS.labelChars);
  assert.equal(clampLabel('  a   b  '), 'a b');
  assert.deepEqual(deriveStatus({ reviewing: true, mailOpen: true, scenarioOpen: true }), { kind: 'review' });
  assert.deepEqual(deriveStatus({ mailOpen: true, scenarioOpen: true, pack: 'ca' }), { kind: 'study', pack: 'ca' });
  assert.deepEqual(deriveStatus({ journalOpen: true, taskId: 'capstone' }), { kind: 'journal', taskId: 'capstone' });
  assert.deepEqual(deriveStatus({ rulesOpen: true }), { kind: 'library' });
  assert.deepEqual(deriveStatus({ seated: true }), { kind: 'desk' });
  assert.deepEqual(deriveStatus({ activity: 'sitting', zone: 'sidebar' }), { kind: 'lounge' });
  assert.deepEqual(deriveStatus({}), { kind: 'idle' });
  assert.equal(sameStatus({ kind: 'study', pack: 'ca' }, { kind: 'study', pack: 'ca' }), true);
  assert.equal(sameStatus({ kind: 'study', pack: 'ca' }, { kind: 'study' }), false);
  assert.equal(activityForStatus('review', false), 'reviewing'); assert.equal(activityForStatus('idle', true), 'sitting'); assert.equal(activityForStatus('idle', false), null);
});
