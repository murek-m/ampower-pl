// Targeted acceptance of repaired audit findings. Synthetic inputs, local GET/HEAD only.
import assert from 'node:assert/strict';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
const pw=await import(process.env.AMPOWER_PLAYWRIGHT_MODULE||'playwright');
const smart=new URL(process.env.AMPOWER_QA_URL||'http://127.0.0.1:49371'),pv=new URL(process.env.AMPOWER_PV_QA_URL||'http://127.0.0.1:49372');
for(const u of [smart,pv])assert.ok(['localhost','127.0.0.1','[::1]'].includes(u.hostname));
const out=process.env.AMPOWER_QA_OUTPUT||'output/qa-audit-acceptance';await mkdir(out,{recursive:true});
const results=[],versions={},profile=JSON.parse(await readFile(new URL('../pv-mining/data/profile.json',import.meta.url)));
const good=join(out,'valid.csv'),bad=join(out,'invalid.csv');
await writeFile(good,'timestamp,pv_kw,load_kw\n'+profile.map(([t,p])=>`${t},${p*10},0.5`).join('\n'));await writeFile(bad,'timestamp,pv_kw,load_kw\ninvalid,-1,no');
const ready=p=>p.waitForFunction(()=>document.querySelector('#results')?.getAttribute('aria-busy')==='false'&&!document.querySelector('#results')?.classList.contains('stale'));
const exported=async p=>{const [download]=await Promise.all([p.waitForEvent('download'),p.locator('#export').click()]);return JSON.parse(await readFile(await download.path(),'utf8'));};
for(const engine of ['chromium','webkit']){
 const browser=await pw[engine].launch({headless:true,...(engine==='chromium'&&process.env.AMPOWER_CHROME_PATH?{executablePath:process.env.AMPOWER_CHROME_PATH}:{})});versions[engine]=browser.version();
 async function run(name,width,fn){
  const c=await browser.newContext({viewport:{width,height:900},reducedMotion:'reduce'}),blocked=[],errors=[],httpErrors=[];
  await c.route('**/*',r=>{if([smart.origin,pv.origin].includes(new URL(r.request().url()).origin)&&['GET','HEAD'].includes(r.request().method()))return r.continue();blocked.push(r.request().url());return r.abort();});
  const p=await c.newPage();p.setDefaultTimeout(20000);p.on('pageerror',e=>errors.push(e.message));p.on('response',r=>{if(r.status()>=400)httpErrors.push(r.url());});p.on('console',m=>{if(m.type()==='error'&&/Content Security Policy|violates.*directive/i.test(m.text()))errors.push(m.text());});
  try{await fn(p,c);assert.deepEqual(errors,[]);assert.deepEqual(blocked,[]);assert.deepEqual(httpErrors,[]);results.push({engine,name,width,status:'PASS'});}
  catch(e){results.push({engine,name,width,status:'FAIL',error:e.message});await p.screenshot({path:join(out,`${engine}-${width}-${name.replaceAll(/[^a-z0-9]/gi,'-')}-FAIL.png`)}).catch(()=>{});}
  await c.close();console.log(results.at(-1));
 }
 for(const width of (process.env.AMPOWER_QA_FUNCTIONAL_ONLY?[]:[375,390,430,1366,1440,1920]))for(const view of ['smart','simple','advanced'])await run(view,width,async p=>{
  await p.goto(view==='smart'?new URL('/smart-home-energy/',smart).href:new URL(view+'.html',pv).href);
  if(view==='smart')await p.locator('#smart-form').waitFor({state:'visible'});else await ready(p);
  await p.evaluate(()=>document.fonts.ready);
  assert.equal(await p.locator('h1').count(),1);assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'horizontal overflow');
  const icon=await p.locator('link[rel=icon]').getAttribute('href');assert.equal((await p.request.get(new URL(icon,p.url()).href)).status(),200);
  if(view!=='smart'){assert.match(await p.locator('meta[name=robots]').getAttribute('content'),/noindex/);assert.equal(await p.locator('#export').isEnabled(),true);if(width<500){await p.locator('#toggle-inputs').click();assert.equal(await p.locator('#settings').isVisible(),false);await p.locator('#toggle-inputs').click();assert.equal(await p.locator('#settings').isVisible(),true);}}
  await p.screenshot({path:join(out,`${engine}-${width}-${view}.png`)});
 });
 await run('smart project and scenes',1440,async p=>{
  await p.goto(new URL('/smart-home-energy/',smart).href);await p.locator('#smart-form').waitFor({state:'visible'});await p.locator('#cookie-reject').click();await p.locator('#category-blinds').check();await p.locator('#goal-app').check();await p.locator('#email').fill('qa@example.invalid');
  await p.locator('.common-details > summary').click();await p.locator('#radioChoice').selectOption('p03');await p.locator('#infrastructure').selectOption('ready');await p.locator('#complexity').selectOption('complex');await p.locator('#support').selectOption('extended');await p.locator('#simpleScenes').fill('3');await p.locator('#advancedScenes').fill('2');await p.locator('#locality').fill('Wrocław');
  for(const d of ['local','remote','unknown']){
   await p.locator('#delivery-'+d).check();await p.locator('#preview-config').click();assert.equal(await p.locator('#error-summary').isVisible(),false);
   const text=await p.locator('#message-preview').inputValue();assert.equal(new URL(await p.locator('#open-email').getAttribute('href')).searchParams.get('body'),text);
   for(const phrase of ['Miejscowość: Wrocław','Mam SONOFF ZBDongle-E','Sprawna sieć i gotowe punkty instalacji','Dodatkowa diagnostyka / złożone integracje','proste automatyzacje — liczba: 3','zaawansowane automatyzacje — liczba: 2','Dodatkowe wsparcie rozszerzone'])assert.ok(text.includes(phrase),phrase);
  }
  for(const invalid of ['-1','1.5','abc']){await p.locator('#simpleScenes').fill(invalid);await p.locator('#preview-config').click();assert.equal(await p.locator('#draft-panel').isVisible(),false);assert.equal(await p.locator('#simpleScenes').getAttribute('aria-invalid'),'true');}
  for(const valid of ['', '0','999']){await p.locator('#simpleScenes').fill(valid);await p.locator('#preview-config').click();assert.equal(await p.locator('#error-summary').isVisible(),false);assert.equal(await p.locator('#draft-panel').isVisible(),true);}
 });
 await run('CSV recovery clear reset',390,async p=>{
  await p.goto(new URL('advanced.html',pv).href);await ready(p);
  await p.locator('.model-picker > summary').click();
  for(const id of await p.locator('[data-model]:checked').evaluateAll(els=>els.map(e=>e.dataset.model)))await p.locator(`[data-model="${id}"]`).uncheck();await ready(p);assert.equal(await p.locator('#export').isDisabled(),true);assert.equal(await p.locator('#results .empty-state').isVisible(),true);
  await p.locator('[data-model="s21-pro"]').check();await ready(p);
  // Use real on-disk files and the browser file chooser, not an in-memory File payload.
  async function choose(path){await p.locator('#tab-energy').click();const wait=p.waitForEvent('filechooser');await p.locator('label[for="csv-file"]').click();await(await wait).setFiles(path);}
  await choose(bad);await p.waitForFunction(()=>document.querySelector('#csv-status').textContent.includes('Nadal używamy PVGIS'));
  await choose(good);await p.locator('#csv-clear').waitFor({state:'visible'});await ready(p);assert.equal((await exported(p)).results.source,'csv');
  await p.locator('#csv-clear').click();await ready(p);assert.equal((await exported(p)).results.source,'simulation');await p.reload();await ready(p);assert.equal(await p.locator('#csv-clear').isVisible(),false);
  await choose(good);await p.locator('#csv-clear').waitFor({state:'visible'});await ready(p);await p.locator('#clear-profiles').click();await ready(p);
  await p.waitForFunction(()=>JSON.parse(sessionStorage.getItem('ampower-pv-mining-v1'))?.csvId==null);await p.reload();await ready(p);assert.equal((await exported(p)).results.source,'simulation');
  await choose(good);await p.locator('#csv-clear').waitFor({state:'visible'});await ready(p);await Promise.all([p.waitForNavigation(),p.locator('#reset').click()]);await ready(p);assert.equal(await p.locator('#csv-clear').isVisible(),false);assert.equal((await exported(p)).results.source,'simulation');
 });
 await run('slow and malformed data',390,async(p,c)=>{
  let release;const gate=new Promise(r=>release=r);let intercepted=0;
  await c.route('**/data/profile.json',async r=>{intercepted++;await gate;await r.continue();});
  await p.goto(new URL('simple.html',pv).href,{waitUntil:'domcontentloaded'});await p.locator('.loading').waitFor();assert.ok(await p.locator('#app').evaluate(e=>e.getBoundingClientRect().height>=innerHeight));assert.ok(await p.locator('.footer').evaluate(e=>e.getBoundingClientRect().top>=innerHeight));release();await ready(p);assert.equal(intercepted,1);
  await c.unroute('**/data/profile.json');let malformed=0;await c.route('**/data/profile.json',r=>{malformed++;return r.fulfill({contentType:'application/json',body:'[]'});});await p.reload();await p.locator('#retry-data').waitFor();assert.equal(malformed,1);assert.equal(await p.locator('#export').count(),0);
  await c.unroute('**/data/profile.json');await p.locator('#retry-data').click();await ready(p);
  await p.goto(new URL('index.html',pv).href);assert.match(await p.locator('meta[name=robots]').getAttribute('content'),/noindex/);assert.equal((await p.request.get(new URL(await p.locator('link[rel=icon]').getAttribute('href'),p.url()).href)).status(),200);
 });
 await browser.close();
}
await writeFile(join(out,'results.json'),JSON.stringify({versions,results},null,2));if(results.some(x=>x.status==='FAIL'))process.exitCode=1;
