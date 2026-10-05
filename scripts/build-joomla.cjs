// Compile a self-contained Joomla module in an isolated copy, without server data.
const fs = require('node:fs');
const path = require('node:path');
const {execFileSync, spawnSync} = require('node:child_process');
const {createHash} = require('node:crypto');
const root = path.resolve(__dirname, '..');
const tag = new Date().toISOString().replace(/[-:]/g, '').replace(/\..*/, '').replace('T', '-');
const work = path.join(root, '.local/joomla', tag);
const project = path.join(work, 'source');
const stage = path.join(work, 'mod_antidrone_design');
const basePath = '/media/mod_antidrone_design/app';
fs.mkdirSync(project, {recursive:true});
const paths = execFileSync('git', ['ls-files','--cached','--others','--exclude-standard','-z'], {cwd:root}).toString('utf8').split('\0').filter(Boolean);
for (const file of new Set(paths)) {
  if (file.startsWith('app/api/') || file === 'next.config.ts') continue;
  if (/(^|\/)(\.local|\.next|node_modules|data|private|uploads|\.git)\/|(^|\/)\.env(?!\.example$)|\.(db|sqlite|sqlite3|log|tsbuildinfo)(-|$)/.test(file)) throw Error('Private source path: ' + file);
  if (!fs.existsSync(path.join(root,file))) continue;
  const dest = path.join(project,file); fs.mkdirSync(path.dirname(dest), {recursive:true}); fs.copyFileSync(path.join(root,file),dest);
}
fs.symlinkSync(path.join(root,'node_modules'), path.join(project,'node_modules'), process.platform === 'win32' ? 'junction' : 'dir');
fs.writeFileSync(path.join(project,'next.config.ts'), 'export default ' + JSON.stringify({output:'export',basePath,trailingSlash:true,poweredByHeader:false,images:{unoptimized:true},turbopack:{root}},null,2) + ';\n');
const env = {...process.env,BUILD_PORTABLE:'',NEXT_PUBLIC_BASE_PATH:basePath,NEXT_PUBLIC_JOOMLA_EMBED:'true',NEXT_PUBLIC_REVIEW_MODE:'false',NEXT_TELEMETRY_DISABLED:'1'};
const build = spawnSync(process.execPath, [path.join(root,'node_modules/next/dist/bin/next'),'build'], {cwd:project,env,stdio:'inherit',windowsHide:true});
if (build.error) throw build.error; if (build.status !== 0) process.exit(build.status || 1);
const output = path.join(project,'out');
fs.cpSync(path.join(root,'joomla/mod_antidrone_design'),stage,{recursive:true});
fs.cpSync(output,path.join(stage,'media/app'),{recursive:true});
// Preserve the open-source runtime licenses; the proprietary host template is not bundled.
fs.mkdirSync(path.join(stage,'licenses'),{recursive:true});
for (const pkg of ['next','react','react-dom','three','@react-three/fiber']) {
  const dir = path.join(root,'node_modules',pkg);
  for (const file of fs.readdirSync(dir).filter(f=>/^license/i.test(f))) fs.copyFileSync(path.join(dir,file),path.join(stage,'licenses',pkg.replaceAll('/','-')+'-'+file));
}
const downloads = process.env.JOOMLA_OUTPUT_DIR || path.join(process.env.USERPROFILE || process.env.HOME,'Downloads');
fs.mkdirSync(downloads,{recursive:true});
const zip = path.join(downloads,'mod_antidrone_design-joomla-3.10.12-'+tag+'.zip');
if (process.platform !== 'win32') throw Error('This packaging command uses Windows PowerShell.');
execFileSync('powershell.exe',['-NoProfile','-File',path.join(root,'scripts/package-joomla.ps1')],{env:{...process.env,ANTIDRONE_STAGE:stage,ANTIDRONE_ZIP:zip},windowsHide:true});
const sha256 = createHash('sha256').update(fs.readFileSync(zip)).digest('hex');
fs.writeFileSync(zip+'.sha256',sha256+'  '+path.basename(zip)+'\n');
fs.writeFileSync(path.join(root,'.local/joomla/latest.json'),JSON.stringify({work,project,stage,output,basePath,zip,sha256},null,2));
console.log('Joomla module ready: '+zip+'\nSHA256: '+sha256);
