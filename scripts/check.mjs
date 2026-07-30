#!/usr/bin/env node

import { readFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import process from 'node:process';
import vm from 'node:vm';

const projectRoot = path.resolve(import.meta.dirname, '..');
const indexPath = path.join(projectRoot, 'index.html');
const indexHtml = await readFile(indexPath, 'utf8');
const bundlePath = path.join(projectRoot, 'js/lawscape.bundle.js');
const bundle = await readFile(bundlePath, 'utf8');

const failures = [];
const requiredIds = [
  'world', 'title-screen', 'btn-new', 'creator', 'btn-start', 'hud',
  'btn-mail', 'btn-record', 'btn-travel', 'btn-help', 'email', 'panel',
  'dialogue', 'gameover', 'work-status', 'email-hint', 'email-pack',
];

for (const id of requiredIds) {
  const occurrences = (indexHtml.match(new RegExp(`id=["']${id}["']`, 'g')) || []).length;
  if (occurrences !== 1) failures.push(`Expected one #${id}; found ${occurrences}.`);
}

if (!indexHtml.includes('<script defer src="js/lawscape.bundle.js"></script>')) {
  failures.push('index.html does not load the file-friendly browser bundle.');
}
if (indexHtml.includes('type="module"')) {
  failures.push('index.html still requires ES modules and will not open directly from disk.');
}

for (const relativePath of [
  'css/style.css',
  'js/lawscape.bundle.js',
  'assets/og-lawscape.png',
]) {
  try {
    await readFile(path.join(projectRoot, relativePath));
  } catch {
    failures.push(`Missing referenced asset: ${relativePath}`);
  }
}

try {
  new vm.Script(bundle, { filename: 'js/lawscape.bundle.js' });
} catch (error) {
  failures.push(`Bundle syntax error: ${error.message}`);
}

const bundleCheck = spawnSync(
  process.execPath,
  ['scripts/build.mjs', '--check'],
  { cwd: projectRoot, encoding: 'utf8' },
);
if (bundleCheck.status !== 0) {
  failures.push((bundleCheck.stderr || bundleCheck.stdout).trim());
}

if (failures.length) {
  console.error(failures.map((failure) => `- ${failure}`).join('\n'));
  process.exit(1);
}

console.log('Static browser checks passed.');
