import test from 'node:test';
import assert from 'node:assert/strict';
import {normalize,assumptionIssues} from '../pv-mining/engine.js';
const market={btcPln:300000,difficulty:1e12,feeBtc:.01};
const required=['pvKwp','profileWeather','capacity','usableFraction','reserve','chargeKw','dischargeKw','roundtrip','wear','importPrice','eligiblePrice','depositUse','depositFactor','exportPrice','btcPrice','difficulty','feesBtc','difficultyGrowth','btcGrowth','poolFee','firmwareFee','availability','quantity','extraWatts','startMinutes','startMargin','minRunMinutes','minOffMinutes','gridLimit','maintenance','emsWatts','lifetime','horizon','discount'];
test('AUD-005: explicit empty/invalid required assumptions cannot silently use defaults',()=>{
 for(const key of required)for(const value of ['',null,'  ','bad',NaN,Infinity]){
  const raw={battery:'existing',exportMode:'manual',[key]:value};
  assert.ok(assumptionIssues(raw).some(i=>i.key===key),`${key}: ${String(value)}`);
  assert.throws(()=>normalize(raw,market),`${key}: ${String(value)}`);
 }
});
test('AUD-005: optional values remain optional and explicit permitted zero is preserved',()=>{
 const s=normalize({annualLoad:'',annualProduction:'',knownSurplus:'',hashprice:'',infraBudget:'',batteryBudget:'',budget:'',costs:{ems:''},pvKwp:0,importPrice:0,eligiblePrice:0,emsWatts:0},market);
 assert.equal(s.annualLoad,5000);for(const k of ['annualProduction','knownSurplus','hashprice','infraBudget','batteryBudget'])assert.equal(s[k],null);
 assert.equal(s.costs.ems,null);for(const k of ['pvKwp','importPrice','eligiblePrice','emsWatts'])assert.equal(s[k],0);
 assert.doesNotThrow(()=>normalize({battery:'none',capacity:'',exportMode:'historical',exportPrice:'',pvKwp:'',profileWeather:''},market,true));
});

import {calculate,makeProfile,parseCsv} from '../pv-mining/engine.js';
const energyMarket={observedAt:'2026-12-31T23:59:00Z',height:900000,difficulty:1e12,feeBtc:0,btcPln:500000};
const device={id:'oracle',th:100,watts:1000,price:1000};
const setup={selected:['oracle'],horizon:1,lifetime:1,costMode:'budget',infraBudget:0,maintenance:0,emsWatts:0,extraWatts:0,startMinutes:0,startMargin:0,minRunMinutes:0,minOffMinutes:0,poolFee:0,firmwareFee:0,availability:100,difficultyGrowth:0,btcGrowth:0,importPrice:1,eligiblePrice:1,exportPrice:0};
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-6,`${a} != ${b}`);
function constant(pv=1,load=0,year=2023){const begin=Date.UTC(year,0,1),hours=(Date.UTC(year+1,0,1)-begin)/3600000;return {source:'csv',hours,rows:Array.from({length:hours},(_,h)=>({stamp:begin+h*3600000,dt:1,pv:typeof pv==='function'?pv(h):pv,load}))};}
function energy(raw={},profile=constant()){return calculate({...setup,...raw},[],energyMarket,[device],profile);}
function balance(a){near(a.pv+a.grid,a.houseLoad+a.emsEnergy+a.energy+a.export+a.losses+a.endSoc-a.startSoc);near(a.emsEnergy,a.emsPv+a.emsBattery+a.emsGrid);for(const m of a.monthly)near(m.ems,m.emsPv+m.emsBattery+m.emsGrid);}
test('AUD-008: EMS consumes surplus before ASIC; no invented grid cost',()=>{
 const d=energy({emsWatts:200}),a=d.results[0].annual[0];
 near(a.emsEnergy,1752);near(a.emsPv,1752);near(a.grid,0);near(a.energy,0);near(a.export,7008);near(a.opex,0);near(d.baseline.emsEnergy,0);balance(a);
});
test('AUD-008: grid EMS is billed once even with unavailable ASIC and existing EMS hardware',()=>{
 const d=energy({emsWatts:200,emsExisting:true,availability:0,maintenance:100},constant(0)),a=d.results[0].annual[0];
 near(a.emsGrid,1752);near(a.grid,1752);near(a.billDifference,-1752);near(a.opex,100);near(a.benefit,-1852);near(a.energy,0);balance(a);
 near(energy({emsExisting:true,emsWatts:0},constant(0)).results[0].annual[0].emsEnergy,0);
});
test('AUD-008: EMS may draw battery energy, stops after ASIC life; new battery remains',()=>{
 const d=energy({emsWatts:200,battery:'new',batteryBudget:1000,capacity:10,availability:0,horizon:2},constant(h=>h%24<12?2:0)),r=d.results[0];
 assert.ok(r.annual[0].emsBattery>0);near(r.annual[0].emsEnergy,1752);near(r.annual[1].emsEnergy,0);near(r.annual[1].energy,0);for(const a of r.annual)balance(a);
 near(r.annual[0].combinedBenefit,r.annual[0].value+r.annual[0].billDifference-r.annual[0].opex-r.annual[0].wear); // no-house/no-EMS baseline bill is zero in both baselines
});
test('AUD-009: bundled and CSV reference years use actual duration, including EMS hours',()=>{
 for(const year of [2023,2024]){
  const p=constant(0,0,year),data=p.rows.map(r=>[new Date(r.stamp).toISOString(),0]);const bundled=makeProfile(data,normalize(setup,energyMarket));
  near(bundled.hours,p.hours);near(bundled.rows.reduce((n,r)=>n+r.dt,0),p.hours);
  const csv=parseCsv('timestamp,pv_kw,load_kw\n'+data.map(([t])=>`${t.replace(".000","")},0,0`).join('\n'));near(csv.hours,bundled.hours);
  const d=calculate({...setup,emsWatts:200,horizon:2,lifetime:2,availability:0},data,energyMarket,[device]);
  for(const a of d.results[0].annual){near(a.emsEnergy,p.hours*.2);near(a.billDifference,-p.hours*.2);balance(a);}
 }
});

test('AUD-009: repeated leap-year offsets match an independent difficulty-growth oracle',()=>{
 const p=constant(2,0,2024),raw={...setup,horizon:2,lifetime:2,difficultyGrowth:15};
 const d=calculate(raw,p.rows.map(r=>[new Date(r.stamp).toISOString(),r.pv]),energyMarket,[device]);
 for(let y=0;y<2;y++){
  let expected=0;
  for(let h=0;h<8784;h++){
   const elapsed=60+(y*8784+h)*3600,subsidy=50/2**Math.floor((energyMarket.height+elapsed/600)/210000);
   expected+=100e12*3600*subsidy/(1e12*1.15**(elapsed/(365.25*86400))*2**32);
  }
  near(d.results[0].annual[y].btc,expected);
 }
});
