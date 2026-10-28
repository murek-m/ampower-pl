// Prepare only the public calculator in an existing static-site checkout.
// This script does not push commits or change hosting.
import {execFileSync} from 'node:child_process';
import {cp,readFile,writeFile,readdir,lstat} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import assert from 'node:assert/strict';
import {securePublicHtml} from './public-security.js';

const target=process.argv[2];
assert.ok(target,'Usage: node scripts/build-pv-public.mjs /path/to/static-site');
const site=resolve(target);
assert.notEqual(site,process.cwd(),'Use a separate static-site checkout');
assert.equal((await readFile(join(site,'CNAME'),'utf8')).trim(),'ampower.pl');
const home=join(site,'index.html');
let html=await readFile(home,'utf8');
execFileSync(process.execPath,['scripts/build-pv-mining.mjs'],{stdio:'inherit'});
const output=join(site,'pv-mining');
await cp('output/pv-mining-preview',output,{recursive:true});
for(const file of ['index.html','simple.html','advanced.html']) {
  const path=join(output,file);
  await writeFile(path,securePublicHtml(await readFile(path,'utf8')));
}
if(!html.includes('href="/pv-mining/"')) {
  const anchor='<a class="service-link" href="/smart-home-energy/">Poznaj Smart Home <span aria-hidden="true">→</span></a>';
  assert.ok(html.includes(anchor),'Smart Home service card not found; inspect the homepage before publishing');
  html=html.replace(anchor,anchor+'\n          <a class="service-link" href="/pv-mining/">Sprawdź PV Mining — kalkulator BTC <span aria-hidden="true">→</span></a>');
  // The existing inline script bytes and their CSP hashes remain unchanged.
  await writeFile(home,html);
}
let count=0;
async function check(directory){
  for(const name of await readdir(directory)){
    const path=join(directory,name),stat=await lstat(path);
    assert.ok(!stat.isSymbolicLink(),'No symlinks in public module');
    if(stat.isDirectory())await check(path);
    else {
      assert.match(name,/\.(?:html|js|css|json|woff2|svg)$/);
      if(/\.(?:html|js|json|css)$/.test(name))assert.doesNotMatch(await readFile(path,'utf8'),/purchaseNet|internalPolicy|unitCostNet|RESEND_KEY|TURNSTILE_SECRET|PRIVATE KEY|catalog\.seed/);
      count++;
    }
  }
}
await check(output);
console.log(`PV PUBLIC PASS: ${count} calculator assets, homepage link ready in ${site}. No deployment performed.`);
