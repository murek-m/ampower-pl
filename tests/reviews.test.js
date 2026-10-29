import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { once } from 'node:events';
import { randomUUID } from 'node:crypto';
import { deflateSync } from 'node:zlib';
import http from 'node:http';
import { spawnSync } from 'node:child_process';
import { publicBuildFixture } from './public-build-fixture.mjs';
import { resolve } from 'node:path';
import { ReviewsStore } from '../backend/reviews-store.js';
import { sanitizeReviewPhoto, crc32 } from '../backend/reviews-photo.js';
import { createReviewsServer, processReviewMail, validateReview } from '../backend/reviews-server.js';

export function fixturePhoto(extra=false) {
  const chunk=(type,data)=>{const body=Buffer.concat([Buffer.from(type),data]),result=Buffer.alloc(data.length+12);result.writeUInt32BE(data.length);body.copy(result,4);result.writeUInt32BE(crc32(body),result.length-4);return result;};
  const header=Buffer.from([0,0,0,1,0,0,0,1,8,2,0,0,0]);
  return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',header),...(extra?[chunk('tEXt',Buffer.from('private\0remove-this-metadata'))]:[]),chunk('IDAT',deflateSync(Buffer.from([0,255,196,0]))),chunk('IEND',Buffer.alloc(0))]);
}
const payload=(extra={})=>({firstName:'Łukasz',initial:'ą',city:'Głogów',service:'Klimatyzacja',rating:1,text:'Rzeczowa krytyczna opinia — termin został przesunięty.',consent:true,consentVersion:'reviews-v1',photoConsent:true,...extra});
async function setup(t,options={}) {
  const directory=await mkdtemp(join(tmpdir(),'ampower-reviews-test-'));
  const store=new ReviewsStore(directory),password='synthetic-only-password-for-tests';
  let now=new Date('2026-10-24T10:00:00Z');
  const server=createReviewsServer({store,password,minFormAge:0,clock:()=>now,...options});server.listen(0,'127.0.0.1');await once(server,'listening');
  const origin=`http://127.0.0.1:${server.address().port}`;
  t.after(async()=>{server.closeAllConnections();await new Promise(r=>server.close(r));store.close();await rm(directory,{recursive:true,force:true});});
  const request=(path,{method='GET',body,headers={}}={})=>fetch(origin+path,{method,headers:{...(body?{'Content-Type':'application/json',Origin:origin}:{}),...headers},...(body?{body:JSON.stringify(body)}:{})});
  let cookie,csrf;
  const login=async()=>{const result=await request('/api/reviews-admin/login',{method:'POST',body:{password}});assert.equal(result.status,200);cookie=result.headers.get('set-cookie').split(';')[0];csrf=(await result.json()).csrf;};
  const admin=(path,body,headers={})=>request('/api/reviews-admin/'+path,{...(body?{method:'POST',body}:{}),headers:{Cookie:cookie,'X-CSRF-Token':csrf,...headers}});
  const submit=async(body={},key=randomUUID())=>{const token=(await (await request('/api/reviews/form')).json()).token;return request('/api/reviews',{method:'POST',body:{...payload(),token,...body},headers:{'Idempotency-Key':key}});};
  return {store,directory,server,origin,request,admin,login,submit,setNow:value=>now=new Date(value)};
}

test('opinia i zdjęcie są prywatne do moderacji, także dla niskiej oceny; odpowiedź i cofnięcie publikacji',async t=>{
  const s=await setup(t);const response=await s.submit({photo:fixturePhoto(true).toString('base64')});assert.equal(response.status,201);const {id}=await response.json();
  assert.equal((await (await s.request('/api/reviews')).json()).total,0);assert.equal((await s.request(`/api/reviews/${id}/photo`)).status,404);assert.equal((await s.request('/api/reviews-admin/list')).status,401);
  await s.login();let list=await (await s.admin('list')).json();assert.equal(list.reviews[0].name,'Łukasz Ą.');assert.equal(list.reviews[0].status,'pending');
  assert.equal((await s.admin(id,{action:'publish',version:1},{'X-CSRF-Token':'wrong'})).status,403);
  assert.equal((await s.admin(id,{action:'publish',version:1})).status,200);
  list=await (await s.request('/api/reviews')).json();assert.equal(list.total,1);assert.equal(list.average,1);assert.equal(list.reviews[0].rating,1);assert.equal('status' in list.reviews[0],false);assert.equal('audit' in list.reviews[0],false);
  const image=Buffer.from(await (await s.request(`/api/reviews/${id}/photo`)).arrayBuffer());assert.equal(image.includes(Buffer.from('remove-this-metadata')),false);
  assert.equal((await s.admin(id,{action:'reply',version:1,reply:'stale'})).status,409);
  assert.equal((await s.admin(id,{action:'reply',version:2,reply:'Dziękuję za informację. Przepraszam za przesunięcie terminu.'})).status,200);
  assert.match((await (await s.request('/api/reviews')).json()).reviews[0].reply,/Dziękuję/);
  assert.equal((await s.admin(id,{action:'reject',version:3,reason:''})).status,422);
  assert.equal((await s.admin(id,{action:'reject',version:3,reason:'Zdjęcie ujawnia dane osób trzecich.'})).status,200);
  assert.equal((await (await s.request('/api/reviews')).json()).total,0);assert.equal((await s.request(`/api/reviews/${id}/photo`)).status,404);
});
test('ponowienie zgłoszenia jest idempotentne; zmiana treści z tym samym kluczem nie nadpisuje opinii',async t=>{
  const s=await setup(t);const key=randomUUID(),first=await(await s.submit({},key)).json(),second=await(await s.submit({},key)).json();assert.equal(first.id,second.id);assert.equal(s.store.list({admin:true}).total,1);
  assert.equal((await s.submit({text:'Inna treść wpisu dla tego samego klucza próby.'},key)).status,409);
});
test('origin, antyspam, czas formularza, limity i zgody są sprawdzane na serwerze',async t=>{
  const s=await setup(t,{minFormAge:2000,submitLimit:20});
  const token=(await(await s.request('/api/reviews/form')).json()).token,body={...payload(),token};
  const send=(change={},headers={})=>s.request('/api/reviews',{method:'POST',body:{...body,...change},headers:{'Idempotency-Key':randomUUID(),...headers}});
  assert.equal((await send()).status,403);s.setNow('2026-10-24T10:00:03Z');
  assert.equal((await send({}, {Origin:'https://evil.example'})).status,403);
  assert.equal((await send({website:'bot.example'})).status,403);assert.equal((await send({token:'fake'})).status,403);
  assert.equal((await send({consent:false})).status,422);assert.equal((await send({rating:6})).status,422);assert.equal((await send({photo:fixturePhoto().toString('base64'),photoConsent:false})).status,422);
  assert.equal((await send()).status,201);
  assert.equal((await s.request('/api/reviews?offset=-1')).status,422);
  const limited=await setup(t,{submitLimit:1});assert.equal((await limited.submit()).status,201);assert.equal((await limited.submit()).status,429);
});
test('PNG: usuwa metadane, odrzuca HTML, złą sumę i nadmierną dekompresję',()=>{
  const png=fixturePhoto(true),clean=sanitizeReviewPhoto(png.toString('base64'));assert.ok(clean.length<png.length);assert.deepEqual(sanitizeReviewPhoto(clean.toString('base64')),clean);
  assert.throws(()=>sanitizeReviewPhoto(Buffer.from('<svg onload="alert(1)"></svg>').toString('base64')));
  const corrupt=Buffer.from(png);corrupt[45]^=1;assert.throws(()=>sanitizeReviewPhoto(corrupt.toString('base64')));
  const oversized=Buffer.from(png);oversized.writeUInt32BE(2000,16);oversized.writeUInt32BE(crc32(oversized.subarray(12,29)),29);assert.throws(()=>sanitizeReviewPhoto(oversized.toString('base64')));
  assert.throws(()=>validateReview(payload({firstName:'<script>'})));assert.throws(()=>validateReview(payload({initial:'AB'})));
});
test('trwały zapis, stronicowanie i usuwanie danych ze zdjęciem',async t=>{
  const s=await setup(t);await s.login();const ids=[];
  for(let i=0;i<4;i++){const {id}=await(await s.submit({rating:i+1,photo:fixturePhoto().toString('base64')})).json();ids.push(id);await s.admin(id,{action:'publish',version:1});}
  const first=await(await s.request('/api/reviews?limit=3')).json(),next=await(await s.request('/api/reviews?offset=3&limit=3')).json();assert.equal(first.reviews.length,3);assert.equal(next.reviews.length,1);assert.equal(first.average,2.5);assert.equal(new Set([...first.reviews,...next.reviews].map(r=>r.id)).size,4);
  const second=new ReviewsStore(s.directory);assert.equal(second.list().total,4);second.close();
  assert.equal((await s.admin(ids[0],{action:'delete',version:2,confirm:'wrong'})).status,422);assert.equal((await s.admin(ids[0],{action:'delete',version:2,confirm:ids[0]})).status,200);assert.equal(s.store.list().total,3);
  const erased=s.store.db.prepare('SELECT first_name,text,photo FROM reviews WHERE id=?').get(ids[0]);assert.equal(erased.first_name,'');assert.equal(erased.text,'');assert.equal(erased.photo,null);
  await s.admin('logout',{});assert.equal((await s.admin('list')).status,401);
});
test('kolejka poczty: retry bez duplikatu, brak treści opinii w e-mailu i potwierdzenie dostawcy',async t=>{
  const s=await setup(t,{mailEnabled:true});await s.submit();const now=new Date('2026-10-24T10:00:00Z'),keys=[];
  await processReviewMail(s.store,async message=>{keys.push(message.key);assert.doesNotMatch(message.text,/Łukasz|Głogów|Rzeczowa/);throw new Error('offline');},s.origin+'/admin/opinie/',now);
  assert.equal(s.store.list({admin:true}).reviews[0].mailState,'retry');
  await processReviewMail(s.store,async()=>{throw new Error('too early');},s.origin,new Date(+now+59000));assert.equal(keys.length,1);
  await processReviewMail(s.store,async message=>{keys.push(message.key);return{id:'synthetic-provider-id'};},s.origin,new Date(+now+60000));assert.equal(keys[0],keys[1]);assert.equal(s.store.list({admin:true}).reviews[0].mailState,'provider-accepted');
  let called=false;await processReviewMail(s.store,async()=>{called=true;},s.origin,new Date(+now+120000));assert.equal(called,false);
});
test('dwie kolejki nie przejmują tej samej wiadomości i zachowują retry po awarii',async t=>{
  const s=await setup(t,{mailEnabled:true});await s.submit();const now=Date.parse('2026-10-24T10:00:00Z');const claim=s.store.claimMail(now);assert.ok(claim);assert.equal(s.store.claimMail(now),null);const next=s.store.claimMail(now+31000);assert.equal(next.id,claim.id);assert.notEqual(next.token,claim.token);
  s.store.finishMail(claim,{id:'old-result'},now+32000);assert.equal(s.store.list({admin:true}).reviews[0].mailState,'sending');s.store.finishMail(next,{id:'current-result'},now+33000);assert.equal(s.store.list({admin:true}).reviews[0].mailState,'provider-accepted');
});
test('retencja usuwa nieopublikowane po 90 dniach, zachowuje opublikowane',async t=>{
  const s=await setup(t);await s.login();await s.submit();const {id}=await(await s.submit()).json();await s.admin(id,{action:'publish',version:1});assert.equal(s.store.purgeUnpublished(new Date('2027-02-01')),1);assert.equal(s.store.list({admin:true}).total,1);assert.equal(s.store.list().total,1);
});
test('panel i serwer nie udostępniają źródeł, bazy, prywatnego panelu Energy ani plików spoza dist',async t=>{
  const cwd=await publicBuildFixture(t);
  const build=spawnSync(process.execPath,['scripts/build.js'],{encoding:'utf8',cwd});assert.equal(build.status,0,build.stderr);
  const s=await setup(t,{staticRoot:join(cwd,'dist')});assert.equal((await s.request('/admin/opinie/')).status,200);
  for(const path of ['/backend/store.js','/backend/reviews-server.js','/reviews.sqlite','/.git/config','/api/panel/catalog'])assert.ok([401,404].includes((await s.request(path)).status),path);
  const status=await new Promise((resolve,reject)=>{const request=http.request(s.origin+'/api/reviews',{headers:{Host:'evil.example'}},response=>{response.resume();resolve(response.statusCode);});request.on('error',reject);request.end();});assert.equal(status,403);
});
test('API obsługuje główną stronę na osobnym hostingu, a panel odrzuca obcy Origin',async t=>{
  const s=await setup(t,{publicOrigin:'https://ampower.pl'});
  const options=await s.request('/api/reviews',{method:'OPTIONS',headers:{Origin:'https://ampower.pl','Access-Control-Request-Method':'POST','Access-Control-Request-Headers':'content-type,idempotency-key'}});assert.equal(options.status,204);assert.equal(options.headers.get('access-control-allow-origin'),'https://ampower.pl');
  const tokenResponse=await s.request('/api/reviews/form',{headers:{Origin:'https://ampower.pl'}});assert.equal(tokenResponse.headers.get('access-control-allow-origin'),'https://ampower.pl');const token=(await tokenResponse.json()).token;
  const submitted=await s.request('/api/reviews',{method:'POST',body:{...payload(),token},headers:{Origin:'https://ampower.pl','Idempotency-Key':randomUUID()}});assert.equal(submitted.status,201);
  assert.equal((await s.request('/api/reviews-admin/login',{method:'POST',body:{password:'synthetic-only-password-for-tests'},headers:{Origin:'https://ampower.pl'}})).status,403);
  const evil=await s.request('/api/reviews',{method:'OPTIONS',headers:{Origin:'https://evil.example'}});assert.equal(evil.status,405);assert.equal(evil.headers.get('access-control-allow-origin'),null);
});
test('CLI nie pozwala zapisywać danych w katalogu repozytorium o nazwie zaczynającej się od dwóch kropek',()=>{
  const result=spawnSync(process.execPath,['backend/reviews-server.js'],{encoding:'utf8',timeout:3000,env:{...process.env,NODE_ENV:'development',AMPOWER_REVIEWS_DATA_DIR:resolve('..reviews-security-check')}});
  assert.equal(result.status,1);assert.match(result.stderr,/Magazyn opinii musi być poza repozytorium/);
});
test('kursor zachowuje ciągłość po publikacji i usunięciu; obsługuje równe daty',async t=>{
  const s=await setup(t,{submitLimit:20});const ids=[];
  for(let i=0;i<6;i++){const {id}=await(await s.submit()).json();ids.push(id);s.store.moderate(id,{action:'publish',version:1},new Date());}
  const first=await(await s.request('/api/reviews?limit=3')).json();assert.ok(first.nextCursor);
  const {id}=await(await s.submit()).json();s.store.db.prepare('UPDATE reviews SET created_at=? WHERE id=?').run('2026-10-24T11:00:00.000Z',id);s.store.moderate(id,{action:'publish',version:1},new Date());
  s.store.moderate(first.reviews[0].id,{action:'delete',version:2,confirm:first.reviews[0].id},new Date());
  const next=await(await s.request('/api/reviews?limit=3&cursor='+first.nextCursor)).json();
  assert.equal(next.reviews.length,3);assert.equal(next.nextCursor,null);
  assert.equal(new Set([...first.reviews,...next.reviews].map(r=>r.id)).size,6);
  assert.equal(next.reviews.some(r=>r.id===id),false);
  assert.equal((await s.request('/api/reviews?cursor=broken')).status,422);
  assert.equal((await s.request('/api/reviews?cursor='+first.nextCursor+'&offset=1')).status,422);
});
test('panel filtruje przed paginacją i odnajduje stare oczekujące opinie',async t=>{
  const s=await setup(t);const now=new Date();
  const old=s.store.submit(payload(),randomUUID(),'old',null,new Date('2026-01-01'),false);
  for(let i=0;i<35;i++){const {id}=s.store.submit(payload(),randomUUID(),String(i),null,now,false);s.store.moderate(id,{action:'publish',version:1},now);}
  await s.login();const list=await(await s.admin('list?status=pending')).json();
  assert.equal(list.total,1);assert.equal(list.reviews[0].id,old.id);assert.equal(list.counts.pending,1);assert.equal(list.counts.published,35);assert.equal(list.nextCursor,null);
  assert.equal((await s.admin('list?status=deleted')).status,422);
});
test('wygasły i zbyt młody formularz mają osobne komunikaty; odnowienie zachowuje idempotencję',async t=>{
  const s=await setup(t,{minFormAge:2000});const key=randomUUID();
  const getToken=async()=>(await(await s.request('/api/reviews/form')).json()).token;
  let token=await getToken();const send=()=>s.request('/api/reviews',{method:'POST',body:{...payload(),token},headers:{'Idempotency-Key':key}});
  let response=await send();assert.equal(response.status,403);assert.equal((await response.json()).code,'FORM_WAIT');
  s.setNow('2026-10-24T11:00:01Z');response=await send();assert.equal(response.status,403);assert.equal((await response.json()).code,'FORM_RENEW');
  token=await getToken();s.setNow('2026-10-24T11:00:04Z');const first=await(await send()).json();assert.equal(first.accepted,true);
  token=await getToken();s.setNow('2026-10-24T11:00:07Z');const retry=await(await send()).json();assert.equal(retry.id,first.id);assert.equal(s.store.list({admin:true}).total,1);
});
test('limit magazynu zatrzymuje nowe zgłoszenia, a readiness wykrywa niedostępną bazę',async t=>{
  const s=await setup(t);assert.equal((await s.request('/ready')).status,200);
  s.store.maxBytes=s.store.readiness().databaseBytes;
  assert.equal((await s.request('/ready')).status,503);assert.equal((await s.submit()).status,503);assert.equal(s.store.list({admin:true}).total,0);
});
test('spójny backup z aktywnym WAL można odtworzyć razem ze zdjęciem',async t=>{
  const {backupReviews}=await import('../backend/reviews-backup.js');
  const {readFile,stat}=await import('node:fs/promises');const {createHash}=await import('node:crypto');
  const s=await setup(t),backupRoot=await mkdtemp(join(tmpdir(),'ampower-reviews-backup-'));
  t.after(()=>rm(backupRoot,{recursive:true,force:true}));
  const photo=fixturePhoto(),{id}=await(await s.submit({photo:photo.toString('base64')})).json();s.store.moderate(id,{action:'publish',version:1},new Date());
  const target=join(backupRoot,'snapshot'),result=backupReviews(s.directory,target);
  assert.equal(result.integrity,'ok');assert.equal((await stat(join(target,'reviews.sqlite'))).mode&0o777,0o600);
  assert.equal(createHash('sha256').update(await readFile(join(target,'reviews.sqlite'))).digest('hex'),result.sha256);
  const restored=new ReviewsStore(target);try{assert.equal(restored.list().reviews[0].id,id);assert.deepEqual(restored.photo(id,false),photo);}finally{restored.close();}
  assert.throws(()=>backupReviews(s.directory,join(s.directory,'nested')),/poza źródłem/);
});
test('katalog danych przez alias nadrzędny nie może wskazywać do repozytorium',async t=>{
  const {mkdir,symlink}=await import('node:fs/promises');
  const inside=await mkdtemp(resolve('output-review-path-test-')),outside=await mkdtemp(join(tmpdir(),'ampower-review-alias-'));
  t.after(async()=>{await rm(outside,{recursive:true,force:true});await rm(inside,{recursive:true,force:true});});
  const alias=join(outside,'alias');await symlink(inside,alias,'dir');
  assert.throws(()=>new ReviewsStore(join(alias,'data')),/poza repozytorium/);
  const result=spawnSync(process.execPath,['backend/reviews-server.js'],{encoding:'utf8',timeout:3000,env:{...process.env,NODE_ENV:'development',PORT:'0',AMPOWER_REVIEWS_DATA_DIR:join(alias,'cli-data'),AMPOWER_REVIEWS_ADMIN_PASSWORD:'synthetic-only-cli-test-password'}});
  assert.equal(result.status,1);assert.match(result.stderr,/poza repozytorium/);
});
test('backup większej bazy używa bufora maksymalnie 64 KiB, a hash pozostaje poprawny',async t=>{
  const fs=await import('node:fs'),{syncBuiltinESMExports}=await import('node:module');
  const {backupReviews}=await import('../backend/reviews-backup.js');
  const {readFile}=await import('node:fs/promises'),{createHash}=await import('node:crypto');
  const s=await setup(t),parent=await mkdtemp(join(tmpdir(),'ampower-bounded-backup-'));
  t.after(()=>rm(parent,{recursive:true,force:true}));
  s.store.db.exec('CREATE TABLE synthetic_large_payload (value BLOB)');s.store.db.prepare('INSERT INTO synthetic_large_payload VALUES (?)').run(Buffer.alloc(16*1024*1024,42));
  const original=fs.default.readSync;let maxRead=0;
  fs.default.readSync=function(fd,buffer,offset,length,...rest){maxRead=Math.max(maxRead,length);return original(fd,buffer,offset,length,...rest);};syncBuiltinESMExports();
  let result;try{result=backupReviews(s.directory,join(parent,'snapshot'));}finally{fs.default.readSync=original;syncBuiltinESMExports();}
  assert.ok(result.bytes>16*1024*1024);assert.equal(maxRead,65536);
  assert.equal(result.sha256,createHash('sha256').update(await readFile(join(parent,'snapshot','reviews.sqlite'))).digest('hex'));
});
