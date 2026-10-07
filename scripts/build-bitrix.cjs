// A static export for the single Bitrix article. No engine/template files are bundled.
const fs=require('node:fs'),path=require('node:path');
const {execFileSync,spawnSync}=require('node:child_process');
const {createHash}=require('node:crypto');
const root=path.resolve(__dirname,'..');
const tag=new Date().toISOString().replace(/[-:]/g,'').replace(/\..*/,'').replace('T','-');
const work=path.join(root,'.local/bitrix',tag),project=path.join(work,'source'),stage=path.join(work,'antidrone-design');
const basePath='/local/antidrone-design/app';
fs.mkdirSync(project,{recursive:true});
const files=execFileSync('git',['ls-files','--cached','--others','--exclude-standard','-z'],{cwd:root}).toString('utf8').split('\0').filter(Boolean);
for(const file of new Set(files)) {
  if(file.startsWith('app/api/') || file==='next.config.ts')continue;
  if(/(^|\/)(\.local|\.next|node_modules|data|private|uploads|\.git)\/|(^|\/)\.env(?!\.example$)|\.(db|sqlite|sqlite3|log|tsbuildinfo)(-|$)/.test(file))throw Error('Private path: '+file);
  const src=path.join(root,file);if(!fs.existsSync(src))continue;
  const dst=path.join(project,file);fs.mkdirSync(path.dirname(dst),{recursive:true});fs.copyFileSync(src,dst);
}
fs.symlinkSync(path.join(root,'node_modules'),path.join(project,'node_modules'),process.platform==='win32'?'junction':'dir');
fs.writeFileSync(path.join(project,'next.config.ts'),'export default '+JSON.stringify({output:'export',basePath,trailingSlash:true,poweredByHeader:false,images:{unoptimized:true},turbopack:{root}},null,2)+';\n');
const env={...process.env,BUILD_PORTABLE:'',NEXT_PUBLIC_BASE_PATH:basePath,NEXT_PUBLIC_JOOMLA_EMBED:'true',NEXT_PUBLIC_REVIEW_MODE:'false',NEXT_TELEMETRY_DISABLED:'1'};
const build=spawnSync(process.execPath,[path.join(root,'node_modules/next/dist/bin/next'),'build'],{cwd:project,env,stdio:'inherit',windowsHide:true});
if(build.error)throw build.error;if(build.status!==0)process.exit(build.status||1);
fs.mkdirSync(stage,{recursive:true});
fs.cpSync(path.join(project,'out'),path.join(stage,'app'),{recursive:true});
for(const file of ['host.css','bridge.js'])fs.copyFileSync(path.join(root,'bitrix',file),path.join(stage,file));
const theme=path.join(stage,'theme');fs.mkdirSync(theme);
for(const file of ['frame.css','theme-frame.css','variants.js','industrial-enclosed-1672.webp','industrial-enclosed-960.webp'])fs.copyFileSync(path.join(root,'joomla/design-variants/industrial-20261006',file),path.join(theme,file));
fs.copyFileSync(path.join(root,'bitrix/antidrin.php'),path.join(work,'antidrin.php'));
fs.mkdirSync(path.join(stage,'licenses'));
for(const pkg of ['next','react','react-dom','three','@react-three/fiber'])for(const file of fs.readdirSync(path.join(root,'node_modules',pkg)).filter(f=>/^license/i.test(f)))fs.copyFileSync(path.join(root,'node_modules',pkg,file),path.join(stage,'licenses',pkg.replaceAll('/','-')+'-'+file));
const manifest=[];
function walk(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,e.name);if(e.isDirectory())walk(p);else manifest.push({path:path.relative(stage,p).replaceAll('\\','/'),bytes:fs.statSync(p).size,sha256:createHash('sha256').update(fs.readFileSync(p)).digest('hex')});}}
walk(stage);
fs.writeFileSync(path.join(work,'manifest.json'),JSON.stringify(manifest,null,2));
fs.writeFileSync(path.join(root,'.local/bitrix/latest.json'),JSON.stringify({work,project,stage,basePath},null,2));
console.log('Bitrix article prepared: '+work+'; '+manifest.length+' resources.');
