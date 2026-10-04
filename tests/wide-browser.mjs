import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';
import { randomUUID } from 'node:crypto';

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE ?? 'file:///C:/Users/Student/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs');
const base = process.env.QA_URL ?? 'http://127.0.0.1:3100';
assert.ok(['127.0.0.1', 'localhost'].includes(new URL(base).hostname));
const output = path.resolve('.local/qa/roof-opening');
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
      assert.equal(await page.locator('.dimension-panel input[type=range]').count(), 5);
      assert.equal(await page.locator('.dimension-panel').getByRole('slider',{name:'Максимальный шаг секций, м',exact:true}).count(),1);
      assert.equal(await page.locator('.dimension-panel').getByRole('slider',{name:'Слои заполнения',exact:true}).count(),1);
      if(width<=500) assert.ok(await page.locator('.dimension-panel').evaluate(el=>el.querySelector('.dimension-sliders').getBoundingClientRect().bottom<=el.getBoundingClientRect().bottom+1), 'All five sliders fit above scrollable icon options');
      assert.equal(await page.locator('.dimension-panel .compact-option').count(),8);
      if(width>=1280) assert.ok(await page.locator('.dimension-panel').evaluate(el=>el.scrollHeight<=el.clientHeight+1),'Desktop sliders and icon rows fit without scrolling');
      assert.ok(await page.locator('.compact-option svg').evaluateAll(icons=>icons.every(el=>el.getBoundingClientRect().width===20&&el.getBoundingClientRect().height===20)));
      assert.equal(await page.locator('.parameter-panel').getByRole('combobox',{name:'Форма сечения на схеме',exact:true}).count(),0);
      assert.equal(await page.locator('.parameter-panel').getByRole('combobox',{name:'Условный тип основания',exact:true}).count(),0);
      assert.equal(await page.getByRole('checkbox',{name:'Пространственные опоры',exact:true}).count(),0);
      assert.equal(await page.locator('.parameter-panel').getByRole('checkbox',{name:'Передняя',exact:true}).count(),0);
      assert.equal(await page.locator('option[value="pile"]').count(),0);
      assert.equal(await page.getByRole('checkbox',{name:'Включить покрытие',exact:true}).count(),0);
      assert.equal(await page.locator('.parameter-panel').getByRole('combobox',{name:'Слои заполнения',exact:true}).count(),0);
      assert.equal(await page.locator('.parameter-panel').getByRole('textbox',{name:'Максимальный шаг секций, м',exact:true}).count(),0);
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
      const layerSlider=page.getByRole('slider',{name:'Слои заполнения',exact:true});
      await layerSlider.focus(); await page.keyboard.press('Home'); await page.keyboard.press('ArrowRight');
      await waitTotal(page, 376);
      await page.keyboard.press('Escape');
      assert.ok(await page.locator('.parameter-panel').isVisible());
      await layerSlider.focus(); await page.keyboard.press('Home');
      await waitTotal(page, 188);
      await page.getByLabel('Проём в передней стороне',{exact:true}).check(); await waitTotal(page,179);
      assert.equal(await page.locator('.opening-sliders input[type=range]').count(),3);
      const openingRect=await page.locator('.opening-sliders').boundingBox();
      assert.ok(openingRect.x>=panel.x&&openingRect.x+openingRect.width<=panel.x+panel.width);
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
      if([390,1440].includes(width)) {
        await page.locator('.opening-sliders').scrollIntoViewIfNeeded();
        await page.screenshot({path:path.join(output,`opening-${width}.png`)});
      }
      await page.getByLabel('Проём в передней стороне',{exact:true}).uncheck(); await waitTotal(page,188);
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
      assert.equal(await page.locator('.dimension-panel input[type=range]').count(), i===0?4:5);
      assert.equal(await page.locator('[data-choice="sides"] .compact-option').count(),[0,4,0,4,0,2,1,4][i]);
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
    await page.locator('.dimension-panel').evaluate(el=>el.scrollTop=0);
    await page.screenshot({path:path.join(output,'three-rows-desktop.png')});
    await page.setViewportSize({width:1440,height:1000});
  });
  await check('Roof card toggles optional cover; canopy and shelter keep mandatory cover', async () => {
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
    const roof=variants.locator('[data-target="roof"]');
    await roof.locator('.material-choice').nth(4).click(); await waitTotal(variants,128);
    assert.equal(await roof.locator('[aria-pressed=true]').count(),0);
    assert.ok(await roof.getByText('Без кровли — выберите материал, чтобы включить',{exact:true}).isVisible());
    const pending=variants.waitForEvent('download');await variants.getByRole('button',{name:'Сохранить JSON'}).click();
    const savedPath=path.join(output,'without-roof.json');await(await pending).saveAs(savedPath);
    const saved=JSON.parse(await readFile(savedPath,'utf8'));assert.equal(saved.roof,false);assert.equal(saved.roofMaterialId,'M5');
    await roof.locator('.material-choice').nth(7).click(); await waitTotal(variants,248);
    await variants.locator('input[type=file]').setInputFiles(savedPath); await waitTotal(variants,128);
    assert.equal(await roof.locator('[aria-pressed=true]').count(),0);
    await variants.locator('.shape-choice').nth(2).click(); await waitTotal(variants,60);
    await roof.locator('.material-choice').nth(4).click(); await waitTotal(variants,60);
    assert.equal(await roof.locator('[aria-pressed=true]').count(),1);
    assert.equal(await variants.locator('.input-error').count(),0);
    await variants.locator('.shape-choice').nth(3).click(); await roof.locator('.material-choice').nth(4).click(); await waitTotal(variants,128);
    await variants.locator('.solution-card').nth(2).getByRole('button').click(); await waitTotal(variants,60);
    await variants.locator('.shape-choice').nth(3).click(); await roof.locator('.material-choice').nth(4).click(); await waitTotal(variants,128);
    await variants.locator('.shape-choice').nth(4).click();
    await variants.getByRole('combobox',{name:'Вариант',exact:true}).selectOption('shelter'); await waitTotal(variants,30);
    await roof.locator('.material-choice').nth(4).click(); await waitTotal(variants,30);
    for(const index of [3,5,6,7]) {
      await variants.locator('.shape-choice').nth(index).click();
      const active=roof.locator('.material-choice[aria-pressed=true]');assert.equal(await active.count(),1);
      const materialIndex=await active.evaluate(el=>[...el.parentElement.children].indexOf(el));
      await active.click();
      await variants.waitForFunction(()=>[...document.querySelectorAll('.estimate-result tr')].find(row=>row.textContent.startsWith('Покрытие, без повторения слоёв'))?.children[1]?.textContent==='0 м²');
      assert.equal(await roof.locator('[aria-pressed=true]').count(),0);
      await roof.locator('.material-choice').nth(materialIndex).click();assert.equal(await roof.locator('[aria-pressed=true]').count(),1);
    }
    assert.equal(await variants.getByRole('checkbox',{name:'Включить покрытие',exact:true}).count(),0);
    await variants.close();
  });
  await check('Compact section, foundation and side icons control configuration; removed piles cannot import', async () => {
    const options=page.locator('.compact-options');
    await options.getByRole('button',{name:'Круглая труба',exact:true}).click();
    await options.getByRole('button',{name:'Сваи с ростверком',exact:true}).click();
    for(const [name,total] of [['Передняя',148],['Правая',164],['Задняя',148],['Левая',164]]) {
      const button=options.getByRole('button',{name,exact:true}); await button.click(); await waitTotal(page,total);
      assert.equal(await button.getAttribute('aria-pressed'),'false');
      await button.focus(); await page.keyboard.press('Space'); await waitTotal(page,188);
    }
    await page.getByLabel('Проём в передней стороне',{exact:true}).check(); await waitTotal(page,179);
    await options.getByRole('button',{name:'Передняя',exact:true}).click(); await waitTotal(page,148);
    assert.equal(await page.getByLabel('Проём в передней стороне',{exact:true}).isChecked(),false);
    assert.equal(await page.locator('.input-error').count(),0);
    const pending=page.waitForEvent('download'); await page.getByRole('button',{name:'Сохранить JSON'}).click();
    const savedPath=path.join(output,'compact-options.json'); await (await pending).saveAs(savedPath);
    const saved=JSON.parse(await readFile(savedPath,'utf8')); assert.equal(saved.sectionType,'round');assert.equal(saved.foundation,'pile-cap');
    assert.deepEqual(saved.sides,[false,true,true,true]);
    await options.getByRole('button',{name:'Профильная труба',exact:true}).click();
    await options.getByRole('button',{name:'Незаглублённый блок',exact:true}).click();
    await options.getByRole('button',{name:'Передняя',exact:true}).click(); await waitTotal(page,188);
    await page.locator('input[type=file]').setInputFiles(savedPath); await waitTotal(page,148);
    assert.equal(await options.getByRole('button',{name:'Круглая труба',exact:true}).getAttribute('aria-pressed'),'true');
    assert.equal(await options.getByRole('button',{name:'Сваи с ростверком',exact:true}).getAttribute('aria-pressed'),'true');
    const rejected=path.join(output,'removed-pile.json'); await writeFile(rejected,JSON.stringify({...saved,foundation:'pile'}));
    await page.locator('input[type=file]').setInputFiles(rejected);
    await page.getByText('Сваи без ростверка больше недоступны. Выберите блок или сваи с ростверком.',{exact:true}).waitFor();
    assert.equal(await options.getByRole('button',{name:'Сваи с ростверком',exact:true}).getAttribute('aria-pressed'),'true');
    await options.getByRole('button',{name:'Профильная труба',exact:true}).click();
    await options.getByRole('button',{name:'Незаглублённый блок',exact:true}).click();
    await options.getByRole('button',{name:'Передняя',exact:true}).click(); await waitTotal(page,188);
    await page.setViewportSize({width:390,height:1000}); await showScene(page);
    await options.getByRole('button',{name:'Левая',exact:true}).scrollIntoViewIfNeeded();
    await page.screenshot({path:path.join(output,'mobile-icon-options.png')});
    await options.getByRole('button',{name:'Круглая труба',exact:true}).click();
    await options.getByRole('button',{name:'Профильная труба',exact:true}).click();
    await page.setViewportSize({width:1440,height:1000});
  });
  await check('Spatial column and truss cards combine, deselect independently and restore from JSON', async () => {
    const columns=page.locator('.structure-choice[data-system="spatial-column"]');
    const trusses=page.locator('.structure-choice[data-system="spatial-truss"]');
    const tube=page.locator('.structure-choice[data-system="tube-post"]');
    await trusses.click(); const trussLength=Number((await page.locator('.quantity-grid strong').nth(2).textContent()).replace(/[^\d,.]/g,'').replace(',','.'));
    await columns.focus(); await page.keyboard.press('Enter');
    assert.equal(await columns.getAttribute('aria-pressed'),'true'); assert.equal(await trusses.getAttribute('aria-pressed'),'true');
    assert.equal(await page.locator('.structure-choice[aria-pressed=true]').count(),2);
    assert.ok(Number((await page.locator('.quantity-grid strong').nth(2).textContent()).replace(/[^\d,.]/g,'').replace(',','.'))>trussLength);
    const pending=page.waitForEvent('download'); await page.getByRole('button',{name:'Сохранить JSON'}).click();
    const savedPath=path.join(output,'combined-structure.json'); await (await pending).saveAs(savedPath);
    const saved=JSON.parse(await readFile(savedPath,'utf8'));assert.equal(saved.structuralSystem,'spatial-truss');assert.equal(saved.spatialSupports,true);
    await columns.click(); assert.equal(await columns.getAttribute('aria-pressed'),'false');assert.equal(await trusses.getAttribute('aria-pressed'),'true');
    await tube.click(); await columns.click(); await trusses.click();
    assert.equal(await columns.getAttribute('aria-pressed'),'true');assert.equal(await trusses.getAttribute('aria-pressed'),'true');
    await trusses.click();assert.equal(await columns.getAttribute('aria-pressed'),'true');assert.equal(await trusses.getAttribute('aria-pressed'),'false');
    await page.locator('.structure-choice[data-system="frame"]').click(); assert.equal(await columns.getAttribute('aria-pressed'),'false');
    await page.locator('input[type=file]').setInputFiles(savedPath);
    await page.waitForFunction(()=>document.querySelectorAll('.structure-choice[aria-pressed=true]').length===2);
    await page.setViewportSize({width:1440,height:1400}); await showScene(page);
    await page.locator('.dimension-panel').evaluate(el=>el.scrollTop=0);
    await page.screenshot({path:path.join(output,'combined-structure-desktop.png')});
    await page.setViewportSize({width:1440,height:1000}); await tube.click(); await waitTotal(page,188);
    assert.equal(await page.locator('.structure-choice[aria-pressed=true]').count(),1);
  });
  await check('Compact original page supports the combination and only two foundations', async () => {
    const original=await browser.newPage({viewport:{width:1280,height:1000},reducedMotion:'reduce'}); monitor(original);
    await original.goto(base+'/#calculator',{waitUntil:'networkidle'});
    await original.getByRole('button',{name:'+ Дополнительные настройки',exact:true}).click();
    assert.equal(await original.getByRole('checkbox',{name:'Пространственные опоры',exact:true}).count(),0);
    const foundation=original.getByRole('combobox',{name:'Условный тип основания',exact:true});
    assert.deepEqual(await foundation.locator('option').evaluateAll(options=>options.map(option=>option.value)),['block','pile-cap']);
    await original.getByRole('combobox',{name:'Несущие элементы',exact:true}).selectOption('spatial-combined');
    await waitTotal(original,188); assert.equal(await original.locator('.input-error').count(),0);
    const pending=original.waitForEvent('download');await original.getByRole('button',{name:'Сохранить JSON'}).click();
    const savedPath=path.join(output,'original-combined.json');await(await pending).saveAs(savedPath);
    const saved=JSON.parse(await readFile(savedPath,'utf8'));assert.equal(saved.structuralSystem,'spatial-truss');assert.equal(saved.spatialSupports,true);
    const roofing=original.getByRole('combobox',{name:'Материал покрытия',exact:true});
    await roofing.selectOption('none');await waitTotal(original,128);
    await original.getByRole('combobox',{name:'Тип конструкции',exact:true}).selectOption('C3');await waitTotal(original,60);
    assert.equal(await roofing.locator('option[value=none]').count(),0);
    assert.equal(await original.getByRole('checkbox',{name:'Включить покрытие',exact:true}).count(),0);
    await original.close();
  });
  await check('Section and layer sliders update supports and quantities and restore from JSON', async () => {
    const stepSlider=page.getByRole('slider',{name:'Максимальный шаг секций, м',exact:true});
    const stepInput=page.getByRole('textbox',{name:'Максимальный шаг секций, м',exact:true});
    const layers=page.getByRole('slider',{name:'Слои заполнения',exact:true});
    const supports=page.locator('.quantity-grid strong').nth(1);
    await stepInput.fill('2'); assert.equal(await stepSlider.inputValue(),'2');
    await page.waitForFunction(()=>document.querySelectorAll('.quantity-grid strong')[1]?.textContent==='16');
    await stepSlider.focus(); await page.keyboard.press('ArrowRight');
    await page.waitForFunction(()=>document.querySelector('.dimension-sliders .dimension-slider:nth-last-child(2) input[type=text]')?.value==='2,1');
    const rect=await stepSlider.boundingBox();
    await page.mouse.click(rect.x+rect.width*.5,rect.y+rect.height/2);
    const dragged=Number(await stepSlider.inputValue()); assert.ok(dragged>4 && dragged<7);
    await page.waitForFunction(()=>document.querySelectorAll('.quantity-grid strong')[1]?.textContent==='8');
    const layerRect=await layers.boundingBox();
    await page.mouse.click(layerRect.x+layerRect.width*.5,layerRect.y+layerRect.height/2);
    assert.equal(await layers.inputValue(),'2'); await waitTotal(page,376);
    await layers.focus(); await page.keyboard.press('End'); await waitTotal(page,564);
    assert.equal(await page.locator('.dimension-value').textContent(),'3');
    await page.keyboard.press('ArrowRight'); assert.equal(await layers.inputValue(),'3');
    await stepInput.fill('2,5');
    const pending=page.waitForEvent('download'); await page.getByRole('button',{name:'Сохранить JSON'}).click();
    const savedPath=path.join(output,'step-layers-roundtrip.json'); await (await pending).saveAs(savedPath);
    const saved=JSON.parse(await readFile(savedPath,'utf8')); assert.equal(saved.step,2.5); assert.equal(saved.layers,3);
    await stepInput.fill('3'); await layers.focus(); await page.keyboard.press('Home'); await waitTotal(page,188);
    await page.locator('input[type=file]').setInputFiles(savedPath); await waitTotal(page,564);
    assert.equal(await stepSlider.inputValue(),'2.5'); assert.equal(await layers.inputValue(),'3');
    assert.equal(await supports.textContent(),'14');
    await stepInput.fill('3'); await layers.focus(); await page.keyboard.press('Home'); await waitTotal(page,188);
    assert.equal(await supports.textContent(),'12');
    await page.setViewportSize({width:390,height:1000}); await showScene(page);
    await layers.scrollIntoViewIfNeeded();
    await page.screenshot({path:path.join(output,'mobile-left-controls.png')});
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
    await page.setViewportSize({width:1440,height:1000});
  });
  await check('Opening sliders synchronize exact input, keyboard and mouse with constrained dimensions', async () => {
    await page.getByLabel('Проём в передней стороне',{exact:true}).check();await waitTotal(page,179);
    const opening=page.getByRole('group',{name:'Размеры проёма',exact:true});
    const widthInput=opening.getByRole('textbox',{name:'Ширина проёма, м',exact:true});
    const widthSlider=opening.getByRole('slider',{name:'Ширина проёма, м',exact:true});
    const heightInput=opening.getByRole('textbox',{name:'Высота проёма, м',exact:true});
    const offsetInput=opening.getByRole('textbox',{name:'Отступ от левого края, м',exact:true});
    const offsetSlider=opening.getByRole('slider',{name:'Отступ от левого края, м',exact:true});
    assert.equal(await widthSlider.getAttribute('max'),'6.5');
    await widthInput.fill('4');await waitTotal(page,176);assert.equal(await widthSlider.inputValue(),'4');
    await widthSlider.focus();await page.keyboard.press('ArrowRight');await waitTotal(page,175.7);
    assert.equal(await widthInput.inputValue(),'4,1');await page.keyboard.press('ArrowLeft');await waitTotal(page,176);
    await heightInput.fill('2');await waitTotal(page,180);
    await offsetInput.fill('1,5');assert.equal(await offsetSlider.inputValue(),'1.5');
    await offsetSlider.press('Home');
    await page.waitForFunction(()=>document.querySelectorAll('.opening-sliders input[type=text]')[2]?.value==='0');
    await offsetSlider.press('End');
    await page.waitForFunction(()=>document.querySelectorAll('.opening-sliders input[type=text]')[2]?.value==='6');
    assert.equal(await widthSlider.getAttribute('max'),'4');
    const rect=await widthSlider.boundingBox();await page.mouse.click(rect.x+rect.width*.35,rect.y+rect.height/2);
    const chosen=Number(await widthSlider.inputValue());assert.ok(chosen>0.1&&chosen<4);
    await waitTotal(page,Number((188-chosen*2).toFixed(2)));
    await widthInput.fill('20');await page.locator('.input-error').waitFor();
    await widthInput.fill('3');await heightInput.fill('3');await offsetInput.fill('3,5');await waitTotal(page,179);
    assert.equal(await page.locator('.input-error').count(),0);
    const pending=page.waitForEvent('download');await page.getByRole('button',{name:'Сохранить JSON'}).click();
    const savedPath=path.join(output,'opening-sliders.json');await(await pending).saveAs(savedPath);
    const saved=JSON.parse(await readFile(savedPath,'utf8'));assert.deepEqual(saved.opening,{enabled:true,width:3,height:3,offset:3.5});
    await widthInput.fill('4');await page.locator('input[type=file]').setInputFiles(savedPath);await waitTotal(page,179);
    assert.equal(await widthSlider.inputValue(),'3');assert.equal(await offsetSlider.inputValue(),'3.5');
    await page.getByLabel('Проём в передней стороне',{exact:true}).uncheck();await waitTotal(page,188);
    assert.equal(await page.locator('.opening-sliders').count(),0);
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
    await fallback.getByRole('textbox',{name:'Максимальный шаг секций, м',exact:true}).fill('2');
    await fallback.getByRole('slider',{name:'Слои заполнения',exact:true}).focus();
    await fallback.keyboard.press('ArrowRight'); await waitTotal(fallback,656);
    await fallback.close();
  });
  await check('API rejects removed piles and a canopy without its mandatory roof before saving a lead', async () => {
    const require=createRequire(import.meta.url);
    const {defaultInput}=require('../.local/runtime/lib/configuration/input.js');
    const {legal}=require('../.local/runtime/config/legal.js');
    for(const [changes,error] of [[{foundation:'pile'},/Сваи без ростверка больше недоступны/],[{contours:[{enabled:true,offset:1,height:5,foundation:'pile'}]},/Сваи без ростверка больше недоступны/],[{shapeId:'C3',roof:false},/Для навеса необходимо включить покрытие/]]) {
      const response=await fetch(base+'/api/leads',{method:'POST',headers:{'content-type':'application/json',origin:base,'idempotency-key':randomUUID()},
        body:JSON.stringify({name:'QA invalid configuration',contact:'qa-invalid@example.invalid',region:'',comment:'',website:'',consent:true,consentVersion:legal.consentVersion,configuration:{...structuredClone(defaultInput),...changes}})});
      assert.equal(response.status,400);
      const body=await response.json();assert.match(body.error,error);assert.equal(body.id,undefined);
    }
  });
  assert.deepEqual(report.errors, []);
} catch (error) { report.failure = error.stack; console.error(error.stack); process.exitCode = 1; }
finally { await browser.close(); await writeFile(path.join(output, 'report.json'), JSON.stringify(report, null, 2)); }
