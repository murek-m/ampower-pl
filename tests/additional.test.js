import test from 'node:test';
import assert from 'node:assert/strict';
import { CATEGORIES } from '../smart-home-energy/data.js';
import { buildInquiry, evaluate, inquiryText, validate } from '../smart-home-energy/model.js';

// Lista z UX, niezależna od kolejności i zawartości katalogu implementacji.
const ids = ['blinds', 'lights', 'ac', 'heatPump', 'boiler', 'floor', 'pv', 'storage', 'ev', 'gate', 'security', 'other'];
const goals = ['app', 'automation', 'energy'];
const base = { channel: 'email', email: 'qa+odbior@example.invalid', host: 'unknown', access: 'unknown' };
test('katalog zawiera dokładnie 12 kategorii ustalonych w UX', () => {
  assert.deepEqual(CATEGORIES.map(c => c.id), ids);
});
test('85 995 kombinacji kategorii, celów i realizacji: brak ceny i poprawny aktywny zakres', () => {
  let combinations = 0;
  for (let mask = 1; mask < 4096; mask++) {
    const categories = ids.filter((_, i) => mask & (1 << i));
    for (let goalMask = 1; goalMask < 8; goalMask++) {
      const selectedGoals = goals.filter((_, i) => goalMask & (1 << i));
      for (const delivery of ['unknown', 'local', 'remote']) {
        const raw = { ...base, categories, goals: selectedGoals, delivery, locality: 'MIEJSCOWOSC-QA', remoteReady: 'yes', details: {} };
        assert.deepEqual(validate(raw), []);
        const inquiry = buildInquiry(raw);
        assert.deepEqual(inquiry.categories.map(c => c.id), categories);
        assert.deepEqual(inquiry.goals, selectedGoals);
        assert.equal(inquiry.pricing.status, 'individual');
        assert.equal(inquiry.pricing.price, null);
        assert.equal(inquiry.pricing.priceListVersion, null);
        assert.equal(inquiry.locality, delivery === 'remote' ? null : 'MIEJSCOWOSC-QA');
        assert.equal(inquiry.remoteReady, delivery === 'remote' ? 'yes' : null);
        combinations++;
      }
    }
  }
  assert.equal(combinations, 85995);
});
test('wspólna bramka światła/rolety i wspólny falownik PV/magazyn nie generują opłat', () => {
  const raw = { ...base, categories: ['blinds', 'lights', 'pv', 'storage'], goals, delivery: 'remote', details: {
    blinds: { control: 'central', controller: 'WSPOLNA-BRAMKA', count: '8' },
    lights: { control: 'central', controller: 'WSPOLNA-BRAMKA', count: '4' },
    pv: { model: 'FALOWNIK-HYBRYDOWY', count: '1' },
    storage: { sharedPv: 'yes', model: 'FALOWNIK-HYBRYDOWY', count: '1' }
  } };
  const text = inquiryText(buildInquiry(raw));
  assert.match(text, /PV i magazyn: wspólny system/);
  assert.doesNotMatch(text, /\d[\d\s,.]*\s*zł|Pakiet:|VAT|netto|brutto/);
  assert.equal(evaluate(raw).price, null);
});
test('kocioł i podłogówka opisują źródło i strefy osobno, bez zgadywania liczby pętli', () => {
  const raw = { ...base, categories: ['boiler', 'floor'], goals: ['automation'], details: {
    boiler: { count: '1', control: 'central', controller: 'REGULATOR-ZRODLA' },
    floor: { count: '5', control: 'central', controller: 'LISTWA-STREF' }
  } };
  const text = inquiryText(buildInquiry(raw));
  assert.match(text, /1 \(źródła \/ regulatory\)/);
  assert.match(text, /5 \(strefy temperatury\)/);
  assert.doesNotMatch(text, /pętle|\d[\d\s,.]*\s*zł/);
});
test('dane nieaktywnych kategorii i gałęzi nie wpływają na walidację ani wynik', () => {
  const raw = { ...base, categories: ['pv', 'storage', 'security', 'other'], goals, delivery: 'remote', hostModel: 'UKRYTE-HOST', locality: 'UKRYTE-MIASTO', phone: 'UKRYTE-TELEFON', details: {
    blinds: { count: '0', model: 'UKRYTE-ROLETY' },
    pv: { hasLogger: 'no', logger: 'UKRYTE-LOGGER', connection: 'network', connectionOther: 'UKRYTE-POLACZENIE' },
    storage: { sharedPv: 'unknown' },
    security: { scope: 'alarm', cameras: '0', recorder: 'UKRYTE-REJESTRATOR', alarms: '1', alarmModel: 'CENTRALA-QA' },
    other: { model: 'UKRYTE-INNE-MODEL', description: 'Nieznana integracja' }
  } };
  assert.deepEqual(validate(raw), []);
  const text = inquiryText(buildInquiry(raw));
  assert.doesNotMatch(text, /UKRYTE-/);
  assert.match(text, /CENTRALA-QA|Nieznana integracja/);
});
test('nieznane modele i sterowanie energią pozostają indywidualną kwalifikacją', () => {
  const raw = { ...base, categories: ['storage', 'ev'], goals, delivery: 'remote', remoteReady: 'yes', details: {
    storage: { model: 'NIEPOTWIERDZONY', function: 'control' }, ev: { function: 'power' }
  } };
  assert.equal(evaluate(raw).price, null);
  assert.match(inquiryText(buildInquiry(raw)), /odrębnej oceny i testów/);
});
