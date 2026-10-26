import test from 'node:test';
import assert from 'node:assert/strict';
import { CATEGORIES, PRICE_POLICY } from '../smart-home-energy/data.js';
import { buildInquiry, emailDraft, evaluate, fieldsFor, inquiryText, parseCount, validate } from '../smart-home-energy/model.js';

const base = () => ({ categories: ['blinds'], goals: ['app'], delivery: 'unknown', channel: 'email', email: 'dom+smart@example.technology', details: {}, host: 'unknown', access: 'unknown' });

test('minimalne zapytanie bez wiedzy technicznej jest poprawne', () => {
  assert.deepEqual(validate(base()), []);
  assert.equal(buildInquiry(base()).categories[0].answers.count, null);
});
test('wymagane grupy i kontakt mają osobne błędy', () => {
  assert.deepEqual(validate({}).map(e => e.field), ['categories', 'goals', 'channel']);
});
for (const input of ['', '1', '4', '999']) test(`liczba poprawna lub nieznana: ${JSON.stringify(input)}`, () => assert.equal(parseCount(input).valid, true));
for (const input of ['0', '-1', '1.5', '1,5', '1000', '1e2', '+4', '04', 'Infinity', 'abc']) test(`liczba niepoprawna: ${input}`, () => {
  assert.equal(parseCount(input).valid, false);
  assert.equal(validate({ ...base(), details: { blinds: { count: input } } })[0].field, 'blinds-count');
});
for (const c of CATEGORIES) test(`${c.label}: brak szczegółów nie blokuje i nie generuje ceny`, () => {
  const raw = { ...base(), categories: [c.id] };
  assert.deepEqual(validate(raw), []);
  assert.equal(evaluate(raw).status, 'individual');
  assert.equal(evaluate(raw).price, null);
});
test('pełna konfiguracja nie zastępuje zatwierdzenia cennika', () => {
  const raw = { ...base(), categories: CATEGORIES.map(c => c.id), details: Object.fromEntries(CATEGORIES.map(c => [c.id, { count: '4', model: 'Model', connection: 'network', status: 'installed' }])) };
  assert.equal(PRICE_POLICY.approvedVersion, null);
  assert.equal(evaluate(raw).price, null);
  assert.equal(buildInquiry(raw).pricing.priceListVersion, null);
  assert.doesNotMatch(inquiryText(buildInquiry(raw)), /\d[\d\s,.]*\s*zł/);
});
test('odznaczona kategoria znika z walidacji i zapytania', () => {
  const raw = { ...base(), categories: ['lights'], details: { blinds: { count: '0', controller: 'UKRYTE' } } };
  assert.deepEqual(validate(raw), []);
  assert.equal(buildInquiry(raw).categories.length, 1);
  assert.doesNotMatch(inquiryText(buildInquiry(raw)), /UKRYTE/);
});
test('centrala rolet i sterownik na napęd są rozłączne', () => {
  const blinds = CATEGORIES[0];
  for (const control of ['central', 'perDrive']) {
    const inquiry = buildInquiry({ ...base(), details: { blinds: { control, count: '4', controller: control, mixed: 'UKRYTE' } } });
    assert.equal(inquiry.categories[0].answers.control, control);
    assert.equal(inquiry.categories[0].answers.controller, control);
    assert.equal(inquiry.categories[0].answers.mixed, undefined);
  }
  assert.ok(fieldsFor(blinds, { control: 'mixed' }).some(f => f.key === 'mixed'));
});
test('ukryty model sterownika nie trafia do zapytania i nie jest walidowany', () => {
  const raw = { ...base(), details: { blinds: { control: 'buttons', controller: 'x'.repeat(121) } } };
  assert.deepEqual(validate(raw), []);
  assert.equal(buildInquiry(raw).categories[0].answers.controller, undefined);
});
for (const scope of ['monitoring', 'alarm', 'both', 'unknown']) test(`monitoring/alarm: gałąź ${scope}`, () => {
  const raw = { ...base(), categories: ['security'], details: { security: { scope, cameras: '3', alarms: '2', recorder: 'Rejestrator', alarmModel: 'Centrala' } } };
  const answers = buildInquiry(raw).categories[0].answers;
  assert.equal('cameras' in answers, ['monitoring', 'both'].includes(scope));
  assert.equal('alarms' in answers, ['alarm', 'both'].includes(scope));
  assert.deepEqual(validate(raw), []);
});
test('PV i magazyn mogą być jednym systemem; gałąź znika po odznaczeniu PV', () => {
  const raw = { ...base(), categories: ['pv', 'storage'], details: { storage: { sharedPv: 'yes' } } };
  assert.match(inquiryText(buildInquiry(raw)), /PV i magazyn: wspólny system/);
  raw.categories = ['storage'];
  assert.equal(buildInquiry(raw).categories[0].answers.sharedPv, undefined);
});
test('widoczna miejscowość jest zachowana także zdalnie, lokalnie pomijamy gotowość zdalną', () => {
  const raw = { ...base(), delivery: 'remote', remoteReady: 'yes', locality: 'Głogów' };
  assert.deepEqual(validate(raw), []);
  assert.equal(buildInquiry(raw).locality, 'Głogów');
  assert.match(inquiryText(buildInquiry(raw)), /Miejscowość: Głogów/);
  assert.equal(validate({ ...raw, locality: 'x'.repeat(81) })[0].field, 'locality');
  raw.delivery = 'local'; raw.locality = 'Łódź';
  assert.equal(buildInquiry(raw).remoteReady, null);
});
test('wszystkie wybrane ustawienia wspólne trafiają do szkicu bez fikcyjnej ceny', () => {
  const raw = { ...base(), radioChoice:'p03', infrastructure:'ready', complexity:'complex', simpleScenes:'3', advancedScenes:'2', support:'extended' };
  const inquiry = buildInquiry(raw), text = inquiryText(inquiry);
  assert.deepEqual(inquiry.project, {radioChoice:'p03', infrastructure:'ready', complexity:'complex', simpleScenes:3, advancedScenes:2, support:'extended'});
  for(const phrase of ['Mam SONOFF ZBDongle-E','Sprawna sieć i gotowe punkty instalacji','Dodatkowa diagnostyka / złożone integracje','proste automatyzacje — liczba: 3','zaawansowane automatyzacje — liczba: 2','Dodatkowe wsparcie rozszerzone']) assert.ok(text.includes(phrase),phrase);
  assert.equal(inquiry.pricing.price,null);
  assert.doesNotMatch(text,/\d[\d\s,.]*\s*zł/);
});
test('pusta liczba automatyzacji i jawne zero pozostają różnymi założeniami',()=>{
  const inquiry=buildInquiry({...base(),simpleScenes:'',advancedScenes:'0'}),text=inquiryText(inquiry);
  assert.equal(inquiry.project.simpleScenes,null);assert.equal(inquiry.project.advancedScenes,0);
  assert.doesNotMatch(text,/proste automatyzacje — liczba:/);assert.match(text,/zaawansowane automatyzacje — liczba: 0/);
});
for(const value of ['-2','abc','1.5','1e2','1000','04'])test('szkic odrzuca błędną liczbę automatyzacji: '+value,()=>{
  const errors=validate({...base(),simpleScenes:value,advancedScenes:value});
  assert.deepEqual(errors.map(e=>e.field),['simpleScenes','advancedScenes']);
});
test('zdalnie + montaż i sterowanie energią wymagają kwalifikacji', () => {
  const raw = { ...base(), delivery: 'remote', categories: ['blinds', 'ev'], details: { blinds: { control: 'buttons' }, ev: { function: 'power' } } };
  assert.equal(evaluate(raw).messages.length, 2);
  assert.equal(evaluate(raw).price, null);
});
for (const phone of ['785 668 797', '+48 (785) 668-797', '+44 20 7946 0958', '1234567', '+123456789012345']) test(`telefon akceptowany: ${phone}`, () => assert.deepEqual(validate({ ...base(), channel: 'phone', phone }), []));
for (const phone of ['123', 'abc785668797', '++48785668797', '1234567890123456', '48+785668797']) test(`telefon odrzucony: ${phone}`, () => assert.equal(validate({ ...base(), channel: 'phone', phone })[0].field, 'phone'));
test('drugi kanał kontaktu nie trafia do treści', () => {
  const raw = { ...base(), channel: 'phone', phone: '+44 20 7946 0958', email: 'UKRYTE' };
  assert.deepEqual(validate(raw), []);
  assert.doesNotMatch(inquiryText(buildInquiry(raw)), /UKRYTE/);
});
test('limity tekstów i aktywnego modelu', () => {
  const raw = { ...base(), name: 'x'.repeat(81), notes: 'x'.repeat(1001), locality: 'x'.repeat(81), host: 'owned', hostModel: 'x'.repeat(121), details: { blinds: { model: 'x'.repeat(121) } } };
  assert.deepEqual(validate(raw).map(e => e.field), ['blinds-model', 'name', 'notes', 'locality', 'hostModel']);
});
test('polskie znaki oraz e-mail z plusem zachowane w pełnej treści', () => {
  const text = inquiryText(buildInquiry({ ...base(), name: 'Łukasz', notes: 'Żółte światło' }));
  assert.match(text, /Łukasz/); assert.match(text, /Żółte światło/); assert.match(text, /dom\+smart@example.technology/);
});
test('link e-mail koduje treść i chroni przed wstrzyknięciem parametrów', () => {
  const text = 'Łódź &subject=inne\nBcc: nie@example.com';
  const draft = emailDraft(text);
  assert.equal(new URL(draft.uri).searchParams.get('body'), text);
  assert.equal(new URL(draft.uri).searchParams.get('subject'), 'Zapytanie Smart Home & Energy — AMPOWER');
});
test('zbyt długa treść ma fallback bez obcięcia', () => {
  const raw = { ...base(), categories: CATEGORIES.map(c => c.id), notes: 'ą'.repeat(1000) };
  const text = inquiryText(buildInquiry(raw));
  assert.equal(emailDraft(text).uri, null);
  assert.match(text, new RegExp('ą'.repeat(1000)));
});
test('proste zapytanie mieści się w linku szkicu', () => assert.ok(emailDraft(inquiryText(buildInquiry(base()))).uri));
test('niepełna para UTF-16 nie przerywa przygotowania pełnego szkicu', () => {
  const text = inquiryText(buildInquiry({ ...base(), notes: 'A\ud800B' }));
  assert.match(text, /A\ud800B/);
  assert.deepEqual(emailDraft(text), { uri: null, tooLong: false });
});
