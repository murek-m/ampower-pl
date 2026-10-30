import { INQUIRY_CONFIG } from './inquiry-config.js?v=bf385106e3511744';
import { sendInquiry, configureChallenge } from './inquiry-client.js?v=bf385106e3511744';
import { CATEGORIES, DELIVERY, GOALS, PRICE_POLICY, PROJECT_FIELDS } from './data.js?v=bf385106e3511744';
import { buildInquiry, emailDraft, evaluate, fieldsFor, inquiryText, projectLines, validate, validateSubmission } from './model.js?v=bf385106e3511744';

const $ = id => document.getElementById(id);
const form = $('smart-form');
const panels = new Map();
const fieldNodes = new Map();
const previousControls = new Map();
let preparedText = '';
let submitted = false;
let draftRevision = 0;

function element(tag, text, props = {}) {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = text;
  Object.assign(node, props);
  return node;
}
function value(name) { return form.elements.namedItem(name)?.value ?? ''; }
function read() {
  const details = {};
  for (const c of CATEGORIES) {
    details[c.id] = {};
    for (const field of panels.get(c.id).querySelectorAll('[data-answer]')) details[c.id][field.dataset.answer] = field.value;
  }
  return {
    categories: [...form.querySelectorAll('[name="category"]:checked')].map(n => n.value),
    goals: [...form.querySelectorAll('[name="goal"]:checked')].map(n => n.value), details,
    delivery: value('delivery'), access: value('access'), host: value('host'), hostModel: value('hostModel'),
    locality: value('locality'), remoteReady: value('remoteReady'), channel: value('channel'),
    email: value('email'), phone: value('phone'), name: value('name'), notes: value('notes'),
    radioChoice: value('radioChoice'), infrastructure: value('infrastructure'), complexity: value('complexity'), simpleScenes: value('simpleScenes'), advancedScenes: value('advancedScenes'), support: value('support'),
    website: value('website'), dataNoticeAccepted: $('dataNoticeAccepted').checked
  };
}
function makeField(category, f) {
  const id = `${category.id}-${f.key}`;
  const wrap = element('div', undefined, { className: 'field' });
  const label = element('label', f.label, { htmlFor: id });
  const input = element(f.type === 'select' ? 'select' : f.type === 'textarea' ? 'textarea' : 'input', undefined, { id, name: id });
  input.dataset.answer = f.key;
  if (f.options) {
    for (const [key, text] of Object.entries(f.options)) input.append(element('option', text, { value: key }));
  } else if (f.type === 'count') {
    input.type = 'text';
    input.inputMode = 'numeric';
    input.maxLength = 12; // Zachowuje błędny wpis do walidacji, bez zaokrąglania.
  } else {
    if (input.tagName === 'INPUT') input.type = 'text';
    input.maxLength = f.max;
  }
  const help = element('p', f.type === 'count' ? 'Od 1 do 999. Puste pole oznacza „Nie wiem”.' : 'Opcjonalnie. Brak tych danych nie blokuje zapytania.', { id: `${id}-help`, className: 'help' });
  const error = element('p', '', { id: `${id}-error`, className: 'field-error', hidden: true });
  input.setAttribute('aria-describedby', `${help.id} ${error.id}`);
  wrap.append(label, input);
  if (f.type === 'count') {
    const reset = element('button', 'Nie wiem', { type: 'button', className: 'unknown-button' });
    reset.setAttribute('aria-label', `Nie wiem: ${f.label}`);
    reset.addEventListener('click', () => { input.value = ''; update(); input.focus(); });
    wrap.append(reset);
  }
  wrap.append(help, error);
  fieldNodes.set(id, { wrap, input, label });
  return wrap;
}
function setupPanels() {
  for (const c of CATEGORIES) {
    const panel = element('details', undefined, { hidden: true, id: `details-${c.id}`, className: 'device-details' });
    panel.append(element('summary', `${c.label}: szczegóły — opcjonalnie`));
    const content = element('div', undefined, { className: 'details-content' });
    content.append(element('p', c.help || 'Ustalimy podczas rozmowy. Nie musisz znać danych technicznych.', { className: 'help' }));
    const pool = new Map();
    const variants = [{}, { scope: 'both', control: 'central', connection: 'other', hasLogger: 'yes' }, { control: 'mixed' }, { control: 'perDrive' }, { control: 'separate' }];
    for (const variant of variants) for (const f of fieldsFor(c, variant, ['pv'])) pool.set(f.key, f);
    for (const f of pool.values()) content.append(makeField(c, f));
    panel.append(content);
    $('device-details').append(panel);
    panels.set(c.id, panel);
  }
}
function showGroup(id, visible) {
  const group = $(id);
  group.hidden = !visible;
  for (const input of group.querySelectorAll('input, select, textarea, button')) input.disabled = !visible;
}
function syncPanels(raw) {
  for (const c of CATEGORIES) {
    const active = raw.categories.includes(c.id);
    const panel = panels.get(c.id);
    panel.hidden = !active;
    // Model wspólnej centrali nie opisuje osobnych modułów i odwrotnie.
    // Zmiana drogi integracji wymaga ponownego podania modelu sterowania.
    const mode = raw.details[c.id].control;
    if (previousControls.has(c.id) && previousControls.get(c.id) !== mode) {
      const controller = fieldNodes.get(`${c.id}-controller`);
      if (controller) controller.input.value = raw.details[c.id].controller = '';
    }
    previousControls.set(c.id, mode);
    const fields = new Map(fieldsFor(c, raw.details[c.id], raw.categories).map(f => [f.key, f]));
    for (const input of panel.querySelectorAll('[data-answer]')) {
      const entry = fieldNodes.get(input.id);
      const f = fields.get(input.dataset.answer);
      entry.wrap.hidden = !active || !f;
      for (const control of entry.wrap.querySelectorAll('input, select, textarea, button')) control.disabled = !active || !f;
      if (f) entry.label.textContent = f.label;
    }
  }
  showGroup('locality-group', true);
  showGroup('remote-group', raw.delivery === 'remote');
  showGroup('host-model-group', raw.host === 'owned');
  showGroup('email-group', INQUIRY_CONFIG.enabled || raw.channel !== 'phone');
  showGroup('phone-group', INQUIRY_CONFIG.enabled || raw.channel === 'phone');
  const emailRequired = INQUIRY_CONFIG.enabled || raw.channel !== 'phone';
  $('email').required = emailRequired;
  $('phone').required = raw.channel === 'phone';
  document.querySelector('label[for="email"]').textContent = emailRequired ? 'Adres e-mail — wymagany' : 'Adres e-mail — opcjonalnie';
  document.querySelector('label[for="phone"]').textContent = raw.channel === 'phone' ? 'Numer telefonu — wymagany' : 'Numer telefonu — opcjonalnie';
}
function renderSummary(raw) {
  const result = evaluate(raw);
  const list = $('summary-categories');
  list.replaceChildren();
  for (const c of CATEGORIES.filter(c => raw.categories.includes(c.id))) {
    const d = raw.details[c.id];
    const descriptions = fieldsFor(c, d, raw.categories).filter(f => {
      const v = d[f.key];
      return v && v !== 'unknown';
    }).map(f => `${f.label}: ${f.options ? f.options[d[f.key]] : d[f.key]}`);
    list.append(element('li', `${c.label} — ${descriptions.length ? descriptions.join('; ') : 'Ustalimy podczas rozmowy'}`));
  }
  $('summary-goals').textContent = raw.goals.map(id => GOALS[id]).join(' ') || 'Wybierz cel integracji.';
  $('summary-delivery').textContent = DELIVERY[raw.delivery];
  $('summary-project').replaceChildren(...projectLines(raw).map(line => element('li', line)));
  $('price-title').textContent = result.status === 'individual' ? 'Wymaga indywidualnej wyceny' : result.title;
  $('price-reason').textContent = result.reason;
  const componentList = $('cost-components');
  componentList.replaceChildren();
  for (const [index, [title, copy]] of PRICE_POLICY.components.entries()) {
    const row = element('div');
    const group = ['hardware', 'installation', 'configuration'][index];
    const entries = result.lines?.filter(l => l.group === group) || [];
    const sums = [0, 1].map(i => entries.reduce((n, l) => n + l.grossCents[i], 0) / 100);
    const formatted = n => new Intl.NumberFormat('pl-PL', { maximumFractionDigits: 0 }).format(n);
    const amount = result.status === 'estimated' ? entries.length ? `Orientacyjnie ${formatted(sums[0])} – ${formatted(sums[1])} zł brutto. ${copy}` : 'Nie dostarczamy / nie wykonujemy w tym wariancie.' : copy;
    row.append(element('dt', title), element('dd', amount)); componentList.append(row);
  }
  if (result.status === 'estimated' && result.lines.some(l => l.group === 'travel')) {
    const row = element('div'); row.append(element('dt', 'Transport'), element('dd', 'Dojazd lub wysyłka ujęte w przedziale.'));
    componentList.append(row);
  }
  $('qualification-notes').replaceChildren(...result.messages.map(m => element('p', m)));
  $('shared-system').hidden = !(raw.categories.includes('pv') && raw.categories.includes('storage') && raw.details.storage.sharedPv === 'yes');
  // Tylko krótki status na żywo; lista nie jest odczytywana przy każdym znaku.
  const announcement = `Wybrane kategorie: ${raw.categories.length}. ${result.title}`;
  if ($('selection-status').textContent !== announcement) $('selection-status').textContent = announcement;
}
function clearErrors() {
  for (const input of form.querySelectorAll('[aria-invalid]')) input.removeAttribute('aria-invalid');
  for (const node of form.querySelectorAll('.field-error')) { node.hidden = true; node.textContent = ''; }
  $('error-list').replaceChildren();
  $('error-summary').hidden = true;
}
function renderErrors(errors, focus = false) {
  clearErrors();
  if (!errors.length) return;
  $('error-summary').hidden = false;
  for (const { field, message } of errors) {
    const target = $(field);
    const error = $(`${field}-error`);
    if (target) target.setAttribute('aria-invalid', 'true');
    if (error) { error.textContent = message; error.hidden = false; }
    const li = element('li');
    const link = element('button', message, { type: 'button', className: 'error-link' });
    if(target)link.setAttribute('aria-controls',field);
    link.addEventListener('click', event => {
      event.preventDefault();
      const details = target?.closest('details');
      if (details) details.open = true;
      (target?.matches('fieldset') ? target.querySelector('input') : target)?.focus();
    });
    li.append(link);
    $('error-list').append(li);
  }
  if (focus) $('error-summary').focus();
}
function update() {
  draftRevision++;
  const raw = read();
  syncPanels(raw);
  renderSummary(raw);
  if (submitted) renderErrors(validate(raw));
  if (preparedText) {
    preparedText = '';
    $('message-preview').value = '';
    $('draft-panel').hidden = true;
    $('open-email').removeAttribute('href');
    $('action-status').textContent = 'Zmieniono konfigurację. Przygotuj aktualną wiadomość.';
  }
}
function prepare() {
  submitted = true;
  const raw = read();
  const errors = validate(raw);
  renderErrors(errors, true);
  if (errors.length) return false;
  preparedText = inquiryText(buildInquiry(raw));
  const draft = emailDraft(preparedText);
  $('message-preview').value = preparedText;
  $('draft-panel').hidden = false;
  $('open-email').hidden = !draft.uri;
  if (draft.uri) $('open-email').href = draft.uri;
  else $('open-email').removeAttribute('href');
  $('long-message').hidden = Boolean(draft.uri);
  $('long-message').textContent = draft.tooLong
    ? 'Pełna konfiguracja jest zbyt długa dla linku e-mail. Skopiuj poniższy tekst i wklej go do wiadomości na kuba@ampower.pl.'
    : 'Tej treści nie można otworzyć linkiem e-mail. Skopiuj poniższy tekst i wklej go do wiadomości na kuba@ampower.pl.';
  $('action-status').textContent = !draft.uri
    ? 'Przygotowano pełną treść. Skopiuj ją i wyślij na kuba@ampower.pl; strona nie potwierdza wysłania.'
    : 'Przygotowano wiadomość. Otwórz ją i wyślij w swojej aplikacji pocztowej; strona nie potwierdza wysłania.';
  return true;
}
setupPanels();
for (const field of PROJECT_FIELDS) {
  document.querySelector(`label[for="${field.key}"]`).textContent = field.label;
  if (field.options) $(field.key).replaceChildren(...Object.entries(field.options).map(([value, label]) => element('option', label, { value })));
}
for (const [title, copy] of PRICE_POLICY.components) {
  const row = element('div');
  row.append(element('dt', title), element('dd', copy));
  $('cost-components').append(row);
}
form.addEventListener('input', update);
form.addEventListener('change', event => { if (event.target.matches('select,input[type=checkbox],input[type=radio]')) update(); });
let sending = false;
form.addEventListener('submit', async event => {
  event.preventDefault();
  if (!INQUIRY_CONFIG.enabled) { if (prepare()) $('draft-panel').focus(); return; }
  if (sending) return;
  const raw = read();
  const errors = validateSubmission(raw);
  renderErrors(errors, true);
  if (errors.length) return;
  sending = true;
  $('send-inquiry').disabled = true;
  $('action-status').textContent = 'Przekazujemy zapytanie. Poczekaj na numer zgłoszenia.';
  try {
    const receipt = await sendInquiry(raw, INQUIRY_CONFIG);
    $('action-status').textContent = `Przyjęto zapytanie. Numer: ${receipt.inquiryId}. Oferta zostanie przygotowana po sprawdzeniu konfiguracji i zatwierdzeniu przez właściciela AMPOWER.`;
  } catch (error) { $('action-status').textContent = error.message; }
  finally { sending = false; $('send-inquiry').disabled = false; }
});
$('preview-config').addEventListener('click', () => { if (prepare()) $('draft-panel').focus(); });
configureChallenge(INQUIRY_CONFIG, $('spam-challenge')).catch(() => { $('inquiry-availability').textContent = 'Ochrona formularza jest niedostępna. Spróbuj później lub zadzwoń.'; });
$('send-inquiry').hidden = !INQUIRY_CONFIG.enabled;
$('dataNoticeAccepted').closest('label').hidden = !INQUIRY_CONFIG.enabled;
if (INQUIRY_CONFIG.enabled) {
  $('inquiry-availability').textContent = 'Zapytanie prześlemy bez otwierania programu pocztowego. Po przyjęciu otrzymasz numer zgłoszenia.';
  document.querySelector('label[for="name"]').textContent = 'Imię — wymagane';
  document.querySelector('label[for="locality"]').textContent = 'Miejscowość realizacji — wymagana';
  $('submission-privacy').textContent = 'Dane przekażemy do AMPOWER po kliknięciu Wyślij zapytanie. Potwierdzenie oznacza zapis z numerem zgłoszenia, a nie wysłanie oferty.';
  $('privacy-state').textContent = 'Formularz przekazuje dane do odbiornika zapytań. Podgląd i kopiowanie nie wysyłają danych.';
}

$('copy-config').addEventListener('click', async () => {
  if (!preparedText && !prepare()) return;
  const text = preparedText;
  const revision = draftRevision;
  const button = $('copy-config');
  button.disabled = true;
  try {
    await navigator.clipboard.writeText(text);
    $('action-status').textContent = revision === draftRevision
      ? 'Konfiguracja skopiowana. Wklej ją do swojej wiadomości.'
      : 'Skopiowano wcześniejszą wersję. Zmieniono konfigurację — przygotuj i skopiuj aktualną wiadomość.';
  } catch {
    if (revision !== draftRevision) {
      $('action-status').textContent = 'Nie skopiowano konfiguracji. Przygotuj aktualną wiadomość i spróbuj ponownie.';
      return;
    }
    $('action-status').textContent = 'Nie udało się skopiować tekstu. Zaznacz podsumowanie i skopiuj je ręcznie.';
    $('message-preview').focus();
    $('message-preview').select();
  } finally { button.disabled = false; }
});
update();
form.hidden = false;
$('config-fallback').hidden = true;
