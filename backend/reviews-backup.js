// Spójna kopia SQLite z WAL. Uruchomienie CLI nie wysyła danych do sieci.
import {DatabaseSync} from 'node:sqlite';
import {mkdirSync,lstatSync,openSync,closeSync,constants,readSync,fstatSync,writeFileSync,realpathSync} from 'node:fs';
import {resolve,relative,join,dirname,basename} from 'node:path';
import {pathToFileURL,fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';

export function backupReviews(source,destination) {
  source=realpathSync(source);destination=resolve(destination);
  destination=join(realpathSync(dirname(destination)),basename(destination));
  const root=realpathSync(fileURLToPath(new URL('..',import.meta.url)));
  const outside=(base,path)=>{const r=relative(base,path);return r==='..'||r.startsWith('../');};
  if(!outside(root,source)||!outside(root,destination)||!outside(source,destination)) throw new Error('Backup i baza muszą być poza repozytorium; backup poza źródłem.');
  mkdirSync(destination,{mode:0o700});
  const dir=lstatSync(destination);
  if(!dir.isDirectory()||dir.isSymbolicLink()||dir.mode&0o077||realpathSync(destination)!==destination) throw new Error('Backup wymaga prywatnego katalogu bez symlinków.');
  const sourceFile=join(source,'reviews.sqlite'),stat=lstatSync(sourceFile);
  if(!stat.isFile()||stat.isSymbolicLink()||stat.mode&0o077) throw new Error('Nieprawidłowy plik źródłowy.');
  const file=join(destination,'reviews.sqlite');
  const fd=openSync(file,constants.O_CREAT|constants.O_EXCL|constants.O_WRONLY|constants.O_NOFOLLOW,0o600);closeSync(fd);
  const db=new DatabaseSync(sourceFile,{readOnly:true});
  try {db.exec('PRAGMA busy_timeout=5000');db.prepare('VACUUM INTO ?').run(file);} finally {db.close();}
  const check=new DatabaseSync(file,{readOnly:true});
  try {if(check.prepare('PRAGMA integrity_check').get().integrity_check!=='ok') throw new Error('Nie potwierdzono integralności kopii.');check.prepare('SELECT id FROM reviews LIMIT 1').get();} finally {check.close();}
  const digest=createHash('sha256'),buffer=Buffer.alloc(65536),input=openSync(file,constants.O_RDONLY|constants.O_NOFOLLOW);
  let size;
  try {size=fstatSync(input).size;let read;while((read=readSync(input,buffer,0,buffer.length,null))>0)digest.update(buffer.subarray(0,read));} finally {closeSync(input);}
  const manifest={createdAt:new Date().toISOString(),file:'reviews.sqlite',bytes:size,sha256:digest.digest('hex'),integrity:'ok'};
  writeFileSync(join(destination,'manifest.json'),JSON.stringify(manifest,null,2),{mode:0o600,flag:'wx'});
  return manifest;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href) {
  if(!process.env.AMPOWER_REVIEWS_DATA_DIR||!process.argv[2]) throw new Error('Podaj AMPOWER_REVIEWS_DATA_DIR i nowy prywatny katalog docelowy.');
  const result=backupReviews(process.env.AMPOWER_REVIEWS_DATA_DIR,process.argv[2]);
  console.log(`Kopia opinii: integralność ${result.integrity}, ${result.bytes} bajtów. Zawiera dane osobowe; szyfrowanie i retencja kopii wymagają konfiguracji na hostingu.`);
}
