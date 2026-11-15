// Screenshots of the themed preloader across the HTML -> Godot hand-off, on a
// throttled server (~6 MB/s), in Chromium (1280x720, 390x844, 360x640) and
// WebKit (iPhone 15 at 390x844, iPhone 15 Pro Max at 430x932). Export the Web
// preset first.
//   node godot/tools/preloader_capture.mjs [outDir] [name,name...]
// ?holdboot keeps Godot's boot at the hand-off state until the script has shot
// both layers, then lets it go on. Saves <size>_preload_<n>_<pct>.png while the engine downloads (HTML shell),
// <size>_handoff_a_html.png / _b_godot.png (the same moment, with and without
// the HTML overlay), <size>_after_<n>.png while Godot finishes, and
// <size>_game.png once the game is up.
import { chromium, devices, webkit } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { serve } from './serve.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const out = resolve(process.argv[2] || join(here, '..', 'preview', 'phone', 'preloader'));
mkdirSync(out, { recursive: true });
const only = process.argv[3] ? process.argv[3].split(',') : null;
const port = 8063;
const server = await serve(port, { rate: 6e6 });
const browsers = {
  chromium: await chromium.launch({ args: ['--use-angle=metal', '--ignore-gpu-blocklist', '--enable-gpu'] }),
  webkit: await webkit.launch(),
};
const errors = [];

async function run(name, engine, opts) {
  if (only && !only.includes(name)) return;
  const ctx = await browsers[engine].newContext(opts);
  const page = await ctx.newPage();
  page.on('pageerror', (e) => errors.push(`${name}: ${e}`));
  page.on('console', (m) => { if (/SCRIPT ERROR|ERROR:|USER ERROR/.test(m.text())) errors.push(`${name}: ${m.text()}`); });
  // Pause the hand-off long enough to shoot both layers at the same moment.
  await page.addInitScript(() => {
    let real;
    Object.defineProperty(window, 'ccBoot', {
      configurable: true,
      get: () => real,
      set: (v) => {
        const go = v.handoff;
        real = { ...v, handoff: () => { window.__ccHandoff = go; console.log('cc: handoff requested'); } };
      },
    });
  });
  let handoffAsked;
  const asked = new Promise((r) => (handoffAsked = r));
  let gameUp;
  const up = new Promise((r) => (gameUp = r));
  page.on('console', (m) => {
    if (/^Boot:|cc: handoff/.test(m.text())) console.log(`  [${name}] ${m.text()}`);
    if (m.text().includes('cc: handoff requested')) handoffAsked();
    if (/Capture: shot \S*title|Game ready/.test(m.text())) gameUp();
  });
  await page.goto(`http://localhost:${port}/?demo=1&holdboot=1`, { waitUntil: 'commit' });
  const t0 = Date.now();
  let i = 0;
  let handed = false;
  asked.then(() => (handed = true));
  while (!handed && Date.now() - t0 < 120000) {
    await page.waitForTimeout(i === 0 ? 700 : 1300);
    if (handed) break;
    const pct = await page.evaluate(() => document.getElementById('cc-pct')?.textContent || '').catch(() => '');
    if (!pct) throw new Error(`${name}: the HTML preloader went away without a hand-off from Godot`);
    const p = join(out, `${name}_preload_${i}_${pct.replace('%', '') || 'na'}.png`);
    await page.screenshot({ path: p });
    console.log('saved', p, `${((Date.now() - t0) / 1000).toFixed(1)}s`);
    i++;
  }
  await asked;
  await page.screenshot({ path: join(out, `${name}_handoff_a_html.png`) });
  await page.evaluate(() => { document.getElementById('cc-boot').style.visibility = 'hidden'; });
  await page.screenshot({ path: join(out, `${name}_handoff_b_godot.png`) });
  await page.evaluate(() => { document.getElementById('cc-boot').style.visibility = ''; window.ccBootRelease = true; window.__ccHandoff(); });
  // |html - godot|, brightened x4: anything that moved between the two shows up
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', join(out, `${name}_handoff_a_html.png`), '-i', join(out, `${name}_handoff_b_godot.png`),
    '-filter_complex', 'blend=all_mode=difference,lutrgb=r=val*4:g=val*4:b=val*4', join(out, `${name}_handoff_diff.png`)]);
  console.log('saved handoff pair', `${((Date.now() - t0) / 1000).toFixed(1)}s`);
  for (let j = 0; j < 4; j++) {
    await page.waitForTimeout(j === 0 ? 150 : 250);
    await page.screenshot({ path: join(out, `${name}_after_${j}.png`) });
  }
  await Promise.race([up, page.waitForTimeout(15000)]);
  await page.waitForTimeout(1200);
  await page.screenshot({ path: join(out, `${name}_game.png`) });
  await ctx.close();
}

const phone = (w, h, dpr) => ({ viewport: { width: w, height: h }, deviceScaleFactor: dpr, isMobile: true, hasTouch: true });
try {
  await run('1280x720', 'chromium', { viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
  await run('390x844', 'chromium', phone(390, 844, 3));
  await run('360x640', 'chromium', phone(360, 640, 2));
  await run('webkit_iphone15_390x844', 'webkit', { ...devices['iPhone 15'], viewport: { width: 390, height: 844 } });
  await run('webkit_iphone15promax_430x932', 'webkit', { ...devices['iPhone 15 Pro Max'], viewport: { width: 430, height: 932 } });
} finally {
  for (const b of Object.values(browsers)) await b.close();
  server.close();
}
if (errors.length) { console.error('Browser errors:\n' + errors.join('\n')); process.exit(1); }
console.log('no browser errors');
