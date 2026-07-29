#!/usr/bin/env node

import { access, readFile, writeFile } from 'node:fs/promises';
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
const californiaDir = path.join(projectRoot, 'California References');
const californiaPath = path.join(californiaDir, 'rpc.md');
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

function parseCalifornia(source) {
  const tocStart = source.indexOf('Rule 1.0 Purpose and Function');
  const tocEnd = source.indexOf('#### Page 6');
  const titleMap = new Map();
  let current = null;
  for (const rawLine of source.slice(tocStart, tocEnd).split('\n')) {
    const line = rawLine.trim();
    const heading = line.match(/^Rule\s+(\d+(?:\.\d+)+)\s+(.+)$/);
    if (heading) {
      current = { number: heading[1], parts: [heading[2]] };
      titleMap.set(current.number, current);
    } else if (
      current
      && line
      && !/^(?:####|RULES OF|2023|TABLE|CROSS-|Current Rules|CHAPTER)/.test(line)
    ) {
      current.parts.push(line);
    }
  }

  const actualRulesAt = source.indexOf('#### Page 13');
  if (actualRulesAt < 0) throw new Error('Could not locate the California rule-text section.');
  const ruleText = source.slice(actualRulesAt);
  const pattern = /^Rule\s+(\d+(?:\.\d+)+)\s+(.+)$/gm;
  const matches = [...ruleText.matchAll(pattern)];

  return matches.map((match, index) => {
    const bodyStart = match.index + match[0].length;
    const bodyEnd = matches[index + 1]?.index ?? ruleText.length;
    const text = normalizeRuleText(ruleText.slice(bodyStart, bodyEnd))
      .replace(/^RULES OF PROFESSIONAL CONDUCT\s*$/gm, '')
      .replace(/^\d+\s+CURRENT RULES 2023\s*$/gm, '')
      .replace(/^2023 CURRENT RULES\s+\d+\s*$/gm, '')
      .replace(/^An asterisk.*$/gm, '')
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    return {
      number: match[1],
      title: (titleMap.get(match[1])?.parts.join(' ') || match[2])
        .replace(/\*?\s+\d+$/, '')
        .replace(/\*$/, '')
        .trim(),
      text,
      url: 'https://www.calbar.ca.gov/index.php/legal-professionals/rules/rules-professional-conduct/current-rules-professional-conduct',
    };
  });
}

async function fileExists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function buildRuleLibrary() {
  const sourcePaths = [nevadaPath, arizonaPath, californiaPath];
  const sourceAvailability = await Promise.all(sourcePaths.map(fileExists));
  const missingSources = sourcePaths.filter((_, index) => !sourceAvailability[index]);

  if (missingSources.length > 0) {
    if (!(await fileExists(outputPath))) {
      throw new Error(
        `Cannot build the rule library because authoring sources and ${path.relative(projectRoot, outputPath)} are missing.`,
      );
    }

    console.warn(
      `Using committed ${path.relative(projectRoot, outputPath)}; local authoring sources are unavailable:\n`
      + missingSources.map((filePath) => `- ${path.relative(projectRoot, filePath)}`).join('\n'),
    );
    return;
  }

  const [nevadaSource, arizonaSource, californiaSource] = await Promise.all([
    readFile(nevadaPath, 'utf8'),
    readFile(arizonaPath, 'utf8'),
    readFile(californiaPath, 'utf8'),
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
  {
    id: 'california',
    tabLabel: 'California CRPC',
    title: 'California Legal Ethics References',
    citation: 'CRPC',
    snapshot: 'Local corpus includes the 2023 California Rules of Professional Conduct and COPRAC opinions through 2024-209',
    officialUrl: 'https://www.calbar.ca.gov/index.php/legal-professionals/rules/rules-professional-conduct/current-rules-professional-conduct',
    note: 'The bundled reference files are an authoring corpus. Confirm current rules and later amendments through the State Bar before relying on them.',
    rules: parseCalifornia(californiaSource),
    resources: [
      {
        title: 'California Rules of Professional Conduct',
        description: 'Full 2023 rule text and cross-reference tables.',
        href: 'California References/rpc.md',
      },
      {
        title: 'COPRAC Formal Opinions Index',
        description: 'Searchable navigation index for the bundled California ethics opinions.',
        href: 'California References/opinions-index.md',
      },
      {
        title: 'COPRAC Formal Opinions — Full Text',
        description: 'Complete local opinion corpus from 1965 through Opinion 2024-209.',
        href: 'California References/opinions-full.md',
      },
      {
        title: 'Admissions, Discipline, Trust Accounts, IOLTA, and CLE',
        description: 'Reference pointer to the controlling California sources.',
        href: 'California References/admission-discipline.md',
      },
      {
        title: 'State Bar Disciplinary Procedure',
        description: 'Reference pointer and procedural framework for State Bar Court matters.',
        href: 'California References/disciplinary-procedure.md',
      },
    ],
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
}

await buildRuleLibrary();
