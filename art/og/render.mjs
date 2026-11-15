import { chromium } from '@playwright/test';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';

const dir = path.dirname(fileURLToPath(import.meta.url));
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
  await page.goto(pathToFileURL(path.join(dir, 'og.html')).href, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  const ok = await page.evaluate(() => document.fonts.check('120px "IM Fell English"') && document.fonts.check('34px "Alegreya Sans"'));
  if (!ok) throw new Error('Fonts failed to load');
  await page.screenshot({ path: path.join(dir, '../../public/og.png'), clip: { x: 0, y: 0, width: 1200, height: 630 } });
  console.log('wrote', path.join(dir, '../../public/og.png'));
} finally {
  await browser.close();
}
