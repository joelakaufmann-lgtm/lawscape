// This verifier is for the complete review ZIP, which has a root MANIFEST.json.
import { readFile, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
const root = path.resolve(import.meta.dirname, '..');
const manifest = JSON.parse(await readFile(path.join(root, 'MANIFEST.json'), 'utf8'));
const names = new Set();
for (const item of manifest.files) {
  if (names.has(item.path) || item.path.startsWith('/') || item.path.split('/').includes('..')) throw new Error('Unsafe or duplicate inventory path');
  names.add(item.path);
  const bytes = await readFile(path.join(root, item.path));
  if (bytes.length !== item.bytes || createHash('sha256').update(bytes).digest('hex') !== item.sha256) throw new Error('Changed or damaged file: ' + item.path);
}
async function walk(dir, prefix = '') {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const relative = prefix + entry.name;
    if (entry.isDirectory()) await walk(path.join(dir, entry.name), relative + '/');
    else if (!entry.isFile() || (relative !== 'MANIFEST.json' && !names.has(relative))) throw new Error('Uninventoried entry: ' + relative);
  }
}
await walk(root);
console.log(`Verified ${names.size} files against MANIFEST.json. Legal review remains pending.`);
