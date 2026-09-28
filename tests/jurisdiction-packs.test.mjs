import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { SCENARIOS } from '../js/data/ethics.js';
import { PRACTICE_PACKS } from '../js/data/practice-packs.js';
import { practiceInbox } from '../js/data/mail.js';
import { freshState, state, load, save } from '../js/state.js';

test('all 118 released questions retain their content and identifiers after relocation', () => {
  // Canonical digest captured from v0.5.0 before editing. Only source-directory moves are normalized.
  const legacy = SCENARIOS.filter(s => ['lawscape', 'mpre-style', 'sqe-style'].includes(s.sourceType))
    .map(s => ({ ...s, ...(s.localSourceFile ? { localSourceFile: s.localSourceFile.split('/').at(-1) } : {}) }));
  assert.equal(legacy.length, 118);
  assert.equal(createHash('sha256').update(JSON.stringify(legacy)).digest('hex'),
    '2a252cc368ed033d6dab41b4eedc3f8f8386e72a038c82965787cee0950775c1');
});

test('California and New York remain isolated at every tier, with readable sources and explanations', async () => {
  assert.deepEqual(PRACTICE_PACKS.map(pack => [pack.id, pack.count]),
    [['mixed', 171], ['ca', 20], ['ny', 33], ['mpre', 69], ['sqe', 28], ['juris', 21]]);
  for (const [pack, jurisdiction] of [['ca', 'California'], ['ny', 'New York']]) {
    const reached = new Set();
    for (const casesDone of [0, 5, 12]) {
      const player = { ...freshState(), practicePack: pack, casesDone };
      const inbox = practiceInbox(player, SCENARIOS);
      assert.ok(inbox.unread.length);
      for (const item of inbox.unread) {
        reached.add(item.id);
        assert.equal(item.jurisdiction, jurisdiction);
        assert.ok(item.explanation.length > 40);
        assert.equal(item.sourceChecked, '2026-09-27');
        assert.match(item.sourceUrl, /^https:\/\/(www\.calbar\.ca\.gov|www\.nycourts\.gov)\//);
        assert.ok((await readFile(new URL('../' + item.localSourceFile, import.meta.url), 'utf8')).includes(item.subject));
      }
      const answered = inbox.unread[0].id;
      player.seen.push(answered);
      assert.ok(!practiceInbox(player, SCENARIOS).unread.some(item => item.id === answered));
      player.practicePack = 'mixed';
      assert.ok(!practiceInbox(player, SCENARIOS).unread.some(item => item.id === answered), 'pack switching must not resurrect answered questions');
    }
    assert.equal(reached.size, pack === 'ca' ? 20 : 33);
  }
});

test('new pack selection and answer history survive existing save migration and reload', () => {
  const entries = new Map();
  globalThis.localStorage = { getItem: key => entries.get(key) ?? null, setItem: (key, value) => entries.set(key, value), removeItem: key => entries.delete(key) };
  try {
    for (const pack of ['ca', 'ny']) {
      entries.set('lawscape_save_v2', JSON.stringify({ ...freshState(), schemaVersion: 4,
        practicePack: pack, seen: ['trust_advance', 'ca_01_sunset_settlement', 'ny_short_bodega_settlement_offer'], gold: 432, ethics: 65 }));
      assert.equal(load(), true);
      assert.equal(state.practicePack, pack); assert.equal(state.gold, 432); assert.equal(state.ethics, 65);
      assert.equal(state.seen.length, 3); save(); assert.equal(load(), true);
      assert.equal(state.practicePack, pack); assert.equal(state.seen.length, 3);
    }
  } finally { delete globalThis.localStorage; }
});
