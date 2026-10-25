import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {calculate,normalize,parseCsv} from '../pv-mining/engine.js';
import {validateDataset,freshness,offerEligible} from '../pv-mining/data-loader.js';
import {barChart,lineChart} from '../pv-mining/charts.js';
const [market,models,profile]=await Promise.all(['market','models','profile'].map(async n=>JSON.parse(await readFile(new URL(`../pv-mining/data/${n}.json`,import.meta.url)))));
const near=(a,b,t=1e-7)=>assert.ok(Math.abs(a-b)<t,`${a} != ${b}`);
const base={selected:['s21-151'],costMode:'budget',infraBudget:0,maintenance:0,emsWatts:0};
function annual(pv,load,dt=1){return {source:'csv',hours:8760,rows:Array.from({length:8760/dt},(_,i)=>({stamp:Date.UTC(2023,0,1)+i*dt*3600000,pv:typeof pv==='function'?pv(i*dt):pv,load:typeof load==='function'?load(i*dt):load,dt}))};}
test('E01: unavailable ASIC gets no battery-control credit under either EMS policy',()=>{
  for(const policy of ['home','economic']){
    const d=calculate({...base,pvKwp:20,battery:'existing',capacity:20,policy,availability:0,exportPrice:1,horizon:3},profile,market,models);
    const a=d.results[0].annual[0];assert.equal(a.btc,0);assert.equal(a.energy,0);near(a.benefit,0);near(a.batteryHouse,d.baseline.batteryHouse);near(a.billDifference,0);assert.equal(d.results[0].planner.chosen,'off');
  }
});
test('E02: full ledger rejects the 4380-hour plan that loses money without OPEX',()=>{
  const device={id:'audit',th:1,watts:6000,price:0};
  const d=calculate({...base,selected:['audit'],horizon:1,lifetime:1,extraWatts:0,startMinutes:0,startMargin:0,poolFee:0,firmwareFee:0,availability:100,difficultyGrowth:0,exportPrice:.25,eligiblePrice:1,importPrice:1},[],market,[device],annual(h=>h%24<12?6:0,h=>h%24>=12?.1:0));
  const r=d.results[0];assert.ok(r.annual[0].benefit>=-1e-7);assert.equal(r.annual[0].hours,0);assert.equal(r.planner.chosen,'off');near(r.annual[0].billDifference,0);
});
test('complete-ledger candidate search never loses to off before fixed costs over its horizon',()=>{
  for(const exportPrice of [-.1,0,.25,1])for(const battery of ['none','existing']){
    const r=calculate({...base,horizon:2,lifetime:1,battery,capacity:5,policy:'economic',batteryMining:true,exportPrice,negativeFloor:false,gridLimit:1},[],market,models,annual(h=>h%24<10?6:0,.25)).results[0];
    assert.ok(r.annual.reduce((s,a)=>s+a.benefit,0)>=-1e-6);
    assert.ok(r.planner.operatingGain>=-1e-6);
  }
});
test('energy sources reconcile at annual and monthly boundaries, including grid-only mining',()=>{
  for(const [pv,battery] of [[0,'none'],[4,'existing']]){
    const r=calculate({...base,battery,capacity:10,batteryMining:true,btcPrice:1e7,importPrice:.01,eligiblePrice:.01,gridLimit:10,startMargin:0,horizon:1},[],market,models,annual(pv,.5)).results[0].annual[0];
    near(r.energy,r.asicPv+r.batteryMining+r.asicGrid,1e-5);
    for(const m of r.monthly)near(m.asic,m.asicPv+m.asicBattery+m.asicGrid,1e-6);
    if(!pv){assert.ok(r.asicGrid>0);near(r.asicPv,0);near(r.energy,r.asicGrid,1e-5);}
  }
});
test('C01: unknown default costs and new-battery price block payback; explicit zero remains valid',()=>{
  for(const raw of [{selected:['s21-151']},{...base,infraBudget:''},{...base,battery:'new',capacity:10,batteryBudget:''}]){
    const r=calculate(raw,profile,market,models).results[0];assert.equal(r.validEconomics,false);assert.equal(r.payback,null);assert.equal(r.npv,null);
  }
  assert.equal(calculate(base,profile,market,models).results[0].validEconomics,true);
});
test('V01: conflicting SOC, prices and PV totals fail explicitly instead of silent correction',()=>{
  for(const raw of [{battery:'existing',reserve:95,usableFraction:10},{eligiblePrice:2,importPrice:1},{pvKwp:0,annualProduction:100}])assert.throws(()=>normalize(raw,market));
  assert.doesNotThrow(()=>normalize({pvKwp:0,annualProduction:100},market,true));
  const d=calculate({...base,annualLoad:''},profile,market,models);assert.match(d.assumptionNotes.join(),/5000/);
});
test('D02: future dates, extreme prices, inconsistent efficiency and shifted weather year reject separately',()=>{
  for(const change of [d=>d[0].observedAt='2099-01-01',d=>d[0].btcPln=1e99,d=>d[1][0].efficiency=999,d=>d[1][0].id='bad" onclick="x',d=>d[2]=d[2].map(([t,p])=>[new Date(Date.parse(t)+20*86400000).toISOString(),p])]){
    const d=structuredClone([market,models,profile]);change(d);assert.throws(()=>validateDataset(d));
  }
  assert.equal(freshness({...market,observedAt:'2099-01-01'},models).marketStale,true);
});
test('D01: only current confirmed in-stock delivery-inclusive offers qualify',()=>{
  const now=Date.parse(market.observedAt),m={...models[0],offer:{status:'confirmed',stock:'available',includesDelivery:true,finalGrossPln:models[0].price,verifiedAt:market.observedAt}};
  assert.equal(offerEligible(m,now),true);
  for(const change of [o=>o.stock='sold-out',o=>o.status='unconfirmed',o=>o.includesDelivery=false,o=>o.finalGrossPln=null,o=>o.verifiedAt='2099-01-01']){const d=structuredClone(m);change(d.offer);assert.equal(offerEligible(d,now),false);}
  assert.equal(offerEligible(m,now+8*86400000),false);assert.ok(models.every(m=>!offerEligible(m,now)));
});
test('U01/U04/A02: SVG remains finite and bounded with zero PV or zero financial result; energy table exists',()=>{
  const m=Array.from({length:12},()=>({pv:0,house:4,asic:2000,asicPv:0,asicBattery:0,asicGrid:2000}));
  const bars=barChart(m);for(const [,height]of bars.matchAll(/height="([^"]+)"/g))assert.ok(Number(height)>=0&&Number(height)<=155);
  assert.match(bars,/<table>/);assert.match(bars,/Sieć → ASIC/);
  for(const values of [[0],[0,0],[-10,-10],[10,10]])assert.doesNotMatch(lineChart(values.map(result=>({result})),0),/NaN|Infinity/);
});
test('E03: payback after ASIC life is flagged separately from continued BTC production',()=>{
  const r=calculate({...base,lifetime:1,horizon:10,btcGrowth:100,devicePrices:{'s21-151':10000},exportMode:'historical'},profile,market,models).results[0];
  assert.ok(r.payback>1);assert.equal(r.paybackAfterLife,true);assert.equal(r.annual[1].btc,0);
});
test('CSV byte bound is checked as bytes, including multi-byte input',()=>assert.throws(()=>parseCsv('ą'.repeat(4_000_001)),/8 MB/));
test('Hydro requires explicit loop cost and power confirmation before investment verdict',()=>{
  const r=calculate({...base,selected:['s23-hydro']},profile,market,models).results[0];assert.equal(r.validEconomics,false);assert.equal(r.payback,null);
  const costs=Object.fromEntries(['meter','ems','electrical','wiring','ventilation','labor','shipping'].map(key=>[key,0]));
  assert.equal(calculate({...base,selected:['s23-hydro'],costMode:'detailed',costs,extraWatts:500,hydroConfirmed:true},profile,market,models).results[0].validEconomics,true);
});
