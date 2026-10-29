// Pure account logic: one document per e-mail, mutated only through the
// shared action reducer (js/actions.js). The Durable Object adapter persists
// the document and the idempotency ledger; this module never touches storage.
//
// Every result is `{ status, body, changed }`: an HTTP status, the JSON body
// the Worker returns verbatim, and whether the document must be persisted.

import { freshState, normalizeSave } from '../js/state.js';
import { applyAction, isAction } from '../js/actions.js';
import { normalizeAppearance } from '../js/data/appearance.js';

export const DOC_VERSION = 1;
export const MAX_CLIENT_ID_CHARS = 64;
export const DEFAULT_PRESENCE = Object.freeze({ name: 'Attorney', look: null, streak: 0, documentsReviewed: 0 });

export function freshDoc(email, now) {
  return { v: DOC_VERSION, email, createdAt: now, character: null, session: { lastSeq: {} }, runs: [] };
}

// Normalise whatever storage hands back so every handler sees a complete doc.
export function loadDoc(raw, email, now) {
  if (!raw || typeof raw !== 'object') return freshDoc(email, now);
  const doc = { ...freshDoc(email, raw.createdAt ?? now), ...raw };
  if (!doc.session || typeof doc.session !== 'object') doc.session = { lastSeq: {} };
  if (!doc.session.lastSeq || typeof doc.session.lastSeq !== 'object') doc.session.lastSeq = {};
  if (!Array.isArray(doc.runs)) doc.runs = [];
  if (doc.character) doc.character = normalizeSave(doc.character) ?? doc.character;
  return doc;
}

export function createMemoryLedger() {
  const rows = new Map();
  return {
    get(clientId, seq) { return rows.get(`${clientId}:${seq}`) ?? null; },
    put(clientId, seq, response) { rows.set(`${clientId}:${seq}`, response); },
    size() { return rows.size; },
  };
}

const ok = (status, body, changed = false) => ({ status, body, changed });

export function validateEnvelope(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return null;
  const { clientId, seq, action } = body;
  if (typeof clientId !== 'string' || !clientId.trim() || clientId.length > MAX_CLIENT_ID_CHARS) return null;
  if (!Number.isInteger(seq) || seq < 1 || seq > Number.MAX_SAFE_INTEGER) return null;
  if (!action || typeof action !== 'object' || Array.isArray(action) || !isAction(action.type)) return null;
  return { clientId, seq, action };
}

export function meOf(doc, email) {
  const character = doc.character;
  return { ok: true, email, name: character?.name ?? null, hasCharacter: !!character, runStatus: character?.runStatus ?? null };
}

export function presenceOf(doc) {
  const character = doc.character;
  if (!character) return { ...DEFAULT_PRESENCE };
  return {
    name: character.name,
    look: { ...normalizeAppearance(character), equipped: [...(character.apprenticeship?.equipped ?? [])] },
    streak: character.streak ?? 0,
    documentsReviewed: character.documentsReviewed ?? 0,
  };
}

// Settle due partner replies before handing the document to a reader.
export function settleOnRead(doc, now, rng = Math.random) {
  if (!doc.character) return ok(404, { ok: false, code: 'no_character' });
  const before = JSON.stringify(doc.character);
  const character = structuredClone(doc.character);
  let changed = false;
  try {
    applyAction(character, { type: 'settle' }, { now, rng });
    changed = JSON.stringify(character) !== before;
    if (changed) doc.character = character;
  } catch { /* settle never throws for a normalised character; keep the stored copy */ }
  return ok(200, { ok: true, state: doc.character, serverNow: now }, changed);
}

export function applyAccountAction(doc, envelope, now, rng = Math.random, uuid, ledger = createMemoryLedger()) {
  const parsed = validateEnvelope(envelope);
  if (!parsed) return ok(400, { ok: false, code: 'bad_request' });
  const { clientId, seq, action } = parsed;

  const stored = ledger.get(clientId, seq);
  if (stored) return ok(stored.status, stored.body);

  const lastSeq = doc.session.lastSeq[clientId] ?? 0;
  if (seq <= lastSeq) return ok(409, { ok: false, code: 'stale', seq, lastSeq, serverNow: now });
  doc.session.lastSeq[clientId] = seq;

  const remember = (status, body) => { ledger.put(clientId, seq, { status, body }); return ok(status, body, true); };

  if (action.type === 'create_character') {
    if (doc.character && doc.character.runStatus === 'active') {
      return remember(409, { ok: false, code: 'active', seq, message: 'This account already has an active attorney.', state: doc.character, serverNow: now });
    }
  } else if (!doc.character) {
    return remember(404, { ok: false, code: 'no_character', seq, message: 'Create an attorney first.', state: null, serverNow: now });
  }

  const character = structuredClone(doc.character ?? freshState());
  const ctx = { now, rng };
  if (uuid) ctx.uuid = uuid;
  try {
    const { result, delivered, ended } = applyAction(character, action, ctx);
    doc.character = character;
    if (ended) {
      doc.runs.push({
        runId: character.runId, name: character.name, billableStudyMs: character.billableStudyMs ?? 0,
        casesDone: character.casesDone ?? 0, endedAt: now,
      });
    }
    return remember(200, { ok: true, seq, state: character, result, delivered, ended, serverNow: now });
  } catch (error) {
    return remember(200, { ok: false, seq, message: error?.message || 'That is not allowed right now.', state: doc.character, serverNow: now });
  }
}
