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
