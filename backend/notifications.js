// Prototyp outbox. Uruchamiany wyłącznie przez operatora; domyślnie bez wysyłki.
import { pathToFileURL } from 'node:url';
import { FileStore } from './store.js';
import { homedir } from 'node:os';
import { join } from 'node:path';
export async function processNotifications(store, send, now = new Date()) {
  if (typeof send !== 'function') throw new Error('Brak zatwierdzonego dostawcy');
  return store.transaction(async () => {
    const results = [];
    for (const record of await store.records()) {
      if (record.demo || record.notification.status === 'demo-disabled') continue;
      if (['provider-accepted', 'reconcile-needed'].includes(record.notification.status)) continue;
      if (record.notification.firstAttemptAt && +now - Date.parse(record.notification.firstAttemptAt) >= 23 * 3600000) {
        record.notification.status = 'reconcile-needed';
        await store.put(record.storageKey, record);
        results.push({ id:record.receipt.inquiryId, status:'reconcile-needed' });
        continue;
      }
      record.notification.firstAttemptAt ||= now.toISOString();
      record.notification.attempts++;
      // Stały odbiorca; treść jako text, bez danych w temacie poza UUID.
      const message = { to:'kuba@ampower.pl', subject:`AMPOWER — zapytanie ${record.receipt.inquiryId}`, text:JSON.stringify({ id:record.receipt.inquiryId, configuration:record.data, internalCalculation:record.internalCalculation }, null, 2), key:`inquiry-${record.receipt.inquiryId}` };
      record.notification.status = 'sending';
      await store.put(record.storageKey, record); // Ślad przed zewnętrzną operacją, także przy awarii procesu.
      try {
        const receipt = await send(message);
        if (!receipt?.id) throw new Error('Brak potwierdzenia dostawcy');
        record.notification.status = 'provider-accepted';
        record.notification.providerId = receipt.id;
        record.notification.error = null;
      } catch { record.notification.status = 'retry-needed'; record.notification.error = 'Nie potwierdzono odbioru przez dostawcę'; }
      await store.put(record.storageKey, record);
      results.push({ id:record.receipt.inquiryId, status:record.notification.status });
    }
    return results;
  });
}
export async function resendNotification(message, { apiKey, from }, transport = fetch) {
  if (!apiKey || !from || message.to !== 'kuba@ampower.pl') throw new Error('Brak zatwierdzonej konfiguracji poczty');
  const response = await transport('https://api.resend.com/emails', { method:'POST', headers:{ Authorization:`Bearer ${apiKey}`, 'Content-Type':'application/json', 'Idempotency-Key':message.key },
    body:JSON.stringify({ from, to:[message.to], subject:message.subject, text:message.text }), signal:AbortSignal.timeout(10000) });
  if (!response.ok) throw new Error('Dostawca odrzucił powiadomienie');
  return response.json();
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  if (process.env.AMPOWER_OWNER_NOTIFICATIONS_APPROVED !== 'yes') throw new Error('Powiadomienia wyłączone. Aktywacja dopiero po zatwierdzeniu dostawcy i odbioru przez właściciela.');
  const store = new FileStore(process.env.AMPOWER_DATA_DIR || join(homedir(), '.local/share/ampower-sales'));
  console.log(await processNotifications(store, m => resendNotification(m, { apiKey:process.env.AMPOWER_RESEND_KEY, from:process.env.AMPOWER_MAIL_FROM })));
}
