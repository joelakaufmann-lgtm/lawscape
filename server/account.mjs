// Account Durable Object: one per e-mail (idFromName). Thin adapter over
// server/account-logic.mjs — the document lives under the 'doc' key and the
// idempotency ledger in a SQLite table, trimmed to the latest 200 rows per
// client.

import { DurableObject } from 'cloudflare:workers';
import { loadDoc, applyAccountAction, settleOnRead, presenceOf, meOf } from './account-logic.mjs';

const LEDGER_ROWS_PER_CLIENT = 200;

function progressOf(doc) {
  const presence = presenceOf(doc);
  return { name: presence.name, streak: presence.streak, documentsReviewed: presence.documentsReviewed };
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
}

export class Account extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
    this.ctx.blockConcurrencyWhile(async () => {
      this.ctx.storage.sql.exec(`CREATE TABLE IF NOT EXISTS ledger (
        client_id TEXT NOT NULL, seq INTEGER NOT NULL, response TEXT NOT NULL, at INTEGER NOT NULL,
        PRIMARY KEY (client_id, seq))`);
    });
  }

  ledger() {
    const sql = this.ctx.storage.sql;
    return {
      get(clientId, seq) {
        const row = sql.exec('SELECT response FROM ledger WHERE client_id = ? AND seq = ?', clientId, seq).toArray()[0];
        return row ? JSON.parse(row.response) : null;
      },
      put(clientId, seq, response) {
        sql.exec('INSERT OR REPLACE INTO ledger (client_id, seq, response, at) VALUES (?, ?, ?, ?)', clientId, seq, JSON.stringify(response), Date.now());
        sql.exec(`DELETE FROM ledger WHERE client_id = ? AND seq NOT IN (
          SELECT seq FROM ledger WHERE client_id = ? ORDER BY seq DESC LIMIT ?)`, clientId, clientId, LEDGER_ROWS_PER_CLIENT);
      },
    };
  }

  async load(email, now) {
    return loadDoc(await this.ctx.storage.get('doc'), email, now);
  }

  async fetch(request) {
    const url = new URL(request.url);
    const email = request.headers.get('X-Lawscape-Email');
    if (!email) return json({ ok: false, code: 'bad_request' }, 400);
    const now = Date.now();
    const doc = await this.load(email, now);

    switch (`${request.method} ${url.pathname}`) {
      case 'GET /internal/me':
        return json(meOf(doc, email));
      case 'GET /internal/presence':
        return json(presenceOf(doc));
      case 'GET /internal/state': {
        const res = settleOnRead(doc, now);
        if (res.changed) await this.ctx.storage.put('doc', doc);
        return json(res.body, res.status);
      }
      case 'POST /internal/act': {
        let body;
        try { body = await request.json(); } catch { return json({ ok: false, code: 'bad_request' }, 400); }
        const before = progressOf(doc);
        const res = applyAccountAction(doc, body, now, Math.random, () => crypto.randomUUID(), this.ledger());
        if (res.changed) await this.ctx.storage.put('doc', doc);
        const after = progressOf(doc);
        const response = json(res.body, res.status);
        // Tell the Worker to push trusted numbers to the room when they moved.
        if (res.body.ok && (res.body.ended || JSON.stringify(before) !== JSON.stringify(after))) {
          response.headers.set('X-Lawscape-Progress', JSON.stringify({ email, ...after }));
        }
        return response;
      }
      default:
        return json({ ok: false, code: 'not_found' }, 404);
    }
  }
}
