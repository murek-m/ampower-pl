import { cp, mkdir, rm, lstat, readFile, writeFile } from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {securePublicHtml} from './public-security.js';
// Nigdy nie kopiujemy katalogu źródłowego rekurencyjnie. Tylko poniższe pliki.
const extractedAssets = JSON.parse(await readFile('assets/public-assets.json','utf8'));
if (!Array.isArray(extractedAssets) || extractedAssets.some(p => typeof p !== 'string' || !/^assets\/(?:fonts\/[a-f0-9]{16}\.woff2|images\/[a-f0-9]{16}\.(?:jpg|png|webp))$/.test(p))) throw new Error('Nieprawidłowa lista publicznych zasobów');
export const PUBLIC_FILES = ['index.html','favicon.svg','CNAME','.nojekyll','robots.txt','sitemap.xml','assets/smart-home-panel.png','assets/consent.css','assets/consent.js','prywatnosc/index.html',...extractedAssets,
  ...['index.html','style.css','menu.js','app.js','data.js','model.js','price-book.js','pricing.js','inquiry-config.js','inquiry-client.js',
  'fonts/fonts.css','fonts/ibm-plex-mono-5.woff2','fonts/ibm-plex-mono-6.woff2','fonts/ibm-plex-sans-4.woff2','fonts/ibm-plex-sans-3.woff2','fonts/archivo-1.woff2','fonts/archivo-2.woff2'].map(p => `smart-home-energy/${p}`)];
const assetHash=createHash('sha256');
assetHash.update(await readFile(new URL('./build.js',import.meta.url))).update(await readFile(new URL('./public-security.js',import.meta.url)));
for(const path of PUBLIC_FILES){const info=await lstat(path);if(!info.isFile()||info.isSymbolicLink())throw new Error(`Niepubliczny typ zasobu: ${path}`);assetHash.update(path).update(await readFile(path));}
const assetVersion=assetHash.digest('hex').slice(0,16);
const versioned=(text)=>text.replace(/(from\s*['"]|new URL\(['"]|(?:src|href)=["'])([./][^'"]+\.(?:js|css))(["'])/g,`$1$2?v=${assetVersion}$3`);
await rm('dist', { recursive:true, force:true });
await mkdir('dist');
for (const path of PUBLIC_FILES) {
  const stat = await lstat(path);
  if (!stat.isFile() || stat.isSymbolicLink()) throw new Error(`Niepubliczny typ zasobu: ${path}`);
  if (/\.(js|html|css)$/.test(path)) {
    const content = await readFile(path, 'utf8');
    if (/purchaseNet|internalPolicy|unitCostNet|profitAfterIncludedCostsNet|marginPercent|markupPercent|RESEND_KEY|TURNSTILE_SECRET|catalog\.seed|backend\//.test(content)) throw new Error(`Poufne pole lub import w buildzie: ${path}`);
  }
  await mkdir(`dist/${path.slice(0, path.lastIndexOf('/') + 1)}`, { recursive:true });
  if(path.endsWith('.html')) await writeFile(`dist/${path}`,securePublicHtml(versioned(await readFile(path,'utf8'))));
  else if(path.endsWith('.js'))await writeFile(`dist/${path}`,versioned(await readFile(path,'utf8')));
  else await cp(path, `dist/${path}`);
}
console.log('Build OK (zasoby '+assetVersion+'):  jawne pliki publiczne, bez backendu i dokumentacji. Bez publikacji.');
