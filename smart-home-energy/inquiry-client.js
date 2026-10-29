import { submissionData } from './model.js?v=02a1af088937a42d';
let previousPayload = '';
let requestId = null;
let widgetId;
const local = url => ['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname);
export function endpointFor(config) {
  if (!config.enabled || !config.endpoint || !config.dataNoticeVersion) throw new Error('Wysyłanie zapytań nie jest jeszcze uruchomione. Skopiuj konfigurację lub zadzwoń do AMPOWER.');
  const url = new URL(config.endpoint);
  if (url.protocol !== 'https:' && !(url.protocol === 'http:' && local(url))) throw new Error('Odbiornik zapytań wymaga bezpiecznego połączenia.');
  if (url.username || url.password || url.search || url.hash) throw new Error('Nieprawidłowa konfiguracja odbiornika.');
  return url.href;
}
export async function configureChallenge(config, container) {
  if (!config.enabled || !config.turnstileSiteKey) return;
  endpointFor(config);
  await new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    script.onload = resolve; script.onerror = reject;
    document.head.append(script);
  });
  widgetId = window.turnstile.render(container, { sitekey: config.turnstileSiteKey, action: 'inquiry' });
}
export async function sendInquiry(raw, config, transport = fetch) {
  const endpoint = endpointFor(config);
  const data = submissionData(raw);
  const payload = JSON.stringify({ data, dataNoticeVersion: config.dataNoticeVersion });
  if (payload !== previousPayload) { previousPayload = payload; requestId = crypto.randomUUID(); }
  const token = config.turnstileSiteKey ? window.turnstile?.getResponse(widgetId) : '';
  if (config.turnstileSiteKey && !token) throw new Error('Dokończ weryfikację antyspamową i spróbuj ponownie.');
  try {
    const response = await transport(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Idempotency-Key': requestId }, credentials: 'omit', referrerPolicy: 'no-referrer',
      body: JSON.stringify({ data, dataNoticeVersion: config.dataNoticeVersion, website: raw.website || '', token }), signal: AbortSignal.timeout(15000) });
    const receipt = await response.json().catch(() => null);
    if (!response.ok) throw new Error(response.status === 429 ? 'Zbyt wiele prób. Poczekaj i spróbuj ponownie.' : 'Odbiornik nie przyjął zapytania. Sprawdź dane i spróbuj ponownie.');
    if (receipt?.accepted !== true || !/^AMP-[0-9a-f-]{36}$/.test(receipt.inquiryId || '') || !Number.isFinite(Date.parse(receipt.receivedAt))) throw new Error('Nie udało się potwierdzić odbioru. Ponów wysłanie tej samej konfiguracji; system zachowa ten sam numer.');
    return receipt;
  } catch (error) {
    if (error.name === 'TimeoutError' || error.name === 'AbortError' || error instanceof TypeError) throw new Error('Nie udało się potwierdzić odbioru. Sprawdź połączenie i ponów wysłanie tej samej konfiguracji.');
    throw error;
  } finally { if (config.turnstileSiteKey && window.turnstile && widgetId !== undefined) window.turnstile.reset(widgetId); }
}
