const {test}=require('node:test'), assert=require('node:assert/strict'), vm=require('node:vm'), fs=require('node:fs'), path=require('node:path');
test('host bridge filters origin/source, bounds height, and scrolls inside the parent page',()=>{
  const messages=[],scrolls=[],events={};
  const frame={contentWindow:{postMessage:(data,origin)=>messages.push({data,origin})},style:{},clientHeight:1000,parentElement:null,closest:()=>context,getAttribute:key=>({'data-endpoint':'/index.php?option=com_ajax','data-token':'a'.repeat(32),'data-module-id':'42','data-requests':'0'}[key]),addEventListener:()=>{},getBoundingClientRect:()=>({top:100})};
  const context={querySelector:()=>null};
  const document={readyState:'complete',querySelectorAll:q=>q.startsWith('iframe')?[frame]:[{href:'https://fixture.invalid/templates/yoo_monday/css/custom.css'},{href:'https://other.invalid/templates/foreign.css'}],querySelector:()=>null};
  const window={addEventListener:(name,callback)=>events[name]=callback,scrollY:300,scrollTo:data=>scrolls.push(data),matchMedia:()=>({matches:true})};
  vm.runInNewContext(fs.readFileSync(path.resolve(__dirname,'../../joomla/mod_antidrone_design/media/embed.js'),'utf8'),{document,window,location:{href:'https://fixture.invalid/article',origin:'https://fixture.invalid'},URL,Number,getComputedStyle:()=>({fontFamily:'Open Sans',color:'#333'})});
  assert.equal(messages[0].data.host.enabled,false);assert.deepEqual([...messages[0].data.styles],['https://fixture.invalid/templates/yoo_monday/css/custom.css']);
  const dispatch=(data,source=frame.contentWindow,origin='https://fixture.invalid')=>events.message({data,source,origin});
  dispatch({type:'antidrone:size',height:800}, {}, 'https://fixture.invalid');
  dispatch({type:'antidrone:size',height:800},frame.contentWindow,'https://other.invalid');
  dispatch({type:'antidrone:size',height:60000});dispatch({type:'antidrone:size',height:NaN});assert.equal(frame.style.height,undefined);
  dispatch({type:'antidrone:size',height:800.5});assert.equal(frame.style.height,'801px');
  dispatch({type:'antidrone:scroll',offset:1001});assert.equal(scrolls.length,0);
  dispatch({type:'antidrone:scroll',offset:250});assert.equal(scrolls[0].top,638);assert.equal(scrolls[0].behavior,'instant');
});

function fixture(){
  const messages=[],calls=[],events={},context={querySelector:()=>null};
  const frame={contentWindow:{postMessage:data=>messages.push(data)},style:{},clientHeight:1000,closest:()=>context,getAttribute:key=>({'data-endpoint':'/upload.php','data-transport':'site-form','data-module-id':'42','data-requests':'1'}[key]),addEventListener:()=>{}};
  const window={addEventListener:(name,callback)=>events[name]=callback,jQuery:{ajax:options=>{const call={options};calls.push(call);return {done:fn=>{call.done=fn;return {fail:fn=>{call.fail=fn;}};}};}}};
  const document={readyState:'complete',querySelectorAll:q=>q.startsWith('iframe')?[frame]:[],querySelector:()=>null};
  vm.runInNewContext(fs.readFileSync(path.resolve(__dirname,'../../joomla/mod_antidrone_design/media/embed.js'),'utf8'),{document,window,location:{href:'https://fixture.invalid/article',origin:'https://fixture.invalid'},URL,URLSearchParams,Number,getComputedStyle:()=>({fontFamily:'Open Sans',color:'#333'})});
  const fields={'DATA[NAME]':'','DATA[PHONE_WORK]':'','DATA[EMAIL_WORK]':'fixture@example.invalid','DATA[COMMENTS]':'Local test only'};
  const send=(changes={},source=frame.contentWindow,origin='https://fixture.invalid')=>events.message({data:{type:'antidrone:submit',requestId:'a'.repeat(36),fields,...changes},source,origin});
  return {messages,calls,window,frame,fields,send};
}
test('parent uses existing jQuery GET protocol and deduplicates pending and completed requests',()=>{
  const f=fixture();assert.equal(f.messages[0].host.transport,'site-form');assert.equal(f.messages[0].host.enabled,true);
  f.send({}, {}, 'https://fixture.invalid');f.send({},f.frame.contentWindow,'https://foreign.invalid');assert.equal(f.calls.length,0);
  f.send();f.send();assert.equal(f.calls.length,1);
  const call=f.calls[0];assert.equal(call.options.type,'GET');assert.equal(call.options.url,'https://fixture.invalid/upload.php');
  const query=new URLSearchParams(call.options.data);assert.equal(query.get('DATA[EMAIL_WORK]'),'fixture@example.invalid');assert.equal(query.get('files_data'),'');assert.equal(query.has('submit'),true);
  call.done('');f.send();assert.equal(f.calls.length,1);assert.equal(f.messages.at(-1).success,true);assert.equal(f.messages.at(-1).id,undefined);
  f.send({fields:{...f.fields,'DATA[COMMENTS]':'Changed'}});assert.equal(f.messages.at(-1).success,false);assert.equal(f.calls.length,1);
});
test('HTTP/business failures remain failures and can retry; uncertain network requests do not repeat',()=>{
  for(const response of ['{"status":"error"}',{success:false}]){
    const f=fixture();f.send();f.calls[0].done(response);assert.equal(f.messages.at(-1).success,false);f.send();assert.equal(f.calls.length,2);
  }
  const f=fixture();f.send();f.calls[0].fail({status:503});assert.equal(f.messages.at(-1).success,false);f.send();assert.equal(f.calls.length,2);
  f.calls[1].fail({status:0});f.send();assert.equal(f.calls.length,2);assert.equal(f.messages.at(-1).success,false);
});
test('missing host script, malformed fields and oversized GET requests never send',()=>{
  const f=fixture();f.send({fields:{...f.fields,extra:'bad'}});assert.equal(f.calls.length,0);
  f.send({fields:{...f.fields,'DATA[COMMENTS]':'я'.repeat(2000)}});assert.equal(f.calls.length,0);assert.equal(f.messages.at(-1).success,false);
  delete f.window.jQuery;f.send();assert.equal(f.calls.length,0);assert.equal(f.messages.at(-1).success,false);
});
