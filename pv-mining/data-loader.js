// Shared data boundary. A failed update never manufactures zero-valued market data.
const positive=v=>typeof v==='number'&&Number.isFinite(v)&&v>0;
const date=v=>typeof v==='string'&&Number.isFinite(Date.parse(v));
const link=v=>typeof v==='string'&&/^https:\/\//.test(v);
export function validateDataset([market,models,profile]) {
  if(!market||!date(market.observedAt)||!positive(market.btcPln)||!positive(market.difficulty)||!Number.isInteger(market.height)||market.height<0||!Number.isFinite(market.feeBtc)||market.feeBtc<0||!Array.isArray(market.sources)||!market.sources.every(s=>s.label&&link(s.url)))throw new Error('Nieprawidłowy snapshot rynku. Wyniki są zablokowane.');
  if(!Array.isArray(models)||!models.length||new Set(models.map(m=>m.id)).size!==models.length||!models.every(m=>m.id&&m.name&&positive(m.th)&&positive(m.watts)&&(m.price===null||(Number.isFinite(m.price)&&m.price>=0))&&date(m.verifiedAt)&&link(m.source)))throw new Error('Nieprawidłowy katalog ASIC. Wyniki są zablokowane.');
  if(!Array.isArray(profile)||profile.length!==8760||!profile.every((r,i)=>Array.isArray(r)&&date(r[0])&&Number.isFinite(r[1])&&r[1]>=0&&(!i||Date.parse(r[0])-Date.parse(profile[i-1][0])===3600000)))throw new Error('Nieprawidłowy godzinowy profil PV. Wyniki są zablokowane.');
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
  const old=stamp=>now-Date.parse(stamp)>7*86400000;
  return {marketStale:old(market.observedAt),staleOffers:models.filter(m=>old(m.verifiedAt)).map(m=>m.id)};
}
