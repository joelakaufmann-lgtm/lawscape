// Pure room-state reducer for online presence. The browser feeds every
// server message through `applyRoomMessage` and reacts to the returned
// effects; nothing here touches the DOM, the canvas or the network.

import { clampLabel, deskSeats } from './protocol.js';

export function newRoom() {
  return { me: null, meLabel: '', players: {}, desks: {}, seq: 0, connected: false };
}

function record(p) {
  const seat = p.desk ? deskSeats()[p.desk] : null;
  return {
    pid: String(p.pid), name: clampLabel(p.name || 'Attorney'), zone: p.zone, x: Number(p.x) || 0, y: Number(p.y) || 0,
    path: Array.isArray(p.path) ? p.path.map((s) => ({ x: s[0], y: s[1] })) : [], facing: p.facing === -1 ? -1 : 1,
    activity: p.activity || null, desk: p.desk || null, label: clampLabel(p.label || ''), look: p.look || null,
    ...(seat ? { x: seat.x, y: seat.y } : {}),
  };
}

function freeDesksHeldBy(room, pid) {
  const freed = [];
  for (const [deskId, holder] of Object.entries(room.desks)) {
    if (holder.pid === pid) { delete room.desks[deskId]; freed.push(deskId); }
  }
  return freed;
}

export function applyRoomMessage(room, msg) {
  if (!msg || typeof msg !== 'object' || typeof msg.t !== 'string') return [];
  if (msg.t === 'snapshot') {
    room.me = msg.you ? { pid: String(msg.you.pid), name: clampLabel(msg.you.name || 'Attorney') } : null;
    room.players = {};
    for (const p of Array.isArray(msg.players) ? msg.players : []) {
      if (!p || String(p.pid) === room.me?.pid) continue;
      room.players[String(p.pid)] = record(p);
    }
    room.desks = {};
    for (const [deskId, holder] of Object.entries(msg.desks || {})) {
      if (holder && holder.pid) room.desks[deskId] = { pid: String(holder.pid), name: clampLabel(holder.name || 'Attorney'), since: holder.since || 0 };
    }
    room.seq = Number.isFinite(msg.seq) ? msg.seq : 0;
    room.connected = true;
    return [{ type: 'reset' }];
  }
  if (Number.isFinite(msg.seq)) {
    if (msg.seq <= room.seq) return [{ type: 'duplicate', seq: msg.seq }];
    room.seq = msg.seq;
  }
  const mine = room.me && String(msg.pid) === room.me.pid;
  const player = room.players[String(msg.pid)];
  switch (msg.t) {
    case 'joined': {
      if (!msg.p || String(msg.p.pid) === room.me?.pid) return [];
      const existed = !!room.players[String(msg.p.pid)];
      room.players[String(msg.p.pid)] = record(msg.p);
      return [{ type: existed ? 'teleport' : 'spawn', pid: String(msg.p.pid) }];
    }
    case 'left': {
      const pid = String(msg.pid);
      const freed = freeDesksHeldBy(room, pid);
      if (!room.players[pid]) return freed.length ? [{ type: 'desks' }] : [];
      delete room.players[pid];
      return [{ type: 'despawn', pid }, ...(freed.length ? [{ type: 'desks' }] : [])];
    }
    case 'zone': {
      if (mine || !player) return [];
      player.zone = msg.zone; player.x = Number(msg.x) || 0; player.y = Number(msg.y) || 0; player.path = [];
      if (player.desk) { player.desk = null; player.activity = null; }
      return [{ type: 'teleport', pid: player.pid }];
    }
    case 'moved': {
      if (mine || !player || !Array.isArray(msg.path) || !msg.path.length) return [];
      player.path = msg.path.map((s) => ({ x: s[0], y: s[1] }));
      const last = player.path.at(-1);
      player.x = last.x; player.y = last.y; player.at = msg.at || 0;
      if (player.activity === 'sitting') player.activity = null;
      return [{ type: 'walk', pid: player.pid }];
    }
    case 'desk': {
      const deskId = String(msg.deskId);
      const effects = [{ type: 'desks' }];
      const previous = room.desks[deskId]?.pid || null;
      if (msg.pid) {
        const pid = String(msg.pid);
        freeDesksHeldBy(room, pid);
        room.desks[deskId] = { pid, name: clampLabel(msg.name || 'Attorney'), since: msg.at || 0 };
        const holder = room.players[pid];
        if (holder) {
          const seat = deskSeats()[deskId];
          holder.desk = deskId; holder.activity = 'sitting'; holder.path = [];
          if (seat) { holder.x = seat.x; holder.y = seat.y; }
          effects.push({ type: 'pose', pid });
        }
        if (pid === room.me?.pid) effects.push({ type: 'ack', t: 'sit', deskId });
      } else {
        delete room.desks[deskId];
        if (previous) {
          const holder = room.players[previous];
          if (holder && holder.desk === deskId) { holder.desk = null; holder.activity = null; effects.push({ type: 'pose', pid: previous }); }
          if (previous === room.me?.pid) effects.push({ type: 'ack', t: 'stand', deskId });
        }
      }
      return effects;
    }
    case 'status': {
      if (mine) { room.meLabel = clampLabel(msg.label || ''); return [{ type: 'me-status' }]; }
      if (!player) return [];
      player.label = clampLabel(msg.label || '');
      player.activity = msg.activity || (player.desk ? 'sitting' : null);
      return [{ type: 'pose', pid: player.pid }];
    }
    case 'look': {
      if (mine || !player) return [];
      player.look = msg.look || null;
      return [{ type: 'look', pid: player.pid }];
    }
    case 'error':
      return [{ type: 'error', code: String(msg.code || 'error'), detail: String(msg.detail || '') }];
    default:
      return [];
  }
}

export function playersInZone(room, zone) {
  return Object.values(room.players).filter((p) => p.zone === zone);
}

export function deskOccupant(room, deskId) {
  return room.desks[deskId] || null;
}

export function roomSummary(room) {
  const others = Object.values(room.players);
  const byZone = {};
  for (const p of others) byZone[p.zone] = (byZone[p.zone] || 0) + 1;
  return { count: others.length + (room.connected ? 1 : 0), others: others.length, byZone };
}
