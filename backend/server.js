// Lokalny prototyp odbiornika. Nie wystawia panelu ani prywatnych plików.
import http from 'node:http';
import { randomUUID } from 'node:crypto';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { FileStore, fingerprint } from './store.js';
import { loadCatalog, projectPublicCatalog } from './catalog.js';
import { estimate, selectionFromRaw } from '../smart-home-energy/pricing.js';
import { draftFromEstimate, calculateInternal } from './internal-calculator.js';
import { validatePayload } from './validation.js';
export function createInquiryServer({ store, book, allowedOrigin = 'http://127.0.0.1:4173', noticeVersion = 'local-test-v1', verifySpam, rateLimit = 5, clock = () => new Date(), demo = false }) {
  if (!verifySpam) throw new Error('Brak serwerowej weryfikacji antyspamowej');
  const hits = new Map();
  const server = http.createServer(async (req, res) => {
    if (!['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(req.socket.remoteAddress)) { res.writeHead(403); res.end(); return; }
    const headers = { 'Content-Type':'application/json; charset=utf-8', 'Cache-Control':'no-store', 'X-Content-Type-Options':'nosniff' };
    if (req.headers.origin === allowedOrigin) Object.assign(headers, { 'Access-Control-Allow-Origin':allowedOrigin, 'Vary':'Origin', 'Access-Control-Allow-Headers':'Content-Type, Idempotency-Key', 'Access-Control-Allow-Methods':'POST, OPTIONS' });
    const reply = (status, body) => { res.writeHead(status, headers); res.end(JSON.stringify(body)); };
    if (req.url === '/health' && req.method === 'GET') return reply(200, { status:'local-prototype' });
    if (req.url !== '/api/inquiries') return reply(404, { error:'Nie znaleziono' });
    if (req.headers.origin !== allowedOrigin) return reply(403, { error:'Niedozwolone źródło' });
    if (req.method === 'OPTIONS') return reply(204, {});
    if (req.method !== 'POST') return reply(405, { error:'Niedozwolona metoda' });
    if (req.headers['content-type']?.split(';')[0] !== 'application/json') return reply(415, { error:'Wymagany JSON' });
    const key = req.headers['idempotency-key'];
    if (typeof key !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(key)) return reply(422, { error:'Nieprawidłowy identyfikator próby' });
    const now = +clock();
    const ip = req.socket.remoteAddress; // Nie ufamy nagłówkowi X-Forwarded-For.
    for (const [address, entry] of hits) if (entry.until <= now) hits.delete(address);
    const hit = hits.get(ip) || { count:0, until:now + 60000 };
    if (++hit.count > rateLimit) return reply(429, { error:'Limit prób' });
    hits.set(ip, hit);
    try {
      const chunks = [];
      let bytes = 0;
      for await (const chunk of req) { bytes += chunk.length; if (bytes > 32768) throw Object.assign(new Error('Limit danych'), { status:413 }); chunks.push(chunk); }
      // Buffer.concat zachowuje polskie znaki na granicach chunków.
      const payload = JSON.parse(Buffer.concat(chunks).toString('utf8'));
      const data = validatePayload(payload, noticeVersion);
      if (!await verifySpam(payload.token)) return reply(403, { error:'Nieudana weryfikacja antyspamowa' });
      const payloadHash = fingerprint({ data, noticeVersion });
      const result = await store.transaction(async () => {
        const previous = await store.get(key);
        if (previous) { if (previous.payloadHash !== payloadHash) throw Object.assign(new Error('Klucz użyty dla innych danych'), { status:409 }); return previous.receipt; }
        const pricing = estimate(selectionFromRaw(data), projectPublicCatalog(book, clock()), clock());
        const draft = draftFromEstimate(pricing, book, clock(), selectionFromRaw(data));
        const receipt = { accepted:true, inquiryId:`AMP-${randomUUID()}`, receivedAt:clock().toISOString(), notificationStatus:demo ? 'demo-disabled' : 'queued' };
        await store.put(key, { storageKey:key, payloadHash, receipt, data, publicEstimate:pricing, internalDraft:draft, internalCalculation:calculateInternal(draft),
          ...(demo ? {demo:true} : {}), notification:{ status:demo ? 'demo-disabled' : 'pending', recipient:'kuba@ampower.pl', attempts:0 }, offer:null, audit:[{ action:'received', at:receipt.receivedAt }] });
        return receipt;
      });
      return reply(201, { accepted:result.accepted === true, inquiryId:result.inquiryId, receivedAt:result.receivedAt, notificationStatus:result.notificationStatus || 'queued' });
    } catch (error) { return reply(error.status || (error instanceof SyntaxError ? 400 : 503), { error:error.status ? error.message : 'Nie potwierdzono zapisu. Spróbuj ponownie.' }); }
  });
  server.requestTimeout = 20000;
  server.headersTimeout = 10000;
  return server;
}
export async function verifyTurnstile(token, { secret, hostname }, transport = fetch) {
  if (!secret || !hostname || !token) return false;
  try {
    const response = await transport('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method:'POST', body:new URLSearchParams({ secret, response:token }), signal:AbortSignal.timeout(10000) });
    const result = await response.json();
    return response.ok && result.success === true && result.hostname === hostname && result.action === 'inquiry';
  } catch { return false; }
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  if (process.env.AMPOWER_LOCAL_TEST !== '1') throw new Error('Prototyp lokalny: ustaw AMPOWER_LOCAL_TEST=1. Tryb produkcyjny wymaga osobnego wdrożenia.');
  const store = new FileStore(process.env.AMPOWER_DATA_DIR || join(homedir(), '.local/share/ampower-sales'));
  const book = await loadCatalog(process.env.AMPOWER_CATALOG_PATH || undefined);
  const server = createInquiryServer({ store, book, verifySpam:async token => token === '', allowedOrigin:process.env.AMPOWER_ORIGIN || 'http://127.0.0.1:4173' });
  server.listen(8787, '127.0.0.1', () => console.log('Lokalny odbiornik TEST: http://127.0.0.1:8787. Poczta wyłączona.'));
}
