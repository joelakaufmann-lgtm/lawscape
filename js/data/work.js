// Shared economy values for the office's repeatable work and NPC interactions.
// Keeping them in a small data module makes the launch promises testable.

export const DOC_REVIEW_CYCLE_MS = 60_000;
export const DOC_REVIEW_REWARD = 5;
export const COFFEE_ETHICS_RESTORE = 2;
export const LINDA_TIP_COST = 5;
export const RILEY_HINT_COST = 100;

export function rileyHintEligible(upgrades) {
  return upgrades.includes('paralegal') && upgrades.includes('subscription');
}
