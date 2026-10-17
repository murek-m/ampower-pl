// Lokalny QA: bez wysyłki, z blokadą ruchu poza originem podglądu.
// Playwright jest opcjonalnym narzędziem audytu, nie zależnością strony.
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { CATEGORIES } from '../smart-home-energy/data.js';

const { chromium } = await import(process.env.AMPOWER_PLAYWRIGHT_MODULE || 'playwright').catch(() => {
  throw new Error('QA wymaga Playwright: wskaż AMPOWER_PLAYWRIGHT_MODULE na jego index.mjs. Strona i testy npm test nie wymagają tego pakietu.');
});
const origin = new URL(process.env.AMPOWER_QA_URL || 'http://127.0.0.1:4173');
if (!['127.0.0.1', 'localhost', '[::1]'].includes(origin.hostname)) throw new Error('QA dopuszcza tylko lokalny serwer.');
const output = 'docs/ampower-sales/qa/regression';
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true, ...(process.env.AMPOWER_CHROME_PATH ? { executablePath: process.env.AMPOWER_CHROME_PATH } : {}) });
const results = [];
let optionCount = 0;
let rejectedRequests = [];
const start = Date.now();
async function context(options = {}) {
  const ctx = await browser.newContext(options);
  await ctx.route('**/*', route => {
    const request = route.request();
    if (new URL(request.url()).origin !== origin.origin || !['GET', 'HEAD'].includes(request.method())) {
      rejectedRequests.push({ url: request.url(), method: request.method() });
      return route.abort();
    }
    return route.continue();
  });
  return ctx;
}
const ctx = await context({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
const page = await ctx.newPage();
let pageErrors = [];
const contrastResults = [];
page.on('pageerror', error => pageErrors.push(error.message));
async function fresh() {
  pageErrors = [];
  await page.goto(`${origin.origin}/smart-home-energy/`);
  await page.locator('#smart-form').waitFor({ state: 'visible' });
}
async function basic(category = 'blinds') {
  await page.locator(`#category-${category}`).check();
  await page.locator('#goal-app').check();
  await page.locator('#email').fill('qa+lokalne@example.invalid');
}
async function prepare() {
  await page.locator('#preview-config').click();
  assert.equal(await page.locator('#error-summary').isVisible(), false);
  assert.equal(await page.locator('#draft-panel').isVisible(), true);
  assert.match(await page.locator('#action-status').innerText(), /Przygotowano/);
  assert.equal(await page.locator('#price-title').innerText(), 'Wymaga indywidualnej wyceny');
  assert.deepEqual(pageErrors, []);
  return page.locator('#message-preview').inputValue();
}
async function run(name, fn) {
  try { await fn(); results.push({ name, status: 'passed' }); console.log(`PASS ${name}`); }
  catch (error) {
    results.push({ name, status: 'failed', error: error.message });
    console.log(`FAIL ${name}: ${error.message}`);
    await page.screenshot({ path: `${output}/failure-${results.length}.png` }).catch(() => {});
  }
}
try {
  await run('Wymagane grupy, kontakt, focus i poprawa błędów', async () => {
    await fresh();
    await page.locator('#preview-config').click();
    assert.equal(await page.locator('#error-list li').count(), 3);
    assert.equal(await page.evaluate(() => document.activeElement.id), 'error-summary');
    await basic();
    await prepare();
    assert.equal(await page.evaluate(() => document.activeElement.id), 'draft-panel');
  });
  for (const c of CATEGORIES) await run(`${c.label}: wszystkie opcje szczegółów`, async () => {
    await fresh(); await basic(c.id); await prepare();
    await page.locator(`#details-${c.id} summary`).click();
    // Testujemy wszystkie wartości każdego selecta i ponownie ujawnione gałęzie.
    const selects = await page.locator(`#details-${c.id} select`).all();
    for (const select of selects) {
      if (!(await select.isVisible()) || !(await select.isEnabled())) continue;
      const options = await select.locator('option').evaluateAll(nodes => nodes.map(n => ({ value: n.value, label: n.textContent })));
      for (const option of options) {
        await select.selectOption(option.value); optionCount++;
        const text = await prepare();
        assert.ok(text.includes(option.label), `${c.id}: brak odpowiedzi ${option.label}`);
      }
    }
    assert.equal(await page.locator('#price-title').innerText(), 'Wymaga indywidualnej wyceny');
  });
  await run('Model centrali nie przechodzi do osobnych sterowników', async () => {
    await fresh(); await basic();
    await page.locator('#details-blinds summary').click();
    await page.locator('#blinds-control').selectOption('central');
    await page.locator('#blinds-controller').fill('CENTRALA-A');
    assert.match(await prepare(), /CENTRALA-A/);
    await page.locator('#blinds-control').selectOption('perDrive');
    assert.equal(await page.locator('#blinds-controller').inputValue(), '');
    assert.equal(await page.locator('#draft-panel').isVisible(), false);
    await page.locator('#blinds-controller').fill('MODUL-B');
    let text = await prepare(); assert.match(text, /MODUL-B/); assert.doesNotMatch(text, /CENTRALA-A/);
    await page.locator('#blinds-control').selectOption('buttons');
    text = await prepare(); assert.doesNotMatch(text, /MODUL-B|CENTRALA-A/);
    await page.locator('#blinds-control').selectOption('mixed');
    await page.locator('#blinds-mixed').fill('Część napędów przez centralę, część osobno');
    assert.match(await prepare(), /Część napędów/);
  });
  await run('Liczby: błędy, otwarcie panelu z linku błędu i Nie wiem', async () => {
    await fresh(); await basic(); await page.locator('#details-blinds summary').click();
    for (const value of ['0', '-1', '1.5', '1,5', '1000', '1e2']) {
      await page.locator('#blinds-count').fill(value);
      await page.locator('#preview-config').click();
      assert.equal(await page.locator('#blinds-count').getAttribute('aria-invalid'), 'true');
      assert.equal(await page.locator('#blinds-count').inputValue(), value);
    }
    await page.locator('#details-blinds summary').click();
    await page.locator('#error-list a[href="#blinds-count"]').click();
    assert.equal(await page.evaluate(() => document.activeElement.id), 'blinds-count');
    assert.equal(await page.locator('#details-blinds').getAttribute('open'), '');
    await page.getByRole('button', { name: 'Nie wiem: Ile niezależnych rolet chcesz połączyć?', exact: true }).click();
    assert.match(await prepare(), /Ustalimy podczas rozmowy/);
    await page.locator('#blinds-count').fill('999'); assert.match(await prepare(), /999 \(napędy\)/);
  });
  await run('Monitoring/alarm: ukryte liczby i modele poza wiadomością', async () => {
    await fresh(); await basic('security'); await page.locator('#details-security summary').click();
    await page.locator('#security-scope').selectOption('both');
    await page.locator('#security-cameras').fill('3'); await page.locator('#security-alarms').fill('2');
    await page.locator('#security-recorder').fill('REJESTRATOR-A'); await page.locator('#security-alarmModel').fill('ALARM-B');
    for (const scope of ['monitoring', 'alarm', 'both', 'unknown']) {
      await page.locator('#security-scope').selectOption(scope);
      const text = await prepare();
      assert.equal(text.includes('REJESTRATOR-A'), ['monitoring', 'both'].includes(scope));
      assert.equal(text.includes('ALARM-B'), ['alarm', 'both'].includes(scope));
    }
  });
  await run('PV/logger i magazyn: wspólny system oraz odznaczenie PV', async () => {
    await fresh(); await basic('pv'); await page.locator('#category-storage').check();
    await page.locator('#details-pv summary').click();
    await page.locator('#pv-hasLogger').selectOption('yes'); await page.locator('#pv-logger').fill('LOGGER-A');
    await page.locator('#pv-hasLogger').selectOption('no');
    await page.locator('#details-storage summary').click();
    for (const answer of ['yes', 'no', 'unknown']) {
      await page.locator('#storage-sharedPv').selectOption(answer); optionCount++;
      const text = await prepare();
      assert.equal(text.includes('PV i magazyn: wspólny system'), answer === 'yes'); assert.doesNotMatch(text, /LOGGER-A/);
    }
    await page.locator('#storage-sharedPv').selectOption('yes');
    let text;
    await page.locator('#category-pv').uncheck(); text = await prepare();
    assert.doesNotMatch(text, /PV i magazyn: wspólny system|LOGGER-A|Fotowoltaika:/);
    assert.equal(await page.locator('#storage-sharedPv').isEnabled(), false);
  });
  await run('Lokalnie/zdalnie, centrala i oba kanały kontaktu', async () => {
    await fresh(); await basic();
    await page.locator('.common-details summary').click();
    await page.locator('#host').selectOption('owned'); await page.locator('#hostModel').fill('HOST-A');
    await page.locator('#access').selectOption('away');
    await page.locator('#locality').fill('Łódź');
    await page.locator('#delivery-remote').check();
    for (const answer of ['yes', 'no', 'unknown']) { await page.locator('#remoteReady').selectOption(answer); assert.doesNotMatch(await prepare(), /Miejscowość: Łódź/); }
    await page.locator('#delivery-local').check();
    let text = await prepare(); assert.match(text, /Miejscowość: Łódź/); assert.doesNotMatch(text, /Ethernet i osoba/);
    await page.locator('#host').selectOption('needed'); text = await prepare(); assert.doesNotMatch(text, /HOST-A/);
    await page.getByRole('radio', { name: 'Telefon', exact: true }).check();
    await page.locator('#phone').fill('+44 (20) 7946-0958'); text = await prepare();
    assert.doesNotMatch(text, /qa\+lokalne@example.invalid/); assert.match(text, /\+44 \(20\) 7946-0958/);
  });
  await run('Zdalny montaż i sterowanie energią nie są automatycznie kwalifikowane', async () => {
    await fresh(); await basic(); await page.locator('#details-blinds summary').click();
    await page.locator('#blinds-control').selectOption('buttons'); await page.locator('#delivery-remote').check();
    await page.locator('#category-ev').check(); await page.locator('#details-ev summary').click();
    await page.locator('#ev-function').selectOption('power');
    const text = await prepare(); assert.match(text, /prac na miejscu/); assert.match(text, /odrębnej oceny i testów/);
  });
  await run('Wszystkie kombinacje trzech celów bez dopłat i automatycznego pakietu', async () => {
    await fresh(); await basic('other');
    for (let mask = 1; mask < 8; mask++) {
      for (const [i, goal] of ['app', 'automation', 'energy'].entries()) await page.locator(`#goal-${goal}`).setChecked(Boolean(mask & (1 << i)));
      const text = await prepare();
      assert.doesNotMatch(text, /\d[\d\s,.]*\s*zł|Pakiet: (?:START|STANDARD|PREMIUM)/);
    }
  });
  await run('Wszystkie kategorie i cele, brak obcięcia długiej wiadomości', async () => {
    await fresh();
    for (const c of CATEGORIES) await page.locator(`#category-${c.id}`).check();
    for (const goal of ['app', 'automation', 'energy']) await page.locator(`#goal-${goal}`).check();
    await page.locator('#email').fill('qa@example.invalid'); await page.locator('#notes').fill('ą'.repeat(1000));
    const text = await prepare();
    for (const c of CATEGORIES) assert.ok(text.includes(`${c.label}:`));
    assert.ok(text.includes('ą'.repeat(1000))); assert.equal(await page.locator('#open-email').isVisible(), false);
    assert.equal(await page.locator('#long-message').isVisible(), true);
    assert.doesNotMatch(text, /\d[\d\s,.]*\s*zł/);
  });
  await run('XSS i parametry mailto: tekst pozostaje tekstem', async () => {
    await fresh(); await basic('other'); await page.locator('#details-other summary').click();
    const probe = '<img src=x onerror="window.qaExecuted=true"> &subject=inne';
    await page.locator('#other-description').fill(probe);
    const text = await prepare(); assert.ok(text.includes(probe));
    assert.equal(await page.locator('#summary-categories img').count(), 0);
    const href = await page.locator('#open-email').getAttribute('href');
    assert.equal(new URL(href).searchParams.get('body'), text);
    assert.equal(new URL(href).searchParams.get('subject'), 'Zapytanie Smart Home & Energy — AMPOWER');
    assert.equal(await page.evaluate(() => Boolean(window.qaExecuted)), false);
    assert.equal(await page.evaluate(() => localStorage.length + sessionStorage.length), 0);
    assert.equal((await ctx.cookies()).length, 0);
    assert.equal(new URL(page.url()).search, '');
  });
  await run('Odmowa schowka: pełny podgląd i ręczne kopiowanie', async () => {
    const denied = await context();
    await denied.addInitScript(() => Object.defineProperty(navigator, 'clipboard', { value: { writeText: () => Promise.reject(new Error('QA: odmowa schowka')) } }));
    const p = await denied.newPage(); await p.goto(`${origin.origin}/smart-home-energy/`);
    await p.locator('#category-other').check(); await p.locator('#goal-app').check(); await p.locator('#email').fill('qa@example.invalid');
    await p.locator('#copy-config').click();
    await p.getByText('Nie udało się skopiować tekstu. Zaznacz podsumowanie i skopiuj je ręcznie.', { exact: true }).waitFor();
    assert.equal(await p.evaluate(() => document.activeElement.id), 'message-preview');
    assert.ok((await p.locator('#message-preview').inputValue()).length > 500);
    assert.equal(await p.locator('#copy-config').isEnabled(), true); await denied.close();
  });
  await run('Bez JS oraz awaria importu: oferta, FAQ i bezpośredni kontakt', async () => {
    for (const withoutJs of [true, false]) {
      const fallback = await context({ javaScriptEnabled: !withoutJs });
      if (!withoutJs) await fallback.route('**/smart-home-energy/model.js', route => route.abort());
      const p = await fallback.newPage(); await p.goto(`${origin.origin}/smart-home-energy/`);
      assert.equal(await p.locator('#config-fallback').isVisible(), true);
      assert.equal(await p.locator('#smart-form').isVisible(), false);
      assert.equal(await p.locator('h1').count(), 1);
      assert.equal(await p.locator('#kontakt a[href="mailto:kuba@ampower.pl"]').isVisible(), true);
      await p.goto(`${origin.origin}/#smart-home-energy`);
      assert.equal(await p.locator('#smart-faq summary').count(), 14);
      assert.equal(await p.locator('#smart-korzysci h2').count(), 1);
      await fallback.close();
    }
  });
  await run('Po utracie sieci nadal można przygotować szkic', async () => {
    await fresh(); await basic(); await ctx.setOffline(true);
    try { await prepare(); } finally { await ctx.setOffline(false); }
  });
  await run('Mobile i desktop: reflow, etykiety, fonty i menu Escape', async () => {
    await fresh(); await basic();
    for (const width of [320, 360, 390, 768, 880, 881, 1024, 1100, 1201, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      const measurements = await page.evaluate(() => ({ client: document.documentElement.clientWidth, scroll: document.documentElement.scrollWidth }));
      assert.ok(measurements.scroll <= measurements.client, `${width}: poziome przewijanie`);
    }
    await page.setViewportSize({ width: 390, height: 844 });
    await page.getByRole('button', { name: 'Otwórz menu', exact: true }).click();
    assert.equal(await page.locator('.nav-toggle').getAttribute('aria-expanded'), 'true');
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('.nav-toggle').getAttribute('aria-expanded'), 'false');
    assert.equal(await page.evaluate(() => document.activeElement.className), 'nav-toggle');
    await page.locator('#category-blinds').press('Space'); assert.equal(await page.locator('#category-blinds').isChecked(), false);
    await page.locator('#category-blinds').press('Space'); assert.equal(await page.locator('#category-blinds').isChecked(), true);
    await page.evaluate(() => window.scrollTo({ top: document.querySelector('#konfigurator').offsetTop - 68, behavior: 'instant' }));
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    await page.screenshot({ path: `${output}/06_MOBILE.png` });
    await prepare(); assert.equal(await page.locator('#message-preview').evaluate(n => getComputedStyle(n).fontSize), '16px');
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.evaluate(() => window.scrollTo({ top: document.querySelector('#konfigurator').offsetTop - 68, behavior: 'instant' }));
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    const navPosition = await page.locator('header .brand').evaluate(n => ({ top: n.getBoundingClientRect().top, bottom: n.getBoundingClientRect().bottom }));
    assert.ok(navPosition.top >= 0 && navPosition.bottom <= 68, 'Sticky nagłówek nie zasłania formularza i pozostaje widoczny');
    await page.screenshot({ path: `${output}/06_DESKTOP.png` });
    await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    assert.equal(await page.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior), 'auto');
    assert.equal(await page.evaluate(() => getComputedStyle(document.body).backgroundColor), 'rgb(19, 18, 16)');
    await page.screenshot({ path: `${output}/06_DARK.png` });
    await page.emulateMedia({ colorScheme: 'light', reducedMotion: 'no-preference' });
  });
  await run('Nowa podstrona bez zewnętrznych żądań i bez błędów konsoli', async () => {
    rejectedRequests = []; await fresh(); await basic(); await prepare();
    assert.deepEqual(rejectedRequests, []); assert.deepEqual(pageErrors, []);
  });
  await run('Kontrast wyrenderowanego tekstu obu motywów i focus w kontakcie', async () => {
    await fresh(); await basic();
    await page.locator('#preview-config').click();
    // Oprócz zwykłego tekstu sprawdzamy widoczne komunikaty błędów.
    await page.locator('#email').fill('błędny-adres');
    await page.locator('#preview-config').click();
    for (const theme of ['light', 'dark']) {
      await page.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' });
      const checks = await page.evaluate(() => {
        const rgb = s => (s.match(/[\d.]+/g) || []).map(Number).slice(0, 3);
        const lum = a => { const c = a.map(v => v / 255).map(v => v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4); return c[0] * .2126 + c[1] * .7152 + c[2] * .0722; };
        const ratio = (a, b) => (Math.max(lum(a), lum(b)) + .05) / (Math.min(lum(a), lum(b)) + .05);
        function background(n) {
          while (n) { const c = getComputedStyle(n).backgroundColor; if (!['rgba(0, 0, 0, 0)', 'transparent'].includes(c)) return rgb(c); n = n.parentElement; }
          return [255, 255, 255];
        }
        const checks = [];
        for (const n of document.querySelectorAll('body *')) {
          if (!n.getClientRects().length || n.closest('.sr-only,script,style')) continue;
          if (!Array.from(n.childNodes).some(c => c.nodeType === 3 && c.textContent.trim())) continue;
          const style = getComputedStyle(n); if (style.visibility === 'hidden') continue;
          const px = parseFloat(style.fontSize);
          const minimum = px >= 24 || px >= 18.66 && parseInt(style.fontWeight) >= 700 ? 3 : 4.5;
          checks.push({ element: n.id || n.tagName, text: n.textContent.trim().slice(0, 65), ratio: ratio(rgb(style.color), background(n)), minimum });
        }
        return checks;
      });
      const failures = checks.filter(c => c.ratio < c.minimum);
      contrastResults.push({ theme, textSamples: checks.length, minRatio: Math.min(...checks.map(c => c.ratio)), failures });
      assert.deepEqual(failures, []);
      await page.locator('#kontakt a[href="#konfigurator"]').press('Tab');
      const focus = await page.evaluate(() => ({ color: getComputedStyle(document.activeElement).outlineColor, width: getComputedStyle(document.activeElement).outlineWidth, section: document.activeElement.closest('section').id }));
      assert.equal(focus.section, 'kontakt'); assert.equal(focus.width, '3px'); assert.equal(focus.color, 'rgb(166, 217, 255)');
    }
  });
  await run('Regresja głównej strony: cztery kalkulatory, kombinacja i kontakt', async () => {
    await page.goto(origin.origin);
    const cases = [
      ['elek', { 'elek-zakres': 'nowa', 'elek-punkty': '12', 'elek-rozdz': '0' }, '1700–2400zł'],
      ['klima', { 'klima-ile': '1', 'klima-moc': '3.5', 'klima-zakres': 'komplet', 'klima-trasa': '5' }, '4050–6150zł'],
      ['mon', { 'mon-kamery': '4', 'mon-rodzaj': 'nowa', 'mon-zakres': 'komplet' }, '3350–5400zł'],
      ['naw', { 'naw-m2': '300', 'naw-kropla': '0', 'naw-ster': 'podst', 'naw-woda': 'wodociag' }, '7900–9500zł']
    ];
    const total = async () => (await page.locator('#calc-total').innerText()).replace(/[\s\u00a0]/g, '');
    for (const [id, fields, expected] of cases) {
      for (const other of ['elek', 'klima', 'mon', 'naw']) await page.locator(`#c-${other}`).setChecked(other === id);
      for (const [field, value] of Object.entries(fields)) {
        const locator = page.locator(`#${field}`);
        if (await locator.evaluate(n => n.tagName) === 'SELECT') await locator.selectOption(value);
        else await locator.fill(value);
      }
      assert.equal(await total(), expected);
    }
    for (const id of ['elek', 'klima', 'mon', 'naw']) await page.locator(`#c-${id}`).check();
    assert.equal(await total(), '17000–23450zł');
    assert.match(await page.locator('#calc-mail').getAttribute('href'), /^mailto:kuba@ampower.pl\?subject=/);
    assert.match(await page.locator('#calc-sms').getAttribute('href'), /^sms:\+48785668797\?body=/);
    for (const id of ['elek', 'klima', 'mon', 'naw']) await page.locator(`#c-${id}`).uncheck(); assert.equal(await total(), '—');
    await page.setViewportSize({ width: 390, height: 844 });
    await page.locator('.nav-toggle').click(); await page.keyboard.press('Escape');
    assert.equal(await page.locator('.nav-toggle').getAttribute('aria-expanded'), 'false');
    assert.equal(await page.evaluate(() => document.activeElement.className), 'nav-toggle');
  });
} finally {
  const report = { date: new Date().toISOString(), browser: `Chromium ${browser.version()}`, viewportEmulationIsNotSafari: true, optionCount, contrastResults, durationMs: Date.now() - start, passed: results.filter(r => r.status === 'passed').length, failed: results.filter(r => r.status === 'failed').length, results };
  await writeFile(`${output}/06_E2E_RESULTS.json`, JSON.stringify(report, null, 2) + '\n');
  await browser.close();
}
if (results.some(r => r.status === 'failed')) process.exitCode = 1;
