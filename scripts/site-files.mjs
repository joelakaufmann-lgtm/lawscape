import { readdir } from 'node:fs/promises';
import path from 'node:path';

// Only these public resources may enter the GitHub Pages artifact.
export const SITE_FILES = [
  'index.html', 'LICENSE', '.nojekyll', 'README.md', 'CONTRIBUTING.md',
  'ROADMAP.md', 'SECURITY.md', 'docs', 'planning/local-apprenticeship-build.md',
  'MPRE_Associate_Email_Scenarios.md',
  'MPRE_Associate_Email_Scenarios_Additional_20.md',
  'MPRE_Associate_Email_Scenarios_Additional_41.md',
  'SQE_Ethics_Email_Scenarios_UK.md', 'California References',
  'css/style.css', 'js/lawscape.bundle.js', 'assets/og-lawscape.png',
  'media/lawscape-demo-30s.mp4', 'media/lawscape-demo-30s-poster.jpg',
  'media/demo-30s/captures/office-full.png',
];

export async function listFiles(root, relative = '') {
  const files = [];
  for (const entry of await readdir(path.join(root, relative), { withFileTypes: true })) {
    const name = path.posix.join(relative, entry.name);
    if (entry.isDirectory()) files.push(...await listFiles(root, name));
    else if (entry.isFile()) files.push(name);
    else throw new Error(`Unsupported package entry: ${name}`);
  }
  return files.sort();
}
