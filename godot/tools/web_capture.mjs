// Drives the Web export in headless Chromium (Playwright from the repo root):
// plays the ?demo=1 autoplay, saves PNGs when the game logs "Capture: shot NAME",
// records the session to video, converts it to MP4, and grabs a phone-portrait shot.
//   node godot/tools/web_capture.mjs [outDir]       (export the Web preset first)
import { chromium } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import { mkdirSync, readdirSync, renameSync, rmSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { serve } from './serve.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const out = resolve(process.argv[2] || join(here, '..', 'preview'));
mkdirSync(out, { recursive: true });
const port = 8061;
const server = await serve(port);
const base = `http://localhost:${port}/`;
const browser = await chromium.launch({ args: ['--use-angle=metal', '--ignore-gpu-blocklist', '--enable-gpu'] });
const errors = [];

try {
  // 1. Demo run at 1280x720, recorded.
  const vidDir = join(out, '.video');
  rmSync(vidDir, { recursive: true, force: true });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 }, recordVideo: { dir: vidDir, size: { width: 1280, height: 720 } } });
  const page = await ctx.newPage();
  const shots = [];
  let done;
  const finished = new Promise(r => (done = r));
  page.on('pageerror', e => errors.push(String(e)));
  page.on('console', async msg => {
    const text = msg.text();
    if (/SCRIPT ERROR|^ERROR|USER ERROR/.test(text)) errors.push(text);
    const m = text.match(/Capture: shot (\S+)/);
    if (m) {
      const p = join(out, `web_${m[1]}.png`);
      shots.push(page.screenshot({ path: p }).then(() => console.log('saved', p)));
    }
    if (text.includes('Capture: done')) done();
  });
  const t0 = Date.now();
  await page.goto(base + '?demo=1');
  await Promise.race([finished, new Promise((_, rej) => setTimeout(() => rej(new Error('demo timed out')), 180000))]);
  await Promise.all(shots);
  await page.waitForTimeout(500);
  console.log(`demo finished in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
  await ctx.close();
  const webm = readdirSync(vidDir).find(f => f.endsWith('.webm'));
  const raw = join(out, 'gameplay.webm');
  renameSync(join(vidDir, webm), raw);
  rmSync(vidDir, { recursive: true, force: true });
  const mp4 = join(out, 'gameplay.mp4');
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', raw, '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-vf', 'scale=1280:-2', '-movflags', '+faststart', mp4]);
  console.log('saved', mp4);

  // 2. Phone portrait (390x844 @3x) to check the stacked layout and touch.
  const phone = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
  const pp = await phone.newPage();
  pp.on('pageerror', e => errors.push(String(e)));
  let ready;
  const isReady = new Promise(r => (ready = r));
  pp.on('console', m => { if (m.text().includes('shop ready')) ready(); });
  await pp.goto(base);
  await isReady;
  await pp.waitForTimeout(1200);
  // tap "Open the shop" (centre-ish of the card button) then a jar
  await pp.screenshot({ path: join(out, 'web_phone_card.png') });
  console.log('saved', join(out, 'web_phone_card.png'));
  await phone.close();
} finally {
  await browser.close();
  server.close();
}
if (errors.length) { console.error('Browser errors:\n' + errors.join('\n')); process.exit(1); }
console.log('no browser errors');
