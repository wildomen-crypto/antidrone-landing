const {test}=require('node:test');
const assert=require('node:assert/strict');
const {randomUUID}=require('node:crypto');
const {mkdirSync}=require('node:fs');
const path=require('node:path');
const {DatabaseSync}=require('node:sqlite');
process.env.DATA_DIR=path.join(process.cwd(),'.local','unit-leads',randomUUID());mkdirSync(process.env.DATA_DIR,{recursive:true});
delete process.env.NOTIFICATION_WEBHOOK_URL;
const store=require('../../.local/test-build/lib/leads/store.js');
const payload={name:'QA',contact:'qa@example.com',region:'',comment:'Synthetic local test',consentVersion:'test',configuration:null,summary:null};
test('lead and outbox are durable, retry returns same ID, mutation conflicts',()=>{
  const key=randomUUID(),first=store.saveLead(key,payload),second=store.saveLead(key,payload);
  assert.equal(first.duplicate,false);assert.equal(second.duplicate,true);assert.equal(first.id,second.id);
  assert.throws(()=>store.saveLead(key,{...payload,name:'changed'}),/IDEMPOTENCY_CONFLICT/);
  const reader=new DatabaseSync(path.join(process.env.DATA_DIR,'leads.sqlite'),{readOnly:true});
  assert.equal(reader.prepare('SELECT count(*) n FROM leads').get().n,1);
  assert.equal(reader.prepare('SELECT count(*) n FROM outbox').get().n,1);reader.close();
});
test('notification failure does not lose lead; subsequent delivery keeps stable ID',async()=>{
  const reader=new DatabaseSync(path.join(process.env.DATA_DIR,'leads.sqlite'));
  await store.deliverNotifications();assert.equal(reader.prepare('SELECT attempts FROM outbox').get().attempts,0);
  process.env.NOTIFICATION_WEBHOOK_URL='http://127.0.0.1/not-used';
  const original=global.fetch;global.fetch=async()=>{throw new Error('simulated receiver outage');};
  await store.deliverNotifications();assert.equal(reader.prepare('SELECT status,attempts FROM outbox').get().status,'pending');
  assert.equal(reader.prepare('SELECT count(*) n FROM leads').get().n,1);
  let sent;global.fetch=async(_url,options)=>{sent=JSON.parse(options.body);return {ok:true};};
  reader.prepare("UPDATE outbox SET next_attempt_at=0").run();
  await store.deliverNotifications();
  assert.equal(sent.leadId,reader.prepare('SELECT id FROM leads').get().id);
  assert.equal(reader.prepare('SELECT status FROM outbox').get().status,'sent');
  global.fetch=original;reader.close();delete process.env.NOTIFICATION_WEBHOOK_URL;
});
test('rate limit and retention remove dependent outbox records',()=>{
  for(let i=0;i<8;i++)assert.equal(store.allowedRate('unit-client'),true);
  assert.equal(store.allowedRate('unit-client'),false);
  const reader=new DatabaseSync(path.join(process.env.DATA_DIR,'leads.sqlite'));
  reader.prepare("UPDATE leads SET created_at='2000-01-01T00:00:00.000Z'").run();
  store.pruneExpired();assert.equal(reader.prepare('SELECT count(*) n FROM leads').get().n,0);assert.equal(reader.prepare('SELECT count(*) n FROM outbox').get().n,0);reader.close();
});
test('backup is a coherent standalone database and refuses overwrite/public path',async()=>{
  const key=randomUUID(),lead=store.saveLead(key,payload),target=path.join(process.env.DATA_DIR,'backup.sqlite');
  await store.backupLeads(target);
  const snapshot=new DatabaseSync(target,{readOnly:true});
  assert.equal(snapshot.prepare('PRAGMA integrity_check').get().integrity_check,'ok');
  assert.equal(snapshot.prepare('SELECT id FROM leads').get().id,lead.id);snapshot.close();
  await assert.rejects(store.backupLeads(target),/BACKUP_ALREADY_EXISTS/);
  await assert.rejects(store.backupLeads(path.join(process.cwd(),'public','leads.sqlite')),/PRIVATE_PATH_REQUIRED/);
  assert.equal(store.deleteLead(lead.id),1);assert.equal(store.readLead(lead.id),null);
});
