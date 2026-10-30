// The study list: every BarMail question a character has answered wrongly and
// not yet answered correctly, rendered as Markdown for export. Pure: no DOM.

import { PRACTICE_PACKS } from './data/practice-packs.js';

export function missedScenarios(player, scenarios) {
  return (player.missed || [])
    .map((entry) => { const scenario = scenarios.find((item) => item.id === entry.id); return scenario ? { entry, scenario } : null; })
    .filter(Boolean)
    .reverse(); // newest first
}

const packLabel = (scenario) => PRACTICE_PACKS.find((pack) => pack.sourceType === scenario.sourceType)?.label || scenario.sourceType || 'LawScape';

export function buildStudyList(player, scenarios, now = 0) {
  const items = missedScenarios(player, scenarios);
  const date = new Date(now || 0).toISOString().slice(0, 10);
  const out = [`# LawScape study list — ${player.name}`, '',
    `${items.length} question${items.length === 1 ? '' : 's'} to review · exported ${date}`,
    'Unofficial educational practice from a fictional firm, not legal advice. Each entry shows the reply you chose and the preferred reply with its rationale.', ''];
  items.forEach(({ entry, scenario }, i) => {
    const yours = scenario.choices[entry.choiceIndex];
    const right = scenario.choices.find((choice) => choice.grade === 'correct');
    out.push(`## ${i + 1}. ${scenario.subject}`, '',
      `**Pack:** ${packLabel(scenario)}${scenario.jurisdiction ? ` · ${scenario.jurisdiction}` : ''}  `,
      `**From:** ${scenario.from}, ${scenario.role}  `,
      `**Rule:** ${scenario.rule}`, '',
      scenario.body, '',
      `**Your reply:** ${yours?.text || '(reply no longer in this pack)'}`);
    if (yours?.why) out.push('', `> ${yours.why}`);
    out.push('', `**Preferred reply:** ${right?.text || '(see rule)'}`);
    const rationale = scenario.explanation || right?.why;
    if (rationale) out.push('', `> ${rationale}`);
    if (scenario.sourceUrl) out.push('', `Source: ${scenario.sourceUrl}`);
    out.push('');
  });
  return out.join('\n').replace(/\n{3,}/g, '\n\n');
}
