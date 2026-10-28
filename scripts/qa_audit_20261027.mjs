// Regression checks against built public artifacts. No external traffic or messages.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {once} from 'node:events';
import {readFile,stat,mkdir,writeFile} from 'node:fs/promises';
import {resolve,sep,extname} from 'node:path';
import {createRequire} from 'node:module';

const {chromium}=await import(process.env.AMPOWER_PLAYWRIGHT_MODULE||'playwright');
const axeSource=await readFile(process.env.AMPOWER_AXE_SOURCE||createRequire(import.meta.url).resolve('axe-core/axe.min.js'),'utf8');
const output='output/qa-audit-2026-10-27';
await mkdir(output,{recursive:true});
const servers=[],results=[];
let browser;

async function serve(directory){
  const root=resolve(directory);
  const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.woff2':'font/woff2'};
  const server=createServer(async(req,res)=>{
    if(!['GET','HEAD'].includes(req.method)){res.writeHead(405).end();return;}
    try{
      let file=resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));
      if(file!==root&&!file.startsWith(root+sep)){res.writeHead(403).end();return;}
      if((await stat(file)).isDirectory())file=resolve(file,'index.html');
      const body=await readFile(file);
      res.writeHead(200,{'Content-Type':types[extname(file)]||'application/octet-stream'});
      res.end(req.method==='HEAD'?undefined:body);
    }catch{res.writeHead(404).end();}
  });
  server.listen(0,'127.0.0.1');await once(server,'listening');servers.push(server);
  return 'http://127.0.0.1:'+server.address().port;
}
async function check(name,fn){
  try{const details=await fn();results.push({name,status:'passed',...details});console.log('PASS '+name);}
  catch(error){results.push({name,status:'failed',error:error.stack});console.error('FAIL '+name+': '+error.message);}
}
async function open(origin,path,width,scheme='light'){
  const context=await browser.newContext({viewport:{width,height:900},colorScheme:scheme,reducedMotion:'reduce'});
  await context.route('**/*',r=>new URL(r.request().url()).origin===origin&&['GET','HEAD'].includes(r.request().method())?r.continue():r.abort());
  const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  const response=await page.goto(origin+path,{waitUntil:'networkidle'});assert.equal(response.status(),200);
  await page.evaluate(()=>document.fonts.ready);
  if(await page.locator('#cookie-banner').isVisible())await page.locator('#cookie-reject').click();
  if(path.endsWith('.html'))await page.locator('#summary').waitFor();
  await page.evaluate(axeSource);
  return {context,page,errors};
}
async function accessible(page){
  // Use a stable scroll position: a sticky toolbar can temporarily cover a control
  // while Playwright scrolls to a different section, producing a target-size artefact.
  await page.evaluate(()=>scrollTo(0,0));
  const violations=await page.evaluate(async()=>{
    const r=await axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa']}});
    return r.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary}))}));
  });
  assert.deepEqual(violations,[]);
}
async function layout(page,stage='default'){
  const size=await page.evaluate(()=>({page:document.documentElement.scrollWidth,viewport:innerWidth}));
  assert.equal(size.page>size.viewport,false,`horizontal overflow (${stage}): ${JSON.stringify(size)}`);
}

try{
  const site=await serve('dist'),pv=await serve('output/pv-mining-preview');
  browser=await chromium.launch({headless:true,executablePath:process.env.AMPOWER_CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
  await check('Kalkulator: błędne dane blokują kwotę, szkic i kopiowanie; poprawienie danych przywraca wynik',async()=>{
    const {context,page,errors}=await open(site,'/',390);
    try{
      assert.equal(await page.locator('#calc-rows').isHidden(),true);
      assert.equal(await page.locator('#calc-empty').isVisible(),true);
      await page.locator('#c-elek').check();
      const normalize=s=>s.replace(/[\s\u00a0]/g,'');
      assert.equal(normalize(await page.locator('#calc-total').innerText()),'1700–2400zł');
      for(const value of ['-1','','2.5','1000']){
        await page.locator('#elek-punkty').fill(value);
        assert.equal(await page.locator('#elek-punkty').inputValue(),value);
        assert.equal(await page.locator('#elek-punkty').getAttribute('aria-invalid'),'true');
        assert.equal((await page.locator('#calc-total').innerText()).trim(),'—');
        assert.equal(await page.locator('#calc-validation').isVisible(),true);
        assert.equal(await page.locator('#calc-rows').isHidden(),true);
        assert.equal(await page.locator('#calc-mail').getAttribute('href'),null);
        assert.equal(await page.locator('#calc-sms').getAttribute('href'),null);
        assert.equal(await page.locator('#calc-message').inputValue(),'');
        assert.equal(await page.locator('#calc-copy').isDisabled(),true);
        await page.locator('#elek-punkty').fill('25');
        assert.equal(normalize(await page.locator('#calc-total').innerText()),'3500–5000zł');
        assert.equal(await page.locator('#elek-punkty').getAttribute('aria-invalid'),null);
        assert.match(await page.locator('#calc-mail').getAttribute('href'),/^mailto:/);
        assert.equal(await page.locator('#calc-copy').isDisabled(),false);
      }
      // Zero points is intentional: quoting a distribution board alone remains possible.
      await page.locator('#elek-punkty').fill('0');
      assert.equal((await page.locator('#calc-total').innerText()).trim(),'—');
      assert.equal(await page.locator('#calc-mail').getAttribute('href'),null);
      await page.locator('#elek-rozdz').selectOption('1');
      assert.equal(normalize(await page.locator('#calc-total').innerText()),'1200–2800zł');
      await accessible(page);
      await page.locator('#c-elek').uncheck();
      assert.equal(await page.locator('#calc-rows').isHidden(),true);
      assert.equal(await page.locator('#calc-empty').isVisible(),true);
      await accessible(page);
      assert.deepEqual(errors,[]);
    }finally{await context.close();}
  });
  for(const scheme of ['light','dark'])for(const width of [390,1440])for(const path of ['/','/smart-home-energy/','/prywatnosc/']){
    await check(`Strona ${path} ${width}px ${scheme}: dostępność i układ`,async()=>{
      const {context,page,errors}=await open(site,path,width,scheme);
      try{await accessible(page);await layout(page);assert.deepEqual(errors,[]);}
      finally{await context.close();}
    });
  }
  for(const width of [320,390,768,1440])for(const path of ['/','/simple.html','/advanced.html']){
    await check(`PV ${path} ${width}px: dostępność, rozwinięte obliczenia i układ`,async()=>{
      const {context,page,errors}=await open(pv,path,width);
      try{
        await accessible(page);await layout(page);
        if(path!=='/'){
          if(path==='/advanced.html'){
            for(const tab of ['#tab-mining','#tab-economy','#tab-energy']){
              await page.locator(tab).click();await accessible(page);await layout(page);
            }
          }
          // Include disclosures normally hidden in the simple variant, tables and cost assumptions.
          await page.evaluate(()=>document.querySelectorAll('details').forEach(d=>d.open=true));
          await page.locator('#prepare-inquiry').click();
          await accessible(page);await layout(page,'expanded');
          if(width===390){
            await page.locator('#summary').scrollIntoViewIfNeeded();
            await page.screenshot({path:`${output}/${path.slice(1,-5)}-mobile.png`});
          }
          if(width===390||width===1440){
            await page.evaluate(()=>{
              const sizes=[...document.querySelectorAll('body *')].map(el=>[el,parseFloat(getComputedStyle(el).fontSize)]);
              for(const [el,size] of sizes)if(size)el.style.fontSize=size*2+'px';
            });
            await layout(page,'text 200%');
          }
        }
        assert.deepEqual(errors,[]);
      }finally{await context.close();}
    });
  }
}finally{
  if(browser)await browser.close();
  await Promise.all(servers.map(s=>new Promise((resolve,reject)=>s.close(e=>e?reject(e):resolve()))));
  await writeFile(output+'/RESULTS.json',JSON.stringify({date:new Date().toISOString(),results},null,2)+'\n');
}
assert.ok(results.length&&results.every(r=>r.status==='passed'),'Audit regression failed; see '+output+'/RESULTS.json');
