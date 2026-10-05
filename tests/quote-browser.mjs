import assert from 'node:assert/strict';
import {mkdir, readFile, writeFile} from 'node:fs/promises';
import {spawn, execFileSync} from 'node:child_process';
import {DatabaseSync} from 'node:sqlite';
import path from 'node:path';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE??'file:///C:/Users/Student/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs');
const output=path.resolve('.local/qa/quote');await mkdir(output,{recursive:true});
const data=path.join(output,'data-'+Date.now());
const base='http://127.0.0.1:3137';
// Dedicated localhost database; notifications explicitly disabled, synthetic contacts only.
const env={...process.env,DATA_DIR:data,SITE_PUBLIC:'false',SITE_ORIGIN:base,NOTIFICATION_WEBHOOK_URL:'',NOTIFICATION_WEBHOOK_TOKEN:''};
const server=spawn(process.execPath,['node_modules/next/dist/bin/next','start','--hostname','127.0.0.1','--port','3137'],{env,stdio:'ignore',windowsHide:true});
const report={checks:[],errors:[],sizes:[]};let browser;
const key='topengineer:quote-configuration:v1';
async function check(name,fn){await fn();report.checks.push(name);console.log('PASS '+name);}
async function save(page,file){const event=page.waitForEvent('download');await page.getByRole('button',{name:'Получить расчёт',exact:false}).click();await(await event).saveAs(file);return JSON.parse(await readFile(file,'utf8'));}
try{
 for(let n=0;n<100;n++){if(server.exitCode!==null)throw new Error('QA server did not start');try{if((await fetch(base)).ok)break;}catch{}await new Promise(r=>setTimeout(r,100));if(n===99)throw new Error('QA server timeout');}
 browser=await chromium.launch({channel:process.env.PLAYWRIGHT_CHANNEL??'msedge',headless:true});
 const page=await browser.newPage({reducedMotion:'reduce'});page.on('pageerror',e=>report.errors.push(e.message));
 await check('Simple quote bar at 320/390/768/1024/1920 without specifications or overflow',async()=>{
  for(const width of [320,390,768,1024,1920]){
   await page.setViewportSize({width,height:900});await page.goto(base+'/#calculator',{waitUntil:'networkidle'});
   for(const selector of ['.node-details','.quantity-grid','.estimate-result details','.viewer-help','.dimension-strip','.export-actions','.print-card'])assert.equal(await page.locator(selector).count(),0);
   assert.equal(await page.locator('.quote-result .service-picker').count(),1);
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
   assert.equal(await page.locator('.service-picker .check-field').evaluateAll(els=>els.some(el=>el.scrollWidth>el.clientWidth+1)),false);
   report.sizes.push(width);if([390,1920].includes(width))await page.locator('.quote-result').screenshot({path:path.join(output,'quote-'+width+'.png')});
  }
 });
 let snapshot;
 await check('Quote downloads complete snapshot and restores model plus attachment after reload',async()=>{
  await page.getByRole('textbox',{name:'Длина, м',exact:true}).fill('12');await page.getByRole('textbox',{name:'Ширина, м',exact:true}).fill('8');
  await page.getByRole('button',{name:'Сваи с ростверком',exact:true}).click();
  await page.locator('[data-target=walls] .material-choice').nth(3).click();await page.locator('[data-target=roof] .material-choice').nth(5).click();
  await page.locator('.service-picker').getByLabel('Монтаж',{exact:true}).check();
  snapshot=await save(page,path.join(output,'configuration.json'));
  assert.equal(snapshot.length,12);assert.equal(snapshot.width,8);assert.equal(snapshot.foundation,'pile-cap');assert.equal(snapshot.materialId,'M4');assert.equal(snapshot.roofMaterialId,'M6');assert.ok(snapshot.services.includes('installation'));
  assert.deepEqual(JSON.parse(await page.evaluate(k=>localStorage.getItem(k),key)),snapshot);
  await page.getByRole('textbox',{name:'Длина, м',exact:true}).fill('14');await page.reload({waitUntil:'networkidle'});
  assert.equal(await page.getByRole('textbox',{name:'Длина, м',exact:true}).inputValue(),'12');assert.equal(await page.locator('.attached-config').count(),1);
 });
 await check('Real local submission stores exact snapshot and operator CLI exports it; draft cleared on success',async()=>{
  const form=page.locator('.lead-form');await form.locator('[name=contact]').fill('quote-qa@example.invalid');await form.locator('[name=region]').fill('Тест');await form.locator('.consent-field input').check();
  const pending=page.waitForResponse(r=>r.url()===base+'/api/leads'&&r.request().method()==='POST');await form.getByRole('button',{name:'Отправить заявку',exact:false}).click();const response=await pending;assert.equal(response.status(),201);const result=await response.json();
  await form.getByRole('status').waitFor();assert.match(await form.getByRole('status').textContent(),/Заявка сохранена/);
  const db=new DatabaseSync(path.join(data,'leads.sqlite'),{readOnly:true});try{const row=db.prepare('SELECT payload FROM leads WHERE id=?').get(result.id);assert.deepEqual(JSON.parse(row.payload).configuration,snapshot);}finally{db.close();}
  const exported=path.join(data,'lead-export.json');execFileSync(process.execPath,['scripts/leads.cjs','export',result.id,exported],{env,windowsHide:true,stdio:'pipe'});assert.deepEqual(JSON.parse(await readFile(exported,'utf8')).payload.configuration,snapshot);
  const configuration=path.join(data,'operator-configuration.json');execFileSync(process.execPath,['scripts/leads.cjs','configuration',result.id,configuration],{env,windowsHide:true,stdio:'pipe'});assert.deepEqual(JSON.parse(await readFile(configuration,'utf8')),snapshot);
  assert.equal(await page.evaluate(k=>localStorage.getItem(k),key),null);assert.equal(await form.locator('.attached-config').count(),0);
 });
 await check('Corrupt or unavailable local storage does not block quote download/attachment',async()=>{
  const corrupt=await browser.newPage();await corrupt.addInitScript(k=>localStorage.setItem(k,'broken-json'),key);await corrupt.goto(base+'/#calculator',{waitUntil:'networkidle'});assert.equal(await corrupt.locator('.input-error').count(),0);await corrupt.close();
  const blocked=await browser.newPage();await blocked.addInitScript(()=>{Storage.prototype.setItem=()=>{throw new DOMException('Storage unavailable','QuotaExceededError');};});await blocked.goto(base+'/#calculator',{waitUntil:'networkidle'});
  await save(blocked,path.join(output,'storage-unavailable.json'));assert.equal(await blocked.locator('.attached-config').count(),1);await blocked.close();
 });
 await check('Comparison interface remains available; draft can be removed deliberately',async()=>{
  await page.goto(base+'/compact#calculator',{waitUntil:'networkidle'});assert.equal(await page.locator('.quantity-grid').count(),1);
  await page.goto(base+'/#calculator',{waitUntil:'networkidle'});await save(page,path.join(output,'remove-draft.json'));await page.getByRole('button',{name:'Убрать схему из заявки',exact:true}).click();assert.equal(await page.evaluate(k=>localStorage.getItem(k),key),null);
 });
 assert.deepEqual(report.errors,[]);
}finally{await writeFile(path.join(output,'report.json'),JSON.stringify(report,null,2));if(browser)await browser.close();server.kill();}
