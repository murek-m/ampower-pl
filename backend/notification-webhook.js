import { createHmac, timingSafeEqual } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { createServer } from 'node:http';
import { join } from 'node:path';
import { homedir } from 'node:os';
import { FileStore } from './store.js';
const failure=(message,status=400)=>Object.assign(new Error(message),{status});
export function verifyNotificationWebhook(raw,headers,secret,now=new Date()) {
  if (!Buffer.isBuffer(raw) || raw.length>65536 || typeof secret !== 'string' || !/^whsec_[A-Za-z0-9+/=]+$/.test(secret)) throw failure('Brak poprawnej konfiguracji webhooka',503);
  const id=headers['svix-id'],timestamp=headers['svix-timestamp'],signatures=headers['svix-signature'];
  if (typeof id !== 'string' || !/^[A-Za-z0-9_-]{1,200}$/.test(id) || typeof timestamp !== 'string' || !/^\d{10,12}$/.test(timestamp) || typeof signatures !== 'string' || signatures.length>4096 || Math.abs(+now/1000-Number(timestamp))>300) throw failure('Nieprawidłowy podpis webhooka',401);
  const key=Buffer.from(secret.slice(6),'base64');if(key.length<16)throw failure('Nieprawidłowy sekret webhooka',503);
  const expected=createHmac('sha256',key).update(`${id}.${timestamp}.`).update(raw).digest();
  const valid=signatures.split(' ').some(part=>{const [version,signature]=part.split(',');if(version!=='v1'||!signature)return false;const actual=Buffer.from(signature,'base64');return actual.length===expected.length&&timingSafeEqual(actual,expected);});
  if(!valid)throw failure('Nieprawidłowy podpis webhooka',401);
  let event;try{event=JSON.parse(raw.toString('utf8'));}catch{throw failure('Nieprawidłowy JSON');}
  return {id,event};
}
export async function applyNotificationWebhook(store,raw,headers,secret,now=new Date()) {
  const {id,event}=verifyNotificationWebhook(raw,headers,secret,now);
  const statuses={'email.delivered':'delivered','email.bounced':'bounced','email.complained':'complained'};
  const status=statuses[event?.type];if(!status)return {ignored:true};
  if(typeof event.data?.email_id !== 'string'||!Number.isFinite(Date.parse(event.created_at)))throw failure('Nieprawidłowe zdarzenie poczty');
  return store.transaction(async()=>{
    const record=(await store.records()).find(r=>r.notification?.providerId===event.data.email_id);
    if(!record)throw failure('Brak potwierdzenia dostawcy w kolejce; ponów zdarzenie',503);
    const n=record.notification;n.eventIds ||= [];
    if(n.eventIds.includes(id))return {duplicate:true};
    if(Date.parse(event.created_at)<Date.parse(n.lastEventAt||0))return {ignored:true};
    n.eventIds.push(id);n.eventIds=n.eventIds.slice(-128);
    if(!['bounced','complained'].includes(n.status)||status!=='delivered')n.status=status;
    n.lastEventAt=event.created_at;
    record.audit.push({action:'notification-'+status,at:now.toISOString(),eventId:id});
    await store.put(record.storageKey,record);return {ok:true};
  });
}
export function createNotificationWebhookServer({store,secret,clock=()=>new Date()}) {
  if(!secret)throw new Error('Webhook wymaga sekretu podpisu');
  const server=createServer(async(req,res)=>{
    const reply=(status,body)=>{res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','X-Robots-Tag':'noindex'});res.end(JSON.stringify(body));};
    if(req.url!=='/api/notifications/webhook')return reply(404,{error:'Nie znaleziono'});
    if(req.method!=='POST')return reply(405,{error:'Wymagany POST'});
    try{const chunks=[];let size=0;for await(const chunk of req){size+=chunk.length;if(size>65536)throw failure('Limit danych',413);chunks.push(chunk);}return reply(200,await applyNotificationWebhook(store,Buffer.concat(chunks),req.headers,secret,clock()));}
    catch(error){reply(error.status||503,{error:'Nie potwierdzono przyjęcia zdarzenia'});}
  });server.requestTimeout=15000;server.headersTimeout=10000;return server;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
  if(process.env.AMPOWER_OWNER_NOTIFICATIONS_APPROVED!=='yes')throw new Error('Webhook wymaga zatwierdzonej poczty');
  const server=createNotificationWebhookServer({store:new FileStore(process.env.AMPOWER_DATA_DIR||join(homedir(),'.local/share/ampower-sales')),secret:process.env.AMPOWER_WEBHOOK_SECRET});
  server.listen(8788,'127.0.0.1',()=>console.log('Webhook poczty: lokalny port 8788; produkcja wymaga HTTPS reverse proxy.'));
}
