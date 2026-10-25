// Read-only application probes. Outputs evidence; does not change application data.
import {readFile,writeFile,readdir,stat} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {calculate} from '../../../../pv-mining/engine.js';
import {validateDataset} from '../../../../pv-mining/data-loader.js';
import {clearSession} from '../../../../pv-mining/session.js';
const root=new URL('../../../../',import.meta.url);
const read=async p=>readFile(new URL(p,root),'utf8');
const [market,models,profile]=await Promise.all(['market','models','profile'].map(async n=>JSON.parse(await read(`pv-mining/data/${n}.json`))));
const raw={pvKwp:10,selected:['s21-151'],costMode:'budget',infraBudget:0,devicePrices:{'s21-151':100},btcPrice:900000,btcGrowth:-50,maintenance:300,emsWatts:8,horizon:10,lifetime:5,exportMode:'historical'};
const r=calculate(raw,profile,market,models).results[0];
const altered=structuredClone([market,models,profile]);altered[1][0].name='<b>TEST-MARKUP</b>';
let markupAccepted=false;try {validateDataset(altered);markupAccepted=true;}catch{}
let removed=false;
globalThis.sessionStorage={getItem:()=>'{broken-json',removeItem:()=>{removed=true;}};
let resetError=null;try{await clearSession();}catch(e){resetError=e.message;}
delete globalThis.sessionStorage;
const files={};for(const name of ['app.js','engine.js','session.js','data-loader.js','charts.js','style.css','data/market.json','data/models.json','data/profile.json']){
  const data=await readFile(new URL(`pv-mining/${name}`,root));
  const built=await readFile(new URL(`output/pv-mining-preview/${name}`,root));
  files[name]={bytes:data.length,sha256:createHash('sha256').update(data).digest('hex'),previewMatches:data.equals(built)};
}
async function total(dir){let size=0;for(const name of await readdir(dir)){const p=new URL(name,dir),s=await stat(p);size+=s.isDirectory()?await total(new URL(name+'/',dir)):s.size;}return size;}
const evidence={generatedAt:new Date().toISOString(),commit:'db9f2ae',paybackReversal:{synthetic:true,note:'Artificial stress case, not an offer or price forecast',raw,payback:r.payback,firstResult:r.annual[0].result,finalResult:r.annual.at(-1).result,annual:r.annual.map(a=>({year:a.year,result:a.result,benefit:a.benefit}))},catalogMarkup:{markupAccepted,note:'Inert markup only; no script executed. app.js model picker inserts model name without esc().'},corruptSessionReset:{resetError,removed},files,totalPreviewBytes:await total(new URL('output/pv-mining-preview/',root))};
await writeFile(new URL('probes.json',import.meta.url),JSON.stringify(evidence,null,2)+'\n');
console.log(JSON.stringify({payback:evidence.paybackReversal.payback,finalResult:evidence.paybackReversal.finalResult,markupAccepted,corruptSessionReset:evidence.corruptSessionReset,totalPreviewBytes:evidence.totalPreviewBytes,previewMatches:Object.values(files).every(f=>f.previewMatches)},null,2));
