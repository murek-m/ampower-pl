// Wyłącznie loopback, dane syntetyczne, bez zewnętrznej poczty i Turnstile.
import assert from 'node:assert/strict';
import { mkdtemp, rm, mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
const { chromium } = await import(process.env.AMPOWER_PLAYWRIGHT_MODULE || 'playwright').catch(() => { throw new Error('QA wymaga Playwright: ustaw AMPOWER_PLAYWRIGHT_MODULE.'); });
import { createInquiryServer } from '../backend/server.js';
import { FileStore } from '../backend/store.js';
import { loadCatalog, projectPublicCatalog } from '../backend/catalog.js';
import { approvedBook, NOW } from '../tests/sales-fixtures.mjs';
const origin='http://127.0.0.1:4180';
const output='docs/ampower-sales/qa';
await mkdir(output,{recursive:true});
const temp=await mkdtemp(join(tmpdir(),'ampower-e2e-'));const store=new FileStore(temp);
const api=createInquiryServer({store,book:await loadCatalog(),allowedOrigin:origin,verifySpam:async t=>t==='',rateLimit:100});
api.listen(0,'127.0.0.1');await once(api,'listening');
const endpoint=`http://127.0.0.1:${api.address().port}/api/inquiries`;
const staticServer=spawn('python3',['-m','http.server','4180','--bind','127.0.0.1','--directory','dist'],{stdio:'ignore'});
for(let i=0;i<50;i++){try{if((await fetch(origin)).ok)break;}catch{}await new Promise(r=>setTimeout(r,100));}
const browser=await chromium.launch({headless:true,...(process.env.AMPOWER_CHROME_PATH?{executablePath:process.env.AMPOWER_CHROME_PATH}:{})});
const results=[],errors=[],layouts=[];
async function context({enable=false,prices=false}={}) {
  const ctx=await browser.newContext({viewport:{width:1440,height:900},reducedMotion:'reduce'});
  await ctx.route('**/*',async route=>{
    const url=new URL(route.request().url());
    if(![origin,new URL(endpoint).origin].includes(url.origin))return route.abort();
    if(enable&&url.pathname.endsWith('/inquiry-config.js'))return route.fulfill({contentType:'application/javascript',body:`export const INQUIRY_CONFIG = ${JSON.stringify({enabled:true,endpoint,dataNoticeVersion:'local-test-v1',turnstileSiteKey:null})};`});
    if(prices&&url.pathname.endsWith('/price-book.js'))return route.fulfill({contentType:'application/javascript',body:`export const PRICE_BOOK = ${JSON.stringify(projectPublicCatalog(approvedBook(),NOW))};`});
    return route.continue();
  });
  return ctx;
}
async function fresh(ctx){const p=await ctx.newPage();p.on('pageerror',e=>errors.push(e.message));await p.goto(origin+'/smart-home-energy/');await p.locator('#smart-form').waitFor({state:'visible'});if(await p.locator('#cookie-banner').isVisible())await p.locator('#cookie-reject').click();return p;}
async function fill(p){await p.locator('#category-lights').check();await p.locator('#goal-app').check();await p.locator('#name').fill('E2E TEST');await p.locator('#email').fill('qa@example.invalid');await p.locator('#locality').fill('Głogów');if(await p.locator('#dataNoticeAccepted').isVisible())await p.locator('#dataNoticeAccepted').check();}
async function run(name,fn){try{await fn();results.push({name,status:'passed'});console.log('PASS '+name);}catch(e){results.push({name,status:'failed',error:e.message});console.log('FAIL '+name+': '+e.message);}}
try{
 const disabled=await context();
 await run('Wyłączony odbiornik: brak fałszywego sukcesu i zachowanie danych',async()=>{const p=await fresh(disabled);await fill(p);assert.equal(await p.locator('#send-inquiry').isVisible(),false);assert.equal(await p.locator('#dataNoticeAccepted').isVisible(),false);await p.locator('#preview-config').click();await p.locator('#draft-panel').waitFor({state:'visible'});assert.equal(await p.locator('#name').inputValue(),'E2E TEST');assert.equal((await store.records()).length,0);await p.close();});
 await run('Walidacja nowych pól, focus i brak utraty konfiguracji',async()=>{const validation=await context({enable:true});const p=await fresh(validation);await p.locator('#send-inquiry').click();assert.equal(await p.locator('#error-list li').count(),6);assert.equal(await p.evaluate(()=>document.activeElement.id),'error-summary');await fill(p);await p.locator('#email').fill('bledny');await p.locator('#send-inquiry').click();assert.equal(await p.locator('#email').getAttribute('aria-invalid'),'true');await p.close();});
 await run('12 kategorii i 66 par: bez kwot przy braku zatwierdzenia',async()=>{const p=await fresh(disabled);const ids=await p.locator('[name=category]').evaluateAll(ns=>ns.map(n=>n.value));assert.equal(ids.length,12);for(let i=0;i<ids.length;i++)for(let j=i+1;j<ids.length;j++){await p.locator('#category-'+ids[i]).check();await p.locator('#category-'+ids[j]).check();assert.equal(await p.locator('#price-title').innerText(),'Wymaga indywidualnej wyceny');assert.equal(await p.locator('#summary-categories li').count(),2);await p.locator('#category-'+ids[i]).uncheck();await p.locator('#category-'+ids[j]).uncheck();}await p.close();});
 await run('Mobile, desktop, ciemny motyw i większy tekst',async()=>{const p=await fresh(disabled);await fill(p);for(const w of [320,360,390,768,880,881,1024,1100,1201,1440]){await p.setViewportSize({width:w,height:900});await p.evaluate(()=>document.fonts.ready);const size=await p.evaluate(()=>({client:document.documentElement.clientWidth,scroll:document.documentElement.scrollWidth}));layouts.push({width:w,...size});assert.ok(size.scroll<=size.client+1,JSON.stringify(size));}await p.locator('#konfigurator').scrollIntoViewIfNeeded();await p.screenshot({path:output+'/DESKTOP.png'});await p.setViewportSize({width:390,height:844});await p.screenshot({path:output+'/MOBILE.png'});await p.emulateMedia({colorScheme:'dark'});await p.screenshot({path:output+'/DARK.png'});await p.addStyleTag({content:'html{font-size:200%}body{font-size:34px}'});assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth+1));await p.close();});
 const active=await context({enable:true});
 await run('Rzeczywisty lokalny zapis przez formularz i CORS, numer i brak duplikatu',async()=>{const p=await fresh(active);await fill(p);await p.locator('#phone').fill('+48 785 000 000');await p.locator('#send-inquiry').click();await p.getByText(/Przyjęto zapytanie. Numer:/).waitFor();const status=await p.locator('#action-status').innerText();const id=status.match(/AMP-[0-9a-f-]{36}/)[0];const r=await store.find(id);assert.equal(r.data.phone,'+48 785 000 000');assert.ok(r.internalDraft.lines.length);assert.equal(r.internalCalculation.status,'incomplete');await p.locator('#send-inquiry').click();await p.getByText(/Przyjęto zapytanie. Numer:/).waitFor();assert.equal((await store.records()).length,1);await p.close();});
 await run('Utrata odpowiedzi po zapisie: ponowienie zachowuje ten sam numer',async()=>{const p=await fresh(active);let first=true;await p.route('**/api/inquiries',async route=>{if(first){first=false;await route.fetch();await route.abort();}else await route.continue();});await fill(p);await p.locator('#notes').fill('lost-response-test');await p.locator('#send-inquiry').click();await p.getByText(/Nie udało się potwierdzić odbioru/).waitFor();const saved=(await store.records()).find(r=>r.data.notes==='lost-response-test');assert.ok(saved);await p.locator('#send-inquiry').click();await p.getByText(/Przyjęto zapytanie. Numer:/).waitFor();assert.match(await p.locator('#action-status').innerText(),new RegExp(saved.receipt.inquiryId));assert.equal((await store.records()).filter(r=>r.data.notes==='lost-response-test').length,1);await p.close();});
 await run('503 i pozorny sukces: bez komunikatu przyjęcia, dane zachowane',async()=>{const p=await fresh(active);await fill(p);await p.route('**/api/inquiries',r=>r.fulfill({status:503,contentType:'application/json',body:'{}',headers:{'Access-Control-Allow-Origin':origin}}));await p.locator('#send-inquiry').click();await p.getByText(/nie przyjął zapytania/).waitFor();assert.equal(await p.locator('#email').inputValue(),'qa@example.invalid');await p.unroute('**/api/inquiries');await p.route('**/api/inquiries',r=>r.fulfill({status:200,contentType:'application/json',body:'{"success":true}',headers:{'Access-Control-Allow-Origin':origin}}));await p.locator('#send-inquiry').click();await p.getByText(/Nie udało się potwierdzić odbioru/).waitFor();await p.close();});
 const priced=await context({prices:true});
 await run('Widełki brutto odświeżają się po ilości i automatyzacjach; status niepewnej konfiguracji',async()=>{const p=await fresh(priced);await fill(p);await p.locator('#details-lights summary').click();await p.locator('#lights-quoteDevice').selectOption('p04');await p.locator('#lights-ownership').selectOption('existing');await p.locator('#lights-status').selectOption('installed');await p.locator('#lights-count').fill('2');await p.locator('#lights-systemId').fill('shelly-main');await p.locator('.common-details summary').click();await p.locator('#host').selectOption('owned');await p.locator('#hostModel').fill('Green');await p.locator('#infrastructure').selectOption('ready');await p.locator('#complexity').selectOption('simple');await p.locator('#simpleScenes').fill('0');await p.locator('#advancedScenes').fill('0');await p.locator('#delivery-local').check();assert.match(await p.locator('#price-title').innerText(),/Szacunkowy koszt instalacji/);assert.match(await p.locator('#price-reason').innerText(),/brutto.*VAT: 23/);const before=await p.locator('#price-title').innerText();await p.locator('#lights-count').fill('20');assert.notEqual(await p.locator('#price-title').innerText(),before);const quantity=await p.locator('#price-title').innerText();await p.locator('#simpleScenes').fill('5');assert.notEqual(await p.locator('#price-title').innerText(),quantity);await p.locator('#infrastructure').selectOption('unknown');assert.equal(await p.locator('#price-title').innerText(),'Wymaga indywidualnej wyceny');await p.close();});
 await run('Konsola: brak błędów w przetestowanych przepływach',async()=>assert.deepEqual(errors,[]));
 await writeFile(output+'/SALES_E2E_RESULTS.json',JSON.stringify({date:new Date().toISOString(),browser:await browser.version(),results,layouts,errors,externalEmailsSent:0},null,2));
 if(results.some(r=>r.status==='failed'))process.exitCode=1;
}finally{await browser.close();staticServer.kill();await new Promise(resolve=>api.close(resolve));await rm(temp,{recursive:true,force:true});}
