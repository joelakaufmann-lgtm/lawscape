// Identity for every protected route. Cloudflare Access (one-time PIN) sits in
// front of /api/* and /ws and signs a JWT the Worker verifies itself. Browsers
// cannot add headers to a WebSocket upgrade, so the CF_Authorization cookie is
// accepted as a fallback for the header.
//
// Local development bypass: only when no ACCESS_AUD is configured, a
// DEV_IDENTITY_EMAIL is set, and the request is for a loopback hostname. In
// that mode `?dev_email=` lets a smoke test act as several players.

import { jwtVerify, createRemoteJWKSet } from 'jose';

const LOOPBACK = new Set(['localhost', '127.0.0.1', '[::1]']);
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

let jwks = null;
let jwksDomain = null;

function jwksFor(teamDomain) {
  if (!jwks || jwksDomain !== teamDomain) {
    jwks = createRemoteJWKSet(new URL(`https://${teamDomain}/cdn-cgi/access/certs`));
    jwksDomain = teamDomain;
  }
  return jwks;
}

function cookie(request, name) {
  const header = request.headers.get('Cookie') || '';
  for (const part of header.split(';')) {
    const [key, ...rest] = part.trim().split('=');
    if (key === name) return rest.join('=');
  }
  return null;
}

export function devBypass(request, env) {
  if (env.ACCESS_AUD || !env.DEV_IDENTITY_EMAIL) return null;
  const url = new URL(request.url);
  if (!LOOPBACK.has(url.hostname)) return null;
  const override = url.searchParams.get('dev_email');
  const email = String(override || env.DEV_IDENTITY_EMAIL).trim().toLowerCase();
  return EMAIL.test(email) ? { email, dev: true } : null;
}

export async function identify(request, env) {
  const dev = devBypass(request, env);
  if (dev) return dev;
  if (!env.ACCESS_AUD || !env.ACCESS_TEAM_DOMAIN) return null;
  const token = request.headers.get('Cf-Access-Jwt-Assertion') || cookie(request, 'CF_Authorization');
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, jwksFor(env.ACCESS_TEAM_DOMAIN), {
      issuer: `https://${env.ACCESS_TEAM_DOMAIN}`,
      audience: env.ACCESS_AUD,
    });
    const email = typeof payload.email === 'string' ? payload.email.trim().toLowerCase() : '';
    return EMAIL.test(email) ? { email } : null;
  } catch {
    return null;
  }
}
