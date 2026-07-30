import test from 'node:test';
import assert from 'node:assert/strict';

import { SCENARIOS } from '../js/data/ethics.js';
import { RULE_LIBRARY } from '../js/data/rules.js';
import {
  COFFEE_ETHICS_RESTORE,
  DOC_REVIEW_CYCLE_MS,
  DOC_REVIEW_REWARD,
  LINDA_TIP_COST,
  RILEY_HINT_COST,
  WHISKEY_ETHICS_DAMAGE,
  WHISKEY_SLOW_MS,
  LAWYER_ASSISTANCE_PHONE,
  LAWYER_ASSISTANCE_URL,
  rileyHintEligible,
  wrongAnswerDamage,
} from '../js/data/work.js';
import { OFFICE_UPGRADES, APARTMENT_UPGRADES, bonuses } from '../js/data/upgrades.js';
import { state, reset, damageEthics, healEthics, maxEthics } from '../js/state.js';

test('ethics scenario identifiers are unique and every scenario is playable', () => {
  assert.equal(new Set(SCENARIOS.map((scenario) => scenario.id)).size, SCENARIOS.length);
  assert.equal(SCENARIOS.length, 118);

  for (const scenario of SCENARIOS) {
    assert.ok(scenario.subject);
    assert.ok(scenario.body);
    assert.ok(scenario.rule);
    assert.ok(scenario.gold > 0);
    assert.ok([1, 2, 3].includes(scenario.difficulty));
    assert.ok(scenario.choices.length >= 2);
    assert.equal(
      scenario.choices.filter((choice) => choice.grade === 'correct').length,
      1,
      `${scenario.id} should have exactly one correct choice`,
    );
    for (const choice of scenario.choices) {
      assert.ok(['correct', 'wrong', 'very_wrong'].includes(choice.grade));
      if (choice.grade !== 'correct') assert.ok(choice.why);
    }
    if (scenario.sourceType === 'mpre-style') {
      assert.ok(scenario.sourceNote.includes('not an official NCBE question'));
      assert.match(scenario.sourceUrl, /^https:\/\/www\.ncbex\.org\//);
    }
    if (scenario.sourceType === 'sqe-style') {
      assert.ok(scenario.sourceNote.includes('not an official SRA or Kaplan SQE question'));
      assert.match(scenario.sourceUrl, /^https:\/\/sqe\.sra\.org\.uk\//);
      assert.match(scenario.studyGuideUrl, /^https:\/\/sqe1prep\.co\.uk\//);
      assert.equal(scenario.localSourceFile, 'SQE_Ethics_Email_Scenarios_UK.md');
    }
  }
});

test('difficulty tiers and both exam-style practice packs are available', () => {
  assert.deepEqual(
    [1, 2, 3].map((difficulty) => SCENARIOS.filter((scenario) => scenario.difficulty === difficulty).length),
    [11, 33, 74],
  );
  assert.equal(SCENARIOS.filter((scenario) => scenario.sourceType === 'mpre-style').length, 69);
  assert.equal(SCENARIOS.filter((scenario) => scenario.sourceType === 'sqe-style').length, 28);
  assert.equal(
    SCENARIOS.filter((scenario) => scenario.localSourceFile === 'MPRE_Associate_Email_Scenarios_Additional_20.md').length,
    20,
  );
  assert.equal(
    SCENARIOS.filter((scenario) => scenario.localSourceFile === 'MPRE_Associate_Email_Scenarios_Additional_41.md').length,
    41,
  );
  assert.deepEqual(
    [1, 2, 3].map((difficulty) => SCENARIOS.filter(
      (scenario) => scenario.sourceType === 'sqe-style' && scenario.difficulty === difficulty,
    ).length),
    [4, 10, 14],
  );
});

test('the treatise library includes Nevada, Arizona, and the California reference bundle', () => {
  const nevada = RULE_LIBRARY.find((set) => set.id === 'nevada');
  const arizona = RULE_LIBRARY.find((set) => set.id === 'arizona');
  const california = RULE_LIBRARY.find((set) => set.id === 'california');
  assert.equal(nevada.rules.length, 66);
  assert.equal(nevada.rules.every((rule) => rule.text.length > 0), true);
  assert.equal(arizona.rules.length, 59);
  assert.equal(arizona.rules.filter((rule) => rule.text.length > 0).length, 3);
  assert.equal(california.rules.length, 79);
  assert.equal(california.rules.filter((rule) => rule.text.length > 0).length, 72);
  assert.equal(
    california.rules.filter((rule) => !rule.text).every((rule) => rule.title === '[Reserved]'),
    true,
  );
  assert.deepEqual(
    california.resources.map((resource) => resource.href),
    [
      'California References/rpc.md',
      'California References/opinions-index.md',
      'California References/opinions-full.md',
      'California References/admission-discipline.md',
      'California References/disciplinary-procedure.md',
    ],
  );
});

test('office economy values match the player-facing launch rules', () => {
  assert.equal(DOC_REVIEW_CYCLE_MS, 60_000);
  assert.equal(DOC_REVIEW_REWARD, 5);
  assert.equal(COFFEE_ETHICS_RESTORE, 2);
  assert.equal(LINDA_TIP_COST, 5);
  assert.equal(RILEY_HINT_COST, 100);
  assert.equal(WHISKEY_ETHICS_DAMAGE, 2);
  assert.equal(WHISKEY_SLOW_MS, 40_000);
  assert.equal(LAWYER_ASSISTANCE_PHONE, '866-828-0022');
  assert.match(LAWYER_ASSISTANCE_URL, /^https:\/\/nvbar\.org\//);
  assert.equal(rileyHintEligible([]), false);
  assert.equal(rileyHintEligible(['subscription']), false);
  assert.equal(rileyHintEligible(['paralegal']), false);
  assert.equal(rileyHintEligible(['subscription', 'paralegal']), true);
});

test('upgrade prices and removed upgrades match the revised catalogs', () => {
  const office = Object.fromEntries(OFFICE_UPGRADES.map((upgrade) => [upgrade.id, upgrade]));
  const apartment = Object.fromEntries(APARTMENT_UPGRADES.map((upgrade) => [upgrade.id, upgrade]));
  assert.equal(office.subscription.cost, 250);
  assert.equal(office.liz_chair.cost, 250);
  assert.equal(office.houseplants.cost, 500);
  assert.equal(office.paralegal.cost, 2000);
  assert.equal(office.office_window.cost, 2000);
  assert.equal(office.artwork.cost, 2000);
  assert.equal(office.seating, undefined);
  assert.equal(office.conference, undefined);
  assert.equal(apartment.coffee.cost, 500);
  assert.equal(apartment.homedesk.name, 'Clock');
  assert.equal(bonuses(['monitor', 'cityview']).goldMult, 1.4);
  assert.equal(bonuses(['seating', 'conference']).goldFlat, 0);
});

test('wrong-answer damage escalates and Riley halves every tier', () => {
  assert.deepEqual(
    [1, 2, 3, 4, 5].map((streak) => wrongAnswerDamage(streak)),
    [20, 30, 30, 40, 40],
  );
  assert.deepEqual(
    [1, 2, 3, 4, 5].map((streak) => wrongAnswerDamage(streak, true)),
    [10, 15, 15, 20, 20],
  );
});

test('reset keeps a stable state reference and restores a new attorney', () => {
  const originalReference = state;
  state.gold = 500;
  state.ethics = 40;
  reset();
  assert.equal(state, originalReference);
  assert.equal(state.gold, 0);
  assert.equal(state.ethics, 100);
  assert.equal(state.documentsReviewed, 0);
  assert.equal(state.tipsPurchased, 0);
  assert.equal(state.hintsPurchased, 0);
  assert.equal(state.wrongStreak, 0);
  assert.equal(state.whiskeyDrinks, 0);
  assert.equal(state.practicePack, 'mixed');
});

test('ethics health remains within its allowed range', () => {
  reset();
  assert.equal(damageEthics(150), true);
  assert.equal(state.ethics, 0);
  healEthics(500);
  assert.equal(state.ethics, 100);
});

test('kitchen and Liz chair upgrades each add ten max Ethics', () => {
  reset();
  state.upgrades.push('kitchen');
  assert.equal(maxEthics(), 110);
  state.upgrades.push('liz_chair');
  assert.equal(maxEthics(), 120);
  state.upgrades.push('mattress');
  assert.equal(maxEthics(), 140);
  reset();
});
