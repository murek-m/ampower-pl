import { DatabaseSync } from 'node:sqlite';
import { mkdirSync, openSync, closeSync, lstatSync, statfsSync, realpathSync } from 'node:fs';
import { constants } from 'node:fs';
import { join, resolve, relative } from 'node:path';
import { randomUUID } from 'node:crypto';

export const REVIEW_SERVICES = Object.freeze(['Klimatyzacja','Instalacje elektryczne','Monitoring','Alarmy','Nawadnianie ogrodu','Smart Home & Energy','Inna usługa']);
export const reviewError = (message, status = 422) => Object.assign(new Error(message), { status });

// Oddzielny magazyn: nie otwiera danych klientów ani kosztorysów z panelu Energy.
export class ReviewsStore {
  constructor(directory,{maxBytes=512*1024*1024,minFreeBytes=16*1024*1024}={}) {
    this.directory = resolve(directory);
    mkdirSync(this.directory, { recursive:true, mode:0o700 });
    const info = lstatSync(this.directory);
    if (!info.isDirectory() || info.isSymbolicLink() || info.mode & 0o077 || process.getuid && info.uid !== process.getuid()) throw new Error('Opinie wymagają prywatnego katalogu 0700');
    this.directory=realpathSync(this.directory);
    const repository=realpathSync(new URL('..',import.meta.url)),outside=relative(repository,this.directory);
    if(!(outside==='..'||outside.startsWith('../'))) throw new Error('Magazyn opinii musi być poza repozytorium, również po rozwiązaniu dowiązań.');
    const file = join(this.directory, 'reviews.sqlite');
    const fd = openSync(file, constants.O_CREAT | constants.O_RDWR | constants.O_NOFOLLOW, 0o600);
    closeSync(fd);
    const stat = lstatSync(file);
    if (!stat.isFile() || stat.mode & 0o077 || process.getuid && stat.uid !== process.getuid()) throw new Error('Baza opinii wymaga prywatnego pliku 0600');
    this.db = new DatabaseSync(file);
    if(!Number.isSafeInteger(maxBytes)||maxBytes<65536||!Number.isSafeInteger(minFreeBytes)||minFreeBytes<0) throw new Error('Nieprawidłowy limit magazynu opinii');
    this.maxBytes=maxBytes;this.minFreeBytes=minFreeBytes;
    this.db.exec(`PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000; PRAGMA secure_delete=ON;
      CREATE TABLE IF NOT EXISTS reviews (
        id TEXT PRIMARY KEY, request_key TEXT UNIQUE NOT NULL, payload_hash TEXT NOT NULL,
        first_name TEXT NOT NULL, initial TEXT NOT NULL, city TEXT NOT NULL, service TEXT NOT NULL,
        rating INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 5), text TEXT NOT NULL, photo BLOB,
        status TEXT NOT NULL DEFAULT 'pending', reply TEXT NOT NULL DEFAULT '', reason TEXT NOT NULL DEFAULT '',
        created_at TEXT NOT NULL, version INTEGER NOT NULL DEFAULT 1, consent_version TEXT NOT NULL,
        mail_state TEXT NOT NULL, mail_attempts INTEGER NOT NULL DEFAULT 0,
        mail_first INTEGER, mail_next INTEGER NOT NULL DEFAULT 0, mail_lease INTEGER NOT NULL DEFAULT 0,
        mail_provider_id TEXT, mail_token TEXT, audit TEXT NOT NULL DEFAULT '[]'
      ); CREATE INDEX IF NOT EXISTS reviews_status ON reviews(status, created_at);`);
    const pageSize=this.db.prepare('PRAGMA page_size').get().page_size;
    this.db.exec(`PRAGMA max_page_count=${Math.floor(maxBytes/pageSize)}`);
  }
  close() { this.db.close(); }
  readiness() {
    try {
      const pages=this.db.prepare('PRAGMA page_count').get().page_count,size=this.db.prepare('PRAGMA page_size').get().page_size;
      const disk=statfsSync(this.directory),freeBytes=disk.bavail*disk.bsize,databaseBytes=pages*size;
      this.db.prepare('SELECT id FROM reviews LIMIT 1').get();
      return {ok:databaseBytes<this.maxBytes&&freeBytes>=this.minFreeBytes,databaseBytes,maxBytes:this.maxBytes,freeBytes};
    }catch{return {ok:false};}
  }
  transaction(callback) {
    this.db.exec('BEGIN IMMEDIATE');
    try { const result = callback(); this.db.exec('COMMIT'); return result; }
    catch (error) { this.db.exec('ROLLBACK'); throw error; }
  }
  submit(data, key, hash, photo, now, mailEnabled) {
    return this.transaction(() => {
      const prior = this.db.prepare('SELECT id, payload_hash, status FROM reviews WHERE request_key=?').get(key);
      if (prior) {
        if (prior.payload_hash !== hash || prior.status === 'deleted') throw reviewError('Ta próba dotyczy innych danych. Odśwież formularz.',409);
        return { accepted:true, id:prior.id };
      }
      const capacity=this.readiness();
      if(!capacity.ok || capacity.databaseBytes+(photo?.length||0)+Buffer.byteLength(JSON.stringify(data))*2+16384>this.maxBytes) throw reviewError('Dodawanie opinii jest chwilowo niedostępne. Spróbuj ponownie później.',503);
      const id = randomUUID();
      this.db.prepare(`INSERT INTO reviews (id,request_key,payload_hash,first_name,initial,city,service,rating,text,photo,created_at,consent_version,mail_state,audit)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(id,key,hash,data.firstName,data.initial,data.city,data.service,data.rating,data.text,photo,now.toISOString(),'reviews-v1',mailEnabled?'pending':'disabled',JSON.stringify([{action:'submitted',at:now.toISOString()}]));
      return { accepted:true, id };
    });
  }
  project(row, admin = false) {
    const result = { id:row.id, name:`${row.first_name} ${row.initial}.`, city:row.city, service:row.service, rating:row.rating,
      text:row.text, createdAt:row.created_at, reply:row.reply, photoUrl:row.has_photo ? `/api/reviews/${row.id}/photo` : null };
    if (admin) Object.assign(result,{ status:row.status, reason:row.reason, version:row.version, mailState:row.mail_state, audit:JSON.parse(row.audit) });
    return result;
  }
  list({ offset=0, limit=3, admin=false, status='all', cursor=null } = {}) {
    if(!['all','pending','published','rejected'].includes(status)) throw reviewError('Nieprawidłowa grupa opinii.');
    let boundary=null;
    if(cursor) {
      try {
        if(typeof cursor!=='string' || cursor.length>256 || !/^[A-Za-z0-9_-]+$/.test(cursor)) throw new Error();
        boundary=JSON.parse(Buffer.from(cursor,'base64url').toString('utf8'));
        if(!Array.isArray(boundary)||boundary.length!==2||typeof boundary[0]!=='string'||new Date(boundary[0]).toISOString()!==boundary[0]||!/^\w{8}-\w{4}-4\w{3}-[89ab]\w{3}-\w{12}$/.test(boundary[1])) throw new Error();
      } catch {throw reviewError('Nieprawidłowa strona opinii.');}
      if(offset) throw reviewError('Nie łącz kursora z przesunięciem.');
    }
    const where = admin ? status==='all'?"status != 'deleted'":`status = '${status}'` : "status = 'published'";
    const stats = this.db.prepare(`SELECT COUNT(*) AS total, AVG(rating) AS average FROM reviews WHERE ${where}`).get();
    const rows = this.db.prepare(`SELECT id,first_name,initial,city,service,rating,text,photo IS NOT NULL AS has_photo,status,reply,reason,created_at,version,mail_state,audit FROM reviews WHERE ${where}${boundary?' AND (created_at < ? OR (created_at = ? AND id < ?))':''} ORDER BY created_at DESC,id DESC LIMIT ? OFFSET ?`).all(...(boundary?[boundary[0],boundary[0],boundary[1]]:[]),limit+1,offset);
    const hasMore=rows.length>limit; if(hasMore) rows.pop();
    const last=rows.at(-1),nextCursor=hasMore?Buffer.from(JSON.stringify([last.created_at,last.id])).toString('base64url'):null;
    const counts=admin?Object.fromEntries(this.db.prepare("SELECT status,COUNT(*) AS count FROM reviews WHERE status!='deleted' GROUP BY status").all().map(r=>[r.status,r.count])):undefined;
    return { reviews:rows.map(row=>this.project(row,admin)), total:stats.total, average:stats.average === null ? null : Math.round(stats.average*10)/10,nextCursor,...(admin?{counts}: {}) };
  }
  photo(id, admin) {
    const row = this.db.prepare('SELECT photo,status FROM reviews WHERE id=?').get(id);
    return row?.photo && row.status !== 'deleted' && (admin || row.status === 'published') ? Buffer.from(row.photo) : null;
  }
  moderate(id, body, now) {
    return this.transaction(() => {
      const row = this.db.prepare("SELECT * FROM reviews WHERE id=? AND status != 'deleted'").get(id);
      if (!row) throw reviewError('Nie znaleziono opinii.',404);
      if (body.version !== row.version) throw reviewError('Opinia zmieniła się w innej karcie. Odśwież listę.',409);
      if (!['publish','reject','reply','delete'].includes(body.action)) throw reviewError('Nieznana operacja.');
      const reason = typeof body.reason === 'string' ? body.reason.trim() : '';
      const reply = typeof body.reply === 'string' ? body.reply.trim() : '';
      if (reason.length > 500 || reply.length > 2000) throw reviewError('Odpowiedź lub powód jest za długi.');
      if (body.action === 'reject' && reason.length < 5) throw reviewError('Podaj powód odrzucenia, np. spam lub ujawnienie danych. Sama niska ocena nie jest powodem.');
      const audit = JSON.parse(row.audit); audit.push({action:body.action,at:now.toISOString()});
      if (body.action === 'delete') {
        if (body.confirm !== id) throw reviewError('Potwierdź usunięcie tej opinii.');
        this.db.prepare(`UPDATE reviews SET first_name='',initial='',city='',service='',text='',photo=NULL,reply='',reason='',payload_hash='',status='deleted',mail_state='disabled',mail_provider_id=NULL,audit=?,version=version+1 WHERE id=?`).run(JSON.stringify([{action:'deleted',at:now.toISOString()}]),id);
      } else {
        this.db.prepare('UPDATE reviews SET status=?,reply=?,reason=?,audit=?,version=version+1 WHERE id=?').run(body.action==='publish'?'published':body.action==='reject'?'rejected':row.status,body.action==='reply'?reply:row.reply,body.action==='reject'?reason:body.action==='publish'?'':row.reason,JSON.stringify(audit),id);
      }
      return { ok:true };
    });
  }
  claimMail(now) {
    return this.transaction(() => {
      this.db.prepare(`UPDATE reviews SET mail_state='check-needed' WHERE mail_state IN ('pending','retry','sending') AND (mail_attempts>=8 OR (mail_first IS NOT NULL AND mail_first<=?))`).run(now-23*3600000);
      const row = this.db.prepare("SELECT id,mail_attempts FROM reviews WHERE mail_state IN ('pending','retry','sending') AND mail_next<=? AND mail_lease<=? ORDER BY created_at LIMIT 1").get(now,now);
      if (!row) return null;
      const token = randomUUID();
      this.db.prepare("UPDATE reviews SET mail_state='sending',mail_attempts=mail_attempts+1,mail_first=COALESCE(mail_first,?),mail_lease=?,mail_token=? WHERE id=?").run(now,now+30000,token,row.id);
      return { id:row.id, token, attempt:row.mail_attempts+1 };
    });
  }
  finishMail(claim, receipt, now) {
    this.db.prepare("UPDATE reviews SET mail_state=?,mail_provider_id=?,mail_next=?,mail_lease=0,mail_token=NULL WHERE id=? AND mail_token=? AND status!='deleted'").run(receipt?.id?'provider-accepted':'retry',receipt?.id || null,receipt?.id?0:now+Math.min(3600000,60000*2**(claim.attempt-1)),claim.id,claim.token);
  }
  purgeUnpublished(now = new Date()) {
    const cutoff=new Date(+now-90*86400000).toISOString();
    return this.db.prepare(`UPDATE reviews SET first_name='',initial='',city='',service='',text='',photo=NULL,reply='',reason='',payload_hash='',status='deleted',mail_state='disabled',mail_provider_id=NULL,audit='[]',version=version+1 WHERE status IN ('pending','rejected') AND created_at<?`).run(cutoff).changes;
  }
}
