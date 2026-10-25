import {readFile,writeFile} from 'node:fs/promises';
import {calculate,normalize,makeProfile} from '../../../../pv-mining/engine.js';
import {validateDataset,freshness} from '../../../../pv-mining/data-loader.js';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../../../../',import.meta.url));
const [market,models,profile]=await Promise.all(['market','models','profile'].map(async n=>JSON.parse(await readFile(root+'pv-mining/data/'+n+'.json','utf8'))));
const out={};
const base={selected:['s21-151'],exportMode:'historical',horizon:10,infraBudget:0,maintenance:0,emsWatts:0};
out.horizon=[];
for(const horizon of [1,3,10]){const r=calculate({...base,horizon},profile,market,models).results[0];out.horizon.push({horizon,year1Hours:r.annual[0].hours,benefit:r.annual[0].benefit});}
const annual=(pv,load,dt=1)=>({source:'csv',hours:8760,rows:Array.from({length:8760/dt},(_,i)=>({stamp:Date.UTC(2023,0,1)+i*dt*3600000,pv:pv(i*dt),load:load(i*dt),dt}))});
const custom={id:'audit',name:'Audit device',th:1,watts:6000,price:0};
const p=annual(h=>h%24<12?6:0,h=>h%24>=12?.1:0);
const r=calculate({selected:['audit'],horizon:1,lifetime:1,infraBudget:0,maintenance:0,emsWatts:0,extraWatts:0,startMinutes:0,startMargin:0,poolFee:0,firmwareFee:0,availability:100,difficultyGrowth:0,exportPrice:.25,eligiblePrice:1,importPrice:1},[],market,[custom],p).results[0];
out.dispatchCounterexample={hours:r.annual[0].hours,btcValue:r.annual[0].value,billDifference:r.annual[0].billDifference,benefit:r.annual[0].benefit,opex:r.annual[0].opex};
const grid=calculate({...base,pvKwp:0,gridLimit:10,btcPrice:1e7,importPrice:.01,eligiblePrice:.01,infraBudget:0,startMargin:0},profile,market,models).results[0].annual[0];
out.gridChart={pv:grid.pv,energy:grid.energy,asicGrid:grid.asicGrid,maxMonthlyPv:Math.max(...grid.monthly.map(x=>x.pv)),maxMonthlyAsic:Math.max(...grid.monthly.map(x=>x.asic))};
const n=normalize({...base,annualLoad:'',capacity:200,usableFraction:10,reserve:95,battery:'existing',quantity:1.5},market);out.silentNormalization={blankLoad:n.annualLoad,reserve:n.reserve,usableFraction:n.usableFraction,quantity:n.quantity};
const future=structuredClone([market,models,profile]);future[0].observedAt='2099-01-01';future[0].btcPln=1e99;future[1][0].efficiency=999;future[2]=future[2].map(([time,p])=>[new Date(Date.parse(time)+20*86400000).toISOString(),p]);
try {validateDataset(future);out.invalidAccepted={futureMarket:true,extremePrice:true,wrongEfficiency:true,shiftedWeatherYear:true,freshness:freshness(future[0],future[1])};}catch(e){out.invalidAccepted=e.message;}
const h=calculate({...base,lifetime:1,horizon:10,devicePrices:{'s21-151':10000},infraBudget:0,btcGrowth:100},profile,market,models).results[0];out.paybackAfterLife={payback:h.payback,lifetime:1,lastBtc:h.annual[9].btc};
const z=calculate({pvKwp:20,battery:'existing',capacity:20,policy:'economic',availability:0,exportPrice:1,maintenance:0,emsWatts:0,selected:['s21-151'],horizon:3},profile,market,models);
const za=z.results[0].annual[0];out.zeroMiningBatteryCounterfactual={baselineBatteryHouse:z.baseline.batteryHouse,withMinerBatteryHouse:za.batteryHouse,energy:za.energy,btc:za.btc,benefit:za.benefit};
out.capexSensitivity=[0,1000,2000,4000].map(infraBudget=>{const r=calculate({selected:['s21-151'],pvKwp:10,exportMode:'historical',infraBudget},profile,market,models).results[0];return {infraBudget,capex:r.capex,benefitYear1:r.annual[0].benefit,result10:r.annual.at(-1).result,payback:r.payback};});
await writeFile(new URL('./engine-probes-recheck.json',import.meta.url),JSON.stringify(out,null,2)+'\n');
console.log(JSON.stringify(out,null,2));
