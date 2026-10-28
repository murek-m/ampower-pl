import assert from 'node:assert/strict';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
const pw=await import(process.env.AMPOWER_PLAYWRIGHT_MODULE||'playwright');
const origin=new URL(process.env.AMPOWER_PV_QA_URL||'http://127.0.0.1:49372');
assert.ok(['localhost','127.0.0.1','[::1]'].includes(origin.hostname));
const output=process.env.AMPOWER_QA_OUTPUT||'output/qa-pv-forms';await mkdir(output,{recursive:true});
const results=[];
for(const engine of ['chromium','webkit']){
 const browser=await pw[engine].launch({headless:true,...(engine==='chromium'&&process.env.AMPOWER_CHROME_PATH?{executablePath:process.env.AMPOWER_CHROME_PATH}:{})});
 const ctx=await browser.newContext({viewport:{width:1440,height:900},reducedMotion:'reduce'});
 await ctx.route('**/*',r=>new URL(r.request().url()).origin===origin.origin&&['GET','HEAD'].includes(r.request().method())?r.continue():r.abort());
 const p=await ctx.newPage();const errors=[];p.on('pageerror',e=>errors.push(e.message));p.setDefaultTimeout(15000);
 const ready=()=>p.waitForFunction(()=>document.querySelector('#results')?.getAttribute('aria-busy')==='false'&&!document.querySelector('#results')?.classList.contains('stale'));
 const fill=async(key,value)=>{const el=p.locator(`[data-key="${key}"][type=number]`);const pane=await el.evaluate(e=>e.closest('[role=tabpanel]')?.id);if(pane)await p.locator(`[aria-controls="${pane}"]`).click();await el.fill(value);return el;};
 try{
  await p.goto(new URL('advanced.html',origin).href);await ready();
  await fill('horizon','1');await ready();await p.locator('#tab-energy').click();await p.locator('#f-battery').selectOption('existing');await ready();
  await p.locator('#tab-economy').click();await p.locator('#f-exportMode').selectOption('manual');await ready();
  const fields=await p.locator('input[required][type=number]').evaluateAll(els=>els.map(el=>({key:el.dataset.key,value:el.value})));
  assert.equal(fields.length,34);
  for(const {key,value}of fields){
   const el=await fill(key,'');await p.waitForFunction(()=>!document.querySelector('#input-error').hidden);
   assert.equal(await el.getAttribute('aria-invalid'),'true',key);assert.equal(await p.locator('#export').isDisabled(),true,key);assert.equal(await p.locator('#prepare-inquiry').isDisabled(),true,key);
   await fill(key,value);await ready();
  }
  await fill('pvKwp','');await p.waitForFunction(()=>!document.querySelector('#input-error').hidden);await p.reload();await p.locator('#input-error').waitFor({state:'visible'});
  assert.equal(await p.locator('#f-pvKwp').inputValue(),'');assert.equal(await p.locator('#export').isDisabled(),true);
  await fill('pvKwp','10');await ready();const pending=p.waitForEvent('download');await p.locator('#export').click();const d=await pending;const data=JSON.parse(await readFile(await d.path(),'utf8'));assert.equal(data.results.settings.pvKwp,10);assert.equal(Number(data.assumptions.pvKwp),10);
  assert.deepEqual(errors,[]);results.push({engine,status:'PASS',requiredFields:fields.length,sessionRestore:true,export:true});
 }catch(e){results.push({engine,status:'FAIL',error:e.message});await p.screenshot({path:join(output,engine+'-failure.png')});}
 await browser.close();console.log(results.at(-1));
}
await writeFile(join(output,'results.json'),JSON.stringify(results,null,2));if(results.some(x=>x.status==='FAIL'))process.exitCode=1;
