// Install sheet + PWA checks for the Web export (export the Web preset first).
//   node godot/tools/install_capture.mjs [outDir] [name,name...]
// For each ?install= variant, plays ?demo=1 until the sheet appears on its own
// (after the first served potion) and saves install_<variant>.png at 390x844
// (DPR 3), plus a landscape phone, a desktop card, the title card with its
// "Install app" entry, and detection checks from real user-agent strings.
// Also checks the manifest, its icons and the service worker, and fails on any
// console error.
import { chromium, devices, webkit } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { serve } from './serve.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const out = resolve(process.argv[2] || join(here, '..', 'preview', 'phone', 'install'));
const only = process.argv[3] ? process.argv[3].split(',') : null;
mkdirSync(out, { recursive: true });
const port = 8064;
const server = await serve(port);
const base = `http://localhost:${port}/`;
const browsers = {
  chromium: await chromium.launch({ args: ['--use-angle=metal', '--ignore-gpu-blocklist', '--enable-gpu'] }),
  webkit: await webkit.launch(),
};
const errors = [];
const phone = { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true };

function watch(page, name) {
  page.on('pageerror', (e) => errors.push(`${name}: ${e}`));
  page.on('console', (m) => {
    if (m.type() === 'error' || /SCRIPT ERROR|USER ERROR/.test(m.text())) errors.push(`${name}: ${m.text()}`);
  });
}

async function variant(name, engine, opts, query, { titleShot = false } = {}) {
  if (only && !only.includes(name)) return;
  const ctx = await browsers[engine].newContext(opts);
  const page = await ctx.newPage();
  watch(page, name);
  let title;
  const titled = new Promise((r) => (title = r));
  page.on('console', (m) => { if (/Capture: shot \S*title/.test(m.text())) title(); });
  await page.goto(base + '?demo=1&' + query);
  if (titleShot) {
    await titled;
    await page.waitForTimeout(500);
    await page.screenshot({ path: join(out, `${name}_title_card.png`) });
  }
  await page.waitForSelector('#cc-install.show', { timeout: 90000 });
  await page.waitForTimeout(600);
  const p = join(out, `${name}.png`);
  await page.screenshot({ path: p });
  console.log('saved', p, await page.evaluate(() => window.ccInstall.platform()));
  // "Not now" hides it and the game carries on
  await page.click('#cci-later');
  await page.waitForTimeout(1000);
  const hidden = await page.evaluate(() => !window.ccInstall.isOpen() && !document.getElementById('cc-install').classList.contains('on'));
  if (!hidden) errors.push(`${name}: sheet did not close`);
  await ctx.close();
}

// Detection from real user agents (no override): load the page, read platform().
async function detect() {
  if (only && !only.includes('detect')) return;
  const cases = [
    ['iOS 26 Safari', 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.0 Mobile/15E148 Safari/604.1', 'ios26'],
    ['iOS 18 Safari', 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.3 Mobile/15E148 Safari/604.1', 'ios18'],
    ['iPadOS 17 Safari (desktop UA)', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15', 'ios18', true],
    ['iOS 17 Chrome', 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/124.0 Mobile/15E148 Safari/604.1', 'ios-other'],
    ['iOS 16.2 Firefox', 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) FxiOS/110.0 Mobile/15E148 Safari/605.1.15', 'ios-old'],
    ['Android Firefox', 'Mozilla/5.0 (Android 14; Mobile; rv:128.0) Gecko/128.0 Firefox/128.0', 'android-noprompt'],
    ['Desktop Chrome (no prompt yet)', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36', null],
  ];
  for (const [label, ua, want, ipad] of cases) {
    const ctx = await browsers.chromium.newContext({ userAgent: ua, viewport: { width: 390, height: 844 }, hasTouch: !!ipad });
    const page = await ctx.newPage();
    if (ipad) await page.addInitScript(() => { Object.defineProperty(navigator, 'platform', { get: () => 'MacIntel' }); Object.defineProperty(navigator, 'maxTouchPoints', { get: () => 5 }); });
    await page.goto(base, { waitUntil: 'domcontentloaded' });
    const got = await page.evaluate(() => window.ccInstall.platform());
    console.log(`detect: ${label} -> ${got}${got === want ? '' : `  (WANTED ${want})`}`);
    if (got !== want) errors.push(`detect ${label}: ${got} != ${want}`);
    await ctx.close();
  }
}

// Manifest, icons and the service worker.
async function pwa() {
  if (only && !only.includes('pwa')) return;
  const ctx = await browsers.chromium.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await ctx.newPage();
  watch(page, 'pwa');
  await page.goto(base);
  const r = await page.evaluate(async () => {
    const href = document.querySelector('link[rel=manifest]').href;
    const m = await (await fetch(href)).json();
    const icons = await Promise.all(m.icons.map(async (i) => `${i.src} ${i.sizes} ${i.purpose || 'any'} ${(await fetch(new URL(i.src, href))).status}`));
    const reg = await navigator.serviceWorker.ready;
    return { name: m.name, display: m.display, orientation: m.orientation, theme: m.theme_color, bg: m.background_color, start: m.start_url, icons, sw: reg.active && reg.active.scriptURL, state: reg.active && reg.active.state };
  });
  console.log('pwa:', JSON.stringify(r, null, 1));
  if (!r.sw || r.icons.some((i) => !i.endsWith(' 200'))) errors.push('pwa: service worker or icons missing');
  await ctx.close();
}

// Timing: with no play, the sheet must not appear over the intro card, even
// after 25 s; it appears after the first served potion.
async function timing() {
  if (only && !only.includes('timing')) return;
  const ctx = await browsers.webkit.newContext({ ...devices['iPhone 15'], viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  watch(page, 'timing');
  await page.goto(base + '?install=ios26');
  await page.waitForFunction(() => window.ccInstall && !document.getElementById('cc-boot'), null, { timeout: 90000 });
  await page.waitForTimeout(25000);
  const open = await page.evaluate(() => window.ccInstall.isOpen());
  await page.screenshot({ path: join(out, 'timing_intro_card_after_25s.png') });
  console.log(`timing: sheet open over the intro card after 25 s: ${open}`);
  if (open) errors.push('timing: sheet showed over the intro card');
  await ctx.close();
}

try {
  await timing();
  await pwa();
  await detect();
  await variant('install_ios26', 'webkit', { ...devices['iPhone 15'], viewport: { width: 390, height: 844 } }, 'install=ios26', { titleShot: true });
  await variant('install_ios26_webkit_360x640', 'webkit', { ...devices['iPhone SE'], viewport: { width: 360, height: 640 } }, 'install=ios26');
  await variant('install_ios26_webkit_ipad_820x1180', 'webkit', { ...devices['iPad (gen 7)'], viewport: { width: 820, height: 1180 } }, 'install=ios26');
  await variant('install_ios18', 'chromium', phone, 'install=ios18');
  await variant('install_ios-other', 'chromium', phone, 'install=ios-other');
  await variant('install_ios-old', 'chromium', phone, 'install=ios-old');
  await variant('install_android', 'chromium', phone, 'install=android');
  await variant('install_android-noprompt', 'chromium', phone, 'install=android-noprompt');
  await variant('install_ios26_landscape_844x390', 'chromium', { ...phone, viewport: { width: 844, height: 390 } }, 'install=ios26');
  await variant('install_desktop_1280x720', 'chromium', { viewport: { width: 1280, height: 720 } }, 'install=desktop', { titleShot: true });
} finally {
  for (const b of Object.values(browsers)) await b.close();
  server.close();
}
if (errors.length) { console.error('Errors:\n' + errors.join('\n')); process.exit(1); }
console.log('no browser errors');
