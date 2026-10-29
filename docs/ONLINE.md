# LawScape Online — operator runbook

LawScape's online mode is one Cloudflare Worker (`server/worker.mjs`) that serves the
static build from `./dist`, the account API under `/api/*`, and the shared-floor
presence socket at `/ws`. It runs on the Workers **Free** plan: two SQLite-backed
Durable Object classes (`Account`, one per player e-mail; `FirmRoom`, one shared room
named `main`) and no D1, KV or queues.

Identity is Cloudflare Access with the **One-time PIN** login method: players type their
e-mail, receive a code, and Access issues a JWT that the Worker verifies itself. Only
e-mails you put on the Access policy can play online.

## Prerequisites

- Node 22+, `npm install` (pins `wrangler` and `jose` as devDependencies).
- A Cloudflare account with Workers enabled (Free plan is fine) and Zero Trust enabled
  (the free tier covers up to 50 users).
- `npx wrangler login` on the machine that deploys.
- A hostname for the Worker: either the `workers.dev` subdomain or a custom domain /
  route on a zone in the same account. Access applications attach to hostnames, so a
  `workers.dev` hostname works but Access must be able to proxy it (set the application
  domain to the exact `*.workers.dev` host).

## Access application setup

1. Zero Trust → **Settings → Authentication → Login methods**: add **One-time PIN**.
   Note the **team domain** (`<team>.cloudflareaccess.com`).
2. Zero Trust → **Access → Applications → Add an application → Self-hosted**.
   - Name: `LawScape`.
   - Session duration: **24 hours**.
   - Public hostname / domains: add **two** entries for the same host —
     `<host>` with path `api` and `<host>` with path `ws`. Do **not** use the
     worker-level ("Workers") Access integration and do not protect the whole hostname:
     the static site must stay public, and worker-level Access rejects WebSocket
     upgrades with 403.
   - Identity providers: One-time PIN only.
3. Add an **Allow** policy: Include → **Emails** → the invited players' addresses
   (or **Emails ending in** a domain you control).
4. Save, open the application's **Overview** and copy the **Application Audience (AUD)
   Tag**.
5. Configure the Worker:
   - `wrangler.jsonc` → `vars.ACCESS_TEAM_DOMAIN = "<team>.cloudflareaccess.com"`.
   - `vars.ACCESS_AUD = "<aud tag>"` in `wrangler.jsonc`. The AUD tag is not a secret
     (it appears in every Access login URL), and keeping it in the repo means a plain
     redeploy reproduces production. The dev bypass is disabled the moment
     `ACCESS_AUD` is non-empty, which is why `.dev.vars` blanks it for local runs.
6. Optional: Access → Applications → LawScape → **Settings → Cookies**: enable
   *HTTP Only* and *Binding cookie*. Leave *SameSite* at Lax so the `CF_Authorization`
   cookie is sent on the WebSocket upgrade (browsers cannot add headers to upgrades, so
   the Worker falls back from the `Cf-Access-Jwt-Assertion` header to that cookie).

The Worker verifies every `/api/*` and `/ws` request with
`jwtVerify(token, <team>/cdn-cgi/access/certs, { issuer, audience })` and uses the
lower-cased `email` claim as the player's identity. `/health` is public (it sits outside
the two Access paths so the title screen can detect the server before login; `/api/health`
answers the same for local tooling);
`/api/login` just redirects to `/game?online=1` after Access has done its job; `/api/logout`
redirects to `/cdn-cgi/access/logout`.

## Local development

```
cp .dev.vars.example .dev.vars      # DEV_IDENTITY_EMAIL=dev@example.com
npm run online:dev                  # builds ./dist, then `wrangler dev` on http://localhost:8787
```

`.dev.vars` sets `ACCESS_AUD=` (empty), which overrides the production value from
`wrangler.jsonc` for `wrangler dev` only. With `ACCESS_AUD` empty and `DEV_IDENTITY_EMAIL` set, requests to `localhost`,
`127.0.0.1` or `[::1]` are treated as that player with no login. `?dev_email=` on any
`/api/*` or `/ws` URL overrides the identity so several players can be simulated:

```
curl 'http://localhost:8787/api/me?dev_email=alice@example.com'
npm run online:smoke                # tests/online-smoke.mjs against the dev server
```

The bypass is never active for a non-loopback hostname or once `ACCESS_AUD` is set, and
`scripts/check-online.mjs` fails if `DEV_IDENTITY_EMAIL` appears in `wrangler.jsonc`.
Local Durable Object state lives under `.wrangler/` (gitignored); delete it to reset.

## Deploy gate

`npm run online:deploy` runs, in order: `npm run build`, `npm test`, `npm run release:check`,
`npm run online:check` (dry-run bundle, secrets hygiene, 3 MB size budget) and finally
`wrangler deploy`. Only deploy from a clean, up-to-date `main` after review approval;
CI never deploys (the `online-check` job only runs the dry run).

If `online:check` says the dry run needs Cloudflare credentials, run `npx wrangler login`
(or export `CLOUDFLARE_API_TOKEN`). In CI without a token the step prints the message
and passes, because there is nothing it can validate.

## Rollback

`npx wrangler deployments list` shows recent versions; `npx wrangler rollback` (optionally
with a version id) restores a previous one. Durable Object storage is not rolled back:
the `v1` migration only creates classes, and account documents are forward-compatible
(`normalizeSave` fills missing fields). Never delete a class in a migration without
exporting the accounts first.

## Free-plan quotas to keep in mind

- 100,000 Worker requests/day and 10 ms CPU per request; the Worker does one or two
  Durable Object calls per API request.
- Durable Objects (SQLite): 100,000 requests/day, 5 GB storage, 13,000 rows read and
  1,000 rows written per day are free-tier *line items* — a document write is a single
  row, and the ledger adds one row per action (trimmed to 200 per client).
- WebSocket messages count as requests at 20:1 for incoming messages; the hibernation
  ping/pong pair is answered without waking the object and is not billed as a request.
- Workers Static Assets are free and unlimited; keep `dist/` under the 25 MiB per-file
  limit (`release:check` already guards the package).

## What is persisted (and what is not)

- **Account DO** (`idFromName(email)`): `doc` = `{ v, email, createdAt, character, session.lastSeq, runs }`
  plus the SQLite `ledger(client_id, seq, response, at)` idempotency table. Characters are
  the same documents the solo game keeps in `localStorage`, mutated only through
  `js/actions.js`. Finished runs are appended to `runs`.
- **FirmRoom DO** (`main`): nothing. Presence lives in each socket's attachment and is
  rebuilt from `ctx.getWebSockets()`; a restart empties the room and clients re-join.
  The broadcast `seq` is carried in attachments so it survives hibernation but restarts
  reset it — clients treat a smaller `seq` after a `snapshot` as a new epoch.
- Nothing is written to KV, D1 or R2. E-mails never reach other players: each player is
  identified to the room by `pid`, the first 12 hex characters of SHA-256(email).

## Inviting and removing players

- Invite: add the e-mail to the Access policy (Zero Trust → Access → Applications →
  LawScape → Policies → Allow → Emails). The player opens `<host>/api/login`, enters the
  e-mail, pastes the PIN and lands on `/game?online=1`.
- Remove: delete the e-mail from the policy and, if you want them out immediately,
  Zero Trust → **My Team → Users → Revoke** (their session cookie stops verifying). Their
  Account DO stays in place; to wipe it, deploy a one-off handler or use
  `npx wrangler durable-objects` tooling — there is no admin endpoint on purpose.
- Capacity: `LIMITS.roomCapacity` (10) distinct players can be on the floor at once; the
  eleventh socket is closed with code 4003.

## Known limitations

- One shared room (`main`): every zone except the apartment is one presence space, and
  the room is not sharded by jurisdiction or firm.
- Presence is best-effort: the server validates paths (walkable tiles, no teleporting
  ahead of a 4 tiles/s clock) but does not simulate collisions between players.
- Rate limits are per connection (20 msg/s, burst 40, three strikes in a minute close
  the socket with 4008) and are not persisted across reconnects.
- The idle sweeper runs on a 60 s alarm, so a silent socket may live up to
  `LIMITS.idleMs` + 60 s.
- The account API is strictly sequential per `(clientId, seq)`; a client that loses its
  counter must start a new `clientId`.
- Durable Object restarts drop the room (players re-join automatically) and reset the
  broadcast `seq` epoch.
- Access One-time PIN e-mails come from Cloudflare; there is no custom branding on the
  Free plan.
- No admin UI: inviting, removing and auditing players happens in the Zero Trust
  dashboard and `wrangler tail`.
