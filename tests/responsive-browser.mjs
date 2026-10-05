import assert from 'node:assert/strict';
import {mkdir, writeFile, readFile} from 'node:fs/promises';
import path from 'node:path';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE??'file:///C:/Users/Student/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs');
const base=process.env.QA_URL??'http://127.0.0.1:3100';
assert.ok(['127.0.0.1','localhost'].includes(new URL(base).hostname));
const output=path.resolve('.local/qa/responsive');await mkdir(output,{recursive:true});
const report={checks:[],errors:[],viewports:[],date:new Date().toISOString()};
const browser=await chromium.launch({channel:process.env.PLAYWRIGHT_CHANNEL??'msedge',headless:true});
const monitor=page=>page.on('pageerror',error=>report.errors.push(error.message));
const frame=page=>page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
const intersects=(a,b)=>a.x<b.x+b.width&&a.x+a.width>b.x&&a.y<b.y+b.height&&a.y+a.height>b.y;
async function check(name,fn){await fn();report.checks.push(name);console.log('PASS '+name);}
async function noOverflow(page){assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);}
async function show(page){
  await page.locator('.viewer').evaluate(el=>el.scrollIntoView({block:'start'}));
  try{await page.locator('.viewer canvas').waitFor();}catch(error){
    throw new Error('3D missing at '+JSON.stringify(page.viewportSize())+' / '+await page.locator('.calculator').getAttribute('data-shape')+' / '+await page.locator('.viewer').innerHTML(),{cause:error});
  }
  await frame(page);
}
async function clearScene(page){
  const scene=await page.locator('.viewer').boundingBox();
  for(const selector of ['.dimension-panel','.parameter-panel']){
    if(await page.locator(selector).count())assert.equal(intersects(scene,await page.locator(selector).boundingBox()),false,'Scene is clear of '+selector);
  }
}
try{
  await check('Twelve sizes: full landing, usable scene, readable inputs, no clipped controls or page overflow',async()=>{
    const page=await browser.newPage({reducedMotion:'reduce'});monitor(page);
    for(const [width,height] of [[320,640],[360,740],[390,844],[600,900],[768,1024],[1024,768],[1279,900],[1280,800],[1440,900],[1920,1080],[2560,1440],[844,390]]){
      await page.setViewportSize({width,height});await page.goto(base+'/compact',{waitUntil:'networkidle'});await noOverflow(page);
      const header=await page.locator('.header-inner').boundingBox(),hero=await page.locator('.hero').boundingBox();
      assert.ok(hero.y>=header.y+header.height);
      assert.equal(await page.locator('.header-phone').isVisible(),true);
      assert.equal(await page.locator('.hero h1').evaluate(el=>el.scrollWidth<=el.clientWidth),true);
      if([390,1024,1920].includes(width))await page.screenshot({path:path.join(output,'hero-'+width+'.png')});
      await show(page);
      const scene=await page.locator('.viewer').boundingBox();
      const container=await page.locator('#calculator>.container').first().boundingBox();
      assert.ok(Math.abs(scene.width-container.width)<=2);assert.ok(Math.abs(scene.x-container.x)<=1);assert.ok(scene.height>=300);
      const overlay=width>=1280&&height>650;
      if(!overlay)await clearScene(page);
      else{
        for(const selector of ['.dimension-panel','.parameter-panel']){
          const panel=await page.locator(selector).boundingBox();assert.ok(intersects(scene,panel));assert.ok(panel.y+panel.height<=scene.y+scene.height+1);
        }
      }
      const nav=await page.locator('.scene-view-controls').boundingBox();
      assert.ok(nav.x>=scene.x&&nav.x+nav.width<=scene.x+scene.width&&nav.y>=scene.y&&nav.y+nav.height<=scene.y+scene.height);
      assert.equal(await page.locator('.calculator-compact .viewer-controls').count(),0);
      for(const selector of ['.dimension-panel','.parameter-panel']){
        if(await page.locator(selector).count())assert.equal(intersects(nav,await page.locator(selector).boundingBox()),false);
      }
      for(const selector of ['.shape-choice','.material-choice','.compact-option','.scene-view-controls button','.service-picker .check-field','.dimension-exact input','.dimension-slider>input[type=range]']){
        const sizes=await page.locator(selector).evaluateAll(els=>els.map(el=>({w:el.getBoundingClientRect().width,h:el.getBoundingClientRect().height})));
        const min=selector.includes('range')?18:selector.includes('dimension-exact')?26:selector==='.compact-option'||selector.includes('scene-view')?32:44;
        if(width<768)for(const {w,h} of sizes)assert.ok(w>=min&&h>=min,selector+' compact touch target');
      }
      if(!overlay){
        assert.equal(await page.locator('.dimension-exact input').first().evaluate(el=>getComputedStyle(el).fontSize),'16px');
        assert.equal(await page.locator('.dimension-slider-head>label:first-child').evaluateAll(els=>els.every(el=>el.scrollWidth<=el.clientWidth+1)),true);
      }
      const cardLayout=await page.locator('[data-target=walls] .material-choice').evaluateAll(els=>els.map(el=>({x:el.getBoundingClientRect().x,y:el.getBoundingClientRect().y,w:el.getBoundingClientRect().width})));
      if(width<768)for(const card of cardLayout)assert.ok(card.x>=0&&card.x+card.w<=width+1,'All phone materials visible without horizontal scrolling');
      const shapes=await page.locator('.shape-picker').boundingBox();
      const shapeCards=await page.locator('.shape-choice').evaluateAll(els=>els.map(el=>({x:el.getBoundingClientRect().x,y:el.getBoundingClientRect().y,w:el.getBoundingClientRect().width})));
      assert.equal(shapeCards.length,8);
      for(const card of shapeCards)assert.ok(card.x>=shapes.x&&card.x+card.w<=shapes.x+shapes.width+1,'All construction types visible without horizontal scrolling');
      assert.equal(await page.locator('.shape-picker').evaluate(el=>el.scrollWidth<=el.clientWidth+1),true);
      assert.equal(await page.locator('.shape-choice-name').evaluateAll(els=>els.every(el=>el.scrollWidth<=el.clientWidth+1&&el.scrollHeight<=el.clientHeight+1)),true,'Construction names are not clipped');
      const shapeRows=new Set(shapeCards.map(card=>Math.round(card.y))).size;
      assert.equal(shapeRows,new Set(cardLayout.map(card=>Math.round(card.y))).size,'Construction and wall choices wrap into the same number of rows');
      assert.equal((await page.locator('.shape-choice-image').first().boundingBox()).height,width>=1280?76:32);
      const order=await page.locator('.calculator-output').evaluate(el=>[...el.children].filter(child=>child.matches('.material-picker,.service-picker')).map(child=>child.classList.contains('structure-picker')?'structure':child.classList.contains('service-picker')?'works':child.getAttribute('data-target')));
      assert.deepEqual(order,['structure','walls','roof','works']);
      if(!overlay){
        const icons=await page.locator('.compact-options').evaluate(el=>({available:el.clientWidth,groups:[...el.querySelectorAll('.compact-option-group')].map(group=>({y:group.getBoundingClientRect().y,w:group.getBoundingClientRect().width}))}));
        if(icons.groups.reduce((sum,group)=>sum+group.w,0)+8*(icons.groups.length-1)<=icons.available+1)
          assert.equal(new Set(icons.groups.map(group=>Math.round(group.y))).size,1,'Option groups fit on one line and must not waste another row');
      }
      await noOverflow(page);
      report.viewports.push({width,height,mode:overlay?'large':width>=768?'medium':'phone',sceneHeight:scene.height,sceneWidth:scene.width,containerWidth:container.width,shapeRows,shapePickerHeight:shapes.height});
      if([390,1024,1920].includes(width)){
        await page.locator('.shape-picker').evaluate(el=>el.scrollIntoView({block:'start'}));await frame(page);
        await page.screenshot({path:path.join(output,'calculator-'+width+'.png')});
        await page.locator('#calculator').screenshot({path:path.join(output,'calculator-full-'+width+'.png')});
      }
      await page.locator('#contacts').scrollIntoViewIfNeeded();await noOverflow(page);
      assert.equal(await page.locator('.lead-form .field input').first().evaluate(el=>getComputedStyle(el).fontSize),width<768?'16px':'13px');
      if(width===390)await page.screenshot({path:path.join(output,'contacts-phone.png')});
    }
    await page.close();
  });
  await check('All eight constructions on phone, medium and large; extra materials and contours accessible',async()=>{
    for(const [width,height] of [[390,844],[1024,768],[1920,1080]]){
      const page=await browser.newPage({viewport:{width,height},reducedMotion:'reduce'});monitor(page);
      await page.goto(base+'/compact#calculator',{waitUntil:'networkidle'});
      for(let i=0;i<8;i++){
        await page.locator('.shape-choice').nth(i).click();await show(page);await noOverflow(page);
        assert.equal(await page.locator('.input-error,.viewer-error').count(),0);
        if(width<1280)await clearScene(page);
        if(width===390)await page.locator('.viewer').screenshot({path:path.join(output,'phone-C'+(i+1)+'.png')});
      }
      await page.locator('.contour-options').first().getByText('Материалы и конструкция контура',{exact:true}).click();
      await page.getByRole('combobox',{name:'Основание контура',exact:true}).first().selectOption('pile-cap');
      await page.locator('.contour-inputs fieldset').first().getByRole('textbox',{name:'Высота, м',exact:true}).fill('5,2');
      await page.waitForFunction(()=>document.querySelectorAll('.contour-sliders input[type=range]')[1].value==='5.2');
      await noOverflow(page);
      const panel=page.locator('.parameter-panel');
      if(width<1280)assert.equal(await panel.locator('.calculator-inputs').evaluate(el=>el.scrollHeight<=el.clientHeight+1),true,'No nested scroll on medium/phone');
      else assert.ok((await panel.boundingBox()).height<(await page.locator('.viewer').boundingBox()).height);
      if(width===390){await panel.evaluate(el=>el.scrollIntoView({block:'start'}));await frame(page);await page.screenshot({path:path.join(output,'complex-phone.png')});}
      await page.locator('.shape-choice').nth(6).click();
      await page.locator('[data-target=roof] .material-choice').nth(7).click();
      await page.getByRole('combobox',{name:'Материал слоя 1',exact:true}).selectOption('M4');
      if(width<1280)await clearScene(page);
      await page.locator('[data-target=roof] .material-choice').nth(7).click();
      assert.equal(await page.locator('.parameter-panel').count(),0);
      await page.close();
    }
  });
  await check('Default front opening changes real quantities; disabling and JSON import remain explicit; shape changes stay valid',async()=>{
    const page=await browser.newPage({viewport:{width:1024,height:768},reducedMotion:'reduce'});monitor(page);
    await page.goto(base+'/compact#calculator',{waitUntil:'networkidle'});
    const opening=page.getByRole('checkbox',{name:'Проём в передней стороне',exact:true});
    assert.equal(await opening.isChecked(),true);
    const total=()=>page.locator('.quantity-grid strong').first().textContent();
    assert.equal(await total(),'179 м²');
    await opening.uncheck();assert.equal(await total(),'188 м²');
    const pending=page.waitForEvent('download');await page.getByRole('button',{name:'Сохранить JSON',exact:true}).click();
    const savedPath=path.join(output,'opening-disabled.json');await(await pending).saveAs(savedPath);
    assert.equal(JSON.parse(await readFile(savedPath,'utf8')).opening.enabled,false);
    await opening.check();assert.equal(await total(),'179 м²');
    await page.locator('input[type=file]').setInputFiles(savedPath);
    await page.waitForFunction(()=>document.querySelector('.form-message')?.textContent==='Конфигурация восстановлена.');
    assert.equal(await opening.isChecked(),false);assert.equal(await total(),'188 м²');
    for(const index of [0,1,3,4]){
      await page.locator('.shape-choice').nth(index).click();assert.equal(await opening.isChecked(),true);
      assert.equal(await page.locator('.input-error,.viewer-error').count(),0);
    }
    await page.locator('.shape-choice').nth(2).click();assert.equal(await opening.count(),0);
    await page.evaluate(()=>window.dispatchEvent(new CustomEvent('choose-shape',{detail:'C4'})));
    assert.equal(await opening.isChecked(),true);
    await opening.uncheck();await page.getByRole('textbox',{name:'Длина, м',exact:true}).fill('2');
    await page.locator('.shape-choice').nth(0).click();assert.equal(await opening.isChecked(),false);
    assert.equal(await page.locator('.input-error,.viewer-error').count(),0);
    await page.close();
  });
  await check('Desktop pictures restored; narrow dimensions no taller than desktop, openings and contours compact',async()=>{
    const page=await browser.newPage({viewport:{width:1920,height:1080},reducedMotion:'reduce'});monitor(page);
    await page.goto(base+'/compact#calculator',{waitUntil:'networkidle'});
    const desktopHeight=(await page.locator('.dimension-panel').boundingBox()).height;
    report.controlHeights=[];
    for(const width of [1920,1280,1100,1024,768,600,390,360,320]){
      await page.setViewportSize({width,height:1080});await frame(page);
      await page.getByRole('checkbox',{name:'Проём в передней стороне',exact:true}).check();
      const dimensions=(await page.locator('.dimension-panel').boundingBox()).height;
      if(width<1280)assert.ok(dimensions<=desktopHeight+10,'Dimensions must remain as compact as desktop at '+width);
      const opening=(await page.locator('.opening-sliders').boundingBox()).height;
      if(width<1280)assert.ok(opening<=160,'Three opening sliders occupy <=160 px');
      const imageHeight=(await page.locator('[data-target=walls] .material-choice-image').first().boundingBox()).height;
      assert.equal(imageHeight,width>=1280?65:32);
      if(width>=1280)assert.equal((await page.locator('.shape-choice-image').first().boundingBox()).height,76);
      report.controlHeights.push({width,dimensions,opening,imageHeight});
      await noOverflow(page);
      if([1920,1100,390].includes(width)){
        await page.locator('.dimension-panel').evaluate(el=>el.scrollIntoView({block:'start'}));await page.screenshot({path:path.join(output,'dense-settings-'+width+'.png')});
      }
    }
    await page.locator('.shape-choice').nth(7).click();
    for(const width of [320,390,768,1100]){
      await page.setViewportSize({width,height:1080});await frame(page);
      for(const box of await page.locator('.contour-sliders').evaluateAll(els=>els.map(el=>el.getBoundingClientRect().height)))assert.ok(box<=65,'Contour sliders remain low');
      await noOverflow(page);
    }
    await page.close();
  });
  await check('Resize preserves configuration; keyboard sliders, openings, views, support choices, JSON and lead attachment',async()=>{
    const page=await browser.newPage({viewport:{width:1920,height:1080},reducedMotion:'reduce'});monitor(page);
    await page.goto(base+'/compact#calculator',{waitUntil:'networkidle'});
    await page.getByRole('textbox',{name:'Длина, м',exact:true}).fill('12,5');
    await page.getByRole('slider',{name:'Максимальный шаг секций, м',exact:true}).focus();await page.keyboard.press('ArrowRight');
    await page.getByRole('slider',{name:'Слои заполнения',exact:true}).focus();await page.keyboard.press('ArrowRight');
    await page.setViewportSize({width:390,height:844});await frame(page);await clearScene(page);
    assert.equal(await page.getByRole('textbox',{name:'Длина, м',exact:true}).inputValue(),'12,5');
    assert.equal(await page.getByRole('slider',{name:'Слои заполнения',exact:true}).inputValue(),'2');
    await page.getByRole('button',{name:'Круглая труба',exact:true}).click();
    await page.getByRole('button',{name:'Сваи с ростверком',exact:true}).click();
    await page.getByRole('checkbox',{name:'Проём в передней стороне',exact:true}).check();
    await page.getByRole('textbox',{name:'Ширина проёма, м',exact:true}).fill('2,5');
    for(const label of ['Сверху','Спереди','Сбоку','3D']){
      const button=page.locator('.scene-view-controls').getByRole('button',{name:label,exact:true});await button.click();assert.equal(await button.getAttribute('aria-pressed'),'true');
    }
    await page.locator('.structure-choice[data-system=spatial-column]').click();await page.locator('.structure-choice[data-system=spatial-truss]').click();
    await page.locator('.service-picker').getByLabel('Монтаж',{exact:true}).check();
    await page.setViewportSize({width:1024,height:768});await frame(page);await clearScene(page);
    assert.equal(await page.getByRole('checkbox',{name:'Проём в передней стороне',exact:true}).isChecked(),true);
    const pending=page.waitForEvent('download');await page.getByRole('button',{name:'Сохранить JSON',exact:true}).click();
    const savedPath=path.join(output,'resized.json');await(await pending).saveAs(savedPath);const saved=JSON.parse(await readFile(savedPath,'utf8'));
    assert.equal(saved.length,12.5);assert.equal(saved.step,3.1);assert.equal(saved.layers,2);assert.equal(saved.sectionType,'round');assert.equal(saved.foundation,'pile-cap');
    assert.equal(saved.opening.width,2.5);assert.equal(saved.structuralSystem,'spatial-truss');assert.equal(saved.spatialSupports,true);assert.ok(saved.services.includes('installation'));
    await page.getByRole('button',{name:'Получить расчёт',exact:false}).click();await page.locator('.attached-config').waitFor();await noOverflow(page);
    await page.setViewportSize({width:390,height:844});
    await page.getByRole('textbox',{name:'Как к вам обращаться',exact:true}).fill('Проверка адаптивности');
    await page.getByRole('textbox',{name:'Как к вам обращаться',exact:true}).focus();
    assert.equal(await page.getByRole('textbox',{name:'Как к вам обращаться',exact:true}).evaluate(el=>document.activeElement===el),true);
    assert.equal(await page.locator('.mobile-actions').isVisible(),false,'Floating actions leave room while typing');
    await page.getByRole('textbox',{name:'Как к вам обращаться',exact:true}).evaluate(el=>el.scrollIntoView({block:'center'}));
    const focused=await page.getByRole('textbox',{name:'Как к вам обращаться',exact:true}).boundingBox();
    assert.ok(focused.y>(await page.locator('.site-header').boundingBox()).height&&focused.y+focused.height<844);
    await page.getByRole('textbox',{name:'Как к вам обращаться',exact:true}).blur();
    assert.equal(await page.locator('.mobile-actions').isVisible(),true);
    await page.close();
  });
  await check('SVG camera space follows actual panel overlap across breakpoints and short windows',async()=>{
    const page=await browser.newPage({viewport:{width:1920,height:1080},reducedMotion:'reduce'});monitor(page);
    await page.addInitScript(()=>{const original=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(kind,...args){return /^webgl/.test(kind)?null:original.call(this,kind,...args);};});
    await page.goto(base+'/compact#calculator',{waitUntil:'networkidle'});await page.locator('.scene-fallback>svg').waitFor();
    for(const [width,height,overlay] of [[1920,1080,true],[1024,768,false],[390,844,false],[1440,600,false],[1920,1080,true]]){
      await page.setViewportSize({width,height});
      await page.waitForFunction(overlay=>{const style=getComputedStyle(document.querySelector('.scene-fallback'));return overlay?parseFloat(style.paddingRight)>0:style.paddingRight==='0px'&&style.paddingLeft==='0px'&&style.paddingTop==='0px';},overlay);
      await noOverflow(page);
      if(!overlay)await clearScene(page);
    }
    await page.emulateMedia({media:'print'});assert.equal(await page.locator('.viewer-stage').isVisible(),false);assert.equal(await page.locator('.print-card').isVisible(),true);
    await page.close();
  });
  await check('Scene icons select camera views and frame with keyboard, without changing quantities; SVG works too',async()=>{
    const page=await browser.newPage({viewport:{width:1440,height:900},reducedMotion:'reduce'});monitor(page);
    await page.goto(base+'/compact#calculator',{waitUntil:'networkidle'});await show(page);
    const toolbar=page.locator('.scene-view-controls');assert.equal(await toolbar.getByRole('button').count(),5);
    for(const size of await toolbar.locator('svg').evaluateAll(els=>els.map(el=>({width:el.getBoundingClientRect().width,height:el.getBoundingClientRect().height})))){
      assert.equal(size.width,20);assert.equal(size.height,20);
    }
    const quantity=await page.locator('.quantity-grid').textContent();
    let pixels=await page.locator('.viewer canvas').screenshot();
    for(const label of ['Сверху','Спереди','Сбоку','3D']){
      const button=toolbar.getByRole('button',{name:label,exact:true});await button.focus();await page.keyboard.press('Enter');await frame(page);
      assert.equal(await button.getAttribute('aria-pressed'),'true');
      assert.equal(await toolbar.locator('button[aria-pressed=true]:not(.scene-frame-toggle)').count(),1);
      const next=await page.locator('.viewer canvas').screenshot();assert.notDeepEqual(next,pixels,'Camera image changes for '+label);pixels=next;
    }
    const frameButton=toolbar.getByRole('button',{name:'Только каркас',exact:true});await frameButton.click();await frame(page);
    assert.equal(await frameButton.getAttribute('aria-pressed'),'true');assert.notDeepEqual(await page.locator('.viewer canvas').screenshot(),pixels);
    assert.equal(await page.locator('.quantity-grid').textContent(),quantity);await frameButton.click();
    await page.setViewportSize({width:390,height:844});await frame(page);await clearScene(page);
    assert.equal(await frameButton.getAttribute('aria-pressed'),'false');assert.equal(await toolbar.getByRole('button',{name:'3D',exact:true}).getAttribute('aria-pressed'),'true');
    await page.close();
    const fallback=await browser.newPage({viewport:{width:390,height:844},reducedMotion:'reduce'});monitor(fallback);
    await fallback.addInitScript(()=>{const original=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(kind,...args){return /^webgl/.test(kind)?null:original.call(this,kind,...args);};});
    await fallback.goto(base+'/compact#calculator',{waitUntil:'networkidle'});await fallback.locator('.scene-fallback>svg').waitFor();
    let svg=await fallback.locator('.scene-fallback>svg').innerHTML();
    for(const label of ['Сверху','Спереди','Сбоку']){
      await fallback.locator('.scene-view-controls').getByRole('button',{name:label,exact:true}).click();await frame(fallback);
      const next=await fallback.locator('.scene-fallback>svg').innerHTML();assert.notEqual(next,svg);svg=next;
    }
    await fallback.locator('.scene-frame-toggle').click();assert.equal(await fallback.locator('.scene-frame-toggle').getAttribute('aria-pressed'),'true');
    assert.equal(await fallback.locator('.quantity-grid').textContent(),quantity);await fallback.close();
  });
  await check('Touch phone: rotate the model, choose filling and move sliders with real touch events',async()=>{
    const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true,reducedMotion:'reduce'});monitor(page);
    await page.goto(base+'/compact#calculator',{waitUntil:'networkidle'});await show(page);await clearScene(page);await noOverflow(page);
    for(const index of [6,3]){
      const shape=page.locator('.shape-choice').nth(index);await shape.evaluate(el=>el.scrollIntoView({block:'center'}));await shape.tap();
      await page.waitForFunction(i=>document.querySelectorAll('.shape-choice')[i].getAttribute('aria-pressed')==='true',index);
    }
    const card=page.locator('[data-target=walls] .material-choice').nth(3);await card.evaluate(el=>el.scrollIntoView({block:'center'}));await card.tap();
    await page.waitForFunction(()=>document.querySelectorAll('[data-target=walls] .material-choice')[3].getAttribute('aria-pressed')==='true');
    const layers=page.getByRole('slider',{name:'Слои заполнения',exact:true});await layers.evaluate(el=>el.scrollIntoView({block:'center'}));await layers.tap();
    await page.waitForFunction(()=>document.querySelector('.dimension-panel input[type=range][max="3"]').value==='2');
    const works=page.locator('.service-picker').getByLabel('Монтаж',{exact:true});await works.evaluate(el=>el.scrollIntoView({block:'center'}));await works.tap();
    await page.waitForFunction(()=>document.querySelectorAll('.service-picker input')[3].checked);
    const topButton=page.locator('.scene-view-controls').getByRole('button',{name:'Сверху',exact:true});await topButton.tap();
    await page.waitForFunction(()=>document.querySelector('.scene-view-controls button[aria-label="Сверху"]').getAttribute('aria-pressed')==='true');
    await page.locator('.scene-view-controls').getByRole('button',{name:'3D',exact:true}).tap();
    // Keep manual CDP gestures after ordinary taps: Chromium suppresses the next
    // synthetic click when these two input injection methods are mixed.
    await show(page);
    const before=await page.locator('.viewer').screenshot();
    const canvas=await page.locator('.viewer canvas').boundingBox(),x=canvas.x+canvas.width/2,y=canvas.y+canvas.height/2;
    const cdp=await page.context().newCDPSession(page);
    await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y,id:1}]});
    for(let i=1;i<=6;i++)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x+i*10,y:y+i*2,id:1}]});
    await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await frame(page);
    assert.notDeepEqual(await page.locator('.viewer').screenshot(),before,'Touch drag rotates the model');
    await noOverflow(page);await cdp.detach();await page.close();
  });
  assert.deepEqual(report.errors,[]);
}catch(error){report.failure=error.stack;console.error(error.stack);process.exitCode=1;}
finally{await browser.close();await writeFile(path.join(output,'report.json'),JSON.stringify(report,null,2));}

