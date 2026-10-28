import {calculate,parseCsv} from './engine.js?v=0d1e68c839299388';
let dataset,imported=null;
self.onmessage=async({data})=>{
  try {
    if(data.type==='init'){dataset=data.dataset;return;}
    if(data.type==='csv') {
      if(data.file.size>8_000_000)throw new Error('Plik przekracza 8 MB. Wybierz jeden rok danych.');
      const next=parseCsv(await data.file.text());imported=next;
      self.postMessage({id:data.id,type:'csv',imported});return;
    }
    if(data.type==='profile'){imported=data.imported;return;}
    if(data.type==='calculate')self.postMessage({id:data.id,result:calculate(data.raw,dataset.profile,dataset.market,dataset.models,imported)});
  }catch(error){self.postMessage({id:data.id,error:error.message,type:data.type});}
};
