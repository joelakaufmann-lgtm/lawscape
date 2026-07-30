// Shared economy values for the office's repeatable work and NPC interactions.
// Keeping them in a small data module makes the launch promises testable.

export const DOC_REVIEW_CYCLE_MS = 60_000;
export const DOC_REVIEW_REWARD = 5;
export const COFFEE_ETHICS_RESTORE = 2;
export const APARTMENT_FOOD_COST = 5;
export const RAMEN_ETHICS_RESTORE = 5;
export const COOKED_MEAL_ETHICS_RESTORE = 30;
export const LINDA_TIP_COST = 5;
export const RILEY_HINT_COST = 100;
export const WHISKEY_ETHICS_DAMAGE = 2;
export const WHISKEY_SLOW_MS = 40_000;
export const MONEYBAGS_SAFE_GOLD = 6_000;
export const MONEYBAGS_ETHICS_DAMAGE = 99;
export const MONEYBAGS_GRACE_PURCHASES = 2;
export const LAWYER_ASSISTANCE_PHONE = '866-828-0022';
export const LAWYER_ASSISTANCE_URL = 'https://nvbar.org/for-lawyers/resources/wellbeing/lcl/';

export function rileyHintEligible(upgrades) {
  return upgrades.includes('paralegal') && upgrades.includes('subscription');
}

// Beta rebalance: ethics violations hurt. A fresh 100-Ethics attorney is
// disbarred by THREE consecutive wrong answers (30 + 45 + 45), not four.
export function wrongAnswerDamage(wrongStreak, rileyHired = false) {
  const damage = wrongStreak >= 4 ? 60 : wrongStreak >= 2 ? 45 : 30;
  return rileyHired ? Math.ceil(damage / 2) : damage;
}

export function moneybagsAuditTriggered(purchasesAfterTheft) {
  return purchasesAfterTheft > MONEYBAGS_GRACE_PURCHASES;
}

export function formatBillableTime(milliseconds = 0) {
  const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}
