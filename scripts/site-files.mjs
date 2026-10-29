import { readdir } from 'node:fs/promises';
import path from 'node:path';

// Only these public resources may enter the GitHub Pages artifact.
export const SITE_FILES = [
  'index.html', 'LICENSE', '.nojekyll',
  'docs/PLAYING.md', 'docs/JURISDICTIONS.md',
  'docs/PLAYING.html', 'docs/JURISDICTIONS.html',
  'content/questions/mpre/MPRE_Associate_Email_Scenarios.md',
  'content/questions/mpre/MPRE_Associate_Email_Scenarios_Additional_20.md',
  'content/questions/mpre/MPRE_Associate_Email_Scenarios_Additional_41.md',
  'content/questions/england-wales/SQE_Ethics_Email_Scenarios_UK.md',
  'content/questions/california/QUESTIONS.md', 'content/questions/california/SOURCES.md',
  'content/questions/california/source-receipt.json',
  'content/questions/new-york/NY_Ethics_Email_Scenarios.md', 'content/questions/new-york/SHORT-QUESTIONS.md',
  'content/questions/new-york/SOURCES.md', 'content/questions/new-york/source-receipt.json',
  'content/questions/new-york/short-scenarios.json',
  'content/references/california/admission-discipline.md',
  'content/references/california/disciplinary-procedure.md',
  'content/references/california/opinions-full.md',
  'content/references/california/opinions-index.md',
  'content/references/california/rpc.md',
  'css/style.css', 'js/lawscape.bundle.js', 'assets/og-lawscape.png',
  'media/lawscape-demo-30s.mp4', 'media/lawscape-demo-30s-poster.jpg',
  'media/demo-30s/captures/office-full.png',
  'canada-test/overview.html', 'canada-test/review.html', 'canada-test/pack.json',
  'canada-test/README.md', 'canada-test/QUESTIONS.md', 'canada-test/EMAILS.md', 'canada-test/SOURCES.md', 'canada-test/QA.md',
  'canada-test/sources/receipt.json',
  'canada-test/sources/ON-LTB.html.source', 'canada-test/sources/ON-LTB.txt',
  'canada-test/sources/BC-3.html.source', 'canada-test/sources/BC-3.txt',
  'canada-test/sources/BC-7.html.source', 'canada-test/sources/BC-7.txt',
  'canada-test/sources/CA-530.html.source', 'canada-test/sources/CA-530.txt',
  'canada-test/sources/SK-CODE.pdf', 'canada-test/sources/SK-CODE.txt',
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
