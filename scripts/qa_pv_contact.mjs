import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
const pw=await import(process.env.AMPOWER_PLAYWRIGHT_MODULE||'playwright');
const origin=new URL(process.env.AMPOWER_PV_QA_URL||'http://127.0.0.1:49372');assert.ok(['127.0.0.1','localhost','[::1]'].includes(origin.hostname));
const output=process.env.AMPOWER_QA_OUTPUT||'output/qa-pv-contact';await mkdir(output,{recursive:true});const results=[];
for(const engine of ['chromium','webkit']){
 const browser=await pw[engine].launch({headless:true,...(engine==='chromium'&&process.env.AMPOWER_CHROME_PATH?{executablePath:process.env.AMPOWER_CHROME_PATH}:{})});
 for(const scenario of ['specification','mailto']){
  const ctx=await browser.newContext({viewport:{width:1440,height:900},reducedMotion:'reduce'});
  await ctx.route('**/*',r=>new URL(r.request().url()).origin===origin.origin&&['GET','HEAD'].includes(r.request().method())?r.continue():r.abort());
  await ctx.addInitScript(()=>Object.defineProperty(navigator,'clipboard',{value:{writeText:async text=>{window.copied=text;}}}));
  const p=await ctx.newPage();const errors=[];p.on('pageerror',e=>errors.push(e.message));
  const ready=()=>p.waitForFunction(()=>document.querySelector('#results')?.getAttribute('aria-busy')==='false'&&!document.querySelector('#results')?.classList.contains('stale'));
  try{
   await p.goto(new URL('advanced.html',origin).href);await ready();
   await p.locator('#prepare-inquiry').click();let initial=await p.locator('#draft').inputValue();
   if(scenario==='specification'){
    assert.match(initial,/Liczba urządzeń: 1 szt/);assert.match(initial,/151 TH\/s.*2642 W/);assert.match(initial,/parametry katalogowe/);
    await p.locator('#draft').fill(initial+'\nUWAGA QA <img src=x onerror=alert(1)>');
    await p.locator('#tab-mining').click();await p.locator('#f-quantity').fill('3');await p.locator('[data-key="deviceSpecs.s21-151.th"]').fill('150');await p.locator('[data-key="deviceSpecs.s21-151.watts"]').fill('2500');await ready();
    assert.equal(await p.locator('#mail-draft').getAttribute('href'),null);
    await p.locator('#refresh-draft').click();const text=await p.locator('#draft').inputValue();
    for(const re of [/Liczba urządzeń: 3 szt/,/150 TH\/s.*2500 W/,/7,50 kW/,/własne założenia/,/Chłodzenie dodatkowe.*30 W/,/Limit importu dla ASIC: 0 kW/,/UWAGA QA <img/])assert.match(text,re);
    assert.equal(await p.locator('#inquiry-draft img').count(),0);
    await p.locator('[data-active="s21-pro"]').click();assert.equal(await p.locator('#mail-draft').getAttribute('href'),null);await p.locator('#refresh-draft').click();assert.match(await p.locator('#draft').inputValue(),/S21 Pro/);
   }else{
    for(const value of ['ASCII test','ą'.repeat(2000),'🙂'.repeat(1000),'a'.repeat(9000),'x\ud800']){
     await p.evaluate(v=>{const el=document.querySelector('#draft');el.value=v;el.dispatchEvent(new Event('input',{bubbles:true}));},value);
     const href=await p.locator('#mail-draft').getAttribute('href');let expected;try{expected='mailto:kuba@ampower.pl?subject='+encodeURIComponent('AMPOWER PV Mining — zapytanie o indywidualną wycenę')+'&body='+encodeURIComponent(value);}catch{expected=null;}
     assert.equal(href,expected&&expected.length<=8000?expected:null);
     await p.locator('#copy-draft').click();assert.equal(await p.evaluate(()=>window.copied),value);assert.equal(await p.locator('#draft').inputValue(),value);
    }
   }
   assert.deepEqual(errors,[]);results.push({engine,scenario,status:'PASS'});
  }catch(e){results.push({engine,scenario,status:'FAIL',error:e.message});}
  await ctx.close();console.log(results.at(-1));
 }
 await browser.close();
}
await writeFile(join(output,'results.json'),JSON.stringify(results,null,2));if(results.some(r=>r.status==='FAIL'))process.exitCode=1;
