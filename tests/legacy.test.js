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
  const fakeNode = (extra = {}) => ({ value: '', checked: false, min: '', max: '', textContent: '', tabIndex: 0, classList: { toggle() {} }, setAttribute() {}, removeAttribute(name) { delete this[name]; }, addEventListener() {}, closest() { return fakeNode(); }, querySelectorAll() { return []; }, replaceChildren() {}, appendChild() {}, ...extra });
  for (const match of source.matchAll(/<(input|select)\b([^>]*)>/g)) {
    const attrs = Object.fromEntries([...match[2].matchAll(/([\w-]+)="([^"]*)"/g)].map(m => [m[1], m[2]]));
    if (attrs.id) nodes.set(attrs.id, fakeNode({ ...attrs, checked: /\bchecked\b/.test(match[2]) }));
  }
  for (const id of ['kalkulator', 'calc-rows', 'calc-empty', 'calc-total', 'calc-sub', 'calc-mail', 'calc-sms', 'calc-validation', 'calc-message', 'calc-copy', 'calc-copy-status']) nodes.set(id, fakeNode());
  for (const [id, value] of Object.entries(values)) Object.assign(nodes.get(id), typeof value === 'boolean' ? { checked: value } : { value: String(value) });
  runInNewContext(calculator(source), { Intl, document: { getElementById: id => nodes.get(id), createElement: () => fakeNode() } });
  return { total: nodes.get('calc-total').textContent.replace(/[\s\u00a0]/g, ''), mail: nodes.get('calc-mail').href ? decodeURIComponent(nodes.get('calc-mail').href) : '', validation:nodes.get('calc-validation').hidden, quantity:nodes.get('elek-punkty').value, sub:nodes.get('calc-sub').textContent };
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
  ['limit elektryki', { 'c-elek': true, 'elek-zakres': 'nowa', 'elek-punkty': 1000, 'elek-rozdz': '0' }, '—']
];
for (const [name, values, expected] of cases) test(`regresja: ${name}`, () => assert.equal(calculate(values).total, expected));
test('dotychczasowy kontakt nadal przygotowuje e-mail z wyceną', () => assert.match(calculate(cases[1][1]).mail, /^mailto:kuba@ampower\.pl\?subject=/));
test('strona główna używa lokalnego modułu zgody; tag Google nie jest osadzony przed wyborem', () => {
  assert.doesNotMatch(source, /googletagmanager|gtag\s*\(|analytics_storage|ampower-analytics-consent/);
  assert.match(source, /strona nie potwierdza dostarczenia/);
  assert.match(source, /src="\/assets\/consent\.js"/);
  assert.match(source, /data-cookie-settings hidden/);
});

for(const value of ['2.5','',-1,1000])test('nieprawidłowa liczba punktów blokuje wycenę bez zmiany wpisu: '+value,()=>{const r=calculate({'c-elek':true,'elek-punkty':value,'elek-zakres':'nowa','elek-rozdz':'0'});assert.equal(r.total,'—');assert.equal(r.mail,'');assert.equal(r.quantity,String(value));assert.equal(r.validation,false);});
test('trasa klimatyzacji zachowuje części metra',()=>{const base={'c-klima':true,'klima-ile':1,'klima-moc':'3.5','klima-zakres':'komplet','klima-trasa':5.5};const r=calculate(base);assert.match(r.mail,/trasa 5.5 m/);assert.notEqual(r.total,calculate({...base,'klima-trasa':5}).total);});
test('sama rozdzielnica nie wymaga nowych punktów',()=>{const r=calculate({'c-elek':true,'elek-zakres':'nowa','elek-punkty':0,'elek-rozdz':'1'});assert.equal(r.total,'1200–2800zł');assert.equal(r.validation,true);assert.match(r.mail,/z rozdzielnicą/i);});
test('wybrana elektryka bez punktów i rozdzielnicy prosi o zakres, bez wyceny i kontaktu',()=>{const r=calculate({'c-elek':true,'elek-zakres':'nowa','elek-punkty':0,'elek-rozdz':'0'});assert.equal(r.total,'—');assert.equal(r.mail,'');assert.equal(r.validation,true);assert.equal(r.sub,'Uzupełnij ilość lub wybierz zakres prac.');});
test('suma wyświetlonych zaokrąglonych pozycji jest zgodna z kwotą łączną i szkicem',()=>{
 const r=calculate({'c-elek':true,'elek-zakres':'osprzet','elek-punkty':1,'elek-rozdz':'0','c-mon':true,'mon-kamery':4,'mon-rodzaj':'nowa','mon-zakres':'komplet'});
 assert.equal(r.total,'3400–5500zł');
 assert.match(r.mail.replace(/[\s\u00a0]/g,''),/Razem:3400–5500zł/);
});
