const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
function fixture(){
  const events={},messages=[],calls=[],scrolls=[];
  const native={dataset:{signedParameters:'signed-estimate-mode'}};
  const frame={src:'https://fixture.invalid/local/antidrone-design/app/bitrix/',contentDocument:null,contentWindow:{postMessage:m=>messages.push(m)},style:{},clientHeight:900,addEventListener:()=>{},getBoundingClientRect:()=>({top:100})};
  const article={querySelector:q=>q.startsWith('iframe')?frame:native};
  const window={scrollY:100,matchMedia:()=>({matches:true}),scrollTo:p=>scrolls.push(p),addEventListener:(n,fn)=>events[n]=fn,BX:{ajax:{runComponentAction:(component,action,options)=>new Promise((resolve,reject)=>calls.push({component,action,options,resolve,reject}))}}};
  const document={readyState:'complete',referrer:'https://fixture.invalid/proektirovanie/',getElementById:()=>article};
  vm.runInNewContext(fs.readFileSync(path.resolve(__dirname,'../../bitrix/bridge.js'),'utf8'),{window,document,location:{origin:'https://fixture.invalid',href:'https://fixture.invalid/proektirovanie/antidronovaya-zashchita/?utm_source=qa',search:'?utm_source=qa'},URL,URLSearchParams,FormData,Number,Map,Promise,getComputedStyle:()=>({fontFamily:'Roboto'})});
  const id='12345678-1234-4123-8123-123456789abc';
  const fields={'DATA[NAME]':'Тестовое имя','DATA[PHONE_WORK]':'+7 (999) 123-45-67','DATA[EMAIL_WORK]':'test@example.invalid','DATA[COMMENTS]':'Локальная заявка\nПараметры 3D (JSON): {"length":10}'};
  const send=(changes={},source=frame.contentWindow,origin='https://fixture.invalid')=>events.message({origin,source,data:{type:'antidrone:submit',requestId:id,fields,...changes}});
  return {window,frame,messages,calls,fields,send,events,scrolls,id};
}
const tick=()=>new Promise(resolve=>setImmediate(resolve));
test('Bitrix bridge uses signed component, exact contact fields and full comments; pending/success dedup',async()=>{
  const f=fixture();assert.equal(f.messages[0].host.requiresAllContacts,true);assert.equal(f.messages[0].host.enabled,true);
  f.send({}, {},'https://fixture.invalid');f.send({},f.frame.contentWindow,'https://foreign.invalid');await tick();assert.equal(f.calls.length,0);
  f.send();f.send();await tick();assert.equal(f.calls.length,1);
  const c=f.calls[0];assert.equal(c.component,'topengineer:request.form');assert.equal(c.action,'send');assert.equal(c.options.mode,'class');assert.equal(c.options.signedParameters,'signed-estimate-mode');
  for(const [name,value] of Object.entries({name:f.fields['DATA[NAME]'],phone:f.fields['DATA[PHONE_WORK]'],email:f.fields['DATA[EMAIL_WORK]'],message:f.fields['DATA[COMMENTS]'],personal_data:'1',request_id:f.id,utm_source:'qa',website:''}))assert.equal(c.options.data.get(name),value);
  assert.match(c.options.data.get('page_url'),/proektirovanie\/antidronovaya-zashchita/);
  c.resolve({data:{success:true}});await tick();assert.equal(f.messages.at(-1).success,true);f.send();await tick();assert.equal(f.calls.length,1);
});
test('Bitrix business errors and missing confirmation are failures; retry preserves request ID',async()=>{
  const f=fixture();f.send();await tick();f.calls[0].resolve({data:{success:false,message:'Ошибка проверки'}});await tick();assert.equal(f.messages.at(-1).success,false);assert.equal(f.messages.at(-1).message,'Ошибка проверки');
  f.send();await tick();f.calls[1].reject(new Error('Lost response'));await tick();assert.equal(f.messages.at(-1).success,false);
  f.send();await tick();assert.equal(f.calls[2].options.data.get('request_id'),f.id);f.calls[2].resolve({status:'success',data:{}});await tick();assert.equal(f.messages.at(-1).success,false);
});
test('Malformed/missing contacts cannot send, changed payload cannot reuse ID',async()=>{
  const f=fixture();
  for(const fields of [{...f.fields,extra:'bad'},{...f.fields,'DATA[NAME]':''},{...f.fields,'DATA[EMAIL_WORK]':''},{...f.fields,'DATA[PHONE_WORK]':'123'},{...f.fields,'DATA[COMMENTS]':'x'.repeat(10001)}])f.send({fields});
  f.send({requestId:'bad'});await tick();assert.equal(f.calls.length,0);
  f.send();await tick();f.send({fields:{...f.fields,'DATA[COMMENTS]':'Изменённое описание'}});assert.equal(f.calls.length,1);assert.equal(f.messages.at(-1).success,false);
  f.calls[0].resolve({data:{success:true}});await tick();delete f.window.BX;f.send();assert.equal(f.messages.at(-1).success,false);
});
test('Height and scroll are bounded and source checked',()=>{
  const f=fixture(),dispatch=data=>f.events.message({source:f.frame.contentWindow,origin:'https://fixture.invalid',data});
  dispatch({type:'antidrone:size',height:60001});assert.equal(f.frame.style.height,undefined);dispatch({type:'antidrone:size',height:800.5});assert.equal(f.frame.style.height,'801px');
  dispatch({type:'antidrone:scroll',offset:999});assert.equal(f.scrolls.length,0);dispatch({type:'antidrone:scroll',offset:300});assert.equal(f.scrolls[0].top,400);
});
