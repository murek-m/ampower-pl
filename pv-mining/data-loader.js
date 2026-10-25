// Shared trust boundary for bundled snapshots and optional future data adapters.
const range=(v,low,high)=>typeof v==='number'&&Number.isFinite(v)&&v>=low&&v<=high;
const text=v=>typeof v==='string'&&v.trim().length>0;
const link=v=>{try {const u=new URL(v);return u.protocol==='https:'&&!u.username&&!u.password;}catch{return false;}};
const stamp=v=>typeof v==='string'?Date.parse(v):NaN;
const validDate=(v,now)=>Number.isFinite(stamp(v))&&stamp(v)>=Date.UTC(2009,0,1)&&stamp(v)<=now+300000;
export function validateMarket(market,now=Date.now()) {
  if(!market||market.schemaVersion!==1||!validDate(market.observedAt,now)||!range(market.btcPln,.01,1e7)||!range(market.difficulty,1,1e18)||!Number.isInteger(market.height)||!range(market.height,0,21e6)||!range(market.feeBtc,0,50)||!Array.isArray(market.sources)||!market.sources.length||!market.sources.every(s=>text(s.label)&&link(s.url)))throw new Error('Nieprawidłowy snapshot rynku. Wyniki są zablokowane.');
  return market;
}
export function validateDataset([market,models,profile],now=Date.now()) {
  validateMarket(market,now);
  if(!Array.isArray(models)||!models.length||new Set(models.map(m=>m.id)).size!==models.length||!models.every(m=>
    m.schemaVersion===1&&/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(m.id)&&text(m.name)&&text(m.variant)&&range(m.th,1,100000)&&range(m.watts,1,1e6)&&range(m.efficiency,.1,1000)&&Math.abs(m.watts/m.th-m.efficiency)<=.1&&
    (m.price===null||range(m.price,0,1e6))&&validDate(m.verifiedAt,now)&&link(m.source)&&text(m.priceStatus)&&text(m.stock)&&text(m.cooling)&&text(m.supply)&&text(m.control)&&
    m.offer&&['unconfirmed','confirmed'].includes(m.offer.status)&&['unknown','available','sold-out'].includes(m.offer.stock)&&typeof m.offer.includesDelivery==='boolean'&&(m.offer.finalGrossPln===null||range(m.offer.finalGrossPln,0,1e6))&&validDate(m.offer.verifiedAt,now)&&
    (m.offer.status!=='confirmed'||(m.offer.finalGrossPln!==null&&m.offer.includesDelivery&&m.offer.stock==='available'&&m.offer.finalGrossPln===m.price))
  ))throw new Error('Nieprawidłowy katalog ASIC. Wyniki są zablokowane.');
  const first=stamp(profile?.[0]?.[0]),year=new Date(first).getUTCFullYear();
  const begin=Date.UTC(year,0,1),end=Date.UTC(year+1,0,1);
  if(!Array.isArray(profile)||![8760,8784].includes(profile.length)||profile.length!==(end-begin)/3600000||first<begin||first>=begin+3600000||stamp(profile.at(-1)?.[0])>=end||!profile.every((r,i)=>Array.isArray(r)&&r.length===2&&Number.isFinite(stamp(r[0]))&&range(r[1],0,2)&&(!i||stamp(r[0])-stamp(profile[i-1][0])===3600000)))throw new Error('Nieprawidłowy godzinowy profil PV. Wyniki są zablokowane.');
  return [market,models,profile];
}
export async function loadDataset(fetcher=fetch) {
  return validateDataset(await Promise.all(['market','models','profile'].map(async name=>{
    const response=await fetcher(`./data/${name}.json`,{cache:'no-store'});
    if(!response.ok)throw new Error(`Nie można odczytać ${name}.json (HTTP ${response.status})`);
    return response.json();
  })));
}
export function freshness(market,models,now=Date.now()) {
  const old=value=>!validDate(value,now)||now-stamp(value)>7*86400000;
  return {marketStale:old(market.observedAt),staleOffers:models.filter(m=>old(m.verifiedAt)||old(m.offer?.verifiedAt)).map(m=>m.id)};
}
export function offerEligible(model,now=Date.now()) {
  const o=model.offer;
  return Boolean(o&&o.status==='confirmed'&&o.stock==='available'&&o.includesDelivery&&o.finalGrossPln===model.price&&range(o.finalGrossPln,0,1e6)&&!freshness({observedAt:o.verifiedAt},[model],now).staleOffers.length);
}
