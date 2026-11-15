import { test, expect } from '@playwright/test';

// Ingredient values on day 1, in shelf order.
const DAY1 = [1, 4, 6, 10];

// Greedy route using the big jars first. Fine for day 1 targets (all additions).
function route(target) {
  const out = [];
  for (let i = DAY1.length - 1; i >= 0; i--) while (target >= DAY1[i]) { out.push(i); target -= DAY1[i]; }
  return out;
}

test('serves a correct potion on day 1 without errors', async ({ page }) => {
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => m.type() === 'error' && errors.push(m.text()));

  await page.goto('/');
  await expect(page.locator('#card h2')).toHaveText('Cauldron Counter');
  await page.click('#card .btn.primary');

  await expect(page.locator('#shelf .jar')).toHaveCount(4);
  const target = Number(await page.locator('#target').textContent());
  expect(target).toBeGreaterThan(0);

  const steps = route(target);
  expect(steps.length).toBeLessThanOrEqual(6);
  for (const i of steps) await page.click(`.jar[data-i="${i}"]`);

  await expect(page.locator('#strength')).toHaveText(String(target));
  await expect(page.locator('#serve')).toHaveClass(/lit/);
  await page.click('#serve');

  await expect(page.locator('.toast').first()).toContainText('coins');
  await expect(page.locator('#coins')).not.toHaveText('0', { timeout: 5000 });
  expect(errors).toEqual([]);
});

test('rejects an impossible ingredient with a note', async ({ page }) => {
  await page.goto('/');
  await page.click('#card .btn.primary');
  await page.keyboard.press('1');
  await page.keyboard.press('Backspace');
  await expect(page.locator('#chips .empty-note')).toBeVisible();
  for (let k = 0; k < 7; k++) await page.keyboard.press('1');
  await expect(page.locator('#note')).toContainText('full');
});
