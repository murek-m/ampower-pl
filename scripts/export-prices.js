import { resolve, relative } from 'node:path';
import { writeFile } from 'node:fs/promises';
import { loadCatalog, projectPublicCatalog } from '../backend/catalog.js';
if (process.env.AMPOWER_CATALOG_PATH && !relative(resolve('.'), resolve(process.env.AMPOWER_CATALOG_PATH)).startsWith('..')) throw new Error('Prywatny cennik operacyjny przechowuj poza repozytorium.');
const book = await loadCatalog(process.env.AMPOWER_CATALOG_PATH || undefined);
const projected = projectPublicCatalog(book);
await writeFile('smart-home-energy/price-book.js', `// Wygenerowana jawna projekcja cen sprzedaży. Bez danych kosztowych.\nexport const PRICE_BOOK = ${JSON.stringify(projected, null, 2)};\n`);
console.log(`Publiczna projekcja: ${projected.enabled ? projected.version : 'kwoty wyłączone — brak zatwierdzenia'}.`);
