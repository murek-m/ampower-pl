import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import { publicBuildFixture } from './public-build-fixture.mjs';
import { approvedBook, selection, NOW } from './sales-fixtures.mjs';
import { projectPublicCatalog, loadCatalog } from '../backend/catalog.js';
import { estimate } from '../smart-home-energy/pricing.js';
import { CATEGORIES } from '../smart-home-energy/data.js';
const run = (s = selection(), b = approvedBook()) => estimate(s, projectPublicCatalog(b, NOW), NOW);
const total = (r, field = 'grossCents', i = 0) => r.lines.reduce((n,l) => n + l[field][i],0);
for (const c of CATEGORIES) test(`ceny: ${c.label}, warunkowy wariant testowy`, () => {
  const b = approvedBook(); const p = b.products.find(p => p.category === c.id) || b.products.find(p => p.id === 'p04');
  p.category = c.id; p.installationService = null;
  const s = selection(); s.items = [{ ...s.items[0], deviceId:p.id, category:c.id, ownership:'existing', installation:'installed', function:'read' }];
  assert.equal(run(s,b).status,'estimated');
  p.approvalStatus='pending'; assert.equal(run(s,b).price,null);
});
test('realny cennik ma 24 modele i 17 usług; kwoty publiczne wyłączone', async () => {
  const b = await loadCatalog(); const p = projectPublicCatalog(b,NOW);
  assert.equal(b.products.length,24); assert.equal(b.services.length,17); assert.equal(p.enabled,false);
  assert.ok(p.products.every(p => p.saleNetRange === null));
});
test('projekcja nie ujawnia kosztów/narzutu ani nieznanych pól', () => {
  const b = approvedBook(); b.products[0].purchaseNet=876543.21; b.products[0].secret='SECRET_SENTINEL'; b.secret='SECRET_TOP';
  const json=JSON.stringify(projectPublicCatalog(b,NOW));
  assert.doesNotMatch(json,/purchaseNet|markupRule|internalPolicy|876543|SECRET|historical/);
});
test('niezatwierdzona pozycja nie publikuje swojej ceny sprzedaży', () => {
  const b=approvedBook();b.products[3].approvalStatus='pending';b.products[3].saleNetRange=[765432,765432];
  assert.equal(projectPublicCatalog(b,NOW).products[3].saleNetRange,null);
});
for (const mutation of ['book-pending','book-expired','book-future','rule-pending','product-expired','service-pending','vat-unknown','quantity-unknown','infra-unknown','delivery-unknown','host-unknown','complexity-unknown','support-unknown']) test(`brak pewnej ceny: ${mutation}`, () => {
  const b=approvedBook();const s=selection();s.delivery='local';
  if(mutation==='book-pending')b.approvalStatus='pending';
  if(mutation==='book-expired')b.validUntil='2026-01-01';
  if(mutation==='book-future')b.validFrom='2027-01-01';
  if(mutation==='rule-pending')b.rules.approvalStatus='pending';
  if(mutation==='product-expired')b.products.find(p=>p.id==='p04').validUntil='2026-01-01';
  if(mutation==='service-pending')b.services.find(p=>p.id==='integration').approvalStatus='pending';
  if(mutation==='vat-unknown')b.products.find(p=>p.id==='p04').vatApproved=false;
  if(mutation==='quantity-unknown')s.items[0].quantity=null;
  if(mutation==='infra-unknown')s.infrastructure='unknown';
  if(mutation==='delivery-unknown')s.delivery='unknown';
  if(mutation==='host-unknown')s.host='unknown';
  if(mutation==='complexity-unknown')s.complexity='unknown';
  if(mutation==='support-unknown')s.support='unknown';
  assert.equal(run(s,b).price,null);
});
test('local: sprzęt i roboty osobno, VAT 23%, zaokrąglenie na zewnątrz', () => {
  const s=selection();s.delivery='local';const r=run(s);
  assert.equal(r.status,'estimated'); assert.deepEqual(r.price.vatRates,[23]);
  assert.ok(r.lines.some(l=>l.group==='installation'));assert.ok(r.lines.some(l=>l.group==='hardware'));
  assert.ok(r.price.low*100<=total(r));assert.ok(r.price.high*100>=total(r,'grossCents',1));
  for(const l of r.lines) assert.equal(l.grossCents[0],l.netCents[0]+Math.round(l.netCents[0]*.23));
});
test('VAT mieszany 8/23 i zwolnienie 0 liczone per pozycja', () => {
  const b=approvedBook();const s=selection();s.delivery='local';b.products.find(p=>p.id==='p04').vatRate=8;b.products.find(p=>p.id==='p01').vatRate=0;
  const r=run(s,b);assert.deepEqual(r.price.vatRates,[0,8,23]);
  for(const l of r.lines)assert.equal(l.vatCents[0],Math.round(l.netCents[0]*l.vatRate/100));
});
test('kwota sprzedaży zmienia wynik po aktualizacji i przestaje być pewna po wygaśnięciu', () => {
  const b=approvedBook();const s=selection();s.delivery='local';const r=run(s,b);b.products.find(p=>p.id==='p04').saleNetRange=[200,220];
  assert.ok(total(run(s,b))>total(r));b.products.find(p=>p.id==='p04').validUntil='2026-01-01';assert.equal(run(s,b).price,null);
});
test('rabat ilościowy tylko na sprzęt, bez powtórnego rabatu robocizny', () => {
  const b=approvedBook();const s=selection();s.delivery='local';s.items[0].quantity=10;const before=run(s,b);b.rules.quantityDiscounts=[{from:5,percent:5},{from:10,percent:10}];const after=run(s,b);
  assert.equal(after.lines.find(l=>l.key==='hardware:p04').netCents[0],90000);
  assert.equal(after.lines.find(l=>l.group==='installation').netCents[0],before.lines.find(l=>l.group==='installation').netCents[0]);
});
test('minimum konfiguracji i minimum zlecenia to dopełnienia, nie dwie pełne opłaty', () => {
  const b=approvedBook();const s=selection();s.delivery='local';b.rules.minimumConfigurationNet=1000;b.rules.minimumOrderNet=5000;
  const r=run(s,b);assert.equal(total(r,'netCents'),500000);assert.ok(r.lines.some(l=>l.id==='minimum-configuration'));assert.ok(r.lines.some(l=>l.id==='minimum-order'));
});
test('rozbudowa posiadanej centrali ma odrębną bazę i minimum', () => {
  const b=approvedBook();const s=selection();s.delivery='local';s.host='owned';s.items[0].ownership='existing';s.items[0].installation='installed';b.rules.minimumOrderNet=5000;b.rules.minimumExpansionNet=1000;
  const r=run(s,b);assert.equal(total(r,'netCents'),100000);assert.ok(!r.lines.some(l=>l.id==='p01'||l.id==='base'||l.group==='installation'));
});
test('wspólna centrala, radio i instancja Shelly naliczane tylko raz', () => {
  const s=selection();s.delivery='local';s.items.push({...s.items[0],deviceId:'p05',category:'blinds',quantity:4});s.items.push({...s.items[0],deviceId:'p06',category:'other',quantity:2,systemId:'zha-main'});
  const r=run(s);assert.equal(r.status,'estimated');assert.equal(r.lines.filter(l=>l.id==='p01').length,1);assert.equal(r.lines.filter(l=>l.id==='p03').length,1);assert.equal(r.lines.find(l=>l.id==='integration').quantity,2);assert.equal(r.lines.find(l=>l.id==='point').quantity,8);
});
test('dwie bramki tej samej marki liczone osobno, różne protokoły pod jednym ID odrzucane', () => {
  const s=selection();s.delivery='local';s.items.push({...s.items[0],deviceId:'p05',category:'blinds',systemId:'shelly-second'});assert.equal(run(s).lines.find(l=>l.id==='integration').quantity,2);
  s.items.push({...s.items[0],deviceId:'p06',category:'other'});assert.equal(run(s).price,null);
});
test('PV i magazyn na jednej bramce: jedna integracja, warunkowy wspólny punkt', () => {
  const b=approvedBook();b.products.find(p=>p.id==='storage-existing').systemType='fronius';b.products.find(p=>p.id==='storage-existing').pointsPerUnit=0;
  const s=selection();s.delivery='local';s.items=[{...s.items[0],deviceId:'fronius-existing',category:'pv',ownership:'existing',installation:'installed',function:'read',systemId:'energy-main',quantity:1},{...s.items[0],deviceId:'storage-existing',category:'storage',ownership:'existing',installation:'installed',function:'read',systemId:'energy-main',quantity:1}];
  const r=run(s,b);assert.equal(r.lines.find(l=>l.id==='integration').quantity,1);assert.equal(r.lines.find(l=>l.id==='point').quantity,1);
});
test('zdalnie + nowe moduły elektryczne wymaga indywidualnej oceny', () => assert.equal(run().price,null));
test('zdalnie istniejące urządzenia bez montażu, bez dojazdu, dodatkowe uruchomienie', () => {
  const s=selection();s.items[0].ownership='existing';s.items[0].installation='installed';const r=run(s);assert.equal(r.status,'estimated');assert.ok(!r.lines.some(l=>l.group==='installation'||l.id==='travel'));assert.ok(r.lines.some(l=>l.id==='remote'));
});
for(const func of ['control','power'])test(`niebezpieczna automatyczna kwalifikacja energii: ${func}`,()=>{
  const s=selection();s.delivery='local';s.items[0]={...s.items[0],deviceId:func==='control'?'storage-existing':'ev-existing',category:func==='control'?'storage':'ev',ownership:'existing',installation:'installed',function:func};assert.equal(run(s).price,null);
});
test('brak dojazdu/automatyzacji/różne drogi sterowania nie są zerem', () => {
  const s=selection();s.delivery='local';s.locality='Nieznana';assert.equal(run(s).price,null);s.locality='Głogów';s.simpleScenes=null;assert.equal(run(s).price,null);s.simpleScenes=0;s.items[0].control='mixed';assert.equal(run(s).price,null);
});
test('wsparcie jednorazowe dodaje usługę, abonamenty są stale wyłączone', () => {
  const s=selection();s.delivery='local';s.support='extended';assert.ok(run(s).lines.some(l=>l.id==='support-extended'));assert.equal(projectPublicCatalog(approvedBook(),NOW).subscriptionsEnabled,false);
});
test('duplikaty i nietypowe ilości odrzucane', () => {
  for(const n of [0,-1,.5,1000,Infinity,'2']) {const s=selection();s.items[0].quantity=n;assert.equal(run(s).price,null);}
  const s=selection();s.delivery='local';s.items.push({...s.items[0]});assert.equal(run(s).price,null);
});
test('publiczny build zawiera wyłącznie zasoby witryny i nie zawiera pól poufnych', async t => {
  const cwd=await publicBuildFixture(t);
  const result=spawnSync(process.execPath,['scripts/build.js'],{encoding:'utf8',cwd});assert.equal(result.status,0,result.stderr);
  const walk=dir=>readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(`${dir}/${e.name}`):[`${dir}/${e.name}`]);
  const files=walk(join(cwd,'dist'));assert.ok(!files.some(p=>/backend|tests|docs|catalog\.seed|\.json$/.test(p)));
  for(const p of files.filter(p=>/\.(js|html|css)$/.test(p)))assert.doesNotMatch(readFileSync(p,'utf8'),/purchaseNet|unitCostNet|internalPolicy|marginPercent|markupPercent|profitAfterIncludedCostsNet|SECRET_SENTINEL|catalog\.seed/);
});
test('mieszany VAT minimum wymaga kwalifikacji, nie tworzy odwróconych widełek',()=>{
 const b=approvedBook();const s=selection();s.delivery='local';b.services.find(s=>s.id==='base').vatRate=8;b.rules.minimumConfigurationNet=2000;assert.equal(run(s,b).price,null);
});
test('nieznana posiadana centrala nie jest automatycznie rozbudową Home Assistant',()=>{
 const s=selection();s.delivery='local';s.host='owned';s.ownedHostModel='dowolna bramka';assert.equal(run(s).price,null);
});
test('posiadane zgodne radio lub zamiennik nie są kupowane ponownie',()=>{
 const s=selection();s.delivery='local';s.items=[{...s.items[0],deviceId:'p06',category:'other',systemId:'zha-main'}];
 s.radioChoice='p02';s.ownedInfrastructure=['p02'];const r=run(s);assert.equal(r.status,'estimated');assert.ok(!r.lines.some(l=>l.id==='p03'||l.id==='p02'));
 s.radioChoice='unknown';assert.equal(run(s).price,null);
});
