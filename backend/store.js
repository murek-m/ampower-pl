import { mkdir, open, readdir, rename, unlink, lstat } from 'node:fs/promises';
import { constants } from 'node:fs';
import { createHash, randomUUID } from 'node:crypto';
import { join, resolve } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
const digest = value => createHash('sha256').update(value).digest('hex');
export class FileStore {
  constructor(directory) { this.directory = resolve(directory); }
  async init() {
    await mkdir(this.directory, { recursive: true, mode: 0o700 });
    const info = await lstat(this.directory);
    if (!info.isDirectory() || info.isSymbolicLink() || (info.mode & 0o077) || (process.getuid && info.uid !== process.getuid())) throw new Error('Magazyn wymaga prywatnego katalogu właściciela z prawami 0700');
  }
  path(key) { return join(this.directory, `${digest(key)}.json`); }
  async transaction(fn) {
    await this.init();
    // SQLite owns the OS lock: SIGKILL releases it without unsafe stale-file deletion.
    // Existing JSON records remain unchanged; this database only coordinates writers.
    const path = join(this.directory, '.transactions.sqlite');
    const file = await open(path, constants.O_CREAT | constants.O_RDWR | constants.O_NOFOLLOW, 0o600);
    try {
      const info = await file.stat();
      if (!info.isFile() || info.mode & 0o077 || process.getuid && info.uid !== process.getuid()) throw new Error('Blokada wymaga prywatnego pliku właściciela 0600');
    } finally { await file.close(); }
    const lock = new DatabaseSync(path);
    const deadline = Date.now() + 5000;
    let acquired = false;
    try {
      lock.exec('PRAGMA busy_timeout = 0');
      while (!acquired) {
        try { lock.exec('BEGIN IMMEDIATE'); acquired = true; }
        catch (error) {
          if (error.errcode !== 5 || Date.now() > deadline) throw error;
          await new Promise(resolve => setTimeout(resolve, 25));
        }
      }
      return await fn();
    } finally {
      if (acquired) lock.exec('ROLLBACK');
      lock.close();
    }
  }
  async readPrivate(path) {
    return JSON.parse((await this.readPrivateBytes(path)).toString('utf8'));
  }
  async readPrivateBytes(path) {
    const file = await open(path, constants.O_RDONLY | constants.O_NOFOLLOW);
    try {
      const info = await file.stat();
      if (!info.isFile() || info.mode & 0o077 || process.getuid && info.uid !== process.getuid()) throw new Error('Plik danych wymaga prywatnych uprawnień 0600');
      return await file.readFile();
    } finally { await file.close(); }
  }
  async get(key) { try { return await this.readPrivate(this.path(key)); } catch (e) { if (e.code === 'ENOENT') return null; throw e; } }
  async put(key, record) {
    const temp = join(this.directory, `.tmp-${randomUUID()}`);
    const file = await open(temp, 'wx', 0o600);
    try { await file.writeFile(JSON.stringify(record)); await file.sync(); } finally { await file.close(); }
    try { await rename(temp, this.path(key)); const dir = await open(this.directory, 'r'); try { await dir.sync(); } finally { await dir.close(); } }
    finally { await unlink(temp).catch(e => { if (e.code !== 'ENOENT') throw e; }); }
  }
  async records() {
    await this.init();
    const files = (await readdir(this.directory)).filter(f => /^[0-9a-f]{64}\.json$/.test(f));
    return (await Promise.all(files.map(f => this.readPrivate(join(this.directory, f))))).filter(r => !r.deleted);
  }
  async find(id) { return (await this.records()).find(r => r.receipt.inquiryId === id) || null; }
  pdfPath(inquiryId, key) {
    if (!/^[a-f0-9]{64}$/.test(key)) throw new Error('Nieprawidłowy klucz archiwum');
    return join(this.directory, `pdf-${digest(inquiryId)}-${key}.pdf`);
  }
  async archivedPdf(inquiryId, key) {
    try { return await this.readPrivateBytes(this.pdfPath(inquiryId,key)); }
    catch (error) { if (error.code === 'ENOENT') return null; throw error; }
  }
  async archivePdf(inquiryId, key, data) {
    const target = this.pdfPath(inquiryId,key);
    const temp = join(this.directory, `.tmp-pdf-${randomUUID()}`);
    const file = await open(temp,'wx',0o600);
    try { await file.writeFile(data); await file.sync(); } finally { await file.close(); }
    try { await rename(temp,target); const directory=await open(this.directory,'r'); try {await directory.sync();} finally {await directory.close();} }
    finally { await unlink(temp).catch(e=>{if(e.code !== 'ENOENT')throw e;}); }
  }
  async erase(record, actor, now = new Date()) {
    const prefix = `pdf-${digest(record.receipt.inquiryId)}-`;
    for (const file of await readdir(this.directory)) if (file.startsWith(prefix) && /^pdf-[a-f0-9]{64}-[a-f0-9]{64}\.pdf$/.test(file)) await unlink(join(this.directory,file));
    // Zachowaj wyłącznie znacznik idempotencji i audyt usunięcia, bez klienta i ofert.
    await this.put(record.storageKey, {storageKey:record.storageKey,deleted:true,payloadHash:null,
      receipt:{inquiryId:record.receipt.inquiryId,accepted:false},data:{},notification:{status:'deleted'},
      audit:[{action:'data-erased',actor,at:now.toISOString()}]});
  }
}
export const fingerprint = data => digest(JSON.stringify(data));
