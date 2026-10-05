// Run on the build PC: node scripts/package-portable.cjs. No Git/npm needed by recipient.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const {execFileSync, spawnSync} = require('node:child_process');
const root = path.resolve(__dirname, '..');
const version = '24.14.1';
const nodeName = 'node-v' + version + '-win-x64';
const nodeUrl = 'https://nodejs.org/dist/v' + version + '/';
const tag = new Date().toISOString().replace(/[-:]/g,'').replace(/\..*/, '').replace('T','-');
let work = path.join(root, '.local', 'portable', tag);
const packageName = 'Topengineer-Windows-x64';
let pack = path.join(work, packageName);
const psQuote = value => "'" + value.replace(/'/g,"''") + "'";
const sha = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const write = (file,text) => {fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,text);};
function run(file,args,env=process.env) {
  const result=spawnSync(file,args,{cwd:root,env,stdio:'inherit',windowsHide:true});
  if(result.error)throw result.error;
  if(result.status!==0)throw new Error(file+' exited '+result.status);
}
function powershell(code) {run(path.join(process.env.SystemRoot,'System32','WindowsPowerShell','v1.0','powershell.exe'),['-NoProfile','-NonInteractive','-Command',"$ErrorActionPreference='Stop'; "+code]);}
function sourcePaths() {
  const list=execFileSync('git',['ls-files','--cached','--others','--exclude-standard','-z'],{cwd:root}).toString('utf8').split('\0').filter(Boolean);
  return [...new Set(list)].filter(file=>fs.existsSync(path.join(root,file))).sort();
}
async function main() {
  if(process.platform!=='win32'||process.arch!=='x64')throw new Error('Build on Windows x64.');
  if(process.argv.includes('--repack')) {
    const previous=JSON.parse(fs.readFileSync(path.join(root,'.local/portable/latest.json'),'utf8'));
    pack=previous.folder;
    const relative=path.relative(path.join(root,'.local/portable'),pack);
    if(relative.startsWith('..')||path.isAbsolute(relative))throw new Error('Package outside build directory');
    work=path.join(root,'.local/portable',tag);
    fs.mkdirSync(work,{recursive:true});
    refreshSource();
    finalize(previous.nodeSha256);
    return;
  }
  fs.mkdirSync(pack,{recursive:true});
  console.log('Downloading official Node '+version+' and checking SHA256…');
  const sumsResponse=await fetch(nodeUrl+'SHASUMS256.txt',{signal:AbortSignal.timeout(60000)});
  if(!sumsResponse.ok)throw new Error('Could not fetch Node checksums');
  const sums=await sumsResponse.text();
  const expected=sums.split('\n').find(line=>line.trim().endsWith(' '+nodeName+'.zip'))?.split(/\s+/)[0];
  if(!expected)throw new Error('Node archive checksum not found');
  const zipResponse=await fetch(nodeUrl+nodeName+'.zip',{signal:AbortSignal.timeout(120000)});
  if(!zipResponse.ok)throw new Error('Could not fetch Node archive');
  const nodeZip=path.join(work,nodeName+'.zip');
  fs.writeFileSync(nodeZip,Buffer.from(await zipResponse.arrayBuffer()));
  if(sha(nodeZip)!==expected)throw new Error('Node archive SHA256 mismatch');
  write(path.join(work,'SHASUMS256.txt'),sums);
  const nodeExtract=path.join(work,'node-extract');
  powershell('Add-Type -AssemblyName System.IO.Compression.FileSystem; [System.IO.Compression.ZipFile]::ExtractToDirectory('+psQuote(nodeZip)+','+psQuote(nodeExtract)+')');
  fs.cpSync(path.join(nodeExtract,nodeName),path.join(pack,'runtime'),{recursive:true});
  console.log('Building standalone website…');
  run(process.execPath,[path.join(root,'node_modules/next/dist/bin/next'),'build'],{...process.env,BUILD_PORTABLE:'true',NEXT_TELEMETRY_DISABLED:'1'});
  run(process.execPath,[path.join(root,'node_modules/typescript/bin/tsc'),'-p','tsconfig.tests.json','--outDir','.local/runtime']);
  const portableTrace=file=>!path.basename(file).startsWith('.env')&&!path.relative(path.join(root,'.next/standalone'),file).split(path.sep).some(part=>['.local','data','private','uploads'].includes(part))&&!/\.(sqlite|sqlite3|db|log)(-|$)/.test(file);
  fs.cpSync(path.join(root,'.next/standalone'),path.join(pack,'app'),{recursive:true,filter:portableTrace});
  fs.cpSync(path.join(root,'.next/static'),path.join(pack,'app/.next/static'),{recursive:true});
  fs.cpSync(path.join(root,'public'),path.join(pack,'app/public'),{recursive:true});
  fs.cpSync(path.join(root,'.local/runtime'),path.join(pack,'app/.local/runtime'),{recursive:true});
  fs.mkdirSync(path.join(pack,'app/scripts'),{recursive:true});
  fs.copyFileSync(path.join(root,'scripts/leads.cjs'),path.join(pack,'app/scripts/leads.cjs'));
  refreshSource();
  function copyLicenses(folder) {
    for(const entry of fs.readdirSync(folder,{withFileTypes:true})) {
      const file=path.join(folder,entry.name);
      if(entry.isDirectory())copyLicenses(file);
      else if(entry.isFile()&&/^(licen[sc]e|copying|notice|copyright)([.-]|$)/i.test(entry.name)) {
        const dest=path.join(pack,'licenses',path.relative(path.join(root,'node_modules'),file));fs.mkdirSync(path.dirname(dest),{recursive:true});fs.copyFileSync(file,dest);
      }
    }
  }
  copyLicenses(path.join(root,'node_modules'));
  finalize(expected);
}
function refreshSource() {
  for(const name of ['START.cmd','LEADS.cmd','launcher.cjs','README.txt']) {
    const content=fs.readFileSync(path.join(root,'scripts/portable',name),'utf8');
    write(path.join(pack,name),name.endsWith('.cmd')?content.replace(/\r?\n/g,'\r\n'):content);
  }
  for(const file of sourcePaths()) {
    if(/(^|\/)(\.local|\.next|node_modules|data|private|uploads|\.git)\/|(^|\/)\.env(?!\.example$)|\.(db|sqlite|sqlite3|log|tsbuildinfo)(-|$)/.test(file))throw new Error('Private source path: '+file);
    const dest=path.join(pack,'source',file);fs.mkdirSync(path.dirname(dest),{recursive:true});fs.copyFileSync(path.join(root,file),dest);
  }
}
function finalize(expected) {
  const files=[];
  function inventory(folder) {
    for(const entry of fs.readdirSync(folder,{withFileTypes:true})) {
      const file=path.join(folder,entry.name);
      if(entry.isDirectory())inventory(file);
      else if(entry.isFile()) {
        const relative=path.relative(pack,file).replace(/\\/g,'/');
        if(relative==='manifest.json')continue;
        if(entry.name.startsWith('.env')&&entry.name!=='.env.example')throw new Error('Environment file in package: '+relative);
        if(/\.(sqlite|sqlite3|db)(-|$)/.test(relative))throw new Error('Database in package: '+relative);
        files.push({path:relative,bytes:fs.statSync(file).size,sha256:sha(file)});
      } else throw new Error('Unsupported link in package: '+file);
    }
  }
  inventory(pack);
  const manifest={createdAt:new Date().toISOString(),target:'Windows 10/11 x64',sourceBase:execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),sourceIncludesLocalPackagingChanges:true,node:{version,archiveUrl:nodeUrl+nodeName+'.zip',sha256:expected},nextVersion:JSON.parse(fs.readFileSync(path.join(root,'node_modules/next/package.json'),'utf8')).version,files};
  write(path.join(pack,'manifest.json'),JSON.stringify(manifest,null,2));
  const output=path.join(work,packageName+'-'+tag+'.zip');
  powershell('Add-Type -AssemblyName System.IO.Compression.FileSystem; [System.IO.Compression.ZipFile]::CreateFromDirectory('+psQuote(pack)+','+psQuote(output)+',[System.IO.Compression.CompressionLevel]::Optimal,$true)');
  write(output+'.sha256',sha(output)+'  '+path.basename(output)+'\n');
  write(path.join(root,'.local/portable/latest.json'),JSON.stringify({archive:output,folder:pack,work,nodeSha256:expected,archiveSha256:sha(output)},null,2));
  console.log('Archive ready: '+output+'\nSHA256: '+sha(output));
}
main().catch(error=>{console.error(error);process.exitCode=1;});
