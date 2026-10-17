// Snapshot blokuje zapis w panelu i odbiorniku na czas kopiowania. Bez sieci.
import { homedir } from 'node:os';
import { join, resolve, relative } from 'node:path';
import { mkdir, readdir, readFile, writeFile, realpath } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { FileStore } from './store.js';
const root=resolve(fileURLToPath(new URL('..',import.meta.url)));
const source=resolve(process.env.AMPOWER_PANEL_DATA_DIR || join(homedir(),'.local/share/ampower-panel-demo'));
const destination=resolve(process.argv[2] || join(homedir(),'.local/share/ampower-panel-backups',new Date().toISOString().replace(/[:.]/g,'-')));
const store=new FileStore(source);await store.init();
await mkdir(destination,{recursive:true,mode:0o700});await new FileStore(destination).init();
for (const path of [source,destination]) {const r=relative(root,await realpath(path));if (!(r==='..' || r.startsWith('../'))) throw new Error('Dane i backup muszą być poza repozytorium');}
const sourceRelative=relative(source,destination);
if (!(sourceRelative==='..' || sourceRelative.startsWith('../'))) throw new Error('Backup musi być poza magazynem źródłowym');
await store.transaction(async()=>{
 const manifest={createdAt:new Date().toISOString(),source,files:{}};
 for(const name of (await readdir(source)).filter(n=>/^[a-f0-9]{64}\.json$/.test(n))){
  await store.readPrivate(join(source,name));const data=await readFile(join(source,name));await writeFile(join(destination,name),data,{mode:0o600,flag:'wx'});manifest.files[name]=createHash('sha256').update(data).digest('hex');
 }
 await writeFile(join(destination,'manifest.json'),JSON.stringify(manifest,null,2),{mode:0o600,flag:'wx'});
 console.log(`Prywatna kopia: ${destination}; plików: ${Object.keys(manifest.files).length}. Kopia nieszyfrowana, zawiera dane i historię; retencja osobno.`);
});
