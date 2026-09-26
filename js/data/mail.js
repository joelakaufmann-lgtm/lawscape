export function canAccessBarMail(player) { return player.zone === 'office' || player.upgrades.includes('work_phone'); }
export function scenarioMatchesPack(scenario, pack) {
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
