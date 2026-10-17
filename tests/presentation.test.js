import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const css = readFileSync('smart-home-energy/style.css', 'utf8');
function luminance(hex) {
  const value = hex.slice(1);
  const full = value.length === 3 ? [...value].map(c => c + c).join('') : value;
  const rgb = [0, 2, 4].map(i => parseInt(full.slice(i, i + 2), 16) / 255).map(c => c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722;
}
const contrast = (a, b) => (Math.max(luminance(a), luminance(b)) + 0.05) / (Math.min(luminance(a), luminance(b)) + 0.05);
const palettes = [...css.matchAll(/:root\s*\{([^}]+)\}/g)].map(match => Object.fromEntries([...match[1].matchAll(/--([a-z]+):\s*(#[0-9a-f]+)/g)].map(m => [m[1], m[2]])));
for (const [i, palette] of palettes.entries()) {
  for (const fg of ['ink', 'muted', 'accent', 'error']) for (const bg of ['bg', 'surface']) {
    test(`kontrast palety ${i ? 'ciemnej' : 'jasnej'}: ${fg}/${bg} >= 4.5`, () => assert.ok(contrast(palette[fg], palette[bg]) >= 4.5));
  }
  for (const fg of ['line', 'focus']) test(`kontrast kontrolki palety ${i}: ${fg}/bg >= 3`, () => assert.ok(contrast(palette[fg], palette.bg) >= 3));
}
test('kontrast przycisku żółtego i linków nagłówka', () => {
  assert.ok(contrast('#181613', '#ffc400') >= 4.5);
  assert.ok(contrast('#c6c0b4', '#181613') >= 4.5);
});
test('focus na ciemnych panelach także w sekcji kontaktu ma kontrast >= 3', () => {
  assert.ok(contrast('#a6d9ff', '#181613') >= 3);
  assert.match(css, /\.contact :focus-visible[^}]*outline-color:#a6d9ff/);
});
test('podstrona podglądowa ma SEO, noindex i wyłącznie lokalne skrypty', () => {
  const html = readFileSync('smart-home-energy/index.html', 'utf8');
  assert.match(html, /<meta name="robots" content="noindex, nofollow">/);
  assert.match(html, /rel="canonical" href="https:\/\/ampower.pl\/smart-home-energy\/"/);
  assert.doesNotMatch(html, /<script[^>]+src="https?:/);
  assert.doesNotMatch(html, /(?:Offer|AggregateRating|gtag|fetch\()/);
  assert.match(html, /<form id="smart-form" hidden novalidate>/);
});
