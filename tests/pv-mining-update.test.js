import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,mkdtemp,readdir,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {pathToFileURL} from 'node:url';
import {collectMarket,stageSnapshot,difficultyFromBits} from '../scripts/pv-mining-update.mjs';
const market=JSON.parse(await readFile(new URL('../pv-mining/data/market.json',import.meta.url)));
const now=Date.parse(market.observedAt),hash=i=>i.toString(16).padStart(64,'0');
const blocks=Array.from({length:6},(_,i)=>({id:hash(i+1),height:market.height-i,timestamp:now/1000-i*600,bits:0x1701e63a}));
const fixture=async url=>{
  let data;
  if(url.includes('coinbase'))data={data:{currency:'PLN',amount:String(market.btcPln)}};
  else if(url.endsWith('/blocks'))data=blocks;
  else if(url.includes('/txid/0')){const id=url.split('/block/')[1].slice(0,64);return {ok:true,text:async()=>id};}
  else if(url.includes('/tx/')){const id=url.split('/tx/')[1];data={vin:[{is_coinbase:true}],vout:[{value:313500000}],status:{confirmed:true,block_hash:id}};}
  else throw new Error('unknown fixture URL');
  return {ok:true,json:async()=>data};
};
test('difficulty compact target is decoded independently at genesis',()=>{assert.equal(difficultyFromBits(0x1d00ffff),1);assert.throws(()=>difficultyFromBits(0));});
test('market adapter separates spot and six-block fee sample with correct satoshi conversion',async()=>{
  const updated=await collectMarket(market,{fetcher:fixture,now});assert.equal(updated.btcPln,market.btcPln);assert.ok(Math.abs(updated.feeBtc-.01)<1e-9);assert.equal(updated.feeSample.blocks,6);assert.equal(updated.height,market.height);assert.ok(updated.sources.some(s=>s.url.includes('mempool')));
});
test('API failure or extreme price cannot manufacture fresh data',async()=>{
  for(const fetcher of [async()=>({ok:false,status:503}),async url=>url.includes('coinbase')?{ok:true,json:async()=>({data:{currency:'PLN',amount:'1e99'}})}:fixture(url)])await assert.rejects(()=>collectMarket(market,{fetcher,now}));
});
test('snapshot staging validates the group, preserves source files and writes manifest only after success',async()=>{
  const dir=await mkdtemp(tmpdir()+'/ampower-pv-update-'),output=pathToFileURL(dir+'/');
  try{
    const original=await readFile(new URL('../pv-mining/data/market.json',import.meta.url),'utf8');
    await assert.rejects(()=>stageSnapshot({fetcher:async()=>({ok:false,status:429}),now,output}));assert.deepEqual(await readdir(dir),[]);
    const result=await stageSnapshot({fetcher:fixture,now,output});assert.ok((await readdir(result.dir)).includes('manifest.json'));
    assert.equal(await readFile(new URL('../pv-mining/data/market.json',import.meta.url),'utf8'),original);
  }finally{await rm(dir,{recursive:true,force:true});}
});
