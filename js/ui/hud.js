// HUD: gold counter, Ethics health bar, streak pips, zone name, toasts,
// OSRS-style yellow hover text, and the minimap (parchment floor plan).

import { state, maxEthics } from '../state.js';
import { formatBillableTime } from '../data/work.js';

const $ = (id) => document.getElementById(id);

export function updateHUD() {
  $('stat-gold').querySelector('b').textContent = Math.floor(state.gold).toLocaleString();

  const cap = maxEthics();
  const pct = Math.max(0, Math.min(1, state.ethics / cap));
  const fill = $('ethics-fill');
  fill.style.width = `${pct * 100}%`;
  fill.className = pct > 0.5 ? 'ok' : pct > 0.25 ? 'warn' : 'danger';
  $('ethics-num').textContent = `${state.ethics}/${cap}`;

  const streakEl = $('stat-streak');
  streakEl.querySelector('b').textContent = `x${state.streak}`;
  streakEl.classList.toggle('hot', state.streak >= 2);

  $('stat-billable').querySelector('b').textContent = formatBillableTime(state.billableStudyMs);
}

export function setZoneName(name) {
  $('hud-zone').textContent = name;
}

let toastTimer = null;
export function toast(msg, ms = 2800) {
  const el = $('toast');
  el.textContent = msg;
  el.classList.remove('hidden');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.add('hidden'), ms);
}

export function hoverLabel(text, x, y) {
  const el = $('hoverlabel');
  if (!text) {
    el.classList.add('hidden');
    return;
  }
  el.textContent = text;
  el.style.left = `${x}px`;
  el.style.top = `${y}px`;
  el.classList.remove('hidden');
}

export function drawMinimap(zone, player, walkable) {
  const canvas = $('minimap');
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#f3e9d2';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const pad = 8;
  const sx = (canvas.width - pad * 2) / zone.w;
  const sy = (canvas.height - pad * 2) / zone.h;
  const s = Math.min(sx, sy);
  const ox = (canvas.width - s * zone.w) / 2;
  const oy = (canvas.height - s * zone.h) / 2;

  for (let y = 0; y < zone.h; y++) {
    for (let x = 0; x < zone.w; x++) {
      if (!walkable(x, y)) {
        ctx.fillStyle = 'rgba(43,43,51,0.75)';
        ctx.fillRect(ox + x * s, oy + y * s, s + 0.5, s + 0.5);
      }
    }
  }
  ctx.fillStyle = '#b8912f';
  for (const portal of zone.portals) {
    ctx.beginPath();
    ctx.arc(ox + (portal.x + 0.5) * s, oy + (portal.y + 0.5) * s, Math.max(2.5, s * 0.6), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = '#6e2436';
  ctx.beginPath();
  ctx.arc(ox + (player.x + 0.5) * s, oy + (player.y + 0.5) * s, Math.max(3, s * 0.7), 0, Math.PI * 2);
  ctx.fill();
  // frame like a plan drawing
  ctx.strokeStyle = '#2b2b33';
  ctx.lineWidth = 1;
  ctx.strokeRect(ox, oy, s * zone.w, s * zone.h);
}
