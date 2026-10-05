const {test}=require('node:test');
const assert=require('node:assert/strict');
const {submitLead}=require('../../.local/test-build/lib/leads/submit.js');
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
