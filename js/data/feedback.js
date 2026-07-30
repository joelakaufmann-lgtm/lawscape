// Email HR — LawScape's bug-report and feedback channel, played in character.
//
// Hardsell & Firestone's Human Resources department has been "temporarily
// unstaffed" since 1987, so every message the player sends "to HR" is really a
// hand-off to the humans who can actually fix things: the open-source
// developers. This module transmits nothing anywhere. It only formats the
// player's text into a report and builds a prefilled GitHub-issue URL that the
// PLAYER may choose to open (and can edit before submitting), preserving the
// game's no-backend, no-tracking promise.

export const GAME_VERSION = '0.1.0-beta';
export const PROJECT_REPO_URL = 'https://github.com/joelakaufmann-lgtm/lawscape';
export const PROJECT_ISSUES_URL = `${PROJECT_REPO_URL}/issues`;

export const HR_CATEGORIES = [
  {
    id: 'bug',
    label: '🐛 Bug Report — something in the game is broken',
    titleTag: '[Bug]',
    reply: 'Thank you for contacting Human Resources. HR handles people problems, '
      + 'and after careful review, HR has determined that the game engine is not a person. '
      + 'Your report has therefore been forwarded — unread, per longstanding firm tradition — '
      + 'to the developers, who unlike HR are known to answer their inbox.',
  },
  {
    id: 'conditions',
    label: '📎 Complaint — working conditions at Hardsell & Firestone',
    titleTag: '[HR Complaint]',
    reply: 'Human Resources acknowledges your complaint regarding working conditions at '
      + 'Hardsell & Firestone. HR notes that the firm already provides: one (1) porthole window '
      + '(2,000 gold), motivational artwork consisting of one (1) dot, and a bar cart that is '
      + 'somehow a wellness initiative. Your complaint has been added to the pile. The pile is '
      + 'load-bearing. Management thanks you for your candor and reminds you that candor is billable.',
  },
  {
    id: 'idea',
    label: '💡 Suggestion to Management',
    titleTag: '[Suggestion]',
    reply: 'Management thanks you for your suggestion and confirms it has been placed in the '
      + 'Suggestion Box. Jim Hardsell maintains that the Suggestion Box is not a shredder, and HR '
      + 'has found no admissible evidence to the contrary. Suggestions that should actually happen '
      + 'may be escalated to the developers below.',
  },
];

export function findHrCategory(id) {
  return HR_CATEGORIES.find((category) => category.id === id) || HR_CATEGORIES[0];
}

// Plain-markdown report used for both the GitHub issue body and the
// copy-to-clipboard fallback. `context` is assembled by the caller from game
// state the player can already see on screen; nothing in it identifies anyone.
export function hrReportText(category, subject, message, context) {
  return [
    `**${category.label}** — filed from the LawScape HR terminal.`,
    '',
    `**Subject:** ${subject}`,
    '',
    message,
    '',
    '---',
    '',
    '_Context the HR terminal volunteered (edit or delete freely — none of it identifies you):_',
    '',
    `- Game version: ${context.version} · Zone: ${context.zone} · Scenarios answered: `
      + `${context.casesDone} · Ethics: ${context.ethics}/${context.ethicsMax} · Gold: `
      + `${context.gold} · Upgrades: ${context.upgrades}`,
    `- Browser: ${context.userAgent}`,
    '',
    '_Complaints about working conditions at the fictional firm are considered feature requests._',
  ].join('\n');
}

export function hrIssueUrl(category, subject, message, context) {
  const title = `${category.titleTag} ${subject}`.trim();
  const body = hrReportText(category, subject, message, context);
  return `${PROJECT_ISSUES_URL}/new?title=${encodeURIComponent(title)}&body=${encodeURIComponent(body)}`;
}
