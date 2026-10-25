// Explicit operator command; importing this module never sends a message.
import { setTimeout as delay } from 'node:timers/promises';
import { pathToFileURL } from 'node:url';
import { join } from 'node:path';
import { homedir } from 'node:os';
import { FileStore } from './store.js';
import { processNotifications, resendNotification } from './notifications.js';
export async function runNotificationWorker({store,send,signal,intervalMs=15000,report=()=>{}}) {
  while (!signal.aborted) {
    try {report({ok:true,results:await processNotifications(store,send)});}
    catch {report({ok:false,error:'Nie udało się obsłużyć kolejki; wymagana kontrola magazynu.'});}
    try {await delay(intervalMs,undefined,{signal});} catch(error) {if(error.name !== 'AbortError')throw error;}
  }
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  if (process.env.AMPOWER_OWNER_NOTIFICATIONS_APPROVED !== 'yes' || !process.env.AMPOWER_RESEND_KEY || !process.env.AMPOWER_MAIL_FROM) throw new Error('Worker wymaga zatwierdzonej konfiguracji poczty.');
  const abort=new AbortController();for(const signal of ['SIGINT','SIGTERM'])process.once(signal,()=>abort.abort());
  await runNotificationWorker({store:new FileStore(process.env.AMPOWER_DATA_DIR || join(homedir(),'.local/share/ampower-sales')),send:m=>resendNotification(m,{apiKey:process.env.AMPOWER_RESEND_KEY,from:process.env.AMPOWER_MAIL_FROM}),signal:abort.signal,report:r=>console.log(JSON.stringify(r))});
}
