// Prototyp outbox. Uruchamiany wyłącznie przez operatora; domyślnie bez wysyłki.
import { randomUUID } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { FileStore } from './store.js';
import { homedir } from 'node:os';
import { join } from 'node:path';
const finalStates = new Set(['provider-accepted','delivered','bounced','complained','reconcile-needed']);
export async function processNotifications(store, send, now = new Date(), {retryBaseMs=60000,leaseMs=30000,maxAttempts=8} = {}) {
  if (typeof send !== 'function') throw new Error('Brak zatwierdzonego dostawcy');
  const results = [];
  for (const candidate of await store.records()) {
    const claim = await store.transaction(async () => {
      const record = await store.get(candidate.storageKey);
      if (!record || record.deleted || record.demo || !record.notification || record.notification.status === 'demo-disabled') return null;
      const n = record.notification;
      if (finalStates.has(n.status) || Date.parse(n.nextAttemptAt) > +now || n.status === 'sending' && Date.parse(n.leaseUntil) > +now) return null;
      if (n.firstAttemptAt && +now - Date.parse(n.firstAttemptAt) >= 23 * 3600000 || n.attempts >= maxAttempts) {
        n.status = 'reconcile-needed';await store.put(record.storageKey,record);
        results.push({id:record.receipt.inquiryId,status:n.status});return null;
      }
      n.firstAttemptAt ||= now.toISOString();n.attempts++;
      n.status='sending';n.leaseToken=randomUUID();n.leaseUntil=new Date(+now+leaseMs).toISOString();
      await store.put(record.storageKey,record);
      return {storageKey:record.storageKey,token:n.leaseToken,id:record.receipt.inquiryId,message:{to:'kuba@ampower.pl',subject:`AMPOWER — zapytanie ${record.receipt.inquiryId}`,text:JSON.stringify({id:record.receipt.inquiryId,configuration:record.data,internalCalculation:record.internalCalculation},null,2),key:`inquiry-${record.receipt.inquiryId}`}};
    });
    if (!claim) continue;
    // The provider runs outside the storage lock. All retries retain its idempotency key.
    let receipt;
    try { receipt=await send(claim.message); if (!receipt?.id) throw new Error('Brak potwierdzenia dostawcy'); } catch { receipt=null; }
    await store.transaction(async () => {
      const record=await store.get(claim.storageKey);
      if (!record || record.deleted || record.notification.leaseToken !== claim.token) return;
      const n=record.notification;
      delete n.leaseUntil;delete n.leaseToken;
      if (receipt) {n.status='provider-accepted';n.providerId=receipt.id;n.error=null;delete n.nextAttemptAt;}
      else {n.status='retry-needed';n.error='Nie potwierdzono odbioru przez dostawcę';n.nextAttemptAt=new Date(+now+Math.min(3600000,retryBaseMs*2**(n.attempts-1))).toISOString();}
      await store.put(record.storageKey,record);results.push({id:claim.id,status:n.status});
    });
  }
  return results;
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
