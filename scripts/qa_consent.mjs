// Google endpoints are fulfilled with a synthetic SDK; only the local test server
// receives network traffic. No real Google events, messages or accounts are used.
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,rm,writeFile} from 'node:fs/promises';
import {tmpdir,homedir} from 'node:os';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {once} from 'node:events';
import {ReviewsStore} from '../backend/reviews-store.js';
import {createReviewsServer} from '../backend/reviews-server.js';
const {chromium}=await import(process.env.AMPOWER_PLAYWRIGHT_MODULE||pathToFileURL(join(homedir(),'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs')).href);
const directory=await mkdtemp(join(tmpdir(),'ampower-consent-qa-')),store=new ReviewsStore(directory);
const server=createReviewsServer({store,password:'synthetic-consent-test-password'});server.listen(0,'127.0.0.1');await once(server,'listening');
const local=`http://127.0.0.1:${server.address().port}`,virtual='https://ampower.pl';
const browser=await chromium.launch({headless:true,executablePath:process.env.AMPOWER_CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
const output='output/murek-review';await mkdir(output,{recursive:true});
const results=[],contexts=[];
const sdk=`window.__qaEvents=[];const record=x=>{if(x[0]==='event'&&!window['ga-disable-G-3D328MRNWG'])window.__qaEvents.push(Array.from(x));};window.dataLayer.forEach(record);const push=window.dataLayer.push.bind(window.dataLayer);window.dataLayer.push=function(x){record(x);return push(x);};if(!window['ga-disable-G-3D328MRNWG'])document.cookie='_ga=synthetic-only;Path=/;SameSite=Lax;Secure';`;
async function context({saved,privacy=false,storageBlocked=false,abortSDK=false,useLocal=false}={}) {
  const ctx=await browser.newContext({viewport:{width:390,height:844}}),google=[],blocked=[],errors=[];contexts.push(ctx);
  await ctx.addInitScript(({saved,privacy,storageBlocked})=>{
    if(saved) localStorage.setItem('ampower-consent-v3',JSON.stringify(saved));
    if(privacy)Object.defineProperty(navigator,'globalPrivacyControl',{value:true});
    if(storageBlocked)Storage.prototype.setItem=function(){throw new Error('Synthetic storage denial');};
    window.addEventListener('click',event=>{if(event.target.closest?.('a[href^="mailto:"],a[href^="tel:"],a[href^="sms:"]'))event.preventDefault();},true);
  },{saved,privacy,storageBlocked});
  ctx.on('page',p=>{p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error'&&/Content Security Policy|violates.*directive/i.test(m.text()))errors.push(m.text());});});
  await ctx.route('**/*',async route=>{
    const url=new URL(route.request().url());
    if(url.origin===virtual){const r=await fetch(local+url.pathname+url.search);return route.fulfill({status:r.status,headers:{'Content-Type':r.headers.get('content-type')||'application/octet-stream'},body:Buffer.from(await r.arrayBuffer())});}
    if(useLocal&&url.origin===local)return route.continue();
    if(url.origin==='https://www.googletagmanager.com'&&url.pathname==='/gtag/js') {google.push(url.href);return abortSDK?route.abort():route.fulfill({contentType:'application/javascript',body:sdk});}
    blocked.push(url.origin+url.pathname);return route.abort();
  });
  const page=await ctx.newPage();return {ctx,page,google,blocked,errors,url:useLocal?local:virtual};
}
async function go(s,path='/'){await s.page.goto(s.url+path);await s.page.waitForFunction(()=>Boolean(window.AmpowerConsent));}
const choice=analytics=>({version:3,analytics,savedAt:Date.now()});
async function run(name,fn){try{await fn();results.push({name,status:'passed'});console.log('PASS '+name);}catch(e){results.push({name,status:'failed',error:e.message});console.error('FAIL '+name+': '+e.message);}}
try {
  await run('Pierwsza wizyta: baner na trzech stronach, zero Google i cookies przed wyborem',async()=>{
    const s=await context();for(const path of ['/','/smart-home-energy/','/prywatnosc/']){await go(s,path);assert.equal(await s.page.locator('#cookie-banner').isVisible(),true);assert.equal(await s.page.locator('[data-cookie-settings]').isVisible(),true);}
    assert.equal(s.google.length,0);assert.deepEqual(await s.ctx.cookies(),[]);assert.deepEqual(s.blocked,[]);assert.deepEqual(s.errors,[]);
  });
  await run('Odmowa jest zapamiętana i nie uruchamia Google',async()=>{const s=await context();await go(s);await s.page.locator('#cookie-reject').click();await s.page.reload();assert.equal(await s.page.locator('#cookie-banner').isVisible(),false);assert.equal(await s.page.evaluate(()=>window.AmpowerConsent.getState().analytics),false);assert.equal(s.google.length,0);assert.deepEqual(await s.ctx.cookies(),[]);});
  await run('Zgoda uruchamia jeden tag i jawny page_view; CSP nie blokuje',async()=>{const s=await context();await go(s);await s.page.locator('#cookie-accept').click();await s.page.waitForFunction(()=>window.__qaEvents?.length===1);assert.equal(s.google.length,1);assert.equal(await s.page.evaluate(()=>window.__qaEvents[0][1]),'page_view');assert.equal(await s.page.evaluate(()=>window.AmpowerAnalytics.enabled),true);assert.ok((await s.ctx.cookies()).some(c=>c.name==='_ga'));assert.deepEqual(s.blocked,[]);assert.deepEqual(s.errors,[]);await s.page.screenshot({path:output+'/CONSENT-ACCEPTED-MOBILE.png'});});
  await run('Wycofanie zgody zatrzymuje pomiar i usuwa cookies Google',async()=>{const s=await context();await go(s);await s.page.locator('#cookie-accept').click();await s.page.waitForFunction(()=>window.__qaEvents?.length===1);await s.page.locator('[data-cookie-settings]').click();await s.page.locator('#cookie-reject').click();assert.equal(await s.page.evaluate(()=>window['ga-disable-G-3D328MRNWG']),true);assert.equal((await s.ctx.cookies()).some(c=>c.name==='_ga'),false);await s.page.reload();assert.equal(s.google.length,1);assert.equal(await s.page.evaluate(()=>window.AmpowerAnalytics.enabled),false);});
  await run('Ważna zgoda nie pokazuje banera; Smart Home nie ładuje Google',async()=>{const s=await context({saved:choice(true)});await go(s,'/smart-home-energy/');assert.equal(await s.page.locator('#cookie-banner').isVisible(),false);assert.equal(s.google.length,0);await go(s);await s.page.waitForFunction(()=>window.__qaEvents?.length===1);assert.equal(s.google.length,1);});
  await run('Wygasła zgoda wymaga nowego wyboru',async()=>{const s=await context({saved:{...choice(true),savedAt:Date.now()-181*86400000}});await go(s);assert.equal(await s.page.locator('#cookie-banner').isVisible(),true);assert.equal(s.google.length,0);});
  await run('Adres z parametrami i GPC wyłączają Google mimo zapisanej zgody',async()=>{for(const options of [{saved:choice(true)},{saved:choice(true),privacy:true}]){const s=await context(options);await go(s,options.privacy?'/':'/?email=synthetic@example.invalid');assert.equal(s.google.length,0);assert.equal(await s.page.evaluate(()=>window.AmpowerAnalytics.enabled),false);}});
  await run('Podgląd lokalny nie wysyła statystyk nawet po zgodzie',async()=>{const s=await context({useLocal:true});await go(s);await s.page.locator('#cookie-accept').click();assert.equal(s.google.length,0);assert.equal(await s.page.evaluate(()=>window.AmpowerAnalytics.enabled),false);});
  await run('Brak zapisu w pamięci nie blokuje wyboru ani strony',async()=>{const s=await context({storageBlocked:true});await go(s);await s.page.locator('#cookie-reject').click();assert.equal(await s.page.locator('#cookie-banner').isVisible(),false);assert.deepEqual(s.errors,[]);assert.equal(s.google.length,0);});
  await run('Awaria skryptu Google nie blokuje witryny',async()=>{const s=await context({abortSDK:true});await go(s);await s.page.locator('#cookie-accept').click();await s.page.waitForFunction(()=>!window.AmpowerAnalytics.enabled);assert.equal(await s.page.locator('h1').count(),1);assert.equal(await s.page.locator('a[href="tel:+48785668797"]').first().isVisible(),true);assert.deepEqual(s.errors,[]);});
  await run('Kontakt przekazuje tylko metodę, bez treści wiadomości i danych formularza',async()=>{const s=await context();await go(s);await s.page.locator('#cookie-accept').click();await s.page.waitForFunction(()=>window.__qaEvents?.length===1);await s.page.locator('#kontakt a[href^="mailto:"]').first().click();const events=await s.page.evaluate(()=>window.__qaEvents);assert.equal(events.at(-1)[1],'contact_click');assert.equal(events.at(-1)[2].method,'mailto');assert.deepEqual(Object.keys(events.at(-1)[2]).sort(),['method','page_location']);assert.deepEqual(s.blocked,[]);});
  await run('Baner 320/390/1440 bez poziomego przewijania i z równymi przyciskami',async()=>{const s=await context();await go(s);for(const width of [320,390,1440]){await s.page.setViewportSize({width,height:844});assert.ok(await s.page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));assert.equal(await s.page.locator('#cookie-reject').isVisible(),true);assert.equal(await s.page.locator('#cookie-accept').isVisible(),true);}await s.page.setViewportSize({width:390,height:844});await s.page.screenshot({path:output+'/CONSENT-BANNER-MOBILE.png'});});
}finally{
 await writeFile(output+'/CONSENT-RESULTS.json',JSON.stringify({date:new Date().toISOString(),realGoogleRequests:0,virtualProductionOrigin:virtual,results},null,2));
 for(const ctx of contexts)await ctx.close();await browser.close();server.closeAllConnections();await new Promise(r=>server.close(r));store.close();await rm(directory,{recursive:true,force:true});
}
if(results.some(r=>r.status==='failed'))process.exitCode=1;
