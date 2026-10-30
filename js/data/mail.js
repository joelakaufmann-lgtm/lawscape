import { SCENARIOS } from './ethics.js';
import { CANADA_SCENARIOS } from './canada.js';

// Every scenario BarMail can serve, across all practice packs.
export const ALL_MAIL_SCENARIOS = [...SCENARIOS, ...CANADA_SCENARIOS];

// BarMail runs on the office computer, the Work Phone anywhere, or an open desk
// on the Associates' Floor once the player has claimed one.
export function canAccessBarMail(player, seatedAtDesk = false) {
  return player.zone === 'office' || player.upgrades.includes('work_phone')
    || (player.zone === 'associates' && seatedAtDesk);
}
export function scenarioMatchesPack(scenario, pack) {
  if (pack === 'canada') return scenario.sourceType === 'canada-style';
  if (pack === 'ca') return scenario.sourceType === 'california-style';
  if (pack === 'ny') return scenario.sourceType === 'new-york-style';
  if (pack === 'sqe') return scenario.sourceType === 'sqe-style';
  if (pack === 'mpre') return scenario.sourceType === 'mpre-style';
  if (pack === 'juris') return scenario.sourceType === 'lawscape';
  return true;
}
export function practiceInbox(player, scenarios) {
  const difficulty = player.casesDone < 5 ? 1 : player.casesDone < 12 ? 2 : 3;
  const pool = scenarios.filter((scenario) => scenarioMatchesPack(scenario, player.practicePack));
  const tier = pool.filter((scenario) => scenario.difficulty === difficulty);
  const eligible = tier.length ? tier : pool;
  return { eligible, unread: eligible.filter((scenario) => !player.seen.includes(scenario.id)), difficulty, levelLabel: tier.length ? `Level ${difficulty}` : 'All levels' };
}
export function billableMessageOpen({ inGame, visible, mailOpen, messageOpen }) {
  return inGame && visible && mailOpen && messageOpen;
}
