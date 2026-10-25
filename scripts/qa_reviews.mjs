import assert from 'node:assert/strict';
import { mkdtemp, rm, mkdir, writeFile } from 'node:fs/promises';
import { tmpdir, homedir } from 'node:os';
import { join } from 'node:path';
import { once } from 'node:events';
import { pathToFileURL } from 'node:url';
import { randomUUID, createHash } from 'node:crypto';
import { ReviewsStore } from '../backend/reviews-store.js';
import { createReviewsServer } from '../backend/reviews-server.js';
const {chromium}=await import(process.env.AMPOWER_PLAYWRIGHT_MODULE||pathToFileURL(join(homedir(),'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs')).href);
const output='output/opinie-qa';await mkdir(output,{recursive:true});
const directory=await mkdtemp(join(tmpdir(),'ampower-opinie-browser-')),store=new ReviewsStore(directory),password='local-synthetic-browser-test-password';
const server=createReviewsServer({store,password});server.listen(0,'127.0.0.1');await once(server,'listening');
const origin=`http://127.0.0.1:${server.address().port}`,browser=await chromium.launch({headless:true,executablePath:process.env.AMPOWER_CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
const errors=[],blocked=[],results=[],layouts=[];
let formFailures=1,rejectSubmission=true,failRenewal=true;
const context=await browser.newContext({viewport:{width:1440,height:1000},reducedMotion:'reduce'});
await context.route('**/*',route=>{
  const url=new URL(route.request().url());
  if(![origin].includes(url.origin)&&!['data:','blob:'].includes(url.protocol)){blocked.push(url.href);return route.abort();}
  if(url.pathname==='/api/reviews/form'&&formFailures>0){formFailures--;return route.abort();}
  if(url.pathname==='/api/reviews'&&route.request().method()==='POST'&&rejectSubmission){rejectSubmission=false;if(failRenewal)formFailures=1;return route.continue({postData:JSON.stringify({...route.request().postDataJSON(),token:'synthetic-expired-token'})});}
  return route.continue();
});
context.on('page',page=>page.on('pageerror',error=>errors.push(error.message)));
let page;
const run=async(name,callback)=>{await callback();results.push(name);console.log('PASS '+name);};
try {
  page=await context.newPage();
  await run('Awaria uruchomienia formularza i ponowienie bez odświeżenia strony',async()=>{await page.goto(origin+'/#dodaj-opinie');await page.locator('#cookie-reject').click();await page.locator('#review-retry').waitFor({state:'visible'});await page.locator('#review-retry').click();await page.locator('#review-fields:not([disabled])').waitFor();});
  await run('Pusta lista i otwieranie formularza przez link',async()=>{await page.goto(origin+'/#dodaj-opinie');await page.locator('#review-fields:not([disabled])').waitFor();assert.equal(await page.locator('#dodaj-opinie').getAttribute('open'),'');await page.getByText('Nie ma jeszcze opublikowanych opinii.',{exact:false}).waitFor();});
  let photo;
  await run('Wygasły formularz i awaria odnowienia zachowują tekst oraz zdjęcie',async()=>{
    photo=await page.evaluate(()=>{const c=document.createElement('canvas');c.width=800;c.height=500;const x=c.getContext('2d');x.fillStyle='#24221e';x.fillRect(0,0,800,500);x.fillStyle='#ffc400';x.fillRect(80,100,640,28);x.fillStyle='#f4f3ee';x.fillRect(150,180,500,180);x.fillStyle='#24221e';x.font='26px sans-serif';x.fillText('ZDJĘCIE TESTOWE',270,285);return c.toDataURL('image/png').split(',')[1];});
    await page.locator('#review-rating-4').check();await page.locator('#review-first-name').fill('Jan');await page.locator('#review-initial').fill('K');await page.locator('#review-city').fill('Głogów');await page.locator('#review-service').selectOption('Klimatyzacja');await page.locator('#review-text').fill('PRZYKŁADOWA OPINIA TESTOWA. Montaż wykonany sprawnie. Przydałoby się więcej informacji o terminie.');
    await page.locator('#review-photo').setInputFiles({name:'zdjecie-testowe.png',mimeType:'image/png',buffer:Buffer.from(photo,'base64')});await page.locator('#review-photo-preview:not([hidden])').waitFor();await page.locator('#review-photo-consent').check();await page.locator('#review-consent').check();
    // Użytkownik potrzebuje czasu na wypełnienie formularza; automat respektuje
    // te same 2 sekundy minimalnego wieku tokenu antyspamowego.
    await page.waitForTimeout(2100);
    await page.locator('#review-submit').click();await page.locator('#review-retry').waitFor({state:'visible'});await page.locator('#review-status').filter({hasText:'Odnów formularz'}).waitFor();assert.match(await page.locator('#review-text').inputValue(),/PRZYKŁADOWA OPINIA TESTOWA/);assert.equal(await page.locator('#review-photo-preview').isVisible(),true);assert.equal(await page.locator('#review-photo-consent').isChecked(),true);assert.equal(store.list({admin:true}).total,0);
  });
  await run('Odzyskanie połączenia i automatyczne odnowienie zapisują opinię jeden raz',async()=>{await page.locator('#review-retry').click();await page.locator('#review-fields:not([disabled])').waitFor();rejectSubmission=true;failRenewal=false;await page.locator('#review-submit').click();await page.locator('#review-status').filter({hasText:'zapisana i czeka'}).waitFor();assert.equal(store.list({admin:true}).total,1);assert.equal(store.list().total,0);});
  const admin=await context.newPage();
  await run('Logowanie i publikacja w panelu',async()=>{await admin.goto(origin+'/admin/opinie/');await admin.locator('#review-admin-password').fill(password);await admin.getByRole('button',{name:'Zaloguj się',exact:true}).click();await admin.locator('.admin-review').waitFor();assert.equal(await admin.locator('.admin-review-photo').count(),1);await admin.getByRole('button',{name:'Opublikuj',exact:true}).click();await admin.locator('#review-dialog-submit').click();await admin.locator('#review-admin-status').filter({hasText:'Zapisano'}).waitFor();assert.equal(store.list().total,1);});
  await run('Publiczna opinia ze zdjęciem i podpisem',async()=>{await page.reload();await page.locator('.review-card').waitFor();assert.equal(await page.locator('.review-name').innerText(),'Jan K.');assert.equal(await page.locator('.review-photo').evaluate(image=>image.complete&&image.naturalWidth>0),true);});
  await run('Odpowiedź administratora oraz ochrona tekstu przed wykonaniem HTML',async()=>{
    await admin.locator('#review-filter').selectOption('published');await admin.getByRole('button',{name:'Odpowiedz',exact:true}).click();await admin.locator('#review-dialog-text').fill('Dziękuję za opinię. <img src=x onerror=alert(1)>');await admin.locator('#review-dialog-submit').click();await admin.locator('#review-action-dialog').waitFor({state:'hidden'});await page.reload();await page.locator('.review-reply').waitFor();assert.match(await page.locator('.review-reply').innerText(),/<img src=x/);assert.equal(await page.locator('.review-reply img').count(),0);
  });
  await run('Trzy wpisy i przycisk rozwijania',async()=>{
    for(let i=0;i<3;i++){const data={firstName:['Anna','Piotr','Ewa'][i],initial:['M','B','Z'][i],city:['Lubin','Polkowice','Głogów'][i],service:['Smart Home & Energy','Instalacje elektryczne','Nawadnianie ogrodu'][i],rating:[5,3,5][i],text:'PRZYKŁADOWA OPINIA TESTOWA. Wpis służy wyłącznie sprawdzeniu wyglądu i obsługi listy.'};const key=randomUUID(),hash=createHash('sha256').update(key).digest('hex');const {id}=store.submit(data,key,hash,i===0?Buffer.from(photo,'base64'):null,new Date(Date.now()+i*1000),false);store.moderate(id,{action:'publish',version:1},new Date());}
    await page.reload();await page.locator('.review-card').nth(2).waitFor();assert.equal(await page.locator('.review-card').count(),3);await page.locator('#reviews-more').click();await page.locator('.review-card').nth(3).waitFor();assert.equal(await page.locator('.review-card').count(),4);assert.equal(await page.locator('#reviews-more').isVisible(),false);
  });
  await run('Układ strony i panelu na telefonie, tablecie i komputerze',async()=>{
    for(const width of [320,390,768,1280,1440]) {
      for(const [target,view] of [[page,'public'],[admin,'admin']]) {
        await target.setViewportSize({width,height:950});const dimensions=await target.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth}));layouts.push({view,...dimensions});assert.ok(dimensions.scroll<=width+1,JSON.stringify({view,...dimensions}));
      }
    }
    await page.setViewportSize({width:1440,height:1000});await page.reload();await page.locator('.review-card').nth(2).waitFor();await page.addStyleTag({content:'body>header{visibility:hidden}'});await page.locator('#dodaj-opinie').evaluate(element=>element.open=false);await page.locator('#opinie').evaluate(element=>{const note=document.createElement('p');note.textContent='PODGLĄD TESTOWY — przykładowe wpisy i zdjęcia';note.style.cssText='background:#ffc400;color:#181613;padding:12px;font-weight:bold';element.prepend(note);});await page.locator('#opinie').screenshot({path:output+'/OPINIE-DESKTOP.png'});
    await page.setViewportSize({width:390,height:844});await page.locator('#opinie').screenshot({path:output+'/OPINIE-MOBILE.png'});
    await page.locator('#dodaj-opinie').evaluate(element=>element.open=true);await page.locator('#dodaj-opinie').screenshot({path:output+'/FORMULARZ-MOBILE.png'});
    await admin.locator('#review-filter').selectOption('all');await admin.locator('#review-refresh').click();await admin.locator('.admin-review').nth(3).waitFor();await admin.setViewportSize({width:1440,height:1000});await admin.evaluate(()=>scrollTo(0,0));await admin.screenshot({path:output+'/PANEL-DESKTOP.png'});await admin.setViewportSize({width:390,height:844});await admin.evaluate(()=>scrollTo(0,0));await admin.screenshot({path:output+'/PANEL-MOBILE.png'});
  });
  await run('Wylogowanie i brak ruchu zewnętrznego',async()=>{await admin.locator('#review-admin-logout').click();await admin.locator('#review-login-view:not([hidden])').waitFor();assert.deepEqual(errors,[]);assert.deepEqual(blocked,[]);});
} catch(error) {process.exitCode=1;console.error(error);if(page){console.error(await page.locator('#review-status').textContent().catch(()=>''));await page.screenshot({path:output+'/FAILURE.png',fullPage:true}).catch(()=>{});}}
finally {await writeFile(output+'/RESULTS.json',JSON.stringify({date:new Date().toISOString(),results,layouts,errors,blocked,externalEmailsSent:0,syntheticReviewsOnly:true},null,2));await browser.close();server.closeAllConnections();await new Promise(r=>server.close(r));store.close();await rm(directory,{recursive:true,force:true});}
