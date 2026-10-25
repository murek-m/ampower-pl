import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {calculate} from '../pv-mining/engine.js';
import {profileExpired,PROFILE_TTL_MS,writeSession,clearSession} from '../pv-mining/session.js';
import {validateDataset} from '../pv-mining/data-loader.js';
const data=await Promise.all(['market','models','profile'].map(async n=>JSON.parse(await readFile(new URL(`../pv-mining/data/${n}.json`,import.meta.url)))));
const [market,models,profile]=data;
test('F01: first payback and later loss remain separate for held BTC and annual sale',()=>{
  const params={pvKwp:10,selected:['s21-151'],costMode:'budget',infraBudget:0,devicePrices:{'s21-151':100},btcPrice:900000,btcGrowth:-50,maintenance:300,emsWatts:8,horizon:10,lifetime:5,exportMode:'historical'};
  for(const sellBtc of [false,true]){
    const r=calculate({...params,sellBtc},profile,market,models).results[0];
    const loss=r.annual.findIndex((a,i)=>i+1>r.payback&&a.result<0)+1||null;
    assert.equal(r.lossAfterPayback,loss);assert.equal(r.paybackReversed,loss!==null);
    if(!sellBtc){assert.equal(r.payback,1);assert.equal(r.lossAfterPayback,3);assert.ok(r.annual.at(-1).result<0);}
  }
  const r=calculate({...params,infraBudget:''},profile,market,models).results[0];
  assert.equal(r.payback,null);assert.equal(r.lossAfterPayback,null);assert.equal(r.paybackReversed,false);
});
test('F09: local CSV expiry boundaries reject missing, legacy and future metadata',()=>{
  const now=Date.now(),record={version:2,updatedAt:now};
  assert.equal(profileExpired(record,now),false);
  assert.equal(profileExpired(record,now+PROFILE_TTL_MS-1),false);
  assert.equal(profileExpired(record,now+PROFILE_TTL_MS),true);
  assert.equal(profileExpired({...record,updatedAt:now+300001},now),true);
  assert.equal(profileExpired({source:'csv'},now),true);
  assert.equal(profileExpired(null,now),true);
});
test('F05/F10: inputs are recorded synchronously and corrupt JSON cannot prevent reset',async()=>{
  const original=globalThis.sessionStorage;
  let encoded='{broken-json';
  globalThis.sessionStorage={getItem:()=>encoded,setItem:(_,v)=>{encoded=v;},removeItem:()=>{encoded=null;}};
  try{
    await clearSession();assert.equal(encoded,null);
    const pending=writeSession({raw:{pvKwp:40},draft:'Dopisek klienta'});
    assert.equal(JSON.parse(encoded).raw.pvKwp,40);assert.equal(JSON.parse(encoded).draft,'Dopisek klienta');
    await pending;await clearSession();assert.equal(encoded,null);
  }finally{if(original===undefined)delete globalThis.sessionStorage;else globalThis.sessionStorage=original;}
});
test('F11: catalogue rejects nonnumeric noise and oversized text',()=>{
  for(const mutate of [m=>m.noise='<b>bad</b>',m=>m.name='x'.repeat(2001),m=>m.noise=151]){
    const copy=structuredClone(data);mutate(copy[1][0]);assert.throws(()=>validateDataset(copy));
  }
  const safe=structuredClone(data);safe[1][0].name='<b>literal text</b>';assert.doesNotThrow(()=>validateDataset(safe));
});
