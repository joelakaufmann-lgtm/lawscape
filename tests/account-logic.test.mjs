import test from 'node:test';
import assert from 'node:assert/strict';
import {
  freshDoc, loadDoc, createMemoryLedger, applyAccountAction, settleOnRead, presenceOf, meOf, validateEnvelope,
} from '../server/account-logic.mjs';
import { PARTNER_DELAY_MS } from '../js/apprenticeship.js';
import { WRITING_TASKS } from '../js/data/apprenticeship.js';
import { WHISKEY_ETHICS_DAMAGE } from '../js/data/work.js';

const T0 = 1_700_000_000_000;
const rng = () => 0.25;
const uuid = () => 'run-fixed';

function account() {
  const doc = freshDoc('player@example.com', T0);
  const ledger = createMemoryLedger();
  let seq = 0;
  const act = (action, options = {}) => {
    const clientId = options.clientId ?? 'browser-a';
    const n = options.seq ?? ++seq;
    return applyAccountAction(doc, { clientId, seq: n, action }, options.now ?? T0 + n * 1000, rng, uuid, ledger);
  };
  const create = () => act({ type: 'create_character', name: 'Ada Counsel', gender: 'female', appearance: { skin: 2, glasses: true } });
  return { doc, ledger, act, create, seqOf: () => seq };
}

test('create_character seeds the account and is refused while the run is active', () => {
  const { doc, act, create } = account();
  assert.equal(meOf(doc, doc.email).hasCharacter, false);
  assert.deepEqual(presenceOf(doc), { name: 'Attorney', look: null, streak: 0, documentsReviewed: 0 });

  const made = create();
  assert.equal(made.status, 200);
  assert.equal(made.body.ok, true);
  assert.equal(made.changed, true);
  assert.equal(made.body.state.name, 'Ada Counsel');
  assert.equal(made.body.state.runId, 'run-fixed');
  assert.equal(made.body.state.glasses, true);
  assert.deepEqual(made.body.result, { runId: 'run-fixed', name: 'Ada Counsel' });
  assert.equal(doc.character.gold, 0);
  assert.deepEqual(meOf(doc, doc.email), { ok: true, email: doc.email, name: 'Ada Counsel', hasCharacter: true, runStatus: 'active' });
  const presence = presenceOf(doc);
  assert.equal(presence.name, 'Ada Counsel');
  assert.equal(presence.look.skin, 2);
  assert.deepEqual(presence.look.equipped, []);

  const again = create();
  assert.equal(again.status, 409);
  assert.equal(again.body.code, 'active');
  assert.match(again.body.message, /active attorney/);
  assert.equal(doc.character.name, 'Ada Counsel');

  const other = act({ type: 'create_character', name: 'Other' }, { clientId: 'browser-b', seq: 1 });
  assert.equal(other.status, 409, 'the guard applies across clients');
});

test('act happy path returns the full document, result and serverNow', () => {
  const { doc, act, create } = account();
  create();
  const res = act({ type: 'set_practice_pack', id: 'mpre' });
  assert.equal(res.status, 200);
  assert.equal(res.body.ok, true);
  assert.equal(res.body.seq, 2);
  assert.deepEqual(res.body.result, { id: 'mpre' });
  assert.deepEqual(res.body.delivered, []);
  assert.equal(res.body.ended, false);
  assert.equal(res.body.serverNow, T0 + 2000);
  assert.equal(res.body.state.practicePack, 'mpre');
  assert.equal(doc.character.practicePack, 'mpre');
  assert.equal(doc.session.lastSeq['browser-a'], 2);
});

test('identical (clientId, seq) replays return the identical stored response', () => {
  const { doc, act, create, ledger } = account();
  create();
  const first = act({ type: 'set_practice_pack', id: 'sqe' });
  const replay = applyAccountAction(doc, { clientId: 'browser-a', seq: 2, action: { type: 'set_practice_pack', id: 'mixed' } }, T0 + 99_999, rng, uuid, ledger);
  assert.equal(replay.status, first.status);
  assert.deepEqual(replay.body, first.body);
  assert.equal(replay.body.serverNow, first.body.serverNow, 'the stored response is returned verbatim');
  assert.equal(replay.changed, false);
  assert.equal(doc.character.practicePack, 'sqe', 'the replayed action is not applied again');
});

test('a seq at or below the last one seen for that client is stale (409)', () => {
  const { doc, act, create, ledger } = account();
  create();
  act({ type: 'set_practice_pack', id: 'sqe' });
  act({ type: 'set_practice_pack', id: 'mixed' });
  const stale = applyAccountAction(doc, { clientId: 'browser-a', seq: 1, action: { type: 'set_practice_pack', id: 'mpre' } }, T0, rng, uuid, createMemoryLedger());
  assert.equal(stale.status, 409);
  assert.equal(stale.body.code, 'stale');
  assert.equal(stale.changed, false);
  assert.equal(doc.character.practicePack, 'mixed');
  const fresh = applyAccountAction(doc, { clientId: 'browser-b', seq: 1, action: { type: 'set_practice_pack', id: 'mpre' } }, T0, rng, uuid, ledger);
  assert.equal(fresh.status, 200, 'other clients keep their own counters');
});

test('malformed envelopes and unknown action types are bad requests', () => {
  const { doc, ledger } = account();
  for (const body of [null, [], {}, { clientId: '', seq: 1, action: { type: 'rest' } }, { clientId: 'a', seq: 0, action: { type: 'rest' } },
    { clientId: 'a', seq: 1.5, action: { type: 'rest' } }, { clientId: 'a', seq: 1, action: { type: 'hack' } }, { clientId: 'a', seq: 1, action: null },
    { clientId: 'a'.repeat(65), seq: 1, action: { type: 'rest' } }]) {
    const res = applyAccountAction(doc, body, T0, rng, uuid, ledger);
    assert.equal(res.status, 400, JSON.stringify(body));
    assert.deepEqual(res.body, { ok: false, code: 'bad_request' });
  }
  assert.equal(validateEnvelope({ clientId: 'a', seq: 3, action: { type: 'rest' } }).seq, 3);
  const noChar = applyAccountAction(doc, { clientId: 'a', seq: 1, action: { type: 'rest' } }, T0, rng, uuid, ledger);
  assert.equal(noChar.status, 404);
  assert.equal(noChar.body.code, 'no_character');
});

test('refused actions come back ok:false with the unchanged state and are ledgered', () => {
  const { doc, act, create, ledger } = account();
  create();
  const before = JSON.stringify(doc.character);
  const refused = act({ type: 'buy_upgrade', id: 'coffee' });
  assert.equal(refused.status, 200);
  assert.equal(refused.body.ok, false);
  assert.match(refused.body.message, /gold/);
  assert.equal(refused.body.seq, 2);
  assert.equal(JSON.stringify(doc.character), before);
  assert.deepEqual(refused.body.state, doc.character);
  const replay = applyAccountAction(doc, { clientId: 'browser-a', seq: 2, action: { type: 'buy_upgrade', id: 'coffee' } }, T0 + 5, rng, uuid, ledger);
  assert.deepEqual(replay.body, refused.body);
  assert.equal(ledger.size(), 2);
});

test('an ended run is appended to runs and a new attorney may then be created', () => {
  const { doc, act, create } = account();
  create();
  doc.character.ethics = WHISKEY_ETHICS_DAMAGE;
  doc.character.casesDone = 4;
  doc.character.billableStudyMs = 1234;
  act({ type: 'set_zone', zone: 'corner_office' });
  const res = act({ type: 'drink_whiskey' });
  assert.equal(res.body.ok, true);
  assert.equal(res.body.ended, true);
  assert.equal(res.body.state.runStatus, 'ended');
  assert.equal(res.body.state.endedAt, T0 + 3000);
  assert.deepEqual(doc.runs, [{ runId: 'run-fixed', name: 'Ada Counsel', billableStudyMs: 1234, casesDone: 4, endedAt: T0 + 3000 }]);
  assert.equal(meOf(doc, doc.email).runStatus, 'ended');
  const next = create();
  assert.equal(next.status, 200);
  assert.equal(next.body.ok, true);
  assert.equal(doc.character.runStatus, 'active');
  assert.equal(doc.runs.length, 1);
});

test('settle-on-read delivers due partner replies and reports whether the doc changed', () => {
  const { doc, act, create } = account();
  assert.equal(settleOnRead(doc, T0).status, 404);
  create();
  const task = WRITING_TASKS[0];
  act({ type: 'apprenticeship_save_draft', taskId: task.id, draft: { text: 'Hold the release until approval is confirmed.', issue: task.issue, action: task.action, evidence: task.evidence } });
  const committed = act({ type: 'apprenticeship_commit', taskId: task.id }, { now: T0 + 3000 });
  assert.equal(committed.body.ok, true, committed.body.message);
  assert.equal(doc.character.apprenticeship.attempts[0].status, 'pending');

  const early = settleOnRead(doc, T0 + 3000 + PARTNER_DELAY_MS - 1);
  assert.equal(early.status, 200);
  assert.equal(early.changed, false);
  assert.equal(early.body.state.apprenticeship.attempts[0].status, 'pending');

  const late = settleOnRead(doc, T0 + 3000 + PARTNER_DELAY_MS);
  assert.equal(late.changed, true);
  assert.equal(late.body.serverNow, T0 + 3000 + PARTNER_DELAY_MS);
  assert.equal(late.body.state.apprenticeship.attempts[0].status, 'returned');
  assert.equal(doc.character.apprenticeship.attempts[0].status, 'returned');
  assert.ok(doc.character.gold > 0, 'the reply paid out');
  assert.equal(settleOnRead(doc, T0 + 10_000 + PARTNER_DELAY_MS).changed, false);
});

test('loadDoc normalises partial documents from storage', () => {
  const loaded = loadDoc({ v: 1, email: 'x@example.com', character: { name: 'Old', gold: 5 } }, 'x@example.com', T0);
  assert.equal(loaded.character.name, 'Old');
  assert.equal(loaded.character.gold, 5);
  assert.equal(loaded.character.runStatus, 'active');
  assert.deepEqual(loaded.session, { lastSeq: {} });
  assert.deepEqual(loaded.runs, []);
  assert.equal(loadDoc(undefined, 'y@example.com', T0).character, null);
});
