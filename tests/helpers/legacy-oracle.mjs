// Verbatim copies of the inline progress math from js/main.js as it stood
// before the shared reducer existed (0.6.0). Test-only oracle for the replay
// test; delete after the first release that ships js/economy.js.

import { STREAK_HEAL } from '../../js/data/ethics.js';
import { bonuses, findUpgrade } from '../../js/data/upgrades.js';
import {
  COFFEE_ETHICS_RESTORE, APARTMENT_FOOD_COST, DOC_REVIEW_CYCLE_MS, DOC_REVIEW_REWARD, LINDA_TIP_COST,
  RILEY_HINT_COST, WHISKEY_ETHICS_DAMAGE, WHISKEY_SLOW_MS, MONEYBAGS_SAFE_GOLD, MONEYBAGS_ETHICS_DAMAGE,
  moneybagsAuditTriggered, wrongAnswerDamage,
} from '../../js/data/work.js';

function hasUpgrade(p, id) { return p.upgrades.includes(id); }
function maxEthics(p) {
  if (p.moneybagsStolen) return 50;
  return 100 + (hasUpgrade(p, 'mattress') ? 20 : 0) + (hasUpgrade(p, 'kitchen') ? 10 : 0) + (hasUpgrade(p, 'liz_chair') ? 10 : 0);
}
function healEthics(p, n) { p.ethics = Math.min(maxEthics(p), p.ethics + n); }
function damageEthics(p, n) { p.ethics = Math.max(0, p.ethics - n); if (p.ethics <= 0) p.runStatus = 'ended'; return p.ethics <= 0; }

// main.js 683-726
export function legacyAnswer(p, s, choice) {
  const b = bonuses(p.upgrades);
  p.casesDone++;
  if (choice.grade === 'correct') {
    const earned = Math.round(s.gold * b.goldMult + b.goldFlat);
    p.gold += earned; p.streak++; p.wrongStreak = 0; p.correctDone++;
    if (p.streak >= 2) healEthics(p, STREAK_HEAL + b.streakHealBonus);
  } else {
    p.wrongStreak++;
    const dmg = wrongAnswerDamage(p.wrongStreak, hasUpgrade(p, 'paralegal'));
    p.streak = 0;
    damageEthics(p, dmg);
  }
  if (!p.seen.includes(s.id)) p.seen.push(s.id);
}
// main.js 1111-1131
export function legacyBuy(p, id) {
  const u = findUpgrade(id);
  if (p.upgrades.includes(id) || p.gold < u.cost) return;
  const previousMax = maxEthics(p);
  p.gold -= u.cost; p.upgrades.push(u.id);
  const added = maxEthics(p) - previousMax;
  if (added > 0) healEthics(p, added);
  if (p.moneybagsStolen) p.moneybagsPurchases = (p.moneybagsPurchases || 0) + 1;
  if (p.moneybagsStolen && moneybagsAuditTriggered(p.moneybagsPurchases)) { p.ethics = 0; p.runStatus = 'ended'; }
}
// main.js 1170-1185
export function legacyRest(p, now) {
  const b = bonuses(p.upgrades);
  if (now - p.lastRestAt < b.restCooldownMs) return;
  if (p.ethics >= maxEthics(p)) return;
  p.lastRestAt = now; healEthics(p, b.restHeal);
}
// main.js 1189-1198
export function legacyCoffee(p) {
  if (!hasUpgrade(p, 'coffee') || p.ethics >= maxEthics(p)) return;
  healEthics(p, COFFEE_ETHICS_RESTORE);
}
// main.js 1206-1216
export function legacyEat(p, restore) {
  if (p.ethics >= maxEthics(p) || p.gold < APARTMENT_FOOD_COST) return;
  p.gold -= APARTMENT_FOOD_COST; healEthics(p, restore);
}
// main.js 1275-1279
export function legacyMoneybags(p) {
  if (p.moneybagsStolen) return;
  p.moneybagsStolen = true; p.moneybagsPurchases = 0; p.gold += MONEYBAGS_SAFE_GOLD;
  damageEthics(p, MONEYBAGS_ETHICS_DAMAGE);
}
// main.js 1325-1326 + the "Walk it off" choice
export function legacyWhiskey(p, now) {
  if (p.whiskeyDrinks > 0) return;
  p.whiskeyDrinks++;
  if (damageEthics(p, WHISKEY_ETHICS_DAMAGE)) return;
  p.slowUntil = now + WHISKEY_SLOW_MS;
}
// main.js 1074-1078
export function legacyDocCycles(p, elapsedMs) {
  let elapsed = elapsedMs;
  while (elapsed >= DOC_REVIEW_CYCLE_MS) { p.gold += DOC_REVIEW_REWARD; p.documentsReviewed++; elapsed -= DOC_REVIEW_CYCLE_MS; }
}
// main.js 437-438 / 642-643 / 1441
export function legacyTip(p) { if (p.gold < LINDA_TIP_COST) return; p.gold -= LINDA_TIP_COST; p.tipsPurchased++; }
export function legacyHint(p) { if (p.gold < RILEY_HINT_COST) return; p.gold -= RILEY_HINT_COST; p.hintsPurchased++; }
export function legacyHr(p) { p.hrEmailsSent = (p.hrEmailsSent || 0) + 1; }
