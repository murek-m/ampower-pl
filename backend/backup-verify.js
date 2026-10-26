import { pathToFileURL } from 'node:url';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { readdir } from 'node:fs/promises';
import { FileStore } from './store.js';
export async function verifyBackup(directory){
 const store=new FileStore(directory);await store.init();const manifest=await store.readPrivate(join(store.directory,'manifest.json'));
 if(!manifest.files || typeof manifest.files!=='object'||Array.isArray(manifest.files))throw new Error('Nieprawidłowy manifest');
 const names=Object.keys(manifest.files);
 for(const name of names){if(!/^(?:[a-f0-9]{64}\.json|pdf-[a-f0-9]{64}-[a-f0-9]{64}\.pdf)$/.test(name)||!/^[a-f0-9]{64}$/.test(manifest.files[name]))throw new Error('Nieprawidłowy wpis manifestu');const bytes=await store.readPrivateBytes(join(store.directory,name));if(createHash('sha256').update(bytes).digest('hex')!==manifest.files[name])throw new Error('Integralność kopii niepotwierdzona');}
 const actual=(await readdir(store.directory)).filter(n=>/\.json$|\.pdf$/.test(n)&&n!=='manifest.json');if(actual.length!==names.length||actual.some(n=>!names.includes(n)))throw new Error('Pliki kopii nie odpowiadają manifestowi');
 return {verified:true,files:names.length};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){if(!process.argv[2])throw new Error('Podaj prywatny katalog kopii');console.log(JSON.stringify(await verifyBackup(process.argv[2])));}
