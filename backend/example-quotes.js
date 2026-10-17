// Symulacje historycznych A1–A3 z etapu 3. Nie aktualne ceny zakupu, nie oferty.
import { mkdir, writeFile } from 'node:fs/promises';
import { loadCatalog } from './catalog.js';
import { calculateInternal } from './internal-calculator.js';
import { reviseOffer, customerOffer } from './offers.js';
const book=await loadCatalog();
const definitions=[
 {name:'START',devices:[['p01',1],['p03',1],['p04',3],['p06',2],['p10',1]],materials:150,it:[['Baza uruchomienia',6],['Integracje Shelly i ZHA',2],['Konfiguracja pięciu punktów',1.25],['Dwie proste automatyzacje',1]],install:2.25,travel:1.5,km:60,overhead:500,final:4400},
 {name:'STANDARD',devices:[['p01',1],['p02',1],['p04',8],['p05',4],['p06',4],['p07',1],['p10',1]],materials:450,it:[['Baza uruchomienia',6],['Integracje Shelly, ZHA, HVAC',7],['Konfiguracja 22 punktów',5.5],['Cztery proste i dwie zaawansowane automatyzacje',5],['Diagnostyka i testy konfliktów HVAC',4]],install:11.5,travel:3,km:120,overhead:1000},
 {name:'PREMIUM',devices:[['p09',1],['p02',1],['p04',12],['p05',8],['p06',6],['p07',1],['p10',1]],materials:1400,it:[['Baza uruchomienia',6],['Integracje Shelly, ZHA, PV, HVAC i EV',14],['Konfiguracja 31 punktów',7.75],['Scenariusze proste, zaawansowane i energetyczne',16],['Uzgodnienie priorytetów i testy awarii',8]],install:18.5,travel:4,km:160,overhead:1800,subcontractor:1200}
];
await mkdir('output/pdf',{recursive:true});
const results=[];
for(const d of definitions){
 const lines=d.devices.map(([id,quantity])=>{const p=book.products.find(p=>p.id===id);const gross=id==='p10'?439:p.historicalReference.grossRetail;const cost=gross/1.23;return{id,label:p.model.startsWith(p.manufacturer) ? p.model : `${p.manufacturer} ${p.model}`,group:'hardware',quantity,unitCostNet:cost,hoursPerUnit:0,hourlyCostNet:0,unitSaleNet:cost*1.15,vatRate:23,vatApproved:true};});
 const job=(id,label,group,quantity,cost,hours,hourly,sale)=>lines.push({id,label,group,quantity,unitCostNet:cost,hoursPerUnit:hours,hourlyCostNet:hourly,unitSaleNet:sale,vatRate:23,vatApproved:true});
 job('materials','Akcesoria i materiały integracyjne','materials',1,d.materials,0,0,d.materials*1.15);
 d.it.forEach(([label,hours],i)=>job(`it-${i}`,label,'configuration',1,0,hours,90,hours*180));
 job('installation','Montaż i odbiór uzgodnionych modułów','installation',1,0,d.install,75,d.install*150);
 job('travel','Dojazd - czas i kilometry w obie strony','travel',1,d.km*.9,d.travel,90,d.km*1.5+d.travel*150);
 if(d.subcontractor)job('specialist','Kwalifikacja i odbiór HVAC / EV przez specjalistę','additional',1,d.subcontractor,0,0,d.subcontractor*1.15);
 const q={lines,reserveLaborPercent:10,allocatedOverheadNet:d.overhead,targetMarginPercent:30,finalSaleNet:d.final??null,adjustmentVatRate:23,adjustmentVatApproved:true,technicalChecked:false,costsChecked:false,validityDays:14,
 terms:'DEMONSTRACJA. Kwoty wynikają z historycznych cen detalicznych i roboczych założeń etapu 3. Dokument nie jest zatwierdzoną ofertą handlową. Zakres, dostępność, kompatybilność i VAT wymagają sprawdzenia przez AMPOWER.',
 exclusions:'Bez zakupu napędów, urządzeń HVAC, PV, baterii i ładowarki EV. Bez przebudowy elektryki, usług chmurowych i abonamentów. PREMIUM wymaga odrębnego pilotażu.'};
 const record=reviseOffer({receipt:{inquiryId:`AMP-DEMO-${d.name}`},data:{name:'Klient demonstracyjny',email:'demo@example.invalid',locality:'Przykładowa lokalizacja'},audit:[]},q,'symulacja',new Date('2026-10-11T12:00:00Z'));
 const safe=customerOffer(record,true,new Date('2026-10-11T12:00:00Z'));
 await writeFile(`output/pdf/${d.name.toLowerCase()}-customer-demo.json`,JSON.stringify(safe,null,2),{mode:0o600});
 const calculation=calculateInternal(q);results.push({package:d.name,status:'historical-simulation-not-approved',...calculation.totals});
}
await writeFile('docs/ampower-sales/PRZYKLADY.json',JSON.stringify(results,null,2));
console.log(JSON.stringify(results.map(r=>({package:r.package,net:r.saleNet,gross:r.saleGross,cost:r.directCostNet,margin:r.marginPercent,profit:r.profitAfterIncludedCostsNet})),null,2));
