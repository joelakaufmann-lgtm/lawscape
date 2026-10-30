import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { freshState, replaceState, state, normalizeSave, readLocalSeed, setPersistence, save, persistenceMode } from '../js/state.js';
import { applyAction, ACTION_TYPES, isAction } from '../js/actions.js';
import { ALL_MAIL_SCENARIOS, practiceInbox } from '../js/data/mail.js';
import { WRITING_TASKS } from '../js/data/apprenticeship.js';
import { PARTNER_DELAY_MS } from '../js/apprenticeship.js';
import { DOC_REVIEW_CYCLE_MS, DOC_REVIEW_REWARD, MONEYBAGS_SAFE_GOLD, RILEY_HINT_COST, LINDA_TIP_COST } from '../js/data/work.js';
import { STUDY_TICK_MAX_MS } from '../js/economy.js';

const ctx = (now, rng = () => 0) => ({ now, rng });
const run = (p, action, now = 1000, rng) => applyAction(p, action, ctx(now, rng));
function office(gold = 0) { const p = freshState(); p.gold = gold; p.zone = 'office'; return p; }
function scenario(p, grade) {
  const pool = practiceInbox(p, ALL_MAIL_SCENARIOS).unread.filter((s) => !s.isTestPack);
  for (const s of pool) { const i = s.choices.findIndex((c) => c.grade === grade); if (i >= 0) return { s, i }; }
  throw new Error(`no ${grade} choice`);
}

test('the action catalogue is closed and every type is dispatchable', () => {
  assert.ok(ACTION_TYPES.length >= 30);
  assert.equal(isAction('answer_scenario'), true); assert.equal(isAction('mint_gold'), false);
  assert.throws(() => run(freshState(), { type: 'mint_gold' }), /Unknown action/);
  assert.throws(() => applyAction(freshState(), { type: 'settle' }, {}), /clock/);
});

test('correct answers pay gold, build a streak and heal at two; wrong answers damage with Riley halving', () => {
  const p = office();
  const first = scenario(p, 'correct');
  const out = run(p, { type: 'answer_scenario', scenarioId: first.s.id, choiceIndex: first.i });
  assert.equal(out.result.correct, true); assert.equal(out.result.earned, first.s.gold); assert.equal(p.gold, first.s.gold);
  assert.equal(p.streak, 1); assert.equal(out.result.healed, 0); assert.ok(p.seen.includes(first.s.id));
  p.ethics = 50;
  const second = scenario(p, 'correct');
  const two = run(p, { type: 'answer_scenario', scenarioId: second.s.id, choiceIndex: second.i });
  assert.equal(two.result.healed, 10); assert.equal(p.ethics, 60); assert.equal(p.streak, 2);
  assert.throws(() => run(p, { type: 'answer_scenario', scenarioId: second.s.id, choiceIndex: second.i }), /not open/);
  const wrong = scenario(p, 'wrong');
  const three = run(p, { type: 'answer_scenario', scenarioId: wrong.s.id, choiceIndex: wrong.i });
  assert.equal(three.result.dmg, 30); assert.equal(p.ethics, 30); assert.equal(p.streak, 0); assert.equal(p.wrongStreak, 1);
  p.upgrades.push('paralegal');
  const again = scenario(p, 'wrong');
  const four = run(p, { type: 'answer_scenario', scenarioId: again.s.id, choiceIndex: again.i });
  assert.equal(four.result.dmg, 23); assert.equal(four.result.rileyHalved, true); assert.equal(p.ethics, 7);
  assert.throws(() => run(p, { type: 'answer_scenario', scenarioId: again.s.id, choiceIndex: 99 }), /not open|Choose/);
});

test('three wrong answers in a row disbar a fresh attorney and the envelope reports the ended run', () => {
  const p = office();
  let ended = false;
  for (let i = 0; i < 3; i++) {
    const { s, i: idx } = scenario(p, 'wrong');
    ended = run(p, { type: 'answer_scenario', scenarioId: s.id, choiceIndex: idx }, 5000 + i).ended;
  }
  assert.equal(ended, true); assert.equal(p.runStatus, 'ended'); assert.equal(p.ethics, 0); assert.equal(p.endedAt, 5002);
  assert.throws(() => run(p, { type: 'rest' }), /ended/);
});

test('Canada questions apply the full economy, count toward their pack and accept the old pack id', () => {
  const p = office(); p.practicePack = 'canada';
  const { s, i } = scenario(p, 'correct');
  assert.equal(s.sourceType, 'canada-style'); assert.ok(s.gold >= 35);
  const out = run(p, { type: 'answer_scenario', scenarioId: s.id, choiceIndex: i });
  assert.equal(out.result.earned, s.gold); assert.equal(p.gold, s.gold); assert.equal(p.packCorrect.canada, 1); assert.equal(p.streak, 1);
  const wrong = scenario(p, 'wrong');
  run(p, { type: 'answer_scenario', scenarioId: wrong.s.id, choiceIndex: wrong.i });
  assert.equal(p.ethics, 70); assert.equal(p.streak, 0);
  assert.equal(run(p, { type: 'set_practice_pack', id: 'canada-test' }).result.id, 'canada');
  assert.equal(freshState().practicePack, 'juris', 'new attorneys start on the LawScape originals');
});

test('consecutive correct answers multiply gold up to x1.5 and a wrong answer resets the bonus', () => {
  const p = office(); p.practicePack = 'mixed'; p.casesDone = 12;
  for (const expected of [1, 1.1, 1.2, 1.3, 1.4, 1.5, 1.5]) {
    const { s, i } = scenario(p, 'correct');
    const out = run(p, { type: 'answer_scenario', scenarioId: s.id, choiceIndex: i });
    assert.equal(out.result.multiplier, expected); assert.equal(out.result.earned, Math.round(s.gold * expected));
  }
  p.upgrades.push('monitor');
  const boosted = scenario(p, 'correct');
  assert.equal(run(p, { type: 'answer_scenario', scenarioId: boosted.s.id, choiceIndex: boosted.i }).result.earned, Math.round(boosted.s.gold * 1.15 * 1.5));
  const wrong = scenario(p, 'wrong');
  run(p, { type: 'answer_scenario', scenarioId: wrong.s.id, choiceIndex: wrong.i });
  const reset = scenario(p, 'correct');
  assert.equal(run(p, { type: 'answer_scenario', scenarioId: reset.s.id, choiceIndex: reset.i }).result.multiplier, 1);
});

test('five correct SQE answers grant the powdered wig once, owned but not worn', () => {
  const p = office(); p.practicePack = 'sqe'; p.casesDone = 12;
  const granted = [];
  for (let n = 0; n < 6; n++) {
    const { s, i } = scenario(p, 'correct');
    granted.push(run(p, { type: 'answer_scenario', scenarioId: s.id, choiceIndex: i }).result.unlocked);
  }
  assert.deepEqual(granted, [[], [], [], [], ['wig-powdered'], []]);
  assert.equal(p.packCorrect.sqe, 6);
  assert.ok(p.apprenticeship.cosmetics.includes('wig-powdered')); assert.ok(!p.apprenticeship.equipped.includes('wig-powdered'));
  assert.equal(run(p, { type: 'apprenticeship_equip', id: 'wig-powdered', worn: true }).result.worn, true);
  assert.deepEqual(p.apprenticeship.equipped, ['wig-powdered']);
});

test('arriving at the firm or court impaired costs 10 Ethics once per drink; home, the street and the lounge are safe', () => {
  const p = freshState(); p.zone = 'sidebar'; p.gold = 20;
  run(p, { type: 'bar_drink', id: 'ale' }, 1000);
  assert.equal(run(p, { type: 'set_zone', zone: 'street' }, 1500).result.ethicsLost, 0);
  assert.equal(run(p, { type: 'set_zone', zone: 'apartment' }, 2000).result.ethicsLost, 0);
  const office = run(p, { type: 'set_zone', zone: 'office' }, 3000);
  assert.deepEqual(office.result, { zone: 'office', ethicsLost: 10, disbarred: false }); assert.equal(p.ethics, 90);
  assert.equal(run(p, { type: 'set_zone', zone: 'corner_office' }, 4000).result.ethicsLost, 0, 'one charge per drink');
  p.zone = 'sidebar'; run(p, { type: 'bar_drink', id: 'ale' }, 5000);
  assert.equal(run(p, { type: 'set_zone', zone: 'office' }, 6000).result.ethicsLost, 10); assert.equal(p.ethics, 80);
  assert.equal(run(p, { type: 'set_zone', zone: 'courtroom' }, 50_000).result.ethicsLost, 0, 'sober again');
  p.ethics = 10; p.zone = 'sidebar'; run(p, { type: 'bar_drink', id: 'ale' }, 60_000);
  const out = run(p, { type: 'set_zone', zone: 'courtroom' }, 61_000);
  assert.equal(out.result.disbarred, true); assert.equal(out.ended, true); assert.equal(p.runStatus, 'ended');
});

test('the office espresso machine heals on a cooldown and sobers an impaired attorney', () => {
  const p = office();
  assert.throws(() => run(p, { type: 'espresso' }, 1000), /espresso machine/);
  p.upgrades.push('espresso'); p.ethics = 50;
  p.zone = 'sidebar'; assert.throws(() => run(p, { type: 'espresso' }, 1000), /main office/); p.zone = 'office';
  assert.deepEqual(run(p, { type: 'espresso' }, 1000).result, { healed: 5, sobered: false }); assert.equal(p.ethics, 55);
  assert.throws(() => run(p, { type: 'espresso' }, 31_000), /heating up/);
  assert.equal(run(p, { type: 'espresso' }, 91_000).result.healed, 5);
  p.ethics = 100; assert.throws(() => run(p, { type: 'espresso' }, 200_000), /already full/);
  p.slowUntil = 250_000;
  const out = run(p, { type: 'espresso' }, 200_000);
  assert.equal(out.result.sobered, true); assert.equal(p.slowUntil, 200_000); assert.equal(p.ethics, 100);
});

test('Briefcase Dash costs 5 gold for three rounds and credits are consumed per run', () => {
  const p = freshState(); p.zone = 'office'; p.gold = 10;
  assert.throws(() => run(p, { type: 'arcade_play' }), /Sidebar/);
  p.zone = 'sidebar'; p.gold = 3; assert.throws(() => run(p, { type: 'arcade_play' }), /need 5 gold/);
  p.gold = 10; assert.deepEqual(run(p, { type: 'arcade_play' }).result, { cost: 5, credits: 3 }); assert.equal(p.gold, 5);
  assert.throws(() => run(p, { type: 'arcade_play' }), /still have credits/);
  for (const left of [2, 1, 0]) assert.equal(run(p, { type: 'arcade_round' }).result.credits, left);
  assert.throws(() => run(p, { type: 'arcade_round' }), /Insert 5 gold/);
  assert.equal(p.gold, 5);
});

test('pet adoption happens once, from the apartment, with a sanitised name', () => {
  const p = freshState(); p.zone = 'office'; p.gold = 5000;
  assert.throws(() => run(p, { type: 'adopt_pet', kind: 'dog', name: 'Rex' }), /apartment/);
  p.zone = 'apartment';
  assert.throws(() => run(p, { type: 'adopt_pet', kind: 'dragon', name: 'Rex' }), /cat or a dog/);
  p.gold = 100; assert.throws(() => run(p, { type: 'adopt_pet', kind: 'dog', name: 'Rex' }), /2000 gold/);
  p.gold = 5000;
  const out = run(p, { type: 'adopt_pet', kind: 'dog', name: `  ${'A'.repeat(30)}  ` });
  assert.equal(out.result.name, 'A'.repeat(24)); assert.equal(out.result.cost, 2000); assert.equal(p.gold, 3000); assert.equal(p.pet.kind, 'dog');
  assert.throws(() => run(p, { type: 'adopt_pet', kind: 'cat', name: 'Two' }), /already/);
  const q = freshState(); q.zone = 'apartment'; q.gold = 2000;
  assert.equal(run(q, { type: 'adopt_pet', kind: 'cat', name: '   ' }).result.name, 'Counsel');
  assert.equal(normalizeSave({ pet: { kind: 'dragon', name: 'x' } }).pet, null);
  assert.deepEqual(normalizeSave({ pet: { kind: 'cat', name: '  Tabby  Cat ', adoptedAt: 'x' } }).pet, { kind: 'cat', name: 'Tabby Cat', adoptedAt: 0 });
});

test('upgrades deduct gold, add Ethics capacity and refuse duplicates, and a failed purchase leaves state untouched', () => {
  const p = office(100); p.ethics = 100;
  const snapshot = JSON.stringify(p);
  assert.throws(() => run(p, { type: 'buy_upgrade', id: 'paralegal' }), /need 2000 gold/);
  assert.equal(JSON.stringify(p), snapshot);
  run(p, { type: 'buy_upgrade', id: 'mattress' });
  assert.equal(p.gold, 20); assert.equal(p.ethics, 120); assert.deepEqual(p.upgrades, ['mattress']);
  assert.throws(() => run(p, { type: 'buy_upgrade', id: 'mattress' }), /already own/);
  assert.throws(() => run(p, { type: 'buy_upgrade', id: 'nope' }), /Unknown upgrade/);
});

test('the Moneybags theft caps Ethics at 50 and the third purchase afterwards triggers the audit', () => {
  const p = office(0); p.zone = 'corner_office';
  const out = run(p, { type: 'take_moneybags' });
  assert.equal(out.result.disbarred, false); assert.equal(p.gold, MONEYBAGS_SAFE_GOLD); assert.equal(p.ethics, 1);
  assert.throws(() => run(p, { type: 'take_moneybags' }), /empty/);
  const results = ['monitor', 'mattress', 'coffee'].map((id) => run(p, { type: 'buy_upgrade', id }));
  assert.deepEqual(results.map((r) => r.result.escaped), [1, 2, 2]);
  assert.equal(results[2].result.audit, true); assert.equal(results[2].ended, true); assert.equal(p.ethics, 0);
});

test('rest, coffee and meals respect cooldowns, upgrades, zones and full Ethics', () => {
  const p = freshState(); p.zone = 'apartment'; p.gold = 20; p.ethics = 40;
  assert.throws(() => run({ ...p, zone: 'office' }, { type: 'rest' }), /apartment/);
  assert.equal(run(p, { type: 'rest' }, 250_000).result.healed, 15);
  assert.throws(() => run(p, { type: 'rest' }, 250_000 + 60_000), /Rest again in 180s/);
  assert.equal(run(p, { type: 'rest' }, 250_000 + 240_000).result.healed, 15);
  assert.throws(() => run(p, { type: 'coffee' }), /Coffee Machine/);
  p.upgrades.push('coffee');
  assert.equal(run(p, { type: 'coffee' }).result.healed, 2);
  assert.equal(run(p, { type: 'eat', item: 'ramen' }).result.healed, 5); assert.equal(p.gold, 15);
  assert.throws(() => run(p, { type: 'eat', item: 'meal' }), /Kitchen/);
  p.upgrades.push('kitchen');
  assert.throws(() => run(p, { type: 'eat', item: 'ramen' }), /Cook a meal/);
  assert.equal(run(p, { type: 'eat', item: 'meal' }).result.healed, 30);
  p.gold = 200; p.ethics = 200; run(p, { type: 'buy_upgrade', id: 'mattress' });
  p.ethics = 130;
  assert.throws(() => run(p, { type: 'eat', item: 'meal' }), /already full/);
  assert.throws(() => run(p, { type: 'coffee' }), /already full/);
  assert.throws(() => run(p, { type: 'rest' }, 10_000_000), /spotless/);
});

test('document review pays once per elapsed minute from the server clock and keeps its cadence', () => {
  const p = office();
  assert.throws(() => run(p, { type: 'doc_review_cycle' }), /not active/);
  assert.throws(() => run({ ...p, zone: 'sidebar' }, { type: 'doc_review_start' }), /main office/);
  run(p, { type: 'doc_review_start' }, 10_000);
  assert.equal(run(p, { type: 'doc_review_start' }, 20_000).result.resumed, true);
  assert.equal(run(p, { type: 'doc_review_cycle' }, 10_000 + DOC_REVIEW_CYCLE_MS - 1).result.cycles, 0);
  const paid = run(p, { type: 'doc_review_cycle' }, 10_000 + DOC_REVIEW_CYCLE_MS + 500);
  assert.equal(paid.result.cycles, 1); assert.equal(p.gold, DOC_REVIEW_REWARD); assert.equal(p.lastDocReviewAt, 10_000 + DOC_REVIEW_CYCLE_MS);
  const late = run(p, { type: 'doc_review_cycle' }, 10_000 + 3 * DOC_REVIEW_CYCLE_MS + 10);
  assert.equal(late.result.cycles, 2); assert.equal(p.documentsReviewed, 3); assert.equal(p.gold, 3 * DOC_REVIEW_REWARD);
  assert.equal(run(p, { type: 'doc_review_stop' }).result.wasActive, true); assert.equal(p.docReviewStartedAt, 0);
});

test('study ticks are clamped to elapsed time and a hard cap, and stop after the run ends', () => {
  const p = office();
  assert.equal(run(p, { type: 'study_tick', ms: 50 }, 1000).result.credited, 50);
  assert.equal(run(p, { type: 'study_tick', ms: 50 }, 1040).result.credited, 50);
  assert.equal(run(p, { type: 'study_tick', ms: 60_000 }, 2040).result.credited, 1350);
  assert.equal(run(p, { type: 'study_tick', ms: 60_000 }, 102_040).result.credited, STUDY_TICK_MAX_MS);
  assert.equal(p.billableStudyMs, 50 + 50 + 1350 + STUDY_TICK_MAX_MS);
  assert.throws(() => run(p, { type: 'study_tick', ms: -1 }, 200_000), /Invalid/);
  p.runStatus = 'ended';
  assert.equal(run(p, { type: 'study_tick', ms: 50 }, 300_000).result.credited, 0);
});

test('hints and tips are paid once with the right prerequisites', () => {
  const p = office(500);
  const { s } = scenario(p, 'correct');
  assert.throws(() => run(p, { type: 'buy_hint', scenarioId: s.id }), /Riley needs/);
  p.upgrades.push('paralegal', 'subscription');
  assert.equal(run(p, { type: 'buy_hint', scenarioId: s.id }).result.rule, s.rule);
  assert.equal(p.gold, 500 - RILEY_HINT_COST); assert.equal(p.hintScenarioId, s.id);
  assert.throws(() => run(p, { type: 'buy_hint', scenarioId: s.id }), /already researched/);
  const tip = run(p, { type: 'buy_tip' }, 1, () => 0.99);
  assert.equal(tip.result.tipIndex, 7); assert.equal(p.gold, 500 - RILEY_HINT_COST - LINDA_TIP_COST); assert.equal(p.tipsPurchased, 1);
  p.gold = 0;
  assert.throws(() => run(p, { type: 'buy_tip' }), /Come back with/);
});

test('whiskey is a single impairing drink in Jim’s office and bar drinks only slow', () => {
  const p = freshState(); p.zone = 'corner_office'; p.gold = 10;
  const out = run(p, { type: 'drink_whiskey' }, 1000);
  assert.equal(p.ethics, 98); assert.equal(out.result.slowUntil, 41_000); assert.equal(p.slowUntil, 41_000);
  assert.throws(() => run(p, { type: 'drink_whiskey' }, 2000), /warning sign/);
  p.zone = 'sidebar';
  const ale = run(p, { type: 'bar_drink', id: 'ale' }, 50_000);
  assert.equal(ale.result.slows, true); assert.equal(p.slowUntil, 90_000); assert.equal(p.ethics, 98); assert.equal(p.gold, 7);
});

test('every non-trivial action settles due partner replies first and reports them', () => {
  const p = office(); p.apprenticeship.drafts[WRITING_TASKS[0].id] = { text: 'A reply.', issue: WRITING_TASKS[0].issue, action: WRITING_TASKS[0].action, evidence: WRITING_TASKS[0].evidence };
  run(p, { type: 'apprenticeship_commit', taskId: WRITING_TASKS[0].id }, 1000);
  assert.throws(() => run(p, { type: 'buy_upgrade', id: 'monitor' }, 1000), /partner/);
  assert.equal(run(p, { type: 'settle' }, 1000 + PARTNER_DELAY_MS - 1).delivered.length, 0);
  const out = run(p, { type: 'hr_email', category: 'bug' }, 1000 + PARTNER_DELAY_MS);
  assert.equal(out.delivered.length, 1); assert.equal(p.gold, 40); assert.equal(out.result.ticket, '0001');
  assert.equal(run(p, { type: 'settle' }, 99_999).delivered.length, 0);
});

test('creating a character resets everything except the supplied identity', () => {
  const p = office(900); p.upgrades.push('monitor'); p.runStatus = 'ended';
  const out = run(p, { type: 'create_character', name: '  Jordan Case ', gender: 'female', appearance: { skin: 3, glasses: true, suitColor: 'nope' } }, 7, undefined);
  assert.equal(out.result.name, 'Jordan Case'); assert.equal(p.gold, 0); assert.deepEqual(p.upgrades, []); assert.equal(p.runStatus, 'active');
  assert.equal(p.skin, 3); assert.equal(p.glasses, true); assert.equal(p.suitColor, '#1f3a5f'); assert.equal(p.gender, 'female');
  assert.equal(run(p, { type: 'set_appearance', key: 'glasses', value: false }).result.value, false);
  assert.throws(() => run(p, { type: 'set_appearance', key: 'gold', value: 9 }), /Unknown appearance/);
  assert.throws(() => run(p, { type: 'set_zone', zone: 'moon' }), /Unknown location/);
  assert.equal(run(p, { type: 'set_practice_pack', id: 'bogus' }).result.id, 'mixed');
});

test('normalizeSave repairs new fields, replaceState preserves client-only keys and local seeds carry identity only', () => {
  const next = normalizeSave({ schemaVersion: 5, gold: 12, docReviewStartedAt: -5, hintScenarioId: 7, pos: 'x' });
  assert.equal(next.schemaVersion, 7); assert.equal(next.docReviewStartedAt, 0); assert.equal(next.hintScenarioId, null); assert.deepEqual(next.pos, { x: 6, y: 10 });
  assert.equal(normalizeSave({ schemaVersion: 8 }), null);
  assert.equal(normalizeSave({ practicePack: 'canada-test' }).practicePack, 'canada');
  assert.deepEqual(normalizeSave({ packCorrect: [1], arcadeCredits: -2 }).packCorrect, {});
  replaceState(freshState()); state.pos = { x: 1, y: 2 };
  replaceState({ ...freshState(), gold: 5, pos: { x: 9, y: 9 } }, { preserve: ['pos'] });
  assert.equal(state.gold, 5); assert.deepEqual(state.pos, { x: 1, y: 2 });
  const items = new Map([['lawscape_save_v2', JSON.stringify({ name: 'Seed Name', gender: 'male', gold: 9999, skin: 2, upgrades: ['paralegal'] })]]);
  globalThis.localStorage = { getItem: (k) => items.get(k) ?? null, setItem: (k, v) => items.set(k, v), removeItem: (k) => items.delete(k) };
  try {
    const seed = readLocalSeed();
    assert.equal(seed.name, 'Seed Name'); assert.equal(seed.skin, 2); assert.equal('gold' in seed, false); assert.equal('upgrades' in seed, false);
    setPersistence('server');
    assert.equal(persistenceMode(), 'server'); assert.equal(save(), true);
    assert.equal(JSON.parse(items.get('lawscape_save_v2')).gold, 9999, 'server mode must not write the local save');
  } finally { setPersistence('local'); delete globalThis.localStorage; }
});

test('rule modules never read the browser clock or storage at import time', async () => {
  for (const file of ['js/economy.js', 'js/actions.js', 'js/apprenticeship.js', 'js/canada.js', 'js/lounge.js', 'js/data/mail.js', 'js/data/work.js', 'js/data/upgrades.js']) {
    const source = await readFile(new URL(`../${file}`, import.meta.url), 'utf8');
    assert.equal(source.includes('Date.now('), false, `${file} reads Date.now`);
    for (const line of source.split('\n')) {
      if (line.includes('localStorage')) assert.match(line, /^\s/, `${file} touches localStorage at module scope`);
    }
  }
});
