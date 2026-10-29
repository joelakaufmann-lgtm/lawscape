// FirmRoom Durable Object: the single shared presence room ("main"). Thin
// adapter over server/room-logic.mjs using the WebSocket Hibernation API.
//
// Nothing is persisted: each socket's attachment carries its connection
// record plus the room seq it last saw, and the room is rebuilt from
// `ctx.getWebSockets()` at the start of every handler. A 60 s alarm closes
// idle sockets; pings are answered by the runtime without waking the object.

import { DurableObject } from 'cloudflare:workers';
import { LIMITS } from '../js/online/protocol.js';
import { createRoom, onConnect, onMessage, onLeave, onProgress, sweepIdle } from './room-logic.mjs';
import { DEFAULT_PRESENCE } from './account-logic.mjs';

const SWEEP_MS = 60_000;
const PING = '{"v":1,"t":"ping"}';
const PONG = '{"v":1,"t":"pong"}';

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
}

export async function pidFor(email) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(email));
  return [...new Uint8Array(digest)].slice(0, 6).map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

function readAttachment(ws) {
  try { return ws.deserializeAttachment() || null; } catch { return null; }
}

export class FirmRoom extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
    this.ctx.setWebSocketAutoResponse(new WebSocketRequestResponsePair(PING, PONG));
  }

  // Rebuild the live room from the hibernated sockets' attachments.
  rebuild() {
    const room = createRoom();
    const sockets = new Map();
    for (const ws of this.ctx.getWebSockets()) {
      const att = readAttachment(ws);
      if (!att || att.closed || !att.conn) continue;
      room.conns.set(att.cid, att.conn);
      sockets.set(att.cid, ws);
      if (Number.isInteger(att.seq) && att.seq > room.seq) room.seq = att.seq;
    }
    return { room, sockets };
  }

  persist(room, sockets) {
    for (const [cid, ws] of sockets) {
      const conn = room.conns.get(cid);
      if (!conn) continue;
      try { ws.serializeAttachment({ cid, seq: room.seq, conn }); } catch { /* socket already gone */ }
    }
  }

  send(ws, msg) {
    try { ws.send(JSON.stringify(msg)); } catch { /* closing socket */ }
  }

  apply(fx, room, sockets) {
    for (const { cid, msg } of fx.unicast) {
      const ws = sockets.get(cid);
      if (ws) this.send(ws, msg);
    }
    for (const { msg, except } of fx.broadcast) {
      for (const [cid, ws] of sockets) {
        if (cid === except || !room.conns.has(cid)) continue;
        this.send(ws, msg);
      }
    }
    for (const { cid, code, reason } of fx.close) {
      const ws = sockets.get(cid);
      if (!ws) continue;
      try { ws.serializeAttachment({ cid, closed: true }); } catch { /* ignore */ }
      try { ws.close(code, reason); } catch { /* already closed */ }
      sockets.delete(cid);
    }
    this.persist(room, sockets);
  }

  async ensureAlarm() {
    if ((await this.ctx.storage.getAlarm()) === null) await this.ctx.storage.setAlarm(Date.now() + SWEEP_MS);
  }

  async fetch(request) {
    const url = new URL(request.url);
    const email = request.headers.get('X-Lawscape-Email');
    if (!email) return json({ ok: false, code: 'bad_request' }, 400);

    if (request.method === 'POST' && url.pathname === '/internal/progress') {
      let body;
      try { body = await request.json(); } catch { return json({ ok: false, code: 'bad_request' }, 400); }
      const { room, sockets } = this.rebuild();
      const fx = onProgress(room, await pidFor(email), body || {});
      this.apply(fx, room, sockets);
      return json({ ok: true });
    }

    if (url.pathname === '/ws' && request.headers.get('Upgrade')?.toLowerCase() === 'websocket') {
      let presence = { ...DEFAULT_PRESENCE };
      try { presence = { ...presence, ...JSON.parse(request.headers.get('X-Lawscape-Presence') || '{}') }; } catch { /* defaults */ }
      const pid = await pidFor(email);
      const cid = crypto.randomUUID();
      const now = Date.now();

      const { room, sockets } = this.rebuild();
      const fx = onConnect(room, { cid, pid, ...presence }, now);

      const pair = new WebSocketPair();
      const [client, server] = Object.values(pair);
      this.ctx.acceptWebSocket(server, [`email:${email}`]);
      server.serializeAttachment({ cid, seq: room.seq, conn: room.conns.get(cid) ?? null, closed: !room.conns.has(cid) });
      sockets.set(cid, server);
      // A close issued before the 101 reaches the client is lost, and one
      // issued from a timer never finishes its TCP teardown. The Worker is
      // told via a header to call /internal/close once the handshake is done.
      const deferred = fx.close.find((entry) => entry.cid === cid);
      fx.close = fx.close.filter((entry) => entry.cid !== cid);
      this.apply(fx, room, sockets);
      const headers = new Headers();
      if (deferred) headers.set('X-Lawscape-Close', JSON.stringify({ cid, code: deferred.code, reason: deferred.reason }));
      await this.ensureAlarm();
      return new Response(null, { status: 101, webSocket: client, headers });
    }

    if (request.method === 'POST' && url.pathname === '/internal/close') {
      let body;
      try { body = await request.json(); } catch { return json({ ok: false, code: 'bad_request' }, 400); }
      for (const ws of this.ctx.getWebSockets()) {
        const att = readAttachment(ws);
        if (!att || att.cid !== body?.cid) continue;
        if (body.reason === 'full') this.send(ws, { v: 1, t: 'error', code: 'full', detail: `the floor holds ${LIMITS.roomCapacity} attorneys; try again later` });
        try { ws.close(body.code, body.reason); } catch { /* already gone */ }
      }
      return json({ ok: true });
    }

    return json({ ok: false, code: 'not_found' }, 404);
  }

  async webSocketMessage(ws, message) {
    const att = readAttachment(ws);
    if (!att || att.closed) return;
    const { room, sockets } = this.rebuild();
    if (!sockets.has(att.cid)) sockets.set(att.cid, ws);
    const raw = typeof message === 'string' ? message : '';
    const fx = onMessage(room, att.cid, raw || { binary: true }, Date.now());
    this.apply(fx, room, sockets);
  }

  async webSocketClose(ws, code, reason, _wasClean) {
    await this.leave(ws, 'left');
    // Complete the close handshake for client-initiated closes.
    try { ws.close(code >= 1000 && code !== 1005 && code !== 1006 ? code : 1000, String(reason || '').slice(0, 120)); } catch { /* already closed */ }
  }

  async webSocketError(ws, _error) {
    await this.leave(ws, 'error');
  }

  async leave(ws, reason) {
    const att = readAttachment(ws);
    if (!att || att.closed) return;
    const { room, sockets } = this.rebuild();
    const fx = onLeave(room, att.cid, reason, Date.now());
    sockets.delete(att.cid);
    this.apply(fx, room, sockets);
    try { ws.serializeAttachment({ cid: att.cid, closed: true }); } catch { /* ignore */ }
  }

  async alarm() {
    const { room, sockets } = this.rebuild();
    const now = Date.now();
    const lastSeen = (conn) => {
      const ws = sockets.get(conn.cid);
      const ping = ws ? this.ctx.getWebSocketAutoResponseTimestamp(ws) : null;
      return Math.max(conn.lastAt || 0, ping ? ping.getTime() : 0);
    };
    const fx = sweepIdle(room, now, lastSeen);
    this.apply(fx, room, sockets);
    if (room.conns.size) await this.ctx.storage.setAlarm(now + Math.min(SWEEP_MS, LIMITS.idleMs));
  }
}
