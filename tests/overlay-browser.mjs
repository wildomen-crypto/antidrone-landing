import assert from 'node:assert/strict';
import {mkdir, readFile, writeFile} from 'node:fs/promises';
import path from 'node:path';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE??'file:///C:/Users/Student/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs');
const base=process.env.QA_URL??'http://127.0.0.1:3100';
assert.ok(['127.0.0.1','localhost'].includes(new URL(base).hostname));
const output=path.resolve('.local/qa/overlay');await mkdir(output,{recursive:true});
const report={checks:[],errors:[],sizes:[]};
const browser=await chromium.launch({channel:process.env.PLAYWRIGHT_CHANNEL??'msedge',headless:true});
const frame=page=>page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
const overlap=(a,b)=>a.x<b.x+b.width&&a.x+a.width>b.x&&a.y<b.y+b.height&&a.y+a.height>b.y;
async function check(name,fn){await fn();report.checks.push(name);console.log('PASS '+name);}
async function metrics(page){return page.locator('.calculator').evaluate(root=>{
  const selectors=['.viewer','.dimension-panel','.parameter-panel','.shape-picker','.material-picker','.service-picker','.dimension-slider','.compact-options','.gallery-variants'];
  return selectors.flatMap(selector=>[...root.querySelectorAll(selector)].map(el=>{const r=el.getBoundingClientRect(),s=getComputedStyle(el);return {selector,x:r.x,y:r.y,w:r.width,h:r.height,position:s.position,grid:s.gridTemplateColumns,opening:!!el.closest('.opening-sliders')};}));
});}
async function scene(page){await page.locator('.viewer').evaluate(el=>el.scrollIntoView({block:'center'}));await page.locator('.viewer canvas').waitFor();await frame(page);}
try{
 const page=await browser.newPage({reducedMotion:'reduce'});page.on('pageerror',e=>report.errors.push(e.message));
 await check('Overlay from 768 px; bounded panels, usable view toolbar, no horizontal clipping',async()=>{
  for(const [width,height] of [[768,1024],[800,900],[1024,768],[1279,900],[1280,800],[1920,1080],[2560,1440],[844,390]]){
   await page.setViewportSize({width,height});await page.goto(base+'/#calculator',{waitUntil:'networkidle'});await scene(page);
   const viewer=await page.locator('.viewer').boundingBox(),toolbar=await page.locator('.scene-view-controls').boundingBox();
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
   for(const selector of ['.dimension-panel','.parameter-panel']){
    const panel=await page.locator(selector).boundingBox();assert.equal(panel.width,190);assert.ok(overlap(viewer,panel));
    assert.ok(panel.y>=viewer.y&&panel.y+panel.height<=viewer.y+viewer.height+1);assert.equal(overlap(toolbar,panel),false);
    assert.equal(await page.locator(selector).evaluate(el=>el.scrollWidth>el.clientWidth+1),false);
   }
   assert.ok(toolbar.y>=viewer.y&&toolbar.y+toolbar.height<=viewer.y+viewer.height);
   report.sizes.push({width,height,sceneHeight:viewer.height});
   if([800,1024,1920].includes(width))await page.screenshot({path:path.join(output,'overlay-'+width+'.png')});
  }
 });
 await check('All eight shapes, conditional panels and contour/variant controls remain usable',async()=>{
  for(const width of [768,1024]){
   await page.setViewportSize({width,height:900});
   for(let i=0;i<8;i++){
    await page.locator('.shape-choice').nth(i).click();await frame(page);
    assert.equal(await page.locator('.input-error,.viewer-error').count(),0);
    const viewer=await page.locator('.viewer').boundingBox();assert.ok(overlap(viewer,await page.locator('.dimension-panel').boundingBox()));
    if(await page.locator('.parameter-panel').count()){
     assert.ok(overlap(viewer,await page.locator('.parameter-panel').boundingBox()));
     assert.equal(await page.locator('.parameter-panel').evaluate(el=>el.scrollWidth>el.clientWidth+1),false);
    }
    if(i===2)assert.equal(await page.locator('[data-target=walls]').count(),0);
    if(i===5)await page.getByRole('radio',{name:'Арочная',exact:true}).check();
    if(i===7){await page.locator('.contour-options summary').first().click();await page.getByRole('combobox',{name:'Основание контура',exact:true}).first().selectOption('block');await page.locator('.contour-options summary').first().click();}
   }
  }
 });
 await check('Phone keeps compact columns and dimensions with plain opening controls; medium compact remains unchanged',async()=>{
  for(const [width,height] of [[320,640],[390,844],[600,900],[767,900]]){
   await page.setViewportSize({width,height});
   for(const index of [2,3,5,7]){
    await page.goto(base+'/compact#calculator',{waitUntil:'networkidle'});await page.locator('.shape-choice').nth(index).click();await frame(page);const original=await metrics(page);
    await page.goto(base+'/#calculator',{waitUntil:'networkidle'});await page.locator('.shape-choice').nth(index).click();await frame(page);const current=await metrics(page);
    const layout=items=>items.filter(m=>!m.opening&&m.selector!=='.service-picker').map(({selector,x,w,position,grid})=>({selector,x,w,position,grid}));
    assert.deepEqual(layout(current),layout(original));
    for(const selector of ['.viewer','.dimension-panel'])assert.equal(current.find(m=>m.selector===selector).h,original.find(m=>m.selector===selector).h);
   }
  }
  await page.setViewportSize({width:1024,height:768});await page.goto(base+'/compact#calculator',{waitUntil:'networkidle'});
  const viewer=await page.locator('.viewer').boundingBox();assert.equal(overlap(viewer,await page.locator('.dimension-panel').boundingBox()),false);
 });
 await check('Resize, JSON, keyboard and Canvas camera views preserve real configuration',async()=>{
  await page.goto(base+'/#calculator',{waitUntil:'networkidle'});await scene(page);
  await page.getByRole('textbox',{name:'Длина, м',exact:true}).fill('12');
  const total=await page.locator('.quantity-grid').textContent();
  await page.setViewportSize({width:390,height:844});await frame(page);assert.equal(await page.getByRole('textbox',{name:'Длина, м',exact:true}).inputValue(),'12');
  await page.setViewportSize({width:1024,height:768});await scene(page);
  const pending=page.waitForEvent('download');await page.getByRole('button',{name:'Сохранить JSON',exact:true}).click();const file=path.join(output,'configuration.json');await(await pending).saveAs(file);assert.equal(JSON.parse(await readFile(file,'utf8')).length,12);
  await page.getByRole('textbox',{name:'Длина, м',exact:true}).fill('10');await page.locator('input[type=file]').setInputFiles(file);await page.waitForFunction(()=>document.querySelector('.form-message')?.textContent==='Конфигурация восстановлена.');assert.equal(await page.locator('.quantity-grid').textContent(),total);
  let pixels=await page.locator('.viewer canvas').screenshot();
  for(const label of ['Сверху','Спереди','Сбоку','3D']){const button=page.locator('.scene-view-controls').getByRole('button',{name:label,exact:true});await button.focus();await page.keyboard.press('Enter');await frame(page);const next=await page.locator('.viewer canvas').screenshot();assert.notDeepEqual(next,pixels);pixels=next;}
 });
 await page.close();
 await check('SVG fallback reserves actual medium panels and clears insets on phone',async()=>{
  const fallback=await browser.newPage({viewport:{width:1024,height:768},reducedMotion:'reduce'});fallback.on('pageerror',e=>report.errors.push(e.message));
  await fallback.addInitScript(()=>{const original=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(kind,...args){return /^webgl/.test(kind)?null:original.call(this,kind,...args);};});
  await fallback.goto(base+'/#calculator',{waitUntil:'networkidle'});await fallback.locator('.scene-fallback>svg').waitFor();await frame(fallback);
  const insets=()=>fallback.locator('.scene-fallback').evaluate(el=>{const s=getComputedStyle(el);return [s.paddingLeft,s.paddingRight,s.paddingTop].map(parseFloat);});
  const reserved=await insets();assert.ok(reserved[0]>190&&reserved[1]>190);
  await fallback.setViewportSize({width:390,height:844});await frame(fallback);assert.deepEqual(await insets(),[0,0,0]);await fallback.close();
 });
 assert.deepEqual(report.errors,[]);
}finally{await writeFile(path.join(output,'report.json'),JSON.stringify(report,null,2));await browser.close();}
