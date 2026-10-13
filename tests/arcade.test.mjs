import test from 'node:test';
import assert from 'node:assert/strict';
import { ARCADE, newArcadeRun, stepArcade, arcadeMeters, playerBox, readArcadeBest, recordArcadeScore } from '../js/arcade.js';
import { ZONES } from '../js/world/zones.js';
import { PROPS } from '../js/world/props.js';

test('the Sidebar has a clickable arcade cabinet', () => {
  const cabinet = ZONES.sidebar.props.find((prop) => prop.type === 'arcade');
  assert.ok(cabinet && PROPS.arcade.solid);
  assert.equal(cabinet.interact.action, 'arcade');
});

test('a run waits for the first jump, then walks forward and speeds up', () => {
  const run = newArcadeRun(1);
  stepArcade(run, 0.05, {});
  assert.equal(run.status, 'ready');
  assert.equal(run.distance, 0);
  stepArcade(run, 0.05, { jump: true });
  assert.equal(run.status, 'running');
  assert.ok(run.y > 0, 'the starting press also jumps');
  for (let i = 0; i < 20; i++) stepArcade(run, 0.05, {});
  assert.ok(run.distance > 0 && run.speed > ARCADE.startSpeed);
  assert.equal(run.y, 0, 'gravity lands the walker');
});

test('caterpillars must be jumped and butterflies dodged', () => {
  const standing = newArcadeRun(2); standing.status = 'running'; standing.nextSpawn = 1e9;
  standing.obstacles.push({ kind: 'caterpillar', x: ARCADE.playerX, y: 0, w: 24, h: 11, phase: 0 });
  stepArcade(standing, 0.01, {});
  assert.equal(standing.status, 'crashed');
  assert.equal(standing.hit, 'caterpillar');

  const low = { kind: 'butterfly', low: true, x: ARCADE.playerX, y: 24, w: 14, h: 10, phase: 0 };
  const ducking = newArcadeRun(3); ducking.status = 'running'; ducking.nextSpawn = 1e9;
  ducking.obstacles.push({ ...low });
  stepArcade(ducking, 0.01, { duck: true });
  assert.equal(ducking.status, 'running', 'ducking clears a low butterfly');
  const upright = newArcadeRun(3); upright.status = 'running'; upright.nextSpawn = 1e9;
  upright.obstacles.push({ ...low });
  stepArcade(upright, 0.01, {});
  assert.equal(upright.status, 'crashed');

  const high = newArcadeRun(4); high.status = 'running'; high.nextSpawn = 1e9;
  high.obstacles.push({ kind: 'butterfly', low: false, x: ARCADE.playerX, y: 44, w: 14, h: 10, phase: 0 });
  stepArcade(high, 0.01, {});
  assert.equal(high.status, 'running', 'standing still passes under a high butterfly');
  assert.ok(playerBox(high).h < 44);
});

test('reaching the office ends the run as a win at the goal distance', () => {
  const run = newArcadeRun(5); run.status = 'running';
  run.distance = ARCADE.goalMeters * ARCADE.pxPerMeter - 1; run.obstacles = [];
  stepArcade(run, 0.05, {});
  assert.equal(run.status, 'arrived');
  assert.equal(arcadeMeters(run), ARCADE.goalMeters);
});

test('spawned obstacles always leave room to land and react', () => {
  const run = newArcadeRun(6); run.status = 'running';
  const seen = new Map();
  for (let i = 0; i < 4000 && run.status === 'running'; i++) {
    run.y = 0; run.vy = 0; run.obstacles = run.obstacles.filter((o) => o.x > ARCADE.playerX + 40); // never collide
    stepArcade(run, 1 / 60, {});
    for (const o of run.obstacles) if (!seen.has(o)) seen.set(o, run.distance);
  }
  const spawns = [...seen.values()];
  assert.ok(spawns.length > 10);
  assert.ok(new Set([...seen.keys()].map((o) => o.kind)).size === 2, 'both caterpillars and butterflies appear');
  for (let i = 1; i < spawns.length; i++) assert.ok(spawns[i] - spawns[i - 1] >= ARCADE.startSpeed, 'gaps never shrink below a second of travel');
});

test('the arcade best score persists locally and survives blocked storage', () => {
  const store = new Map();
  globalThis.localStorage = { getItem: (k) => store.get(k) ?? null, setItem: (k, v) => store.set(k, v) };
  try {
    assert.equal(recordArcadeScore(120).isNew, true);
    assert.equal(recordArcadeScore(80).isNew, false);
    assert.equal(readArcadeBest(), 120);
    globalThis.localStorage.setItem = () => { throw new Error('quota'); };
    assert.equal(recordArcadeScore(300).best, 300);
    globalThis.localStorage.getItem = () => { throw new Error('blocked'); };
    assert.equal(readArcadeBest(), 300);
  } finally { delete globalThis.localStorage; }
});
