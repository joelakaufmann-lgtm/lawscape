#!/usr/bin/env node

import { cp, mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { SITE_FILES, listFiles } from './site-files.mjs';

const projectRoot = path.resolve(import.meta.dirname, '..');
const output = path.join(projectRoot, 'dist');
const staging = path.join(projectRoot, '.dist-staging');
const files = SITE_FILES;

await rm(staging, { recursive: true, force: true });
await mkdir(staging, { recursive: true });

for (const relativePath of files) {
  const source = path.join(projectRoot, relativePath);
  const destination = path.join(staging, relativePath);
  await mkdir(path.dirname(destination), { recursive: true });
  await cp(source, destination, { recursive: true });
}

// Social crawlers expect an absolute preview-image URL. GitHub Actions provides
// the repository slug; local builds keep the portable relative path.
const indexPath = path.join(staging, 'index.html');
let indexHtml = await readFile(indexPath, 'utf8');
const [owner, repository] = (process.env.GITHUB_REPOSITORY || '').split('/');
if (owner && repository) {
  const pageBase = `https://${owner}.github.io/${repository}`;
  indexHtml = indexHtml
    .replaceAll('content="assets/og-lawscape.png"', `content="${pageBase}/assets/og-lawscape.png"`)
    .replace('</title>', `</title>\n<meta property="og:url" content="${pageBase}/">`);
}
await writeFile(indexPath, indexHtml);

const { version } = JSON.parse(await readFile(path.join(projectRoot, 'package.json'), 'utf8'));
let commit = process.env.GITHUB_SHA || null;
if (!commit) {
  try { commit = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: projectRoot, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim(); }
  catch { /* Source archives need no Git checkout to build. */ }
}
const inventory = [];
for (const file of await listFiles(staging)) {
  const bytes = await readFile(path.join(staging, file));
  inventory.push({ path: file, bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex') });
}
await writeFile(path.join(staging, 'release-manifest.json'), JSON.stringify({
  version, commit, files: inventory,
}, null, 2) + '\n');

await rm(output, { recursive: true, force: true });
await rename(staging, output);
console.log(`Packaged ${inventory.length} public files plus release-manifest.json in dist/ (v${version}).`);
