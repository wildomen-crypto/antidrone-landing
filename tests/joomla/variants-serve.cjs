// Test-only Joomla host: no company requests or production writes.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const root=path.resolve(__dirname,'../..');
const build=JSON.parse(fs.readFileSync(path.join(root,'.local/joomla/latest.json'),'utf8'));
const media=path.join(build.stage,'media'),variants=path.join(root,'joomla/design-variants');
const types={'.html':'text/html; charset=utf-8','.js':'application/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.woff':'font/woff','.woff2':'font/woff2'};
const requests=[];
http.createServer(async(req,res)=>{
 try{
  const url=new URL(req.url,'http://127.0.0.1:3153');
  if(url.pathname==='/__fixture/requests'){res.setHeader('Content-Type','application/json');res.end(JSON.stringify(requests));return;}
  if(url.pathname==='/standalone'){res.setHeader('Content-Type','text/html; charset=utf-8');res.end(fs.readFileSync(path.join(build.output,'index.html')));return;}
  if(url.pathname==='/upload.php'){
   if(req.method!=='GET'||!url.searchParams.has('submit')){res.writeHead(400);res.end('error');return;}
   requests.push({method:req.method,fields:Object.fromEntries(url.searchParams)});res.end('');return;
  }
  if(['navigation','examples','workspace'].includes(url.pathname.slice(1))){
   const variant=url.pathname.slice(1),snippet=fs.readFileSync(path.join(variants,'article.template.html'),'utf8').replace('{{variant}}',variant);
   res.setHeader('Content-Type','text/html; charset=utf-8');
   const hostFile=path.join(root,'.local/design-variants/host-before.html');
   if(!fs.existsSync(hostFile))throw Error('Capture the public host HTML before running this fixture.');
   const host=fs.readFileSync(hostFile,'utf8').replace(/<script[^>]+src="[^"]*\/media\/mod_antidrone_design\/embed\.js[^>]*><\/script>/g,'');
   res.end(host.replace(/<article\b[^>]*>[\s\S]*?<\/article>/i,'<article class="uk-article tm-article tm-article-box">'+snippet+'</article>')
    .replace(/<base\s+href="[^"]*"\s*\/?\s*>/i,'<base href="http://127.0.0.1:3153/">')
    .replace(/<title>[\s\S]*?<\/title>/,'<title>Локальная проверка '+variant+' — заявки не отправляются в компанию</title>'));return;
  }
  if(url.pathname.startsWith('/templates/yoo_monday/')){const remote=await fetch('https://topengineer.ru'+url.pathname);res.writeHead(remote.status,{'Content-Type':remote.headers.get('content-type')||'text/css'});res.end(Buffer.from(await remote.arrayBuffer()));return;}
  let base,relative;
  if(url.pathname.startsWith('/media/antidrone-layouts/v1/')){base=variants;relative=url.pathname.slice('/media/antidrone-layouts/v1/'.length);}
  else if(url.pathname.startsWith('/media/mod_antidrone_design/')){base=media;relative=url.pathname.slice('/media/mod_antidrone_design/'.length);}
  else if(/\.(css|js|png|jpg|jpeg|gif|svg|woff|woff2|ttf|ico)$/i.test(url.pathname)){
   const remote=await fetch('https://topengineer.ru'+url.pathname);
   res.writeHead(remote.status,{'Content-Type':remote.headers.get('content-type')||'application/octet-stream'});res.end(Buffer.from(await remote.arrayBuffer()));return;
  }
  else{res.writeHead(404);res.end();return;}
  let target=path.resolve(base,decodeURIComponent(relative));
  if(!target.startsWith(base+path.sep)){res.writeHead(403);res.end();return;}
  if(fs.existsSync(target)&&fs.statSync(target).isDirectory())target=path.join(target,'index.html');
  if(!fs.existsSync(target)){res.writeHead(404);res.end();return;}
  res.setHeader('Content-Type',types[path.extname(target)]||'application/octet-stream');fs.createReadStream(target).pipe(res);
 }catch(e){res.writeHead(500);res.end('Fixture unavailable');}
}).listen(3153,'127.0.0.1',()=>console.log('Variants fixture: http://127.0.0.1:3153/navigation'));
