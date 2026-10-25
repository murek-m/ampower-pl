import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const home=readFileSync('index.html','utf8'),smart=readFileSync('smart-home-energy/index.html','utf8');
const sections=['smart-korzysci','smart-automatyzacje','smart-pakiety','smart-realizacja','smart-wsparcie','smart-faq'];
test('uwaga 1: główna ma sześć kart i jedną kartę 06 / SMART HOME z linkiem',()=>{
  assert.equal([...home.matchAll(/class="card-ref"/g)].length,6);
  assert.equal([...home.matchAll(/06 \/ SMART HOME/g)].length,1);
  assert.match(home,/<a class="service-link" href="\/smart-home-energy\/">/);
  for(const id of sections)assert.ok(!home.includes(`id="${id}"`));
});
test('uwaga 2: rozbudowane sekcje Smart Home i FAQ są na podstronie',()=>{
  for(const id of sections)assert.equal([...smart.matchAll(new RegExp(`id="${id}"`,'g'))].length,1);
  assert.match(smart,/id="smart-form"/);
});
test('uwaga 3: menu, brak odsyłacza w stopkach i poprzedni opis meta głównej',()=>{
  const nav=home.match(/<nav\b[\s\S]*?<\/nav>/)[0];assert.match(nav,/href="\/smart-home-energy\/"/);
  for(const page of [home,smart,readFileSync('prywatnosc/index.html','utf8')]){
    const footer=page.match(/<footer\b[\s\S]*?<\/footer>/)[0];assert.doesNotMatch(footer,/href="\/smart-home-energy\/"/);
  }
  const before='AmPower Jakub Babiej — instalacje elektryczne, montaż klimatyzacji (autoryzowany instalator LG i Rotenso), systemy alarmowe, monitoring i automatyczne nawadnianie ogrodów (certyfikat Rain Bird). Czerńczyce, Dolny Śląsk. Darmowa wycena: 785 668 797.';
  assert.equal(home.match(/<meta name="description" content="([^"]+)"/)[1],before);
});
