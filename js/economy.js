// Progress rules shared by solo play and the online account service.
//
// Every function takes the player (character) object, mutates it, throws an
// Error with the player-facing message when the action is not allowed, and
// returns a JSON-safe result the interface renders from. Nothing here reads a
// clock, the DOM, storage or the state singleton: time arrives in `ctx.now`
// and randomness in `ctx.rng`, so the same code can run inside a server.

import { freshState, playerHasUpgrade, playerMaxEthics, healPlayer, damagePlayer } from './state.js';
import { normalizeAppearance } from './data/appearance.js';
import { ALL_MAIL_SCENARIOS, practiceInbox } from './data/mail.js';
import { STREAK_HEAL } from './data/ethics.js';
import { bonuses, findUpgrade } from './data/upgrades.js';
import { PRACTICE_PACKS } from './data/practice-packs.js';
import { CANADA_PACK } from './data/canada.js';
import { recordCanadaAnswer, nextCanadaRound } from './canada.js';
import { pendingAttempt } from './apprenticeship.js';
import { findHrCategory } from './data/feedback.js';
import { ZONES } from './world/zones.js';
import {
  COFFEE_ETHICS_RESTORE, APARTMENT_FOOD_COST, RAMEN_ETHICS_RESTORE, COOKED_MEAL_ETHICS_RESTORE,
  DOC_REVIEW_CYCLE_MS, DOC_REVIEW_REWARD, LINDA_TIP_COST, RILEY_HINT_COST, WHISKEY_ETHICS_DAMAGE,
  WHISKEY_SLOW_MS, MONEYBAGS_SAFE_GOLD, MONEYBAGS_ETHICS_DAMAGE, MONEYBAGS_GRACE_PURCHASES, ETHICS_TIPS,
  moneybagsAuditTriggered, rileyHintEligible, wrongAnswerDamage,
} from './data/work.js';

export const GENDERS = ['male', 'female', 'nonbinary'];
export const STUDY_TICK_MAX_MS = 10_000;
export const APARTMENT_FOOD = {
  ramen: { name: 'Ramen Noodles', restore: RAMEN_ETHICS_RESTORE, requires: null, replacedBy: 'kitchen' },
  meal: { name: 'Home-Cooked Meal', restore: COOKED_MEAL_ETHICS_RESTORE, requires: 'kitchen', replacedBy: null },
};
const PURCHASE_WAIT = 'Wait for the partner reply before making purchases.';

function activeRun(player) {
  if (player.runStatus === 'ended' || player.ethics <= 0) throw new Error('This character run has ended.');
}

function eligibleScenario(player, scenarioId) {
  const scenario = practiceInbox(player, ALL_MAIL_SCENARIOS).unread.find((item) => item.id === scenarioId);
  if (!scenario) throw new Error('That message is not open in your practice inbox.');
  return scenario;
}

// BarMail ethics scenario. Canada test-pack answers are recorded without any
// gold, Ethics or streak effect; every other pack applies the full economy.
export function answerScenario(player, scenarioId, choiceIndex, ctx) {
  activeRun(player);
  const scenario = eligibleScenario(player, scenarioId);
  const choice = scenario.choices[choiceIndex];
  if (!Number.isInteger(choiceIndex) || !choice) throw new Error('Choose one of the listed replies.');
  if (scenario.isTestPack) {
    const attempt = recordCanadaAnswer(player, scenario.id, choice.id, ctx.now);
    return { testPack: true, scenarioId, choiceIndex, matchesProposedKey: attempt.matchesProposedKey };
  }
  if (pendingAttempt(player)) throw new Error('Wait for the pending partner reply before submitting another answer.');
  const b = bonuses(player.upgrades);
  player.casesDone++;
  player.hintScenarioId = null;
  let earned = 0, healed = 0, dmg = 0, disbarred = false;
  if (choice.grade === 'correct') {
    earned = Math.round(scenario.gold * b.goldMult + b.goldFlat);
    player.gold += earned;
    player.streak++;
    player.wrongStreak = 0;
    player.correctDone++;
    if (player.streak >= 2) {
      const before = player.ethics;
      healPlayer(player, STREAK_HEAL + b.streakHealBonus);
      healed = player.ethics - before;
    }
  } else {
    player.wrongStreak++;
    dmg = wrongAnswerDamage(player.wrongStreak, playerHasUpgrade(player, 'paralegal'));
    player.streak = 0;
    disbarred = damagePlayer(player, dmg);
  }
  if (!player.seen.includes(scenario.id)) player.seen.push(scenario.id);
  return {
    testPack: false, scenarioId, choiceIndex, grade: choice.grade, correct: choice.grade === 'correct',
    earned, healed, dmg, disbarred, streak: player.streak, wrongStreak: player.wrongStreak,
    rileyHalved: dmg > 0 && playerHasUpgrade(player, 'paralegal'),
  };
}

export function buyHint(player, scenarioId) {
  activeRun(player);
  if (pendingAttempt(player)) throw new Error(PURCHASE_WAIT);
  const scenario = eligibleScenario(player, scenarioId);
  if (scenario.isTestPack) throw new Error('The Canada test pack includes a free rule briefing instead.');
  if (player.hintScenarioId === scenarioId) throw new Error('Riley has already researched this rule.');
  if (!rileyHintEligible(player.upgrades)) throw new Error('Riley needs both the Paralegal Upgrade and Ethics Treatise Shelf.');
  if (player.gold < RILEY_HINT_COST) throw new Error(`You need ${RILEY_HINT_COST} gold for an ethics hint.`);
  player.gold -= RILEY_HINT_COST;
  player.hintsPurchased++;
  player.hintScenarioId = scenarioId;
  return { scenarioId, rule: scenario.rule, cost: RILEY_HINT_COST };
}

export function tipPool(player) {
  return player.practicePack === 'canada-test'
    ? CANADA_PACK.rules.map((rule) => `${rule.title}: ${rule.summary} ${rule.limits}`)
    : ETHICS_TIPS;
}

export function buyTip(player, ctx) {
  activeRun(player);
  if (player.moneybagsStolen) throw new Error('Linda is not taking questions while the client gold is missing.');
  if (!playerHasUpgrade(player, 'paralegal')) throw new Error('Hire Riley Readsalot before asking Linda for tips.');
  if (pendingAttempt(player)) throw new Error(PURCHASE_WAIT);
  if (player.gold < LINDA_TIP_COST) throw new Error(`Come back with ${LINDA_TIP_COST} gold if you want an ethics tip.`);
  player.gold -= LINDA_TIP_COST;
  player.tipsPurchased++;
  const tips = tipPool(player);
  const tipIndex = Math.min(tips.length - 1, Math.floor(ctx.rng() * tips.length));
  return { tipIndex, source: player.practicePack === 'canada-test' ? 'canada' : 'us', cost: LINDA_TIP_COST };
}

export function buyUpgrade(player, id) {
  activeRun(player);
  const u = findUpgrade(id);
  if (!u) throw new Error('Unknown upgrade.');
  if (playerHasUpgrade(player, u.id)) throw new Error(`You already own ${u.name}.`);
  if (pendingAttempt(player)) throw new Error(PURCHASE_WAIT);
  if (player.gold < u.cost) throw new Error(`You need ${u.cost} gold for ${u.name}.`);
  const previousMax = playerMaxEthics(player);
  player.gold -= u.cost;
  player.upgrades.push(u.id);
  const addedEthicsCapacity = playerMaxEthics(player) - previousMax;
  if (addedEthicsCapacity > 0) healPlayer(player, addedEthicsCapacity);
  let audit = false;
  if (player.moneybagsStolen) {
    player.moneybagsPurchases = (player.moneybagsPurchases || 0) + 1;
    if (moneybagsAuditTriggered(player.moneybagsPurchases)) {
      player.ethics = 0;
      player.runStatus = 'ended';
      audit = true;
    }
  }
  return {
    id: u.id, name: u.name, cost: u.cost, audit,
    moneybagsPurchases: player.moneybagsStolen ? player.moneybagsPurchases : 0,
    escaped: player.moneybagsStolen ? Math.min(player.moneybagsPurchases, MONEYBAGS_GRACE_PURCHASES) : 0,
  };
}

export function docReviewActive(player) { return player.docReviewStartedAt > 0; }

export function docReviewStart(player, ctx) {
  activeRun(player);
  if (!['office', 'associates'].includes(player.zone)) throw new Error('The active files are in the main office.');
  if (docReviewActive(player)) return { startedAt: player.docReviewStartedAt, resumed: true };
  player.docReviewStartedAt = ctx.now;
  player.lastDocReviewAt = 0;
  return { startedAt: ctx.now, resumed: false };
}

// Pays every completed one-minute cycle since the last payment, keeping the
// original cadence so a late call never shortens the next cycle.
export function docReviewCycle(player, ctx) {
  activeRun(player);
  if (!docReviewActive(player)) throw new Error('Document review is not active.');
  const anchor = player.lastDocReviewAt || player.docReviewStartedAt;
  const cycles = Math.max(0, Math.floor((ctx.now - anchor) / DOC_REVIEW_CYCLE_MS));
  const earned = cycles * DOC_REVIEW_REWARD;
  if (cycles > 0) {
    player.gold += earned;
    player.documentsReviewed += cycles;
    player.lastDocReviewAt = anchor + cycles * DOC_REVIEW_CYCLE_MS;
  }
  const nextAt = (player.lastDocReviewAt || player.docReviewStartedAt) + DOC_REVIEW_CYCLE_MS;
  return { cycles, earned, nextAt, documentsReviewed: player.documentsReviewed };
}

export function docReviewStop(player) {
  const wasActive = docReviewActive(player);
  player.docReviewStartedAt = 0;
  player.lastDocReviewAt = 0;
  return { wasActive };
}

export function rest(player, ctx) {
  activeRun(player);
  if (player.zone !== 'apartment') throw new Error('Rest in your apartment bed.');
  const b = bonuses(player.upgrades);
  const since = ctx.now - player.lastRestAt;
  if (since < b.restCooldownMs) {
    const wait = Math.ceil((b.restCooldownMs - since) / 1000);
    throw new Error(`You're not tired yet. Rest again in ${wait}s.`);
  }
  if (player.ethics >= playerMaxEthics(player)) throw new Error('Your conscience is already spotless. (Ethics is full.)');
  player.lastRestAt = ctx.now;
  const before = player.ethics;
  healPlayer(player, b.restHeal);
  return { healed: player.ethics - before };
}

export function drinkCoffee(player) {
  activeRun(player);
  if (player.zone !== 'apartment') throw new Error('The coffee machine is in your apartment.');
  if (!playerHasUpgrade(player, 'coffee')) throw new Error('The counter is empty. Buy the Coffee Machine from the furniture catalog first.');
  if (player.ethics >= playerMaxEthics(player)) throw new Error('Your Ethics is already full. Save the coffee for a harder day.');
  const before = player.ethics;
  healPlayer(player, COFFEE_ETHICS_RESTORE);
  return { healed: player.ethics - before };
}

export function eat(player, item) {
  activeRun(player);
  const food = APARTMENT_FOOD[item];
  if (!food) throw new Error('Unknown meal.');
  if (player.zone !== 'apartment') throw new Error('Meals are served in your apartment.');
  if (food.requires && !playerHasUpgrade(player, food.requires)) throw new Error('Buy the Kitchen Upgrade to cook a meal.');
  if (food.replacedBy && playerHasUpgrade(player, food.replacedBy)) throw new Error('The kitchen replaced the instant noodles. Cook a meal instead.');
  if (pendingAttempt(player)) throw new Error(PURCHASE_WAIT);
  if (player.ethics >= playerMaxEthics(player)) throw new Error('Your Ethics is already full. Save the food for a harder day.');
  if (player.gold < APARTMENT_FOOD_COST) throw new Error(`You need ${APARTMENT_FOOD_COST} gold for ${food.name.toLowerCase()}.`);
  player.gold -= APARTMENT_FOOD_COST;
  const before = player.ethics;
  healPlayer(player, food.restore);
  return { item, name: food.name, cost: APARTMENT_FOOD_COST, healed: player.ethics - before };
}

export function takeMoneybags(player) {
  activeRun(player);
  if (player.zone !== 'corner_office') throw new Error('The safe is in Jim Hardsell’s corner office.');
  if (pendingAttempt(player)) throw new Error('Your partner has a pending reply. Even Jim can wait five seconds.');
  if (player.moneybagsStolen) throw new Error('The safe is empty.');
  player.moneybagsStolen = true;
  player.moneybagsPurchases = 0;
  player.gold += MONEYBAGS_SAFE_GOLD;
  const disbarred = damagePlayer(player, MONEYBAGS_ETHICS_DAMAGE);
  return { disbarred, gold: MONEYBAGS_SAFE_GOLD, damage: MONEYBAGS_ETHICS_DAMAGE };
}

export function drinkWhiskey(player, ctx) {
  activeRun(player);
  if (player.zone !== 'corner_office') throw new Error('The bar cart is in Jim Hardsell’s corner office.');
  if (player.whiskeyDrinks > 0) throw new Error('A second drink at work is a warning sign.');
  player.whiskeyDrinks++;
  const disbarred = damagePlayer(player, WHISKEY_ETHICS_DAMAGE);
  if (!disbarred) player.slowUntil = Math.max(player.slowUntil || 0, ctx.now + WHISKEY_SLOW_MS);
  return { disbarred, damage: WHISKEY_ETHICS_DAMAGE, slowUntil: player.slowUntil };
}

export function sendHrEmail(player, categoryId) {
  const category = findHrCategory(categoryId);
  player.hrEmailsSent = (player.hrEmailsSent || 0) + 1;
  return { categoryId: category.id, ticket: String(player.hrEmailsSent).padStart(4, '0') };
}

// Billable study time. The credit is bounded by the real time since the last
// tick so a client cannot report more study than has elapsed.
export function studyTick(player, ms, ctx) {
  if (player.runStatus === 'ended' || player.ethics <= 0) return { credited: 0 };
  if (!Number.isFinite(ms) || ms < 0) throw new Error('Invalid study tick.');
  const sinceLast = player.lastStudyTickAt ? Math.max(0, ctx.now - player.lastStudyTickAt) * 1.1 + 250 : ms;
  const credited = Math.min(ms, STUDY_TICK_MAX_MS, sinceLast);
  player.billableStudyMs = (player.billableStudyMs || 0) + credited;
  player.lastStudyTickAt = ctx.now;
  return { credited };
}

// "Start another study round": forget this tier's answered mail, or advance
// the Canada test pack to its next round.
export function resetSeen(player) {
  activeRun(player);
  if (player.practicePack === 'canada-test') {
    nextCanadaRound(player);
    return { pack: 'canada-test', round: player.canada.round };
  }
  const ids = new Set(practiceInbox(player, ALL_MAIL_SCENARIOS).eligible.map((item) => item.id));
  player.seen = player.seen.filter((id) => !ids.has(id));
  return { pack: player.practicePack, cleared: ids.size };
}

export function setPracticePack(player, id) {
  player.practicePack = PRACTICE_PACKS.some((pack) => pack.id === id) ? id : 'mixed';
  return { id: player.practicePack };
}

export function setZone(player, zone) {
  if (!ZONES[zone]) throw new Error('Unknown location.');
  player.zone = zone;
  return { zone };
}

export function setAppearance(player, key, value) {
  const keys = Object.keys(normalizeAppearance());
  if (!keys.includes(key)) throw new Error('Unknown appearance option.');
  Object.assign(player, normalizeAppearance({ ...player, [key]: value }));
  if (key === 'tieColor') player.apprenticeship.equipped = player.apprenticeship.equipped.filter((id) => id !== 'tie-brass');
  return { key, value: player[key] };
}

// A brand-new character on this save or account. Nothing from a previous run
// is retained except what the caller passes in.
export function createCharacter(player, { name, gender, appearance } = {}, ctx) {
  const fresh = freshState();
  if (ctx?.uuid) fresh.runId = ctx.uuid();
  for (const key of Object.keys(player)) delete player[key];
  Object.assign(player, fresh);
  player.name = String(name ?? '').trim().slice(0, 80) || 'Alex Barrister';
  player.gender = GENDERS.includes(gender) ? gender : 'nonbinary';
  Object.assign(player, normalizeAppearance(appearance || {}));
  return { runId: player.runId, name: player.name };
}
