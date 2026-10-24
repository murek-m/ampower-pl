import {mkdir,copyFile,rm,lstat} from 'node:fs/promises';
const root=new URL('../',import.meta.url);
const output=new URL('output/pv-mining-preview/',root);
const files=['index.html','simple.html','advanced.html','style.css','app.js','engine.js','worker.js','data/market.json','data/models.json','data/profile.json'];
await rm(output,{recursive:true,force:true});await mkdir(output,{recursive:true});
for(const file of files) {
  const source=new URL(`pv-mining/${file}`,root),target=new URL(file,output);
  if(!(await lstat(source)).isFile())throw new Error(`Nieprawidłowy plik ${file}`);
  await mkdir(new URL('./',target),{recursive:true});await copyFile(source,target);
}
for(const file of ['fonts.css','archivo-1.woff2','archivo-2.woff2','ibm-plex-sans-3.woff2','ibm-plex-sans-4.woff2','ibm-plex-mono-5.woff2','ibm-plex-mono-6.woff2']) {
  await mkdir(new URL('fonts/',output),{recursive:true});
  await copyFile(new URL(`smart-home-energy/fonts/${file}`,root),new URL(`fonts/${file}`,output));
}
console.log('Lokalny prototyp: output/pv-mining-preview/. Bez publikacji; bez źródeł backendu i dokumentacji.');
