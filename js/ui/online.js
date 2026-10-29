// Online HUD indicator and the "Who's in" roster panel.

import { ZONES } from '../world/zones.js';
import { escapeHtml } from './apprenticeship.js';
import { roomSummary } from '../online/room.js';

const $ = (id) => document.getElementById(id);

const STATUS_TEXT = {
  connecting: 'Connecting to the firm…',
  reconnecting: 'Reconnecting…',
  offline: 'Offline',
  replaced: 'Signed in elsewhere',
  full: 'The firm is full (10 attorneys)',
  expired: 'Session expired',
};

export function setOnlineStatus(status, room = null) {
  const el = $('online-status');
  if (!el) return;
  el.classList.remove('hidden');
  el.dataset.status = status;
  if (status === 'online' && room) {
    const { count } = roomSummary(room);
    el.textContent = `Online · ${count} in the firm`;
  } else {
    el.textContent = STATUS_TEXT[status] || status;
  }
}

export function hideOnlineStatus() {
  const el = $('online-status');
  if (el) el.classList.add('hidden');
}

function zoneName(id) {
  const zone = ZONES[id];
  return zone ? zone.name.replace(/^Hardsell & Firestone — /, '') : 'Away';
}

// me = { name, zone, desk, label }
export function renderRoster(body, room, me) {
  const { count } = roomSummary(room);
  const rows = [
    { name: me.name, zone: me.zone, desk: me.desk, label: me.label || room.meLabel, you: true },
    ...Object.values(room.players).sort((a, b) => a.name.localeCompare(b.name)),
  ];
  body.innerHTML = `<div class="help-lede"><h3>${count} of 10 in the firm</h3><p>Everyone signed in right now, where they are, and what they are working on. Status tags come from the game, not from typed text.</p></div>`
    + `<table class="score-table roster-table"><caption>Attorneys online</caption><thead><tr><th scope="col">Attorney</th><th scope="col">Where</th><th scope="col">Desk</th><th scope="col">Status</th></tr></thead><tbody>`
    + rows.map((p) => `<tr${p.you ? ' class="roster-you"' : ''}><th scope="row">${escapeHtml(p.name)}${p.you ? ' <span class="muted">(you)</span>' : ''}</th><td>${escapeHtml(zoneName(p.zone))}</td><td>${escapeHtml(p.desk || '—')}</td><td>${escapeHtml(p.label || '')}</td></tr>`).join('')
    + '</tbody></table>'
    + '<p class="board-note">Open desks on the Associates’ Floor are claimed one at a time. Chat is not part of this pilot; the Sidebar tables keep local notes only.</p>';
}
