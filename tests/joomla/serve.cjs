// Local integration fixture only, using the site's actual template CSS.
const fs=require('node:fs'), path=require('node:path'), http=require('node:http');
const root=path.resolve(__dirname,'../..');
const build=JSON.parse(fs.readFileSync(path.join(root,'.local/joomla/latest.json'),'utf8'));
const base=path.join(build.stage,'media');
const types={'.html':'text/html; charset=utf-8','.js':'application/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.txt':'text/plain; charset=utf-8','.json':'application/json','.woff':'font/woff','.woff2':'font/woff2'};
const styles=['bootstrap.css','bootstrap-grid.min.css','theme.css','custom.css','zakaz.css'];
const requests=[];
http.createServer(async(req,res)=>{
  try {
    const url=new URL(req.url,'http://127.0.0.1:3152');
    if(url.pathname==='/__fixture/requests') {res.setHeader('Content-Type','application/json');res.end(JSON.stringify(requests));return;}
    if(url.pathname==='/upload.php') {
      if(req.method!=='GET'||!url.searchParams.has('submit')) {res.writeHead(400);res.end('error');return;}
      const fields=Object.fromEntries(['DATA[NAME]','DATA[PHONE_WORK]','DATA[EMAIL_WORK]','DATA[COMMENTS]','files_data'].map(key=>[key,url.searchParams.get(key)]));
      requests.push({method:req.method,fields});
      if(fields['DATA[COMMENTS]']?.includes('fixture-reject')) {res.writeHead(503);res.end('Fixture error');return;}
      res.setHeader('Content-Type','text/plain');res.end('');return;
    }
    if(url.pathname==='/') {
      res.setHeader('Content-Type','text/html; charset=utf-8');
      res.end('<!DOCTYPE html><html lang="ru"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Joomla 3.10.12 — проверка модуля</title>'+styles.map(f=>'<link rel="stylesheet" href="/templates/yoo_monday/css/'+f+'">').join('')+'<link rel="stylesheet" href="/media/mod_antidrone_design/embed.css"><script src="https://ajax.googleapis.com/ajax/libs/jquery/1.12.0/jquery.min.js"></script><script src="https://topengineer.ru/media/jui/js/bootstrap.min.js"></script><style>body{margin:0}header{background:#47494f;border-bottom:4px solid #ff5000;padding:16px;color:white}main{max-width:1200px;margin:auto;padding:10px}h2.fixture{margin:10px 0}</style><header>Локальная проверка: заявки не отправляются в компанию</header><a href="#fixture-end">Показать нижнюю форму</a><main><article class="uk-article"><h2 class="fixture">Проектирование антидроновой защиты</h2><div class="antidrone-design-module"><iframe title="Проверка модуля Joomla" src="/media/mod_antidrone_design/app/joomla/" height="1200" data-antidrone-frame data-module-id="42" data-transport="site-form" data-requests="1" data-endpoint="/upload.php"></iframe></div></article></main><div id="fixture-end"></div><script src="/media/mod_antidrone_design/embed.js"></script></html>');return;
    }
    if(url.pathname.startsWith('/templates/yoo_monday/')) {
      // Fetch source styles for this local fixture; never add the proprietary template to the module ZIP.
      const remote=await fetch('https://topengineer.ru'+url.pathname);
      res.writeHead(remote.status,{'Content-Type':remote.headers.get('content-type')||'text/css'});res.end(Buffer.from(await remote.arrayBuffer()));return;
    }
    if(!url.pathname.startsWith('/media/mod_antidrone_design/')) {res.writeHead(404);res.end();return;}
    const relative=decodeURIComponent(url.pathname.slice('/media/mod_antidrone_design/'.length));
    let target=path.resolve(base,relative);
    if(!target.startsWith(base+path.sep)){res.writeHead(403);res.end();return;}
    if(fs.existsSync(target)&&fs.statSync(target).isDirectory())target=path.join(target,'index.html');
    if(!fs.existsSync(target)){res.writeHead(404);res.end();return;}
    res.setHeader('Content-Type',types[path.extname(target)]||'application/octet-stream');fs.createReadStream(target).pipe(res);
  }catch(e){res.writeHead(500);res.end('Fixture unavailable');}
}).listen(3152,'127.0.0.1',()=>console.log('Joomla integration fixture: http://127.0.0.1:3152/'));
