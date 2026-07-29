// Shared economy values for the office's repeatable work and NPC interactions.
// Keeping them in a small data module makes the launch promises testable.

export const DOC_REVIEW_CYCLE_MS = 60_000;
export const DOC_REVIEW_REWARD = 5;
export const COFFEE_ETHICS_RESTORE = 2;
export const LINDA_TIP_COST = 5;
export const RILEY_HINT_COST = 100;
export const WHISKEY_ETHICS_DAMAGE = 2;
export const WHISKEY_SLOW_MS = 40_000;
export const LAWYER_ASSISTANCE_PHONE = '866-828-0022';
export const LAWYER_ASSISTANCE_URL = 'https://nvbar.org/for-lawyers/resources/wellbeing/lcl/';

export function rileyHintEligible(upgrades) {
  return upgrades.includes('paralegal') && upgrades.includes('subscription');
}

export function wrongAnswerDamage(wrongStreak, rileyHired = false) {
  const damage = wrongStreak >= 4 ? 40 : wrongStreak >= 2 ? 30 : 20;
  return rileyHired ? Math.ceil(damage / 2) : damage;
}
