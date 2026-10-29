#!/usr/bin/env node
// End-to-end smoke test against a local `wrangler dev` (npm run online:dev).
// Not part of `npm test`: it needs the Workers runtime listening on
// http://localhost:8787 with DEV_IDENTITY_EMAIL set in .dev.vars so that
// `?dev_email=` can impersonate several players.

import process from 'node:process';
import { LIMITS, CLOSE_CODES } from '../js/online/protocol.js';

const BASE = process.env.LAWSCAPE_ONLINE_URL || 'http://localhost:8787';
const WS_BASE = BASE.replace(/^http/, 'ws');
const results = [];
const RUN = Date.now().toString(36);
const email = (n) => `smoke${n}-${RUN}@example.com`;
const api = (path, who, init) => fetch(`${BASE}${path}${path.includes('?') ? '&' : '?'}dev_email=${encodeURIComponent(who)}`, init);
const post = (path, who, body) => api(path, who, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });

const ONLY = (process.env.SMOKE_ONLY || '').split(',').filter(Boolean);
async function check(name, fn) {
  if (ONLY.length && !ONLY.some((part) => name.includes(part))) return;
  try {
    await fn();
    results.push({ name, ok: true });
    console.log(`PASS ${name}`);
  } catch (error) {
    results.push({ name, ok: false, error });
    console.log(`FAIL ${name}\n     ${error?.stack || error}`);
  }
}

function expect(condition, message) { if (!condition) throw new Error(message); }

function open(who, { timeout = 5000 } = {}) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(`${WS_BASE}/ws?dev_email=${encodeURIComponent(who)}`);
    const inbox = [];
    const waiters = [];
    const closed = new Promise((done) => { ws.addEventListener('close', (event) => done({ code: event.code, reason: event.reason })); });
    ws.addEventListener('message', (event) => {
      const msg = JSON.parse(event.data);
      const index = waiters.findIndex((waiter) => waiter.match(msg));
      if (index >= 0) waiters.splice(index, 1)[0].resolve(msg);
      else inbox.push(msg);
    });
    const api = {
      ws, inbox, closed,
      send(msg) { ws.send(JSON.stringify({ v: 1, seq: 1, ...msg })); },
      next(match, ms = timeout) {
        const found = inbox.findIndex(match);
        if (found >= 0) return Promise.resolve(inbox.splice(found, 1)[0]);
        return new Promise((res, rej) => {
          const timer = setTimeout(() => { waiters.splice(waiters.indexOf(waiter), 1); rej(new Error(`timed out waiting for ${match.name || 'message'}`)); }, ms);
          const waiter = { match, resolve: (msg) => { clearTimeout(timer); res(msg); } };
          waiters.push(waiter);
        });
      },
      close() { try { ws.close(1000, 'done'); } catch { /* ignore */ } },
    };
    ws.addEventListener('open', () => resolve(api));
    ws.addEventListener('error', () => reject(new Error(`socket failed for ${who}`)));
    setTimeout(() => reject(new Error(`socket open timed out for ${who}`)), timeout);
  });
}

const is = (t) => { const match = (msg) => msg.t === t; Object.defineProperty(match, 'name', { value: t }); return match; };
const sleep = (ms) => new Promise((res) => setTimeout(res, ms));
const sockets = [];
async function connect(who) { const s = await open(who); sockets.push(s); return s; }

await check('health is public', async () => {
  const res = await fetch(`${BASE}/health`);
  expect(res.status === 200, `status ${res.status}`);
  expect(res.headers.get('content-type')?.includes('application/json'), 'json content type');
  const body = await res.json();
  expect(body.ok === true && body.online === true && body.v === 1, JSON.stringify(body));
});

await check('me reports the dev identity', async () => {
  const res = await api('/api/me', email(1));
  expect(res.status === 200, `status ${res.status}`);
  const body = await res.json();
  expect(body.ok === true && body.email === email(1), JSON.stringify(body));
});

const clientId = `smoke-${Date.now()}`;
let seq = 0;
await check('create a character, then act with a duplicate seq', async () => {
  const create = { clientId, seq: ++seq, action: { type: 'create_character', name: 'Smoke Tester', gender: 'female', appearance: { skin: 3 } } };
  let res = await post('/api/account/act', email(1), create);
  let body = await res.json();
  expect(res.status === 200 && body.ok === true && body.state?.name === 'Smoke Tester', `create: ${res.status} ${JSON.stringify(body).slice(0, 200)}`);
  res = await post('/api/account/act', email(1), create);
  body = await res.json();
  expect(res.status === 200 && body.ok === true && body.state?.name === 'Smoke Tester', 'replay returns the stored response');
  res = await post('/api/account/act', email(1), { clientId, seq: 2, action: { type: 'create_character', name: 'Second' } });
  body = await res.json();
  expect(res.status === 409 && body.code === 'active', `second create: ${res.status} ${body.code}`);
  seq = 2;
  const act = { clientId, seq: ++seq, action: { type: 'set_practice_pack', id: 'mpre' } };
  res = await post('/api/account/act', email(1), act);
  body = await res.json();
  expect(res.status === 200 && body.ok === true && body.state.practicePack === 'mpre' && body.seq === seq, `act: ${res.status} ${JSON.stringify(body).slice(0, 200)}`);
  const first = JSON.stringify(body);
  res = await post('/api/account/act', email(1), { ...act, action: { type: 'set_practice_pack', id: 'sqe' } });
  body = await res.json();
  expect(JSON.stringify(body) === first, 'duplicate seq returns the identical stored response');
  res = await post('/api/account/act', email(1), { clientId, seq: 1, action: { type: 'set_practice_pack', id: 'sqe' } });
  expect(res.status === 200, 'ledgered seq 1 still replays');
  res = await post('/api/account/act', email(1), { clientId: `${clientId}-b`, seq: 1, action: { type: 'nope' } });
  expect(res.status === 400, `unknown action ${res.status}`);
  res = await api('/api/account/state', email(1));
  body = await res.json();
  expect(res.status === 200 && body.ok && body.state.practicePack === 'mpre' && Number.isInteger(body.serverNow), 'state read');
  res = await api('/api/account/state', email(2));
  expect(res.status === 404, `state without a character: ${res.status}`);
  res = await api('/api/me', email(1));
  body = await res.json();
  expect(body.hasCharacter === true && body.runStatus === 'active' && body.name === 'Smoke Tester', JSON.stringify(body));
});

await check('unauthenticated identities are refused', async () => {
  const res = await fetch(`${BASE}/api/me?dev_email=not-an-email`);
  expect(res.status === 401, `status ${res.status}`);
});

let a;
await check('socket: snapshot, join, and a second socket for the same email closes the first with 4002', async () => {
  const first = await connect(email(1));
  const snap = await first.next(is('snapshot'));
  expect(snap.you.name === 'Smoke Tester', `presence name from the account: ${snap.you.name}`);
  expect(Number.isInteger(snap.seq) && Array.isArray(snap.players), 'snapshot shape');
  first.send({ t: 'join', zone: 'associates', x: 9, y: 11 });
  a = await connect(email(1));
  const closed = await Promise.race([first.closed, sleep(5000).then(() => null)]);
  expect(closed && closed.code === CLOSE_CODES.replaced, `first socket close: ${JSON.stringify(closed)}`);
  const snap2 = await a.next(is('snapshot'));
  expect(!snap2.players.some((p) => p.pid === snap.you.pid), 'replaced player is not in the roster');
  a.send({ t: 'join', zone: 'associates', x: 9, y: 11 });
});

await check('socket: bad path yields error bad_move; good path is relayed to the other player', async () => {
  const b = await connect(email(2));
  const snapB = await b.next(is('snapshot'));
  expect(snapB.players.length === 1 && snapB.players[0].name === 'Smoke Tester', `roster seen by B: ${JSON.stringify(snapB.players)}`);
  b.send({ t: 'join', zone: 'associates', x: 11, y: 11 });
  const joined = await a.next(is('joined'));
  expect(joined.p.name === 'Attorney', 'player without a character joins as Attorney');
  a.send({ t: 'move', path: [[3, 3], [3, 4]] });
  const err = await a.next(is('error'));
  expect(err.code === 'bad_move', `error code ${err.code}`);
  a.send({ t: 'move', path: [[9, 10], [9, 9]] });
  const moved = await b.next(is('moved'));
  expect(JSON.stringify(moved.path) === '[[9,10],[9,9]]', 'moved relayed to B');
  b.send({ t: 'ping' });
  const pong = await b.next(is('pong'));
  expect(pong.t === 'pong', 'auto-response pong');
  b.send({ t: 'status', kind: 'library' });
  const status = await a.next(is('status'));
  expect(status.label === 'At the Rule Library', `status label ${status.label}`);
  b.close();
  const left = await a.next(is('left'));
  expect(left.pid === joined.p.pid, 'left relayed to A');
});

await check('socket: desk claim is visible to a second socket and released on close', async () => {
  a.send({ t: 'sit', desk: 'B3' });
  const ack = await a.next(is('desk'));
  expect(ack.deskId === 'B3' && ack.name === 'Smoke Tester', `desk ack ${JSON.stringify(ack)}`);
  const c = await connect(email(3));
  const snap = await c.next(is('snapshot'));
  expect(snap.desks.B3?.name === 'Smoke Tester', `desk in snapshot: ${JSON.stringify(snap.desks)}`);
  c.send({ t: 'join', zone: 'associates', x: 11, y: 11 });
  c.send({ t: 'sit', desk: 'B3' });
  const taken = await c.next(is('error'));
  expect(taken.code === 'desk_taken', `expected desk_taken, got ${taken.code}`);
  a.close();
  const released = await c.next((msg) => msg.t === 'desk' && msg.pid === null);
  expect(released.deskId === 'B3', 'desk released on close');
  const left = await c.next(is('left'));
  expect(left.reason === 'left', `leave reason ${left.reason}`);
  c.close();
  await sleep(200);
});

await check(`socket: the ${LIMITS.roomCapacity + 1}th distinct player is closed with 4003`, async () => {
  for (const s of sockets) s.close();
  await sleep(500);
  const room = [];
  for (let n = 10; n < 10 + LIMITS.roomCapacity; n++) {
    const s = await connect(email(n));
    await s.next(is('snapshot'));
    s.send({ t: 'join', zone: 'office', x: 6, y: 10 });
    room.push(s);
  }
  const extra = await connect(email(99));
  extra.send({ t: 'join', zone: 'office', x: 6, y: 10 }); // a real client joins immediately
  const closed = await Promise.race([
    extra.closed,
    extra.next(is('snapshot')).then((snap) => ({ snapshot: snap.players.length }), () => null),
    sleep(5000).then(() => null),
  ]);
  expect(closed && closed.code === CLOSE_CODES.full, `extra socket close: ${JSON.stringify(closed)}`);
  for (const s of room) s.close();
  await sleep(300);
});

for (const s of sockets) s.close();
const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} passed${failed.length ? `; FAILED: ${failed.map((r) => r.name).join(', ')}` : ''}`);
process.exit(failed.length ? 1 : 0);
