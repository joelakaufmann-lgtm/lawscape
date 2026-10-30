import { CANADA_PACK, CANADA_DIGEST } from './data/canada.js';

// Canada progress covers the five writing emails only; the 25 questions run
// through BarMail like every other pack (seen list, gold, Ethics, streaks).
export function freshCanadaProgress() {
  return { version: CANADA_PACK.version, digest: CANADA_DIGEST, drafts: {}, emailAttempts: [], archives: [] };
}
export function normalizeCanadaProgress(value) {
  const fresh = freshCanadaProgress();
  if (!value || typeof value !== 'object' || Array.isArray(value)) return fresh;
  if (value.version !== fresh.version || value.digest !== fresh.digest) {
    fresh.archives = [...(Array.isArray(value.archives) ? value.archives : []), { ...value, archives: [] }];
    return fresh;
  }
  return { ...fresh,
    emailAttempts: Array.isArray(value.emailAttempts) ? value.emailAttempts.filter(a => a && typeof a === 'object') : [],
    drafts: value.drafts && typeof value.drafts === 'object' && !Array.isArray(value.drafts) ? value.drafts : {},
    archives: Array.isArray(value.archives) ? value.archives : [],
  };
}
export function canadaProgress(player) {
  if (!player.canada || player.canada.digest !== CANADA_DIGEST) player.canada = normalizeCanadaProgress(player.canada);
  return player.canada;
}
export function saveCanadaDraft(player, id, text) {
  if (!CANADA_PACK.emails.some(e => e.id === id)) throw new Error('Unknown Canadian email assignment.');
  canadaProgress(player).drafts[id] = String(text).slice(0, 6000);
}
export function commitCanadaEmail(player, id, now) {
  if (player.runStatus === 'ended' || player.ethics <= 0) throw new Error('This character run has ended.');
  if (!CANADA_PACK.emails.some(e => e.id === id)) throw new Error('Unknown Canadian email assignment.');
  const progress = canadaProgress(player), text = String(progress.drafts[id] || '').trim();
  if (!text) throw new Error('Write a reply before committing.');
  const previous = progress.emailAttempts.filter(a => a.taskId === id);
  if (previous.at(-1)?.text === text) return previous.at(-1);
  const attempt = { id: `${id}:${previous.length + 1}`, taskId: id, text, committedAt: now,
    version: progress.version, digest: progress.digest, proseAssessed: false, feedbackType: 'authored-self-comparison' };
  progress.emailAttempts.push(attempt);
  delete progress.drafts[id];
  return attempt;
}
