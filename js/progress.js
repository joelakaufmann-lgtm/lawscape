// Client-side progress dispatch.
//
// Solo play applies every action locally through the shared reducer and saves
// to this browser. Online play posts the same action to the account service,
// which applies the reducer with its own clock and returns the new character;
// the browser never computes rewards itself in that mode.

import { state, save, replaceState, setPersistence } from './state.js';
import { applyAction } from './actions.js';
import { now, setServerNow } from './clock.js';

const STUDY_FLUSH_MS = 5_000;
const RETRY_DELAYS_MS = [500, 1000, 2000];

let mode = 'solo';
let transport = null;      // { act(envelope), beacon(envelope), fetchState(), onExpired() }
let clientId = null;
let seq = 0;
let queue = Promise.resolve();
let onDelivered = null;
let studyUnflushedMs = 0;
let studyUnsavedMs = 0;
let studyLastFlushAt = 0;
const coalesced = new Map();

export function configureProgress({ mode: nextMode = 'solo', transport: nextTransport = null, onDelivered: deliveredHook = null } = {}) {
  mode = nextMode === 'online' ? 'online' : 'solo';
  transport = nextTransport;
  onDelivered = deliveredHook;
  clientId = mode === 'online' ? (globalThis.crypto?.randomUUID?.() || `tab-${Date.now()}-${Math.random().toString(36).slice(2)}`) : null;
  seq = 0;
  studyUnflushedMs = 0;
  studyUnsavedMs = 0;
  studyLastFlushAt = 0;
  setPersistence(mode === 'online' ? 'server' : 'local');
}

export function isOnline() { return mode === 'online'; }
export function progressClientId() { return clientId; }

function coalesceKey(action) {
  return `${action.type}:${action.taskId ?? action.packId ?? action.id ?? action.topicId ?? ''}`;
}

function applyLocally(action, persist) {
  const envelope = applyAction(state, action, { now: now(), rng: Math.random });
  if (persist) save();
  if (envelope.delivered.length && onDelivered) onDelivered(envelope.delivered);
  return envelope;
}

async function postWithRetry(envelope) {
  let lastError = null;
  for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt++) {
    try {
      return await transport.act(envelope);
    } catch (error) {
      lastError = error;
      if (attempt < RETRY_DELAYS_MS.length) await new Promise((resolve) => setTimeout(resolve, RETRY_DELAYS_MS[attempt]));
    }
  }
  throw lastError || new Error('Connection lost.');
}

function adoptServerState(response) {
  if (Number.isFinite(response.serverNow)) setServerNow(response.serverNow);
  if (response.state && typeof response.state === 'object') replaceState(response.state, { preserve: ['pos'] });
}

async function sendOnline(action) {
  const envelope = { clientId, seq: ++seq, action };
  let response;
  try {
    response = await postWithRetry(envelope);
  } catch {
    // The server may have applied the action even though the reply was lost.
    try { adoptServerState(await transport.fetchState()); } catch { /* still offline */ }
    throw new Error('Connection lost. Check your connection and try again.');
  }
  if (response.expired) {
    transport.onExpired?.();
    throw new Error('Your online session expired. Sign in again to continue.');
  }
  adoptServerState(response);
  if (!response.ok) throw new Error(response.message || 'The firm could not process that action.');
  const envelopeOut = { type: action.type, result: response.result ?? {}, delivered: response.delivered ?? [], ended: !!response.ended };
  if (envelopeOut.delivered.length && onDelivered) onDelivered(envelopeOut.delivered);
  return envelopeOut;
}

// Apply one action. Resolves with { type, result, delivered, ended } or rejects
// with the player-facing message. Online actions are serialised per tab.
export function dispatch(action, { persist = true, coalesce = 0 } = {}) {
  if (mode !== 'online') {
    try { return Promise.resolve(applyLocally(action, persist)); }
    catch (error) { return Promise.reject(error); }
  }
  if (!transport) return Promise.reject(new Error('Online transport is not configured.'));
  if (coalesce > 0) {
    const key = coalesceKey(action);
    const pending = coalesced.get(key);
    if (pending) { clearTimeout(pending.timer); pending.action = action; }
    const entry = pending || { action, timer: null, promise: null, resolve: null, reject: null };
    if (!pending) entry.promise = new Promise((resolve, reject) => { entry.resolve = resolve; entry.reject = reject; });
    entry.timer = setTimeout(() => {
      coalesced.delete(key);
      queue = queue.then(() => sendOnline(entry.action)).then(entry.resolve, entry.reject);
    }, coalesce);
    coalesced.set(key, entry);
    return entry.promise;
  }
  const run = queue.then(() => sendOnline(action));
  queue = run.catch(() => {});
  return run;
}

// Billable study ticks: per frame in solo play (identical totals to the
// original loop); batched every few seconds online.
export function recordStudy(ms) {
  if (!(ms > 0)) return;
  if (mode !== 'online') {
    applyAction(state, { type: 'study_tick', ms }, { now: now() });
    studyUnsavedMs += ms;
    if (studyUnsavedMs >= STUDY_FLUSH_MS) { studyUnsavedMs = 0; save(); }
    return;
  }
  studyUnflushedMs += ms;
  if (now() - studyLastFlushAt >= STUDY_FLUSH_MS) flushStudy();
}

export function displayedBillableMs() {
  return (state.billableStudyMs || 0) + (mode === 'online' ? studyUnflushedMs : 0);
}

export function flushStudy({ beacon = false } = {}) {
  if (mode !== 'online' || studyUnflushedMs <= 0 || !transport) return false;
  const ms = Math.round(studyUnflushedMs);
  studyUnflushedMs = 0;
  studyLastFlushAt = now();
  const envelope = { clientId, seq: ++seq, action: { type: 'study_tick', ms } };
  if (beacon && transport.beacon) return transport.beacon(envelope);
  queue = queue.then(() => transport.act(envelope).then(adoptServerState)).catch(() => { studyUnflushedMs += ms; });
  return true;
}

// Online only: adopt the account document after a reload or resync.
export function adoptAccountState(response) {
  adoptServerState(response);
}
