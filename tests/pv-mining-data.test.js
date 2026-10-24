import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {loadDataset,validateDataset,freshness} from '../pv-mining/data-loader.js';
const data=await Promise.all(['market','models','profile'].map(async n=>JSON.parse(await readFile(new URL(`../pv-mining/data/${n}.json`,import.meta.url),'utf8'))));
test('bundled snapshot passes schema and freshness boundaries are deterministic',()=>{assert.deepEqual(validateDataset(data),data);assert.equal(freshness(data[0],data[1],Date.parse(data[0].observedAt)).marketStale,false);const aged=freshness(data[0],data[1],Date.parse(data[0].observedAt)+8*86400000);assert.equal(aged.marketStale,true);assert.equal(aged.staleOffers.length,data[1].length);});
test('HTTP failure, offline API and malformed JSON reject without zero fallback',async()=>{for(const fetcher of [async()=>({ok:false,status:503}),async()=>{throw new Error('offline');},async()=>({ok:true,json:async()=>{throw new SyntaxError('bad JSON');}})])await assert.rejects(()=>loadDataset(fetcher));});
test('invalid prices, difficulty, profile gaps and duplicate model IDs reject',()=>{for(const mutate of [d=>d[0].btcPln=0,d=>d[0].difficulty='invalid',d=>d[1][0].price=-1,d=>d[1].push(d[1][0]),d=>d[2].pop(),d=>d[2][1][0]=d[2][0][0]]){const d=structuredClone(data);mutate(d);assert.throws(()=>validateDataset(d));}});
test('loader fetches each source once with no-store and retains provenance',async()=>{const calls=[];const loaded=await loadDataset(async(url,options)=>{calls.push([url,options.cache]);const i=['market','models','profile'].findIndex(n=>url.includes(n));return {ok:true,json:async()=>data[i]};});assert.deepEqual(loaded,data);assert.equal(calls.length,3);assert.ok(calls.every(c=>c[1]==='no-store'));});
