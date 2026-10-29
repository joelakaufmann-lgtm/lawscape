// Briefcase Dash — the Sidebar arcade cabinet. Pure game rules live here so
// they can be tested without a canvas; js/ui/arcade.js draws and drives them.
//
// The attorney walks to the office. Caterpillars crawl along the sidewalk
// (jump them); butterflies flutter at head height (duck) or just above it
// (stay on the ground). Distance is in metres; reaching the office wins.

export const ARCADE = {
  title: 'Briefcase Dash',
  goalMeters: 1000,
  pxPerMeter: 20,
  startSpeed: 230,     // px per second
  maxSpeed: 430,
  accel: 6,            // px per second, per second
  gravity: 1500,
  jumpVelocity: 470,
  standHeight: 34,
  duckHeight: 19,
  playerX: 70,
  playerWidth: 16,
};

// Small deterministic PRNG so a seed reproduces a whole run in tests.
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function newArcadeRun(seed = Date.now()) {
  return {
    status: 'ready',      // 'ready' | 'running' | 'crashed' | 'arrived'
    time: 0,
    distance: 0,          // px travelled
    speed: ARCADE.startSpeed,
    y: 0,                 // feet height above the sidewalk
    vy: 0,
    ducking: false,
    obstacles: [],
    nextSpawn: 520,       // px of travel until the next obstacle
    hit: null,
    random: rng(seed),
  };
}

export function arcadeMeters(run) {
  return Math.min(ARCADE.goalMeters, Math.floor(run.distance / ARCADE.pxPerMeter));
}

export function playerBox(run) {
  const height = run.ducking && run.y === 0 ? ARCADE.duckHeight : ARCADE.standHeight;
  return { x: ARCADE.playerX + 2, y: run.y, w: ARCADE.playerWidth - 4, h: height - 2 };
}

function spawn(run, worldWidth) {
  const roll = run.random();
  const meters = arcadeMeters(run);
  // Butterflies join once the walk is under way.
  if (meters > 60 && roll < 0.22) {
    run.obstacles.push({ kind: 'butterfly', low: true, x: worldWidth + 20, y: 24, w: 14, h: 10, phase: run.random() * 6 });
  } else if (meters > 120 && roll < 0.36) {
    run.obstacles.push({ kind: 'butterfly', low: false, x: worldWidth + 20, y: 44, w: 14, h: 10, phase: run.random() * 6 });
  } else {
    const long = meters > 250 && run.random() < 0.35;
    run.obstacles.push({ kind: 'caterpillar', x: worldWidth + 20, y: 0, w: long ? 34 : 24, h: 11, phase: run.random() * 6 });
  }
  // Gap scales with speed so a landing always leaves time to react.
  const minGap = run.speed * 1.1;
  run.nextSpawn = minGap + run.random() * run.speed * 0.9;
}

function overlaps(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

// Advance the run by dt seconds. `input` is { jump, duck } for this frame.
export function stepArcade(run, dt, input = {}, worldWidth = 640) {
  if (run.status === 'ready' && input.jump) run.status = 'running';
  if (run.status !== 'running') return run;
  dt = Math.min(dt, 0.05);
  run.time += dt;
  run.speed = Math.min(ARCADE.maxSpeed, run.speed + ARCADE.accel * dt);

  if (input.jump && run.y === 0) run.vy = ARCADE.jumpVelocity;
  run.ducking = Boolean(input.duck);
  // Holding duck mid-air drops you faster, like the classics.
  const gravity = ARCADE.gravity * (run.ducking && run.y > 0 ? 2.2 : 1);
  run.vy -= gravity * dt;
  run.y = Math.max(0, run.y + run.vy * dt);
  if (run.y === 0 && run.vy < 0) run.vy = 0;

  const travel = run.speed * dt;
  run.distance += travel;
  run.nextSpawn -= travel;
  const goalPx = ARCADE.goalMeters * ARCADE.pxPerMeter;
  // Stop spawning near the office so the finish is clear.
  if (run.nextSpawn <= 0 && run.distance < goalPx - worldWidth) spawn(run, worldWidth);

  for (const o of run.obstacles) {
    o.x -= travel + (o.kind === 'butterfly' ? 40 * dt : 0);
    o.phase += dt * (o.kind === 'butterfly' ? 14 : 6);
  }
  run.obstacles = run.obstacles.filter((o) => o.x + o.w > -20);

  const me = playerBox(run);
  for (const o of run.obstacles) {
    const bob = o.kind === 'butterfly' ? Math.sin(o.phase * 0.35) * 3 : 0;
    const box = { x: o.x + 2, y: o.y + bob + 1, w: o.w - 4, h: o.h - 2 };
    if (overlaps(me, box)) {
      run.status = 'crashed';
      run.hit = o.kind;
      return run;
    }
  }
  if (run.distance >= goalPx) {
    run.distance = goalPx;
    run.status = 'arrived';
  }
  return run;
}

// ---- Local best (per browser, like the billable-hours board) ---------------
const BEST_KEY = 'lawscape_arcade_best_v1';
let sessionBest = 0;

export function readArcadeBest() {
  try {
    const saved = Number.parseInt(localStorage.getItem(BEST_KEY) || '0', 10);
    if (Number.isFinite(saved) && saved > sessionBest) sessionBest = saved;
  } catch { /* storage unavailable: keep the session value */ }
  return sessionBest;
}

export function recordArcadeScore(meters) {
  const best = readArcadeBest();
  if (!Number.isFinite(meters) || meters <= best) return { best, isNew: false };
  sessionBest = Math.floor(meters);
  try { localStorage.setItem(BEST_KEY, String(sessionBest)); } catch { /* session only */ }
  return { best: sessionBest, isNew: true };
}
