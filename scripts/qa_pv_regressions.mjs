// Targeted audit regressions. Local previews only; no messages or external requests.
import assert from 'node:assert/strict';
import {mkdir, readFile, writeFile} from 'node:fs/promises';
import {join} from 'node:path';
const pw=await import(process.env.AMPOWER_PLAYWRIGHT_MODULE || 'playwright');
const origin=new URL(process.env.AMPOWER_PV_QA_URL || 'http://127.0.0.1:49372');
assert.ok(['127.0.0.1','localhost','[::1]'].includes(origin.hostname));
const output=process.env.AMPOWER_QA_OUTPUT || 'output/qa-pv-regressions';
await mkdir(output,{recursive:true});
const profile=JSON.parse(await readFile(new URL('../pv-mining/data/profile.json',import.meta.url)));
const rows=Array.isArray(profile)?profile:profile.rows;
const csv=join(output,'synthetic.csv');
await writeFile(csv,'timestamp,pv_kw,load_kw\n'+rows.map(([t,p])=>`${t},${p*10},0.57`).join('\n'));
const results=[];
for(const engine of ['chromium','webkit']){
 const browser=await pw[engine].launch({headless:true,...(engine==='chromium'&&process.env.AMPOWER_CHROME_PATH?{executablePath:process.env.AMPOWER_CHROME_PATH}:{})});
 for(const scenario of ['blur actions','CSV presets and views','CSV interrupted by preset']){
  const ctx=await browser.newContext({viewport:{width:1440,height:900},reducedMotion:'reduce'});
  await ctx.route('**/*',route=>new URL(route.request().url()).origin===origin.origin&&['GET','HEAD'].includes(route.request().method())?route.continue():route.abort());
  const p=await ctx.newPage();p.setDefaultTimeout(15000);const errors=[];p.on('pageerror',e=>errors.push(e.message));
  const ready=()=>p.waitForFunction(()=>document.querySelector('#results')?.getAttribute('aria-busy')==='false'&&!document.querySelector('#results')?.classList.contains('stale'));
  const exported=async()=>{const pending=p.waitForEvent('download',{timeout:4000});await p.locator('#export').click();const d=await pending;return JSON.parse(await readFile(await d.path(),'utf8'));};
  const checkSource=d=>{assert.equal(d.results.source,'simulation');assert.match(d.profileSource,/PVGIS/);assert.equal(d.results.settings.pvKwp,Number(d.assumptions.pvKwp));};
  try{
   await p.goto(new URL('advanced.html',origin).href);await ready();
   if(scenario==='blur actions'){
    let downloads=0;p.on('download',()=>downloads++);
    await p.locator('#f-pvKwp').fill('15');await ready();const d=await exported();assert.equal(downloads,1);checkSource(d);
    await p.locator('#f-pvKwp').fill('16');await ready();await p.locator('[data-active="s21-pro"]').click();assert.equal(await p.locator('.compare-card.selected').getAttribute('data-active'),'s21-pro');
    await p.locator('#f-pvKwp').fill('17');await ready();await p.locator('#prepare-inquiry').click();assert.equal(await p.locator('#inquiry-draft').isVisible(),true);assert.match(await p.locator('#draft').inputValue(),/S21 Pro/);
   }else if(scenario==='CSV presets and views'){
    for(const preset of ['5,0','10,0','10,10','10,20','15,0','20,20']){
     await p.locator('#csv-file').setInputFiles(csv);await p.locator('#csv-clear').waitFor({state:'visible'});await ready();
     await p.locator('[data-active="s21-pro"]').click();await p.locator(`[data-preset="${preset}"]`).click();await ready();
     assert.equal(await p.locator('#csv-clear').isVisible(),false);assert.equal(await p.locator('#f-pvKwp').isDisabled(),false);
     const before=await exported();checkSource(before);await p.reload();await ready();const after=await exported();assert.deepEqual(after.results,before.results);
    }
    const before=await exported();await p.locator('nav a[href="./simple.html"]').click();await ready();const simple=await exported();assert.deepEqual(simple.results,before.results);
    await p.locator('nav a[href="./advanced.html"]').click();await ready();assert.deepEqual((await exported()).results,before.results);
   }else{
    await p.locator('#csv-file').setInputFiles(csv);await p.locator('[data-preset="20,20"]').click();await ready();await p.waitForTimeout(1500);checkSource(await exported());assert.equal(await p.locator('#csv-clear').isVisible(),false);
   }
   assert.deepEqual(errors,[]);results.push({engine,scenario,status:'PASS'});
  }catch(e){results.push({engine,scenario,status:'FAIL',error:e.message});await p.screenshot({path:join(output,`${engine}-${scenario.replaceAll(' ','-')}.png`)});}
  await ctx.close();console.log(results.at(-1));
 }
 await browser.close();
}
await writeFile(join(output,'results.json'),JSON.stringify(results,null,2));
if(results.some(r=>r.status==='FAIL'))process.exitCode=1;
