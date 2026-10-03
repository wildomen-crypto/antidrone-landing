import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE ?? 'file:///C:/Users/Student/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs');
const base = process.env.QA_URL ?? 'http://127.0.0.1:3100';
assert.ok(['127.0.0.1', 'localhost'].includes(new URL(base).hostname));
const output = path.resolve('.local/qa/roof-structure');
await mkdir(output, { recursive: true });
const report = { checks: [], errors: [], date: new Date().toISOString() };
const browser = await chromium.launch({ channel: process.env.PLAYWRIGHT_CHANNEL ?? 'msedge', headless: true });
const monitor = page => page.on('pageerror', error => report.errors.push(error.message));
const waitTotal = (page, total) => page.waitForFunction(total => Number(document.querySelector('.quantity-grid strong')?.textContent.replace(/[^\d,.]/g, '').replace(',', '.')) === total, total);
async function check(name, fn) { await fn(); report.checks.push(name); console.log('PASS ' + name); }
async function showScene(page) { await page.locator('.shape-picker').evaluate(el => el.scrollIntoView({ block: 'start' })); await page.locator('.viewer canvas').waitFor(); }

try {
  await check('Seven widths: full screen, same scene height, overlays stay inside, no overflow', async () => {
    for (const width of [360, 390, 510, 768, 900, 1280, 1440]) {
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
      assert.ok(panel.x >= scene.x && panel.x + panel.width <= width);
      assert.ok(scene.width - panel.x - panel.width <= 16, 'Settings aligned to the right edge');
      const dimensions = await page.locator('.dimension-panel').boundingBox();
      assert.ok(dimensions.x >= scene.x && dimensions.x + dimensions.width < panel.x);
      assert.ok(dimensions.y >= scene.y && dimensions.y + dimensions.height <= scene.y + scene.height);
      assert.equal(await page.locator('.dimension-panel input[type=range]').count(), 3);
      assert.equal(await page.locator('[data-target="walls"] .material-choice').count(), 8);
      assert.equal(await page.locator('[data-target="roof"] .material-choice').count(), 8);
      assert.equal(await page.locator('.structure-choice').count(), 6);
      const filling = await page.locator('[data-target="walls"]').boundingBox();
      assert.ok(Math.abs(filling.y - scene.y - scene.height) < 2, 'Filling choices directly below 3D');
      const roofing = await page.locator('[data-target="roof"]').boundingBox();
      const structure = await page.locator('.structure-picker').boundingBox();
      assert.ok(Math.abs(roofing.y - filling.y - filling.height) < 2);
      assert.ok(Math.abs(structure.y - roofing.y - roofing.height) < 2);
      assert.equal(await page.locator('.parameter-panel').getByRole('combobox', {name:'Заполнение стен / экрана',exact:true}).count(),0);
      assert.equal(await page.locator('.parameter-panel').getByRole('combobox', {name:'Материал покрытия',exact:true}).count(),0);
      assert.equal(await page.locator('.parameter-panel').getByRole('combobox', {name:'Несущие элементы',exact:true}).count(),0);
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
      assert.equal(await page.locator('.dimension-panel input[type=range]').count(), i===0?2:3);
    }
    await page.locator('.solution-card').nth(3).getByRole('button').click();
    assert.equal(await page.locator('.calculator').getAttribute('data-shape'), 'C4');
  });
  await check('Eight filling images update graph and JSON without changing roof material', async () => {
    for (let index=0; index<8; index++) {
      const card=page.locator('[data-target="walls"] .material-choice').nth(index); await card.click();
      assert.equal(await card.getAttribute('aria-pressed'),'true');
      const pending=page.waitForEvent('download'); await page.getByRole('button',{name:'Сохранить JSON'}).click();
      const download=await pending; const savedPath=path.join(output,'material-'+(index+1)+'.json');await download.saveAs(savedPath);
      const input=JSON.parse(await readFile(savedPath,'utf8'));
      assert.equal(input.materialId,'M'+(index+1)); assert.equal(input.roofMaterialId,'M5');
      await waitTotal(page,index===7?316:188);
      assert.equal(await page.locator('.input-error').count(),0);
    }
    assert.ok(await page.getByRole('combobox',{name:'Материал слоя 1',exact:true}).isVisible());
    await page.locator('[data-target="walls"] .material-choice').nth(4).click();await waitTotal(page,188);
  });
  await check('Eight roof images work independently, including combined panels and keyboard', async () => {
    for (let index=0; index<8; index++) {
      const card=page.locator('[data-target="roof"] .material-choice').nth(index); await card.click();
      assert.equal(await card.getAttribute('aria-pressed'),'true');
      const pending=page.waitForEvent('download'); await page.getByRole('button',{name:'Сохранить JSON'}).click();
      const savedPath=path.join(output,'roof-'+(index+1)+'.json'); await (await pending).saveAs(savedPath);
      const input=JSON.parse(await readFile(savedPath,'utf8'));
      assert.equal(input.roofMaterialId,'M'+(index+1)); assert.equal(input.materialId,'M5');
      await waitTotal(page,index===7?248:188);
      assert.equal(await page.locator('.input-error').count(),0);
    }
    const roof=page.locator('[data-target="roof"] .material-choice');
    await roof.nth(5).focus(); await page.keyboard.press('Space');
    assert.equal(await roof.nth(5).getAttribute('aria-pressed'),'true');
    await roof.nth(4).click(); await waitTotal(page,188);
  });
  await check('Six structural images save system and update graph; JSON restores both new rows', async () => {
    const ids=['tube-post','spatial-column','frame','spatial-truss','guyed-mast','wall-bracket'];
    const number=async locator=>Number((await locator.textContent()).replace(/[^\d,.]/g,'').replace(',','.'));
    const baselineFrame=await number(page.locator('.quantity-grid strong').nth(2));
    const cables=page.locator('.estimate-result tr').filter({hasText:'Канаты схемы'}).locator('td').nth(1);
    const baselineCables=await number(cables);
    for (let index=0;index<ids.length;index++) {
      const card=page.locator('.structure-choice').nth(index);
      await card.focus(); await page.keyboard.press('Enter');
      assert.equal(await card.getAttribute('aria-pressed'),'true');
      const pending=page.waitForEvent('download'); await page.getByRole('button',{name:'Сохранить JSON'}).click();
      const savedPath=path.join(output,'structure-'+ids[index]+'.json'); await (await pending).saveAs(savedPath);
      const input=JSON.parse(await readFile(savedPath,'utf8'));
      assert.equal(input.structuralSystem,ids[index]);
      assert.equal(input.materialId,'M5'); assert.equal(input.roofMaterialId,'M5');
      await waitTotal(page,188);
      const frame=await number(page.locator('.quantity-grid strong').nth(2)); assert.ok(Number.isFinite(frame));
      if ([1,3].includes(index)) assert.ok(frame>baselineFrame);
      if (index===4) assert.ok(await number(cables)>baselineCables);
      assert.equal(await page.locator('.input-error').count(),0);
    }
    await page.locator('[data-target="roof"] .material-choice').nth(5).click();
    await page.locator('.structure-choice').nth(3).click();
    const pending=page.waitForEvent('download'); await page.getByRole('button',{name:'Сохранить JSON'}).click();
    const savedPath=path.join(output,'new-rows-roundtrip.json'); await (await pending).saveAs(savedPath);
    await page.locator('[data-target="roof"] .material-choice').nth(4).click();
    await page.locator('.structure-choice').first().click();
    await page.locator('input[type=file]').setInputFiles(savedPath);
    await page.waitForFunction(() => document.querySelector('[data-target="roof"] .material-choice:nth-child(6)')?.getAttribute('aria-pressed') === 'true'
      && document.querySelector('.structure-choice:nth-child(4)')?.getAttribute('aria-pressed') === 'true');
    assert.equal(await page.locator('[data-target="roof"] .material-choice').nth(5).getAttribute('aria-pressed'),'true');
    assert.equal(await page.locator('.structure-choice').nth(3).getAttribute('aria-pressed'),'true');
    await page.locator('[data-target="roof"] .material-choice').nth(4).click();
    await page.locator('.structure-choice').first().click(); await waitTotal(page,188);
    await page.setViewportSize({width:1440,height:1400}); await showScene(page);
    await page.screenshot({path:path.join(output,'three-rows-desktop.png')});
    await page.setViewportSize({width:1440,height:1000});
  });
  await check('Roof row follows forms and variants; disabled roof retains independent preset', async () => {
    const variants=await browser.newPage({viewport:{width:1280,height:1000},reducedMotion:'reduce'}); monitor(variants);
    await variants.goto(base+'/wide#calculator',{waitUntil:'networkidle'});
    for(let i=0;i<8;i++) {
      await variants.locator('.shape-choice').nth(i).click();
      assert.equal(await variants.locator('[data-target="roof"] .material-choice').count(),[0,1,4].includes(i)?0:8);
      if(i===4||i===6) {
        await variants.getByRole('combobox',{name:'Вариант',exact:true}).selectOption(i===4?'shelter':'perimeter');
        assert.equal(await variants.locator('[data-target="roof"] .material-choice').count(),i===4?8:0);
      }
    }
    await variants.locator('.shape-choice').nth(3).click();
    await variants.getByLabel('Включить покрытие',{exact:true}).uncheck(); await waitTotal(variants,128);
    assert.ok(await variants.locator('[data-target="roof"]').getByText('Покрытие выключено.',{exact:false}).isVisible());
    await variants.locator('[data-target="roof"] .material-choice').nth(7).click(); await waitTotal(variants,128);
    await variants.getByLabel('Включить покрытие',{exact:true}).check(); await waitTotal(variants,248);
    await variants.close();
  });
  await check('Dimensions, opening, panel scroll and camera controls', async () => {
    await page.getByRole('textbox', { name: 'Длина, м', exact: true }).fill('20'); await waitTotal(page, 328);
    const slider=page.getByRole('slider',{name:'Длина, м',exact:true});
    assert.equal(await slider.inputValue(),'20');
    await slider.focus();await page.keyboard.press('ArrowRight');await waitTotal(page,329.4);
    assert.equal(await page.getByRole('textbox',{name:'Длина, м',exact:true}).inputValue(),'20,1');
    await page.keyboard.press('ArrowLeft');await waitTotal(page,328);
    const sliderRect=await slider.boundingBox();
    await page.mouse.click(sliderRect.x+sliderRect.width*.18,sliderRect.y+sliderRect.height/2);
    const dragged=Number(await slider.inputValue());assert.ok(dragged>20 && dragged<60);
    await page.waitForFunction(value=>Number(document.querySelector('.dimension-exact input').value.replace(',','.'))===value,dragged);

    await page.getByRole('textbox', { name: 'Длина, м', exact: true }).fill('10'); await waitTotal(page, 188);
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
    await page.getByRole('textbox', { name: 'Длина, м', exact: true }).fill('20');
    await page.locator('input[type=file]').setInputFiles(jsonPath); await waitTotal(page, 179);
    await page.emulateMedia({ media: 'print' });
    assert.ok(await page.locator('.print-card').isVisible());
    assert.equal(await page.locator('.shape-picker').isVisible(), false);
    assert.equal(await page.locator('.parameter-panel').isVisible(), false);
    assert.equal(await page.locator('.dimension-panel').isVisible(), false);
    for (const picker of await page.locator('.material-picker').all()) assert.equal(await picker.isVisible(),false);
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
    await page.getByRole('textbox', { name: 'Длина объекта, м', exact: true }).fill('12,5');
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
    await fallback.getByRole('textbox', { name: 'Длина, м', exact: true }).fill('20'); await waitTotal(fallback, 328);
    await fallback.close();
  });
  assert.deepEqual(report.errors, []);
} catch (error) { report.failure = error.stack; console.error(error.stack); process.exitCode = 1; }
finally { await browser.close(); await writeFile(path.join(output, 'report.json'), JSON.stringify(report, null, 2)); }
