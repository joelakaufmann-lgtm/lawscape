import test from 'node:test';
import assert from 'node:assert/strict';
import { freshState } from '../js/state.js';
import { applyAction } from '../js/actions.js';
import { ALL_MAIL_SCENARIOS, practiceInbox } from '../js/data/mail.js';
import { OFFICE_UPGRADES, APARTMENT_UPGRADES } from '../js/data/upgrades.js';
import { DOC_REVIEW_CYCLE_MS, RAMEN_ETHICS_RESTORE, COOKED_MEAL_ETHICS_RESTORE } from '../js/data/work.js';
import { legacyAnswer, legacyBuy, legacyRest, legacyCoffee, legacyEat, legacyMoneybags, legacyWhiskey, legacyDocCycles, legacyTip, legacyHint, legacyHr } from './helpers/legacy-oracle.mjs';

function mulberry32(seed) {
  return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}
const ECONOMY_KEYS = ['gold', 'ethics', 'streak', 'wrongStreak', 'casesDone', 'correctDone', 'seen', 'upgrades', 'moneybagsStolen', 'moneybagsPurchases', 'runStatus', 'documentsReviewed', 'whiskeyDrinks', 'slowUntil', 'lastRestAt', 'tipsPurchased', 'hintsPurchased', 'hrEmailsSent'];
const pick = (list) => list.map((item) => item);
const upgrades = [...OFFICE_UPGRADES, ...APARTMENT_UPGRADES].map((u) => u.id);

test('the shared reducer reproduces the 0.6.0 inline economy across seeded action sequences', () => {
  for (let seed = 1; seed <= 200; seed++) {
    const rng = mulberry32(seed);
    const live = freshState(), oracle = JSON.parse(JSON.stringify(live));
    live.gold = oracle.gold = 300 + Math.floor(rng() * 3000);
    let now = 1_000_000;
    const act = (action) => { try { return applyAction(live, action, { now, rng: () => 0 }); } catch { return null; } };
    for (let step = 0; step < 40 && live.runStatus !== 'ended'; step++) {
      const roll = rng();
      now += Math.floor(rng() * 300_000);
      if (roll < 0.45) {
        const unread = practiceInbox(live, ALL_MAIL_SCENARIOS).unread.filter((s) => !s.isTestPack);
        if (!unread.length) { act({ type: 'reset_seen' }); continue; }
        const s = unread[Math.floor(rng() * unread.length)];
        const choiceIndex = Math.floor(rng() * s.choices.length);
        live.zone = oracle.zone = 'office';
        act({ type: 'answer_scenario', scenarioId: s.id, choiceIndex });
        legacyAnswer(oracle, s, s.choices[choiceIndex]);
      } else if (roll < 0.6) {
        const id = upgrades[Math.floor(rng() * upgrades.length)];
        act({ type: 'buy_upgrade', id });
        legacyBuy(oracle, id);
      } else if (roll < 0.68) {
        live.zone = oracle.zone = 'apartment';
        act({ type: 'rest' }); legacyRest(oracle, now);
      } else if (roll < 0.74) {
        live.zone = oracle.zone = 'apartment';
        act({ type: 'coffee' }); legacyCoffee(oracle);
      } else if (roll < 0.8) {
        live.zone = oracle.zone = 'apartment';
        const kitchen = live.upgrades.includes('kitchen');
        act({ type: 'eat', item: kitchen ? 'meal' : 'ramen' });
        legacyEat(oracle, kitchen ? COOKED_MEAL_ETHICS_RESTORE : RAMEN_ETHICS_RESTORE);
      } else if (roll < 0.84) {
        live.zone = oracle.zone = 'corner_office';
        act({ type: 'take_moneybags' }); legacyMoneybags(oracle);
      } else if (roll < 0.88) {
        live.zone = oracle.zone = 'corner_office';
        act({ type: 'drink_whiskey' }); legacyWhiskey(oracle, now);
      } else if (roll < 0.94) {
        live.zone = oracle.zone = 'office';
        const cycles = 1 + Math.floor(rng() * 3);
        act({ type: 'doc_review_start' });
        now += cycles * DOC_REVIEW_CYCLE_MS + 1;
        act({ type: 'doc_review_cycle' });
        act({ type: 'doc_review_stop' });
        legacyDocCycles(oracle, cycles * DOC_REVIEW_CYCLE_MS + 1);
      } else if (roll < 0.97) {
        if (live.upgrades.includes('paralegal') && !live.moneybagsStolen) { act({ type: 'buy_tip' }); legacyTip(oracle); }
      } else {
        act({ type: 'hr_email', category: 'bug' }); legacyHr(oracle);
      }
      const liveView = Object.fromEntries(ECONOMY_KEYS.map((k) => [k, live[k]]));
      const oracleView = Object.fromEntries(ECONOMY_KEYS.map((k) => [k, oracle[k]]));
      assert.deepEqual(liveView, oracleView, `seed ${seed} step ${step}`);
    }
    assert.ok(live.casesDone >= 0);
  }
});

test('hint purchases match the legacy deduction when Riley is eligible', () => {
  const live = freshState(); live.gold = 500; live.upgrades = ['paralegal', 'subscription']; live.zone = 'office';
  const oracle = JSON.parse(JSON.stringify(live));
  const s = practiceInbox(live, ALL_MAIL_SCENARIOS).unread[0];
  applyAction(live, { type: 'buy_hint', scenarioId: s.id }, { now: 5 });
  legacyHint(oracle);
  assert.equal(live.gold, oracle.gold); assert.equal(live.hintsPurchased, oracle.hintsPurchased);
  assert.throws(() => applyAction(live, { type: 'buy_hint', scenarioId: s.id }, { now: 6 }), /already researched/);
  assert.equal(pick([1]).length, 1);
});
