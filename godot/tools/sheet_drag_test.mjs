// Drag / flick tests for the install sheet in WebKit (iPhone 15, touch).
//   node godot/tools/sheet_drag_test.mjs [outDir]      (export the Web preset first)
// Touch drags are pointer events with pointerType "touch", sent through the
// same handlers a finger hits; a mouse drag checks real input too. Saves
// mid-drag screenshots to preview/phone/install/drag_*.png.
import { devices, webkit } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { serve } from './serve.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const out = resolve(process.argv[2] || join(here, '..', 'preview', 'phone', 'install'));
mkdirSync(out, { recursive: true });
const port = 8064;
const server = await serve(port);
const browser = await webkit.launch();
const ctx = await browser.newContext({ ...devices['iPhone 15'], viewport: { width: 390, height: 844 } });
const page = await ctx.newPage();
const errors = [];
const results = [];
page.on('pageerror', (e) => errors.push(String(e)));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });

const state = () => page.evaluate(() => window.ccInstall.state());
async function openSheet() {
  await page.evaluate(() => { try { localStorage.clear(); } catch (e) {} window.ccInstall.open(true); });
  await page.waitForTimeout(700);
}
// Touch drag on the sheet from (x, y0) by dy over `ms`, in `n` steps; `mid` runs before release.
async function touchDrag(dy, ms, { n = 12, x = 195, y0 = null, mid = null } = {}) {
  const s = await state();
  const start = y0 ?? 844 - s.h + 30; // the sheet's header
  await page.evaluate(([x, y]) => {
    const sh = document.querySelector('.cci-sheet');
    window.__t = { sh, id: 7 };
    sh.dispatchEvent(new PointerEvent('pointerdown', { pointerId: 7, pointerType: 'touch', isPrimary: true, clientX: x, clientY: y, bubbles: true, button: 0 }));
  }, [x, start]);
  for (let i = 1; i <= n; i++) {
    await page.waitForTimeout(ms / n);
    await page.evaluate(([x, y]) => window.__t.sh.dispatchEvent(new PointerEvent('pointermove', { pointerId: 7, pointerType: 'touch', isPrimary: true, clientX: x, clientY: y, bubbles: true })), [x, start + (dy * i) / n]);
  }
  if (mid) await mid();
  await page.evaluate(([x, y]) => window.__t.sh.dispatchEvent(new PointerEvent('pointerup', { pointerId: 7, pointerType: 'touch', isPrimary: true, clientX: x, clientY: y, bubbles: true })), [x, start + dy]);
}
function check(name, ok, detail) {
  results.push(`${ok ? 'PASS' : 'FAIL'} ${name}: ${detail}`);
  if (!ok) errors.push(`${name}: ${detail}`);
}

try {
  await page.goto(`http://localhost:${port}/?install=ios26`);
  await page.waitForFunction(() => window.ccInstall && !document.getElementById('cc-boot'), null, { timeout: 90000 });
  await page.waitForTimeout(1500);

  // 1. slow 20% drag -> springs back
  await openSheet();
  let h = (await state()).h;
  let midState;
  await touchDrag(h * 0.2, 700, { mid: async () => { midState = await state(); await page.screenshot({ path: join(out, 'drag_1_slow20_mid.png') }); } });
  await page.waitForTimeout(800);
  let s = await state();
  check('slow 20% drag springs back', s.open && Math.abs(s.y) < 1, `mid y=${midState.y.toFixed(0)} of h=${h.toFixed(0)}, dim=${midState.dim.toFixed(2)}; after release y=${s.y.toFixed(1)} open=${s.open}`);

  // 2. 50% drag -> dismiss (screenshot mid-drag: backdrop half dim)
  await touchDrag(h * 0.5, 700, { mid: async () => { midState = await state(); await page.screenshot({ path: join(out, 'drag_2_half_mid.png') }); } });
  await page.waitForTimeout(150);
  const leaving = await state();
  await page.waitForTimeout(700);
  s = await state();
  const saved = await page.evaluate(() => { try { return !!localStorage.getItem('cc-install-dismissed'); } catch (e) { return 'n/a'; } });
  check('50% drag dismisses', !s.open && !(await page.evaluate(() => document.getElementById('cc-install').classList.contains('on'))),
    `mid y=${midState.y.toFixed(0)}/${h.toFixed(0)} dim=${midState.dim.toFixed(2)}; 150 ms after release y=${leaving.y.toFixed(0)} (keeps moving); remembered=${saved}`);

  // 3. quick 80 px flick -> dismiss
  await openSheet();
  await touchDrag(80, 60, { n: 4 });
  await page.waitForTimeout(700);
  s = await state();
  check('quick 80px flick dismisses', !s.open, `open=${s.open}`);

  // 4. upward drag -> rubber band, then back to rest
  await openSheet();
  await touchDrag(-150, 500, { mid: async () => { midState = await state(); await page.screenshot({ path: join(out, 'drag_4_up_rubberband_mid.png') }); } });
  await page.waitForTimeout(800);
  s = await state();
  check('upward drag rubber-bands', midState.y < -10 && midState.y > -80 && s.open && Math.abs(s.y) < 1, `finger -150 px -> sheet ${midState.y.toFixed(0)} px; after release y=${s.y.toFixed(1)}`);

  // 5. a tap on a step does nothing; "Not now" still closes
  await page.tap('.cci-steps li:first-child');
  await page.waitForTimeout(300);
  s = await state();
  check('tap on a step keeps it open', s.open, `open=${s.open}`);
  await page.tap('#cci-later');
  await page.waitForTimeout(700);
  s = await state();
  check('Not now closes', !s.open, `open=${s.open}`);

  // 6. backdrop tap and Escape close; grabber is a "Dismiss" button
  await openSheet();
  await page.tap('.cci-scrim', { position: { x: 195, y: 40 } });
  await page.waitForTimeout(700);
  check('backdrop tap closes', !(await state()).open, '');
  await openSheet();
  await page.keyboard.press('Escape');
  await page.waitForTimeout(700);
  check('Escape closes', !(await state()).open, '');
  await openSheet();
  const label = await page.getAttribute('#cci-grip', 'aria-label');
  // focus trap: Tab from the last button wraps to the first
  await page.focus('#cci-later');
  await page.keyboard.press('Tab');
  const wrapped = await page.evaluate(() => document.activeElement.id);
  check('grabber + focus trap', label === 'Dismiss' && wrapped === 'cci-grip', `grabber label=${label}; Tab from Not now -> #${wrapped}`);

  // 7. real mouse drag (pointerType mouse) of 50% dismisses too
  h = (await state()).h;
  await page.mouse.move(195, 844 - h + 30);
  await page.mouse.down();
  for (let i = 1; i <= 10; i++) { await page.mouse.move(195, 844 - h + 30 + (h * 0.5 * i) / 10); await page.waitForTimeout(30); }
  await page.mouse.up();
  await page.waitForTimeout(700);
  check('mouse drag 50% dismisses', !(await state()).open, '');
} finally {
  await browser.close();
  server.close();
}
console.log(results.join('\n'));
if (errors.length) { console.error('Errors:\n' + errors.join('\n')); process.exit(1); }
console.log('all sheet checks passed');
