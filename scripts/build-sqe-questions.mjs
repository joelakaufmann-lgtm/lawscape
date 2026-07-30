#!/usr/bin/env node

import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const projectRoot = path.resolve(import.meta.dirname, '..');
const sourceName = 'SQE_Ethics_Email_Scenarios_UK.md';
const sourcePath = path.join(projectRoot, sourceName);
const outputPath = path.join(projectRoot, 'js/data/sqe.js');

const officialSampleUrl =
  'https://sqe.sra.org.uk/assessments/sqe1-assessments/sqe1-sample-questions';
const studyGuideUrl =
  'https://sqe1prep.co.uk/blog/sqe1-ethics-professional-conduct-revision-guide';

function cleanBold(value) {
  return value.replace(/\*\*/g, '').trim();
}

function slug(value) {
  return value.toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');
}

function difficultyFor(number) {
  if (number <= 4) return 1;
  if (number <= 14) return 2;
  return 3;
}

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

const scenarios = headings.map((heading, index) => {
  const number = Number(heading[1]);
  const end = headings[index + 1]?.index ?? answerKeyAt;
  const section = source.slice(heading.index, end);
  const lines = section.split('\n');
  const fromLine = lines.find((line) => line.startsWith('> **From:**'));
  const subjectLine = lines.find((line) => line.startsWith('> **Subject:**'));
  if (!fromLine || !subjectLine) {
    throw new Error(`Question ${number} is missing email metadata.`);
  }

  const fromRaw = cleanBold(fromLine.replace(/^>\s*\*\*From:\*\*\s*/, ''));
  const fromParts = fromRaw.split(',').map((part) => part.trim());
  const from = fromParts.shift();
  const role = fromParts.join(', ') || 'England and Wales Solicitor';
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

  const difficulty = difficultyFor(number);
  return {
    id: `sqe_uk_${number}_${slug(heading[2])}`,
    difficulty,
    sourceType: 'sqe-style',
    sourceNote:
      'Original LawScape educational hypothetical informed by public SQE study materials; not an official SRA or Kaplan SQE question. Check the law-and-practice cut-off date for your assessment.',
    sourceUrl: officialSampleUrl,
    studyGuideUrl,
    localSourceFile: sourceName,
    from,
    role,
    subject,
    body,
    gold: difficulty === 1 ? 35 : difficulty === 2 ? 45 : 60,
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

const output = `// Generated from ${sourceName}.
// Run npm run sqe:build after editing the source file.

export const SQE_SCENARIOS = ${JSON.stringify(scenarios, null, 2)};
`;

await writeFile(outputPath, output);
console.log(`Built js/data/sqe.js with ${scenarios.length} scenarios.`);
