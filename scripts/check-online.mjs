#!/usr/bin/env node
// Release gate for the online Worker: a dry-run deploy (bundles server/worker.mjs
// with esbuild, validates wrangler.jsonc and the ./dist assets manifest), a
// secrets-hygiene check and a bundle size budget. No account is needed for a
// dry run; if Wrangler nevertheless asks for one, the script explains and only
// passes in CI without a CLOUDFLARE_API_TOKEN (where there is nothing to do).

import { readFile, readdir, stat, rm } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import process from 'node:process';

const root = path.resolve(import.meta.dirname, '..');
const outDir = path.join(root, '.wrangler', 'dry-run');
const MAX_BUNDLE_BYTES = 3 * 1024 * 1024;
const failures = [];

const config = await readFile(path.join(root, 'wrangler.jsonc'), 'utf8');
if (/DEV_IDENTITY_EMAIL/.test(config)) failures.push('wrangler.jsonc must not define DEV_IDENTITY_EMAIL (it belongs in the gitignored .dev.vars).');
if (!/"run_worker_first"\s*:\s*\[\s*"\/api\/\*"\s*,\s*"\/ws"\s*\]/.test(config)) failures.push('wrangler.jsonc must route /api/* and /ws to the Worker before static assets.');

try {
  if (!(await stat(path.join(root, 'dist', 'index.html'))).isFile()) throw new Error();
} catch {
  failures.push('dist/index.html is missing: run `npm run build` first.');
}

if (failures.length) {
  console.error(failures.map((failure) => `- ${failure}`).join('\n'));
  process.exit(1);
}

await rm(outDir, { recursive: true, force: true });
const dryRun = spawnSync('npx', ['wrangler', 'deploy', '--dry-run', '--outdir', outDir], {
  cwd: root, encoding: 'utf8', env: { ...process.env, CI: process.env.CI || '', WRANGLER_SEND_METRICS: 'false' },
});
const output = `${dryRun.stdout || ''}\n${dryRun.stderr || ''}`;
if (dryRun.status !== 0) {
  const needsAuth = /not authenticated|wrangler login|CLOUDFLARE_API_TOKEN|requires an account|Authentication error/i.test(output);
  if (needsAuth && process.env.CI && !process.env.CLOUDFLARE_API_TOKEN) {
    console.log('wrangler deploy --dry-run asked for Cloudflare credentials and none are configured in CI; skipping the bundle check.');
    console.log(output.trim());
    process.exit(0);
  }
  console.error(output.trim());
  console.error(needsAuth
    ? 'The dry run needs Cloudflare credentials: run `npx wrangler login` or set CLOUDFLARE_API_TOKEN.'
    : 'wrangler deploy --dry-run failed.');
  process.exit(1);
}

let bundleBytes = 0;
const bundleFiles = [];
for (const entry of await readdir(outDir, { withFileTypes: true, recursive: true })) {
  if (!entry.isFile() || !/\.(m?js)$/.test(entry.name)) continue;
  const file = path.join(entry.parentPath ?? entry.path, entry.name);
  const bytes = (await stat(file)).size;
  bundleBytes += bytes;
  bundleFiles.push(`${path.relative(root, file)} (${(bytes / 1024).toFixed(1)} KB)`);
}
if (!bundleFiles.length) failures.push(`No bundled Worker script found under ${path.relative(root, outDir)}.`);
console.log(`Bundled Worker: ${(bundleBytes / 1024).toFixed(1)} KB across ${bundleFiles.length} file(s)`);
for (const line of bundleFiles) console.log(`  ${line}`);
if (bundleBytes > MAX_BUNDLE_BYTES) failures.push(`Bundled Worker is ${(bundleBytes / 1024 / 1024).toFixed(2)} MB; the budget is 3 MB.`);

if (failures.length) {
  console.error(failures.map((failure) => `- ${failure}`).join('\n'));
  process.exit(1);
}
console.log('Online checks passed.');
