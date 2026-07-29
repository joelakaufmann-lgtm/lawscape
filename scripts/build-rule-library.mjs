#!/usr/bin/env node

import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const projectRoot = path.resolve(import.meta.dirname, '..');
const nevadaPath = path.join(
  projectRoot,
  'Ethics Agents/ethics-check-nv/ethics-check-nv-repo/references/nrpc.md',
);
const arizonaPath = path.join(
  projectRoot,
  'Ethics Agents/ethics-check-az/references/rpc.md',
);
const outputPath = path.join(projectRoot, 'js/data/rules.js');

function normalizeRuleText(text) {
  return text
    .replace(/^### Page \d+ \[embedded\]\s*$/gm, '')
    .replace(/^---\s*$/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function parseNevada(source) {
  const pattern = /^Rule[\u2000-\u200b ]+(\d+\.\d+[A-Z]?)\.[\u2000-\u200b ]+(.+)$/gm;
  const matches = [...source.matchAll(pattern)];

  return matches.map((match, index) => {
    const header = match[2].trim();
    const separator = header.search(/\.[\u2000-\u200b ]{2,}/);
    const title = (separator >= 0 ? header.slice(0, separator) : header)
      .replace(/\.$/, '')
      .trim();
    const inlineText = separator >= 0
      ? header.slice(separator).replace(/^\.[\u2000-\u200b ]+/, '').trim()
      : '';
    const bodyStart = match.index + match[0].length;
    const bodyEnd = matches[index + 1]?.index ?? source.length;
    const remainingBody = source.slice(bodyStart, bodyEnd);
    const text = normalizeRuleText(
      `${inlineText ? `${inlineText}\n` : ''}${remainingBody}`,
    );

    return {
      number: match[1],
      title,
      text,
      url: `https://www.leg.state.nv.us/Division/Legal/LawLibrary/CourtRules/RPC.html#RPC${match[1].replace('.', '')}`,
    };
  });
}

function parseArizona(source) {
  const fullText = new Map();
  const fullPattern = /^### ER (\d+\.\d+[A-Z]?)\. ([^\n]+)$/gm;
  const sections = [...source.matchAll(fullPattern)];
  const rulesNoteAt = source.indexOf('## Rules not reproduced');
  for (let index = 0; index < sections.length; index++) {
    const match = sections[index];
    const bodyStart = match.index + match[0].length;
    const bodyEnd = sections[index + 1]?.index
      ?? (rulesNoteAt >= 0 ? rulesNoteAt : source.length);
    fullText.set(match[1], normalizeRuleText(source.slice(bodyStart, bodyEnd)));
  }

  const rows = [];
  const indexPattern = /^\| (\d+\.\d+[A-Z]?) \| ([^|]+) \| (\d+) \|$/gm;
  for (const match of source.matchAll(indexPattern)) {
    rows.push({
      number: match[1],
      title: match[2].trim(),
      text: fullText.get(match[1]) || '',
      url: `https://tools.azbar.org/RulesofProfessionalConduct/ViewRule.aspx?id=${match[3]}`,
    });
  }
  return rows;
}

const [nevadaSource, arizonaSource] = await Promise.all([
  readFile(nevadaPath, 'utf8'),
  readFile(arizonaPath, 'utf8'),
]);

const library = [
  {
    id: 'nevada',
    title: 'Nevada Rules of Professional Conduct',
    citation: 'NRPC',
    snapshot: 'Local source includes amendments through January 12, 2024',
    officialUrl: 'https://www.leg.state.nv.us/Division/Legal/LawLibrary/CourtRules/RPC.html',
    note: 'Bundled text is an authoring snapshot. Use the official link to confirm the current rule before relying on it.',
    rules: parseNevada(nevadaSource),
  },
  {
    id: 'arizona',
    title: 'Arizona Ethical Rules',
    citation: 'ER',
    snapshot: 'Rule 42 index plus locally harvested text',
    officialUrl: 'https://www.azbar.org/for-legal-professionals/lawyer-regulation/resources/rules-of-professional-conduct/',
    note: 'The local corpus contains a complete rule index and full text for selected rules. Open the official rule link for current text when a card is marked index-only.',
    rules: parseArizona(arizonaSource),
  },
];

const output = `// Generated from the local Ethics Agents authoring corpus.
// Run npm run rules:build to refresh after those source files change.

export const RULE_LIBRARY = ${JSON.stringify(library, null, 2)};
`;

await writeFile(outputPath, output);
console.log(
  `Built js/data/rules.js with ${library.reduce((total, set) => total + set.rules.length, 0)} indexed rules.`,
);
