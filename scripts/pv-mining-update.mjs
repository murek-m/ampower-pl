// Stages a validated immutable market snapshot. Never deploys, pushes or edits main.
import {readFile,writeFile,mkdir,rename} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';
import {validateDataset} from '../pv-mining/data-loader.js';
const root=new URL('../',import.meta.url);
const api='https://mempool.space/api';
async function request(url,kind,fetcher) {
  let last;
  for(let attempt=0;attempt<2;attempt++)try {
    const response=await fetcher(url,{signal:AbortSignal.timeout(10000)});
    if(!response.ok)throw new Error(`HTTP ${response.status}`);
    return kind==='text'?(await response.text()).trim():await response.json();
  }catch(error){last=error;}
  throw new Error(`Nie udało się pobrać ${url}: ${last.message}`);
}
export function difficultyFromBits(bits) {
  if(!Number.isInteger(bits)||bits<=0||bits>0x207fffff||(bits&0x800000))throw new Error('Nieprawidłowy target difficulty.');
  const exponent=bits>>>24,mantissa=bits&0x7fffff;
  const target=mantissa*2**(8*(exponent-3));
  const maxTarget=0xffff*2**(8*(0x1d-3));
  const difficulty=maxTarget/target;
  if(!Number.isFinite(difficulty)||difficulty<1||difficulty>1e18)throw new Error('Trudność poza zakresem.');
  return difficulty;
}
export async function collectMarket(previous,{fetcher=fetch,now=Date.now()}={}) {
  const [spot,blocks]=await Promise.all([
    request('https://api.coinbase.com/v2/prices/BTC-PLN/spot','json',fetcher),request(`${api}/blocks`,'json',fetcher)
  ]);
  if(spot?.data?.currency!=='PLN'||!Number.isFinite(Number(spot.data.amount))||Number(spot.data.amount)<.01||Number(spot.data.amount)>1e7||!Array.isArray(blocks)||blocks.length<6)throw new Error('Niepełne źródła rynku.');
  const sample=blocks.slice(0,6);
  if(sample.some((b,i)=>!/^[0-9a-f]{64}$/.test(b.id)||!Number.isInteger(b.height)||(i&&b.height!==sample[i-1].height-1)||!Number.isFinite(b.timestamp)||b.timestamp*1000>now+300000)||now-sample[0].timestamp*1000>86400000)throw new Error('Nieaktualny lub niespójny łańcuch bloków.');
  const fees=[];
  for(const block of sample) {
    const txid=await request(`${api}/block/${block.id}/txid/0`,'text',fetcher);
    if(!/^[0-9a-f]{64}$/.test(txid))throw new Error('Nieprawidłowy identyfikator transakcji coinbase.');
    const tx=await request(`${api}/tx/${txid}`,'json',fetcher);
    if(!tx.vin?.[0]?.is_coinbase||!tx.status?.confirmed||tx.status.block_hash!==block.id||!Array.isArray(tx.vout)||!tx.vout.every(o=>Number.isSafeInteger(o.value)&&o.value>=0))throw new Error('Nieprawidłowa transakcja coinbase.');
    const reward=tx.vout.reduce((sum,o)=>sum+o.value,0)/1e8;
    const fee=reward-50/2**Math.floor(block.height/210000);
    if(fee<0||fee>50)throw new Error('Nie można potwierdzić opłat bloku; zachowaj poprzedni snapshot.');
    fees.push(fee);
  }
  const market={...previous,schemaVersion:1,observedAt:new Date(now).toISOString(),btcPln:Number(spot.data.amount),difficulty:difficultyFromBits(sample[0].bits),height:sample[0].height,feeBtc:fees.reduce((a,b)=>a+b,0)/fees.length,feeSample:{blocks:6,firstHeight:sample[5].height,lastHeight:sample[0].height,method:'coinbase outputs minus block subsidy'},sources:[{label:'Coinbase BTC/PLN spot',url:'https://api.coinbase.com/v2/prices/BTC-PLN/spot'},{label:'mempool Esplora — 6 bloków, bits i opłaty coinbase',url:`${api}/blocks`},...previous.sources.filter(s=>!s.label.includes('Coinbase')&&!s.label.includes('mempool'))]};
  if(previous.height>market.height||market.btcPln/previous.btcPln>2||market.btcPln/previous.btcPln<.5||market.difficulty/previous.difficulty>2||market.difficulty/previous.difficulty<.5)throw new Error('Duża zmiana lub cofnięcie sieci wymaga ręcznej weryfikacji.');
  return market;
}
export async function stageSnapshot({fetcher=fetch,now=Date.now(),output=new URL('output/pv-mining-data-candidates/',root)}={}) {
  const read=async name=>JSON.parse(await readFile(new URL(`pv-mining/data/${name}.json`,root)));
  const [previous,models,profile]=await Promise.all(['market','models','profile'].map(read));
  const market=await collectMarket(previous,{fetcher,now});validateDataset([market,models,profile],now);
  const content=JSON.stringify(market,null,2)+'\n',digest=createHash('sha256').update(content).digest('hex');
  const dir=new URL(`${new Date(now).toISOString().replace(/[:.]/g,'-')}-${digest.slice(0,12)}/`,output);
  await mkdir(dir,{recursive:true});
  await writeFile(new URL('market.json',dir),content);
  await writeFile(new URL('manifest.json',dir),JSON.stringify({schemaVersion:1,observedAt:market.observedAt,sha256:digest,apply:'local review only; no deployment',preserved:['ASIC offer dates and prices','PV profile','historical energy assumptions']},null,2)+'\n');
  return {dir,market};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href) {
  try {
    const {dir,market}=await stageSnapshot();
    if(process.argv.includes('--apply-local')) {
      const branch=execFileSync('git',['branch','--show-current'],{cwd:root,encoding:'utf8'}).trim();
      if(branch!=='feat/pv-mining')throw new Error('Aktualizacja lokalna dozwolona tylko na feat/pv-mining.');
      const destination=new URL('pv-mining/data/market.json',root),temporary=new URL('pv-mining/data/market.json.tmp',root);
      await writeFile(temporary,JSON.stringify(market,null,2)+'\n');await rename(temporary,destination);
    }
    console.log(`Snapshot do przeglądu: ${dir.pathname}. Brak publikacji.`);
  }catch(error){console.error(error.message+' Poprzednie dane pozostają bez zmian.');process.exitCode=1;}
}
