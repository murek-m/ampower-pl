// Prywatny lokalny panel. Nie jest serwerem produkcyjnym i nie serwuje repozytorium.
import http from 'node:http';
import { randomBytes, randomUUID, createHash, timingSafeEqual } from 'node:crypto';
import { readFile, realpath } from 'node:fs/promises';
import { homedir, networkInterfaces } from 'node:os';
import { dirname, join, resolve, relative } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { FileStore, fingerprint } from './store.js';
import { loadCatalog } from './catalog.js';
import { reviseOffer, approveOffer, customerOffer } from './offers.js';
import { calculateInternal } from './internal-calculator.js';
import { analyzeDescription } from './description.js';
import { createManual, catalogLine, customerData, dashboard, draftForInquiry, recordState } from './panel-domain.js';
import { seedPanelDemo } from './panel-demo.js';
import { generateOfferPdf, pdfRuntime } from './pdf-service.js';
import { createInquiryServer } from './server.js';
import { buildInquiry, inquiryText } from '../smart-home-energy/model.js';
const root = resolve(dirname(fileURLToPath(import.meta.url)),'..');
const LOOPBACK = ['127.0.0.1','::1','::ffff:127.0.0.1'];
const privateIPv4 = s => /^(?:10\.|192\.168\.|172\.(?:1[6-9]|2\d|3[01])\.)/.test(s);
const digest = s => createHash('sha256').update(s).digest();
const secretEquals = (a,b) => typeof a === 'string' && a.length < 256 && timingSafeEqual(digest(a),digest(b));
const fail = (message,status=422) => Object.assign(new Error(message),{status});
const types = {'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.woff2':'font/woff2','.svg':'image/svg+xml','.png':'image/png'};
const assets = new Map([['/','backend/panel/index.html'],['/panel.css','backend/panel/panel.css'],['/panel.js','backend/panel/panel.js'],['/favicon.svg','favicon.svg']]);
for (const f of ['fonts.css','ibm-plex-sans-4.woff2','ibm-plex-sans-3.woff2','ibm-plex-mono-5.woff2','ibm-plex-mono-6.woff2','archivo-1.woff2','archivo-2.woff2']) assets.set(`/fonts/${f}`,`smart-home-energy/fonts/${f}`);
for (const path of ['assets/consent.js','assets/consent.css','assets/smart-home-panel.png']) assets.set('/'+path,path);
assets.set('/prywatnosc/','prywatnosc/index.html');
const demoAssets = ['index.html','style.css','menu.js','app.js','data.js','model.js','pricing.js','price-book.js','inquiry-client.js','inquiry-config.js','fonts/fonts.css','fonts/ibm-plex-sans-4.woff2','fonts/ibm-plex-sans-3.woff2','fonts/ibm-plex-mono-5.woff2','fonts/ibm-plex-mono-6.woff2','fonts/archivo-1.woff2','fonts/archivo-2.woff2'];
export function createPanelServer({store,book,loginCode,actor='właściciel AMPOWER (sesja lokalna)',allowLAN=false,allowedHosts=['127.0.0.1','localhost','[::1]'],clock=()=>new Date(),pdf=generateOfferPdf,sessionDuration=3600000}) {
  if (!store || !book || typeof loginCode !== 'string' || loginCode.length < 16) throw new Error('Panel wymaga magazynu, katalogu i silnego kodu logowania');
  const sessions = new Map();const attempts = new Map();const inquiries = new Map();
  const server = http.createServer(async (req,res) => {
    const security = {'Cache-Control':'no-store','X-Robots-Tag':'noindex, nofollow, noarchive','X-Content-Type-Options':'nosniff','X-Frame-Options':'DENY','Referrer-Policy':'no-referrer','Permissions-Policy':'camera=(), microphone=(), geolocation=()',
      'Content-Security-Policy':"default-src 'none'; script-src 'self'; style-src 'self'; font-src 'self'; img-src 'self' data:; connect-src 'self'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'; object-src 'none'"};
    const reply = (status,body,headers={}) => {res.writeHead(status,{...security,'Content-Type':'application/json; charset=utf-8',...headers});res.end(typeof body === 'string' || Buffer.isBuffer(body) ? body : JSON.stringify(body));};
    try {
      let address = req.socket.remoteAddress?.replace(/^::ffff:/,'');
      if (!LOOPBACK.includes(req.socket.remoteAddress) && !(allowLAN && privateIPv4(address))) throw fail('Dostęp tylko lokalnie',403);
      const authority = req.headers.host;
      const port = server.address()?.port;
      if (!allowedHosts.some(h => authority === `${h}:${port}`)) throw fail('Niedozwolony nagłówek Host',403);
      const origin = `http://${authority}`;
      const url = new URL(req.url,origin);
      if (url.origin !== origin || req.url.includes('..') || req.url.includes('%') || req.url.includes('\\')) throw fail('Nieprawidłowa ścieżka',404);
      if (!['GET','POST'].includes(req.method)) throw fail('Niedozwolona metoda',405);
      const mutating = req.method === 'POST';
      if (mutating && (req.headers.origin !== origin || req.headers['sec-fetch-site'] === 'cross-site')) throw fail('Niedozwolone źródło',403);
      // Odbiornik A wykorzystuje dotychczasową walidację/idempotencję. Bez poczty.
      if (url.pathname === '/api/inquiries') {
        if (!LOOPBACK.includes(req.socket.remoteAddress)) throw fail('Konfigurator DEMO dostępny tylko na Macu',403);
        if (!inquiries.has(origin)) inquiries.set(origin,createInquiryServer({store,book,allowedOrigin:origin,verifySpam:async token=>token==='',demo:true,clock}));
        return inquiries.get(origin).emit('request',req,res);
      }
      for (const [id,s] of sessions) if (s.expires <= +clock()) sessions.delete(id);
      const cookie = /(?:^|;\s*)ampower_session=([A-Za-z0-9_-]+)/.exec(req.headers.cookie || '')?.[1];
      const session = sessions.get(cookie);
      const readBody = async () => {
        if (req.headers['content-type']?.split(';')[0] !== 'application/json') throw fail('Wymagany JSON',415);
        const chunks=[];let bytes=0;
        for await (const c of req) {bytes+=c.length;if (bytes>262144) throw fail('Za dużo danych',413);chunks.push(c);}
        try {const body=JSON.parse(Buffer.concat(chunks).toString('utf8'));if (!body || typeof body !== 'object' || Array.isArray(body)) throw new Error();return body;} catch {throw fail('Nieprawidłowy JSON',400);}
      };
      if (url.pathname === '/api/panel/login' && mutating) {
        for (const [key,entry] of attempts) if (entry.until <= +clock()) attempts.delete(key);
        const attempt=attempts.get(address) || {count:0,until:+clock()+60000};
        if (++attempt.count > 5) throw fail('Zbyt wiele prób. Poczekaj minutę.',429);
        attempts.set(address,attempt);const body=await readBody();
        if (!secretEquals(body.code,loginCode)) throw fail('Nieprawidłowy kod logowania',401);
        attempts.delete(address);
        if (cookie) sessions.delete(cookie);
        if (sessions.size >= 8) sessions.delete(sessions.keys().next().value);
        const id=randomBytes(32).toString('base64url');const csrf=randomBytes(32).toString('base64url');
        sessions.set(id,{csrf,role:'owner',expires:+clock()+sessionDuration});
        return reply(200,{authenticated:true,csrf,actor,demo:true},{'Set-Cookie':`ampower_session=${id}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${Math.floor(sessionDuration/1000)}`});
      }
      if (assets.has(url.pathname) && !mutating) {
        const path=assets.get(url.pathname);const body=await readFile(join(root,path));return reply(200,body,{'Content-Type':types[path.slice(path.lastIndexOf('.'))]});
      }
      if (!session || session.role !== 'owner') throw fail('Zaloguj się do prywatnego panelu',401);
      if (mutating && !secretEquals(req.headers['x-csrf-token'],session.csrf)) throw fail('Nieprawidłowy token operacji. Zaloguj się ponownie.',403);
      if (url.pathname === '/smart-home-energy/' || url.pathname.startsWith('/smart-home-energy/')) {
        if (mutating) throw fail('Niedozwolona metoda',405);
        if (!LOOPBACK.includes(req.socket.remoteAddress)) throw fail('Konfigurator DEMO uruchom na Macu; panel działa w LAN',403);
        const file=url.pathname === '/smart-home-energy/' ? 'index.html' : url.pathname.slice('/smart-home-energy/'.length);
        if (!demoAssets.includes(file)) throw fail('Nie znaleziono',404);
        let data = await readFile(join(root,'smart-home-energy',file));
        if (file === 'inquiry-config.js') data=Buffer.from(`export const INQUIRY_CONFIG = Object.freeze(${JSON.stringify({enabled:true,endpoint:`${origin}/api/inquiries`,turnstileSiteKey:null,dataNoticeVersion:'local-test-v1'})});`);
        if (file === 'index.html') data=Buffer.from(data.toString().replace('<body>','<body><p class="wrap">TRYB DEMONSTRACYJNY: tylko dane fikcyjne. Zapis lokalny, poczta wyłączona. <a href="/">Powrót do panelu</a></p>'));
        return reply(200,data,{'Content-Type':types[file.slice(file.lastIndexOf('.'))]});
      }
      if (url.pathname === '/api/panel/me' && !mutating) return reply(200,{actor,csrf:session.csrf,demo:true});
      if (url.pathname === '/api/panel/uuid' && !mutating) return reply(200,{id:randomUUID()});
      if (url.pathname === '/api/panel/logout' && mutating) {sessions.delete(cookie);return reply(200,{ok:true},{'Set-Cookie':'ampower_session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0'});}
      if (url.pathname === '/api/panel/catalog' && !mutating) return reply(200,{products:book.products,services:book.services,policy:book.internalPolicy,notice:'Nie zatwierdzamy historycznych cen ani założeń 8A. Katalog tylko do wyboru; ceny edytuj w kosztorysie.'});
      if (url.pathname === '/api/panel/dashboard' && !mutating) return reply(200,dashboard(await store.records(),clock()));
      const body=mutating ? await readBody() : null;
      if (url.pathname === '/api/panel/analyze' && mutating) return reply(200,analyzeDescription(body.description,book));
      if (url.pathname === '/api/panel/calculate' && mutating) {
        reviseOffer({receipt:{inquiryId:'validation'},data:{},audit:[]},body.quote,actor,clock());
        const result=calculateInternal(body.quote);
        const provisional=calculateInternal({...body.quote,lines:body.quote.lines.map(l=>({...l,priceApproved:true,vatApproved:true})),adjustmentVatApproved:true});
        return reply(200,{...result,previewTotals:provisional.totals});
      }
      if (url.pathname === '/api/panel/catalog-line' && mutating) return reply(200,catalogLine(book,body.catalogId,Object.hasOwn(body,'quantity') ? body.quantity : 1,clock()));
      if (url.pathname === '/api/panel/demo' && mutating) return reply(200,await seedPanelDemo(store,book,actor,clock()));
      if (url.pathname === '/api/panel/records' && mutating) return reply(201,await createManual(store,body,book,actor,clock()));
      const match=/^\/api\/panel\/records\/(AMP-[0-9a-f-]{36})(?:\/(save|approve|status|restore|pdf|erase))?$/.exec(url.pathname);
      if (!match) throw fail('Nie znaleziono',404);
      const [,id,operation]=match;
      if (!mutating && !operation) {
        const record=await store.find(id);if (!record) throw fail('Nie znaleziono zgłoszenia',404);
        return reply(200,{record,quote:record.offer?.quote || draftForInquiry(record,book,clock()),version:record.audit.length,...(record.data.categories ? {inquirySummary:inquiryText(buildInquiry(record.data))} : {})});
      }
      if (!mutating) throw fail('Niedozwolona metoda',405);
      const result = await store.transaction(async () => {
        const record=await store.find(id);if (!record) throw fail('Nie znaleziono zgłoszenia',404);
        if (body.version !== record.audit.length) throw fail('Dane zmieniły się w innej karcie. Otwórz ponownie zgłoszenie przed zapisem.',409);
        let next;
        if (operation === 'save') {
          if (body.quote?.marginBasis !== 'total' || body.quote?.lines?.some(l=>typeof l.priceApproved!=='boolean' || typeof l.vatApproved!=='boolean')) throw fail('Panel wymaga jawnych zatwierdzeń pozycji i marży po pełnych kosztach');
          const data={...record.data,...customerData(body.customer)};
          // Archiwum zachowuje poprzednie dane klienta, zanim je podmienimy.
          next=reviseOffer(record,body.quote,actor,clock());next.data=data;next.status='draft';
          next.audit.push({action:'customer-and-quote-saved',actor,at:clock().toISOString()});
        } else if (operation === 'approve') {
          if (body.confirm !== 'approve-current-revision') throw fail('Potwierdź zatwierdzenie bieżącej wersji');
          next=approveOffer(record,body.revision,actor,clock());next.status='approved';
        } else if (operation === 'restore') {
          const snapshot=record.offerHistory?.find(h=>h.offer.revision===body.revision);
          if (!snapshot) throw fail('Nie znaleziono wersji',404);
          next=reviseOffer(record,snapshot.offer.quote,actor,clock());next.status='draft';
          next.data=structuredClone(snapshot.data);
          next.audit.push({action:'offer-restored',fromRevision:body.revision,actor,at:clock().toISOString()});
        } else if (operation === 'status') {
          const transitions = {new:['estimating'],estimating:['new'],draft:[],approved:['sent'],sent:['accepted'],accepted:[]};
          if (!transitions[recordState(record)]?.includes(body.status)) throw fail('Niedozwolona zmiana statusu');
          if (['sent','accepted'].includes(body.status)) {
            customerOffer(record,false,clock());
            if (typeof body.note !== 'string' || !body.note.trim() || body.note.length > 1000) throw fail('Wpisz dowód ręcznej wysyłki lub akceptacji klienta');
          }
          next=structuredClone(record);next.status=body.status;next.audit.push({action:`status-${body.status}`,note:body.note || '',actor,at:clock().toISOString()});
        } else if (operation === 'erase') {
          if (body.confirm !== id) throw fail('Potwierdzenie usunięcia niezgodne');
          await store.erase(record,actor,clock());return {erased:true};
        } else if (operation === 'pdf') {
          let source=record;
          if (body.revision !== record.offer?.revision) {
            const historical=record.offerHistory?.find(h=>h.offer.revision===body.revision);
            if (!historical) throw fail('Nie znaleziono wersji',404);
            source={...record,...historical};
          }
          const key=fingerprint({inquiryId:id,offer:source.offer,data:source.data});
          let archived=record.pdfArchives?.find(a=>a.key===key);
          const retrievedFromArchive=Boolean(archived);
          let pdfData;
          if (archived && (body.draft === true || archived.state === 'approved')) {
            pdfData=await store.archivedPdf(id,key);
            if (!pdfData || createHash('sha256').update(pdfData).digest('hex') !== archived.hash) throw fail('Brak lub uszkodzenie archiwum PDF. Odtwórz plik z prywatnej kopii.',503);
          } else {
            const exported=customerOffer(source,body.draft === true,clock());
            pdfData=await pdf(exported);
            await store.archivePdf(id,key,pdfData);
            archived={key,revision:exported.revision,state:exported.state,validUntil:exported.validUntil,hash:createHash('sha256').update(pdfData).digest('hex')};
            record.pdfArchives ||= [];record.pdfArchives.push(archived);
          }
          const expired=Date.parse(archived.validUntil) <= +clock();
          record.audit.push({action:'pdf-generated',retrievedFromArchive,revision:archived.revision,state:archived.state,actor,at:clock().toISOString(),hash:archived.hash,expired});
          await store.put(record.storageKey,record);return {pdf:pdfData,revision:archived.revision,expired};
        } else throw fail('Nie znaleziono',404);
        await store.put(next.storageKey,next);return {record:next,quote:next.offer?.quote || draftForInquiry(next,book,clock()),version:next.audit.length};
      });
      if (result.pdf) return reply(200,result.pdf,{'Content-Type':'application/pdf','X-AMPOWER-Offer-Expired':String(result.expired),'Content-Disposition':`attachment; filename="${id}-v${result.revision}${result.expired ? '-ARCHIWALNA-WYGASLA' : ''}.pdf"`});
      return reply(200,result);
    } catch (error) {if (!res.headersSent) reply(error.status || 422,{error:error.status || ['Nieprawid','Niekompletny','Wymagan','Zatwierdz','Kosztorys','Oferta','Marża','Podaj','Opis','Brak'].some(s=>error.message.startsWith(s)) ? error.message : 'Operacja nie powiodła się. Nie potwierdzono zapisu.'}); else res.end();}
  });
  server.requestTimeout=20000;server.headersTimeout=10000;
  server.on('close',()=>{sessions.clear();for (const s of inquiries.values()) s.close();});
  return server;
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  if (process.env.AMPOWER_LOCAL_TEST !== '1') throw new Error('Panel jest prototypem DEMO. Uruchom npm run panel:local.');
  if (process.env.NODE_ENV === 'production') throw new Error('Prototyp nie obsługuje produkcji');
  const bind=process.env.AMPOWER_PANEL_HOST || '127.0.0.1';
  const addresses=Object.values(networkInterfaces()).flat().filter(x=>x.family==='IPv4' && privateIPv4(x.address)).map(x=>x.address);
  if (bind !== '127.0.0.1' && !addresses.includes(bind)) throw new Error('Wybierz 127.0.0.1 lub konkretny prywatny adres IPv4 tego Maca. Nie używaj 0.0.0.0.');
  if (process.env.AMPOWER_CATALOG_PATH) throw new Error('Tryb DEMO używa wyłącznie katalogu seed; nie podłączaj rzeczywistych cen ani danych.');
  const directory=resolve(process.env.AMPOWER_PANEL_DATA_DIR || join(homedir(),'.local/share/ampower-panel-demo'));
  const store=new FileStore(directory);await store.init();
  const actual=await realpath(directory);const outside=relative(root,actual);if (!(outside==='..' || outside.startsWith('../'))) throw new Error('Magazyn panelu musi być poza repozytorium');
  const code=randomBytes(24).toString('base64url');const port=Number(process.env.AMPOWER_PANEL_PORT || 8790);
  if (!Number.isInteger(port) || port < 1024 || port > 65535) throw new Error('Nieprawidłowy port panelu');
  const server=createPanelServer({store,book:await loadCatalog(),loginCode:code,allowLAN:bind!=='127.0.0.1',allowedHosts:bind==='127.0.0.1'?['127.0.0.1','localhost']:[bind]});
  server.listen(port,bind,()=>console.log(`AMPOWER PANEL DEMO: http://${bind}:${port}\nKod logowania na to uruchomienie: ${code}\nDane: ${directory}\nPoczta i AI wyłączone. Tylko dane fikcyjne. Zakończenie: Ctrl+C.`));
  server.on('error',()=>{console.error('Nie udało się uruchomić panelu; sprawdź adres/port.');process.exitCode=1;});
  pdfRuntime().then(()=>console.log('Generator PDF gotowy.')).catch(e=>console.log(e.message));
}
