// Renders film.html frame by frame (deterministic) and encodes the picture master.
// `node render.mjs --stills` writes review frames only.
import { chromium } from '/Users/joelarthurkaufmann/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
const root = path.resolve(import.meta.dirname, '../..'), out = import.meta.dirname;
const FPS = 30, DUR = 30, FRAMES = FPS * DUR;
const browser = await chromium.launch({ headless: true, executablePath: '/Users/joelarthurkaufmann/Library/Caches/ms-playwright/chromium_headless_shell-1228/chrome-headless-shell-mac-arm64/chrome-headless-shell' });
try {
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
  await context.route('http://lawscape.demo/**', async route => {
    const file = path.resolve(root, '.' + decodeURIComponent(new URL(route.request().url()).pathname));
    if (!file.startsWith(root + '/')) return route.abort();
    const type = { '.html': 'text/html', '.js': 'text/javascript', '.png': 'image/png', '.jpg': 'image/jpeg' }[path.extname(file)] || 'application/octet-stream';
    try { await route.fulfill({ body: await readFile(file), contentType: type }); } catch { await route.fulfill({ status: 404, body: 'Not found' }); }
  });
  const page = await context.newPage(), errors = [];
  page.on('pageerror', e => { errors.push(e.message); console.error('PAGE ERROR', e.message); });
  page.on('console', m => { if (m.type() === 'error') console.error('CONSOLE', m.text()); });
  await page.goto('http://lawscape.demo/media/demo-30s/film.html?render');
  await page.waitForFunction(() => window.filmReady, null, { timeout: 30000 });
  await mkdir(path.join(out, 'qa'), { recursive: true });
  const stills = process.argv.includes('--stills');
  const times = stills && process.argv[3] ? process.argv[3].split(',').map(Number) : [1.2, 2.6, 3.4, 4.6, 7.4, 8.9, 10.2, 11.6, 12.6, 14.4, 17.0, 19.4, 21.6, 23.4, 25.8, 26.9, 28.6];
  for (const t of times) { const data = await page.evaluate(t => window.renderFrame(t), t); await writeFile(path.join(out, 'qa', `frame-${t.toFixed(1)}.jpg`), Buffer.from(data, 'base64')); }
  if (stills) { console.log(JSON.stringify({ stills: times, errors })); }
  else {
    const dest = path.join(out, 'picture.mp4');
    const ff = spawn('/opt/homebrew/bin/ffmpeg', ['-hide_banner', '-loglevel', 'warning', '-y', '-f', 'image2pipe', '-vcodec', 'mjpeg', '-framerate', String(FPS), '-i', 'pipe:0', '-an', '-c:v', 'libx264', '-preset', 'medium', '-crf', '17', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-frames:v', String(FRAMES), dest], { stdio: ['pipe', 'inherit', 'inherit'] });
    const done = once(ff, 'close');
    const t0 = Date.now();
    for (let frame = 0; frame < FRAMES; frame++) {
      const data = await page.evaluate(t => window.renderFrame(t), frame / FPS);
      if (!ff.stdin.write(Buffer.from(data, 'base64'))) await once(ff.stdin, 'drain');
      if (frame % 150 === 0) console.log(`Rendered ${frame}/${FRAMES} frames (${((Date.now() - t0) / 1000).toFixed(0)}s)`);
    }
    ff.stdin.end(); const [code] = await done; if (code !== 0) throw Error('ffmpeg failed: ' + code);
    await writeFile(path.join(out, 'qa/render.json'), JSON.stringify({ frames: FRAMES, fps: FPS, seconds: DUR, width: 1920, height: 1080, errors, renderedAt: new Date().toISOString() }, null, 2));
    console.log('Picture render complete: ' + dest);
  }
} finally { await browser.close(); }
