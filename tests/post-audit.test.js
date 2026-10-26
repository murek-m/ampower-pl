import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp,rm,writeFile,readFile,symlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { once } from 'node:events';
import { spawn } from 'node:child_process';
import { FileStore } from '../backend/store.js';
import { analyzeDescription } from '../backend/description.js';
import { loadCatalog } from '../backend/catalog.js';
import { processNotifications } from '../backend/notifications.js';
import { verifyNotificationWebhook,applyNotificationWebhook } from '../backend/notification-webhook.js';
const book=await loadCatalog();
async function storeFor(t){const directory=await mkdtemp(join(tmpdir(),'ampower-fixes-'));t.after(()=>rm(directory,{recursive:true,force:true}));const store=new FileStore(directory);await store.init();return store;}
for(const description of ['nie mam 8 rolet','nie potrzebuję 8 rolet','maksymalnie 8 rolet','minimum 8 rolet','najwyżej 8 rolet','bez zamawiania 8 rolet','nie chcę nowych 8 rolet','ponad 8 rolet','przynajmniej 8 rolet'])test('parser nie potwierdza ilości: '+description,()=>{assert.equal(analyzeDescription(description,book).suggestions.find(s=>s.category==='blinds').quantity,null);});
test('blokada po SIGKILL zwalnia się bez kasowania plików i zachowuje zapis',async t=>{
 const store=await storeFor(t);await store.put('before',{safe:true});
 const child=spawn(process.execPath,['--input-type=module','-e',`import {FileStore} from './backend/store.js';await new FileStore(${JSON.stringify(store.directory)}).transaction(async()=>{console.log('LOCKED');await new Promise(r=>setTimeout(r,60000));});`],{stdio:['ignore','pipe','pipe']});
 t.after(()=>child.kill());await once(child.stdout,'data');child.kill('SIGKILL');await once(child,'exit');
 await store.transaction(async()=>{assert.deepEqual(await store.get('before'),{safe:true});await store.put('after',{recovered:true});});assert.deepEqual(await store.get('after'),{recovered:true});
});
test('aktywny piszący blokuje konkurenta i błąd callbacka zwalnia blokadę',async t=>{
 const store=await storeFor(t);let entered,release;const ready=new Promise(r=>entered=r),hold=new Promise(r=>release=r);const first=store.transaction(async()=>{entered();await hold;throw new Error('expected');});await ready;
 let secondEntered=false;const second=new FileStore(store.directory).transaction(async()=>{secondEntered=true;await store.put('ok',{value:1});});await new Promise(r=>setTimeout(r,60));assert.equal(secondEntered,false);release();await assert.rejects(first,/expected/);await second;assert.equal(secondEntered,true);
});
test('plik blokady będący symlinkiem nie jest otwierany',async t=>{const s=await storeFor(t);const target=join(s.directory,'target');await writeFile(target,'private',{mode:0o600});await symlink(target,join(s.directory,'.transactions.sqlite'));await assert.rejects(s.transaction(async()=>{}));assert.equal(await readFile(target,'utf8'),'private');});
async function pending(store){const record={storageKey:'mail',receipt:{inquiryId:'AMP-MAIL-TEST'},data:{name:'TEST'},internalCalculation:{},notification:{status:'pending',attempts:0},audit:[]};await store.put('mail',record);return record;}
test('wolna poczta nie blokuje zapisu, a drugi worker nie przejmuje aktywnej dzierżawy',async t=>{
 const store=await storeFor(t);await pending(store);let entered,release;const ready=new Promise(r=>entered=r),hold=new Promise(r=>release=r);let calls=0;
 const work=processNotifications(store,async()=>{calls++;entered();await hold;return{id:'provider-test'};});await ready;
 await store.transaction(async()=>{const record=await store.get('mail');record.data.name='EDYCJA W TRAKCIE POCZTY';await store.put('mail',record);});
 await processNotifications(store,async()=>{calls++;return{id:'duplicate'};});assert.equal(calls,1);release();await work;assert.equal((await store.get('mail')).data.name,'EDYCJA W TRAKCIE POCZTY');assert.equal((await store.get('mail')).notification.status,'provider-accepted');
});
test('retry stosuje backoff i zachowuje klucz dostawcy',async t=>{const s=await storeFor(t);await pending(s);const now=new Date('2026-10-21T00:00:00Z'),keys=[];await processNotifications(s,async m=>{keys.push(m.key);throw new Error('offline');},now);await processNotifications(s,async m=>{keys.push(m.key);return{id:'too-soon'};},new Date(+now+59000));assert.equal(keys.length,1);await processNotifications(s,async m=>{keys.push(m.key);return{id:'retry'};},new Date(+now+60000));assert.equal(keys.length,2);assert.equal(keys[0],keys[1]);});
test('wygasła dzierżawa po awarii pozwala wznowić z tym samym kluczem',async t=>{const s=await storeFor(t);const r=await pending(s);r.notification={status:'sending',attempts:1,firstAttemptAt:'2026-10-21T00:00:00Z',leaseUntil:'2026-10-21T00:00:30Z',leaseToken:'old'};await s.put('mail',r);let key;await processNotifications(s,async m=>{key=m.key;return{id:'recovered'};},new Date('2026-10-21T00:00:31Z'));assert.equal(key,'inquiry-AMP-MAIL-TEST');assert.equal((await s.get('mail')).notification.status,'provider-accepted');});
test('podpis webhooka: niezależny oficjalny wektor Svix, zmiana bajtu i stary timestamp',()=>{
 const raw=Buffer.from('{"event_type":"ping","data":{"success":true}}');const headers={'svix-id':'msg_loFOjxBNrRLzqYUf','svix-timestamp':'1731705121','svix-signature':'v1,rAvfW3dJ/X/qxhsaXPOyyCGmRKsaKWcsNccKXlIktD0='};const secret='whsec_plJ3nmyCDGBKInavdOK15jsl';const now=new Date(1731705121000);
 assert.equal(verifyNotificationWebhook(raw,headers,secret,now).event.event_type,'ping');assert.throws(()=>verifyNotificationWebhook(Buffer.from(raw.toString()+' '),headers,secret,now));assert.throws(()=>verifyNotificationWebhook(raw,headers,secret,new Date(+now+301000)));
});
test('webhook doręczenia: podpis, idempotencja i ochrona przed starszym zdarzeniem',async t=>{
 const {createHmac}=await import('node:crypto');const s=await storeFor(t);const r=await pending(s);r.notification.status='provider-accepted';r.notification.providerId='email-test';await s.put('mail',r);
 const secret='whsec_'+Buffer.from('test-key-for-synthetic-webhook-only').toString('base64'),now=new Date('2026-10-21T00:00:00Z');
 const invoke=async(id,type,at)=>{const raw=Buffer.from(JSON.stringify({type,created_at:at,data:{email_id:'email-test'}}));const timestamp=String(+now/1000);return applyNotificationWebhook(s,raw,{'svix-id':id,'svix-timestamp':timestamp,'svix-signature':'v1,'+createHmac('sha256',Buffer.from(secret.slice(6),'base64')).update(`${id}.${timestamp}.`).update(raw).digest('base64')},secret,now);};
 await invoke('msg_test1','email.delivered',now.toISOString());assert.equal((await s.get('mail')).notification.status,'delivered');assert.deepEqual(await invoke('msg_test1','email.delivered',now.toISOString()),{duplicate:true});await invoke('msg_test2','email.bounced','2026-10-20T23:59:00Z');assert.equal((await s.get('mail')).notification.status,'delivered');await invoke('msg_test3','email.complained','2026-10-21T00:00:01Z');assert.equal((await s.get('mail')).notification.status,'complained');
});
test('retencja wymaga okresu; podgląd nie usuwa i chroni kosztorysy',async t=>{
 const {retainInquiries}=await import('../backend/retention.js');const s=await storeFor(t);await assert.rejects(retainInquiries(s),/okres/);
 const now=new Date('2026-10-21T00:00:00Z');const old={storageKey:'old',receipt:{inquiryId:'OLD',receivedAt:'2025-01-01T00:00:00Z'},data:{},status:'new',audit:[]};await s.put('old',old);await s.put('quote',{...old,storageKey:'quote',receipt:{...old.receipt,inquiryId:'QUOTE'},offer:{state:'draft'}});
 const plan=await retainInquiries(s,{days:30,now});assert.deepEqual(plan.inquiryIds,['OLD']);assert.equal((await s.records()).length,2);await retainInquiries(s,{days:30,now,apply:true,actor:'TEST'});assert.equal((await s.get('old')).deleted,true);assert.ok((await s.get('quote')).offer);
});
test('weryfikacja backupu wykrywa uszkodzenie i niebezpieczne ścieżki',async t=>{
 const {verifyBackup}=await import('../backend/backup-verify.js');const {createHash}=await import('node:crypto');const s=await storeFor(t);await s.put('test',{synthetic:true});const name=s.path('test').split('/').at(-1),data=await readFile(s.path('test'));const manifest={files:{[name]:createHash('sha256').update(data).digest('hex')}};await writeFile(join(s.directory,'manifest.json'),JSON.stringify(manifest),{mode:0o600});assert.equal((await verifyBackup(s.directory)).verified,true);await s.put('test',{synthetic:false});await assert.rejects(verifyBackup(s.directory),/Integralność/);await writeFile(join(s.directory,'manifest.json'),JSON.stringify({files:{'../escape':'a'.repeat(64)}}),{mode:0o600});await assert.rejects(verifyBackup(s.directory),/Nieprawidłowy/);
});
