// Ten moduł zna wyłącznie publiczne ceny sprzedaży. Kwoty w PLN; VAT zaokrąglany per wiersz.
export const cents = amount => Math.round((amount + Number.EPSILON) * 100);
const current = (row, now) => row && row.approvalStatus === 'approved' && Date.parse(row.validUntil) > +now;
const rangeValid = r => Array.isArray(r) && r.length === 2 && r.every(n => Number.isFinite(n) && n >= 0) && r[0] <= r[1];
const count = n => Number.isInteger(n) && n >= 0 && n <= 999;
export function estimate(selection, book, now = new Date()) {
  const reasons = [];
  const lines = [];
  const fail = reason => { if (!reasons.includes(reason)) reasons.push(reason); };
  const individual = () => ({ status: selection.items?.length ? 'individual' : 'empty', price: null, priceListVersion: null, lines: [], reasons });
  if (!selection.items?.length) return individual();
  if (!book.enabled || !book.version || Date.parse(book.validFrom) > +now || !(Date.parse(book.validUntil) > +now) || !book.rules) { fail('Cennik wymaga zatwierdzenia lub aktualizacji.'); return individual(); }
  const rules = book.rules;
  if (!['local', 'remote'].includes(selection.delivery) || !['owned', 'needed'].includes(selection.host) || selection.infrastructure !== 'ready' || !['simple', 'complex'].includes(selection.complexity)) fail('Ustalimy sposób realizacji, centralę i warunki techniczne instalacji.');
  if (selection.delivery === 'remote' && selection.remoteReady !== 'yes') fail('Konfiguracja zdalna wymaga sprawnej sieci i osoby na miejscu.');
  if (selection.access === 'away') fail('Dostęp poza domem i ewentualne usługi zewnętrzne wycenimy indywidualnie.');
  for (const n of [selection.simpleScenes, selection.advancedScenes]) if (!count(n)) fail('Podaj liczbę dodatkowych automatyzacji.');
  if (!['none', 'basic', 'extended'].includes(selection.support)) fail('Ustalimy zakres wsparcia.');
  if (selection.automationRequested && selection.simpleScenes + selection.advancedScenes === 0) fail('Ustalimy zakres oczekiwanych automatyzacji.');
  const add = (row, quantity, group, key, discount = 0) => {
    if (!current(row, now) || !rangeValid(row.saleNetRange) || ![0, 8, 23].includes(row.vatRate)) { fail('Wybrane urządzenie lub usługa wymaga indywidualnej wyceny.'); return; }
    const netCents = row.saleNetRange.map(n => Math.round(cents(n) * quantity * (1 - discount / 100)));
    const vatCents = netCents.map(n => Math.round(n * row.vatRate / 100));
    lines.push({ key, id: row.id, label: row.label, quantity, group, vatRate: row.vatRate, netCents, vatCents, grossCents: netCents.map((n, i) => n + vatCents[i]) });
  };
  const service = (id, quantity = 1, group = 'configuration', key = id) => { if (quantity) add(book.services.find(s => s.id === id), quantity, group, key); };
  if ((rules.quantityDiscounts || []).some(d => !Number.isInteger(d.from) || d.from < 1 || !Number.isFinite(d.percent) || d.percent < 0 || d.percent >= 100)) fail('Reguły rabatowe wymagają zatwierdzenia.');
  if (selection.host === 'owned' && !(rules.approvedHostModels || []).some(m => m.toLocaleLowerCase('pl') === String(selection.ownedHostModel || '').trim().toLocaleLowerCase('pl'))) fail('Sprawdzimy model i możliwość rozbudowy posiadanej centrali.');
  const hardware = new Map();
  const systems = new Map();
  const unique = new Set();
  const qualified = product => product?.compatibilityStatus === 'qualified' && product.allowedDeliveries?.includes(selection.delivery);
  let points = 0;
  for (const item of selection.items) {
    const p = book.products.find(p => p.id === item.deviceId);
    if (!p || !count(item.quantity) || item.quantity < 1 || !['new', 'existing'].includes(item.ownership)) { fail('Dobór modelu i liczby urządzeń wymaga sprawdzenia.'); continue; }
    if (item.category !== p.category && !(item.category === 'other' && p.category === 'other')) { fail('Model nie odpowiada wybranej kategorii.'); continue; }
    if (!qualified(p) || (p.allowedFunctions.length && !p.allowedFunctions.includes(item.function)) || (p.allowedControls.length && !p.allowedControls.includes(item.control))) fail('Ta funkcja lub droga integracji wymaga indywidualnej kwalifikacji.');
    if (['storage', 'ev'].includes(item.category) && ['control', 'power'].includes(item.function)) fail('Sterowanie energią wymaga audytu i pilotażu.');
    if (item.category === 'pv' && item.function !== 'read') fail('Szersza integracja PV wymaga indywidualnej wyceny.');
    if (item.control === 'mixed') fail('Rozdzielimy zakres instalacji mieszanej po sprawdzeniu urządzeń.');
    const pointKey = `${item.category}:${item.deviceId}:${item.systemId}`;
    if (unique.has(pointKey)) { fail('Powtórzony zakres urządzeń wymaga sprawdzenia.'); continue; }
    unique.add(pointKey);
    points += item.quantity * p.pointsPerUnit;
    if (p.systemType) {
      if (!/^[\p{L}\p{N} _-]{1,60}$/u.test(item.systemId || '')) fail('Podaj oznaczenie wspólnego systemu lub bramki.');
      else if (systems.has(item.systemId) && systems.get(item.systemId) !== p.systemType) fail('Wspólna bramka wymaga potwierdzenia jednej drogi integracji.');
      else systems.set(item.systemId, p.systemType);
    }
    // Posiadane urządzenie też może wymagać nowego radia przy integracji z HA.
    for (const id of p.dependencyIds) {
      if (!['none', ...(book.products.filter(p => p.category === 'radio').map(p => p.id))].includes(selection.radioChoice)) { fail('Sprawdzimy, czy trzeba dostarczyć radio Zigbee.'); continue; }
      const possible = [id, ...(rules.radioAlternatives?.[id] || [])];
      const owned = selection.ownedInfrastructure?.find(id => possible.includes(id));
      if (owned) {
        const radio = book.products.find(p => p.id === owned);
        if (!current(radio, now) || !radio.existingApproved || !qualified(radio)) fail('Posiadane radio wymaga sprawdzenia kompatybilności.');
      } else hardware.set(id, Math.max(1, hardware.get(id) || 0));
    }
    if (item.ownership === 'new') {
      if (p.existingOnly || p.availability !== 'available') fail('Cena lub dostępność nowego sprzętu wymaga aktualizacji.');
      hardware.set(p.id, (hardware.get(p.id) || 0) + item.quantity);
      if (p.installationService) {
        if (selection.delivery !== 'local' || item.installation !== 'ready') fail('Nowy moduł wymaga kwalifikacji i montażu na miejscu.');
        else service(p.installationService, item.quantity, 'installation', `install:${pointKey}`);
      }
    } else if (!current(p, now) || !p.existingApproved || item.installation !== 'installed') fail('Sprawdzimy model i stan istniejących urządzeń.');
  }
  if (selection.host === 'needed') hardware.set('p01', Math.max(1, hardware.get('p01') || 0));
  // Zależności host/radio/mostek raz; cena materiału i robocizna osobno.
  for (const [id, quantity] of hardware) {
    const p = book.products.find(p => p.id === id);
    if (!p || p.existingOnly || p.availability !== 'available') { fail('Wymagany sprzęt jest niedostępny lub wymaga aktualizacji ceny.'); continue; }
    if (!qualified(p)) { fail('Wymagany sprzęt wymaga indywidualnej kwalifikacji.'); continue; }
    const discounts = (rules.quantityDiscounts || []).filter(d => Number.isInteger(d.from) && d.from > 0 && Number.isFinite(d.percent) && d.percent >= 0 && d.percent < 100 && quantity >= d.from);
    const discount = discounts.sort((a, b) => b.from - a.from)[0]?.percent || 0;
    add(p, quantity, 'hardware', `hardware:${id}`, discount);
  }
  service(selection.host === 'owned' ? 'expansion' : 'base');
  service('integration', systems.size);
  service('point', points);
  service('simple', selection.simpleScenes);
  service('advanced', selection.advancedScenes);
  if (selection.complexity === 'complex') service('complex');
  if (selection.delivery === 'remote') service('remote');
  if (selection.support !== 'none') service(`support-${selection.support}`);
  if (hardware.size) service('materials', 1, 'hardware');
  if (hardware.size && selection.delivery === 'remote') service('shipping', 1, 'travel');
  if (selection.delivery === 'local') {
    const zone = rules.travelZones[String(selection.locality || '').trim().toLocaleLowerCase('pl')];
    if (!zone || !(Date.parse(zone.validUntil) > +now)) fail('Dojazd wycenimy po sprawdzeniu lokalizacji.');
    else add({ ...zone, id: 'travel', label: 'Dojazd', approvalStatus: 'approved' }, 1, 'travel', 'travel');
  }
  for (const key of ['minimumOrderNet', 'minimumExpansionNet', 'minimumConfigurationNet']) if (!Number.isFinite(rules[key]) || rules[key] < 0) fail('Minimalne opłaty wymagają zatwierdzenia.');
  if (![0, 8, 23].includes(rules.minimumVatRate) || !Number.isFinite(rules.roundingGross) || rules.roundingGross < 1) fail('VAT lub zasady zaokrąglania wymagają zatwierdzenia.');
  if (reasons.length) return individual();
  const topUp = (id, label, minimum, group, candidates) => {
    const totals = [0, 1].map(i => candidates.reduce((sum, l) => sum + l.netCents[i], 0));
    if (totals.some(n => n < cents(minimum)) && candidates.some(l => l.vatRate !== rules.minimumVatRate)) { fail('Kwalifikacja VAT minimalnej opłaty wymaga indywidualnej wyceny.'); return; }
    const netCents = totals.map(n => Math.max(0, cents(minimum) - n));
    if (netCents.some(n => n > 0)) {
      const vatCents = netCents.map(n => Math.round(n * rules.minimumVatRate / 100));
      lines.push({ key: id, id, label, quantity: 1, group, vatRate: rules.minimumVatRate, netCents, vatCents, grossCents: netCents.map((n, i) => n + vatCents[i]) });
    }
  };
  topUp('minimum-configuration', 'Dopełnienie minimalnej konfiguracji', rules.minimumConfigurationNet, 'configuration', lines.filter(l => l.group === 'configuration'));
  topUp('minimum-order', 'Dopełnienie minimalnej wartości zlecenia', selection.host === 'owned' ? rules.minimumExpansionNet : rules.minimumOrderNet, 'configuration', [...lines]);
  if (reasons.length) return individual();
  const gross = [0, 1].map(i => lines.reduce((sum, l) => sum + l.grossCents[i], 0));
  const step = cents(rules.roundingGross);
  const price = { low: Math.floor(gross[0] / step) * step / 100, high: Math.ceil(gross[1] / step) * step / 100, currency: 'PLN', gross: true, vatRates: [...new Set(lines.map(l => l.vatRate))].sort((a, b) => a - b) };
  return { status: 'estimated', price, priceListVersion: book.version, lines, reasons: [], includes: ['Sprzęt i materiały według zakresu', 'Montaż na miejscu, jeśli wybrany', 'Konfiguracja i wybrane automatyzacje', 'Dojazd według lokalizacji, jeśli dotyczy'], assumptions: ['Modele i warunki instalacji wymagają potwierdzenia przed ofertą.', 'Kwoty brutto zaokrąglono na zewnątrz do wskazanego kroku.', 'Abonamenty i usługi zewnętrzne poza wyceną.'] };
}
export function selectionFromRaw(raw) {
  return { items: (raw.categories || []).map(category => { const d = raw.details?.[category] || {}; return { category, deviceId: d.quoteDevice, quantity: /^\d+$/.test(String(d.count || (d.scope === 'monitoring' && d.quoteDevice === 'onvif-existing' ? d.cameras : d.scope === 'alarm' && d.quoteDevice === 'satel-existing' ? d.alarms : '') || '')) ? Number(d.count || (d.quoteDevice === 'onvif-existing' ? d.cameras : d.alarms)) : null,
    ownership: d.ownership, installation: d.ownership === 'existing' && d.status === 'installed' ? 'installed' : d.status === 'planned' && raw.infrastructure === 'ready' ? 'ready' : 'unknown', systemId: d.systemId, function: d.function, control: d.control }; }),
    delivery: raw.delivery, host: raw.host, infrastructure: raw.infrastructure, complexity: raw.complexity, locality: raw.locality,
    simpleScenes: /^\d+$/.test(String(raw.simpleScenes || '')) ? Number(raw.simpleScenes) : null, advancedScenes: /^\d+$/.test(String(raw.advancedScenes || '')) ? Number(raw.advancedScenes) : null,
    remoteReady: raw.remoteReady, support: raw.support, access: raw.access, automationRequested: raw.goals?.includes('automation'), ownedHostModel: raw.hostModel, radioChoice: raw.radioChoice, ownedInfrastructure: ['p02','p03'].includes(raw.radioChoice) ? [raw.radioChoice] : [] };
}
