import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {decodeProfile,loadDataset} from '../pv-mining/data-loader.js';
const data=await Promise.all(['market','models','profile'].map(n=>readFile(new URL(`../pv-mining/data/${n}.json`,import.meta.url),'utf8').then(JSON.parse)));
const packed=rows=>({format:'ampower-pv-hourly-v1',start:rows[0][0],values:rows.map(r=>r[1])});
const fetcher=profile=>async url=>({ok:true,json:async()=>url.includes('profile')?profile:url.includes('models')?data[1]:data[0]});
test('AUD-012: build representation preserves every bundled timestamp and floating point value',async()=>{
 const p=packed(data[2]);assert.deepEqual(decodeProfile(p),data[2]);assert.deepEqual(await loadDataset(fetcher(p)),data);
 assert.ok(Buffer.byteLength(JSON.stringify(p))<60000);assert.deepEqual(decodeProfile(data[2]),data[2]);
});
for(const year of [2023,2024])test(`AUD-012: compact ${year} has exactly the original full-year intervals`,async()=>{
 const start=Date.UTC(year,0,1,0,10),end=Date.UTC(year+1,0,1,0,10);
 const rows=Array.from({length:(end-start)/3600000},(_,i)=>[new Date(start+i*3600000).toISOString().replace('.000Z','Z'),i%2?0.1234567890123456:0]);
 assert.deepEqual((await loadDataset(fetcher(packed(rows))))[2],rows);
});
test('AUD-012: malformed compact data reject, never turn missing data into zero',async()=>{
 for(const mutate of [p=>p.format='unknown',p=>p.start='2023-02-30T00:10:00Z',p=>p.start='invalid',p=>p.start='2024-01-01T00:10:00Z',p=>p.values.pop(),p=>p.values[10]=null,p=>p.values[10]='0',p=>p.values[10]=-1,p=>p.values[10]=3,p=>delete p.values[10]]){
  const p=packed(data[2]);mutate(p);await assert.rejects(()=>loadDataset(fetcher(p)));
 }
});
