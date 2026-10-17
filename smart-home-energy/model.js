import { PRICE_BOOK } from './price-book.js';
import { estimate, selectionFromRaw } from './pricing.js';
import { ACCESS, CATEGORIES, CONNECTION, CONTACT, DELIVERY, GOALS, HOST, PRICE_POLICY, SECURITY, STATUS, UNKNOWN, YES_NO } from './data.js';

const clean = value => String(value ?? '').trim();
const option = (value, choices) => Object.hasOwn(choices, value) ? value : UNKNOWN;
export function parseCount(value) {
  const text = clean(value);
  if (!text) return { value: null, valid: true };
  return /^[1-9]\d{0,2}$/.test(text) ? { value: Number(text), valid: true } : { value: null, valid: false };
}

// Jedno źródło reguł pól dla renderowania, walidacji i budowania zapytania.
export function fieldsFor(category, values = {}, selected = []) {
  const fields = [];
  const add = (key, label, type = 'text', extra = {}) => fields.push({ key, label, type, ...extra });
  const count = (key, label, unit) => add(key, label, 'count', { unit });
  add('quoteDevice', 'Wariant urządzenia — jeśli znasz', 'select', { options: { unknown: 'Dobór urządzenia przez AMPOWER', ...Object.fromEntries(PRICE_BOOK.products.filter(p => p.category === category.id).map(p => [p.id, p.label])) } });
  add('ownership', 'Czy sprzęt ma być dostarczony?', 'select', { options: { unknown: 'Nie wiem', new: 'Nowy sprzęt od AMPOWER', existing: 'Wykorzystanie mojego sprzętu' } });
  add('systemId', 'Oznaczenie wspólnej bramki / systemu — opcjonalnie', 'text', { max: 60 });
  if (category.security) {
    add('scope', 'Co chcesz połączyć?', 'select', { options: SECURITY });
    const scope = option(values.scope, SECURITY);
    if (scope === 'monitoring' || scope === 'both') {
      count('cameras', 'Ile kamer?', 'kamery');
      add('recorder', 'Marka i model rejestratora — jeśli znasz', 'text', { max: 120 });
    }
    if (scope === 'alarm' || scope === 'both') {
      count('alarms', 'Ile central alarmowych?', 'centrale alarmowe');
      add('alarmModel', 'Marka i model centrali alarmowej — jeśli znasz', 'text', { max: 120 });
    }
  } else {
    count('count', category.count, category.unit);
  }
  add('status', 'Czy urządzenia są już zamontowane?', 'select', { options: STATUS });
  if (category.id === 'other') {
    add('description', 'Co chcesz połączyć?', 'textarea', { max: 300 });
    return fields;
  }
  if (category.control) {
    add('control', category.controlLabel, 'select', { options: category.control });
    const mode = option(values.control, category.control);
    if (['central', 'separate', 'perDrive'].includes(mode)) {
      add('controller', mode === 'central' ? 'Marka i model centrali / regulatora — jeśli znasz' : 'Marka i model sterownika — jeśli znasz', 'text', { max: 120 });
    }
    if (mode === 'mixed') add('mixed', 'Opisz układ mieszany — opcjonalnie', 'textarea', { max: 300 });
  }
  if (!category.security) add('model', category.id === 'pv' ? 'Marka i model falownika — jeśli znasz' : 'Marka i model urządzenia — jeśli znasz', 'text', { max: 120 });
  add('connection', 'Jak urządzenie łączy się ze swoim systemem?', 'select', { options: CONNECTION });
  if (values.connection === 'other') add('connectionOther', 'Opisz połączenie — opcjonalnie', 'text', { max: 120 });
  if (category.functions) add('function', 'Jaka funkcjonalność Cię interesuje?', 'select', { options: category.functions });
  if (category.id === 'pv') {
    add('hasLogger', 'Czy masz bramkę / logger producenta?', 'select', { options: YES_NO });
    if (values.hasLogger === 'yes') add('logger', 'Marka i model bramki / loggera — jeśli znasz', 'text', { max: 120 });
  }
  if (category.id === 'storage' && selected.includes('pv')) add('sharedPv', 'Czy magazyn korzysta ze wspólnego systemu z PV?', 'select', { options: YES_NO });
  return fields;
}

export function validate(raw) {
  const errors = [];
  const add = (field, message) => errors.push({ field, message });
  const selected = CATEGORIES.filter(c => raw.categories?.includes(c.id));
  if (!selected.length) add('categories', 'Wybierz co najmniej jedną kategorię urządzeń.');
  if (!Object.keys(GOALS).some(id => raw.goals?.includes(id))) add('goals', 'Zaznacz co najmniej jeden cel integracji.');
  for (const c of selected) {
    const values = raw.details?.[c.id] ?? {};
    for (const f of fieldsFor(c, values, raw.categories)) {
      if (f.type === 'count' && !parseCount(values[f.key]).valid) add(`${c.id}-${f.key}`, 'Wpisz pełną liczbę od 1 do 999 albo wybierz „Nie wiem”. Większy zakres opisz w uwagach.');
      if (f.max && clean(values[f.key]).length > f.max) add(`${c.id}-${f.key}`, `Skróć odpowiedź do ${f.max} znaków.`);
    }
  }
  if (raw.channel === 'email') {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean(raw.email)) || clean(raw.email).length > 254) add('email', 'Sprawdź adres e-mail, np. dom@example.com.');
  } else if (raw.channel === 'phone') {
    const phone = clean(raw.phone);
    const digits = phone.replace(/[\s()\-+]/g, '');
    if (!/^\+?[\d\s()\-]+$/.test(phone) || !/^\d{7,15}$/.test(digits)) add('phone', 'Sprawdź numer telefonu. Możesz użyć spacji i kodu kraju.');
  } else add('channel', 'Wybierz formę kontaktu.');
  for (const [key, max] of [['name', 80], ['notes', 1000]]) {
    if (clean(raw[key]).length > max) add(key, `Skróć odpowiedź do ${max} znaków.`);
  }
  if (raw.delivery !== 'remote' && clean(raw.locality).length > 80) add('locality', 'Skróć miejscowość do 80 znaków.');
  if (raw.host === 'owned' && clean(raw.hostModel).length > 120) add('hostModel', 'Skróć model do 120 znaków.');
  return errors;
}

// Bez zatwierdzonej logiki publicznej nie ma ścieżki zwracającej kwotę.
export function evaluate(raw, book = PRICE_BOOK, now = new Date()) {
  const selected = CATEGORIES.filter(c => raw.categories?.includes(c.id));
  const messages = [];
  const details = raw.details ?? {};
  if (details.storage?.function === 'control' && raw.categories?.includes('storage') || details.ev?.function === 'power' && raw.categories?.includes('ev')) messages.push('Sterowanie magazynem lub regulacja mocy ładowarki wymagają odrębnej oceny i testów.');
  if (raw.delivery === 'remote' && selected.some(c => {
    const d = details[c.id] ?? {};
    return d.status === 'retrofit' || ['blinds', 'lights', 'floor', 'gate'].includes(c.id) && ['buttons', 'none'].includes(d.control);
  })) messages.push('Wybrany zakres może wymagać prac na miejscu. Dobierzemy sposób realizacji po rozmowie.');
  const calculated = estimate(selectionFromRaw(raw), book, now);
  if (calculated.status === 'estimated') return { ...calculated, title: `Szacunkowy koszt instalacji: ${new Intl.NumberFormat('pl-PL').format(calculated.price.low)} zł – ${new Intl.NumberFormat('pl-PL').format(calculated.price.high)} zł`, reason: `Kwoty brutto. VAT: ${calculated.price.vatRates.join('% / ')}%. Sprzęt, montaż i konfiguracja według wybranego zakresu.`, messages };
  return { status: selected.length ? 'individual' : 'empty', title: selected.length ? 'Wymaga indywidualnej wyceny' : 'Wybierz, co chcesz integrować.', reason: calculated.reasons[0] || PRICE_POLICY.reason, messages: messages.slice(0, 2), price: null, priceListVersion: null };
}

export function buildInquiry(raw) {
  const selected = CATEGORIES.filter(c => raw.categories?.includes(c.id));
  const categories = selected.map(c => {
    const source = raw.details?.[c.id] ?? {};
    const answers = Object.fromEntries(fieldsFor(c, source, raw.categories).map(f => [f.key, f.type === 'count' ? parseCount(source[f.key]).value : f.options ? option(source[f.key], f.options) : clean(source[f.key]) || null]));
    return { id: c.id, label: c.label, answers };
  });
  return {
    service: 'ampower-smart-home-energy', formVersion: '1.0',
    categories, goals: Object.keys(GOALS).filter(id => raw.goals?.includes(id)),
    delivery: option(raw.delivery, DELIVERY), access: option(raw.access, ACCESS),
    host: option(raw.host, HOST), hostModel: raw.host === 'owned' ? clean(raw.hostModel) || null : null,
    locality: raw.delivery === 'remote' ? null : clean(raw.locality) || null,
    remoteReady: raw.delivery === 'remote' ? option(raw.remoteReady, YES_NO) : null,
    name: clean(raw.name) || null, notes: clean(raw.notes) || null,
    contact: { channel: raw.channel, value: clean(raw.channel === 'phone' ? raw.phone : raw.email) },
    pricing: evaluate(raw), dataNoticeVersion: 'draft-local-1'
  };
}

const unknown = value => value || 'Ustalimy podczas rozmowy';
export function inquiryText(inquiry) {
  const lines = ['Dzień dobry, proszę o omówienie możliwości i indywidualną wycenę Smart Home & Energy.', '', 'Wybrane integracje:'];
  for (const entry of inquiry.categories) {
    const c = CATEGORIES.find(item => item.id === entry.id);
    lines.push(`\n${entry.label}:`);
    for (const f of fieldsFor(c, entry.answers, inquiry.categories.map(item => item.id))) {
      const value = entry.answers[f.key];
      lines.push(`- ${f.label}: ${f.options ? unknown(f.options[value]) : unknown(value)}${f.type === 'count' && value !== null ? ` (${f.unit})` : ''}`);
    }
  }
  lines.push('', 'Cele: ' + inquiry.goals.map(id => GOALS[id]).join(' '), 'Realizacja: ' + DELIVERY[inquiry.delivery], 'Dostęp do sterowania: ' + ACCESS[inquiry.access], 'Centrala Smart Home: ' + HOST[inquiry.host]);
  if (inquiry.hostModel) lines.push('Model centrali Smart Home: ' + inquiry.hostModel);
  if (inquiry.locality) lines.push('Miejscowość: ' + inquiry.locality);
  if (inquiry.remoteReady) lines.push('Ethernet i osoba na miejscu: ' + YES_NO[inquiry.remoteReady]);
  if (inquiry.categories.some(c => c.id === 'storage' && c.answers.sharedPv === 'yes')) lines.push('PV i magazyn: wspólny system do weryfikacji, bez automatycznego liczenia dwóch integracji.');
  if (inquiry.name) lines.push('Imię: ' + inquiry.name);
  lines.push('Preferowany kontakt: ' + (inquiry.contact.channel === 'phone' ? 'telefon' : 'e-mail'), 'Kontakt: ' + inquiry.contact.value);
  if (inquiry.notes) lines.push('Uwagi: ' + inquiry.notes);
  lines.push('', 'Cena: ' + inquiry.pricing.title, inquiry.pricing.reason, ...inquiry.pricing.messages,
    'Podział do ustalenia: sprzęt i materiały; prace instalacyjne; konfiguracja; osobno dojazd / wysyłka, usługi zewnętrzne i opcjonalna opieka.',
    'To wstępny dobór zakresu, nie wiążąca oferta. Funkcje i zakres prac wymagają potwierdzenia.',
    `Formularz: ${inquiry.service} v${inquiry.formVersion}; cennik: ${inquiry.pricing.priceListVersion || 'brak zatwierdzonej wersji'}; informacja o danych: ${inquiry.dataNoticeVersion}.`);
  return lines.join('\n');
}

// Ostrożny limit transportu mailto, nie limit zapytania. Treści nigdy nie ucinamy.
export function emailDraft(text, maxUriLength = 8000) {
  let uri;
  try {
    uri = `mailto:${CONTACT.email}?subject=${encodeURIComponent('Zapytanie Smart Home & Energy — AMPOWER')}&body=${encodeURIComponent(text)}`;
  } catch (error) {
    // Niepoprawna para UTF-16 może wystąpić w tekście wklejonym do pola.
    // Zachowujemy cały podgląd i schowek zamiast przerywać przygotowanie.
    if (error instanceof URIError) return { uri: null, tooLong: false };
    throw error;
  }
  return { uri: uri.length <= maxUriLength ? uri : null, tooLong: uri.length > maxUriLength };
}

// Kontrakt nowego odbiornika. Stary generator szkicu zachowuje minimalny kontakt.
export function validateSubmission(raw) {
  const errors = validate({ ...raw, channel: 'email' });
  if (!clean(raw.name)) errors.push({ field: 'name', message: 'Podaj imię.' });
  if (!clean(raw.locality)) errors.push({ field: 'locality', message: 'Podaj miejscowość realizacji.' });
  if (!['local', 'remote', 'unknown'].includes(raw.delivery)) errors.push({ field: 'delivery', message: 'Wybierz sposób realizacji.' });
  if (clean(raw.phone)) errors.push(...validate({ ...raw, channel: 'phone' }).filter(e => e.field === 'phone'));
  if (raw.dataNoticeAccepted !== true) errors.push({ field: 'dataNoticeAccepted', message: 'Potwierdź zapoznanie się z informacją o danych.' });
  for (const key of ['simpleScenes', 'advancedScenes']) if (raw[key] && !/^(0|[1-9]\d{0,2})$/.test(String(raw[key]))) errors.push({ field: key, message: 'Podaj pełną liczbę automatyzacji od 0 do 999 albo pozostaw pole puste.' });
  return errors;
}
export function submissionData(raw) {
  const inquiry = buildInquiry({ ...raw, channel: 'email' });
  // Jawna lista dozwolonych danych; żadnych kosztów ani cen zadeklarowanych przez klienta.
  return { categories: inquiry.categories.map(c => c.id), details: Object.fromEntries(inquiry.categories.map(c => [c.id, c.answers])), goals: inquiry.goals,
    delivery: inquiry.delivery, access: inquiry.access, host: inquiry.host, hostModel: inquiry.hostModel, locality: clean(raw.locality), remoteReady: inquiry.remoteReady,
    name: clean(raw.name), email: clean(raw.email), phone: clean(raw.phone) || null, notes: inquiry.notes,
    radioChoice: raw.radioChoice, infrastructure: raw.infrastructure, complexity: raw.complexity, simpleScenes: raw.simpleScenes, advancedScenes: raw.advancedScenes, support: raw.support,
    channel: 'email', dataNoticeAccepted: raw.dataNoticeAccepted === true };
}
