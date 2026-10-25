// Public release QA. All external traffic is blocked or fulfilled locally, including Google.
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
const engineName=process.env.AMPOWER_QA_BROWSER||'chromium';
if(!['chromium','webkit'].includes(engineName))throw new Error('AMPOWER_QA_BROWSER: chromium lub webkit');
// Safari/macOS: Option-Tab navigates buttons with the default keyboard setting.
const engine=(await import(process.env.AMPOWER_PLAYWRIGHT_MODULE||'playwright'))[engineName];
const origin=new URL(process.env.AMPOWER_QA_URL||'http://127.0.0.1:4195');
if(!['127.0.0.1','localhost'].includes(origin.hostname))throw new Error('Only local QA');
const output='docs/ampower-sales/qa/'+(engineName==='webkit'?'publication-webkit':'publication');await mkdir(output,{recursive:true});
const browser=await engine.launch({headless:true,...(engineName==='chromium'?{executablePath:process.env.AMPOWER_CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'}:{})});
const results=[],errors=[],contexts=[];
const sdk=`(() => { window.__googleLoads=(window.__googleLoads||0)+1;window.__measured=window.__measured||[];const record=value=>{if(!window['ga-disable-G-3D328MRNWG']&&value[0]==='event')window.__measured.push(Array.from(value));};window.dataLayer.forEach(record);const push=window.dataLayer.push.bind(window.dataLayer);window.dataLayer.push=function(value){record(value);return push(value);};if(!window['ga-disable-G-3D328MRNWG'])document.cookie='_ga=synthetic-test;Path=/;SameSite=Lax';})();`;
async function context(options={},googleHandler){
 const ctx=await browser.newContext(options),requests=[],blocked=[];contexts.push(ctx);
 ctx.on('page',p=>{p.on('pageerror',error=>errors.push(error.message));p.on('console',message=>{if(message.type()==='error'&&/Content Security Policy|violates.*directive/i.test(message.text()))errors.push(message.text());});});
 await ctx.route('**/*',route=>{const url=new URL(route.request().url());
  if(url.origin===origin.origin)return route.continue();
  if(url.origin==='https://www.googletagmanager.com'&&url.pathname==='/gtag/js'){
   requests.push(url.href);return googleHandler?googleHandler(route):route.fulfill({contentType:'application/javascript',body:sdk});
  }
  blocked.push(url.origin+url.pathname);return route.abort();
 });
 return {ctx,requests,blocked};
}
async function go(page,path='/'){await page.goto(origin.origin+path);await page.waitForFunction(()=>Boolean(window.AmpowerAnalytics));}
async function reject(page){if(await page.locator('#cookie-banner').isVisible())await page.locator('#cookie-reject').click();}
async function run(name,fn){try{await fn();results.push({name,status:'passed'});console.log('PASS '+name);}catch(error){results.push({name,status:'failed',error:error.message});console.error('FAIL '+name+': '+error.message);}}
try{
 await run('6 kart, krótka strona główna, menu i stopka zgodne ze wskazówkami',async()=>{
  const {ctx,requests}=await context({viewport:{width:1440,height:1000}}),p=await ctx.newPage();await go(p);await reject(p);
  assert.equal(await p.locator('#uslugi .services > .card').count(),6);assert.deepEqual(await p.locator('#uslugi .card-ref').allTextContents(),['01 / ELEKTRYKA','02 / KLIMATYZACJA','03 / ALARMY','04 / MONITORING','05 / NAWADNIANIE','06 / SMART HOME']);
  assert.equal(await p.locator('#smart-korzysci,#smart-automatyzacje,#smart-pakiety,#smart-realizacja,#smart-wsparcie,#smart-faq').count(),0);
  assert.equal(await p.locator('footer a[href*="smart-home"]').count(),0);assert.equal(await p.locator('#nav-links a[href="/smart-home-energy/"]').count(),1);
  assert.ok(!(await p.locator('meta[name="description"]').getAttribute('content')).includes('Smart Home'));assert.equal(requests.length,0);
  await p.screenshot({path:output+'/HOME-DESKTOP.png',fullPage:true});await ctx.close();
 });
 await run('Kalkulator: poprawny pusty stan oraz lista terminów i cen po wyborze',async()=>{
  const {ctx}=await context(),p=await ctx.newPage();await go(p);await reject(p);assert.equal(await p.locator('#calc-empty').isVisible(),true);assert.equal(await p.locator('#calc-rows').isVisible(),false);
  await p.locator('#c-elek').check();assert.equal(await p.locator('#calc-empty').isVisible(),false);assert.equal(await p.locator('#calc-rows').isVisible(),true);assert.equal(await p.locator('#calc-rows > p').count(),0);assert.ok(await p.locator('#calc-rows dt').count()>0);assert.equal(await p.locator('#calc-rows dt').count(),await p.locator('#calc-rows dd').count());await ctx.close();
 });
 await run('Baner i ustawienia cookies; lokalny podgląd nie wysyła statystyk',async()=>{
  const {ctx,requests,blocked}=await context(),p=await ctx.newPage();
  for(const path of ['/','/smart-home-energy/','/prywatnosc/']){await go(p,path);assert.equal(await p.locator('#cookie-banner').isVisible(),true);assert.equal(await p.locator('[data-cookie-settings]').count(),1);assert.equal(await p.evaluate(()=>window.AmpowerAnalytics.enabled),false);}
  assert.equal(requests.length,0);assert.deepEqual(blocked,[]);assert.equal((await ctx.cookies()).length,0);await ctx.close();
 });
 await run('Prosty kontakt: karta → konfigurator → wiadomość, bez obietnicy wysłania',async()=>{
  const {ctx,requests}=await context({viewport:{width:390,height:844}}),p=await ctx.newPage();await go(p);await reject(p);await p.locator('#smart-home-energy .service-link').click();await p.locator('#smart-form').waitFor({state:'visible'});await p.locator('.hero a[href="#konfigurator"]').click();
  assert.equal(await p.locator('#send-inquiry').isVisible(),false);assert.equal(await p.locator('h1').count(),1);for(const id of ['oferta','smart-korzysci','smart-automatyzacje','smart-pakiety','smart-realizacja','smart-wsparcie','smart-faq'])assert.equal(await p.locator('#'+id).count(),1);
  await p.locator('#category-lights').check();await p.locator('#goal-app').check();await p.locator('#email').fill('synthetic@example.invalid');await p.locator('#preview-config').click();await p.locator('#draft-panel').waitFor({state:'visible'});assert.ok(await p.locator('#message-preview').inputValue());assert.match(await p.locator('#action-status').innerText(),/nie potwierdza/);assert.match(await p.locator('#open-email').getAttribute('href'),/^mailto:kuba@ampower\.pl/);assert.equal(requests.length,0);await p.screenshot({path:output+'/MESSAGE-MOBILE.png'});await ctx.close();
 });
 await run('Reflow 320–1440, klawiatura, powiększenie i poziomy telefon',async()=>{
  const {ctx}=await context(),p=await ctx.newPage();
  for(const path of ['/','/smart-home-energy/','/prywatnosc/'])for(const [width,height] of [[320,800],[390,844],[844,390],[768,1024],[1440,1000]]){await p.setViewportSize({width,height});await go(p,path);await reject(p);await p.evaluate(()=>document.fonts.ready);const size=await p.evaluate(()=>({viewport:innerWidth,scroll:document.documentElement.scrollWidth}));assert.ok(size.scroll<=size.viewport+1,JSON.stringify({path,...size}));}
  for(const path of ['/','/prywatnosc/','/smart-home-energy/']){await p.setViewportSize({width:320,height:800});await go(p,path);await p.addStyleTag({content:'html{font-size:200%}body{font-size:34px}'});const large=await p.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth}));assert.ok(large.scroll<=large.width+1,JSON.stringify({path,...large}));}
  await ctx.close();
 });
 await run('Bez JS i przy awarii modułu: oferta, menu, FAQ i kontakt',async()=>{
  for(const js of [false,true]){const {ctx}=await context({javaScriptEnabled:js,viewport:{width:320,height:800}});if(js)await ctx.route('**/model.js',r=>r.abort());const p=await ctx.newPage();await p.goto(origin.origin+'/smart-home-energy/');assert.equal(await p.locator('#config-fallback').isVisible(),true);assert.equal(await p.locator('#smart-form').isVisible(),false);assert.equal(await p.locator('#smart-faq summary').count(),14);if(js){await reject(p);await p.locator('.nav-toggle').click();assert.equal(await p.locator('.nav-toggle').getAttribute('aria-expanded'),'true');}else{assert.equal(await p.locator('#nav-links a').first().isVisible(),true);await p.goto(origin.origin+'/');assert.equal(await p.locator('#nav-links a[href="/smart-home-energy/"]').isVisible(),true);assert.equal(await p.locator('[data-cookie-settings]').isVisible(),false);}await ctx.close();}
 });
 await run('Linki, SEO, sitemap i brak prywatnych ścieżek w artefakcie',async()=>{
  const {ctx}=await context(),p=await ctx.newPage();for(const path of ['/','/smart-home-energy/','/prywatnosc/']){await go(p,path);assert.equal(await p.locator('h1').count(),1);assert.equal(await p.locator('img:not([alt])').count(),0);for(const href of await p.locator('a[href^="#"]').evaluateAll(ns=>ns.map(n=>n.getAttribute('href'))))if(href.length>1)assert.equal(await p.locator(href).count(),1);}
  const smart=await ctx.request.get(origin.origin+'/smart-home-energy/');assert.match(await smart.text(),/content="index, follow"/);const sitemap=await ctx.request.get(origin.origin+'/sitemap.xml');assert.match(await sitemap.text(),/ampower.pl\/smart-home-energy\//);
  for(const path of ['/backend/catalog.seed.json','/docs/ampower-sales/11_PRZYGOTOWANIE_PUBLIKACJI.md','/.git/config','/.env','/package.json','/output/'])assert.equal((await ctx.request.get(origin.origin+path)).status(),404);await ctx.close();
 });
 await run('Zdjecia: naturalne proporcje, rowne kadry i brak overflow na telefonie/tablecie/desktopie',async()=>{
  const {ctx}=await context(),p=await ctx.newPage();
  for(const width of [320,375,390,430,768,1440]){
   await p.setViewportSize({width,height:844});await go(p);
   for(const img of await p.locator('img[src]').all()){await img.scrollIntoViewIfNeeded();await img.evaluate(async n=>{if(!n.complete)await new Promise((resolve,reject)=>{n.addEventListener('load',resolve,{once:true});n.addEventListener('error',reject,{once:true});});if(!n.naturalWidth)throw new Error('Image failed: '+n.src);});}
   const images=await p.locator('img[src]').evaluateAll(ns=>ns.map(n=>{const r=n.getBoundingClientRect(),css=getComputedStyle(n);return {src:n.getAttribute('src'),width:r.width,height:r.height,natural:n.naturalWidth/n.naturalHeight,expected:n.closest('.card-photo')?16/10:n.closest('.gallery')?16/9:n.naturalWidth/n.naturalHeight,fit:css.objectFit,cropped:Boolean(n.closest('.card-photo,.gallery'))};}));
   assert.equal(images.length,15);
   for(const img of images){assert.ok(img.width>0&&img.height>0&&Number.isFinite(img.natural),JSON.stringify(img));assert.ok(Math.abs(img.width/img.height/img.expected-1)<.015,JSON.stringify({viewport:width,...img}));if(img.cropped)assert.equal(img.fit,'cover');}
   assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  }
  await go(p,'/smart-home-energy/');for(const img of await p.locator('img').all()){await img.scrollIntoViewIfNeeded();await img.evaluate(async n=>{if(!n.complete)await new Promise((resolve,reject)=>{n.addEventListener('load',resolve,{once:true});n.addEventListener('error',reject,{once:true});});if(!n.naturalWidth)throw new Error('Image failed: '+n.src);});const ratio=await img.evaluate(n=>(n.clientWidth/n.clientHeight)/(n.naturalWidth/n.naturalHeight));assert.ok(Math.abs(ratio-1)<.015);}
  await ctx.close();
 });
 await run('Brak nieobsłużonych błędów JavaScript w zbadanych przepływach',async()=>assert.deepEqual(errors,[]));
}finally{await writeFile(output+'/RESULTS.json',JSON.stringify({date:new Date().toISOString(),browser:await browser.version(),browserEngine:engineName,realIphoneTested:false,realGoogleEventsSent:0,results,errors},null,2));for(const ctx of contexts)await ctx.close().catch(()=>{});await browser.close();}
if(results.some(r=>r.status==='failed'))process.exitCode=1;
