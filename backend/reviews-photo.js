import { inflateSync } from 'node:zlib';
import { reviewError } from './reviews-store.js';

const signature = Buffer.from([137,80,78,71,13,10,26,10]);
const crcTable = Array.from({length:256},(_,n)=>{ for(let i=0;i<8;i++) n=n&1?0xedb88320^(n>>>1):n>>>1; return n>>>0; });
export function crc32(bytes) { let crc=0xffffffff; for(const byte of bytes) crc=crcTable[(crc^byte)&255]^(crc>>>8); return (crc^0xffffffff)>>>0; }

// Przeglądarka skaluje zdjęcie i zapisuje PNG. Serwer sprawdza strukturę i usuwa
// wszystkie dodatkowe chunki (w tym EXIF, tekst, profil i dane po końcu obrazu).
export function sanitizeReviewPhoto(encoded) {
  if (encoded === null || encoded === undefined || encoded === '') return null;
  if (typeof encoded !== 'string' || encoded.length > 2100000 || !/^[A-Za-z0-9+/]+={0,2}$/.test(encoded)) throw reviewError('Nieprawidłowe zdjęcie lub przekroczony limit 1,5 MB.');
  const source=Buffer.from(encoded,'base64');
  if (source.length > 1500000 || !source.subarray(0,8).equals(signature)) throw reviewError('Zdjęcie musi zostać przygotowane jako PNG.');
  const chunks=[], data=[]; let position=8, width, height, channels, ended=false, header=false;
  while(position+12<=source.length) {
    const length=source.readUInt32BE(position), end=position+12+length;
    if(end>source.length) throw reviewError('Uszkodzone zdjęcie.');
    const type=source.toString('ascii',position+4,position+8), bytes=source.subarray(position+8,position+8+length);
    if(crc32(source.subarray(position+4,position+8+length))!==source.readUInt32BE(position+8+length)) throw reviewError('Uszkodzone zdjęcie.');
    if(!header && type!=='IHDR') throw reviewError('Brak nagłówka zdjęcia.');
    if(type==='IHDR') {
      if(header || length!==13) throw reviewError('Nieprawidłowy nagłówek zdjęcia.');
      width=bytes.readUInt32BE(0); height=bytes.readUInt32BE(4); channels=bytes[9]===6?4:bytes[9]===2?3:0;
      if(!width || !height || width>1600 || height>1600 || !channels || bytes[8]!==8 || bytes[10] || bytes[11] || bytes[12]) throw reviewError('Zdjęcie musi być PNG RGB/RGBA do 1600 × 1600 pikseli.');
      header=true; chunks.push(source.subarray(position,end));
    } else if(type==='IDAT') { data.push(bytes); chunks.push(source.subarray(position,end)); }
    else if(type==='IEND') { if(length || !data.length) throw reviewError('Uszkodzone zdjęcie.'); chunks.push(source.subarray(position,end)); ended=true; break; }
    else if(!/^[a-z]/.test(type)) throw reviewError('Nieobsługiwany format zdjęcia.');
    position=end;
  }
  if(!ended) throw reviewError('Niekompletne zdjęcie.');
  const expected=(width*channels+1)*height;
  let raw; try { raw=inflateSync(Buffer.concat(data),{maxOutputLength:expected}); } catch { throw reviewError('Uszkodzone dane zdjęcia.'); }
  if(raw.length!==expected) throw reviewError('Nieprawidłowy rozmiar zdjęcia.');
  for(let row=0;row<height;row++) if(raw[row*(width*channels+1)]>4) throw reviewError('Uszkodzone dane zdjęcia.');
  return Buffer.concat([signature,...chunks]);
}
