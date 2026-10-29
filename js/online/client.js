// Browser networking for the online firm: server detection, the Access
// session, the account transport used by progress.js, and the presence
// WebSocket with reconnect. All URLs are relative to the page so the same
// bundle works at the site root or under a sub-path.

import { PROTOCOL_VERSION, CLOSE_CODES, sameStatus } from './protocol.js';

const HEALTH_TIMEOUT_MS = 2_500;
const PING_INTERVAL_MS = 30_000;
const MAX_BACKOFF_MS = 30_000;

export function serverPossible() {
  return typeof location !== 'undefined' && /^https?:$/.test(location.protocol);
}

// Local development only: `wrangler dev` accepts `?dev_email=` to act as a
// named player, so forward the page's value to every request. Production
// ignores the parameter entirely.
function url(path) {
  const target = new URL(path, location.href);
  const devEmail = new URLSearchParams(location.search).get('dev_email');
  if (devEmail && /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname)) target.searchParams.set('dev_email', devEmail);
  return target;
}

export async function detectServer() {
  if (!serverPossible()) return false;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), HEALTH_TIMEOUT_MS);
  try {
    const response = await fetch(url('api/health'), { signal: controller.signal, cache: 'no-store', credentials: 'same-origin' });
    if (!response.ok) return false;
    const data = await response.json();
    return data?.online === true;
  } catch { return false; } finally { clearTimeout(timer); }
}

// Same-origin JSON call. An expired Access session answers with a redirect
// to the login page, which a manual-redirect fetch reports as opaque.
export async function apiFetch(path, { method = 'GET', body = null } = {}) {
  let response;
  try {
    response = await fetch(url(path), {
      method, credentials: 'same-origin', redirect: 'manual', cache: 'no-store',
      headers: body ? { 'content-type': 'application/json' } : {},
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (error) { throw new Error('network'); }
  if (response.type === 'opaqueredirect' || response.status === 401 || response.status === 403) {
    return { ok: false, status: response.status, expired: true, data: null };
  }
  let data = null;
  try { data = await response.json(); } catch { data = null; }
  return { ok: response.ok, status: response.status, expired: false, data };
}

export function loginUrl() { return url('api/login').href; }
export function goToLogin() { location.assign(loginUrl()); }
export function logoutUrl() { return url('api/logout').href; }

export async function fetchSession() {
  try {
    const result = await apiFetch('api/me');
    if (result.expired) return { ok: false, expired: true };
    if (!result.ok || !result.data?.ok) return { ok: false, expired: false };
    return { ok: true, expired: false, data: result.data };
  } catch { return { ok: false, expired: false, network: true }; }
}

// Transport consumed by js/progress.js in online mode.
export function createAccountTransport({ onExpired = null } = {}) {
  return {
    async act(envelope) {
      const result = await apiFetch('api/account/act', { method: 'POST', body: envelope });
      if (result.expired) return { expired: true };
      if (!result.data) throw new Error('bad response');
      return result.data;
    },
    beacon(envelope) {
      try {
        return navigator.sendBeacon(url('api/account/act'), new Blob([JSON.stringify(envelope)], { type: 'application/json' }));
      } catch { return false; }
    },
    async fetchState() {
      const result = await apiFetch('api/account/state');
      if (result.expired) { onExpired?.(); throw new Error('expired'); }
      if (!result.ok || !result.data?.ok) throw new Error(result.data?.code || 'state');
      return result.data;
    },
    onExpired,
  };
}

// Presence WebSocket. `onMessage(msg)` receives parsed server messages;
// `onState(status)` receives 'connecting' | 'online' | 'reconnecting' |
// 'offline' | 'replaced' | 'full' | 'expired'.
export function createPresenceClient({ onMessage = null, onState = null } = {}) {
  let ws = null, attempts = 0, timer = null, pingTimer = null, closedByUs = false, seq = 0, lastStatus = null, status = 'offline';

  function setStatus(next) { status = next; onState?.(next); }

  function socketUrl() { return url('ws').href.replace(/^http/, 'ws'); }

  function stopPing() { clearInterval(pingTimer); pingTimer = null; }

  function connect() {
    closedByUs = false;
    clearTimeout(timer);
    if (ws && (ws.readyState === WebSocket.CONNECTING || ws.readyState === WebSocket.OPEN)) return;
    setStatus(attempts ? 'reconnecting' : 'connecting');
    let socket;
    try { socket = new WebSocket(socketUrl()); } catch { scheduleReconnect(1006); return; }
    ws = socket;
    socket.onopen = () => {
      if (ws !== socket) return;
      attempts = 0;
      lastStatus = null;
      stopPing();
      pingTimer = setInterval(() => send('ping'), PING_INTERVAL_MS);
      setStatus('online');
    };
    socket.onmessage = (event) => {
      if (ws !== socket) return;
      let msg;
      try { msg = JSON.parse(event.data); } catch { return; }
      onMessage?.(msg);
    };
    socket.onerror = () => {};
    socket.onclose = (event) => {
      if (ws !== socket) return;
      ws = null;
      stopPing();
      if (closedByUs) { setStatus('offline'); return; }
      if (event.code === CLOSE_CODES.replaced) { setStatus('replaced'); return; }
      if (event.code === CLOSE_CODES.full) { setStatus('full'); return; }
      if (event.code === CLOSE_CODES.abuse) { setStatus('offline'); return; }
      scheduleReconnect(event.code);
    };
  }

  function scheduleReconnect(code) {
    setStatus('reconnecting');
    const delay = Math.min(MAX_BACKOFF_MS, 1000 * 2 ** attempts) * (0.75 + Math.random() * 0.5);
    attempts++;
    clearTimeout(timer);
    timer = setTimeout(async () => {
      if (closedByUs) return;
      if (code === 1006 || code === 1008) {
        // An expired Access cookie makes the upgrade fail before the room sees it.
        const session = await fetchSession();
        if (session.expired) { setStatus('expired'); return; }
      }
      connect();
    }, delay);
  }

  function close() {
    closedByUs = true;
    clearTimeout(timer);
    stopPing();
    const socket = ws;
    ws = null;
    try { socket?.close(1000, 'bye'); } catch { /* already closed */ }
    setStatus('offline');
  }

  function send(t, payload = {}) {
    if (!ws || ws.readyState !== WebSocket.OPEN) return false;
    ws.send(JSON.stringify({ v: PROTOCOL_VERSION, t, seq: ++seq, ...payload }));
    return true;
  }

  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && !closedByUs && !ws && status !== 'replaced' && status !== 'expired' && status !== 'full') {
        clearTimeout(timer);
        attempts = Math.min(attempts, 1);
        connect();
      }
    });
  }

  return {
    connect, close, send,
    sendJoin: (zone, x, y) => send('join', { zone, x, y }),
    sendZone: (zone, x, y) => send('zone', { zone, x, y }),
    sendMove: (path) => send('move', { path: path.slice(0, 64).map((step) => [step.x, step.y]) }),
    sendSit: (desk) => send('sit', { desk }),
    sendStand: () => send('stand'),
    sendStatus: (next) => { if (sameStatus(next, lastStatus)) return false; lastStatus = next; return send('status', next); },
    sendLook: (appearance, equipped) => send('look', { appearance, equipped }),
    sendResync: () => send('resync'),
    resetStatus: () => { lastStatus = null; },
    get status() { return status; },
    get connected() { return !!ws && ws.readyState === WebSocket.OPEN; },
  };
}
