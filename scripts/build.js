import { cp, mkdir, rm, lstat, readFile } from 'node:fs/promises';
// Nigdy nie kopiujemy katalogu źródłowego rekurencyjnie. Tylko poniższe pliki.
export const PUBLIC_FILES = ['index.html','favicon.svg','CNAME','assets/smart-home-panel.png',
  ...['index.html','style.css','app.js','data.js','model.js','price-book.js','pricing.js','inquiry-config.js','inquiry-client.js',
  'fonts/fonts.css','fonts/ibm-plex-mono-5.woff2','fonts/ibm-plex-mono-6.woff2','fonts/ibm-plex-sans-4.woff2','fonts/ibm-plex-sans-3.woff2','fonts/archivo-1.woff2','fonts/archivo-2.woff2'].map(p => `smart-home-energy/${p}`)];
await rm('dist', { recursive:true, force:true });
await mkdir('dist');
for (const path of PUBLIC_FILES) {
  const stat = await lstat(path);
  if (!stat.isFile() || stat.isSymbolicLink()) throw new Error(`Niepubliczny typ zasobu: ${path}`);
  if (/\.(js|html|css)$/.test(path) && path !== 'index.html') {
    const content = await readFile(path, 'utf8');
    if (/purchaseNet|internalPolicy|unitCostNet|profitAfterIncludedCostsNet|marginPercent|markupPercent|RESEND_KEY|TURNSTILE_SECRET|catalog\.seed|backend\//.test(content)) throw new Error(`Poufne pole lub import w buildzie: ${path}`);
  }
  await mkdir(`dist/${path.slice(0, path.lastIndexOf('/') + 1)}`, { recursive:true });
  await cp(path, `dist/${path}`);
}
console.log('Build OK: jawne pliki publiczne, bez backendu i dokumentacji. Bez publikacji.');
