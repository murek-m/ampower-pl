import { readFileSync, readdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { Script } from 'node:vm';
const js = ['scripts', 'tests', 'smart-home-energy', 'backend'].flatMap(dir => readdirSync(dir).filter(f => /\.(?:js|mjs)$/.test(f)).map(f => `${dir}/${f}`));
js.push('backend/panel/panel.js','assets/consent.js','assets/reviews.js','assets/reviews-config.js','backend/reviews-admin/admin.js');
for (const path of js) {
  const result = spawnSync(process.execPath, ['--check', path], { encoding: 'utf8' });
  if (result.status !== 0) throw new Error(`${path}: ${result.stderr}`);
}
for (const path of ['index.html', 'smart-home-energy/index.html', 'prywatnosc/index.html', 'backend/reviews-admin/index.html']) {
  const html = readFileSync(path, 'utf8');
  for (const match of html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g)) {
    if (match[1].includes('application/ld+json')) JSON.parse(match[2]);
    else if (!match[1].includes('src=')) new Script(match[2], { filename: path });
  }
}
const html = spawnSync('python3', ['scripts/lint_html.py'], { encoding: 'utf8' });
process.stdout.write(html.stdout);
if (html.status !== 0) throw new Error(html.stderr || html.stdout);
const model = readFileSync('smart-home-energy/model.js', 'utf8');
const app = readFileSync('smart-home-energy/app.js', 'utf8');
if (/\b(?:eval)\s*\(|localStorage|sessionStorage|innerHTML|gtag\s*\(/.test(model + app)) throw new Error('Niedozwolona operacja w nowym konfiguratorze.');
console.log(`Lint OK: składnia ${js.length} plików JS, skryptów inline, JSON-LD i kontrakt HTML. Bez zewnętrznych zależności.`);
