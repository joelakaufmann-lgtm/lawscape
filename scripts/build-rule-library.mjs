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
const californiaDir = path.join(projectRoot, 'content/references/california');
const californiaPath = path.join(californiaDir, 'rpc.md');
// Verbatim extracts committed under content/references (see each file's header).
const newYorkPath = path.join(projectRoot, 'content/references/new-york/rpc.md');
const flscPath = path.join(projectRoot, 'content/references/canada/flsc-model-code.md');
const sraPath = path.join(projectRoot, 'content/references/england-wales/sra-standards.md');
const outputPath = path.join(projectRoot, 'js/data/rules.js');

// Markdown extracts: a heading per rule, text until the next heading.
function sectionsOf(markdown, headingPattern, stopPattern) {
  const matches = [...markdown.matchAll(headingPattern)];
  return matches.map((match, index) => {
    const start = match.index + match[0].length;
    const next = matches[index + 1]?.index ?? markdown.length;
    let body = markdown.slice(start, next);
    const stop = stopPattern ? body.search(stopPattern) : -1;
    if (stop >= 0) body = body.slice(0, stop);
    return { match, text: body.replace(/\n{3,}/g, '\n\n').trim() };
  });
}

// New York: `## Rule 1.15: Title` per rule, 22 NYCRR Part 1200.
function parseNewYork(source) {
  const url = 'https://www.nycourts.gov/rules/jointappellate/';
  return sectionsOf(source, /^## Rule (\d+\.\d+): (.+)$/gm, /^#\s/m).map(({ match, text }) => ({
    number: match[1], title: match[2].trim().replace(/^\[Reserved\.?\]$/i, '[Reserved]'), text, url,
  }));
}

// FLSC Model Code: `# Chapter N`, `## 3.4 Conflicts`, `### 3.4-1` rules with
// Commentary kept under the rule. The card title is the section plus the most
// recent bold sub-heading above the rule, e.g. "Conflicts · Duty to Avoid Conflicts of Interest".
function parseFlsc(source) {
  const url = 'https://flsc.ca/what-we-do/model-code-of-professional-conduct/';
  const rules = [];
  let section = '', sub = '';
  for (const line of source.split('\n')) {
    const sectionMatch = line.match(/^## (\d\.\d+) (.+)$/);
    if (sectionMatch) { section = sectionMatch[2].trim(); sub = ''; continue; }
    const subMatch = line.match(/^\*\*([^*]+)\*\*$/);
    if (subMatch && subMatch[1] !== 'Commentary') { sub = subMatch[1].trim(); continue; }
    const ruleMatch = line.match(/^### (\d\.\d+-\d+(?:\.\d+)?)$/);
    if (ruleMatch) rules.push({ number: ruleMatch[1], title: sub && sub !== section ? `${section} · ${sub}` : section, text: '', url });
  }
  const bodies = sectionsOf(source, /^### (\d\.\d+-\d+(?:\.\d+)?)$/gm, /^(#{1,2})\s/m);
  for (const { match, text } of bodies) {
    const rule = rules.find((item) => item.number === match[1] && !item.text);
    if (rule) rule.text = text.replace(/^\*\*Commentary\*\*$/m, 'Commentary').replace(/^\*\*([^*]+)\*\*$/gm, '$1');
  }
  return rules;
}

// SRA: seven Principles, then the Code of Conduct for Solicitors and the Code
// for Firms, each `## <section> <title>` with `### n.m` paragraphs.
function parseSra(source) {
  const urls = {
    Principles: 'https://www.sra.org.uk/solicitors/standards-regulations/principles/',
    Solicitors: 'https://www.sra.org.uk/solicitors/standards-regulations/code-conduct-solicitors/',
    Firms: 'https://www.sra.org.uk/solicitors/standards-regulations/code-conduct-firms/',
  };
  const rules = [];
  let part = 'Principles', section = '';
  const lines = source.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/^# SRA Principles/.test(line)) part = 'Principles';
    else if (/^# SRA Code of Conduct for Solicitors/.test(line)) part = 'Solicitors';
    else if (/^# SRA Code of Conduct for Firms/.test(line)) part = 'Firms';
    const principle = line.match(/^## Principle (\d): (.+)$/);
    if (principle) {
      const text = lines.slice(i + 1).join('\n').split(/\n#/)[0].trim();
      rules.push({ number: `Principle ${principle[1]}`, title: principle[2].trim(), text, url: urls.Principles });
      continue;
    }
    const sectionMatch = line.match(/^## (\d+) (.+)$/);
    if (sectionMatch) { section = sectionMatch[2].replace(/\s*\([^)]*\)\s*$/, '').trim(); continue; }
    const para = line.match(/^### (\d+\.\d+)$/);
    if (para) {
      const text = lines.slice(i + 1).join('\n').split(/\n#/)[0].trim();
      rules.push({ number: `${part === 'Firms' ? 'Firms Code' : 'Code'} ${para[1]}`, title: section, text, url: urls[part] });
    }
  }
  return rules;
}

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
  const sourcePaths = [nevadaPath, arizonaPath, californiaPath, newYorkPath, flscPath, sraPath];
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

  const [nevadaSource, arizonaSource, californiaSource, newYorkSource, flscSource, sraSource] = await Promise.all(
    sourcePaths.map((filePath) => readFile(filePath, 'utf8')),
  );

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
        href: 'content/references/california/rpc.md',
      },
      {
        title: 'COPRAC Formal Opinions Index',
        description: 'Searchable navigation index for the bundled California ethics opinions.',
        href: 'content/references/california/opinions-index.md',
      },
      {
        title: 'COPRAC Formal Opinions — Full Text',
        description: 'Complete local opinion corpus from 1965 through Opinion 2024-209.',
        href: 'content/references/california/opinions-full.md',
      },
      {
        title: 'Admissions, Discipline, Trust Accounts, IOLTA, and CLE',
        description: 'Reference pointer to the controlling California sources.',
        href: 'content/references/california/admission-discipline.md',
      },
      {
        title: 'State Bar Disciplinary Procedure',
        description: 'Reference pointer and procedural framework for State Bar Court matters.',
        href: 'content/references/california/disciplinary-procedure.md',
      },
    ],
  },
  {
    id: 'newyork',
    tabLabel: 'New York RPC',
    title: 'New York Rules of Professional Conduct',
    citation: 'N.Y. R. Prof. Conduct',
    snapshot: 'Verbatim rule text as amended through July 1, 2026 (NYSBA republication of 22 NYCRR Part 1200), retrieved October 30, 2026',
    officialUrl: 'https://www.nycourts.gov/rules/jointappellate/',
    note: 'The operative rules are the joint rules of the Appellate Divisions. The bundled text omits the NYSBA Preamble, Scope and Comments. Check the court’s amendments page for changes after July 1, 2026.',
    rules: parseNewYork(newYorkSource),
    resources: [
      { title: 'New York Rules of Professional Conduct (verbatim extract)', description: 'Rules 1.0 to 8.5 with source and retrieval notes.', href: 'content/references/new-york/rpc.md' },
    ],
  },
  {
    id: 'canada',
    tabLabel: 'FLSC Model Code',
    title: 'Federation of Law Societies of Canada — Model Code of Professional Conduct',
    citation: 'Model Code',
    snapshot: 'Verbatim 2024 Model Code (rules and Commentary), retrieved October 30, 2026',
    officialUrl: 'https://flsc.ca/what-we-do/model-code-of-professional-conduct/',
    note: 'Each provincial and territorial law society adopts the Model Code with its own variations. Confirm the governing law society’s code before relying on a rule.',
    rules: parseFlsc(flscSource),
    resources: [
      { title: 'FLSC Model Code of Professional Conduct (verbatim extract)', description: 'Chapters 1 to 7 with Commentary.', href: 'content/references/canada/flsc-model-code.md' },
    ],
  },
  {
    id: 'englandwales',
    tabLabel: 'SRA Standards',
    title: 'SRA Standards and Regulations (England & Wales)',
    citation: 'SRA',
    snapshot: 'Verbatim SRA Principles and Codes of Conduct in effect from April 11, 2025, retrieved October 30, 2026',
    officialUrl: 'https://www.sra.org.uk/solicitors/standards-regulations/',
    note: 'The SRA Principles, the Code of Conduct for Solicitors, RELs, RFLs and RSLs, and the Code of Conduct for Firms. SRA guidance and warning notices are not bundled; the SRA pages are the operative source.',
    rules: parseSra(sraSource),
    resources: [
      { title: 'SRA Standards and Regulations (verbatim extract)', description: 'Principles, Solicitors Code and Firms Code.', href: 'content/references/england-wales/sra-standards.md' },
    ],
  },
  ];

  const output = `// Generated from the local Ethics Agents authoring corpus and the verbatim extracts under content/references.
// Run npm run rules:build to refresh after those source files change.

export const RULE_LIBRARY = ${JSON.stringify(library, null, 2)};
`;

  await writeFile(outputPath, output);
  console.log(
    `Built js/data/rules.js with ${library.reduce((total, set) => total + set.rules.length, 0)} indexed rules.`,
  );
}

await buildRuleLibrary();
