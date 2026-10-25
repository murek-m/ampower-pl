import {createHash} from 'node:crypto';

// Hashes are regenerated for each build; inline scripts need no unsafe-inline.
export function securePublicHtml(html,reviewOrigin='') {
  const hashes=[...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)].filter(m=>!m[1].includes('src=')).map(m=>`'sha256-${createHash('sha256').update(m[2]).digest('base64')}'`);
  if(reviewOrigin && (new URL(reviewOrigin).origin!==reviewOrigin || !reviewOrigin.startsWith('https://'))) throw new Error('Nieprawidłowy origin opinii.');
  const extra=reviewOrigin?' '+reviewOrigin:'';
  const policy=`default-src 'self'; script-src 'self' ${hashes.join(' ')} https://www.googletagmanager.com; style-src 'self' 'unsafe-inline'; font-src 'self'; img-src 'self' data: blob: https://www.google-analytics.com${extra}; connect-src 'self' https://www.google-analytics.com https://region1.google-analytics.com https://analytics.google.com https://www.googletagmanager.com${extra}; object-src 'none'; base-uri 'none'; form-action 'self'`;
  return html.replace(/<meta charset="utf-8">/i,match=>`${match}\n<meta http-equiv="Content-Security-Policy" content="${policy}">\n<meta name="referrer" content="strict-origin-when-cross-origin">`);
}
