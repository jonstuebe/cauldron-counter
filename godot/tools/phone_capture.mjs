// Portrait (phone/tablet) evidence for the Web export, in headless Chromium.
// Plays the ?demo=1 autoplay at several viewports and saves PNGs when the game
// logs "Capture: shot NAME". Screenshots only (no video).
//   node godot/tools/phone_capture.mjs [outDir]     (export the Web preset first)
// Output (default godot/preview/phone/):
//   390x844_*.png (DPR 3: title, mid-brew, success, fail, results, game over)
//   360x640_mid_brew.png, 430x932_mid_brew.png, 768x1024_mid_brew.png
//   390x844_day13_mid_brew.png (full tray), 390x844_safe_mid_brew.png (fake notch insets)
//   rotate_*.png (live switch portrait -> landscape -> portrait), 1280x720_mid_brew.png
import { chromium, devices, webkit } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { serve } from './serve.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const out = resolve(process.argv[2] || join(here, '..', 'preview', 'phone'));
const only = process.argv[3] ? process.argv[3].split(',') : null;
mkdirSync(out, { recursive: true });
const port = 8062;
const server = await serve(port);
const base = `http://localhost:${port}/`;
const browser = await chromium.launch({ args: ['--use-angle=metal', '--ignore-gpu-blocklist', '--enable-gpu'] });
const wk = await webkit.launch();
const errors = [];

// Run the demo in a fresh context; save the shots named in `want` (all if
// null) with `prefix`, stop after `stopAfter` (or at "Capture: done").
async function run({ name, w, h, dpr = 3, mobile = true, query = '', want = null, stopAfter = null, onShot = null, engine = 'chromium', device = null, screen = null }) {
  if (only && !only.includes(name)) return;
  const opts = device ? { ...devices[device], viewport: { width: w, height: h } } : { viewport: { width: w, height: h }, deviceScaleFactor: dpr, isMobile: mobile, hasTouch: mobile };
  if (screen) opts.screen = screen;
  const ctx = await (engine === 'webkit' ? wk : browser).newContext(opts);
  const page = await ctx.newPage();
  const pending = [];
  let done;
  const finished = new Promise(r => (done = r));
  page.on('pageerror', e => errors.push(`${name}: ${e}`));
  page.on('console', msg => {
    const text = msg.text();
    if (/SCRIPT ERROR|ERROR:|USER ERROR/.test(text)) errors.push(`${name}: ${text}`);
    const m = text.match(/Capture: shot (\S+)/);
    if (m) {
      const shot = m[1].replace(/^\d+_/, '');
      if (!want || want.includes(shot)) {
        const p = join(out, `${name}_${shot}.png`);
        pending.push((async () => {
          await page.screenshot({ path: p });
          console.log('saved', p);
          if (onShot) await onShot(page, shot);
        })());
      }
      if (stopAfter && shot === stopAfter) done();
    }
    if (text.includes('Capture: done')) done();
  });
  const t0 = Date.now();
  await page.goto(base + '?demo=1' + query);
  await Promise.race([finished, new Promise((_, rej) => setTimeout(() => rej(new Error(`${name}: demo timed out`)), 240000))]);
  await Promise.all(pending);
  await page.waitForTimeout(400);
  console.log(`${name}: ${((Date.now() - t0) / 1000).toFixed(1)}s`);
  await ctx.close();
}

try {
  // Main phone run.
  await run({ name: '390x844', w: 390, h: 844, want: ['title', 'mid_brew', 'success', 'fail', 'success_2', 'results', 'game_over'] });
  for (const [w, h] of [[360, 640], [430, 932]]) {
    await run({ name: `${w}x${h}`, w, h, want: ['title', 'mid_brew'], stopAfter: 'mid_brew' });
  }
  await run({ name: '768x1024', w: 768, h: 1024, dpr: 2, want: ['title', 'mid_brew'], stopAfter: 'mid_brew' });
  await run({ name: '390x844_day13', w: 390, h: 844, query: '&day=13', want: ['title', 'mid_brew'], stopAfter: 'mid_brew' });
  await run({ name: '390x844_day46', w: 390, h: 844, query: '&day=46', want: ['mid_brew'], stopAfter: 'mid_brew' });
  await run({ name: '390x844_safe', w: 390, h: 844, query: '&safe=47,34', want: ['title', 'mid_brew'], stopAfter: 'mid_brew' });
  // WebKit iPhones. Home-screen app: full screen under the status bar
  // (insets faked with ?safe=). Safari: the toolbars take the bottom, so the
  // viewport is shorter and there is no bottom inset.
  await run({ name: 'webkit_iphone15_standalone_390x844', engine: 'webkit', device: 'iPhone 15', w: 390, h: 844, query: '&safe=47,34', want: ['title', 'mid_brew'], stopAfter: 'mid_brew' });
  await run({ name: 'webkit_iphone15_safari_390x664', engine: 'webkit', device: 'iPhone 15', w: 390, h: 664, query: '&safe=47,0', want: ['title', 'mid_brew'], stopAfter: 'mid_brew' });
  await run({ name: 'webkit_iphone15promax_standalone_430x932', engine: 'webkit', device: 'iPhone 15 Pro Max', w: 430, h: 932, query: '&safe=59,34', want: ['mid_brew'], stopAfter: 'mid_brew' });
  await run({ name: 'webkit_iphonese_360x640', engine: 'webkit', device: 'iPhone SE', w: 360, h: 640, query: '&safe=20,0', want: ['mid_brew'], stopAfter: 'mid_brew' });
  // The iOS home-screen bug: innerHeight short of the screen by the status bar.
  // ?standalone=ios turns on the shell's fix; the canvas must still fill the
  // screen height (844), not the short viewport (797).
  if (!only || only.includes('standalone_gap')) {
    const ctx = await wk.newContext({ ...devices['iPhone 15'], viewport: { width: 390, height: 797 }, screen: { width: 390, height: 844 } });
    const page = await ctx.newPage();
    page.on('pageerror', e => errors.push(`standalone_gap: ${e}`));
    await page.goto(base + '?standalone=ios&safe=47,34');
    await page.waitForFunction(() => !document.getElementById('cc-boot'), null, { timeout: 90000 });
    await page.waitForTimeout(500);
    const r = await page.evaluate(() => ({ inner: innerHeight, native: window.ccFullHeight && window.ccFullHeight.native(), css: getComputedStyle(document.getElementById('canvas')).height }));
    console.log('standalone_gap:', JSON.stringify(r));
    if (r.inner !== 844 || r.css !== '844px') errors.push(`standalone_gap: canvas not full height ${JSON.stringify(r)}`);
    await ctx.close();
  }
  await run({ name: '1280x720', w: 1280, h: 720, dpr: 1, mobile: false, want: ['title', 'mid_brew', 'success'], stopAfter: 'success' });
  // Live rotation: portrait -> landscape -> portrait in the same page.
  await run({
    name: 'rotate', w: 390, h: 844, want: ['mid_brew'], stopAfter: 'mid_brew',
    onShot: async (page) => {
      await page.setViewportSize({ width: 844, height: 390 });
      await page.waitForTimeout(700);
      await page.screenshot({ path: join(out, 'rotate_2_landscape_844x390.png') });
      await page.setViewportSize({ width: 390, height: 844 });
      await page.waitForTimeout(700);
      await page.screenshot({ path: join(out, 'rotate_3_back_to_portrait.png') });
      console.log('saved rotate_2/3');
    },
  });
} finally {
  await browser.close();
  await wk.close();
  server.close();
}
if (errors.length) { console.error('Browser errors:\n' + errors.join('\n')); process.exit(1); }
console.log('no browser errors');
