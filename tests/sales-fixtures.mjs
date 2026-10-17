import { readFileSync } from 'node:fs';
export const NOW = new Date('2026-10-11T12:00:00Z');
// Wyłącznie dane syntetyczne do testów; nie są zatwierdzeniem AMPOWER.
export function approvedBook() {
  const b = JSON.parse(readFileSync(new URL('../backend/catalog.seed.json', import.meta.url)));
  const approval = { approvalStatus:'approved', approvedBy:'TEST ONLY', approvedAt:'2026-10-10T00:00:00Z', validUntil:'2026-11-10T00:00:00Z', updatedAt:'2026-10-10T00:00:00Z', vatRate:23, vatApproved:true };
  Object.assign(b, approval, { version:'test-only-1', validFrom:'2026-10-10T00:00:00Z' });
  Object.assign(b.rules, approval, { minimumOrderNet:0, minimumExpansionNet:0, minimumConfigurationNet:0, minimumVatRate:23, roundingGross:100, approvedHostModels:['Green'], travelZones:{ głogów:{ saleNetRange:[100,150], vatRate:23, validUntil:approval.validUntil } } });
  for (const p of b.products) Object.assign(p, approval, { saleNetRange:p.id === 'p01' ? [1000,1000] : [100,100], availability:'available', compatibility:{ status:'qualified' }, existingApproved:true, allowedFunctions:[], allowedControls:[], allowedDeliveries:['local','remote'], purchaseNet:60, hoursRange:[0,0] });
  const prices = { base:500, expansion:200, integration:180, point:45, 'install-light':150, 'install-blind':150, 'install-meter':150, materials:50, simple:90, advanced:270, complex:360, remote:180, 'support-basic':180, 'support-extended':360 };
  for (const s of b.services) Object.assign(s, approval, { saleNetRange:[prices[s.id] || 100,prices[s.id] || 100], purchaseNet:0, hoursRange:[1,1] });
  return b;
}
export function selection() {
  return { items:[{ deviceId:'p04', category:'lights', quantity:2, ownership:'new', installation:'ready', systemId:'shelly-main' }], delivery:'remote', host:'needed', remoteReady:'yes', infrastructure:'ready', complexity:'simple', locality:'Głogów', simpleScenes:0, advancedScenes:0, support:'none', access:'home', ownedHostModel:'Green', radioChoice:'none' };
}
export function raw() {
  return { categories:['lights'], details:{ lights:{ count:'2', status:'installed', quoteDevice:'p04', ownership:'existing', systemId:'shelly-main', control:'separate', controller:'Shelly', model:'1PM', connection:'network' } }, goals:['app'], delivery:'local', access:'home', host:'owned', hostModel:'Green', remoteReady:null, infrastructure:'ready', radioChoice:'none', complexity:'simple', simpleScenes:'0', advancedScenes:'0', support:'none', locality:'Głogów', name:'Klient TEST', email:'qa+smart@example.invalid', phone:'', notes:'Dane syntetyczne', channel:'email', dataNoticeAccepted:true };
}
export function quote() {
  return { lines:[{ id:'device-1', label:'Shelly — test', group:'hardware', quantity:2, unitCostNet:100, hoursPerUnit:0, hourlyCostNet:0, unitSaleNet:150, vatRate:23, vatApproved:true },
    { id:'configuration-1', label:'Konfiguracja — test', group:'configuration', quantity:1, unitCostNet:0, hoursPerUnit:2, hourlyCostNet:90, unitSaleNet:500, vatRate:23, vatApproved:true }],
    reserveLaborPercent:10, allocatedOverheadNet:50, targetMarginPercent:30, finalSaleNet:null, adjustmentVatRate:null, adjustmentVatApproved:false, technicalChecked:true, costsChecked:true, validityDays:14, terms:'Dane testowe. Zakres wymaga sprawdzenia przed umową.', exclusions:'Bez prac poza wskazanym zakresem.' };
}
