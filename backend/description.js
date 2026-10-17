// Port do przyszłego dostawcy AI: analyze(description, catalog) -> suggestions + missing.
// Ta implementacja nie korzysta z sieci i nie zatwierdza parametrów ani cen.
const rules = [
  ['blinds','Rolety',/rolet/], ['lights','Oświetlenie',/oświetl|oswietl|światł|swiatl/],
  ['ac','Klimatyzacja',/klimatyzac|daikin/], ['floor','Ogrzewanie podłogowe',/podłog|podlog/],
  ['heatPump','Pompa ciepła',/pompa ciep/], ['boiler','Kocioł / ogrzewanie',/kocioł|kociol|grzejnik/], ['pv','Fotowoltaika',/\bpv\b|fotowolta/],
  ['storage','Magazyn energii',/magazyn energi|bateri/], ['ev','Ładowarka EV',/ładowark|ladowark|\bev\b/],
  ['gate','Brama',/bram/], ['security','Alarm / CCTV',/alarm|cctv|kamer|monitoring/],
  ['sensors','Sensory',/sensor|czujnik/], ['other','Inne instalacje',/elektrycz|hvac|automatyk/]
];
const normalize = s => s.toLocaleLowerCase('pl').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/ł/g,'l');
export function analyzeDescription(description, book) {
  if (typeof description !== 'string' || !description.trim() || description.length > 4000) throw new Error('Opis musi mieć 1–4000 znaków');
  const text = description.toLocaleLowerCase('pl');
  const suggestions = [];
  const missing = ['Miejscowość i sposób realizacji.', 'Istniejąca centrala, sieć i zakres automatyzacji.', 'Aktualne koszty, czasy pracy, ceny sprzedaży i kwalifikacja VAT.'];
  for (const [category,label,pattern] of rules) {
    if (!pattern.test(text)) continue;
    // Ilość tylko obok nazwy. Ułamki, zakresy, „około”, negacje i sprzeczne liczby wymagają rozmowy.
    const stems = {blinds:'rolet',lights:'(?:obwod(?:ów|ow)?\\s+(?:oświetl|oswietl)|(?:świat|swiat))',ac:'(?:klimatyzator|jednost(?:ek|ki)\\s+(?:klimatyzac|daikin))',floor:'(?:stref(?:y|a)?\\s+(?:podłog|podlog))',sensors:'(?:czujnik|sensor)',pv:'falownik',storage:'magazyn',ev:'ładowark',gate:'bram',security:'kamer'}[category];
    const matches = stems ? [...text.matchAll(new RegExp(`(?<![\\d.,])([1-9]\\d{0,2})\\s+${stems}`, 'gu'))] : [];
    const quantities = matches.filter(m => !/(?:około|ok\.|może|do|od|nie ma|bez|nie chce|nie potrzebuje)\s*$/.test(text.slice(Math.max(0,m.index-24),m.index)) && !/(?:\d[.,]|[–-])\s*$/.test(text.slice(Math.max(0,m.index-3),m.index))).map(m => Number(m[1]));
    const quantity = matches.length === 1 && quantities.length === 1 ? quantities[0] : null;
    if (quantity === null) missing.push(`${label}: jednoznaczna liczba punktów / stref.`);
    missing.push(`${label}: model, interfejs i stan instalacji; potwierdzenie zgodności.`);
    const candidates = book.products.filter(p => p.category === category || category === 'sensors' && p.id === 'p06').map(p => ({id:p.id,manufacturer:p.manufacturer,model:p.model,existingOnly:p.existingOnly === true,requiresVerification:true}));
    // Nazwa producenta w opisie zawęża sugestie, nigdy nie jest potwierdzeniem modelu.
    const branded = candidates.filter(p => normalize(text).includes(normalize(p.manufacturer)));
    suggestions.push({category,label,quantity,candidates:branded.length ? branded : candidates,requiresVerification:true});
  }
  if (!suggestions.length) missing.push('Określ kategorię usług i urządzenia.');
  return {provider:'deterministic-v1',description,suggestions,missing:[...new Set(missing)],notice:'Kandydaci katalogowi wymagają wyboru i kwalifikacji. Nie dobrano automatycznie modelu ani nie zatwierdzono cen.'};
}
