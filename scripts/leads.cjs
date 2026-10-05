// Local administrator CLI. It deliberately has no public HTTP endpoint.
const path=require('node:path');
const {existsSync,writeFileSync}=require('node:fs');
const {loadEnvFile}=require('node:process');
if(existsSync('.env.local'))loadEnvFile('.env.local');
const store=require('../.local/runtime/lib/leads/store.js');
const [command='status',value,output]=process.argv.slice(2);
async function main(){
  if(command==='status')console.log(JSON.stringify(store.queueStatus(),null,2));
  else if(command==='list')console.log(JSON.stringify(store.listLeads(),null,2));
  else if(command==='export'||command==='configuration'){
    if(!value||!output)throw new Error('Usage: '+command+' <lead-ID> <private-output.json>');
    const lead=store.readLead(value);if(!lead)throw new Error('Lead not found');
    const payload=command==='configuration'?lead.payload.configuration:lead;
    if(!payload)throw new Error('No configuration attached');
    // Explicit path and exclusive creation; do not overwrite another file.
    const resolved=path.resolve(output),relative=path.relative(path.join(process.cwd(),'public'),resolved);
    if(!relative.startsWith('..')&&!path.isAbsolute(relative))throw new Error('Private output required');
    writeFileSync(resolved,JSON.stringify(payload,null,2),{flag:'wx',mode:0o600});
    console.log('Export written to the specified private path.');
  }else if(command==='backup'){
    if(!value)throw new Error('Usage: backup <private-backup.sqlite>');
    await store.backupLeads(value);console.log('Consistent SQLite backup created.');
  }else if(command==='delete'){
    if(!value)throw new Error('Usage: delete <lead-ID>');
    console.log('Deleted records: '+store.deleteLead(value));
  }else if(command==='worker'){store.pruneExpired();await store.deliverNotifications();console.log(JSON.stringify(store.queueStatus(),null,2));}
  else if(command==='retry-failed'){console.log('Reset failed notifications: '+store.retryFailed());}
  else throw new Error('Commands: status, list, export, configuration, delete, worker, retry-failed, backup');
}
main().catch(()=>{console.error('Lead operation failed. Check command, private path and database access.');process.exitCode=1;});
