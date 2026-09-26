import test from 'node:test';
import assert from 'node:assert/strict';
import { freshState, state, reset, load, save, damageEthics } from '../js/state.js';
import { WRITING_TASKS, CAPSTONE, DOCUMENT_PACKS, evidenceAt } from '../js/data/apprenticeship.js';
import { PARTNER_DELAY_MS, saveDraft, commitWriting, settleReplies, submitReview, buyCosmetic, capstoneReady, requestJurisdiction, requestIssueUrl } from '../js/apprenticeship.js';

function draft(player, task, overrides = {}) {
  saveDraft(player, task.id, { text: `A record-based reply for ${task.title}. Please verify the unresolved facts before taking the next step.`, issue: task.issue, action: task.action, evidence: task.evidence, ...overrides });
}
function storage() {
  const items = new Map();
  globalThis.localStorage = { getItem: (key) => items.get(key) || null, setItem: (key, value) => items.set(key, value), removeItem: (key) => items.delete(key) };
  return items;
}

test('six assignments and two six-document synthetic files have resolvable source/rubric anchors', () => {
  assert.equal(WRITING_TASKS.length, 6);
  assert.equal(DOCUMENT_PACKS.length, 2);
  const anchors = [];
  for (const pack of DOCUMENT_PACKS) {
    assert.equal(pack.documents.length, 6);
    for (const doc of pack.documents) doc.paragraphs.forEach((_, i) => anchors.push(`${doc.id}.${i + 1}`));
    for (const finding of pack.findings) assert.equal(evidenceAt(finding.anchor).pack.id, pack.id);
  }
  assert.equal(new Set(anchors).size, anchors.length);
  for (const task of [...WRITING_TASKS, CAPSTONE]) {
    assert.ok(task.sources.includes(task.evidence));
    assert.ok(task.issues[task.issue]); assert.ok(task.actions[task.action]);
    for (const anchor of task.sources) assert.ok(evidenceAt(anchor));
  }
  assert.equal(evidenceAt('made-up.100'), null);
});

test('commit snapshots a draft, delays reward, limits pending work and issues gold exactly once', () => {
  const player = freshState(), task = WRITING_TASKS[0];
  draft(player, task);
  const attempt = commitWriting(player, task.id, 1000);
  assert.equal(player.gold, 0);
  assert.equal(attempt.status, 'pending');
  draft(player, task, { text: 'This later local draft does not overwrite a committed response.' });
  assert.notEqual(attempt.submission.text, player.apprenticeship.drafts[task.id].text);
  assert.throws(() => commitWriting(player, task.id, 1001), /pending/);
  assert.throws(() => buyCosmetic(player, 'tie-brass'), /pending/);
  assert.throws(() => submitReview(player, 'lantern', ['L2.1'], 'A finding'), /partner/);
  assert.deepEqual(settleReplies(player, 1000 + PARTNER_DELAY_MS - 1), []);
  assert.equal(settleReplies(player, 1000 + PARTNER_DELAY_MS).length, 1);
  assert.equal(player.gold, 40);
  assert.equal(attempt.result.proseAssessed, false);
  assert.deepEqual(settleReplies(player, 100000), []);
  assert.equal(player.gold, 40);
});

test('empty or incomplete attempts cannot be committed and capstone is gated', () => {
  const player = freshState(), task = WRITING_TASKS[0];
  draft(player, task, { text: '   ' });
  assert.throws(() => commitWriting(player, task.id), /Add your reply/);
  draft(player, task, { evidence: 'H3.1' });
  assert.throws(() => commitWriting(player, task.id), /supporting passage/);
  draft(player, CAPSTONE);
  assert.throws(() => commitWriting(player, CAPSTONE.id), /all six/);
});

test('authored choices, not keywords in prose, determine study gold', () => {
  const player = freshState(), task = WRITING_TASKS[0];
  draft(player, task, { text: 'Not a meaningful analysis, despite the selected checklist.', issue: 0, action: 1, evidence: 'L6.1' });
  commitWriting(player, task.id, 0); settleReplies(player, PARTNER_DELAY_MS);
  assert.equal(player.gold, 10);
  assert.equal(player.ethics, 100);
  assert.equal(player.apprenticeship.attempts[0].result.correct, 0);
});

test('one improved revision earns a bounded bonus and preserves original correspondence', () => {
  const player = freshState(), task = WRITING_TASKS[0];
  draft(player, task, { issue: 0, action: 1, evidence: 'L6.1' });
  const original = commitWriting(player, task.id, 0); settleReplies(player, PARTNER_DELAY_MS);
  const originalText = original.submission.text;
  draft(player, task);
  assert.throws(() => commitWriting(player, task.id, 6000), /Revise your written reply/);
  draft(player, task, { text: 'Revised: the release approval is uncertain under L2.1. Hold and obtain confirmation under L6.1.' });
  const revision = commitWriting(player, task.id, 6000); settleReplies(player, 12000);
  assert.equal(revision.revisionOf, original.id);
  assert.equal(original.submission.text, originalText);
  assert.equal(revision.result.gold, 8);
  assert.equal(player.gold, 18);
  draft(player, task, { text: 'Attempt to farm a third reward' });
  assert.throws(() => commitWriting(player, task.id, 13000), /complete/);
});

test('document review rewards supported anchors, penalizes blanket flagging and pays once', () => {
  const player = freshState();
  const receipt = submitReview(player, 'lantern', ['L2.1', 'L4.1', 'L5.1', 'L5.1', 'H3.1'], 'Approval, date and AI claims need verification.');
  assert.equal(receipt.gold, 75);
  assert.equal(receipt.selected.length, 3);
  assert.throws(() => submitReview(player, 'lantern', ['L2.1'], 'Replay'), /already/);
  const blanket = DOCUMENT_PACKS[1].documents.flatMap((doc) => doc.paragraphs.map((_, i) => `${doc.id}.${i + 1}`));
  assert.equal(submitReview(player, 'harbor', blanket, 'Flag everything').gold, 15);
});

test('the complete first-day arc unlocks and pays the capstone, with separate cosmetic spending', () => {
  const player = freshState();
  for (const task of WRITING_TASKS) { draft(player, task); commitWriting(player, task.id, 0); settleReplies(player, PARTNER_DELAY_MS); }
  assert.equal(capstoneReady(player), false);
  for (const pack of DOCUMENT_PACKS) submitReview(player, pack.id, pack.findings.map((finding) => finding.anchor), 'Source-linked findings.');
  assert.equal(capstoneReady(player), true);
  draft(player, CAPSTONE); commitWriting(player, CAPSTONE.id, 0); settleReplies(player, PARTNER_DELAY_MS);
  assert.equal(player.gold, 565);
  const ethicsBefore = player.ethics;
  buyCosmetic(player, 'tie-brass');
  assert.equal(player.gold, 535);
  assert.deepEqual(player.apprenticeship.equipped, ['tie-brass']);
  assert.equal(player.ethics, ethicsBefore);
  assert.throws(() => buyCosmetic(player, 'tie-brass'), /already/);
});

test('a pending attempt resumes after save/load without duplicate rewards', () => {
  storage(); reset();
  draft(state, WRITING_TASKS[0]); commitWriting(state, WRITING_TASKS[0].id, 0); save();
  const runId = state.runId;
  assert.equal(load(), true);
  assert.equal(state.runId, runId);
  settleReplies(state, PARTNER_DELAY_MS); save(); load(); settleReplies(state, 100000);
  assert.equal(state.gold, 40);
  delete globalThis.localStorage;
});

test('ended and stale character attempts cannot award rewards; reset discards all apprenticeship progress', () => {
  storage(); reset();
  draft(state, WRITING_TASKS[0]); const old = commitWriting(state, WRITING_TASKS[0].id, 0);
  damageEthics(100);
  assert.deepEqual(settleReplies(state, 10000), []);
  assert.equal(state.gold, 0);
  reset();
  assert.notEqual(state.runId, old.runId);
  assert.equal(state.apprenticeship.attempts.length, 0);
  state.apprenticeship.attempts.push(old);
  assert.deepEqual(settleReplies(state, 10000), []);
  assert.equal(state.gold, 0);
  delete globalThis.localStorage;
});

test('legacy saves migrate additively, retain identity/economy and reject future schemas', () => {
  const items = storage();
  items.set('lawscape_save_v2', JSON.stringify({ name: 'Legacy Attorney', gold: 120, ethics: 70, upgrades: ['houseplants'], pos: { x: 5, y: 10 } }));
  assert.equal(load(), true);
  assert.equal(state.name, 'Legacy Attorney'); assert.equal(state.gold, 120); assert.equal(state.ethics, 70);
  assert.deepEqual(state.upgrades, ['houseplants']);
  assert.equal(state.schemaVersion, 5); assert.ok(state.runId); assert.deepEqual(state.apprenticeship.attempts, []);
  items.set('lawscape_save_v2', '{broken'); assert.equal(load(), false);
  items.set('lawscape_save_v2', '{"schemaVersion":99}'); assert.equal(load(), false);
  assert.equal(state.gold, 120);
  delete globalThis.localStorage;
});

test('jurisdiction requests de-duplicate explicit aliases, distinguish UK systems and never claim submission', () => {
  const player = freshState();
  const request = requestJurisdiction(player, ' England & Wales ', 'Drafting', 'Can review public sources');
  assert.equal(requestJurisdiction(player, 'england and wales', 'More drafting', ''), request);
  requestJurisdiction(player, 'Scotland', 'Procedure', '');
  requestJurisdiction(player, 'UK', 'Clarify scope', '');
  assert.equal(player.apprenticeship.requests.length, 3);
  assert.equal(request.status, 'Saved locally · not submitted');
  const url = new URL(requestIssueUrl(request));
  assert.equal(url.origin, 'https://github.com');
  assert.match(url.searchParams.get('body'), /Product suggestion only/);
  assert.throws(() => requestJurisdiction(player, '', '', ''), /Name the legal jurisdiction/);
});
