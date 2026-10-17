// Dostęp lokalny: uprawnienia konta systemowego, bez publicznego panelu administracyjnego.
import { readFile, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { FileStore } from './store.js';
import { reviseOffer, approveOffer, customerOffer } from './offers.js';
const store = new FileStore(process.env.AMPOWER_DATA_DIR || join(homedir(), '.local/share/ampower-sales'));
const [command, id, fileOrRevision] = process.argv.slice(2);
const actor = process.env.AMPOWER_OWNER_NAME || 'właściciel AMPOWER (konto lokalne)';
if (command === 'list') {
  console.log(JSON.stringify((await store.records()).map(r => ({ id:r.receipt.inquiryId, receivedAt:r.receipt.receivedAt, notification:r.notification.status, offer:r.offer?.state || 'none' })), null, 2));
} else if (command === 'inspect' || command === 'draft') {
  const record = await store.find(id);
  if (!record) throw new Error('Nie znaleziono zgłoszenia');
  if (command === 'inspect') console.log(JSON.stringify(record, null, 2));
  else if (fileOrRevision) { await writeFile(fileOrRevision, JSON.stringify(record.offer?.quote || record.internalDraft, null, 2), { flag:'wx', mode:0o600 }); console.log('Zapisano prywatny kosztorys do edycji.'); }
  else throw new Error('draft wymaga ścieżki prywatnego pliku');
} else if (['revise','approve','export','preview'].includes(command)) {
  await store.transaction(async () => {
    const record = await store.find(id);
    if (!record) throw new Error('Nie znaleziono zgłoszenia');
    if (command === 'revise') {
      const quote = JSON.parse(await readFile(fileOrRevision, 'utf8'));
      const next = reviseOffer(record, quote, actor);
      await store.put(record.storageKey, next);
      console.log(`Wersja ${next.offer.revision}, stan draft, kalkulacja ${next.offer.calculation.status}.`);
    } else if (command === 'approve') {
      const next = approveOffer(record, Number(fileOrRevision), actor);
      await store.put(record.storageKey, next);
      console.log(`Zatwierdzono wersję ${next.offer.revision}. Nie wysłano oferty.`);
    } else {
      if (!fileOrRevision) throw new Error('Wymagana ścieżka prywatnego eksportu JSON');
      const safe = customerOffer(record, command === 'preview');
      await writeFile(fileOrRevision, JSON.stringify(safe, null, 2), { flag:'wx', mode:0o600 });
      console.log(`Eksport ${safe.state}. Bez wysyłki.`);
    }
  });
} else throw new Error('Polecenia: list | inspect ID | draft ID PLIK | revise ID PLIK | approve ID WERSJA | preview ID PLIK | export ID PLIK');
