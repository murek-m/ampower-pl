import http from 'node:http';
import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { readFile, realpath } from 'node:fs/promises';
import { homedir } from 'node:os';
import { isIP } from 'node:net';
import { dirname, join, resolve, relative } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { ReviewsStore, REVIEW_SERVICES, reviewError } from './reviews-store.js';
import { sanitizeReviewPhoto } from './reviews-photo.js';
import { resendNotification } from './notifications.js';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const hash=value=>createHash('sha256').update(value).digest('hex');
const equal=(a,b)=>typeof a==='string' && a.length<512 && timingSafeEqual(Buffer.from(hash(a)),Buffer.from(hash(b)));
const idPattern='[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}';
const isId=value=>typeof value==='string' && new RegExp(`^${idPattern}$`).test(value);
const mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.woff2':'font/woff2','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.svg':'image/svg+xml','.xml':'application/xml','.txt':'text/plain'};

export function validateReview(body) {
  const text=(key,min,max)=>{
    if(typeof body[key]!=='string') throw reviewError('Uzupełnij wszystkie wymagane pola.');
    const value=body[key].normalize('NFC').trim();
    if(value.length<min || value.length>max || /[\u0000-\u0008\u000b-\u001f\u007f\u202a-\u202e\u2066-\u2069]/u.test(value)) throw reviewError('Sprawdź długość i treść wpisanych danych.');
    return value;
  };
  const data={firstName:text('firstName',2,40),initial:text('initial',1,1).toLocaleUpperCase('pl'),city:text('city',2,80),service:text('service',3,50),text:text('text',15,2000),rating:body.rating};
  if(!/^[\p{L}][\p{L} '\-]*$/u.test(data.firstName) || !/^\p{L}$/u.test(data.initial)) throw reviewError('Podaj imię i jedną literę nazwiska.');
  if(!Number.isInteger(data.rating) || data.rating<1 || data.rating>5 || !REVIEW_SERVICES.includes(data.service)) throw reviewError('Wybierz ocenę od 1 do 5 i rodzaj usługi.');
  if(body.consent!==true || body.consentVersion!=='reviews-v1') throw reviewError('Potwierdź zgodę na publikację opinii.');
  if(body.photo && body.photoConsent!==true) throw reviewError('Potwierdź, że możesz udostępnić zdjęcie.');
  return data;
}

export async function processReviewMail(store,send,adminUrl,now=new Date()) {
  if(typeof send!=='function') return 0;
  let processed=0;
  for(let i=0;i<20;i++) {
    const claim=store.claimMail(+now); if(!claim) break;
    let receipt=null;
    try { receipt=await send({to:'kuba@ampower.pl',subject:'AmPower — nowa opinia czeka na zatwierdzenie',text:`Nowa opinia została zapisana i czeka na moderację.\n\nOtwórz panel: ${adminUrl}\nIdentyfikator: ${claim.id}\n\nTreść oraz zdjęcie zobaczysz po zalogowaniu.`,key:`review-${claim.id}`}); } catch { /* Kolejka zachowuje próbę i ponowi ją z tym samym kluczem. */ }
    store.finishMail(claim,receipt,+now); processed++;
  }
  return processed;
}

export function createReviewsServer({store,password,publicOrigin,apiOrigin,secure=false,trustProxy=false,mailEnabled=false,clock=()=>new Date(),minFormAge=2000,submitLimit=5,staticRoot=join(root,'dist')}={}) {
  if(!store || typeof password!=='string' || password.length<20) throw new Error('Panel opinii wymaga silnego hasła (min. 20 znaków).');
  for(const value of [publicOrigin,apiOrigin].filter(Boolean)) if(new URL(value).origin!==value) throw new Error('Podaj sam origin bez ścieżki.');
  const sessions=new Map(),limits=new Map(),tokenSecret=randomBytes(32);
  const sign=value=>createHmac('sha256',tokenSecret).update(value).digest('base64url');
  const limit=(key,max,windowMs)=>{
    const now=+clock(); for(const [k,v] of limits) if(v.until<=now) limits.delete(k);
    if(limits.size>10000 && !limits.has(key)) throw reviewError('Zbyt wiele prób. Spróbuj później.',429);
    const item=limits.get(key)||{count:0,until:now+windowMs}; item.count++; limits.set(key,item);
    if(item.count>max) throw reviewError('Zbyt wiele prób. Spróbuj ponownie później.',429);
  };
  const server=http.createServer(async(req,res)=>{
    const security={'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','X-Frame-Options':'DENY','Referrer-Policy':'no-referrer','X-Robots-Tag':'noindex, nofollow','Permissions-Policy':'camera=(), microphone=(), geolocation=()'};
    if(secure) security['Strict-Transport-Security']='max-age=31536000';
    let cors={};
    const reply=(status,body,headers={})=>{res.writeHead(status,{...security,...cors,'Content-Type':'application/json; charset=utf-8',...headers});res.end(Buffer.isBuffer(body)||typeof body==='string'?body:JSON.stringify(body));};
    try {
      // Kontrola hostingu może używać wewnętrznego Host, a nie domeny panelu.
      if(req.url==='/health' && req.method==='GET') return reply(200,{ok:true});
      if(req.url==='/ready' && req.method==='GET') {const {ok}=store.readiness();return reply(ok?200:503,{ok});}
      const serviceOrigin=apiOrigin || `http://127.0.0.1:${server.address().port}`;
      const origin=new URL(serviceOrigin), authority=req.headers.host;
      if(authority!==origin.host) throw reviewError('Nieprawidłowy adres serwera.',403);
      if(/%|\\|\.\./.test(req.url)) throw reviewError('Nie znaleziono.',404);
      const url=new URL(req.url,serviceOrigin);
      if(url.origin!==serviceOrigin) throw reviewError('Nie znaleziono.',404);
      const isPublic=url.pathname==='/api/reviews' || url.pathname.startsWith('/api/reviews/');
      const allowed=new Set([serviceOrigin,publicOrigin].filter(Boolean));
      if(isPublic && allowed.has(req.headers.origin)) cors={'Access-Control-Allow-Origin':req.headers.origin,'Vary':'Origin','Access-Control-Allow-Headers':'Content-Type, Idempotency-Key','Access-Control-Allow-Methods':'GET, POST, OPTIONS'};
      if(req.method==='OPTIONS' && isPublic && allowed.has(req.headers.origin)) return reply(204,'');
      if(!['GET','HEAD','POST'].includes(req.method)) throw reviewError('Niedozwolona metoda.',405);
      const mutating=req.method==='POST';
      if(mutating && !(isPublic?allowed:new Set([serviceOrigin])).has(req.headers.origin)) throw reviewError('Niedozwolone źródło formularza.',403);
      if(!isPublic && mutating && req.headers['sec-fetch-site']==='cross-site') throw reviewError('Niedozwolone źródło formularza.',403);
      let ip=req.socket.remoteAddress;
      if(trustProxy) {
        const candidate=req.headers['x-forwarded-for']?.split(',').at(-1)?.trim();
        if(!candidate || !isIP(candidate)) throw reviewError('Brak adresu klienta od zaufanego serwera proxy.',403);
        ip=candidate;
      }
      for(const [key,value] of sessions) if(value.until<=+clock()) sessions.delete(key);
      const cookie=/(?:^|;\s*)ampower_reviews=([A-Za-z0-9_-]+)/.exec(req.headers.cookie||'')?.[1];
      const session=sessions.get(cookie);
      const readBody=async(max=2200000)=>{
        if(req.headers['content-type']?.split(';')[0]!=='application/json') throw reviewError('Wymagany JSON.',415);
        const chunks=[]; let bytes=0;
        for await(const chunk of req) { bytes+=chunk.length; if(bytes>max) throw reviewError('Przesłane dane są za duże.',413); chunks.push(chunk); }
        try { const body=JSON.parse(Buffer.concat(chunks).toString('utf8')); if(!body || typeof body!=='object' || Array.isArray(body)) throw new Error(); return body; } catch { throw reviewError('Nieprawidłowy formularz.',400); }
      };
      if(url.pathname==='/api/reviews/form' && req.method==='GET') {
        limit(`form:${ip}`,60,600000);
        const value=`${+clock()}.${randomBytes(16).toString('hex')}.${sign(`ip:${ip}`)}`;
        return reply(200,{token:`${value}.${sign(value)}`,validForMs:3600000,minAgeMs:minFormAge,services:REVIEW_SERVICES,consentVersion:'reviews-v1'});
      }
      if(url.pathname==='/api/reviews' && req.method==='GET') {
        const offset=Number(url.searchParams.get('offset')||0),take=Number(url.searchParams.get('limit')||3);
        if(!Number.isInteger(offset)||offset<0||offset>100000||!Number.isInteger(take)||take<1||take>30) throw reviewError('Nieprawidłowa strona opinii.');
        return reply(200,store.list({offset,limit:take,cursor:url.searchParams.get('cursor')}));
      }
      if(url.pathname==='/api/reviews' && mutating) {
        limit(`submit:${ip}`,submitLimit,600000);
        const key=req.headers['idempotency-key']; if(!isId(key)) throw reviewError('Odśwież formularz i spróbuj ponownie.');
        const body=await readBody();
        if(body.website) throw reviewError('Nie udało się zweryfikować formularza.',403);
        const parts=typeof body.token==='string'?body.token.split('.'):[];
        const value=parts.slice(0,3).join('.'), age=+clock()-Number(parts[0]);
        if(parts.length!==4 || !equal(parts[3],sign(value)) || parts[2]!==sign(`ip:${ip}`) || !Number.isFinite(age) || age<0 || age>3600000) throw Object.assign(reviewError('Odnów formularz i spróbuj ponownie. Wpisane dane mogą pozostać w formularzu.',403),{code:'FORM_RENEW'});
        if(age<minFormAge) throw Object.assign(reviewError('Poczekaj chwilę przed wysłaniem opinii.',403),{code:'FORM_WAIT',retryAfterMs:minFormAge-age});
        const data=validateReview(body),photo=sanitizeReviewPhoto(body.photo);
        const fingerprint=hash(JSON.stringify(data)+(photo?hash(photo):''));
        const result=store.submit(data,key,fingerprint,photo,clock(),mailEnabled);
        return reply(201,{...result,message:'Dziękuję! Twoja opinia została zapisana i czeka na zatwierdzenie.'});
      }
      const photoMatch=new RegExp(`^/api/reviews/(${idPattern})/photo$`).exec(url.pathname);
      if(photoMatch && req.method==='GET') {
        const photo=store.photo(photoMatch[1],Boolean(session));
        if(!photo) throw reviewError('Nie znaleziono zdjęcia.',404);
        return reply(200,photo,{'Content-Type':'image/png','Content-Security-Policy':"default-src 'none'; sandbox",'Content-Disposition':'inline; filename="realizacja.png"'});
      }
      const cookieHeader=value=>`ampower_reviews=${value}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${value?3600:0}${secure?'; Secure':''}`;
      if(url.pathname==='/api/reviews-admin/login' && mutating) {
        limit(`login:${ip}`,5,900000);
        const body=await readBody(4096);
        if(!equal(body.password,password)) throw reviewError('Nieprawidłowe hasło.',401);
        if(cookie) sessions.delete(cookie);
        if(sessions.size>=16) sessions.delete(sessions.keys().next().value);
        const id=randomBytes(32).toString('base64url'),csrf=randomBytes(32).toString('base64url');
        sessions.set(id,{csrf,until:+clock()+3600000});
        return reply(200,{csrf},{'Set-Cookie':cookieHeader(id)});
      }
      if(url.pathname.startsWith('/api/reviews-admin/')) {
        if(!session) throw reviewError('Zaloguj się do panelu opinii.',401);
        if(mutating && !equal(req.headers['x-csrf-token'],session.csrf)) throw reviewError('Sesja operacji wygasła. Zaloguj się ponownie.',403);
        if(url.pathname==='/api/reviews-admin/me' && req.method==='GET') return reply(200,{csrf:session.csrf,mailEnabled,storage:store.readiness(),shareUrl:`${publicOrigin||serviceOrigin}/#dodaj-opinie`});
        if(url.pathname==='/api/reviews-admin/logout' && mutating) { sessions.delete(cookie); return reply(200,{ok:true},{'Set-Cookie':cookieHeader('')}); }
        if(url.pathname==='/api/reviews-admin/list' && req.method==='GET') {
          const offset=Number(url.searchParams.get('offset')||0);
          if(!Number.isInteger(offset)||offset<0||offset>100000) throw reviewError('Nieprawidłowa strona.');
          return reply(200,store.list({admin:true,offset,limit:30,status:url.searchParams.get('status')||'all',cursor:url.searchParams.get('cursor')}));
        }
        const match=new RegExp(`^/api/reviews-admin/(${idPattern})$`).exec(url.pathname);
        if(match && mutating) return reply(200,store.moderate(match[1],await readBody(16384),clock()));
        throw reviewError('Nie znaleziono.',404);
      }
      if(mutating) throw reviewError('Nie znaleziono.',404);
      const adminFiles={'/admin/opinie':'backend/reviews-admin/index.html','/admin/opinie/':'backend/reviews-admin/index.html','/admin/opinie/admin.css':'backend/reviews-admin/admin.css','/admin/opinie/admin.js':'backend/reviews-admin/admin.js','/admin/opinie/panel.css':'backend/panel/panel.css'};
      let path;
      if(adminFiles[url.pathname]) {
        path=join(root,adminFiles[url.pathname]);
        security['Content-Security-Policy']="default-src 'none'; script-src 'self'; style-src 'self'; font-src 'self'; img-src 'self'; connect-src 'self'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'";
      } else {
        const base=await realpath(staticRoot);
        const requested=join(base,url.pathname.endsWith('/')?url.pathname+'index.html':url.pathname);
        try { path=await realpath(requested); } catch { throw reviewError('Nie znaleziono.',404); }
        if(relative(base,path).startsWith('..') || !mime[path.slice(path.lastIndexOf('.'))]) throw reviewError('Nie znaleziono.',404);
        delete security['X-Robots-Tag'];
        security['Cache-Control']=/^\/assets\/(?:images|fonts)\/[a-f0-9]{16}\./.test(url.pathname)?'public, max-age=31536000, immutable':'no-cache';
      }
      const body=await readFile(path);
      return reply(200,req.method==='HEAD'?'':body,{'Content-Type':mime[path.slice(path.lastIndexOf('.'))]||'application/octet-stream'});
    } catch(error) { if(!res.headersSent) reply(error.status||503,{error:error.status?error.message:'Nie potwierdzono operacji. Spróbuj ponownie.',...(error.code==='FORM_RENEW'||error.code==='FORM_WAIT'?{code:error.code,...(error.retryAfterMs?{retryAfterMs:error.retryAfterMs}:{})}:{})}); else res.end(); }
  });
  server.requestTimeout=20000; server.headersTimeout=10000;
  server.on('close',()=>sessions.clear());
  return server;
}

if(process.argv[1] && import.meta.url===pathToFileURL(process.argv[1]).href) {
  const production=process.env.NODE_ENV==='production';
  const directory=resolve(process.env.AMPOWER_REVIEWS_DATA_DIR||join(homedir(),'.local/share/ampower-reviews'));
  const outside=relative(root,directory);
  if(!(outside==='..' || outside.startsWith('../'))) throw new Error('Magazyn opinii musi być poza repozytorium.');
  if(production && (!process.env.AMPOWER_REVIEWS_DATA_DIR || !process.env.AMPOWER_REVIEWS_ORIGIN?.startsWith('https://') || !process.env.AMPOWER_PUBLIC_ORIGIN?.startsWith('https://') || !process.env.AMPOWER_REVIEWS_ADMIN_PASSWORD)) throw new Error('Produkcja wymaga trwałego katalogu danych, originów HTTPS i hasła administratora.');
  const password=process.env.AMPOWER_REVIEWS_ADMIN_PASSWORD || randomBytes(24).toString('base64url');
  const mailEnabled=Boolean(production && process.env.AMPOWER_RESEND_KEY && process.env.AMPOWER_MAIL_FROM);
  const store=new ReviewsStore(directory);
  store.purgeUnpublished();
  const server=createReviewsServer({store,password,publicOrigin:process.env.AMPOWER_PUBLIC_ORIGIN,apiOrigin:process.env.AMPOWER_REVIEWS_ORIGIN,secure:production,trustProxy:production&&process.env.AMPOWER_REVIEWS_TRUST_PROXY==='1',mailEnabled});
  const port=Number(process.env.PORT||8791),bind=production?'0.0.0.0':'127.0.0.1';
  server.listen(port,bind,()=>{
    console.log(`Opinie: ${process.env.AMPOWER_REVIEWS_ORIGIN||`http://127.0.0.1:${port}`}/admin/opinie/\nPowiadomienia e-mail: ${mailEnabled?'włączone':'wyłączone'}`);
    if(!production && !process.env.AMPOWER_REVIEWS_ADMIN_PASSWORD) console.log(`Lokalne hasło na to uruchomienie: ${password}`);
  });
  let working=false;
  let lastPurge=Date.now();
  const timer=setInterval(async()=>{
    if(Date.now()-lastPurge>86400000) {store.purgeUnpublished();lastPurge=Date.now();}
    if(!mailEnabled || working) return;
    working=true;
    try { await processReviewMail(store,m=>resendNotification(m,{apiKey:process.env.AMPOWER_RESEND_KEY,from:process.env.AMPOWER_MAIL_FROM}),`${process.env.AMPOWER_REVIEWS_ORIGIN}/admin/opinie/`); }
    catch { console.error('Nie potwierdzono obsługi kolejki powiadomień opinii.'); }
    finally { working=false; }
  },15000);
  timer.unref();
  const stop=()=>{clearInterval(timer); server.close(()=>{store.close();process.exit();});};
  process.on('SIGINT',stop); process.on('SIGTERM',stop);
}
