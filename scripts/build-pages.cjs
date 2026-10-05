// Build the public review in an isolated copy; leave the ordinary server intact.
const fs=require('node:fs');
const path=require('node:path');
const {execFileSync,spawnSync}=require('node:child_process');
const root=path.resolve(__dirname,'..');
const tag=new Date().toISOString().replace(/[-:]/g,'').replace(/\..*/,'').replace('T','-');
const work=path.join(root,'.local/pages',tag);
const project=path.join(work,'source');
const basePath='/antidrone-landing';
fs.mkdirSync(project,{recursive:true});
const paths=execFileSync('git',['ls-files','--cached','--others','--exclude-standard','-z'],{cwd:root}).toString('utf8').split('\0').filter(Boolean);
for(const file of new Set(paths)){
  if(file.startsWith('app/api/')||file==='next.config.ts')continue;
  if(/(^|\/)(\.local|\.next|node_modules|data|private|uploads|\.git)\/|(^|\/)\.env(?!\.example$)|\.(db|sqlite|sqlite3|log|tsbuildinfo)(-|$)/.test(file))throw Error('Private source path: '+file);
  if(!fs.existsSync(path.join(root,file)))continue;
  const destination=path.join(project,file);fs.mkdirSync(path.dirname(destination),{recursive:true});fs.copyFileSync(path.join(root,file),destination);
}
fs.symlinkSync(path.join(root,'node_modules'),path.join(project,'node_modules'),process.platform==='win32'?'junction':'dir');
fs.writeFileSync(path.join(project,'next.config.ts'),'export default '+JSON.stringify({output:'export',basePath,trailingSlash:true,poweredByHeader:false,images:{unoptimized:true},turbopack:{root}},null,2)+';\n');
const env={...process.env,BUILD_PORTABLE:'',NEXT_PUBLIC_BASE_PATH:basePath,NEXT_PUBLIC_REVIEW_MODE:'true',NEXT_TELEMETRY_DISABLED:'1'};
const result=spawnSync(process.execPath,[path.join(root,'node_modules/next/dist/bin/next'),'build'],{cwd:project,env,stdio:'inherit',windowsHide:true});
if(result.error)throw result.error;if(result.status!==0)process.exit(result.status||1);
const output=path.join(project,'out');
fs.writeFileSync(path.join(output,'.nojekyll'),'');
fs.writeFileSync(path.join(output,'review-build.json'),JSON.stringify({createdAt:new Date().toISOString(),basePath,reviewMode:true,sourceBase:execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim()},null,2));
fs.mkdirSync(path.join(root,'.local/pages'),{recursive:true});
fs.writeFileSync(path.join(root,'.local/pages/latest.json'),JSON.stringify({work,project,output,basePath},null,2));
console.log('Pages review ready: '+output);
