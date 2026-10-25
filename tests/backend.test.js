import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { once } from 'node:events';
import { approvedBook, raw, quote, NOW } from './sales-fixtures.mjs';
import { submissionData } from '../smart-home-energy/model.js';
import { createInquiryServer, verifyTurnstile } from '../backend/server.js';
import { FileStore } from '../backend/store.js';
import { calculateInternal } from '../backend/internal-calculator.js';
import { reviseOffer, approveOffer, customerOffer } from '../backend/offers.js';
import { processNotifications, resendNotification } from '../backend/notifications.js';
import { sendInquiry } from '../smart-home-energy/inquiry-client.js';
const origin='http://127.0.0.1:4173';
async function setup(t,options={}) {
  const directory=await mkdtemp(join(tmpdir(),'ampower-test-'));
  const store=new FileStore(directory);
  const server=createInquiryServer({store,book:approvedBook(),clock:()=>NOW,allowedOrigin:origin,verifySpam:async token=>token==='test-only',rateLimit:100,...options});
  server.listen(0,'127.0.0.1');await once(server,'listening');
  t.after(async()=>{await new Promise(resolve=>server.close(resolve));await rm(directory,{recursive:true,force:true});});
  const url=`http://127.0.0.1:${server.address().port}/api/inquiries`;
  const payload={data:submissionData(raw()),dataNoticeVersion:'local-test-v1',token:'test-only',website:''};
  const post=(body=payload,key=randomUUID(),extra={})=>fetch(url,{method:'POST',headers:{Origin:origin,'Content-Type':'application/json','Idempotency-Key':key,...extra},body:JSON.stringify(body)});
  return{store,url,payload,post,directory};
}
test('API: trwałe przyjęcie, ID, zapis i brak poufnych danych w odpowiedzi',async t=>{
  const {store,post}=await setup(t);const res=await post();assert.equal(res.status,201);const receipt=await res.json();
  assert.equal(receipt.accepted,true);assert.match(receipt.inquiryId,/^AMP-/);assert.equal(receipt.notificationStatus,'queued');
  assert.deepEqual(Object.keys(receipt).sort(),['accepted','inquiryId','notificationStatus','receivedAt']);
  const record=await store.find(receipt.inquiryId);assert.equal(record.data.name,'Klient TEST');assert.equal(record.notification.recipient,'kuba@ampower.pl');assert.ok(record.internalCalculation);assert.equal(record.offer,null);
  const permissions=await stat(store.path(record.storageKey));assert.equal(permissions.mode&0o777,0o600);
});
test('API: równoczesne ponowienia tworzą jedno zgłoszenie',async t=>{
  const {post,store}=await setup(t);const key=randomUUID();const results=await Promise.all(Array.from({length:4},()=>post(undefined,key).then(r=>r.json())));
  assert.equal(new Set(results.map(r=>r.inquiryId)).size,1);assert.equal((await store.records()).length,1);
});
test('API: ten sam klucz i inne dane odrzucany',async t=>{
  const {post,payload}=await setup(t);const key=randomUUID();await post(payload,key);payload.data.name='Inny klient TEST';assert.equal((await post(payload,key)).status,409);
});
test('API: ponowienie po restarcie korzysta z trwałego zapisu',async t=>{
  const {post,payload,directory}=await setup(t);const key=randomUUID();const before=await(await post(payload,key)).json();const reopened=new FileStore(directory);
  assert.equal((await reopened.get(key)).receipt.inquiryId,before.inquiryId);
});
for(const scenario of ['empty-name','empty-email','bad-email','bad-phone','no-locality','invalid-count','notice','consent','honeypot','forged-cost','unknown-category','unknown-goal','duplicate-category','invisible-field','oversize-notes','header-injection','wrong-type','bad-option','spam'])test(`API walidacja: ${scenario}`,async t=>{
  const {post,payload,store}=await setup(t);
  if(scenario==='empty-name')payload.data.name='';if(scenario==='empty-email')payload.data.email='';if(scenario==='bad-email')payload.data.email='not-email';if(scenario==='bad-phone')payload.data.phone='123';if(scenario==='no-locality')payload.data.locality='';
  if(scenario==='invalid-count')payload.data.details.lights.count=-1;if(scenario==='notice')payload.dataNoticeVersion='old';if(scenario==='consent')payload.data.dataNoticeAccepted=false;
  if(scenario==='honeypot')payload.website='spam';if(scenario==='forged-cost')payload.data.purchaseNet=1;if(scenario==='unknown-category')payload.data.categories.push('invented');if(scenario==='unknown-goal')payload.data.goals.push('invented');
  if(scenario==='duplicate-category')payload.data.categories.push('lights');if(scenario==='invisible-field')payload.data.details.lights.hidden='secret';if(scenario==='oversize-notes')payload.data.notes='x'.repeat(1001);if(scenario==='header-injection')payload.data.email='qa@example.invalid\nBcc: other@example.invalid';if(scenario==='wrong-type')payload.data.name={text:'x'};if(scenario==='bad-option')payload.data.support='unlimited';if(scenario==='spam')payload.token='forged';
  const response=await post(payload);assert.ok([403,422].includes(response.status),`${scenario}: ${response.status}`);assert.equal((await store.records()).length,0);
});
test('API: błędny origin, metoda, typ, JSON i limit prób',async t=>{
  const {post,url}=await setup(t,{rateLimit:2});assert.equal((await post(undefined,undefined,{Origin:'https://evil.invalid'})).status,403);
  assert.equal((await fetch(url,{headers:{Origin:origin}})).status,405);assert.equal((await post(undefined,undefined,{'Content-Type':'text/plain'})).status,415);
  const bad=await fetch(url,{method:'POST',headers:{Origin:origin,'Content-Type':'application/json','Idempotency-Key':randomUUID()},body:'{'});assert.equal(bad.status,400);
  assert.equal((await post()).status,201);assert.equal((await post()).status,429);
});
test('API: błąd zapisu nie zwraca sukcesu',async t=>{
  const directory=await mkdtemp(join(tmpdir(),'ampower-failure-'));const badStore={transaction:async()=>{throw new Error('disk-failed')}};
  const {post}=await setup(t,{store:badStore});assert.equal((await post()).status,503);await rm(directory,{recursive:true,force:true});
});
test('API nie udostępnia panelu, zgłoszeń ani plików',async t=>{
  const {url}=await setup(t);for(const path of ['/admin','/api/inquiries/AMP-any','/backend/catalog.seed.json','/../backend','/.env'])assert.equal((await fetch(new URL(path,url))).status,404);
});
test('Turnstile: wynik, hostname i action muszą być zgodne; błędy zamykają odbiór',async()=>{
  const config={secret:'TEST',hostname:'ampower.pl'};const transport=data=>async()=>new Response(JSON.stringify(data),{status:200});
  assert.equal(await verifyTurnstile('token',config,transport({success:true,hostname:'ampower.pl',action:'inquiry'})),true);
  for(const data of [{success:false},{success:true,hostname:'evil.invalid',action:'inquiry'},{success:true,hostname:'ampower.pl',action:'other'}])assert.equal(await verifyTurnstile('token',config,transport(data)),false);
  assert.equal(await verifyTurnstile('token',config,async()=>{throw new Error('network')}),false);
});
test('wewnętrzna kalkulacja: rozdzielenie kosztów, marży, narzutu i wyniku',()=>{
  const r=calculateInternal(quote());assert.equal(r.status,'complete');const a=r.totals;
  assert.equal(a.hardwareNet,200);assert.equal(a.configurationNet,180);assert.equal(a.reserveNet,18);assert.equal(a.directCostNet,398);assert.equal(a.totalCostNet,448);assert.equal(a.saleNet,800);assert.equal(a.vat,184);assert.equal(a.saleGross,984);assert.equal(a.contributionNet,402);assert.equal(a.marginPercent,50.24999999999999);assert.ok(Math.abs(a.markupPercent-101.00502512562814)<.00001);assert.equal(a.profitAfterIncludedCostsNet,352);
});
test('wewnętrzna kalkulacja: brak kosztu nie staje się zerem, duplikaty blokują',()=>{
  const q=quote();q.lines[0].unitCostNet=null;assert.equal(calculateInternal(q).status,'incomplete');q.lines[0].unitCostNet=100;q.lines.push({...q.lines[0]});assert.equal(calculateInternal(q).status,'incomplete');
});
test('korekta właściciela, VAT mieszany, kwoty końcowe i marża',()=>{
  const q=quote();q.lines[0].vatRate=8;q.finalSaleNet=750;q.adjustmentVatRate=23;q.adjustmentVatApproved=true;
  const r=calculateInternal(q);assert.equal(r.totals.saleNet,750);assert.equal(r.totals.vat,127.5);assert.equal(r.publicLines.find(l=>l.id==='owner-adjustment').netCents,-5000);
});
test('oferta: zatwierdzenie konkretnej wersji i unieważnienie po edycji',()=>{
  const record={receipt:{inquiryId:`AMP-${randomUUID()}`},data:raw(),audit:[],offer:null};const draft=reviseOffer(record,quote(),'owner',NOW);
  assert.throws(()=>customerOffer(draft,false,NOW));assert.equal(customerOffer(draft,true,NOW).state,'draft');assert.throws(()=>approveOffer(draft,2,'owner',NOW));
  const approved=approveOffer(draft,1,'owner',NOW);assert.equal(customerOffer(approved,false,NOW).state,'approved');
  const safe=JSON.stringify(customerOffer(approved,false,NOW));assert.doesNotMatch(safe,/unitCostNet|marginPercent|markupPercent|reserve|hourlyCost|profitAfter/);
  const revised=reviseOffer(approved,quote(),'owner',NOW);assert.equal(revised.offer.approval,null);assert.equal(revised.offer.revision,2);assert.throws(()=>customerOffer(revised,false,NOW));
  approved.offer.quote.lines[0].unitSaleNet=100;assert.throws(()=>customerOffer(approved,false,NOW));
});
test('oferta: niska marża wymaga świadomego wyjątku, nie automatycznego rabatu',()=>{
  const q=quote();q.finalSaleNet=400;q.adjustmentVatRate=23;q.adjustmentVatApproved=true;let r=reviseOffer({receipt:{inquiryId:'TEST'},data:raw(),audit:[]},q,'owner',NOW);
  assert.throws(()=>approveOffer(r,1,'owner',NOW),/Marża/);q.marginException='Właściciel: ograniczony projekt demonstracyjny';r=reviseOffer(r,q,'owner',NOW);assert.equal(approveOffer(r,2,'owner',NOW).offer.state,'approved');
});
test('oferta: wygaśnięcie i niepełne VAT/kwalifikacja blokują eksport',()=>{
  const record={receipt:{inquiryId:'TEST'},data:raw(),audit:[]};const q=quote();q.technicalChecked=false;assert.throws(()=>approveOffer(reviseOffer(record,q,'owner',NOW),1,'owner',NOW));q.technicalChecked=true;
  const approved=approveOffer(reviseOffer(record,q,'owner',NOW),1,'owner',NOW);assert.throws(()=>customerOffer(approved,false,new Date('2026-12-01')),/wygasła/);
});
test('outbox: zapis, błąd/retry i potwierdzenie dostawcy; brak ponowienia po sukcesie',async t=>{
  const {post,store}=await setup(t);const receipt=await(await post()).json();let calls=0;
  await processNotifications(store,async()=>{calls++;throw new Error('offline')},NOW);assert.equal((await store.find(receipt.inquiryId)).notification.status,'retry-needed');
  await processNotifications(store,async m=>{calls++;assert.equal(m.to,'kuba@ampower.pl');assert.match(m.text,/internalCalculation/);return{id:'fake-provider-id'}},new Date(+NOW+60000));assert.equal((await store.find(receipt.inquiryId)).notification.status,'provider-accepted');
  await processNotifications(store,async()=>{calls++;return{id:'again'}});assert.equal(calls,2);
});
test('adapter poczty: stały odbiorca i klucz idempotencji, wyłącznie mock',async()=>{
  const m={to:'kuba@ampower.pl',subject:'TEST',text:'TEST',key:'test-key'};
  const result=await resendNotification(m,{apiKey:'fake-key',from:'test@example.invalid'},async(url,opts)=>{assert.equal(url,'https://api.resend.com/emails');assert.equal(opts.headers['Idempotency-Key'],'test-key');assert.deepEqual(JSON.parse(opts.body).to,['kuba@ampower.pl']);return new Response('{"id":"fake"}')});assert.equal(result.id,'fake');
});
test('klient formularza: brak konfiguracji, błędy sieci, fałszywy sukces i idempotencja',async()=>{
  const config={enabled:true,endpoint:'http://127.0.0.1:8787/api/inquiries',dataNoticeVersion:'local-test-v1'};
  await assert.rejects(sendInquiry(raw(),{enabled:false}),/nie jest jeszcze/);await assert.rejects(sendInquiry(raw(),config,async()=>{throw new TypeError('offline')}),/potwierdzić/);
  await assert.rejects(sendInquiry(raw(),config,async()=>new Response('{"success":true}')),/potwierdzić/);
  await assert.rejects(sendInquiry(raw(),config,async()=>new Response('{}',{status:503})),/nie przyjął/);
  const keys=[];const fake=async(_url,opts)=>{keys.push(opts.headers['Idempotency-Key']);return new Response(JSON.stringify({accepted:true,inquiryId:`AMP-${randomUUID()}`,receivedAt:NOW.toISOString()}))};await sendInquiry(raw(),config,fake);await sendInquiry(raw(),config,fake);assert.equal(keys[0],keys[1]);
  const changed=raw();changed.name='Zmieniony TEST';await sendInquiry(changed,config,fake);assert.notEqual(keys[1],keys[2]);
});
test('outbox: po oknie idempotencji wymaga uzgodnienia statusu z dostawcą',async t=>{
 const {post,store}=await setup(t);const receipt=await(await post()).json();await processNotifications(store,async()=>{throw new Error('uncertain')},NOW);let sent=0;
 await processNotifications(store,async()=>{sent++;return{id:'fake'}},new Date(+NOW+24*3600000));assert.equal(sent,0);assert.equal((await store.find(receipt.inquiryId)).notification.status,'reconcile-needed');
});
test('magazyn odrzuca katalog dostępny dla innych kont',async t=>{
 const {chmod}=await import('node:fs/promises');const directory=await mkdtemp(join(tmpdir(),'ampower-acl-'));t.after(()=>rm(directory,{recursive:true,force:true}));await chmod(directory,0o755);await assert.rejects(new FileStore(directory).init(),/0700/);
});
test('CLI właściciela: edycja, zatwierdzenie i bezpieczny eksport aktualnej wersji',async t=>{
 const {post,directory}=await setup(t);const receipt=await(await post()).json();const {spawnSync}=await import('node:child_process');const {writeFile,readFile}=await import('node:fs/promises');const qfile=join(directory,'quote-edit.json');await writeFile(qfile,JSON.stringify(quote()),{mode:0o600});
 const cmd=(...args)=>spawnSync(process.execPath,['backend/owner.js',...args],{env:{...process.env,AMPOWER_DATA_DIR:directory},encoding:'utf8'});
 assert.equal(cmd('revise',receipt.inquiryId,qfile).status,0);const out=join(directory,'customer.json');assert.notEqual(cmd('export',receipt.inquiryId,out).status,0);assert.equal(cmd('approve',receipt.inquiryId,'1').status,0);assert.equal(cmd('export',receipt.inquiryId,out).status,0);const text=await readFile(out,'utf8');assert.match(text,/approved/);assert.doesNotMatch(text,/unitCostNet|marginPercent|profitAfter/);
});
