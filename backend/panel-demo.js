import { randomUUID } from 'node:crypto';
import { estimate, selectionFromRaw } from '../smart-home-energy/pricing.js';
import { projectPublicCatalog } from './catalog.js';
import { draftFromEstimate, calculateInternal } from './internal-calculator.js';
import { blankQuote } from './panel-domain.js';
import { reviseOffer } from './offers.js';
export function demoRaw() {
  return {categories:['blinds','lights','ac','floor'],details:{blinds:{count:'8'},lights:{count:'12'},ac:{model:'Daikin'},floor:{}},goals:['app'],delivery:'local',access:'home',host:'unknown',hostModel:'',remoteReady:null,infrastructure:'unknown',radioChoice:'unknown',complexity:'unknown',simpleScenes:'',advancedScenes:'',support:'none',locality:'Głogów',name:'Klient DEMO — konfigurator',email:'demo@example.invalid',phone:'',notes:'8 rolet, 12 obwodów światła, klimatyzacja Daikin i podłogówka. Modele i strefy do ustalenia.',channel:'email',dataNoticeAccepted:true};
}
export async function seedPanelDemo(store, book, actor, now = new Date()) {
  return store.transaction(async () => {
    for (const type of ['inquiry','quote']) {
      const key = `panel-demo-v1:${type}`;
      if (await store.get(key)) continue;
      const data = demoRaw();
      if (type === 'quote') {data.name = 'Klient DEMO — ćwiczenie PDF';data.categories = ['lights'];}
      const selection = selectionFromRaw(data);
      const pricing = estimate(selection,projectPublicCatalog(book,now),now);
      const draft = draftFromEstimate(pricing,book,now,selection);
      let record = {storageKey:key,payloadHash:'demo',demo:true,source:type === 'inquiry' ? 'configurator' : 'manual',receipt:{inquiryId:`AMP-${randomUUID()}`,receivedAt:new Date(+now-3*86400000).toISOString()},data,internalDraft:draft,internalCalculation:calculateInternal(draft),publicEstimate:pricing,notification:{status:'demo-disabled',recipient:'kuba@ampower.pl',attempts:0},offer:null,audit:[{action:'demo-created',actor,at:now.toISOString()}]};
      if (type === 'quote') {
        const q = blankQuote();
        Object.assign(q,{reserveLaborPercent:10,allocatedOverheadNet:50,terms:'DEMONSTRACJA. Termin i płatność do indywidualnego uzgodnienia. Kwoty syntetyczne, nie cennik AMPOWER.',exclusions:'Bez prac poza opisanym zakresem.'});
        q.lines = [{id:'demo-device',label:'Shelly — przykładowy moduł DEMO',manufacturer:'Shelly',model:'Model demonstracyjny',group:'hardware',quantity:2,unitCostNet:100,unitSaleNet:150,hoursPerUnit:0,hourlyCostNet:0,vatRate:23,vatApproved:true,priceApproved:true},
          {id:'demo-labor',label:'Konfiguracja i testy DEMO',group:'configuration',quantity:1,unitCostNet:0,unitSaleNet:500,hoursPerUnit:2,hourlyCostNet:90,vatRate:23,vatApproved:true,priceApproved:true}];
        record = reviseOffer(record,q,actor,now);record.status='draft';
      }
      await store.put(key,record);
    }
    return {created:true,notice:'Zapisano wyłącznie syntetyczne dane. Powiadomienia i poczta wyłączone.'};
  });
}
