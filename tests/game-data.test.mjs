import test from 'node:test';
import assert from 'node:assert/strict';

import { SCENARIOS } from '../js/data/ethics.js';
import { state, reset, damageEthics, healEthics } from '../js/state.js';

test('ethics scenario identifiers are unique and every scenario is playable', () => {
  assert.equal(new Set(SCENARIOS.map((scenario) => scenario.id)).size, SCENARIOS.length);
  assert.ok(SCENARIOS.length >= 20);

  for (const scenario of SCENARIOS) {
    assert.ok(scenario.subject);
    assert.ok(scenario.body);
    assert.ok(scenario.rule);
    assert.ok(scenario.gold > 0);
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
  }
});

test('reset keeps a stable state reference and restores a new attorney', () => {
  const originalReference = state;
  state.gold = 500;
  state.ethics = 40;
  reset();
  assert.equal(state, originalReference);
  assert.equal(state.gold, 0);
  assert.equal(state.ethics, 100);
});

test('ethics health remains within its allowed range', () => {
  reset();
  assert.equal(damageEthics(150), true);
  assert.equal(state.ethics, 0);
  healEthics(500);
  assert.equal(state.ethics, 100);
});
