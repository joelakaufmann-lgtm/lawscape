#!/usr/bin/env node

import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const projectRoot = path.resolve(import.meta.dirname, '..');
const sourceNames = [
  'MPRE_Associate_Email_Scenarios_Additional_20.md',
  'MPRE_Associate_Email_Scenarios_Additional_41.md',
];
const outputPath = path.join(projectRoot, 'js/data/mpre-additional.js');

function cleanBold(value) {
  return value.replace(/\*\*/g, '').trim();
}

function slug(value) {
  return value.toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');
}

async function buildSource(sourceName) {
  const sourcePath = path.join(projectRoot, sourceName);
  const source = await readFile(sourcePath, 'utf8');
  const answerRows = new Map();
  for (const line of source.split('\n')) {
    const match = line.match(/^\|\s*(\d+)\s*\|\s*([A-D])\s*\|\s*([^|]+)\|\s*([^|]+)\|$/);
    if (match) {
      answerRows.set(Number(match[1]), {
        answer: match[2],
        authority: match[3].trim(),
        reason: match[4].trim(),
      });
    }
  }

  const headings = [...source.matchAll(/^##\s+(\d+)\.\s+(.+)$/gm)];
  const answerKeyAt = source.indexOf('# Answer Key');
  if (!headings.length || answerKeyAt < 0) {
    throw new Error(`${sourceName} does not contain numbered questions and an answer key.`);
  }

  return headings.map((heading, index) => {
    const number = Number(heading[1]);
    const end = headings[index + 1]?.index ?? answerKeyAt;
    const section = source.slice(heading.index, end);
    const lines = section.split('\n');
    const fromLine = lines.find((line) => line.startsWith('> **From:**'));
    const subjectLine = lines.find((line) => line.startsWith('> **Subject:**'));
    if (!fromLine || !subjectLine) throw new Error(`Question ${number} is missing email metadata.`);

    const fromRaw = cleanBold(fromLine.replace(/^>\s*\*\*From:\*\*\s*/, ''));
    const fromParts = fromRaw.split(',').map((part) => part.trim());
    const from = fromParts.shift();
    const role = fromParts.join(', ') || (from.startsWith('Hon.') ? 'Judge' : 'Firm Correspondent');
    const subject = cleanBold(subjectLine.replace(/^>\s*\*\*Subject:\*\*\s*/, ''));

    const subjectAt = lines.indexOf(subjectLine);
    const body = lines.slice(subjectAt + 1)
      .filter((line) => line.startsWith('>'))
      .map((line) => line.replace(/^>\s?/, ''))
      .filter(Boolean)
      .join('\n\n')
      .trim();

    const choices = [];
    for (const line of lines) {
      const choice = line.match(/^-\s+\*\*([A-D])\.\*\*\s+(.+)$/);
      if (choice) choices.push({ letter: choice[1], text: choice[2].trim() });
    }

    const answer = answerRows.get(number);
    if (!answer || choices.length !== 4) {
      throw new Error(`Question ${number} could not be paired with four choices and its answer key.`);
    }

    const advanced = number >= 26;
    return {
      id: `mpre_extra_${number}_${slug(heading[2])}`,
      difficulty: advanced ? 3 : 2,
      sourceType: 'mpre-style',
      sourceNote: 'Original educational hypothetical; not an official NCBE question. State rules may differ from the ABA models.',
      sourceUrl: 'https://www.ncbex.org/sites/default/files/2023-01/MPRE_Subject_Matter_Outline.pdf',
      localSourceFile: sourceName,
      from,
      role,
      subject,
      body,
      gold: advanced ? 55 : 40,
      rule: answer.authority,
      choices: choices.map((choice) => choice.letter === answer.answer
        ? { grade: 'correct', text: choice.text }
        : {
            grade: 'wrong',
            text: choice.text,
            why: `${answer.authority}: ${answer.reason}`,
          }),
    };
  });
}

const scenarios = (await Promise.all(sourceNames.map(buildSource))).flat();

const output = `// Generated from ${sourceNames.join(' and ')}.
// Run npm run mpre:build after editing either source file.

export const ADDITIONAL_MPRE_SCENARIOS = ${JSON.stringify(scenarios, null, 2)};
`;

await writeFile(outputPath, output);
console.log(`Built js/data/mpre-additional.js with ${scenarios.length} scenarios.`);
