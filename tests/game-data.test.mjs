import test from 'node:test';
import assert from 'node:assert/strict';

import { SCENARIOS } from '../js/data/ethics.js';
import { RULE_LIBRARY } from '../js/data/rules.js';
import {
  COFFEE_ETHICS_RESTORE,
  APARTMENT_FOOD_COST,
  RAMEN_ETHICS_RESTORE,
  COOKED_MEAL_ETHICS_RESTORE,
  DOC_REVIEW_CYCLE_MS,
  DOC_REVIEW_REWARD,
  LINDA_TIP_COST,
  RILEY_HINT_COST,
  WHISKEY_ETHICS_DAMAGE,
  WHISKEY_SLOW_MS,
  MONEYBAGS_SAFE_GOLD,
  MONEYBAGS_ETHICS_DAMAGE,
  MONEYBAGS_GRACE_PURCHASES,
  LAWYER_ASSISTANCE_PHONE,
  LAWYER_ASSISTANCE_URL,
  formatBillableTime,
  moneybagsAuditTriggered,
  rileyHintEligible,
  wrongAnswerDamage,
} from '../js/data/work.js';
import { OFFICE_UPGRADES, APARTMENT_UPGRADES, bonuses } from '../js/data/upgrades.js';
import {
  HR_CATEGORIES,
  hrIssueUrl,
  hrReportText,
  PROJECT_ISSUES_URL,
} from '../js/data/feedback.js';
import { state, reset, damageEthics, healEthics, maxEthics } from '../js/state.js';

test('ethics scenario identifiers are unique and every scenario is playable', () => {
  assert.equal(new Set(SCENARIOS.map((scenario) => scenario.id)).size, SCENARIOS.length);
  assert.equal(SCENARIOS.length, 171);

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
      assert.equal(scenario.localSourceFile, 'content/questions/england-wales/SQE_Ethics_Email_Scenarios_UK.md');
    }
  }
});

test('difficulty tiers and both exam-style practice packs are available', () => {
  assert.deepEqual(
    [1, 2, 3].map((difficulty) => SCENARIOS.filter((scenario) => scenario.difficulty === difficulty).length),
    [21, 53, 97],
  );
  assert.equal(SCENARIOS.filter((scenario) => scenario.sourceType === 'mpre-style').length, 69);
  assert.equal(SCENARIOS.filter((scenario) => scenario.sourceType === 'sqe-style').length, 28);
  assert.equal(
    SCENARIOS.filter((scenario) => scenario.localSourceFile === 'content/questions/mpre/MPRE_Associate_Email_Scenarios_Additional_20.md').length,
    20,
  );
  assert.equal(
    SCENARIOS.filter((scenario) => scenario.localSourceFile === 'content/questions/mpre/MPRE_Associate_Email_Scenarios_Additional_41.md').length,
    41,
  );
  assert.deepEqual(
    [1, 2, 3].map((difficulty) => SCENARIOS.filter(
      (scenario) => scenario.sourceType === 'sqe-style' && scenario.difficulty === difficulty,
    ).length),
    [4, 10, 14],
  );
});

test('the treatise library also bundles New York, the FLSC Model Code and the SRA Standards verbatim', () => {
  const newYork = RULE_LIBRARY.find((set) => set.id === 'newyork');
  const canada = RULE_LIBRARY.find((set) => set.id === 'canada');
  const sra = RULE_LIBRARY.find((set) => set.id === 'englandwales');
  assert.equal(newYork.rules.length, 60);
  assert.equal(newYork.rules.filter((rule) => rule.text.length > 0).length, 57);
  assert.ok(newYork.rules.filter((rule) => !rule.text).every((rule) => rule.title === '[Reserved]'));
  assert.match(newYork.rules.find((rule) => rule.number === '1.15').text, /must not misappropriate such funds/);
  assert.equal(canada.rules.length, 159);
  assert.ok(canada.rules.every((rule) => rule.text.length > 0 && /^\d\.\d+-\d+/.test(rule.number)));
  assert.match(canada.rules.find((rule) => rule.number === '3.4-1').text, /^A lawyer must not act or continue to act for a client where there is a conflict of interest/);
  assert.match(canada.rules.find((rule) => rule.number === '3.4-1').text, /Commentary/);
  assert.equal(sra.rules.length, 99);
  assert.equal(sra.rules.filter((rule) => rule.number.startsWith('Principle')).length, 7);
  assert.match(sra.rules.find((rule) => rule.number === 'Code 1.4').text, /You do not mislead or attempt to mislead/);
  assert.ok(sra.rules.filter((rule) => rule.number.startsWith('Firms Code')).length > 20);
  for (const set of [newYork, canada, sra]) {
    assert.ok(set.tabLabel && set.citation && set.officialUrl && set.snapshot && set.note, set.id);
    assert.ok(set.rules.every((rule) => rule.url && rule.title), set.id);
    assert.equal(new Set(set.rules.map((rule) => rule.number)).size, set.rules.length, `${set.id} numbers are unique`);
    for (const resource of set.resources) assert.ok(resource.href.startsWith('content/references/'));
  }
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
      'content/references/california/rpc.md',
      'content/references/california/opinions-index.md',
      'content/references/california/opinions-full.md',
      'content/references/california/admission-discipline.md',
      'content/references/california/disciplinary-procedure.md',
    ],
  );
});

test('office economy values match the player-facing launch rules', () => {
  assert.equal(DOC_REVIEW_CYCLE_MS, 60_000);
  assert.equal(DOC_REVIEW_REWARD, 5);
  assert.equal(COFFEE_ETHICS_RESTORE, 2);
  assert.equal(APARTMENT_FOOD_COST, 5);
  assert.equal(RAMEN_ETHICS_RESTORE, 5);
  assert.equal(COOKED_MEAL_ETHICS_RESTORE, 30);
  assert.equal(LINDA_TIP_COST, 5);
  assert.equal(RILEY_HINT_COST, 100);
  assert.equal(WHISKEY_ETHICS_DAMAGE, 2);
  assert.equal(WHISKEY_SLOW_MS, 40_000);
  assert.equal(MONEYBAGS_SAFE_GOLD, 6_000);
  assert.equal(MONEYBAGS_ETHICS_DAMAGE, 99);
  assert.equal(MONEYBAGS_GRACE_PURCHASES, 2);
  assert.equal(LAWYER_ASSISTANCE_PHONE, '866-828-0022');
  assert.match(LAWYER_ASSISTANCE_URL, /^https:\/\/nvbar\.org\//);
  assert.equal(rileyHintEligible([]), false);
  assert.equal(rileyHintEligible(['subscription']), false);
  assert.equal(rileyHintEligible(['paralegal']), false);
  assert.equal(rileyHintEligible(['subscription', 'paralegal']), true);
});

test('billable time formatting and the Moneybags audit threshold are exact', () => {
  assert.equal(formatBillableTime(0), '0:00:00');
  assert.equal(formatBillableTime(3_661_900), '1:01:01');
  assert.equal(moneybagsAuditTriggered(1), false);
  assert.equal(moneybagsAuditTriggered(2), false);
  assert.equal(moneybagsAuditTriggered(3), true);
});

test('upgrade prices and removed upgrades match the revised catalogs', () => {
  const office = Object.fromEntries(OFFICE_UPGRADES.map((upgrade) => [upgrade.id, upgrade]));
  const apartment = Object.fromEntries(APARTMENT_UPGRADES.map((upgrade) => [upgrade.id, upgrade]));
  assert.equal(office.subscription.cost, 250);
  assert.equal(office.liz_chair.cost, 250);
  assert.equal(office.houseplants.cost, 500);
  assert.equal(office.paralegal.cost, 2000);
  assert.equal(office.work_phone.cost, 2000);
  assert.equal(office.snack_fridge.cost, 2000);
  assert.equal(office.artwork, undefined, 'the dot painting was replaced by the snack fridge in 0.9.0');
  assert.equal(office.seating, undefined);
  assert.equal(office.conference, undefined);
  assert.equal(apartment.coffee.cost, 500);
  assert.equal(apartment.homedesk.name, 'Clock');
  assert.equal(bonuses(['monitor', 'cityview']).goldMult, 1.4);
  assert.equal(bonuses(['seating', 'conference']).goldFlat, 0);
});

test('beta wrong-answer damage escalates 30/45/60 and Riley halves every tier', () => {
  assert.deepEqual(
    [1, 2, 3, 4, 5].map((streak) => wrongAnswerDamage(streak)),
    [30, 45, 45, 60, 60],
  );
  assert.deepEqual(
    [1, 2, 3, 4, 5].map((streak) => wrongAnswerDamage(streak, true)),
    [15, 23, 23, 30, 30],
  );
});

test('Email HR formats a prefilled GitHub issue and keeps the no-backend promise', () => {
  assert.equal(PROJECT_ISSUES_URL, 'https://github.com/joelakaufmann-lgtm/lawscape/issues');
  assert.equal(HR_CATEGORIES.length, 3);
  for (const category of HR_CATEGORIES) {
    assert.ok(category.id && category.label && category.titleTag && category.reply);
  }
  const context = {
    version: '0.1.0-beta', zone: 'office', casesDone: 3, ethics: 70,
    ethicsMax: 110, gold: 45, upgrades: 2, userAgent: 'TestBrowser/1.0',
  };
  const report = hrReportText(HR_CATEGORIES[0], 'Coffee machine ate my gold', 'It poured nothing.', context);
  assert.ok(report.includes('It poured nothing.'));
  assert.ok(report.includes('TestBrowser/1.0'));
  assert.ok(report.includes('Ethics: 70/110'));
  const url = hrIssueUrl(HR_CATEGORIES[0], 'Coffee machine ate my gold', 'It poured nothing.', context);
  assert.ok(url.startsWith('https://github.com/joelakaufmann-lgtm/lawscape/issues/new?title='));
  assert.ok(url.includes(encodeURIComponent('[Bug] Coffee machine ate my gold')));
  assert.ok(url.includes(encodeURIComponent('It poured nothing.')));
});

test('reset keeps a stable state reference and restores a new attorney', () => {
  const originalReference = state;
  state.gold = 500;
  state.ethics = 40;
  state.hrEmailsSent = 3;
  reset();
  assert.equal(state, originalReference);
  assert.equal(state.gold, 0);
  assert.equal(state.ethics, 100);
  assert.equal(state.documentsReviewed, 0);
  assert.equal(state.billableStudyMs, 0);
  assert.equal(state.tipsPurchased, 0);
  assert.equal(state.hintsPurchased, 0);
  assert.equal(state.wrongStreak, 0);
  assert.equal(state.whiskeyDrinks, 0);
  assert.equal(state.practicePack, 'juris');
  assert.equal(state.hrEmailsSent, 0);
  assert.equal(state.moneybagsStolen, false);
  assert.equal(state.moneybagsPurchases, 0);
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
  state.moneybagsStolen = true;
  assert.equal(maxEthics(), 50);
  healEthics(500);
  assert.equal(state.ethics, 50);
  reset();
});
