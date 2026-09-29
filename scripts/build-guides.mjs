#!/usr/bin/env node
// Small renderer for the two player guides. Their Markdown is the source of truth.
import { readFile, writeFile } from 'node:fs/promises';
const escape = text => text.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const inline = text => escape(text).replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, label, url) => {
  if (/^(PLAYING|JURISDICTIONS)\.md$/.test(url)) url = url.replace('.md', '.html');
  if (url === '../CONTRIBUTING.md' || url === '../content/README.md') url = `https://github.com/joelakaufmann-lgtm/lawscape/blob/main/${url.slice(3)}`;
  return `<a href="${url}">${label}</a>`;
}).replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>').replace(/`([^`]+)`/g, '<code>$1</code>');
for (const name of ['PLAYING', 'JURISDICTIONS']) {
  const source = await readFile(new URL(`../docs/${name}.md`, import.meta.url), 'utf8');
  const blocks = source.trim().split(/\n\s*\n/);
  const html = blocks.map(block => {
    if (/^#{1,3} /.test(block)) { const level = block.indexOf(' '); return `<h${level}>${inline(block.slice(level + 1))}</h${level}>`; }
    if (block.startsWith('|')) {
      const rows = block.split('\n').filter(line => !/^\|[\s:|\-]+$/.test(line));
      return `<div class="table"><table>${rows.map((row, i) => `<tr>${row.split('|').slice(1, -1).map(cell => `<${i ? 'td' : 'th'}>${inline(cell.trim())}</${i ? 'td' : 'th'}>`).join('')}</tr>`).join('')}</table></div>`;
    }
    if (/^- /.test(block)) return '<ul>' + block.split(/\n(?=- )/).map(item => `<li>${inline(item.slice(2).replace(/\n/g, ' '))}</li>`).join('') + '</ul>';
    return `<p>${inline(block.replace(/\n/g, ' '))}</p>`;
  }).join('\n');
  const title = source.split('\n')[0].slice(2);
  await writeFile(new URL(`../docs/${name}.html`, import.meta.url), `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escape(title)} — LawScape</title>
<style>body{margin:0;background:#f7f3eb;color:#273038;font:18px/1.65 system-ui,sans-serif}main{max-width:800px;margin:0 auto;padding:28px 24px 80px}nav{display:flex;gap:20px;flex-wrap:wrap;border-bottom:1px solid #c7c2b8;padding-bottom:20px}a{color:#135f68;text-underline-offset:3px}h1{font:700 2.4rem/1.15 Georgia,serif;color:#182d35;margin-top:40px}h2{font-size:1.4rem;margin-top:38px}li{margin:12px 0}th,td{padding:12px;text-align:left;border-bottom:1px solid #cbc5b9;vertical-align:top}th{background:#e8e2d7}.table{overflow:auto}code{overflow-wrap:anywhere;font-size:.9em}footer{border-top:1px solid #c7c2b8;margin-top:40px;padding-top:18px;font-size:.9rem}@media(max-width:480px){body{font-size:16px}main{padding:20px 16px 50px}h1{font-size:2rem}th,td{padding:8px}}</style></head>
<body><main><nav aria-label="Player documentation"><a href="../game.html">Play LawScape</a><a href="PLAYING.html">How to play</a><a href="JURISDICTIONS.html">Jurisdictions</a></nav>${html}<footer>LawScape 0.6.0 · Unofficial educational practice · <a href="https://github.com/joelakaufmann-lgtm/lawscape">Project on GitHub</a></footer></main></body></html>\n`);
}
console.log('Built the player guide and jurisdiction catalog.');
