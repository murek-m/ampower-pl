// Reproduce stage-4 research tables using the same engine as both UIs.
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {calculate} from '../pv-mining/engine.js';
const root=new URL('../',import.meta.url);
const read=async file=>JSON.parse(await readFile(new URL(file,root),'utf8'));
const [market,models,profile]=await Promise.all(['market','models','profile'].map(n=>read(`pv-mining/data/${n}.json`)));
const cases=[[5,0],[10,0],[10,10],[10,20],[15,0],[20,20]];
const scenarios={pesymistyczny:{btcPrice:market.btcPln*.7,difficultyGrowth:30,btcGrowth:0,profileWeather:90},bazowy:{btcPrice:market.btcPln,difficultyGrowth:15,btcGrowth:0,profileWeather:100},optymistyczny:{btcPrice:market.btcPln*1.3,difficultyGrowth:5,btcGrowth:10,profileWeather:110}};
const shared={selected:['s21-151','s21-pro','s21-xp'],annualLoad:5000,knownSurplus:'',annualProduction:'',exportMode:'historical',horizon:10,lifetime:5,batteryMining:false,infraBudget:4000,batteryBudget:20000};
const records=[];
for(const [pv,capacity] of cases) for(const [scenario,changes]of Object.entries(scenarios)) for(const battery of capacity?['existing','new']:['none']) {
  const assumptions={...shared,...changes,pvKwp:pv,capacity,battery};
  const data=calculate(assumptions,profile,market,models);
  for(const r of data.results){
    for(const y of r.annual){assert.ok(Number.isFinite(y.result));assert.equal(y.simultaneous,0);assert.equal(y.asicGrid,0);assert.ok(y.energy<=y.pv+1e-6);}
    const a=r.annual[0];
    records.push({scenario,pvKwp:pv,battery,capacity,model:r.model.id,th:r.model.th,watts:r.model.watts,price:r.devicePrice,capex:r.capex,energy:a.energy,hours:a.hours,hashHours:a.hashHours,btc:a.btc,satoshi:Math.round(a.btc*1e8),btcValue:a.value,lostExport:a.exportLost,additionalBenefit:a.benefit,combinedBenefit:a.combinedBenefit,roi:r.roi,payback:r.payback,cashPayback:r.cashPayback,result3:r.annual[2].result,result5:r.annual[4].result,result10:r.annual[9].result,npv:r.npv,batteryHouse:a.batteryHouse,batteryMining:a.batteryMining,assumptions});
  }
}
const out=new URL('docs/pv-mining/qa/stage-4/',root);await mkdir(out,{recursive:true});
await writeFile(new URL('simulations.json',out),JSON.stringify({generatedAt:new Date().toISOString(),snapshot:market,disclaimer:'Scenariusze, nie prognozy. Ceny urządzeń nie są pełnymi ofertami dostawy. Budżety infrastruktury i baterii są przykładowe.',scenarios,shared,records},null,2)+'\n');
const num=(v,d=0)=>v==null?'—':new Intl.NumberFormat('pl-PL',{maximumFractionDigits:d,minimumFractionDigits:d}).format(v);
const label=r=>`${r.pvKwp} / ${r.capacity} / ${r.model}`;
let md='# Aktualne obliczenia obu prototypów\n\nWygenerowano przez `node scripts/pv-mining-report.mjs` ze wspólnego `pv-mining/engine.js`. Snapshot 24.10.2026. 81 wariantów: 54 podstawowe (baterie istniejące) i 27 z zakupem nowej baterii. Kwoty w PLN brutto przy wskazanych założeniach; ceny urządzeń z ograniczeniami źródłowymi. Nie są ofertami kompletnej dostawy.\n\nDom 5000 kWh/rok, PVGIS Wrocław 2023, południe35°, straty14%, historiaRCEm2025, FIFO depozytu, 98% dostępności, pool2%, firmware2,5%, dodatkowe chłodzenie30W, start9min, bufor200W, pracaASIC5lat, horyzont10lat, dyskonto7%. OPEX300PLN/rok plus EMS8W jako koszt z sieci. Budżet infrastruktury4000PLN; nowa bateria dodatkowo20 000PLN. Bez wykorzystania baterii do ASIC; dom ma priorytet. Pojemność użyteczna międzySOC20–90%, moc5kW, sprawnośćcyklu90%, zużycie0,10PLN/kWh. Bez planowego importu ASIC.\n\nScenariusz bazowy: kurs snapshot, trudność+15%/rok, kursbez wzrostu, produkcja100%. Pesymistyczny: kurs−30%, trudność+30%/rok, produkcja90%. Optymistyczny: kurspoczątkowy+30%, następnie+10%/rok, trudność+5%/rok, produkcja110%. To jawne założenia wrażliwości, nie prognozy ani prawdopodobieństwa. Halving działa we wszystkich wariantach.\n';
for(const scenario of Object.keys(scenarios)){
 const rows=records.filter(r=>r.scenario===scenario&&r.battery!=='new');
 md+=`\n## ${scenario}\n\nPV kWp / bateria kWh / model. Bateria jest istniejąca; CAPEX obejmuje tylko dodatkową inwestycję.\n\n| PV / bat. / ASIC | CAPEX | Energia kWh | h zasilania | BTC rok1 | Wartość BTC | Utracony eksport | Korzyść rok1 | Stopa rok1 |\n|---|---:|---:|---:|---:|---:|---:|---:|---:|\n`;
 for(const r of rows)md+=`| ${label(r)} | ${num(r.capex)} | ${num(r.energy)} | ${num(r.hours)} | ${num(r.btc,8)} | ${num(r.btcValue)} | ${num(r.lostExport)} | ${num(r.additionalBenefit)} | ${num(r.roi*100,1)}% |\n`;
 md+='\n| PV / bat. / ASIC | Wynik 3 lata | 5 lat | 10 lat | NPV 10 lat | Zwrot w horyzoncie |\n|---|---:|---:|---:|---:|---|\n';
 for(const r of rows)md+=`| ${label(r)} | ${num(r.result3)} | ${num(r.result5)} | ${num(r.result10)} | ${num(r.npv)} | ${r.payback?r.payback+' lat':'Brak'} |\n`;
}
md+='\n## Zakup nowej baterii — scenariusz bazowy\n\nCałość porównana z PV bez baterii i ASIC. Korzyść całego zestawu zawiera wpływ baterii na dom; nie jest korzyścią samego miningu. Pozostałe scenariusze zakupowe i satoshi w pełnym JSON.\n\n| PV / bat. / ASIC | CAPEX | Korzyść całego zestawu rok1 | Wynik 3 lata | 5 lat | 10 lat | Zwrot |\n|---|---:|---:|---:|---:|---:|---|\n';
for(const r of records.filter(r=>r.scenario==='bazowy'&&r.battery==='new'))md+=`| ${label(r)} | ${num(r.capex)} | ${num(r.combinedBenefit)} | ${num(r.result3)} | ${num(r.result5)} | ${num(r.result10)} | ${r.payback?r.payback+' lat':'Brak'} |\n`;
md+='\nDodatnia korzyść roku1 nie dowodzi zwrotu. Wynik 3/5/10 lat to gotówka poCAPEX plus hipotetyczna wycena zgromadzonych BTC; bez ich sprzedaży nie jest gotówką. Depozyt końcowy nie jest przychodem. Rok referencyjny powtarzamy, a nie prognozujemy pogody. Model nie jest optymalizatorem globalnym. Przy niskiej liczbie godzin i dodatnim OPEX roczne korzyści mogą być ujemne.\n';
await writeFile(new URL('09_AKTUALNE_SYMULACJE.md',new URL('docs/pv-mining/',root)),md);
console.log(JSON.stringify({records:records.length,paybackCount:records.filter(r=>r.payback).length,base:records.filter(r=>r.scenario==='bazowy'&&r.pvKwp===10&&!r.capacity),best10:records.reduce((best,r)=>r.result10>best.result10?r:best)},null,2));
