import { readFile,readdir,lstat } from 'node:fs/promises';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const extracted=JSON.parse(await readFile('assets/public-assets.json','utf8'));
const smart=['index.html','style.css','menu.js','app.js','data.js','model.js','price-book.js','pricing.js','inquiry-config.js','inquiry-client.js','fonts/fonts.css','fonts/ibm-plex-mono-5.woff2','fonts/ibm-plex-mono-6.woff2','fonts/ibm-plex-sans-4.woff2','fonts/ibm-plex-sans-3.woff2','fonts/archivo-1.woff2','fonts/archivo-2.woff2'];
const expected=new Set(['index.html','favicon.svg','CNAME','.nojekyll','robots.txt','sitemap.xml','assets/smart-home-panel.png','assets/consent.css','assets/consent.js','assets/reviews.css','assets/reviews.js','assets/reviews-config.js','assets/reviews-qr.svg','prywatnosc/index.html',...extracted,...smart.map(p=>'smart-home-energy/'+p)]);
const actual=[];
async function visit(directory='dist',prefix='') {for(const name of await readdir(directory)){const path=directory+'/'+name,relative=prefix+name;const info=await lstat(path);assert.ok(!info.isSymbolicLink(),'Symlink w wydaniu');if(info.isDirectory())await visit(path,relative+'/');else {assert.ok(info.isFile());actual.push(relative);if(/\.(?:html|js|css|xml|txt)$/.test(name)){const source=await readFile(path,'utf8');assert.doesNotMatch(source,/purchaseNet|internalPolicy|unitCostNet|hourlyCostNet|profitAfterIncludedCosts|RESEND_KEY|TURNSTILE_SECRET|PRIVATE KEY|catalog\.seed/);}}}}
await visit();assert.deepEqual(actual.sort(),[...expected].sort());assert.equal((await readFile('dist/CNAME','utf8')).trim(),'ampower.pl');
for(const path of actual.filter(p=>p.endsWith('.html'))) {
 const html=await readFile('dist/'+path,'utf8');
 const policy=/<meta http-equiv="Content-Security-Policy" content="([^"]+)">/.exec(html)?.[1];
 assert.ok(policy,`Brak CSP: ${path}`);
 const scripts=/script-src ([^;]+)/.exec(policy)?.[1]||'';
 assert.ok(!scripts.includes("'unsafe-inline'")&&!scripts.includes("'unsafe-eval'"),`Niebezpieczna polityka skryptów: ${path}`);
 for(const match of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g))if(!match[1].includes('src=')) {
  const hash=createHash('sha256').update(match[2]).digest('base64');
  assert.ok(scripts.includes(`'sha256-${hash}'`),`Skrypt nie pasuje do CSP: ${path}`);
 }
}
console.log(`PUBLIC ARTIFACT PASS: ${actual.length} dozwolonych plików. Publikacja wymaga osobnego działania; obecne ustawienia hostingu nie zostały zmienione.`);
