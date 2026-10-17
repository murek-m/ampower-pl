import { mkdir, open, readdir, rename, unlink, lstat } from 'node:fs/promises';
import { constants } from 'node:fs';
import { createHash, randomUUID } from 'node:crypto';
import { join, resolve } from 'node:path';
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
    const path = join(this.directory, '.lock');
    let lock;
    const deadline = Date.now() + 5000;
    while (!lock) {
      try { lock = await open(path, 'wx', 0o600); }
      catch (error) { if (error.code !== 'EEXIST' || Date.now() > deadline) throw error; await new Promise(resolve => setTimeout(resolve, 25)); }
    }
    try { return await fn(); } finally { await lock.close(); await unlink(path); }
  }
  async readPrivate(path) {
    const file = await open(path, constants.O_RDONLY | constants.O_NOFOLLOW);
    try {
      const info = await file.stat();
      if (!info.isFile() || info.mode & 0o077 || process.getuid && info.uid !== process.getuid()) throw new Error('Plik danych wymaga prywatnych uprawnień 0600');
      return JSON.parse(await file.readFile('utf8'));
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
  async erase(record, actor, now = new Date()) {
    // Zachowaj wyłącznie znacznik idempotencji i audyt usunięcia, bez klienta i ofert.
    await this.put(record.storageKey, {storageKey:record.storageKey,deleted:true,payloadHash:null,
      receipt:{inquiryId:record.receipt.inquiryId,accepted:false},data:{},notification:{status:'deleted'},
      audit:[{action:'data-erased',actor,at:now.toISOString()}]});
  }
}
export const fingerprint = data => digest(JSON.stringify(data));
