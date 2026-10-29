// Action dispatcher shared by solo play and the online account service.
//
// `applyAction(player, action, ctx)` applies one semantic action to a character
// with server-supplied time. Partner replies that have come due are settled
// first, and a failed action leaves the character exactly as it was.

import { settleReplies, saveDraft, commitWriting, submitReview, buyCosmetic, requestJurisdiction } from './apprenticeship.js';
import { COSMETICS } from './data/apprenticeship.js';
import { saveCanadaDraft, commitCanadaEmail, nextCanadaRound } from './canada.js';
import { orderBarDrink } from './lounge.js';
import { saveSidebarDraft } from './data/sidebar.js';
import {
  answerScenario, buyHint, buyTip, buyUpgrade, docReviewStart, docReviewCycle, docReviewStop,
  rest, drinkCoffee, eat, takeMoneybags, drinkWhiskey, sendHrEmail, studyTick, resetSeen,
  setPracticePack, setZone, setAppearance, createCharacter,
} from './economy.js';

const HANDLERS = {
  answer_scenario: (p, a, ctx) => answerScenario(p, a.scenarioId, a.choiceIndex, ctx),
  buy_hint: (p, a) => buyHint(p, a.scenarioId),
  buy_tip: (p, _a, ctx) => buyTip(p, ctx),
  buy_upgrade: (p, a) => buyUpgrade(p, a.id),
  doc_review_start: (p, _a, ctx) => docReviewStart(p, ctx),
  doc_review_cycle: (p, _a, ctx) => docReviewCycle(p, ctx),
  doc_review_stop: (p) => docReviewStop(p),
  rest: (p, _a, ctx) => rest(p, ctx),
  coffee: (p) => drinkCoffee(p),
  eat: (p, a) => eat(p, a.item),
  take_moneybags: (p) => takeMoneybags(p),
  drink_whiskey: (p, _a, ctx) => drinkWhiskey(p, ctx),
  bar_drink: (p, a, ctx) => {
    const { drink, slowUntil } = orderBarDrink(p, a.id, ctx.now);
    return { id: drink.id, name: drink.name, cost: drink.cost, slows: drink.slows, slowUntil };
  },
  hr_email: (p, a) => sendHrEmail(p, a.category),
  study_tick: (p, a, ctx) => studyTick(p, a.ms, ctx),
  reset_seen: (p) => resetSeen(p),
  set_practice_pack: (p, a) => setPracticePack(p, a.id),
  set_zone: (p, a) => setZone(p, a.zone),
  set_appearance: (p, a) => setAppearance(p, a.key, a.value),
  set_sidebar_draft: (p, a) => saveSidebarDraft(p, a.topicId, a.text),
  apprenticeship_introduced: (p) => { p.apprenticeship.introduced = true; return { introduced: true }; },
  apprenticeship_save_draft: (p, a) => ({ saved: saveDraft(p, a.taskId, a.draft || {}) }),
  apprenticeship_review_draft: (p, a) => {
    p.apprenticeship.reviewDrafts[String(a.packId)] = {
      selected: Array.isArray(a.selected) ? a.selected.map(String).slice(0, 200) : [],
      notes: String(a.notes ?? '').slice(0, 6000),
    };
    return { saved: true };
  },
  apprenticeship_commit: (p, a, ctx) => commitWriting(p, a.taskId, ctx.now),
  apprenticeship_submit_review: (p, a, ctx) => submitReview(p, a.packId, Array.isArray(a.selected) ? a.selected : [], a.notes, ctx.now),
  apprenticeship_buy_cosmetic: (p, a) => buyCosmetic(p, a.id),
  apprenticeship_equip: (p, a) => {
    if (!COSMETICS.some((item) => item.id === a.id) || !p.apprenticeship.cosmetics.includes(a.id)) throw new Error('You do not own that item.');
    const worn = p.apprenticeship.equipped.filter((id) => id !== a.id);
    p.apprenticeship.equipped = a.worn ? [...worn, a.id] : worn;
    return { id: a.id, worn: !!a.worn };
  },
  apprenticeship_request_jurisdiction: (p, a) => requestJurisdiction(p, a.label, a.topic, a.help),
  canada_next_round: (p) => { nextCanadaRound(p); return { round: p.canada.round }; },
  canada_draft: (p, a) => { saveCanadaDraft(p, a.id, a.text); return { saved: true }; },
  canada_commit_email: (p, a, ctx) => commitCanadaEmail(p, a.id, ctx.now),
  settle: () => ({}),
  create_character: (p, a, ctx) => createCharacter(p, a, ctx),
};

export const ACTION_TYPES = Object.keys(HANDLERS);

// Frequent or draft-only actions skip the settle pass and the rollback snapshot.
const LIGHT = new Set(['study_tick', 'settle', 'set_zone', 'set_sidebar_draft', 'apprenticeship_save_draft', 'apprenticeship_review_draft', 'canada_draft']);

export function isAction(type) { return Object.hasOwn(HANDLERS, type); }

export function applyAction(player, action, ctx) {
  const type = action?.type;
  const handler = HANDLERS[type];
  if (!handler) throw new Error(`Unknown action: ${type}`);
  if (!ctx || !Number.isFinite(ctx.now)) throw new Error('Action context requires a clock.');
  const context = { rng: Math.random, ...ctx };
  const light = LIGHT.has(type);
  const delivered = type === 'create_character' || (light && type !== 'settle') ? [] : settleReplies(player, context.now);
  const snapshot = light ? null : JSON.stringify(player);
  const wasActive = player.runStatus !== 'ended';
  try {
    const result = handler(player, action, context) ?? {};
    const ended = wasActive && player.runStatus === 'ended';
    if (ended) player.endedAt = context.now;
    return { type, result, delivered, ended };
  } catch (error) {
    if (snapshot) {
      const restored = JSON.parse(snapshot);
      for (const key of Object.keys(player)) if (!(key in restored)) delete player[key];
      Object.assign(player, restored);
    }
    throw error;
  }
}
