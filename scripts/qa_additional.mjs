// Drugi zestaw lokalnego QA. Bez otwierania mailto/tel/SMS i bez ruchu zewnętrznego.
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';

const { chromium } = await import(process.env.AMPOWER_PLAYWRIGHT_MODULE || 'playwright').catch(() => {
  throw new Error('Dodatkowe QA wymaga Playwright; ustaw AMPOWER_PLAYWRIGHT_MODULE.');
});
const origin = new URL(process.env.AMPOWER_QA_URL || 'http://127.0.0.1:4173');
if (!['127.0.0.1', 'localhost', '[::1]'].includes(origin.hostname)) throw new Error('Dopuszczalny jest wyłącznie lokalny serwer QA.');
const browser = await chromium.launch({ headless: true, ...(process.env.AMPOWER_CHROME_PATH ? { executablePath: process.env.AMPOWER_CHROME_PATH } : {}) });
const ids = ['blinds', 'lights', 'ac', 'heatPump', 'boiler', 'floor', 'pv', 'storage', 'ev', 'gate', 'security', 'other'];
const output = process.env.AMPOWER_QA_OUTPUT || 'docs/ampower-sales/qa/regression';
const results = [], performanceRuns = [], rejectedRequests = [], errors = [], layoutResults = [];
let pairs = 0;
await mkdir(output, { recursive: true });
async function context(options = {}) {
  const ctx = await browser.newContext({ reducedMotion: 'reduce', ...options });
  await ctx.route('**/*', route => {
    const request = route.request();
    if (new URL(request.url()).origin !== origin.origin || !['GET', 'HEAD'].includes(request.method())) {
      rejectedRequests.push({ url: request.url(), method: request.method() });
      return route.abort();
    }
    return route.continue();
  });
  ctx.on('page', p => p.on('pageerror', e => errors.push(e.message)));
  return ctx;
}
const ctx = await context({ viewport: { width: 1440, height: 900 }, permissions: ['clipboard-read', 'clipboard-write'] });
const page = await ctx.newPage();
async function fresh(p = page) {
  await p.goto(`${origin.origin}/smart-home-energy/`);
  await p.locator('#smart-form').waitFor({ state: 'visible' });
  if(await p.locator('#cookie-banner').isVisible())await p.locator('#cookie-reject').click();
}
async function basic(categories, p = page) {
  for (const id of categories) await p.locator(`#category-${id}`).check();
  await p.locator('#goal-app').check();
  await p.locator('#email').fill('qa+powtorka@example.invalid');
}
async function draft(p = page) {
  await p.locator('#preview-config').click();
  assert.equal(await p.locator('#error-summary').isVisible(), false);
  assert.equal(await p.locator('#draft-panel').isVisible(), true);
  return p.locator('#message-preview').inputValue();
}
async function open(id, p = page) { await p.locator(`#details-${id} summary`).click(); }
async function run(name, fn) {
  try { await fn(); results.push({ name, status: 'passed' }); console.log(`PASS ${name}`); }
  catch (e) { results.push({ name, status: 'failed', error: e.message }); console.log(`FAIL ${name}: ${e.message}`); }
}
try {
  await run('66 par kategorii w działającym formularzu: aktualny zakres, brak danych, brak kwot', async () => {
    for (let i = 0; i < ids.length; i++) for (let j = i + 1; j < ids.length; j++) {
      await fresh(); await basic([ids[i], ids[j]]);
      const text = await draft();
      assert.equal(await page.locator('#summary-categories li').count(), 2);
      assert.ok(text.includes('Ustalimy podczas rozmowy'));
      assert.doesNotMatch(text, /\d[\d\s,.]*\s*zł|Pakiet:|VAT/);
      assert.equal(await page.locator('#price-title').innerText(), 'Wymaga indywidualnej wyceny');
      await page.locator(`#category-${ids[i]}`).uncheck();
      assert.equal(await page.locator('#draft-panel').isVisible(), false);
      await draft(); assert.equal(await page.locator('#summary-categories li').count(), 1);
      pairs++;
    }
    assert.equal(pairs, 66);
  });
  await run('Rolety mieszane + wspólna bramka świateł + kocioł/strefy + PV/magazyn/EV + monitoring/alarm', async () => {
    await fresh(); await basic(['blinds', 'lights', 'boiler', 'floor', 'pv', 'storage', 'ev', 'security', 'other']);
    for (const id of ['blinds', 'lights', 'boiler', 'floor', 'pv', 'storage', 'ev', 'security', 'other']) await open(id);
    await page.locator('#blinds-control').selectOption('mixed');
    await page.locator('#blinds-mixed').fill('3 napędy przez centralę, 2 przez moduły');
    await page.locator('#lights-control').selectOption('central'); await page.locator('#lights-controller').fill('WSPOLNA-BRAMKA');
    await page.locator('#boiler-count').fill('1'); await page.locator('#floor-count').fill('5');
    await page.locator('#pv-count').fill('1'); await page.locator('#pv-model').fill('HYBRYDA-QA');
    await page.locator('#storage-sharedPv').selectOption('yes'); await page.locator('#storage-function').selectOption('control');
    await page.locator('#ev-function').selectOption('power');
    await page.locator('#security-scope').selectOption('both'); await page.locator('#security-cameras').fill('4'); await page.locator('#security-alarms').fill('1');
    await page.locator('#other-description').fill('Urządzenie z nieznanym protokołem');
    await page.locator('#delivery-remote').check();
    let text = await draft();
    for (const expected of ['3 napędy', 'WSPOLNA-BRAMKA', '1 (źródła / regulatory)', '5 (strefy temperatury)', 'HYBRYDA-QA', 'PV i magazyn: wspólny system', 'odrębnej oceny i testów', '4 (kamery)', '1 (centrale alarmowe)', 'nieznanym protokołem']) assert.ok(text.includes(expected), expected);
    await page.locator('#category-pv').uncheck(); await page.locator('#category-other').uncheck();
    text = await draft(); assert.doesNotMatch(text, /HYBRYDA-QA|PV i magazyn: wspólny system|nieznanym protokołem/);
    await page.locator('#floor-control').selectOption('none');
    assert.match(await draft(), /prac na miejscu/);
  });
  await run('Rzeczywiste Clipboard API w izolowanym Chromium: dokładna pełna treść', async () => {
    await fresh(); await basic(ids);
    await page.locator('#notes').fill('Pełny tekst — ąęłó 🙂\n' + 'ż'.repeat(950));
    await page.locator('#copy-config').click();
    await page.getByText('Konfiguracja skopiowana. Wklej ją do swojej wiadomości.', { exact: true }).waitFor();
    assert.equal(await page.evaluate(() => navigator.clipboard.readText()), await page.locator('#message-preview').inputValue());
    assert.equal(await page.locator('#open-email').isVisible(), false);
    await page.evaluate(() => navigator.clipboard.writeText('')); // tylko schowek tego procesu QA
  });
  for (const outcome of ['success', 'failure']) await run(`Zmiana podczas kopiowania: ${outcome}, ochrona wersji i odblokowanie przycisku`, async () => {
    const race = await context();
    await race.addInitScript(() => Object.defineProperty(navigator, 'clipboard', { value: { writeText: text => new Promise((resolve, reject) => {
      window.qaCopyCalls = (window.qaCopyCalls || 0) + 1;
      window.qaCopied = text; window.qaResolveCopy = resolve; window.qaRejectCopy = reject;
    }) } }));
    const p = await race.newPage(); await fresh(p); await basic(['blinds'], p);
    await p.locator('#copy-config').click();
    assert.equal(await p.locator('#copy-config').isEnabled(), false);
    await p.locator('#notes').fill('NOWA-WERSJA-QA');
    await p.evaluate(outcome => outcome === 'success' ? window.qaResolveCopy() : window.qaRejectCopy(new Error('QA odmowa')), outcome);
    await p.waitForFunction(() => !document.querySelector('#copy-config').disabled);
    assert.match(await p.locator('#action-status').innerText(), outcome === 'success' ? /wcześniejszą wersję/ : /Nie skopiowano konfiguracji/);
    assert.equal(await p.locator('#draft-panel').isVisible(), false);
    assert.equal(await p.evaluate(() => window.qaCopyCalls), 1);
    assert.equal(await p.evaluate(() => window.qaCopied.includes('NOWA-WERSJA-QA')), false);
    assert.match(await draft(p), /NOWA-WERSJA-QA/);
    await race.close();
  });
  await run('Brak Clipboard API jak na niezabezpieczonym HTTP w LAN: pełny ręczny fallback', async () => {
    const missing = await context();
    await missing.addInitScript(() => Object.defineProperty(navigator, 'clipboard', { value: undefined }));
    const p = await missing.newPage(); await fresh(p); await basic(['other'], p);
    await p.locator('#copy-config').click();
    await p.getByText('Nie udało się skopiować tekstu. Zaznacz podsumowanie i skopiuj je ręcznie.', { exact: true }).waitFor();
    assert.equal(await p.evaluate(() => document.activeElement.id), 'message-preview');
    assert.equal(await p.evaluate(() => document.querySelector('#message-preview').selectionEnd), (await p.locator('#message-preview').inputValue()).length);
    await missing.close();
  });
  await run('E-mail: polskie znaki, nowe linie i parametry pozostają w body; kontakt telefoniczny bez e-maila', async () => {
    await fresh(); await basic(['other']); await page.locator('#notes').fill('Łódź 🙂\nBcc: qa@example.invalid\n&subject=inny#fragment');
    let text = await draft(); const uri = new URL(await page.locator('#open-email').getAttribute('href'));
    assert.equal(uri.searchParams.get('body'), text); assert.equal(uri.searchParams.size, 2); assert.equal(uri.hash, '');
    assert.equal(uri.pathname, 'kuba@ampower.pl');
    await page.getByRole('radio', { name: 'Telefon', exact: true }).check(); await page.locator('#phone').fill('+49 (30) 1234-5678');
    text = await draft(); assert.match(text, /Preferowany kontakt: telefon/); assert.doesNotMatch(text, /qa\+powtorka@example.invalid/);
    assert.doesNotMatch(await page.locator('#action-status').innerText(), /(?:wysłano|przyjęto|dostarczono)/i);
  });
  await run('Wszystkie szczegóły otwarte: szerokości, poziomy telefon i krótki ekran', async () => {
    await fresh(); await basic(ids);
    for (const id of ids) await open(id);
    for (const id of ['blinds', 'lights', 'ac', 'heatPump', 'boiler', 'floor', 'gate']) {
      await page.locator(`#${id}-control`).selectOption('central'); await page.locator(`#${id}-controller`).fill('X'.repeat(120));
    }
    await page.locator('#security-scope').selectOption('both'); await page.locator('#pv-hasLogger').selectOption('yes'); await page.locator('#pv-logger').fill('Y'.repeat(120));
    await draft();
    for (const [width, height] of [[305,568],[320,568],[360,640],[390,844],[844,390],[768,1024],[1024,600],[1201,700],[1920,1080]]) {
      await page.setViewportSize({ width, height });
      const measurement = await page.evaluate(() => ({ width: document.documentElement.clientWidth, scroll: document.documentElement.scrollWidth, fields: [...document.querySelectorAll('input:not([type=checkbox]):not([type=radio]),select,textarea')].filter(n => n.getClientRects().length && !n.disabled && !n.closest('[aria-hidden=true]')).map(n => ({ id: n.id, height: n.getBoundingClientRect().height, font: parseFloat(getComputedStyle(n).fontSize) })) }));
      assert.ok(measurement.scroll <= measurement.width + 1, `${width}×${height}: przepełnienie`);
      assert.ok(measurement.fields.every(f => f.height >= 44 && f.font >= 16), `${width}×${height}: ${JSON.stringify(measurement.fields.filter(f => f.height < 44 || f.font < 16))}`);
      layoutResults.push({ viewport: { width, height }, client: measurement.width, scroll: measurement.scroll, fields: measurement.fields.length });
    }
    await page.setViewportSize({width:390,height:844});
    await page.locator('#message-preview').scrollIntoViewIfNeeded();
    await page.screenshot({ path: `${output}/06_ADDITIONAL_MOBILE.png` });
  });
  await run('Powiększenie tekstu 200% przez CSS i obsługa klawiatury (bez deklarowania prawdziwego zoomu)', async () => {
    await fresh(); await basic(['blinds', 'security']);
    await page.setViewportSize({width:390,height:844});
    await page.addStyleTag({content:'html { font-size:200%; } body { font-size:34px; }'});
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1));
    await page.locator('#details-blinds summary').press('Enter');
    assert.equal(await page.locator('#blinds-count').isVisible(), true);
    await page.locator('#blinds-count').press('Tab');
    assert.equal(await page.evaluate(() => document.activeElement.tagName), 'BUTTON');
    await page.locator('#details-security summary').press('Space');
    assert.equal(await page.locator('#security-scope').isVisible(), true);
    await page.locator('#email').fill('bledny-adres');
    await page.locator('#preview-config').click();
    assert.equal(await page.evaluate(() => document.activeElement.id), 'error-summary');
    await page.locator('#error-list button[aria-controls="email"]').click();
    const focusPosition = await page.evaluate(() => ({ top:document.activeElement.getBoundingClientRect().top, headerBottom:document.querySelector('header').getBoundingClientRect().bottom }));
    assert.ok(focusPosition.top >= focusPosition.headerBottom, 'Nagłówek zasłania focus przy większym tekście');
    await page.locator('#category-other').scrollIntoViewIfNeeded();
    await page.screenshot({ path: `${output}/06_LARGE_TEXT.png` });
  });
  await run('Strona główna: przepełnienie kontaktu, cztery kalkulatory, URI kontaktu i nawigacja', async () => {
    await page.setViewportSize({width:305,height:568}); await page.goto(origin.origin);
    await page.evaluate(() => document.fonts.ready);
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1));
    await page.locator('#c-elek').check(); await page.locator('#elek-punkty').fill('12'); await page.locator('#elek-rozdz').selectOption('0');
    assert.equal((await page.locator('#calc-total').innerText()).replace(/\s/g,''), '1700–2400zł');
    await page.locator('#c-klima').check(); await page.locator('#klima-ile').fill('1'); await page.locator('#klima-moc').selectOption('3.5'); await page.locator('#klima-trasa').fill('5');
    await page.locator('#c-mon').check(); await page.locator('#mon-kamery').fill('4');
    await page.locator('#c-naw').check(); await page.locator('#naw-m2').fill('300'); await page.locator('#naw-kropla').fill('0'); await page.locator('#naw-ster').selectOption('podst'); await page.locator('#naw-woda').selectOption('wodociag');
    assert.equal((await page.locator('#calc-total').innerText()).replace(/\s/g,''), '17000–23450zł');
    assert.equal(new URL(await page.locator('#calc-mail').getAttribute('href')).pathname, 'kuba@ampower.pl');
    assert.match(await page.locator('#calc-sms').getAttribute('href'), /^sms:\+48785668797/);
    await page.locator('.nav-toggle').click(); await page.locator('#nav-links a[href="/smart-home-energy/"]').click();
    assert.equal(new URL(page.url()).pathname, '/smart-home-energy/');
    await page.locator('#smart-form').waitFor({state:'visible'});
    await page.locator('header .brand').click(); assert.equal(new URL(page.url()).pathname, '/');
  });
  await run('SEO i granica publicznego artefaktu: metadane, schematy i brak plików wewnętrznych', async () => {
    await fresh();
    assert.equal(await page.locator('h1').count(), 1);
    assert.equal(await page.locator('html').getAttribute('lang'), 'pl');
    assert.equal(await page.locator('meta[name=robots]').getAttribute('content'), 'index, follow');
    assert.equal(await page.locator('link[rel=canonical]').getAttribute('href'), 'https://ampower.pl/smart-home-energy/');
    const schema = await page.locator('script[type="application/ld+json"]').allTextContents();
    assert.ok(schema.length); for (const json of schema) JSON.parse(json);
    assert.doesNotMatch(schema.join(''), /AggregateRating|"Offer"|"price"/);
    for (const path of ['/docs/ampower-smart/06_AUDYT_QA.md','/package.json','/.git/config','/.qa-backups/']) assert.equal((await ctx.request.get(origin.origin + path)).status(), 404);
  });
  await run('Pomiary laboratoryjne: trzy zimne wejścia, mobilny Chromium, CPU ×4, sieć 1,6 Mb/s + 150 ms', async () => {
    for (let i = 0; i < 3; i++) {
      const perf = await context({viewport:{width:390,height:844},deviceScaleFactor:3,isMobile:true,hasTouch:true});
      const p = await perf.newPage(); const cdp = await perf.newCDPSession(p);
      await cdp.send('Network.enable'); await cdp.send('Network.setCacheDisabled',{cacheDisabled:true});
      await cdp.send('Network.emulateNetworkConditions',{offline:false,latency:150,downloadThroughput:200000,uploadThroughput:93750});
      await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});
      await p.addInitScript(() => {
        window.qaPerf = {lcp:0,cls:0,longTasks:[]};
        new PerformanceObserver(list=>{for(const e of list.getEntries()) window.qaPerf.lcp=e.startTime;}).observe({type:'largest-contentful-paint',buffered:true});
        new PerformanceObserver(list=>{for(const e of list.getEntries()) if(!e.hadRecentInput) window.qaPerf.cls+=e.value;}).observe({type:'layout-shift',buffered:true});
        new PerformanceObserver(list=>{for(const e of list.getEntries()) window.qaPerf.longTasks.push(e.duration);}).observe({type:'longtask',buffered:true});
      });
      await fresh(p); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(1000);
      const measurement = await p.evaluate(() => ({...window.qaPerf,domContentLoaded:performance.getEntriesByType('navigation')[0].domContentLoadedEventEnd,resources:performance.getEntriesByType('resource').length,transferBytes:performance.getEntriesByType('navigation').concat(performance.getEntriesByType('resource')).reduce((sum,e)=>sum+e.transferSize,0)}));
      performanceRuns.push({run:i+1,...measurement});
      assert.ok(measurement.lcp > 0); assert.ok(Number.isFinite(measurement.cls));
      await perf.close();
    }
  });
  await run('Brak wyjątków JavaScript, żądań zewnętrznych, cookies analitycznych i trwałego zapisu formularza', async () => {
    assert.deepEqual(errors, []); assert.deepEqual(rejectedRequests, []);
    await fresh(); assert.equal(await page.evaluate(() => sessionStorage.length + Object.keys(localStorage).filter(k=>k!=='ampower-consent-v3').length),0);
    assert.equal((await ctx.cookies()).length,0);
  });
} finally {
  const report = {date:new Date().toISOString(),browser:await browser.version(),origin:origin.origin,pairs,passed:results.filter(r=>r.status==='passed').length,failed:results.filter(r=>r.status==='failed').length,results,layoutResults,performanceRuns,rejectedRequests,errors};
  await writeFile(`${output}/06_ADDITIONAL_RESULTS.json`,JSON.stringify(report,null,2)+'\n');
  await browser.close();
}
if (results.some(r=>r.status==='failed')) process.exitCode=1;
