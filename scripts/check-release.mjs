#!/usr/bin/env node

import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { SITE_FILES, listFiles } from './site-files.mjs';
import { ZONES } from '../js/world/zones.js';
import { SCENARIOS } from '../js/data/ethics.js';
import { HAIR_STYLES, HAIR_COLORS, FACIAL_HAIR } from '../js/data/appearance.js';
import { WRITING_TASKS, DOCUMENT_PACKS } from '../js/data/apprenticeship.js';
import { RULE_LIBRARY } from '../js/data/rules.js';

const root = path.resolve(import.meta.dirname, '..');
const dist = path.join(root, 'dist');
const read = (file, base = dist) => readFile(path.join(base, file), 'utf8');
const manifest = JSON.parse(await read('release-manifest.json'));
const { version } = JSON.parse(await read('package.json', root));
assert.equal(manifest.version, version, 'Package version is stale');
if (process.env.GITHUB_SHA) assert.equal(manifest.commit, process.env.GITHUB_SHA, 'Wrong release commit');

const expected = [];
for (const file of SITE_FILES) {
  if ((await stat(path.join(root, file))).isDirectory()) expected.push(...await listFiles(root, file));
  else expected.push(file);
}
expected.sort();
assert.deepEqual(await listFiles(dist), [...expected, 'release-manifest.json'].sort(), 'Missing or unexpected public files');
assert.deepEqual(manifest.files.map(file => file.path), expected, 'Manifest does not cover the full package');
for (const file of manifest.files) {
  const bytes = await readFile(path.join(dist, file.path));
  assert.equal(bytes.length, file.bytes, `Wrong byte count: ${file.path}`);
  assert.equal(createHash('sha256').update(bytes).digest('hex'), file.sha256, `Checksum mismatch: ${file.path}`);
  if (file.path !== 'index.html') {
    assert.ok(bytes.equals(await readFile(path.join(root, file.path))), `Stale packaged file: ${file.path}`);
  }
}

execFileSync(process.execPath, ['scripts/check.mjs'], { cwd: root, stdio: 'inherit' });
const html = await read('index.html');
assert.ok(html.includes(`id="game-version">${version}</span>`), 'Title screen version is stale');
const sourceHtml = await read('index.html', root);
// Packaging changes only the social preview metadata for GitHub Pages.
const normalizeHtml = text => text
  .replace(/content="https:\/\/[^"\s]+\/assets\/og-lawscape\.png"/g, 'content="assets/og-lawscape.png"')
  .replace(/\n<meta property="og:url" content="[^"]+">/, '');
assert.equal(normalizeHtml(html), normalizeHtml(sourceHtml), 'Stale packaged entry point');

async function checkLink(link, from, base) {
  if (/^(?:[a-z][\w+.-]*:|\/\/|#)/i.test(link)) return;
  const relative = decodeURIComponent(link.split(/[?#]/)[0]);
  if (!relative) return;
  const target = path.resolve(base, path.dirname(from), relative);
  assert.ok(target.startsWith(base + path.sep), `Link leaves package: ${from}: ${link}`);
  assert.ok((await stat(target)).isFile(), `Missing linked file: ${from}: ${link}`);
}
for (const match of html.matchAll(/(?:src|href)="([^"]+)"/g)) await checkLink(match[1], 'index.html', dist);
for (const match of (await read('css/style.css')).matchAll(/url\(['"]?([^)'"\s]+)['"]?\)/g)) await checkLink(match[1], 'css/style.css', dist);
for (const set of RULE_LIBRARY) {
  for (const resource of set.resources || []) await checkLink(resource.href, 'index.html', dist);
}
for (const scenario of SCENARIOS) {
  if (scenario.localSourceFile) await checkLink(scenario.localSourceFile, 'index.html', dist);
}
for (const file of ['README.md', 'CONTRIBUTING.md', 'ROADMAP.md', 'docs/README.md', 'docs/BUILD.md', 'docs/DEPLOYMENT.md', 'docs/PLAYING.md', 'docs/JURISDICTIONS.md', 'content/README.md',
  ...SITE_FILES.filter(file => file.startsWith('content/questions/') && file.endsWith('.md'))]) {
  for (const match of (await read(file, root)).matchAll(/\]\(([^)]+)\)/g)) await checkLink(match[1], file, root);
}
for (const file of ['docs/PLAYING.html', 'docs/JURISDICTIONS.html']) {
  for (const match of (await read(file)).matchAll(/(?:src|href)="([^"]+)"/g)) await checkLink(match[1], file, dist);
}
const bundle = await read('js/lawscape.bundle.js');
for (const module of ['js/entities/actor.js', 'js/entities/robots.js', 'js/ui/appearance.js', 'js/world/zones.js', 'js/apprenticeship.js', 'js/lounge.js']) {
  assert.ok(bundle.includes(`"${module}": (exports, require)`), `Missing game module: ${module}`);
}
console.log(JSON.stringify({ version, commit: manifest.commit, files: manifest.files.length + 1,
  zones: Object.keys(ZONES), scenarios: SCENARIOS.length,
  avatars: { hairStyles: HAIR_STYLES.length, hairColors: HAIR_COLORS.length, facialHair: FACIAL_HAIR.length },
  writingAssignments: WRITING_TASKS.length, syntheticFiles: DOCUMENT_PACKS.length,
  documents: DOCUMENT_PACKS.reduce((n, pack) => n + pack.documents.length, 0),
}, null, 2));
console.log('Release package checks passed.');
