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
export const ARCADE_PLAY_COST = 5;
export const ARCADE_ROUNDS_PER_PLAY = 3;
export const ESPRESSO_ETHICS_RESTORE = 5;
export const ESPRESSO_COOLDOWN_MS = 90_000;
export const DRUNK_AT_WORK_ETHICS_DAMAGE = 10;
// Arriving impaired at the firm or the courthouse costs Ethics; home, the
// street and The Sidebar never do.
export const DRUNK_PENALTY_ZONES = ['office', 'corner_office', 'linda_office', 'conference_room', 'associates', 'courtroom'];
export const STREAK_GOLD_STEP = 0.1;
export const STREAK_GOLD_CAP = 1.5;
export const LAWYER_ASSISTANCE_PHONE = '866-828-0022';
export const LAWYER_ASSISTANCE_URL = 'https://nvbar.org/for-lawyers/resources/wellbeing/lcl/';

// Linda's paid tips. Canada test play swaps in the pack's rule briefings.
export const ETHICS_TIPS = [
  'Client consent to a conflict usually must be informed and confirmed in writing. A signature without an explanation of material risks is not enough.',
  'Advance fees belong in trust until earned. Calling money “nonrefundable” does not transform unearned money into the firm’s property.',
  'Confidentiality is broader than attorney-client privilege. Do not use the two concepts as synonyms.',
  'With an unrepresented person whose interests may conflict with your client’s, the safest legal advice is: get your own lawyer.',
  'Candor to the tribunal can require correcting a false statement even when correction hurts the client’s position.',
  'A subordinate lawyer remains responsible for a clear ethics violation even when a supervisor ordered it.',
  'Reporting misconduct requires a substantial question about honesty, trustworthiness, or fitness—not every technical rule violation.',
  'When client and third-party claims to funds conflict, keep the disputed portion separate while promptly releasing any undisputed portion.',
];

export function rileyHintEligible(upgrades) {
  return upgrades.includes('paralegal') && upgrades.includes('subscription');
}

// Beta rebalance: ethics violations hurt. A fresh 100-Ethics attorney is
// disbarred by THREE consecutive wrong answers (30 + 45 + 45), not four.
export function wrongAnswerDamage(wrongStreak, rileyHired = false) {
  const damage = wrongStreak >= 4 ? 60 : wrongStreak >= 2 ? 45 : 30;
  return rileyHired ? Math.ceil(damage / 2) : damage;
}

// Consecutive correct answers multiply question gold: x1.0, x1.1 … capped at
// x1.5 from the sixth answer in a row. Rounded so 1.2 is 1.2, not 1.2000000000000002.
export function streakMultiplier(streak) {
  return Math.min(STREAK_GOLD_CAP, Math.round((1 + STREAK_GOLD_STEP * Math.max(0, streak - 1)) * 100) / 100);
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
