import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
import {chromium,webkit} from '/Users/jb/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
const origin=process.env.AMPOWER_FIX_ORIGIN||'http://127.0.0.1:49373',out=process.env.AMPOWER_FIX_OUTPUT;assert.ok(out);const results=[];
for(const [engine,type] of Object.entries({chromium,webkit})){
 const browser=await type.launch({headless:true,...(engine==='chromium'?{executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'}:{})});
 const c=await browser.newContext({viewport:{width:390,height:900}});const blocked=[],errors=[],http=[];
 await c.route('**/*',r=>{const q=r.request();if(new URL(q.url()).origin===origin&&['GET','HEAD'].includes(q.method()))return r.continue();blocked.push({url:q.url(),method:q.method()});return r.abort();});
 const p=await c.newPage();p.on('pageerror',e=>errors.push(e.message));p.on('response',r=>{if(r.status()>=400)http.push({url:r.url(),status:r.status()});});p.setDefaultTimeout(15000);
 async function run(name,fn){try{await fn();results.push({engine,name,status:'PASS'});}catch(e){results.push({engine,name,status:'FAIL',error:e.message});await p.screenshot({path:out+'/'+engine+'-'+name+'.png',fullPage:true}).catch(()=>{});}console.log(results.at(-1));}
 await p.goto(origin+'/smart-home-energy/');await p.locator('#smart-form').waitFor();if(await p.locator('#cookie-reject').isVisible())await p.locator('#cookie-reject').click();
 await run('prices-12-categories-66-pairs',async()=>{const ids=await p.locator('[name=category]').evaluateAll(es=>es.map(e=>e.value));assert.equal(ids.length,12);for(let i=0;i<ids.length;i++){await p.locator('#category-'+ids[i]).check();assert.equal(await p.locator('#price-title').innerText(),'Wymaga indywidualnej wyceny');for(let j=i+1;j<ids.length;j++){await p.locator('#category-'+ids[j]).check();assert.equal(await p.locator('#price-title').innerText(),'Wymaga indywidualnej wyceny');assert.equal(await p.locator('#summary-categories li').count(),2);await p.locator('#category-'+ids[j]).uncheck();}await p.locator('#category-'+ids[i]).uncheck();}});
 for(const width of [375,390,430,1366,1440,1920])await run('layout-'+width,async()=>{await p.setViewportSize({width,height:900});await p.evaluate(()=>document.fonts.ready);assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'horizontal overflow');await p.screenshot({path:out+'/'+engine+'-'+width+'.png'});});
 await p.setViewportSize({width:1440,height:900});await p.locator('#category-blinds').check();await p.locator('#goal-app').check();await p.locator('#email').fill('qa@example.invalid');await p.locator('#locality').fill('Wrocław');await p.locator('.common-details > summary').click();await p.locator('#radioChoice').selectOption('p03');await p.locator('#infrastructure').selectOption('ready');await p.locator('#complexity').selectOption('complex');await p.locator('#support').selectOption('extended');await p.locator('#simpleScenes').fill('3');await p.locator('#advancedScenes').fill('2');await p.locator('#delivery-local').check();
 for(const delivery of ['local','remote','unknown'])await run('draft-complete-'+delivery,async()=>{await p.locator('#delivery-'+delivery).check();await p.locator('#preview-config').click();assert.equal(await p.locator('#error-summary').isVisible(),false);const text=await p.locator('#message-preview').inputValue();const missing=['Miejscowość: Wrocław','Mam SONOFF ZBDongle-E','Sprawna sieć i gotowe punkty instalacji','liczba: 3','liczba: 2','Dodatkowe wsparcie rozszerzone'].filter(s=>!text.includes(s));assert.deepEqual(missing,[]);assert.equal(new URL(await p.locator('#open-email').getAttribute('href')).searchParams.get('body'),text);});
 for(const field of ['simpleScenes','advancedScenes'])await run('scene-validation-'+field,async()=>{
  for(const invalid of ['-1','1.5','abc']){await p.locator('#'+field).fill(invalid);await p.locator('#preview-config').click();assert.equal(await p.locator('#'+field).getAttribute('aria-invalid'),'true');assert.equal(await p.locator('#draft-panel').isVisible(),false);}
  for(const valid of ['', '0','1','999']){await p.locator('#'+field).fill(valid);await p.locator('#preview-config').click();assert.equal(await p.locator('#error-summary').isVisible(),false);assert.equal(await p.locator('#draft-panel').isVisible(),true);}
  await p.locator('#'+field).fill('0');
 });
 await run('no-production-submit',async()=>assert.equal(await p.locator('#send-inquiry').isVisible(),false));
 await run('no-runtime-http-errors',async()=>{assert.deepEqual(errors,[]);assert.deepEqual(http,[]);assert.deepEqual(blocked,[]);});await browser.close();
}
await writeFile(out+'/results.json',JSON.stringify({date:new Date().toISOString(),results},null,2));
if(results.some(r=>r.status==='FAIL'))process.exitCode=1;
