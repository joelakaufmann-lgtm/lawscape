import { CURRICULUM_VERSION, TRAINING_JURISDICTION, DOCUMENT_PACKS, WRITING_TASKS, CAPSTONE, COSMETICS, evidenceAt } from './data/apprenticeship.js';

export const PARTNER_DELAY_MS = 5_000;
export function freshApprenticeship() {
  return { version: 1, office: 'juris', introduced: false, drafts: {}, attempts: [], reviews: {}, reviewDrafts: {}, requests: [], cosmetics: [], equipped: [] };
}

export function taskById(id) { return [...WRITING_TASKS, CAPSTONE].find((task) => task.id === id); }
export function activeRun(player) { return player.ethics > 0 && player.runStatus !== 'ended'; }
export function pendingAttempt(player) { return player.apprenticeship.attempts.find((a) => a.status === 'pending' && a.runId === player.runId); }
export function taskAttempts(player, id) { return player.apprenticeship.attempts.filter((a) => a.taskId === id && a.runId === player.runId); }
export function returnedTasks(player) { return WRITING_TASKS.filter((task) => taskAttempts(player, task.id).some((a) => a.status === 'returned')); }
export function capstoneReady(player) {
  return returnedTasks(player).length === WRITING_TASKS.length && DOCUMENT_PACKS.every((pack) => player.apprenticeship.reviews[pack.id]);
}

export function saveDraft(player, taskId, draft) {
  if (!activeRun(player) || !taskById(taskId)) return false;
  player.apprenticeship.drafts[taskId] = {
    text: String(draft.text || '').slice(0, 6000),
    issue: draft.issue, action: draft.action, evidence: String(draft.evidence || '').slice(0, 12),
  };
  return true;
}

export function commitWriting(player, taskId, now = Date.now()) {
  const task = taskById(taskId), draft = player.apprenticeship.drafts[taskId];
  if (!activeRun(player)) throw new Error('This character run has ended.');
  if (!task || !draft) throw new Error('Write a draft first.');
  if (pendingAttempt(player)) throw new Error('Wait for the pending partner reply before committing another task.');
  if (taskId === 'capstone' && !capstoneReady(player)) throw new Error('Finish both document files and receive all six partner replies first.');
  if (!draft.text.trim() || !Number.isInteger(draft.issue) || !task.issues[draft.issue]
      || !Number.isInteger(draft.action) || !task.actions[draft.action] || !task.sources.includes(draft.evidence)) {
    throw new Error('Add your reply, issue, next step and supporting passage before committing.');
  }
  const previous = taskAttempts(player, taskId);
  if (previous.length >= 2 || previous.some((a) => a.result?.correct === 3)) throw new Error('This assignment is complete. You can reread its correspondence.');
  if (previous.length && previous[0].submission.text === draft.text.trim()) throw new Error('Revise your written reply before sending a new attempt.');
  const attempt = {
    id: `${player.runId}:${taskId}:${previous.length + 1}`, runId: player.runId, taskId,
    version: CURRICULUM_VERSION, jurisdiction: TRAINING_JURISDICTION, rubric: 'structured-choices-1',
    status: 'pending', committedAt: now, replyAt: now + PARTNER_DELAY_MS,
    revisionOf: previous[0]?.id || null,
    submission: { text: draft.text.trim(), issue: draft.issue, action: draft.action, evidence: draft.evidence },
    rewardApplied: false,
  };
  player.apprenticeship.attempts.push(attempt);
  delete player.apprenticeship.drafts[taskId];
  return attempt;
}

// Authored checklist assessment only. Free text is preserved for self-comparison,
// never keyword graded. Rewards are local study gold, not an online credential.
export function settleReplies(player, now = Date.now()) {
  if (!activeRun(player)) return [];
  const delivered = [];
  for (const attempt of player.apprenticeship.attempts) {
    if (attempt.status !== 'pending' || attempt.runId !== player.runId || attempt.replyAt > now || attempt.rewardApplied) continue;
    const task = taskById(attempt.taskId);
    if (!task || attempt.version !== CURRICULUM_VERSION) continue;
    const checks = [attempt.submission.issue === task.issue, attempt.submission.action === task.action, attempt.submission.evidence === task.evidence];
    const correct = checks.filter(Boolean).length;
    const base = task.id === 'capstone' ? 175 : 40;
    const original = player.apprenticeship.attempts.find((a) => a.id === attempt.revisionOf);
    const gold = original
      ? Math.round(base * 0.2 * Math.max(0, correct - (original.result?.correct || 0)) / 3)
      : Math.round(base * (0.25 + 0.75 * correct / 3));
    attempt.result = { correct, checks, gold, proseAssessed: false };
    attempt.status = 'returned';
    attempt.rewardApplied = true;
    attempt.returnedAt = now;
    player.gold += gold;
    delivered.push(attempt);
  }
  return delivered;
}

export function submitReview(player, packId, selected, notes, now = Date.now()) {
  if (!activeRun(player)) throw new Error('This character run has ended.');
  if (pendingAttempt(player)) throw new Error('Wait for your partner’s reply before committing another reward.');
  const pack = DOCUMENT_PACKS.find((item) => item.id === packId);
  if (!pack) throw new Error('Unknown document file.');
  if (player.apprenticeship.reviews[packId]) throw new Error('This file already has a review receipt.');
  const anchors = [...new Set(selected)].filter((anchor) => evidenceAt(anchor)?.pack.id === packId);
  if (!anchors.length || !String(notes).trim()) throw new Error('Flag at least one passage and explain your findings.');
  const expected = pack.findings.map((finding) => finding.anchor);
  const hits = anchors.filter((anchor) => expected.includes(anchor));
  const falsePositives = anchors.filter((anchor) => !expected.includes(anchor));
  const gold = Math.round(15 + 60 * Math.max(0, hits.length - falsePositives.length) / expected.length);
  const receipt = { runId: player.runId, version: CURRICULUM_VERSION, selected: anchors, notes: String(notes).slice(0, 6000), hits, falsePositives, gold, at: now };
  player.apprenticeship.reviews[packId] = receipt;
  delete player.apprenticeship.reviewDrafts[packId];
  player.gold += gold;
  return receipt;
}

export function buyCosmetic(player, id) {
  if (!activeRun(player) || pendingAttempt(player)) throw new Error('Finish the pending partner reply before making a purchase.');
  const item = COSMETICS.find((cosmetic) => cosmetic.id === id);
  if (!item) throw new Error('Unknown wardrobe item.');
  if (player.apprenticeship.cosmetics.includes(id)) throw new Error('You already own this item.');
  if (player.gold < item.price) throw new Error(`You need ${item.price} gold.`);
  player.gold -= item.price;
  player.apprenticeship.cosmetics.push(id);
  player.apprenticeship.equipped.push(id);
  return item;
}

export function requestJurisdiction(player, label, topic, help) {
  const clean = String(label).trim().replace(/\s+/g, ' ').slice(0, 80);
  const cleanTopic = String(topic).trim().slice(0, 500);
  if (!clean || !cleanTopic) throw new Error('Name the legal jurisdiction and the work you would like to practice.');
  const key = clean.toLocaleLowerCase('en-US');
  const aliases = { nevada: 'us-nv', 'us-nv': 'us-nv', california: 'us-ca', arizona: 'us-az', 'england and wales': 'gb-ew', 'england & wales': 'gb-ew' };
  const id = aliases[key] || key;
  const existing = player.apprenticeship.requests.find((request) => request.id === id);
  if (existing) return existing;
  const request = { id, label: clean, topic: cleanTopic, help: String(help || '').trim().slice(0, 500), status: 'Saved locally · not submitted' };
  player.apprenticeship.requests.push(request);
  return request;
}

export function requestIssueUrl(request) {
  const body = `Jurisdiction: ${request.label}\n\nPractice interests: ${request.topic}\n\nReviewer offer / public sources: ${request.help || 'None supplied.'}\n\nProduct suggestion only. No real matter information. Saved locally in LawScape; submit this issue to send it to the maintainers.`;
  return `https://github.com/joelakaufmann-lgtm/lawscape/issues/new?title=${encodeURIComponent(`[Jurisdiction request] ${request.label}`)}&body=${encodeURIComponent(body)}`;
}
