// Briefcase Dash view: draws the runner into a canvas inside the shared panel
// and maps keyboard / touch input onto the pure rules in js/arcade.js.

import { ARCADE, newArcadeRun, stepArcade, arcadeMeters, readArcadeBest, recordArcadeScore } from '../arcade.js';
import { PAL, shade } from '../engine/palette.js';

const W = 640, H = 240, GROUND = 196; // logical canvas size; GROUND is the sidewalk line

export function mountArcade(body, { look = {}, onClose = () => {} } = {}) {
  body.innerHTML = `
    <div class="arcade">
      <div class="arcade-bezel">
        <canvas id="arcade-canvas" width="${W}" height="${H}" aria-label="Briefcase Dash game screen" role="img"></canvas>
      </div>
      <div class="arcade-controls">
        <p class="arcade-help"><kbd>Space</kbd> jump the caterpillars · <kbd>↓</kbd> duck the low butterflies · stay down when one flies high.</p>
        <div class="arcade-touch">
          <button type="button" id="arcade-jump">Jump</button>
          <button type="button" id="arcade-duck">Duck</button>
        </div>
      </div>
      <p id="arcade-status" class="arcade-status" role="status"></p>
    </div>`;

  const canvas = body.querySelector('#arcade-canvas');
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  canvas.width = W * dpr; canvas.height = H * dpr;
  const status = body.querySelector('#arcade-status');

  let run = newArcadeRun();
  let best = readArcadeBest();
  let jumpQueued = false, duckHeld = false, recorded = false;
  let last = performance.now(), raf = 0, scroll = 0;

  const restartOrJump = () => {
    if (run.status === 'crashed' || run.status === 'arrived') { run = newArcadeRun(); recorded = false; }
    jumpQueued = true;
  };
  const onKey = (event) => {
    if (!canvas.isConnected) return;
    const key = event.key;
    const down = event.type === 'keydown';
    if (key === ' ' || key === 'ArrowUp' || key === 'w' || key === 'W') {
      event.preventDefault(); event.stopPropagation();
      if (down && !event.repeat) restartOrJump();
    } else if (key === 'ArrowDown' || key === 's' || key === 'S') {
      event.preventDefault(); event.stopPropagation();
      duckHeld = down;
    }
  };
  // Capture phase so world movement keys never reach the map while playing.
  document.addEventListener('keydown', onKey, true);
  document.addEventListener('keyup', onKey, true);
  canvas.addEventListener('pointerdown', (event) => { event.preventDefault(); restartOrJump(); });
  body.querySelector('#arcade-jump').addEventListener('pointerdown', (event) => { event.preventDefault(); restartOrJump(); });
  const duck = body.querySelector('#arcade-duck');
  duck.addEventListener('pointerdown', (event) => { event.preventDefault(); duckHeld = true; });
  for (const type of ['pointerup', 'pointerleave', 'pointercancel']) duck.addEventListener(type, () => { duckHeld = false; });

  function stop() {
    cancelAnimationFrame(raf);
    document.removeEventListener('keydown', onKey, true);
    document.removeEventListener('keyup', onKey, true);
    onClose();
  }

  function frame(now) {
    // The panel was closed or reused for something else.
    if (!canvas.isConnected || canvas.offsetParent === null) { stop(); return; }
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    const before = run.distance;
    stepArcade(run, dt, { jump: jumpQueued, duck: duckHeld }, W);
    jumpQueued = false;
    scroll += run.distance - before;
    if ((run.status === 'crashed' || run.status === 'arrived') && !recorded) {
      recorded = true;
      const result = recordArcadeScore(arcadeMeters(run));
      best = result.best;
      status.textContent = run.status === 'arrived'
        ? `You made it to the office in ${run.time.toFixed(1)} seconds.${result.isNew ? ' New personal best!' : ''}`
        : `Tripped by a ${run.hit} at ${arcadeMeters(run)} m.${result.isNew ? ' New personal best!' : ''} Press Space to try again.`;
    } else if (run.status === 'ready') {
      status.textContent = 'Press Space or tap Jump to start walking to the office.';
    } else if (run.status === 'running') {
      status.textContent = '';
    }
    draw(ctx, dpr, run, scroll, best, look, now / 1000);
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);
  return { stop };
}

// ---------------------------------------------------------------------------
// Drawing
// ---------------------------------------------------------------------------
function draw(ctx, dpr, run, scroll, best, look, t) {
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const meters = arcadeMeters(run);
  const progress = meters / ARCADE.goalMeters;

  // Morning sky warming as the walk goes on.
  const sky = ctx.createLinearGradient(0, 0, 0, GROUND);
  sky.addColorStop(0, mix('#2c5085', '#5b87a6', progress));
  sky.addColorStop(1, mix('#d8a874', '#f3e2b8', progress));
  ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#f6dc9a'; ctx.beginPath(); ctx.arc(520, 70 - progress * 30, 18, 0, Math.PI * 2); ctx.fill();

  // Parallax skyline, then trees, then the sidewalk.
  skyline(ctx, scroll * 0.15, 150, '#7d8aa0', 40, 11);
  skyline(ctx, scroll * 0.35, 175, '#4f5d73', 64, 7, true);
  for (let i = -1; i < 6; i++) {
    const x = ((i * 150 - scroll * 0.7) % 900 + 900) % 900 - 100;
    tree(ctx, x, GROUND - 2);
  }
  ctx.fillStyle = '#5a7c49'; ctx.fillRect(0, GROUND - 6, W, 6);
  ctx.fillStyle = '#bdb6a6'; ctx.fillRect(0, GROUND, W, H - GROUND);
  ctx.fillStyle = '#a49d8c';
  for (let x = -(scroll % 48); x < W; x += 48) ctx.fillRect(x, GROUND, 1.5, 22);
  ctx.fillStyle = '#8e8778'; ctx.fillRect(0, GROUND + 22, W, 3);
  ctx.fillStyle = '#55524d'; ctx.fillRect(0, GROUND + 25, W, H - GROUND - 25);

  // The office comes into view near the end of the walk.
  const goalPx = ARCADE.goalMeters * ARCADE.pxPerMeter;
  const officeX = ARCADE.playerX + 60 + (goalPx - run.distance);
  if (officeX < W + 10) office(ctx, officeX);

  for (const o of run.obstacles) (o.kind === 'caterpillar' ? caterpillar : butterfly)(ctx, o);
  walker(ctx, run, look, t);

  // HUD strip: progress from home to office, distance and best.
  ctx.fillStyle = '#17141cdd'; ctx.fillRect(0, 0, W, 26);
  ctx.fillStyle = '#e8e4da'; ctx.font = 'bold 12px Georgia'; ctx.textBaseline = 'middle';
  ctx.fillText(`${meters} m`, 12, 13);
  ctx.textAlign = 'right'; ctx.fillText(`BEST ${best} m`, W - 12, 13); ctx.textAlign = 'left';
  ctx.fillStyle = '#3a3a42'; ctx.fillRect(124, 10, 330, 6);
  ctx.fillStyle = PAL.brassLight; ctx.fillRect(124, 10, 330 * progress, 6);
  ctx.fillStyle = '#e8e4da'; ctx.font = '10px Verdana';
  ctx.fillText('HOME', 88, 13.5); ctx.fillText('OFFICE', 460, 13.5);
  ctx.textBaseline = 'alphabetic';

  if (run.status !== 'running') banner(ctx, run);
}

function banner(ctx, run) {
  const lines = {
    ready: ['BRIEFCASE DASH', 'Walk to Hardsell & Firestone. Press Space to start.'],
    crashed: [run.hit === 'butterfly' ? 'BUTTERFLY!' : 'CATERPILLAR!', 'Press Space to walk again.'],
    arrived: ['YOU MADE IT', 'Right on time for the partners meeting. Space to replay.'],
  }[run.status];
  ctx.fillStyle = '#17141cc4'; ctx.fillRect(140, 78, 360, 62);
  ctx.strokeStyle = PAL.brass; ctx.lineWidth = 2; ctx.strokeRect(141, 79, 358, 60);
  ctx.textAlign = 'center';
  ctx.fillStyle = PAL.brassLight; ctx.font = 'bold 20px Georgia'; ctx.fillText(lines[0], 320, 106);
  ctx.fillStyle = '#e8e4da'; ctx.font = '11px Verdana'; ctx.fillText(lines[1], 320, 126);
  ctx.textAlign = 'left';
}

function mix(a, b, k) {
  const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
  const ch = (shift) => Math.round(((pa >> shift) & 255) * (1 - k) + ((pb >> shift) & 255) * k);
  return `rgb(${ch(16)},${ch(8)},${ch(0)})`;
}

function skyline(ctx, offset, base, color, width, seed, windows = false) {
  const span = width * 12;
  for (let i = -1; i < 14; i++) {
    const n = ((i % 12) + 12) % 12;
    const h = 30 + ((n * seed * 7) % 55);
    const x = ((i * width - offset) % span + span) % span - width;
    ctx.fillStyle = color; ctx.fillRect(x, base - h, width - 4, h + 20);
    if (windows) {
      ctx.fillStyle = '#f6dc9a55';
      for (let wy = base - h + 6; wy < base - 4; wy += 9) for (let wx = x + 5; wx < x + width - 10; wx += 9) if ((wx + wy + n) % 3) ctx.fillRect(wx, wy, 3, 4);
    }
  }
}

function tree(ctx, x, base) {
  ctx.fillStyle = PAL.woodDark; ctx.fillRect(x - 3, base - 30, 6, 30);
  ctx.fillStyle = PAL.grassDark; ctx.beginPath(); ctx.arc(x, base - 42, 18, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = PAL.grass; ctx.beginPath(); ctx.arc(x - 6, base - 48, 11, 0, Math.PI * 2); ctx.fill();
}

function office(ctx, x) {
  const base = GROUND;
  ctx.fillStyle = PAL.wood; ctx.fillRect(x, base - 130, 170, 130);
  ctx.fillStyle = shade(PAL.wood, -0.15); ctx.fillRect(x, base - 134, 170, 6);
  ctx.fillStyle = PAL.navy; ctx.fillRect(x + 20, base - 122, 130, 20);
  ctx.fillStyle = PAL.parchment; ctx.font = 'bold 11px Georgia'; ctx.textAlign = 'center';
  ctx.fillText('HARDSELL & FIRESTONE', x + 85, base - 108); ctx.textAlign = 'left';
  ctx.fillStyle = '#f6dc9a';
  for (let wx = x + 14; wx < x + 160; wx += 34) for (const wy of [base - 92, base - 62]) ctx.fillRect(wx, wy, 18, 18);
  ctx.fillStyle = '#2b2b33'; ctx.fillRect(x + 68, base - 40, 34, 40);
  ctx.fillStyle = PAL.brass; ctx.fillRect(x + 96, base - 22, 3, 3);
}

function caterpillar(ctx, o) {
  const segs = Math.round(o.w / 6);
  for (let i = 0; i < segs; i++) {
    const hump = Math.max(0, Math.sin(o.phase - i * 0.9)) * 3;
    const cx = o.x + o.w - 4 - i * 6, cy = GROUND - 5 - hump;
    ctx.fillStyle = i % 2 ? '#5e9e3a' : '#7ac74f';
    ctx.beginPath(); ctx.arc(cx, cy, 5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#3f6b2a'; ctx.fillRect(cx - 1, GROUND - 1.5, 2, 1.5);
  }
  // head faces the walker (left)
  const hx = o.x + 2, hy = GROUND - 7 - Math.max(0, Math.sin(o.phase)) * 3;
  ctx.fillStyle = '#d9b656'; ctx.beginPath(); ctx.arc(hx, hy, 5.2, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#2b2b33'; ctx.fillRect(hx - 3, hy - 2, 1.6, 1.6);
  ctx.strokeStyle = '#2b2b33'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(hx - 1, hy - 5); ctx.lineTo(hx - 4, hy - 10); ctx.moveTo(hx + 1, hy - 5); ctx.lineTo(hx + 1, hy - 10); ctx.stroke();
}

function butterfly(ctx, o) {
  const bob = Math.sin(o.phase * 0.35) * 3;
  const cx = o.x + o.w / 2, cy = GROUND - o.y - o.h / 2 - bob;
  const flap = 0.35 + Math.abs(Math.sin(o.phase)) * 0.65;
  const wing = o.low ? '#e6a64a' : '#5b87a6';
  ctx.save(); ctx.translate(cx, cy);
  for (const side of [-1, 1]) {
    ctx.save(); ctx.scale(side * flap, 1);
    ctx.fillStyle = wing; ctx.beginPath(); ctx.ellipse(5, -3, 6, 5, -0.4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = shade(wing, -0.15); ctx.beginPath(); ctx.ellipse(4, 4, 4, 3.4, 0.4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#2b2b33'; ctx.beginPath(); ctx.arc(7, -4, 1.4, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }
  ctx.fillStyle = '#2b2b33'; ctx.fillRect(-1, -6, 2, 12);
  ctx.strokeStyle = '#2b2b33'; ctx.lineWidth = 0.8;
  ctx.beginPath(); ctx.moveTo(0, -6); ctx.lineTo(-3, -10); ctx.moveTo(0, -6); ctx.lineTo(3, -10); ctx.stroke();
  ctx.restore();
}

function walker(ctx, run, look, t) {
  const x = ARCADE.playerX, feet = GROUND - run.y;
  const ducking = run.ducking && run.y === 0;
  const suit = look.suit || PAL.navy, skin = PAL.skin[look.skin ?? 0] || PAL.skin[0];
  const hair = PAL.hair[look.hair ?? 0] || PAL.hair[0];
  const stride = run.status === 'running' && run.y === 0 ? Math.sin(t * 14) : 0;
  ctx.fillStyle = '#00000033'; ctx.beginPath(); ctx.ellipse(x + 8, GROUND + 2, 10 - Math.min(6, run.y / 12), 2.5, 0, 0, Math.PI * 2); ctx.fill();
  if (ducking) {
    ctx.fillStyle = shade(suit, -0.15); ctx.fillRect(x, feet - 8, 18, 8);
    ctx.fillStyle = suit; ctx.fillRect(x - 2, feet - 16, 20, 9);
    ctx.fillStyle = skin; ctx.beginPath(); ctx.arc(x + 19, feet - 15, 5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = hair; ctx.fillRect(x + 15, feet - 21, 9, 3);
    ctx.fillStyle = look.briefcase || '#694c35'; ctx.fillRect(x - 6, feet - 9, 10, 8);
    return;
  }
  // legs
  ctx.fillStyle = shade(suit, -0.2);
  ctx.fillRect(x + 4 + stride * 3, feet - 12, 4, 12);
  ctx.fillRect(x + 9 - stride * 3, feet - 12, 4, 12);
  ctx.fillStyle = '#1d1b1f'; ctx.fillRect(x + 3 + stride * 3, feet - 2, 6, 2); ctx.fillRect(x + 8 - stride * 3, feet - 2, 6, 2);
  // torso, shirt and tie
  ctx.fillStyle = suit; ctx.fillRect(x + 2, feet - 27, 13, 16);
  ctx.fillStyle = look.shirt || PAL.parchment; ctx.fillRect(x + 7, feet - 27, 4, 7);
  ctx.fillStyle = look.tie || PAL.burgundy; ctx.fillRect(x + 8, feet - 26, 2, 8);
  // arm and swinging briefcase
  ctx.fillStyle = shade(suit, -0.08); ctx.fillRect(x + 11, feet - 25, 4, 11);
  ctx.fillStyle = look.briefcase || '#694c35'; ctx.fillRect(x + 11 - stride * 2, feet - 15, 10, 8);
  ctx.fillStyle = PAL.brass; ctx.fillRect(x + 15 - stride * 2, feet - 16, 2, 1.5);
  // head
  ctx.fillStyle = skin; ctx.beginPath(); ctx.arc(x + 9, feet - 32, 5.5, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = hair; ctx.beginPath(); ctx.arc(x + 8.5, feet - 34, 5.6, Math.PI, 0); ctx.fill();
  ctx.fillStyle = '#2b2b33'; ctx.fillRect(x + 11.5, feet - 33, 1.4, 1.4);
}
