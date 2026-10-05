const {test}=require('node:test');
const assert=require('node:assert/strict');
const {submitLead}=require('../../.local/test-build/lib/leads/submit.js');
const {siteFormFields}=require('../../.local/test-build/lib/leads/site-form.js');
const {defaultInput}=require('../../.local/test-build/lib/configuration/input.js');
global.window={};global.location={href:'https://fixture.invalid/media/mod_antidrone_design/app/joomla/',origin:'https://fixture.invalid'};
const host={endpoint:'/index.php?option=com_ajax&module=antidrone_design&method=submit&format=json',tokenName:'a'.repeat(32),moduleId:42,enabled:true};
test('Joomla transport adds CSRF/session/module and accepts com_ajax response',async()=>{
  window.antidroneJoomlaHost=host;let request;
  global.fetch=async(url,options)=>{request={url,options};return {ok:true,json:async()=>({success:true,data:{id:'test-id',sent:true}})};};
  assert.deepEqual(await submitLead('{"fixture":true}','request-id'),{id:'test-id',sent:true});
  assert.equal(request.options.credentials,'same-origin');assert.equal(request.options.body.get(host.tokenName),'1');assert.equal(request.options.body.get('module_id'),'42');assert.equal(request.options.body.get('request_id'),'request-id');
});
test('disabled module, off-domain endpoint and invalid CSRF never fetch',async()=>{
  let count=0;global.fetch=async()=>{count++;throw Error('unexpected');};
  for(const variant of [{enabled:false},{endpoint:'https://other.invalid/send'},{tokenName:'invalid'}]){
    window.antidroneJoomlaHost={...host,...variant};await assert.rejects(submitLead('{}','request-id'));
  }
  assert.equal(count,0);
});
test('mail failure or missing confirmation cannot appear successful',async()=>{
  window.antidroneJoomlaHost=host;
  for(const result of [{success:false,message:'Fixture mail failure'},{success:true,data:{id:'test-id',sent:false}}]){
    global.fetch=async()=>({ok:true,json:async()=>result});await assert.rejects(submitLead('{}','request-id'));
  }
});
test('ordinary local form preserves its Next API transport',async()=>{
  delete window.antidroneJoomlaHost;let request;
  global.fetch=async(url,options)=>{request={url,options};return {ok:true,json:async()=>({id:'local-id'})};};
  assert.deepEqual(await submitLead('{}','request-id'),{id:'local-id'});assert.equal(request.url,'/api/leads');assert.equal(request.options.headers['Idempotency-Key'],'request-id');
});

test('existing site field names preserve contact, configuration, selected services and RUB estimate',()=>{
  const configuration={...defaultInput,length:12,services:['km','kmd','kzh']};
  const fields=siteFormFields(JSON.stringify({name:'Local fixture',phone:'',email:'fixture@example.invalid',comment:'Local test only',website:'',consent:true,configuration}));
  assert.deepEqual(Object.keys(fields),['DATA[NAME]','DATA[PHONE_WORK]','DATA[EMAIL_WORK]','DATA[COMMENTS]']);
  assert.equal(fields['DATA[EMAIL_WORK]'],'fixture@example.invalid');assert.equal(fields['DATA[PHONE_WORK]'],'');
  assert.match(fields['DATA[COMMENTS]'],/Разработка КМ, Разработка КМД, Разработка КЖ/);
  assert.match(fields['DATA[COMMENTS]'],/≈ .* ₽/);
  assert.deepEqual(JSON.parse(fields['DATA[COMMENTS]'].split('Параметры 3D (JSON): ')[1].split('\n')[0]),configuration);
  const bottom=siteFormFields(JSON.stringify({name:'',phone:'+79990000000',email:'',comment:'',website:'',consent:true,configuration:null}));
  assert.equal(bottom['DATA[PHONE_WORK]'],'+79990000000');assert.doesNotMatch(bottom['DATA[COMMENTS]'],/JSON/);
});

test('existing site fields reject missing consent, spam, bad contact and bad geometry',()=>{
  const valid={name:'',email:'fixture@example.invalid',phone:'',comment:'',consent:true,website:'',configuration:null};
  for(const change of [{consent:false},{website:'spam'},{email:'bad'},{configuration:{...defaultInput,length:-1}}]) assert.throws(()=>siteFormFields(JSON.stringify({...valid,...change})));
});

test('site transport uses parent scripts and only accepts matching same-origin responses',async()=>{
  const listeners=new Set(),parent={postMessage:(message,origin)=>{
    assert.equal(message.type,'antidrone:submit');assert.equal(origin,location.origin);
    assert.equal(message.fields['DATA[EMAIL_WORK]'],'fixture@example.invalid');
    for(const listener of [...listeners]){
      listener({source:parent,origin:'https://foreign.invalid',data:{type:'antidrone:result',requestId:message.requestId,success:true}});
      listener({source:{},origin,data:{type:'antidrone:result',requestId:message.requestId,success:true}});
      listener({source:parent,origin,data:{type:'antidrone:result',requestId:'wrong',success:true}});
      assert.equal(listeners.size,1);
      listener({source:parent,origin,data:{type:'antidrone:result',requestId:message.requestId,success:true}});
    }
  }};
  global.window={parent,antidroneJoomlaHost:{transport:'site-form',endpoint:'/upload.php',moduleId:42,enabled:true},addEventListener:(_,f)=>listeners.add(f),removeEventListener:(_,f)=>listeners.delete(f)};
  global.fetch=()=>{throw Error('must use parent jQuery, not fetch');};
  assert.deepEqual(await submitLead(JSON.stringify({name:'',email:'fixture@example.invalid',phone:'',comment:'',consent:true,website:'',configuration:null}),'a'.repeat(36)),{sent:true});
  assert.equal(listeners.size,0);
});
