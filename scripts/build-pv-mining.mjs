import {mkdir,copyFile,rm,lstat,readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {decodeProfile} from '../pv-mining/data-loader.js';
const root=new URL('../',import.meta.url);
const output=new URL('output/pv-mining-preview/',root);
const files=['favicon.svg','index.html','simple.html','advanced.html','style.css','app.js','engine.js','worker.js','data-loader.js','charts.js','session.js','data/market.json','data/models.json','data/profile.json'];
const sources=new Map();
const hash=createHash('sha256');
for(const file of files){
  const source=new URL(file==='favicon.svg'?file:`pv-mining/${file}`,root);
  if(!(await lstat(source)).isFile())throw new Error(`Nieprawidłowy plik ${file}`);
  let bytes=await readFile(source);
  if(file==='data/profile.json'){
    const rows=JSON.parse(bytes),packed={format:'ampower-pv-hourly-v1',start:rows[0]?.[0],values:rows.map(row=>row[1])};
    // Fail before replacing the old artifact if any timestamp/value would change.
    assert.deepEqual(decodeProfile(packed),rows,'Profile compaction must be lossless');
    bytes=Buffer.from(JSON.stringify(packed));
  }
  sources.set(file,bytes);hash.update(file).update(bytes);
}
const version=hash.digest('hex').slice(0,16);
await rm(output,{recursive:true,force:true});await mkdir(output,{recursive:true});
for(const [file,bytes] of sources){
  const target=new URL(file,output);await mkdir(new URL('./',target),{recursive:true});
  // A new document must not mix a cached module/worker with the new release.
  const content=/\.(js|html)$/.test(file)?bytes.toString().replace(/(from\s*['"]|import\(\s*['"]|new URL\(['"]|(?:src|href)=["'])(\.\/[^'"]+\.(?:js|css))(["'])/g,`$1$2?v=${version}$3`):bytes;
  await writeFile(target,content);
}
for(const file of ['fonts.css','archivo-1.woff2','archivo-2.woff2','ibm-plex-sans-3.woff2','ibm-plex-sans-4.woff2','ibm-plex-mono-5.woff2','ibm-plex-mono-6.woff2']){
  await mkdir(new URL('fonts/',output),{recursive:true});
  await copyFile(new URL(`smart-home-energy/fonts/${file}`,root),new URL(`fonts/${file}`,output));
}
console.log(`Lokalny prototyp: output/pv-mining-preview/ (zasoby ${version}). Bez publikacji; bez źródeł backendu i dokumentacji.`);
