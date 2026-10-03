import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE ?? 'file:///C:/Users/Student/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs');
const base = process.env.QA_URL ?? 'http://127.0.0.1:3100';
assert.ok(['127.0.0.1', 'localhost'].includes(new URL(base).hostname));
const output = path.resolve('.local/qa/right-panel');
await mkdir(output, { recursive: true });
const report = { checks: [], errors: [], date: new Date().toISOString() };
const browser = await chromium.launch({ channel: process.env.PLAYWRIGHT_CHANNEL ?? 'msedge', headless: true });
const monitor = page => page.on('pageerror', error => report.errors.push(error.message));
const waitTotal = (page, total) => page.waitForFunction(total => Number(document.querySelector('.quantity-grid strong')?.textContent.replace(/[^\d,.]/g, '').replace(',', '.')) === total, total);
async function check(name, fn) { await fn(); report.checks.push(name); console.log('PASS ' + name); }
async function showScene(page) { await page.locator('.shape-picker').evaluate(el => el.scrollIntoView({ block: 'start' })); await page.locator('.viewer canvas').waitFor(); }

try {
  await check('Five widths: full screen, same scene height, overlays stay inside, no overflow', async () => {
    for (const width of [360, 390, 768, 1280, 1440]) {
      const page = await browser.newPage({ viewport: { width, height: 1000 }, reducedMotion: 'reduce' }); monitor(page);
      await page.goto(base + '/#calculator', { waitUntil: 'networkidle' });
      const original = await page.locator('.viewer').boundingBox();
      assert.equal(await page.getByRole('combobox', { name: 'Тип конструкции', exact: true }).inputValue(), 'C4');
      await page.goto(base + '/wide#calculator', { waitUntil: 'networkidle' });
      await showScene(page);
      const scene = await page.locator('.viewer').boundingBox();
      assert.equal(scene.height, original.height);
      assert.equal(scene.width, await page.evaluate(() => document.documentElement.clientWidth));
      assert.equal(scene.x, 0);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
      assert.equal(await page.locator('.shape-choice').count(), 8);
      assert.equal(await page.locator('.viewer-toolbar').count(), 0);
      assert.equal(await page.getByRole('button', {name:'Настройки',exact:true}).count(), 0);
      const panel = await page.locator('.parameter-panel').boundingBox();
      assert.ok(panel.y >= scene.y && panel.y + panel.height <= scene.y + scene.height);
      assert.ok(panel.x > scene.width / 2 && panel.x + panel.width <= width);
      const picker = await page.locator('.shape-picker').boundingBox();
      assert.ok(Math.abs(scene.y - picker.y - picker.height) < 2, 'Scene immediately follows thumbnails');
      await page.screenshot({ path: path.join(output, `wide-${width}.png`) });
      await page.getByRole('combobox', { name: 'Слои заполнения', exact: true }).selectOption('2');
      await waitTotal(page, 376);
      await page.keyboard.press('Escape');
      assert.ok(await page.locator('.parameter-panel').isVisible());
      await page.getByRole('combobox', { name: 'Слои заполнения', exact: true }).selectOption('1');
      await waitTotal(page, 188);
      await page.close();
    }
  });

  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' }); monitor(page);
  await page.goto(base + '/wide#calculator', { waitUntil: 'networkidle' }); await showScene(page);
  await check('Image selection for all eight forms and catalog action', async () => {
    for (let i = 0; i < 8; i++) {
      const choice = page.locator('.shape-choice').nth(i); await choice.click();
      await page.waitForFunction(id => document.querySelector('.calculator')?.dataset.shape === id, 'C' + (i + 1));
      assert.equal(await choice.getAttribute('aria-pressed'), 'true');
      assert.equal(await page.locator('.quantity-grid').count(), 1);
    }
    await page.locator('.solution-card').nth(3).getByRole('button').click();
    assert.equal(await page.locator('.calculator').getAttribute('data-shape'), 'C4');
  });
  await check('Dimensions, opening, panel scroll and camera controls', async () => {
    await page.getByLabel('Длина, м', { exact: true }).fill('20'); await waitTotal(page, 328);
    await page.getByLabel('Длина, м', { exact: true }).fill('10'); await waitTotal(page, 188);
    await page.getByLabel('Проём в передней стороне', { exact: true }).check(); await waitTotal(page, 179);
    await page.getByRole('button', { name: 'Сверху', exact: true }).click();
    await page.getByRole('button', { name: '3D', exact: true }).click();
    await page.locator('.viewer').scrollIntoViewIfNeeded();
    const before = await page.locator('.viewer canvas').screenshot();
    const rect = await page.locator('.viewer canvas').boundingBox();
    await page.mouse.move(rect.x + rect.width * .65, rect.y + rect.height * .65);
    await page.mouse.down(); await page.mouse.move(rect.x + rect.width * .75, rect.y + rect.height * .7, { steps: 12 }); await page.mouse.up();
    assert.notDeepEqual(await page.locator('.viewer canvas').screenshot(), before, 'Model rotates outside the overlay');
  });
  await check('JSON export and import, print card and quote attachment', async () => {
    const pending = page.waitForEvent('download'); await page.getByRole('button', { name: 'Сохранить JSON' }).click();
    const download = await pending; const jsonPath = path.join(output, 'roundtrip.json'); await download.saveAs(jsonPath);
    const saved = JSON.parse(await readFile(jsonPath, 'utf8')); assert.equal(saved.length, 10); assert.equal(saved.opening.enabled, true);
    await page.getByLabel('Длина, м', { exact: true }).fill('20');
    await page.locator('input[type=file]').setInputFiles(jsonPath); await waitTotal(page, 179);
    await page.emulateMedia({ media: 'print' });
    assert.ok(await page.locator('.print-card').isVisible());
    assert.equal(await page.locator('.shape-picker').isVisible(), false);
    assert.equal(await page.locator('.parameter-panel').isVisible(), false);
    await page.pdf({ path: path.join(output, 'print-card.pdf'), format: 'A4' });
    await page.emulateMedia({ media: 'screen' });
    await page.getByRole('button', { name: /Получить расчёт/ }).click();
    assert.ok(await page.locator('.attached-config').isVisible());
  });
  await check('C8 contour settings on mobile and resize', async () => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.locator('.shape-choice').nth(7).click();
    const contours = page.locator('.contour-inputs fieldset');
    await contours.nth(2).getByRole('checkbox', { name: 'Контур 3', exact: true }).uncheck();
    await page.getByRole('combobox', { name: 'Внутренний стеновой модуль', exact: true }).selectOption('W2');
    await page.getByLabel('Длина объекта, м', { exact: true }).fill('12,5');
    assert.equal(await page.locator('.input-error').count(), 0);
    await showScene(page); await page.screenshot({ path: path.join(output, 'mobile-c8.png') });
    assert.ok(await page.locator('.parameter-panel').isVisible());
    await page.screenshot({ path: path.join(output, 'mobile-settings.png') });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  });
  await page.close();

  await check('Wide 2D fallback retains projections and dimensions', async () => {
    const fallback = await browser.newPage({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' }); monitor(fallback);
    await fallback.addInitScript(() => {
      const getContext = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (kind, ...args) { return /^webgl/.test(kind) ? null : getContext.call(this, kind, ...args); };
    });
    await fallback.goto(base + '/wide#calculator', { waitUntil: 'networkidle' });
    await fallback.locator('.viewer').scrollIntoViewIfNeeded(); await fallback.locator('.viewer svg').waitFor();
    await fallback.getByRole('button', { name: 'Сверху', exact: true }).click();
    await fallback.locator('.viewer svg[aria-label*="сверху"]').waitFor();
    await fallback.getByLabel('Длина, м', { exact: true }).fill('20'); await waitTotal(fallback, 328);
    await fallback.close();
  });
  assert.deepEqual(report.errors, []);
} catch (error) { report.failure = error.stack; console.error(error.stack); process.exitCode = 1; }
finally { await browser.close(); await writeFile(path.join(output, 'report.json'), JSON.stringify(report, null, 2)); }
