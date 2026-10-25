import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { runInNewContext } from 'node:vm';

const source = readFileSync('index.html', 'utf8');
const calculator = html => html.slice(html.indexOf('var CENNIK ='), html.indexOf('</script>', html.indexOf('var CENNIK =')));

test('kwoty starego cennika pozostają identyczne z HEAD', () => {
  const before = execFileSync('git', ['show', 'HEAD:index.html'], { encoding: 'utf8', maxBuffer: 4 * 1024 * 1024 });
  const prices = html => calculator(html).split('(function ()')[0];
  assert.equal(prices(source), prices(before));
});
function calculate(values) {
  const nodes = new Map();
  const fakeNode = (extra = {}) => ({ value: '', checked: false, min: '', max: '', textContent: '', tabIndex: 0, classList: { toggle() {} }, setAttribute() {}, addEventListener() {}, closest() { return fakeNode(); }, querySelectorAll() { return []; }, replaceChildren() {}, appendChild() {}, ...extra });
  for (const match of source.matchAll(/<(input|select)\b([^>]*)>/g)) {
    const attrs = Object.fromEntries([...match[2].matchAll(/([\w-]+)="([^"]*)"/g)].map(m => [m[1], m[2]]));
    if (attrs.id) nodes.set(attrs.id, fakeNode({ ...attrs, checked: /\bchecked\b/.test(match[2]) }));
  }
  for (const id of ['kalkulator', 'calc-rows', 'calc-empty', 'calc-total', 'calc-sub', 'calc-mail', 'calc-sms']) nodes.set(id, fakeNode());
  for (const [id, value] of Object.entries(values)) Object.assign(nodes.get(id), typeof value === 'boolean' ? { checked: value } : { value: String(value) });
  runInNewContext(calculator(source), { Intl, document: { getElementById: id => nodes.get(id), createElement: () => fakeNode() } });
  return { total: nodes.get('calc-total').textContent.replace(/[\s\u00a0]/g, ''), mail: decodeURIComponent(nodes.get('calc-mail').href) };
}
const cases = [
  ['brak wyboru', {}, '—'],
  ['elektryka', { 'c-elek': true, 'elek-zakres': 'nowa', 'elek-punkty': 12, 'elek-rozdz': '0' }, '1700–2400zł'],
  ['klima split', { 'c-klima': true, 'klima-ile': 1, 'klima-moc': '3.5', 'klima-zakres': 'komplet', 'klima-trasa': 5 }, '4050–6150zł'],
  ['klima 7 pomieszczeń', { 'c-klima': true, 'klima-ile': 7, 'klima-moc': '3.5', 'klima-zakres': 'komplet', 'klima-trasa': 5 }, '22100–37050zł'],
  ['monitoring', { 'c-mon': true, 'mon-kamery': 4, 'mon-rodzaj': 'nowa', 'mon-zakres': 'komplet' }, '3350–5400zł'],
  ['nawadnianie', { 'c-naw': true, 'naw-m2': 300, 'naw-kropla': 0, 'naw-ster': 'podst', 'naw-woda': 'wodociag' }, '7900–9500zł'],
  ['nawadnianie puste', { 'c-naw': true, 'naw-m2': 0, 'naw-kropla': 0, 'naw-ster': 'podst', 'naw-woda': 'wodociag' }, '—'],
  ['Wi-Fi bez powierzchni nie tworzy pozornego zakresu', { 'c-naw': true, 'naw-m2': 0, 'naw-kropla': 0, 'naw-ster': 'wifi', 'naw-woda': 'wodociag' }, '—'],
  ['limit elektryki', { 'c-elek': true, 'elek-zakres': 'nowa', 'elek-punkty': 1000, 'elek-rozdz': '0' }, '139850–199800zł']
];
for (const [name, values, expected] of cases) test(`regresja: ${name}`, () => assert.equal(calculate(values).total, expected));
test('dotychczasowy kontakt nadal przygotowuje e-mail z wyceną', () => assert.match(calculate(cases[1][1]).mail, /^mailto:kuba@ampower\.pl\?subject=/));
test('strona główna używa lokalnego modułu zgody; tag Google nie jest osadzony przed wyborem', () => {
  assert.doesNotMatch(source, /googletagmanager|gtag\s*\(|analytics_storage|ampower-analytics-consent/);
  assert.match(source, /strona nie potwierdza dostarczenia/);
  assert.match(source, /src="\/assets\/consent\.js"/);
  assert.match(source, /data-cookie-settings hidden/);
});
