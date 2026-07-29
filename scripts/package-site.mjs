#!/usr/bin/env node

import { cp, mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';

const projectRoot = path.resolve(import.meta.dirname, '..');
const output = path.join(projectRoot, 'dist');
const staging = path.join(projectRoot, '.dist-staging');
const files = [
  'index.html',
  'LICENSE',
  'MPRE_Associate_Email_Scenarios.md',
  'MPRE_Associate_Email_Scenarios_Additional_20.md',
  'California References',
  'README.md',
  '.nojekyll',
  'css/style.css',
  'js/lawscape.bundle.js',
  'assets/og-lawscape.png',
];

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

await rm(output, { recursive: true, force: true });
await rename(staging, output);
console.log(`Packaged ${files.length} browser files in dist/.`);
