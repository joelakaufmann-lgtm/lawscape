// LawScape online Worker: serves the static build from ./dist (Workers Static
// Assets), the account API under /api/*, and the presence room at /ws.
//
// Identity comes from Cloudflare Access (see server/access.mjs); the Durable
// Objects never see client headers, only the ones built here.

import { identify } from './access.mjs';
import { FirmRoom } from './firm-room.mjs';
import { Account } from './account.mjs';

export { FirmRoom, Account };

const MAX_BODY_BYTES = 64 * 1024;
const JSON_HEADERS = { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' };

function json(body, status = 200, extra = {}) {
  return new Response(JSON.stringify(body), { status, headers: { ...JSON_HEADERS, ...extra } });
}

const unauthenticated = () => json({ ok: false, code: 'unauthenticated' }, 401);
const badRequest = () => json({ ok: false, code: 'bad_request' }, 400);

function accountFor(env, email) {
  return env.ACCOUNT.get(env.ACCOUNT.idFromName(email));
}

function firmRoom(env) {
  return env.FIRM.get(env.FIRM.idFromName('main'));
}

function internal(path, email, init = {}) {
  const headers = new Headers(init.headers || {});
  headers.set('X-Lawscape-Email', email);
  return new Request(`https://lawscape.internal${path}`, { ...init, headers });
}

// Re-emit a Durable Object response with the public headers only.
function relay(response) {
  const headers = new Headers(JSON_HEADERS);
  return new Response(response.body, { status: response.status, headers });
}

async function readJsonBody(request) {
  const length = Number(request.headers.get('Content-Length') || 0);
  if (length > MAX_BODY_BYTES) return null;
  const text = await request.text();
  if (text.length > MAX_BODY_BYTES) return null;
  try { return JSON.parse(text); } catch { return null; }
}

async function handleApi(request, env, ctx, url, identity) {
  const route = `${request.method} ${url.pathname}`;
  const { email } = identity;

  if (route === 'GET /api/login') return Response.redirect(new URL('/game?online=1', url).toString(), 302);
  if (route === 'GET /api/me') return relay(await accountFor(env, email).fetch(internal('/internal/me', email)));
  if (route === 'GET /api/account/state') return relay(await accountFor(env, email).fetch(internal('/internal/state', email)));

  if (route === 'POST /api/account/act') {
    const body = await readJsonBody(request);
    if (!body || typeof body !== 'object' || Array.isArray(body) || !body.action || typeof body.action !== 'object') return badRequest();
    const response = await accountFor(env, email).fetch(internal('/internal/act', email, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    }));
    const progress = response.headers.get('X-Lawscape-Progress');
    if (progress) {
      ctx.waitUntil(firmRoom(env).fetch(internal('/internal/progress', email, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: progress,
      })).catch(() => {}));
    }
    return relay(response);
  }

  return json({ ok: false, code: 'not_found' }, 404);
}

async function handleSocket(request, env, ctx, identity) {
  if (request.headers.get('Upgrade')?.toLowerCase() !== 'websocket') return json({ ok: false, code: 'upgrade_required' }, 426);
  const { email } = identity;
  let presence = null;
  try {
    const response = await accountFor(env, email).fetch(internal('/internal/presence', email));
    if (response.ok) presence = await response.json();
  } catch { /* defaults below */ }
  if (!presence) presence = { name: 'Attorney', look: null, streak: 0, documentsReviewed: 0 };

  const headers = new Headers({
    Upgrade: 'websocket',
    Connection: 'Upgrade',
    'X-Lawscape-Email': email,
    'X-Lawscape-Presence': JSON.stringify(presence),
  });
  for (const name of ['Sec-WebSocket-Key', 'Sec-WebSocket-Version']) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }
  const response = await firmRoom(env).fetch(new Request('https://lawscape.internal/ws', { method: 'GET', headers }));
  const close = response.headers.get('X-Lawscape-Close');
  if (close && response.webSocket) {
    // Room full: let the handshake finish, then close from a request context.
    ctx.waitUntil(new Promise((resolve) => setTimeout(resolve, 250)).then(() => firmRoom(env).fetch(internal('/internal/close', email, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: close,
    }))).catch(() => {}));
    return new Response(null, { status: 101, webSocket: response.webSocket });
  }
  return response;
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname === '/api/health') return json({ ok: true, online: true, v: 1 });
    if (url.pathname === '/api/logout') return Response.redirect(new URL('/cdn-cgi/access/logout', url).toString(), 302);

    if (url.pathname === '/ws' || url.pathname.startsWith('/api/')) {
      const identity = await identify(request, env);
      if (!identity) return unauthenticated();
      try {
        return url.pathname === '/ws' ? await handleSocket(request, env, ctx, identity) : await handleApi(request, env, ctx, url, identity);
      } catch (error) {
        console.error('lawscape online error', error?.stack || error);
        return json({ ok: false, code: 'server_error' }, 500);
      }
    }

    return env.ASSETS.fetch(request);
  },
};
