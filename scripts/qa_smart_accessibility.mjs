import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
const pw=await import(process.env.AMPOWER_PLAYWRIGHT_MODULE||'playwright');
const origin=new URL(process.env.AMPOWER_QA_URL||'http://127.0.0.1:49371');assert.ok(['127.0.0.1','localhost','[::1]'].includes(origin.hostname));
const out=process.env.AMPOWER_QA_OUTPUT||'output/qa-smart-accessibility';await mkdir(out,{recursive:true});const results=[];
for(const engine of ['chromium','webkit']){
 const b=await pw[engine].launch({headless:true,...(engine==='chromium'&&process.env.AMPOWER_CHROME_PATH?{executablePath:process.env.AMPOWER_CHROME_PATH}:{})});
 for(const width of (process.env.AMPOWER_QA_MENU_ONLY?[375,390,430]:[375,390,430,1366,1440,1920]))for(const scenario of (process.env.AMPOWER_QA_MENU_ONLY?['menu']:process.env.AMPOWER_QA_TEXT_ONLY?['text200']:['cookie focus','cookie focus text200','menu','text200'])){
  const c=await b.newContext({viewport:{width,height:900},reducedMotion:'reduce'});const blocked=[];
  await c.route('**/*',r=>{if(new URL(r.request().url()).origin===origin.origin&&['GET','HEAD'].includes(r.request().method()))return r.continue();blocked.push(r.request().url());return r.abort();});
  const p=await c.newPage();p.setDefaultTimeout(15000);
  try{
   await p.goto(new URL('/smart-home-energy/',origin).href);await p.locator('#smart-form').waitFor({state:'visible'});await p.evaluate(()=>document.fonts.ready);
   if(scenario.startsWith('cookie focus')){
    if(scenario.endsWith('text200'))await p.evaluate(()=>{const sizes=[...document.querySelectorAll('body *')].map(e=>[e,parseFloat(getComputedStyle(e).fontSize)]);for(const[e,s]of sizes)if(s)e.style.fontSize=s*2+'px';});
    assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'banner/text overflow');
    // Tab and reverse Tab in Chromium. WebKit headless skips links by platform policy;
    // focus all enabled controls separately to test author-created occlusion in both engines.
    const covered=()=>p.evaluate(()=>{const e=document.activeElement,r=e.getBoundingClientRect(),banner=document.querySelector('#cookie-banner');return r.width>0&&r.height>0&&[.2,.5,.8].some(f=>{const hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height*f);return hit&&banner.contains(hit)&&!banner.contains(e);});});
    if(engine==='chromium')for(let i=0;i<85;i++){await p.keyboard.press(i<65?'Tab':'Shift+Tab');assert.equal(await covered(),false,'cookie covers keyboard focus '+i);}
    for(const id of ['category-boiler','category-pv','email','preview-config']){await p.locator('#'+id).focus();assert.equal(await covered(),false,'cookie covers '+id);}
    await p.locator('#cookie-reject').click();await p.locator('[data-cookie-settings]').click();await p.keyboard.press('Escape');assert.equal(await p.locator('#cookie-banner').isVisible(),false);assert.equal(await p.locator('[data-cookie-settings]').evaluate(el=>el===document.activeElement),true);
   }else if(scenario==='menu'&&width<1201){
    await p.locator('#cookie-reject').click();await p.locator('.nav-toggle').focus();await p.keyboard.press('Enter');
    if(engine==='chromium'){
     for(let i=0;i<8;i++){await p.keyboard.press('Tab');assert.equal(await p.locator('#nav-links a').nth(i).evaluate(el=>el===document.activeElement),true,'menu link '+i);}
     for(let i=6;i>=0;i--){await p.keyboard.press('Shift+Tab');assert.equal(await p.locator('#nav-links a').nth(i).evaluate(el=>el===document.activeElement),true);}
    }else await p.locator('#nav-links a').first().focus();
    await p.keyboard.press('Escape');assert.equal(await p.locator('.nav-toggle').evaluate(el=>el===document.activeElement),true);
    for(let cycle=0;cycle<8;cycle++){
     await p.setViewportSize({width:1440,height:900});await p.waitForFunction(()=>document.activeElement===document.querySelector('#nav-links a'));
     await p.setViewportSize({width,height:900});await p.waitForFunction(()=>document.activeElement===document.querySelector('.nav-toggle'));
    }
   }else if(scenario==='text200'){
    await p.locator('#cookie-reject').click();await p.evaluate(()=>document.querySelectorAll('details').forEach(d=>d.open=true));
    const controls=await p.locator('.field input,.field select,.field textarea').evaluateAll(els=>els.filter(e=>e.getClientRects().length&&!e.disabled).map(e=>({id:e.id,height:e.getBoundingClientRect().height,font:parseFloat(getComputedStyle(e).fontSize)})));
    assert.ok(controls.every(e=>e.height>=44&&e.font>=16),JSON.stringify(controls.filter(e=>e.height<44||e.font<16)));
    await p.evaluate(()=>{document.querySelectorAll('details').forEach(d=>d.open=true);const sizes=[...document.querySelectorAll('body *')].map(e=>[e,parseFloat(getComputedStyle(e).fontSize)]);for(const[e,s]of sizes)if(s)e.style.fontSize=s*2+'px';});
    assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'text 200% overflow');
   }
   assert.deepEqual(blocked,[]);results.push({engine,width,scenario,status:'PASS'});
  }catch(e){results.push({engine,width,scenario,status:'FAIL',error:e.message});await p.screenshot({path:join(out,`${engine}-${width}-${scenario.replaceAll(' ','-')}.png`)});}
  await c.close();console.log(results.at(-1));
 }
 await b.close();
}
await writeFile(join(out,'results.json'),JSON.stringify(results,null,2));if(results.some(r=>r.status==='FAIL'))process.exitCode=1;
