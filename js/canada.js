import { CANADA_PACK, CANADA_DIGEST } from './data/canada.js';

export function freshCanadaProgress() {
  return { version: CANADA_PACK.version, digest: CANADA_DIGEST, round: 1, questionAttempts: [], drafts: {}, emailAttempts: [], archives: [] };
}
export function normalizeCanadaProgress(value) {
  const fresh = freshCanadaProgress();
  if (!value || typeof value !== 'object' || Array.isArray(value)) return fresh;
  if (value.version !== fresh.version || value.digest !== fresh.digest) {
    fresh.archives = [...(Array.isArray(value.archives) ? value.archives : []), { ...value, archives: [] }];
    return fresh;
  }
  return { ...fresh, ...value,
    round: Number.isSafeInteger(value.round) && value.round > 0 ? value.round : 1,
    questionAttempts: Array.isArray(value.questionAttempts) ? value.questionAttempts.filter(a => a && typeof a === 'object') : [],
    emailAttempts: Array.isArray(value.emailAttempts) ? value.emailAttempts.filter(a => a && typeof a === 'object') : [],
    drafts: value.drafts && typeof value.drafts === 'object' && !Array.isArray(value.drafts) ? value.drafts : {},
    archives: Array.isArray(value.archives) ? value.archives : [],
  };
}
export function canadaProgress(player) {
  if (!player.canada || player.canada.digest !== CANADA_DIGEST) player.canada = normalizeCanadaProgress(player.canada);
  return player.canada;
}
export function canadaUnread(player, scenarios) {
  const progress = canadaProgress(player);
  const done = new Set(progress.questionAttempts.filter(a => a.round === progress.round).map(a => a.questionId));
  return scenarios.filter(q => !done.has(q.id));
}
export function nextCanadaRound(player) {
  const progress = canadaProgress(player);
  if (canadaUnread(player, CANADA_PACK.questions).length) throw new Error('Finish this study round first.');
  progress.round += 1;
}
export function recordCanadaAnswer(player, questionId, optionId, now) {
  if (player.runStatus === 'ended' || player.ethics <= 0) throw new Error('This character run has ended.');
  const question = CANADA_PACK.questions.find(q => q.id === questionId);
  if (!question || !question.options.some(o => o.id === optionId)) throw new Error('Unknown question or option.');
  const progress = canadaProgress(player);
  const prior = progress.questionAttempts.find(a => a.questionId === questionId && a.round === progress.round);
  if (prior) return prior;
  const attempt = { questionId, optionId, expectedOptionId: question.answer, matchesProposedKey: optionId === question.answer,
    round: progress.round, at: now, version: progress.version, digest: progress.digest };
  progress.questionAttempts.push(attempt);
  return attempt;
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
