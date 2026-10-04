import assert from 'node:assert/strict';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE??'file:///C:/Users/Student/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs');
const base=process.env.QA_URL??'http://127.0.0.1:3100';
assert.ok(['127.0.0.1','localhost'].includes(new URL(base).hostname));
const output=path.resolve('.local/qa/compact-materials');await mkdir(output,{recursive:true});
const report={checks:[],errors:[],sizes:[],date:new Date().toISOString()};
const browser=await chromium.launch({channel:process.env.PLAYWRIGHT_CHANNEL??'msedge',headless:true});
const monitor=page=>page.on('pageerror',error=>report.errors.push(error.message));
const total=page=>page.locator('.quantity-grid strong').first();
const waitTotal=(page,value)=>page.waitForFunction(value=>Number(document.querySelector('.quantity-grid strong')?.textContent.replace(/[^\d,.]/g,'').replace(',','.'))===value,value);
const wallRow=page=>page.locator('[data-target="walls"]');const roofRow=page=>page.locator('[data-target="roof"]');
async function check(name,fn){await fn();report.checks.push(name);console.log('PASS '+name);}
async function scene(page){await page.locator('.shape-picker').evaluate(el=>el.scrollIntoView({block:'start'}));await page.locator('.viewer canvas').waitFor();await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));}
try{
  await check('Seven widths: responsive scene and panels, compact desktop rows, works below roof, no overflow',async()=>{
    const page=await browser.newPage({viewport:{width:1440,height:1000},reducedMotion:'reduce'});monitor(page);
    for(const width of [360,390,510,768,900,1280,1440]){
      await page.setViewportSize({width,height:1000});await page.goto(base+'/wide#calculator',{waitUntil:'networkidle'});
      const wideHeight=(await page.locator('.viewer').boundingBox()).height;
      const before=await page.locator('.material-picker[data-target]').evaluateAll(rows=>rows.map(el=>el.getBoundingClientRect().height));
      await page.goto(base+'/compact#calculator',{waitUntil:'networkidle'});await scene(page);
      const viewer=await page.locator('.viewer').boundingBox();assert.ok(viewer.height>=wideHeight);
      const container=await page.locator('#calculator>.container').first().boundingBox();assert.ok(Math.abs(viewer.width-container.width)<=2);
      const panel=await page.locator('.parameter-panel').boundingBox();
      if(width>=1280)assert.ok(panel.y>=viewer.y&&panel.y+panel.height<=viewer.y+viewer.height);
      else assert.ok(panel.y>=viewer.y+viewer.height);
      assert.equal(await page.locator('.calculator-compact').count(),1);
      const after=await page.locator('.material-picker[data-target]').evaluateAll(rows=>rows.map(el=>el.getBoundingClientRect().height));
      if(width>=768&&width<1280)for(let i=0;i<2;i++)assert.ok(after[i]<before[i]*.75,'Medium row reduced by at least 25% at '+width);
      report.sizes.push({width,wide:before,compact:after});
      for(const row of [wallRow(page),roofRow(page)]){
        assert.equal(await row.locator('.material-choice').count(),8);
        assert.equal(await row.locator('.material-choice').nth(6).getAttribute('aria-pressed'),'true');
        const image=await row.locator('.material-choice-image').first().boundingBox();assert.equal(image.height,width>=1280?65:32);
      }
      const roof=await roofRow(page).boundingBox(),works=await page.locator('.service-picker').boundingBox(),structure=await page.locator('.structure-picker').boundingBox();
      assert.ok(works.y>=roof.y+roof.height-1);assert.ok(structure.y>=works.y+works.height-1);
      assert.equal(await page.locator('.service-picker input[type=checkbox]').count(),4);
      assert.equal(await page.locator('.parameter-panel').getByRole('checkbox',{name:'Проектирование',exact:true}).count(),0);
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
      await waitTotal(page,188);
      if([390,768,1440].includes(width))await page.screenshot({path:path.join(output,'compact-'+width+'.png')});
    }
    await page.close();
  });
  const page=await browser.newPage({viewport:{width:1440,height:1100},reducedMotion:'reduce'});monitor(page);
  await page.goto(base+'/compact#calculator',{waitUntil:'networkidle'});
  await check('Right panel disappears only when empty; combination brings it back and updates camera',async()=>{
    for(let i=0;i<8;i++){
      await page.locator('.shape-choice').nth(i).click();
      assert.equal(await page.locator('.parameter-panel').count(),[2,6].includes(i)?0:1,'shape C'+(i+1));
      assert.equal(await page.locator('.service-picker input[type=checkbox]').count(),4);
      assert.equal(await page.locator('.input-error').count(),0);
    }
    await page.locator('.shape-choice').nth(6).click();await scene(page);
    await page.screenshot({path:path.join(output,'round-no-right-panel.png')});
    await roofRow(page).locator('.material-choice').nth(7).click();
    await page.getByRole('combobox',{name:'Материал слоя 1',exact:true}).waitFor();assert.equal(await page.locator('.parameter-panel').count(),1);
    await roofRow(page).locator('.material-choice').nth(7).click();await page.waitForFunction(()=>!document.querySelector('.parameter-panel'));
    await wallRow(page).locator('.material-choice').nth(7).click();assert.equal(await page.locator('.parameter-panel').count(),1);
    await wallRow(page).locator('.material-choice').nth(7).click();await waitTotal(page,0);
    assert.equal(await page.locator('.parameter-panel').count(),0);assert.equal(await page.getByRole('button',{name:'Сохранить JSON'}).isEnabled(),true);
    await page.locator('.shape-choice').nth(2).click();await waitTotal(page,120);assert.equal(await page.locator('.parameter-panel').count(),1);
    await roofRow(page).locator('.material-choice').nth(6).click();await waitTotal(page,60);assert.equal(await page.locator('.parameter-panel').count(),0);
    await scene(page);await page.screenshot({path:path.join(output,'canopy-no-right-panel.png')});
  });
  await check('Materials, wall toggle, openings, works and JSON keep their shared behavior; print omits selectors',async()=>{
    await page.reload({waitUntil:'networkidle'});await waitTotal(page,188);
    assert.equal(await page.locator('.calculator').getAttribute('data-shape'),'C4');
    await wallRow(page).locator('.material-choice').nth(6).click();await waitTotal(page,60);
    assert.equal(await page.locator('.parameter-panel').count(),0);
    await wallRow(page).locator('.material-choice').nth(5).click();await waitTotal(page,188);assert.equal(await page.locator('.parameter-panel').count(),1);
    await page.getByRole('textbox',{name:'Длина, м',exact:true}).fill('20');await waitTotal(page,328);
    await page.getByLabel('Проём в передней стороне',{exact:true}).check();await waitTotal(page,319);
    const works=page.locator('.service-picker');await works.getByLabel('Доставка',{exact:true}).check();await works.getByLabel('Монтаж',{exact:true}).check();await works.getByLabel('Проектирование',{exact:true}).uncheck();
    const pending=page.waitForEvent('download');await page.getByRole('button',{name:'Сохранить JSON'}).click();
    const savedPath=path.join(output,'compact.json');await(await pending).saveAs(savedPath);const saved=JSON.parse(await readFile(savedPath,'utf8'));
    assert.equal(saved.materialId,'M6');assert.equal(saved.roofMaterialId,'M7');assert.equal(saved.walls,true);assert.equal(saved.length,20);assert.equal(saved.opening.enabled,true);
    assert.deepEqual(saved.services,['manufacturing','delivery','installation']);
    await works.getByLabel('Доставка',{exact:true}).uncheck();await page.getByRole('textbox',{name:'Длина, м',exact:true}).fill('10');
    await page.locator('input[type=file]').setInputFiles(savedPath);await waitTotal(page,319);assert.equal(await works.getByLabel('Доставка',{exact:true}).isChecked(),true);
    await page.emulateMedia({media:'print'});assert.equal(await page.locator('.service-picker').isVisible(),false);assert.equal(await page.locator('.print-card').isVisible(),true);
    assert.match(await page.locator('.print-card').textContent(),/Изготовление, Доставка, Монтаж/);await page.pdf({path:path.join(output,'compact-print.pdf'),format:'A4'});await page.emulateMedia({media:'screen'});
  });
  await check('Mobile complex enclosure preserves sliders and separate work selection',async()=>{
    await page.setViewportSize({width:390,height:1000});await page.locator('.shape-choice').nth(7).click();
    assert.equal(await page.locator('.contour-sliders input[type=range]').count(),6);
    const first=page.locator('.contour-inputs fieldset').first();await first.getByRole('textbox',{name:'Высота, м',exact:true}).fill('5,2');
    await page.waitForFunction(()=>document.querySelectorAll('.contour-sliders input[type=range]')[1].value==='5.2');
    assert.equal(await page.locator('.input-error').count(),0);await scene(page);await page.screenshot({path:path.join(output,'compact-c8-mobile.png')});
    await wallRow(page).locator('.material-choice[aria-pressed=true]').click();
    await page.waitForFunction(()=>[...document.querySelectorAll('.estimate-result tr')].find(row=>row.textContent.startsWith('Стены'))?.children[1]?.textContent==='0 м²');
    assert.equal(await page.locator('.parameter-panel').count(),1);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
    await page.close();
  });
  await check('No-WebGL compact fallback reclaims space when panel disappears',async()=>{
    const fallback=await browser.newPage({viewport:{width:390,height:1000},reducedMotion:'reduce'});monitor(fallback);
    await fallback.addInitScript(()=>{const original=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(kind,...args){return /^webgl/.test(kind)?null:original.call(this,kind,...args);};});
    await fallback.goto(base+'/compact#calculator',{waitUntil:'networkidle'});await fallback.locator('.shape-choice').nth(6).click();await fallback.locator('.scene-fallback>svg').waitFor();
    await fallback.waitForFunction(()=>getComputedStyle(document.querySelector('.scene-fallback')).paddingRight==='0px');assert.equal(await fallback.locator('.parameter-panel').count(),0);
    await roofRow(fallback).locator('.material-choice').nth(7).click();await fallback.locator('.parameter-panel').waitFor();
    await fallback.waitForFunction(()=>getComputedStyle(document.querySelector('.scene-fallback')).paddingRight==='0px');
    await fallback.setViewportSize({width:1440,height:1000});
    await fallback.waitForFunction(()=>parseFloat(getComputedStyle(document.querySelector('.scene-fallback')).paddingRight)>0);
    await fallback.setViewportSize({width:390,height:1000});
    await fallback.waitForFunction(()=>getComputedStyle(document.querySelector('.scene-fallback')).paddingRight==='0px');
    await roofRow(fallback).locator('.material-choice').nth(7).click();await fallback.waitForFunction(()=>getComputedStyle(document.querySelector('.scene-fallback')).paddingRight==='0px');
    await fallback.locator('.scene-fallback>svg').waitFor();assert.equal(await fallback.locator('.input-error').count(),0);await fallback.close();
  });
  assert.deepEqual(report.errors,[]);
}catch(error){report.failure=error.stack;console.error(error.stack);process.exitCode=1;}
finally{await browser.close();await writeFile(path.join(output,'report.json'),JSON.stringify(report,null,2));}
