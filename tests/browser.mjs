import { createRequire } from 'node:module';
import assert from 'node:assert/strict';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { DatabaseSync } from 'node:sqlite';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { randomUUID, createHash } from 'node:crypto';
const modulePath=process.env.PLAYWRIGHT_MODULE??'file:///C:/Users/Student/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
const {chromium}=await import(modulePath);
const require=createRequire(import.meta.url);
const {defaultInput}=require('../.local/test-build/lib/configuration/input.js');
const {legal}=require('../.local/test-build/config/legal.js');
const base=process.env.QA_URL??'http://127.0.0.1:3100';
assert.ok(['127.0.0.1','localhost'].includes(new URL(base).hostname),'Submission QA is restricted to localhost');
const output=path.resolve('.local/qa');await mkdir(output,{recursive:true});
const startedAt=Date.now();
const report={startedAt:new Date(startedAt).toISOString(),browser:null,checks:[],errors:[],requests:[],memory:[]};
const leadIds=[];
const browser=await chromium.launch({channel:process.env.PLAYWRIGHT_CHANNEL??'msedge',headless:true});
report.browser=browser.version();
async function check(name,fn){await fn();report.checks.push({name,passed:true});console.log('PASS '+name);}
const monitor=page=>{
  page.on('pageerror',e=>report.errors.push(e.message));
  page.on('request',r=>{const u=new URL(r.url());if(!['127.0.0.1','localhost'].includes(u.hostname))report.requests.push(u.origin);});
};
async function total(page){return Number((await page.locator('.quantity-grid strong').first().textContent()).replace(/[^\d,.]/g,'').replace(',','.'));}
async function waitTotal(page,n){await page.waitForFunction(n=>Number(document.querySelector('.quantity-grid strong')?.textContent.replace(/[^\d,.]/g,'').replace(',','.'))===n,n);}
async function auxiliary(env,fn){
  const child=spawn(process.execPath,['node_modules/next/dist/bin/next','start','--hostname','127.0.0.1','--port','3101'],{cwd:process.cwd(),env:{...process.env,...env},windowsHide:true,stdio:['ignore','pipe','pipe']});
  let ready=false;
  try {
    for(let i=0;i<80;i++){try{const r=await fetch('http://127.0.0.1:3101');if(r.ok){ready=true;break;}}catch{}await new Promise(r=>setTimeout(r,100));}
    assert.ok(ready,'Auxiliary local server failed to start');await fn();
  }finally{child.kill();await new Promise(resolve=>{if(child.exitCode!==null)resolve();else child.once('exit',resolve);});}
}
try{
  await check('A01 responsive layout and SSR at 360/390/768/1280/1440',async()=>{
    for(const width of [360,390,768,1280,1440]){
      const page=await browser.newPage({viewport:{width,height:900},reducedMotion:'reduce'});monitor(page);
      const response=await page.goto(base,{waitUntil:'networkidle'});assert.equal(response.status(),200);
      assert.equal(await page.locator('h1').count(),1);assert.equal(await page.locator('html').getAttribute('lang'),'ru');
      assert.match(await page.title(),/Топинженер/);assert.match(await page.locator('meta[name=robots]').getAttribute('content'),/noindex/);
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'overflow at '+width);
      assert.equal(await page.locator('.solution-card').count(),8);
      await page.screenshot({path:path.join(output,'hero-'+width+'.png')});
      await page.locator('.viewer').scrollIntoViewIfNeeded();await page.locator('.viewer canvas').waitFor();
      assert.equal(await total(page),188);
      await page.screenshot({path:path.join(output,'viewer-'+width+'.png')});
      await page.close();
    }
  });
  const page=await browser.newPage({viewport:{width:1440,height:1000},reducedMotion:'reduce'});monitor(page);await page.goto(base,{waitUntil:'networkidle'});
  const shape=page.getByRole('combobox',{name:'Тип конструкции',exact:true});
  await check('A02 catalog card selects configuration',async()=>{
    await page.locator('.solution-card').nth(3).getByRole('button').click();
    assert.equal(await shape.inputValue(),'C4');
  });
  await check('C1-C8, C5 variants, C6 portal/arch/cable and C7 ring/dome',async()=>{
    for(const id of ['C1','C2','C3','C4','C5','C6','C7','C8']){
      await shape.selectOption(id);await page.locator('.quantity-grid strong').first().waitFor();
      assert.equal(await page.locator('.viewer-error').count(),0,id);
      if(['C5','C6'].includes(id))for(const variant of id==='C5'?['screen','shelter']:['portal','arch','cable']){
        await page.getByRole('combobox',{name:'Вариант',exact:true}).selectOption(variant);
        assert.equal(await page.locator('.viewer-error').count(),0,variant);
      }
      if(id==='C7'){
        assert.equal(await page.getByRole('combobox',{name:'Вариант',exact:true}).count(),0);
        for(const material of ['none','M5']){
          await page.getByRole('combobox',{name:'Материал покрытия',exact:true}).selectOption(material);
          assert.equal(await page.locator('.viewer-error').count(),0,material);
        }
      }
    }
    await shape.selectOption('C4');await waitTotal(page,188);
  });
  await check('A03/A13 dimensions, Russian comma, invalid editing and recovery',async()=>{
    const length=page.getByLabel('Длина, м',{exact:true});
    await length.fill('20');await waitTotal(page,328);assert.match(await page.locator('.dimension-strip').textContent(),/L 20/);
    await length.fill('10');await waitTotal(page,188);
    const width=page.getByLabel('Ширина, м',{exact:true});await width.fill('3,5');
    await page.waitForFunction(()=>document.querySelector('.dimension-strip').textContent.includes('W 3,5'));
    await width.fill('');assert.ok(await page.locator('.input-error').isVisible());assert.equal(await page.getByRole('button',{name:'Сохранить JSON',exact:true}).isEnabled(),false);
    await width.fill('-1');assert.ok(await page.locator('.input-error').isVisible());
    await width.fill('6');await waitTotal(page,188);
  });
  await page.getByRole('button',{name:/Дополнительные настройки/}).click();
  await check('A06 opening changes 188 to 179 and layers to 376',async()=>{
    await page.getByLabel('Проём в передней стороне',{exact:true}).check();await waitTotal(page,179);
    await page.getByLabel('Проём в передней стороне',{exact:true}).uncheck();await waitTotal(page,188);
    await page.getByRole('combobox',{name:'Слои заполнения',exact:true}).selectOption('2');await waitTotal(page,376);
    await page.getByRole('combobox',{name:'Слои заполнения',exact:true}).selectOption('1');await waitTotal(page,188);
  });
  await check('A07/A08/A12 all materials, frame types, foundations and detail views',async()=>{
    for(const id of ['M1','M2','M3','M4','M5','M6','M7','M8']){await page.getByRole('combobox',{name:'Материал покрытия',exact:true}).selectOption(id);assert.equal(await page.locator('.viewer-error').count(),0);}
    await page.getByRole('combobox',{name:'Материал покрытия',exact:true}).selectOption('M5');
    for(const id of ['tube-post','spatial-column','frame','spatial-truss','guyed-mast','wall-bracket']){await page.getByRole('combobox',{name:'Несущие элементы',exact:true}).selectOption(id);assert.equal(await page.locator('.viewer-error').count(),0);}
    await page.getByRole('combobox',{name:'Несущие элементы',exact:true}).selectOption('tube-post');
    for(const id of ['block','pile-cap'])await page.getByRole('combobox',{name:'Условный тип основания',exact:true}).selectOption(id);
    await page.getByRole('combobox',{name:'Условный тип основания',exact:true}).selectOption('block');
    await page.locator('.node-details>summary').click();
    for(const name of ['Опора','Ферма','Основание']){await page.locator('.node-details').getByRole('button',{name,exact:true}).click();await page.locator('.detail-viewer canvas').waitFor();}
    await page.locator('.node-details>summary').click();
  });
  await check('A09-A11 contour visibility differs from exclusion; independent materials',async()=>{
    await shape.selectOption('C8');const before=await total(page);
    await page.locator('.viewer-layers').getByLabel('Контур 2',{exact:true}).uncheck();assert.equal(await total(page),before);
    await page.locator('.contour-inputs').getByLabel('Контур 2',{exact:true}).uncheck();assert.ok(await total(page)<before);
    await page.locator('.contour-inputs').getByLabel('Контур 2',{exact:true}).check();assert.equal(await total(page),before);
    const overrides=page.locator('.contour-options').first();await overrides.locator('summary').click();
    await overrides.getByRole('combobox',{name:'Заполнение контура',exact:true}).selectOption('M1');assert.equal(await total(page),before);
    await overrides.getByRole('combobox',{name:'Слои контура',exact:true}).selectOption('2');assert.ok(await total(page)>before);
    for(const id of ['W1','W2','W3'])await page.getByRole('combobox',{name:'Внутренний стеновой модуль',exact:true}).selectOption(id);
    await page.locator('.viewer').screenshot({path:path.join(output,'complex-3d.png')});
    await page.getByRole('combobox',{name:'Внутренний стеновой модуль',exact:true}).selectOption('none');
    await shape.selectOption('C4');await waitTotal(page,188);
  });
  let exported;
  await check('A22 JSON roundtrip and unknown-version rejection',async()=>{
    const pending=page.waitForEvent('download');await page.getByRole('button',{name:'Сохранить JSON',exact:true}).click();const download=await pending;
    exported=JSON.parse(await readFile(await download.path(),'utf8'));assert.equal(exported.version,1);assert.equal(exported.shapeId,'C4');assert.ok(!('contact' in exported));
    await page.getByLabel('Длина, м',{exact:true}).fill('17');
    await page.locator('input[type=file]').setInputFiles({name:'layout.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(exported))});
    await waitTotal(page,188);
    await page.waitForFunction(()=>document.querySelector('.calculator-inputs>.field-grid input').value==='10');
    await page.locator('input[type=file]').setInputFiles({name:'invalid.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify({...exported,version:99}))});
    assert.match(await page.locator('.calculator-output>.form-message').textContent(),/версия.*не поддерживается/);
    await waitTotal(page,188);
  });
  await check('A23 print card hides marketing, keeps Cyrillic, source and quantities',async()=>{
    await page.emulateMedia({media:'print'});
    assert.ok(await page.locator('.print-card').isVisible());assert.equal(await page.locator('.hero').isVisible(),false);
    assert.match(await page.locator('.print-card').textContent(),/topengineer.ru\/contact/);
    assert.match(await page.locator('.print-card').textContent(),/Стоимость определяется инженером/);
    await page.screenshot({path:path.join(output,'print-card.png'),fullPage:true});
    await page.emulateMedia({media:'screen'});
  });
  await check('A19/A21 live form with attached layout and separate consent',async()=>{
    let submitted=0;page.on('request',r=>{if(r.url().endsWith('/api/leads')&&r.method()==='POST')submitted++;});
    await page.getByRole('button',{name:/Получить расчёт/}).click();assert.ok(await page.locator('.attached-config').isVisible());
    await page.locator('input[name=contact]').fill('qa@example.com');await page.locator('textarea[name=comment]').fill('QA_LOCAL_AUTOMATED');
    assert.equal(await page.locator('.lead-form button[type=submit]').isEnabled(),false);assert.equal(submitted,0);
    await page.locator('.consent-field input').check();
    const response=page.waitForResponse(r=>r.url().endsWith('/api/leads'));await page.locator('.lead-form button[type=submit]').click();
    const result=await (await response).json();assert.ok(result.saved,JSON.stringify(result));leadIds.push(result.id);
    await page.locator('.lead-form .form-message').waitFor();assert.match(await page.locator('.lead-form .form-message').textContent(),/Заявка сохранена/);
    const db=new DatabaseSync(path.resolve('.local/data/leads.sqlite'),{readOnly:true});
    const row=db.prepare('SELECT payload FROM leads WHERE id=?').get(result.id);assert.ok(row);const payload=JSON.parse(row.payload);assert.equal(payload.configuration.shapeId,'C4');assert.equal(payload.summary.amount,null);db.close();
  });
  const contactPayload={name:'',contact:'qa@example.com',region:'',comment:'QA_LOCAL_AUTOMATED',website:'',consent:true,consentVersion:legal.consentVersion,configuration:structuredClone(defaultInput)};
  async function submit(payload=contactPayload,key=randomUUID(),origin=base,url=base){
    return fetch(url+'/api/leads',{method:'POST',headers:{'content-type':'application/json','origin':origin,'idempotency-key':key},body:typeof payload==='string'?payload:JSON.stringify(payload)});
  }
  await check('A20 API retry, conflict, bad consent/contact/configuration/origin/body',async()=>{
    const key=randomUUID(),first=await submit(contactPayload,key);assert.equal(first.status,201);const value=await first.json();leadIds.push(value.id);
    const repeat=await submit(contactPayload,key);assert.equal(repeat.status,200);assert.equal((await repeat.json()).id,value.id);
    assert.equal((await submit({...contactPayload,comment:'changed'},key)).status,409);
    assert.equal((await submit({...contactPayload,consent:false})).status,400);
    assert.equal((await submit({...contactPayload,contact:'bad'})).status,400);
    assert.equal((await submit({...contactPayload,configuration:{...defaultInput,length:-1}})).status,400);
    assert.equal((await submit(contactPayload,randomUUID(),'https://example.com')).status,403);
    assert.equal((await submit('{bad')).status,400);
    assert.equal((await submit({...contactPayload,comment:'a'.repeat(21000)})).status,413);
    assert.equal((await submit({...contactPayload,website:'bot'})).status,400);
  });
  await check('API storage failure has no false success; public mode requires approved legal data',async()=>{
    const invalidData=path.join(output,'invalid-data-file');await writeFile(invalidData,'QA fixture');
    await auxiliary({DATA_DIR:invalidData,SITE_PUBLIC:'false',NOTIFICATION_WEBHOOK_URL:''},async()=>{
      const response=await submit(contactPayload,randomUUID(),'http://127.0.0.1:3101','http://127.0.0.1:3101');assert.equal(response.status,503);assert.ok(!(await response.json()).saved);
    });
    await auxiliary({DATA_DIR:path.join(output,'public-gate-data'),SITE_PUBLIC:'true',NOTIFICATION_WEBHOOK_URL:''},async()=>{
      const response=await submit(contactPayload,randomUUID(),'http://127.0.0.1:3101','http://127.0.0.1:3101');assert.equal(response.status,503);assert.match((await response.json()).error,/не активирована/);
    });
  });
  await check('API rate limit reaches 429 without losing saved IDs',async()=>{
    let limited=false;
    for(let i=0;i<10;i++){const response=await submit();if(response.status===429){limited=true;break;}if(response.status===201)leadIds.push((await response.json()).id);}
    assert.ok(limited);
  });
  await check('A15 fifty form switches, camera views and resource recovery',async()=>{
    await page.getByRole('button',{name:'3D',exact:true}).click();
    await page.locator('.viewer').scrollIntoViewIfNeeded();
    const cdp=await page.context().newCDPSession(page);
    async function sample(){await cdp.send('HeapProfiler.collectGarbage');const {usedSize}=await cdp.send('Runtime.getHeapUsage');report.memory.push(usedSize);}
    for(let batch=0;batch<3;batch++){
      for(let i=0;i<25;i++){await shape.selectOption('C'+(1+i%8));await page.locator('.quantity-grid strong').first().waitFor();}
      await sample();
    }
    assert.ok(report.memory[2]<report.memory[0]*1.5,'heap grew >50% after warmup');
    await shape.selectOption('C4');
    for(const name of ['Сверху','Спереди','Сбоку','3D'])await page.locator('.viewer-controls').getByRole('button',{name,exact:true}).click();
    await page.getByLabel('Только каркас',{exact:true}).check();await page.getByLabel('Только каркас',{exact:true}).uncheck();
    await page.locator('.viewer').screenshot({path:path.join(output,'final-3d.png')});
    await cdp.detach();
  });
  await check('A24 contacts and legal links are consistent; no external tracking',async()=>{
    const phones=await page.locator('a[href^="tel:"]').evaluateAll(es=>es.map(e=>e.getAttribute('href')));
    const emails=await page.locator('a[href^="mailto:"]').evaluateAll(es=>es.map(e=>e.getAttribute('href')));
    assert.ok(phones.every(p=>['tel:+74952150779','tel:+74952155279'].includes(p)));
    assert.ok(emails.every(e=>['mailto:info@topengineer.ru','mailto:kmd@topengineer.ru','mailto:mk@topengineer.ru'].includes(e)));
    for(const url of ['/privacy','/consent'])assert.equal((await fetch(base+url)).status,200);
    assert.equal(report.requests.length,0);assert.equal(report.errors.length,0);
    await page.goto(base,{waitUntil:'networkidle'});await page.keyboard.press('Tab');assert.equal(await page.evaluate(()=>document.activeElement.className),'skip-link');
  });
  await page.close();
  await check('A14 no-WebGL fallback retains projections, quantities and quote action',async()=>{
    const fallbackBrowser=await chromium.launch({channel:process.env.PLAYWRIGHT_CHANNEL??'msedge',headless:true,args:['--disable-webgl']});
    try{
      const fallback=await fallbackBrowser.newPage({viewport:{width:390,height:844},reducedMotion:'reduce'});monitor(fallback);
      await fallback.goto(base,{waitUntil:'networkidle'});await fallback.locator('.viewer').scrollIntoViewIfNeeded();
      await fallback.locator('.viewer svg').waitFor();assert.equal(await total(fallback),188);
      await fallback.getByRole('button',{name:'Сверху',exact:true}).click();
      await fallback.locator('.viewer svg[aria-label*="сверху"]').waitFor();
      await fallback.screenshot({path:path.join(output,'fallback-2d.png')});
      assert.ok(await fallback.getByRole('button',{name:/Получить расчёт/}).isEnabled());
    }finally{await fallbackBrowser.close();}
  });
  assert.equal(report.errors.length,0);
}catch(error){report.failure=error.stack;console.error(error.message);process.exitCode=1;}
finally{
  await browser.close();
  // Delete only IDs created by this QA run. Never enumerate or clear owner records.
  if(leadIds.length){
    const db=new DatabaseSync(path.resolve('.local/data/leads.sqlite'));
    for(const id of leadIds){const row=db.prepare('SELECT payload FROM leads WHERE id=?').get(id);if(!row||JSON.parse(row.payload).comment!=='QA_LOCAL_AUTOMATED')continue;db.prepare('DELETE FROM outbox WHERE lead_id=?').run(id);db.prepare('DELETE FROM leads WHERE id=?').run(id);}
    // Remove only this run's technical limiter if no owner lead was added
    // during the run. Previously existing counters are deliberately retained.
    const other=db.prepare('SELECT count(*) n FROM leads WHERE created_at>=?').get(new Date(startedAt).toISOString());
    const hash=createHash('sha256').update('direct').digest('hex');
    if(other.n===0)db.prepare('DELETE FROM rate_limits WHERE client_hash=? AND started_at>=?').run(hash,startedAt);
    db.close();
  }
  await writeFile(path.join(output,'browser-report.json'),JSON.stringify(report,null,2));
  console.log('Checks passed: '+report.checks.length+'. Report: .local/qa/browser-report.json');
}
