// Captures real LawScape UI from the current local build in an isolated
// headless browser with a synthetic demo save. Run from anywhere.
import { chromium } from '/Users/joelarthurkaufmann/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { SCENARIOS } from '../../js/data/ethics.js';
import { freshState } from '../../js/state.js';

const root = path.resolve(import.meta.dirname, '../..');
const out = path.join(import.meta.dirname, 'captures');
await mkdir(out, { recursive: true });
const browser = await chromium.launch({ headless: true, executablePath: '/Users/joelarthurkaufmann/Library/Caches/ms-playwright/chromium_headless_shell-1228/chrome-headless-shell-mac-arm64/chrome-headless-shell' });
const context = await browser.newContext({ viewport: { width: 1600, height: 1000 }, deviceScaleFactor: 2 });
await context.route('http://lawscape.demo/**', async route => {
  const p = decodeURIComponent(new URL(route.request().url()).pathname);
  const file = path.resolve(root, '.' + (p === '/' ? '/index.html' : p));
  if (!file.startsWith(root + '/')) return route.abort();
  const type = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.json': 'application/json' }[path.extname(file)] || 'application/octet-stream';
  try { await route.fulfill({ body: await readFile(file), contentType: type }); } catch { await route.fulfill({ status: 404, body: 'Not found' }); }
});
const page = await context.newPage();
const errors = [];
page.on('pageerror', e => errors.push(e.message));
const shot = (sel, name) => page.locator(sel).screenshot({ path: path.join(out, name + '.png') });
const full = name => page.screenshot({ path: path.join(out, name + '.png') });
const wait = ms => page.waitForTimeout(ms);

await page.goto('http://lawscape.demo/');
await page.waitForFunction(() => document.documentElement.dataset.lawscapeReady === 'true');
const seed = { ...freshState(), name: 'Alex Barrister', gender: 'nonbinary', gold: 1240, ethics: 88, streak: 3, casesDone: 9, correctDone: 8,
  billableStudyMs: 47 * 60_000 + 12_000, documentsReviewed: 4, practicePack: 'mixed', zone: 'office', pos: { x: 6, y: 8 },
  skin: 3, hair: 6, hairStyle: 7, eye: 2, glasses: true, suitColor: '#1f3a5f', tieColor: '#b8912f',
  upgrades: ['monitor', 'subscription', 'liz_chair', 'houseplants', 'paralegal', 'work_phone', 'artwork', 'mattress', 'coffee', 'wardrobe_rack', 'homedesk', 'kitchen', 'cityview'] };
seed.apprenticeship.introduced = true;
const board = [['Morgan Q.C.', 212], ['Priya Advocate', 187], ['Sam Solicitor', 154], ['Dana Esq.', 121], ['Kai Counsel', 96]]
  .map(([name, m], i) => ({ runId: 'demo-' + i, name, billableMs: m * 60_000, endedAt: 1_750_000_000_000 + i }));
await page.evaluate(({ seed, board }) => { localStorage.setItem('lawscape_save_v2', JSON.stringify(seed)); localStorage.setItem('lawscape_billable_board_v1', JSON.stringify(board)); }, { seed, board });
await page.reload();
await page.waitForFunction(() => document.documentElement.dataset.lawscapeReady === 'true');
await wait(300);
await shot('#title-screen .title-card', 'title');

// Attorney creator
await page.locator('#btn-new').click(); await wait(300);
await page.locator('#c-name').fill('Alex Barrister');
await shot('#creator .title-card', 'creator');
await page.locator('#btn-creator-back').click(); await wait(200);

// Enter the office
await page.locator('#btn-continue').click(); await wait(900);
await full('office-full'); await shot('#hud', 'hud');

// BarMail inbox, a scenario, and the correct verdict
await page.locator('#btn-mail').click(); await wait(400);
await shot('#email-window', 'inbox');
const id = await page.locator('.mail-row[data-scenario]').first().getAttribute('data-scenario');
const scenario = SCENARIOS.find(s => s.id === id);
await page.locator('.mail-row[data-scenario]').first().click(); await wait(400);
await shot('#email-window', 'scenario');
const good = page.getByRole('button', { name: scenario.choices.find(c => c.grade === 'correct').text, exact: true });
await good.hover(); await wait(150);
await shot('#email-window', 'scenario-hover');
await good.click(); await wait(400);
await shot('#email-window', 'verdict');
await page.locator('#email-continue').click(); await wait(200);
await page.locator('#email-writing').click(); await wait(300);
await shot('#email-window', 'inbox-writing');
await page.locator('#email-close').click(); await wait(200);


// Practice packs: England & Wales SQE and US MPRE inboxes and an SQE scenario
await page.locator('#btn-mail').click(); await wait(300);
for (const pack of ['sqe', 'mpre']) {
  await page.locator('#email-pack').selectOption(pack); await wait(350);
  await page.evaluate(() => { const box = document.getElementById('email-inbox'); box.scrollTop = box.scrollHeight; }); await wait(200);
  await shot('#email-window', 'inbox-' + pack);
}
await page.locator('#email-pack').selectOption('sqe'); await wait(300);
await page.locator('.mail-row[data-scenario]').first().click(); await wait(400);
await shot('#email-window', 'scenario-sqe');
await page.locator('#email-close').click(); await wait(200);

// Apprenticeship desk tabs
await page.locator('#btn-journal').click(); await wait(400);
await shot('.desk-window', 'desk-journal');
for (const tab of ['files', 'firm', 'wardrobe']) { await page.locator(`[data-desk-tab="${tab}"]`).click(); await wait(350); await shot('.desk-window', 'desk-' + tab); }
await page.locator('#desk-close').click(); await wait(200);

// Record panel
await page.locator('#btn-record').click(); await wait(300);
await shot('#panel-inner', 'record');
await page.locator('#panel-close').click(); await wait(200);

// Travel menu and the other locations
await page.locator('#btn-travel').click(); await wait(300);
await shot('#dialogue', 'travel');
async function popup(name) {
  await page.waitForFunction(() => !document.getElementById('dialogue').classList.contains('hidden') || !document.getElementById('panel').classList.contains('hidden'));
  await wait(350); const dlg = await page.locator('#dialogue').isVisible(); await shot(dlg ? '#dialogue' : '#panel-inner', name);
  if (dlg) { await page.keyboard.press('Escape'); await wait(150); if (await page.locator('#dialogue').isVisible()) await page.locator('#dialogue-choices button').last().click(); }
  else await page.locator('#panel-close').click();
  await wait(250);
}
async function travel(label) { if (!(await page.locator('#dialogue').isVisible())) { await page.locator('#btn-travel').click(); await wait(300); } await page.locator('#dialogue-choices button', { hasText: label }).click(); await wait(700); }
await travel('Go to the Courtroom'); await full('courtroom-full');
await page.locator('#room-action').click(); await popup('derek');
await page.locator('#room-service').click(); await popup('judge');
await travel('Go to The Sidebar'); await full('sidebar-full');
await page.locator('#room-service').click(); await popup('bart');
await page.locator('#room-board').click(); await popup('highscores');
await page.locator('#room-action').click(); await popup('sidebar-chat');
await travel('Go to the Apartment'); await full('apartment-full');
await writeFile(path.join(out, 'receipt.json'), JSON.stringify({ scenario: { id, subject: scenario.subject }, seed, board, errors, note: 'Current local build; isolated synthetic demo save in a fresh headless browser. No personal save accessed.' }, null, 2));
console.log(JSON.stringify({ scenario: scenario.subject, errors }));
await browser.close();
