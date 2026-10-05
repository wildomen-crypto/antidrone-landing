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
async function save(page,file){
 const form=page.locator('#quote-request');
 await form.locator('[name=email]').fill('quote-qa@example.invalid');
 await form.locator('.consent-field input').check();
 const responseEvent=page.waitForResponse(r=>r.url()===base+'/api/leads'&&r.request().method()==='POST');
 const downloadEvent=page.waitForEvent('download');
 await form.getByRole('button',{name:'Получить проект',exact:false}).click();
 const response=await responseEvent;assert.equal(response.status(),201);const result=await response.json();
 await(await downloadEvent).saveAs(file);
 await form.getByRole('status').filter({hasText:'Заявка сохранена'}).waitFor();
 return {snapshot:JSON.parse(await readFile(file,'utf8')),id:result.id};
}
try{
 for(let n=0;n<100;n++){if(server.exitCode!==null)throw new Error('QA server did not start');try{if((await fetch(base)).ok)break;}catch{}await new Promise(r=>setTimeout(r,100));if(n===99)throw new Error('QA server timeout');}
 browser=await chromium.launch({channel:process.env.PLAYWRIGHT_CHANNEL??'msedge',headless:true});
 const page=await browser.newPage({reducedMotion:'reduce'});page.on('pageerror',e=>report.errors.push(e.message));
 await check('Simple quote bar at 320/390/768/1024/1920 without specifications or overflow',async()=>{
  for(const width of [320,390,768,1024,1920]){
   await page.setViewportSize({width,height:900});await page.goto(base+'/#calculator',{waitUntil:'networkidle'});
   for(const selector of ['.node-details','.quantity-grid','.estimate-result details','.viewer-help','.dimension-strip','.export-actions','.print-card'])assert.equal(await page.locator(selector).count(),0);
   assert.equal(await page.locator('.quote-result .service-picker').count(),1);
   assert.equal(await page.locator('.order-section').count(),0);
   assert.equal(await page.locator('form').count(),2);
   assert.equal(await page.locator('.quote-fields .field').count(),4);assert.equal(await page.locator('.lead-form [name=region], .lead-form .field>span').count(),0);assert.equal(await page.locator('.lead-form [name=phone]').count(),2);assert.equal(await page.locator('.lead-form [name=email]').count(),2);
   assert.equal(await page.getByRole('button',{name:'Получить проект',exact:false}).count(),1);
   assert.equal(await page.getByRole('button',{name:'Получить проект',exact:false}).isDisabled(),true);
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
   assert.equal(await page.locator('.service-picker .check-field').evaluateAll(els=>els.some(el=>el.scrollWidth>el.clientWidth+1)),false);
   report.sizes.push(width);if([390,1920].includes(width))await page.locator('.quote-result').screenshot({path:path.join(output,'quote-'+width+'.png')});
  }
 });
 await check('Draft project price follows dimensions and selected design sections',async()=>{
  const price=async()=>Number((await page.locator('.quote-result .project-price strong').textContent()).replace(/\D/g,''));
  const initial=await price();assert.ok(initial>0);
  await page.getByRole('textbox',{name:'Длина, м',exact:true}).fill('20');
  await page.waitForFunction(previous=>Number(document.querySelector('.quote-result .project-price strong').textContent.replace(/\D/g,''))>previous,initial);
  const larger=await price();
  await page.locator('.service-picker').getByLabel('Разработка КМД',{exact:true}).uncheck();
  await page.waitForFunction(previous=>Number(document.querySelector('.quote-result .project-price strong').textContent.replace(/\D/g,''))<previous,larger);
  await page.locator('.service-picker').getByLabel('Разработка КМД',{exact:true}).check();
  await page.getByRole('textbox',{name:'Длина, м',exact:true}).fill('10');
 });
 let snapshot,leadId;
 await check('Invalid dimensions retain contacts and disable the inline submission',async()=>{
  const form=page.locator('#quote-request');await form.locator('[name=name]').fill('Тест ФИО');await form.locator('[name=phone]').fill('+7 (900) 123-45-67');
  await form.locator('[name=comment]').fill('Тестовая заявка, не реальный заказ');
  await page.getByRole('textbox',{name:'Длина, м',exact:true}).fill('-1');
  assert.equal(await form.getByRole('button',{name:'Получить проект',exact:false}).isDisabled(),true);
  assert.equal(await form.locator('[name=name]').inputValue(),'Тест ФИО');
  await page.getByRole('textbox',{name:'Длина, м',exact:true}).fill('10');
 });
 await check('Inline quote submits and downloads the current model and design sections',async()=>{
  await page.getByRole('textbox',{name:'Длина, м',exact:true}).fill('12');await page.getByRole('textbox',{name:'Ширина, м',exact:true}).fill('8');
  await page.getByRole('button',{name:'Сваи с ростверком',exact:true}).click();
  await page.locator('[data-target=walls] .material-choice').nth(3).click();await page.locator('[data-target=roof] .material-choice').nth(5).click();
  await page.locator('.service-picker').getByLabel('Разработка КЖ',{exact:true}).check();
  await page.getByRole('textbox',{name:'Длина, м',exact:true}).fill('14');
  const saved=await save(page,path.join(output,'configuration.json'));snapshot=saved.snapshot;leadId=saved.id;
  assert.equal(snapshot.length,14);assert.equal(snapshot.width,8);assert.equal(snapshot.foundation,'pile-cap');assert.equal(snapshot.materialId,'M4');assert.equal(snapshot.roofMaterialId,'M6');assert.ok(snapshot.services.includes('kzh'));
 });
 await check('Operator exports match current snapshot and contact fields; success clears fields and draft',async()=>{
  const form=page.locator('#quote-request');
  const db=new DatabaseSync(path.join(data,'leads.sqlite'),{readOnly:true});try{const row=db.prepare('SELECT payload FROM leads WHERE id=?').get(leadId);const payload=JSON.parse(row.payload);assert.deepEqual(payload.configuration,snapshot);assert.equal(payload.name,'Тест ФИО');assert.equal(payload.region,'');assert.equal(payload.phone,'+7 (900) 123-45-67');assert.equal(payload.email,'quote-qa@example.invalid');assert.equal(payload.comment,'Тестовая заявка, не реальный заказ');assert.equal(payload.summary.mode,'draft');assert.equal(payload.summary.currency,'RUB');assert.equal(payload.summary.projectPrice.hourlyRate,1250);assert.ok(payload.summary.amount>0);assert.equal(payload.summary.amount,Number((await page.locator('.quote-result .project-price strong').textContent()).replace(/\D/g,'')));}finally{db.close();}
  const exported=path.join(data,'lead-export.json');execFileSync(process.execPath,['scripts/leads.cjs','export',leadId,exported],{env,windowsHide:true,stdio:'pipe'});assert.deepEqual(JSON.parse(await readFile(exported,'utf8')).payload.configuration,snapshot);
  const configuration=path.join(data,'operator-configuration.json');execFileSync(process.execPath,['scripts/leads.cjs','configuration',leadId,configuration],{env,windowsHide:true,stdio:'pipe'});assert.deepEqual(JSON.parse(await readFile(configuration,'utf8')),snapshot);
  assert.equal(await page.evaluate(k=>localStorage.getItem(k),key),null);
  for(const name of ['phone','email','name','comment'])assert.equal(await form.locator('[name='+name+']').inputValue(),'');
  assert.equal(await form.locator('.consent-field input').isChecked(),false);
 });
 await check('Corrupt or unavailable local storage does not block submission and JSON copy',async()=>{
  const corrupt=await browser.newPage();await corrupt.addInitScript(k=>localStorage.setItem(k,'broken-json'),key);await corrupt.goto(base+'/#calculator',{waitUntil:'networkidle'});assert.equal(await corrupt.locator('.input-error').count(),0);await corrupt.close();
  const blocked=await browser.newPage();await blocked.addInitScript(()=>{Storage.prototype.setItem=()=>{throw new DOMException('Storage unavailable','QuotaExceededError');};});await blocked.goto(base+'/#calculator',{waitUntil:'networkidle'});
  await save(blocked,path.join(output,'storage-unavailable.json'));assert.match(await blocked.locator('#quote-request').getByRole('status').textContent(),/Заявка сохранена/);await blocked.close();
 });
 await check('Comparison interface has the inline form and specification; no removed attachment controls',async()=>{
  await page.goto(base+'/compact#calculator',{waitUntil:'networkidle'});assert.equal(await page.locator('.quantity-grid').count(),1);
  assert.equal(await page.locator('#quote-request .quote-fields .field').count(),4);
  assert.equal(await page.locator('.order-section,.attached-config').count(),0);
 });
 await check('Restored bottom form submits without configuration and has independent consent',async()=>{
  const form=page.locator('.contact-form');
  await form.locator('[name=email]').fill('bottom-qa@example.invalid');
  await form.locator('[name=name]').fill('Тест нижней формы');
  await form.locator('.consent-field input').check();
  assert.equal(await page.locator('#quote-request .consent-field input').isChecked(),false);
  const pending=page.waitForResponse(r=>r.url()===base+'/api/leads'&&r.request().method()==='POST');
  await form.getByRole('button',{name:'Отправить заявку',exact:false}).click();
  const response=await pending;assert.equal(response.status(),201);const result=await response.json();
  const db=new DatabaseSync(path.join(data,'leads.sqlite'),{readOnly:true});
  try{const row=db.prepare('SELECT payload FROM leads WHERE id=?').get(result.id);const payload=JSON.parse(row.payload);assert.equal(payload.configuration,null);assert.equal(payload.name,'Тест нижней формы');}finally{db.close();}
  await form.getByRole('status').filter({hasText:'Заявка сохранена'}).waitFor();
  assert.equal(await form.locator('.consent-field input').isChecked(),false);
 });
 assert.deepEqual(report.errors,[]);
}finally{await writeFile(path.join(output,'report.json'),JSON.stringify(report,null,2));if(browser)await browser.close();server.kill();}
