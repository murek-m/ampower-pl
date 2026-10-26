// Retention is opt-in: no default period and no unattended deletion of accepted work.
import { pathToFileURL,fileURLToPath } from 'node:url';
import { resolve,relative } from 'node:path';
import { realpath } from 'node:fs/promises';
import { FileStore } from './store.js';
function expired(record,cutoff) {return !record.offer && !record.offerHistory?.length && ['new','estimating',undefined].includes(record.status) && Date.parse(record.receipt.receivedAt)<cutoff;}
export async function retainInquiries(store,{days,apply=false,actor,now=new Date()}={}) {
  if(!Number.isInteger(days)||days<1||days>3650)throw new Error('Wymagany zatwierdzony okres retencji 1–3650 dni');
  if(apply && !actor?.trim())throw new Error('Usunięcie wymaga operatora');
  const cutoff=+now-days*86400000;
  return store.transaction(async()=>{
    const records=(await store.records()).filter(r=>expired(r,cutoff));
    if(apply)for(const record of records)await store.erase(record,actor,now);
    return {applied:apply,cutoff:new Date(cutoff).toISOString(),inquiryIds:records.map(r=>r.receipt.inquiryId),notice:'Dotyczy tylko zapytań bez ofert. Istniejące kopie zapasowe i pobrane eksporty wymagają odrębnej polityki.'};
  });
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const directory=process.env.AMPOWER_DATA_DIR;if(!directory)throw new Error('Podaj jawnie prywatny AMPOWER_DATA_DIR');
 const actual=await realpath(directory),root=resolve(fileURLToPath(new URL('..',import.meta.url))),outside=relative(root,actual);
 if(!(outside==='..'||outside.startsWith('../')))throw new Error('Magazyn musi być poza repozytorium');
 const apply=process.argv.includes('--apply');
 if(apply&&process.env.AMPOWER_RETENTION_APPROVED!=='yes')throw new Error('Najpierw zatwierdź politykę retencji i przejrzyj podgląd');
 console.log(JSON.stringify(await retainInquiries(new FileStore(actual),{days:Number(process.env.AMPOWER_RETENTION_DAYS),apply,actor:process.env.AMPOWER_RETENTION_ACTOR}),null,2));
}
