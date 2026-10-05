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

test('separate phone and email accept either or both, trim whitespace and preserve both in storage',()=>{
  const {parseLeadContacts}=require('../../.local/test-build/lib/leads/contact.js');
  assert.deepEqual(parseLeadContacts({phone:' +7 (900) 123-45-67 ',email:''}),{phone:'+7 (900) 123-45-67',email:'',contact:'+7 (900) 123-45-67'});
  assert.deepEqual(parseLeadContacts({phone:'',email:' qa@example.invalid '}),{phone:'',email:'qa@example.invalid',contact:'qa@example.invalid'});
  const contacts=parseLeadContacts({phone:'+7 (900) 123-45-67',email:'qa@example.invalid'});
  assert.deepEqual(contacts,{phone:'+7 (900) 123-45-67',email:'qa@example.invalid',contact:'+7 (900) 123-45-67 · qa@example.invalid'});
  const lead=store.saveLead(randomUUID(),{...payload,...contacts});
  const saved=store.readLead(lead.id).payload;
  assert.equal(saved.phone,contacts.phone);assert.equal(saved.email,contacts.email);assert.equal(saved.contact,contacts.contact);
  assert.equal(store.deleteLead(lead.id),1);
});

test('contacts reject empty or malformed values even alongside a valid alternative; old clients still work',()=>{
  const {parseLeadContacts}=require('../../.local/test-build/lib/leads/contact.js');
  for(const fields of [{phone:'',email:''},{phone:'123',email:'qa@example.invalid'},{phone:'+79001234567',email:'invalid'},{phone:null,email:'qa@example.invalid'},{phone:'',email:'x'.repeat(121)},{phone:'1234567890123456',email:''}])assert.throws(()=>parseLeadContacts(fields));
  assert.deepEqual(parseLeadContacts({contact:'qa@example.invalid'}),{phone:'',email:'qa@example.invalid',contact:'qa@example.invalid'});
  assert.deepEqual(parseLeadContacts({contact:'+79001234567'}),{phone:'+79001234567',email:'',contact:'+79001234567'});
  assert.throws(()=>parseLeadContacts({contact:'not a contact'}));
});
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

test('selected KM, KMD and KZh sections survive server parsing and lead storage',()=>{
  const {defaultInput,parseInput}=require('../../.local/test-build/lib/configuration/input.js');
  const configuration=parseInput({...structuredClone(defaultInput),services:['km','kmd','kzh']});
  const lead=store.saveLead(randomUUID(),{...payload,configuration});
  assert.deepEqual(store.readLead(lead.id).payload.configuration,configuration);
  assert.equal(store.deleteLead(lead.id),1);
});
