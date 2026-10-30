// Shared calculation engine for both local prototypes. No DOM or network access.
export const SATOSHIS = 100_000_000;
export const ENGINE_VERSION = '2026-10-29.1';

// Missing keys retain API defaults; explicit empty input is a user decision, never a default.
const requiredNumbers = ['importPrice','eligiblePrice','depositUse','depositFactor','btcPrice','difficulty','feesBtc','difficultyGrowth','btcGrowth','poolFee','firmwareFee','availability','quantity','extraWatts','startMinutes','startMargin','minRunMinutes','minOffMinutes','gridLimit','maintenance','emsWatts','lifetime','horizon','discount'];
export function requiredSettings(raw, imported=false) {
  return [...requiredNumbers,...(!imported?['pvKwp','profileWeather']:[]),
    ...(['existing','new'].includes(raw.battery)?['capacity','usableFraction','reserve','chargeKw','dischargeKw','roundtrip','wear']:[]),
    ...(raw.exportMode!=='historical'?['exportPrice']:[])];
}
export function assumptionIssues(raw, imported=false) {
  const issues=[];
  for(const key of requiredSettings(raw,imported)) {
    if(!Object.hasOwn(raw,key))continue;
    const value=raw[key];
    if(value==null || !['string','number'].includes(typeof value) || String(value).trim()==='' || !Number.isFinite(Number(value)))
      issues.push({key,message:'Uzupełnij wymagane założenie poprawną liczbą.'});
  }
  if(raw.battery==='existing'||raw.battery==='new') {
    if(Number(raw.reserve)>Number(raw.usableFraction)) issues.push({key:'reserve',message:'Rezerwa SOC nie może przekraczać górnego limitu SOC.'});
  }
  if(raw.eligiblePrice!==''&&raw.importPrice!==''&&Number(raw.eligiblePrice)>Number(raw.importPrice)) issues.push({key:'eligiblePrice',message:'Cena pokrywalna depozytem nie może przekraczać całej ceny zakupu energii.'});
  if(!imported&&Number(raw.pvKwp)===0&&Number(raw.annualProduction)>0) issues.push({key:'annualProduction',message:'Dodatnia produkcja wymaga mocy PV większej od 0 kWp.'});
  return issues;
}
const finite = (v, fallback) => Number.isFinite(Number(v)) && v !== '' && v !== null ? Number(v) : fallback;
const bounded = (v, fallback, low, high) => Math.min(high, Math.max(low, finite(v, fallback)));
export function normalize(raw, market, imported=false) {
  const issues=assumptionIssues(raw,imported);
  if(issues.length)throw new Error(issues[0].message);
  const n = (key, fallback, low, high) => bounded(raw[key], fallback, low, high);
  const s = {
    pvKwp:n('pvKwp',10,0,100), annualLoad:n('annualLoad',5000,0,100000),
    annualProduction: raw.annualProduction === '' || raw.annualProduction == null ? null : n('annualProduction',0,0,200000),
    knownSurplus: raw.knownSurplus === '' || raw.knownSurplus == null ? null : n('knownSurplus',0,0,200000),
    battery: ['existing','new'].includes(raw.battery) ? raw.battery : 'none',
    capacity:n('capacity',10,0,200), usableFraction:n('usableFraction',90,1,100)/100,
    reserve:n('reserve',20,0,95)/100, chargeKw:n('chargeKw',5,0,50), dischargeKw:n('dischargeKw',5,0,50),
    roundtrip:n('roundtrip',90,10,100)/100, wear:n('wear',.10,0,5),
    policy:raw.policy === 'economic' ? 'economic' : 'home', batteryMining:raw.batteryMining === true,
    importPrice:n('importPrice',1,0,10), eligiblePrice:n('eligiblePrice',.65,0,10),
    depositUse:n('depositUse',100,0,100)/100, depositFactor:n('depositFactor',1.23,0,2),
    refundRate:raw.settlement === 'rce' ? .30 : .20, settlement:raw.settlement === 'rce' ? 'rce' : 'rcem',
    exportPrice:n('exportPrice',.25,-5,10), exportMode:raw.exportMode === 'historical' ? 'historical' : 'manual',
    negativeFloor:raw.negativeFloor !== false, btcPrice:n('btcPrice',market.btcPln,1,10000000),
    difficulty:n('difficulty',market.difficulty,1,1e18), feesBtc:n('feesBtc',market.feeBtc,0,50),
    hashprice: raw.hashprice === '' || raw.hashprice == null ? null : n('hashprice',0,0,1),
    difficultyGrowth:n('difficultyGrowth',15,-50,200)/100, btcGrowth:n('btcGrowth',0,-90,200)/100,
    poolFee:n('poolFee',2,0,20)/100, firmwareFee:n('firmwareFee',2.5,0,20)/100,
    availability:n('availability',98,0,100)/100, quantity:Math.round(n('quantity',1,1,20)),
    extraWatts:n('extraWatts',30,0,2000), startMinutes:n('startMinutes',9,0,60),
    startMargin:n('startMargin',200,0,3000)/1000, minRunMinutes:n('minRunMinutes',15,0,120),
    minOffMinutes:n('minOffMinutes',10,0,120), gridLimit:n('gridLimit',0,0,10),
    infraBudget:raw.infraBudget===''||raw.infraBudget==null?null:n('infraBudget',0,0,200000), batteryBudget:raw.batteryBudget===''||raw.batteryBudget==null?null:n('batteryBudget',0,0,500000),
    maintenance:n('maintenance',300,0,30000), emsWatts:n('emsWatts',8,0,200),
    lifetime:Math.round(n('lifetime',5,1,10)), horizon:Math.round(n('horizon',10,1,10)),
    discount:n('discount',7,0,50)/100, sellBtc:raw.sellBtc === true,
    costMode:raw.costMode === 'budget' ? 'budget' : 'detailed',
    meterExisting:raw.meterExisting === true, emsExisting:raw.emsExisting === true,
    deviceSpecs:raw.deviceSpecs || {},
    selected: Array.isArray(raw.selected) ? raw.selected.slice(0,4) : ['s21-151','s21-pro','s21-xp'],
    profileWeather:n('profileWeather',100,10,150)/100, costs:{}, devicePrices:raw.devicePrices || {},
  };
  for (const key of ['meter','ems','electrical','wiring','ventilation','labor','shipping'])
    s.costs[key] = raw.costs?.[key] === '' || raw.costs?.[key] == null ? null : bounded(raw.costs[key],0,0,500000);
  s.costs.meter = s.meterExisting ? 0 : s.costs.meter;
  s.costs.ems = s.emsExisting ? 0 : s.costs.ems;
  if(s.capacity>0&&s.battery!=='none'&&s.reserve>s.usableFraction)throw new Error('Rezerwa SOC nie może przekraczać górnego limitu SOC.');
  if(s.eligiblePrice>s.importPrice)throw new Error('Cena pokrywalna depozytem nie może przekraczać całej ceny zakupu energii.');
  if (s.battery === 'none') s.capacity = 0;
  return s;
}

// Strict numeric CSV: UTC ISO timestamps, explicit units, regular 15/30/60 min intervals.
export function parseCsv(text) {
  if (new TextEncoder().encode(text).byteLength > 8_000_000) throw new Error('Plik przekracza 8 MB. Wybierz jeden rok danych.');
  const lines = text.replace(/^\uFEFF/,'').trim().split(/\r?\n/);
  const delimiter = lines[0].includes(';') ? ';' : ',';
  const head = lines.shift().split(delimiter).map(x=>x.trim());
  const kinds = [['timestamp','pv_kw','load_kw'],['timestamp','pv_kwh','load_kwh']];
  const kind = kinds.find(k=>k.every((v,i)=>head[i]===v) && head.length===3);
  if (!kind) throw new Error('Nagłówek: timestamp,pv_kw,load_kw lub timestamp,pv_kwh,load_kwh. Czas ISO z Z lub offsetem.');
  if (lines.length < 24 || lines.length > 35136) throw new Error('Import wymaga od 24 do 35 136 wierszy.');
  const rows = lines.map((line,i)=>{
    const cells = line.split(delimiter).map(x=>x.trim());
    const iso=/^(\d{4})-(\d\d)-(\d\d)T\d\d:\d\d(?::\d\d)?(?:Z|[+-]\d\d:\d\d)$/.exec(cells[0]);
    if (cells.length!==3 || !iso)
      throw new Error(`Wiersz ${i+2}: wymagany pełny czas ISO i trzy kolumny.`);
    // Date.parse normalizes impossible dates such as 2023-02-29 to March 1.
    // Validate the written calendar date before applying its explicit UTC offset.
    const [,yearText,monthText,dayText]=iso,year=Number(yearText),month=Number(monthText),day=Number(dayText);
    const leap=year%4===0&&(year%100!==0||year%400===0);
    const monthDays=[31,leap?29:28,31,30,31,30,31,31,30,31,30,31];
    if(month<1||month>12||day<1||day>monthDays[month-1])
      throw new Error(`Wiersz ${i+2}: nieistniejąca data kalendarzowa.`);
    const stamp = Date.parse(cells[0]);
    const nums = cells.slice(1).map(v=>/^(?:\d+\.?\d*|\d*\.\d+)$/.test(v) ? Number(v) : NaN);
    if (!Number.isFinite(stamp) || nums.some(v=>!Number.isFinite(v)||v<0||v>100000)) throw new Error(`Wiersz ${i+2}: nieprawidłowy czas lub nieujemna wartość energii/mocy.`);
    return {stamp,pv:nums[0],load:nums[1]};
  });
  const interval = rows[1].stamp-rows[0].stamp;
  if (![900000,1800000,3600000].includes(interval) || rows.some((r,i)=>i && r.stamp-rows[i-1].stamp!==interval))
    throw new Error('Czas musi rosnąć bez luk i duplikatów, co 15, 30 lub 60 minut.');
  const year=new Date(rows[0].stamp).getUTCFullYear();
  const begin=Date.UTC(year,0,1),end=Date.UTC(year+1,0,1);
  if(rows.length!==(end-begin)/interval || rows[0].stamp<begin || rows[0].stamp>=begin+interval || rows.at(-1).stamp>=end)
    throw new Error('Wymagany pełny rok kalendarzowy UTC, bez brakujących interwałów na początku lub końcu.');
  const dt = interval/3600000;
  return {source:'csv',hours:rows.length*dt,rows:rows.map(r=>({stamp:r.stamp,pv:kind[1]==='pv_kwh'?r.pv/dt:r.pv,load:kind[2]==='load_kwh'?r.load/dt:r.load,dt}))};
}

export function makeProfile(data,s,imported=null) {
  if(imported) return {...imported, note:'Pomiar z CSV. Moc PV, produkcja i zużycie formularza nie skalują importu.'};
  const shape=[.35,.35,.35,.35,.35,.35,.8,.8,.8,.4,.4,.4,.4,.4,.4,.4,.4,1.1,1.1,1.1,1.1,1.1,.45,.45];
  const local = new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/Warsaw',hour:'2-digit',hourCycle:'h23'});
  let rows = data.map(([time,pv])=>{const stamp=Date.parse(time);return {stamp,pv:pv*s.pvKwp,load:shape[Number(local.format(new Date(stamp)))],dt:1};});
  const loadSum=rows.reduce((a,r)=>a+r.load,0), production=rows.reduce((a,r)=>a+r.pv,0);
  rows=rows.map(r=>({...r,pv:r.pv*(s.annualProduction===null?1:production>0?s.annualProduction/production:0)*s.profileWeather,load:r.load*(loadSum?s.annualLoad/loadSum:0)}));
  const surplus=rows.reduce((a,r)=>a+Math.max(0,r.pv-r.load),0);
  if(s.knownSurplus!==null) {
    const totalPv=rows.reduce((a,r)=>a+r.pv,0),totalLoad=rows.reduce((a,r)=>a+r.load,0);
    const minimum=Math.max(0,totalPv-totalLoad);
    if(s.knownSurplus<minimum-1e-6 || s.knownSurplus>totalPv+1e-6)
      throw new Error(`Nadwyżka jest niespójna z produkcją i zużyciem. Dla tych danych zakres wynosi ${Math.ceil(minimum)}–${Math.floor(totalPv)} kWh. Zmień założenia lub użyj pomiaru CSV.`);
    if(Math.abs(surplus-s.knownSurplus)>1e-7) {
      const nightWeight=rows.reduce((a,r)=>a+(r.pv===0?r.load:0),0);
      const nightCount=rows.filter(r=>r.pv===0).length;
      const target=rows.map(r=>s.knownSurplus<surplus
        ?(totalPv>0?totalLoad*r.pv/totalPv:r.load)
        :(r.pv===0?(nightWeight>0?totalLoad*r.load/nightWeight:totalLoad/nightCount):0));
      // Blend schedules, not annual totals. Solve the piecewise-linear self-consumption balance.
      let low=0,high=1;
      for(let iteration=0;iteration<36;iteration++) {
        const alpha=(low+high)/2;
        const predicted=rows.reduce((sum,r,i)=>sum+Math.max(0,r.pv-((1-alpha)*r.load+alpha*target[i])),0);
        if((s.knownSurplus<surplus && predicted>s.knownSurplus)||(s.knownSurplus>surplus && predicted<s.knownSurplus))low=alpha;else high=alpha;
      }
      const alpha=(low+high)/2;
      rows=rows.map((r,i)=>({...r,load:(1-alpha)*r.load+alpha*target[i]}));
    }
  }
  return {rows,source:'simulation',hours:rows.reduce((sum,r)=>sum+r.dt,0),note:`PVGIS ${new Date(rows[0].stamp).getUTCFullYear()}, Wrocław, południe 35°, straty 14%. Zużycie domu jest symulowane. Kolejne okresy powtarzają długość profilu referencyjnego.`};
}

const RCEM=[480.01,442.02,178.84,163.19,216.97,136.30,284.83,214.68,279.71,330.27,382.88,466.08];
const monthsFormatter=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Warsaw',year:'numeric',month:'2-digit'});
function monthIndex(stamp) {
  const p=monthsFormatter.formatToParts(new Date(stamp));
  return Number(p.find(x=>x.type==='month').value)-1;
}
function prepareYears(profile,s,market) {
  // UTC offsets from the first sample preserve intervals and avoid DST duplication.
  const first=profile.rows[0].stamp;
  const monthKeys=profile.rows.map(r=>monthIndex(r.stamp));
  const anchor=Date.parse(market.observedAt);
  const startYear=new Date(anchor).getUTCFullYear()+1;
  const years=Array.from({length:s.horizon},(_,y)=>{
    const shift=Date.UTC(startYear,0,1)+y*profile.hours*3600000-first;
    return profile.rows.map((r,i)=>{
      const stamp=r.stamp+shift, elapsed=Math.max(0,(stamp-anchor)/1000), block=market.height+elapsed/600;
      const subsidy=50/2**Math.floor(block/210000);
      const difficulty=s.difficulty*(1+s.difficultyGrowth)**(elapsed/(365.25*86400));
      const factor=(subsidy+s.feesBtc)/(50/2**Math.floor(market.height/210000)+s.feesBtc);
      const btcPerThHour=(s.hashprice===null?1e12*3600*(subsidy+s.feesBtc)/(difficulty*2**32):s.hashprice/1000/24*factor/(1+s.difficultyGrowth)**(elapsed/(365.25*86400)))*(1-s.poolFee)*(1-s.firmwareFee)*s.availability;
      const exportPrice=s.exportMode==='historical'?RCEM[monthKeys[i]]/1000:s.exportPrice;
      return {...r,pv:r.pv*(.995**y),month:monthKeys[i],btcPerThHour,exportPrice:s.negativeFloor?Math.max(0,exportPrice):exportPrice};
    });
  });
  if(s.capacity>0) for(let y=0;y<years.length;y++) {
    const rows=years[y], next=years[y+1]||rows, steps=Math.ceil(24/rows[0].dt);
    const deficits=[...rows,...next.slice(0,steps)].map(r=>Math.max(0,r.load-r.pv)*r.dt);
    const prefix=[0];for(const v of deficits)prefix.push(prefix.at(-1)+v);
    rows.forEach((r,i)=>r.houseNeed=prefix[i+steps+1]-prefix[i+1]);
    const investmentRows=[...rows.map(r=>({...r,ems:y<s.lifetime?s.emsWatts/1000:0})),...next.slice(0,steps).map(r=>({...r,ems:y+1<s.lifetime?s.emsWatts/1000:0}))];
    const investmentPrefix=[0];for(const r of investmentRows)investmentPrefix.push(investmentPrefix.at(-1)+Math.max(0,r.load+r.ems-r.pv)*r.dt);
    rows.forEach((r,i)=>r.investmentNeed=investmentPrefix[i+steps+1]-investmentPrefix[i+1]);
  }
  return years;
}

// FIFO monthly prosumer ledger. Credits become available in the next month.
export function settle(months,s) {
  let credits=[],bill=0,refund=0,used=0;
  const annual=Array.from({length:s.horizon},()=>({bill:0,used:0,refund:0,credited:0,pending:0}));
  for(let m=0;m<months.length;m++) {
    const row=months[m],y=Math.floor(m/12),a=annual[y];
    let returned=0;
    credits=credits.filter(c=>{
      if(m>=c.available+12) {returned+=Math.min(c.remaining,c.raw*s.refundRate);return false;}
      return true;
    });
    let due=row.grid*s.eligiblePrice*s.depositUse,usedNow=0;
    for(const c of credits) if(c.available<=m) {const v=Math.min(due,c.remaining);c.remaining-=v;due-=v;usedNow+=v;}
    const raw=row.exportRaw;
    if(raw>0) {credits.push({raw,remaining:raw*s.depositFactor,available:m+1});a.credited+=raw*s.depositFactor;}
    // Negative export is a separate charge when the selected contract allows it.
    const paid=row.grid*s.importPrice-usedNow-returned+Math.max(0,-raw);
    a.bill+=paid;a.used+=usedNow;a.refund+=returned;
    bill+=paid;refund+=returned;used+=usedNow;
    a.pending=credits.reduce((v,c)=>v+c.remaining,0);
  }
  return {annual,bill,refund,used,pending:credits.reduce((v,c)=>v+c.remaining,0)};
}

function dispatch(years,s,model=null,opportunities=null,inactiveShadow=null,investment=false) {
  const cap=s.capacity,lo=cap*s.reserve,hi=cap*s.usableFraction,eta=Math.sqrt(s.roundtrip);
  let soc=lo,running=false,runTime=0,offTime=1e9,startupRemaining=0;
  const yearsOut=[],months=[];
  for(let y=0;y<years.length;y++) {
    const yr={startSoc:soc,houseLoad:0,emsEnergy:0,emsPv:0,emsBattery:0,emsGrid:0,chargeKwh:0,maxChargeKw:0,maxDischargeKw:0,minSoc:soc,maxSoc:soc,simultaneous:0,btc:0,hours:0,hashHours:0,energy:0,asicGrid:0,asicPv:0,pv:0,direct:0,batteryHouse:0,batteryMining:0,losses:0,cycles:0,starts:0,grid:0,export:0,wear:0,monthly:Array.from({length:12},()=>({pv:0,house:0,ems:0,emsPv:0,emsBattery:0,emsGrid:0,asic:0,asicPv:0,asicBattery:0,asicGrid:0,export:0,btc:0,grid:0,exportRaw:0}))};
    const price=s.btcPrice*(1+s.btcGrowth)**y;
    for(let i=0;i<years[y].length;i++) {
      const r=years[y][i],dt=r.dt,active=Boolean(model && y<s.lifetime && s.availability>0);
      // Additional EMS belongs to the investment, including its zero-mining plan.
      // It runs continuously through the assumed ASIC life; existing-house load is unchanged.
      const ems=investment&&y<s.lifetime?s.emsWatts/1000:0;
      const direct=Math.min(r.pv,r.load),emsPv=Math.min(Math.max(0,r.pv-r.load),ems);
      const surplus0=Math.max(0,r.pv-r.load-ems),deficit0=Math.max(0,r.load+ems-r.pv);
      let surplus=surplus0,grid=deficit0,batteryDis=0,charge=0,mineDis=0,mineGrid=0,hashHours=0,energy=0,btc=0;
      const homeDis=Math.min(grid,s.dischargeKw,Math.max(0,soc-lo)*eta/dt);
      soc-=homeDis*dt/eta;grid-=homeDis;batteryDis+=homeDis;
      const houseBattery=Math.min(Math.max(0,r.load-r.pv),homeDis),emsBattery=homeDis-houseBattery,emsGrid=Math.max(0,ems-emsPv-emsBattery);
      const target=active?(model.watts*s.quantity+s.extraWatts)/1000:0;
      // Amortize starting cost over startup plus one productive interval.
      // Actual zero-hash startup time is carried across intervals below.
      const productiveFraction=running?1:dt/(dt+s.startMinutes/60);
      const valuePerKwh=active?model.th*s.quantity*r.btcPerThHour*price*productiveFraction/target:0;
      const signal=!active&&inactiveShadow?inactiveShadow:opportunities;
      const exportValue=signal?signal[y*12+r.month]:r.exportPrice*s.depositFactor;
      // Forecast house reserve for the next 24 hours, clamped by physical capacity.
      const houseNeed=(investment?r.investmentNeed:r.houseNeed)||0;
      const reserveTarget=s.policy==='home'?Math.min(hi,lo+houseNeed/eta):lo;
      const homeStorageValue=houseNeed>0?s.importPrice*eta*eta-s.wear:0;
      const storageWorthwhile=s.policy==='home' || homeStorageValue>Math.max(0,exportValue);
      const chargeFirst=s.policy==='home' || (storageWorthwhile && homeStorageValue>valuePerKwh);
      const chargeBattery=()=>{if(batteryDis>1e-9)return;const p=Math.min(surplus,s.chargeKw,Math.max(0,hi-soc)/eta/dt);soc+=p*dt*eta;surplus-=p;charge+=p;};
      if(chargeFirst) chargeBattery();
      const batteryAvailable=s.batteryMining && charge<1e-9?Math.min(Math.max(0,s.dischargeKw-homeDis),Math.max(0,soc-reserveTarget)*eta/dt):0;
      const margin=running?0:s.startMargin;
      const available=surplus+batteryAvailable+s.gridLimit;
      const canRun=active && target>0 && available>=target+margin && (running || offTime>=s.minOffMinutes/60);
      const energyCost=(Math.min(surplus,target)*exportValue+Math.min(Math.max(0,target-surplus),batteryAvailable)*(s.policy==='home'?s.importPrice+s.wear:s.wear+Math.max(0,exportValue)/(eta*eta))+Math.max(0,target-surplus-batteryAvailable)*s.importPrice)/Math.max(target,.001);
      const profitable=valuePerKwh>energyCost;
      const keep=running && (startupRemaining>0 || runTime<s.minRunMinutes/60);
      if(canRun && (profitable || keep)) {
        mineDis=Math.min(Math.max(0,target-surplus),batteryAvailable);
        mineGrid=Math.max(0,target-surplus-mineDis);
        soc-=mineDis*dt/eta;batteryDis+=mineDis;
        surplus=Math.max(0,surplus-target);grid+=mineGrid;
        if(!running) {startupRemaining=s.startMinutes/60;runTime=0;}
        const startup=Math.min(dt,startupRemaining);
        startupRemaining=Math.max(0,startupRemaining-dt);
        energy=target*dt;hashHours=dt-startup;
        btc=model.th*s.quantity*r.btcPerThHour*hashHours;
        if(!running) yr.starts++;
        running=true;runTime+=dt;offTime=0;
        yr.hours+=dt;yr.hashHours+=hashHours;
      } else {running=false;runTime=0;startupRemaining=0;offTime+=dt;}
      if(!chargeFirst && storageWorthwhile) chargeBattery();
      yr.houseLoad+=r.load*dt;yr.chargeKwh+=charge*dt;
      yr.maxChargeKw=Math.max(yr.maxChargeKw,charge);yr.maxDischargeKw=Math.max(yr.maxDischargeKw,batteryDis);
      yr.minSoc=Math.min(yr.minSoc,soc);yr.maxSoc=Math.max(yr.maxSoc,soc);
      if(charge>1e-9 && batteryDis>1e-9)yr.simultaneous++;
      yr.btc+=btc;yr.energy+=energy;yr.asicGrid+=mineGrid*dt;yr.asicPv+=energy-(mineGrid+mineDis)*dt;yr.pv+=r.pv*dt;yr.direct+=direct*dt;
      yr.emsEnergy+=ems*dt;yr.emsPv+=emsPv*dt;yr.emsBattery+=emsBattery*dt;yr.emsGrid+=emsGrid*dt;
      yr.batteryHouse+=houseBattery*dt;yr.batteryMining+=mineDis*dt;
      yr.losses+=(charge*(1-eta)+batteryDis*(1/eta-1))*dt;
      yr.grid+=grid*dt;yr.export+=surplus*dt;yr.wear+=batteryDis*dt*s.wear;
      const m=yr.monthly[r.month];m.pv+=r.pv*dt;m.house+=(direct+houseBattery)*dt;m.ems+=ems*dt;m.emsPv+=emsPv*dt;m.emsBattery+=emsBattery*dt;m.emsGrid+=emsGrid*dt;m.asic+=energy;m.asicPv+=energy-(mineGrid+mineDis)*dt;m.asicBattery+=mineDis*dt;m.asicGrid+=mineGrid*dt;m.export+=surplus*dt;m.btc+=btc;m.grid+=grid*dt;m.exportRaw+=surplus*dt*r.exportPrice;
      // Balance at AC boundary, including battery flows. Physical constraints outrank runtime timers.
      if(Math.abs(r.pv+grid+batteryDis-r.load-ems-surplus-charge-(energy/dt))>1e-6 || soc<lo-1e-7 || soc>hi+1e-7) throw new Error('Naruszenie bilansu energii lub SOC.');
    }
    yr.cycles=cap?((yr.batteryHouse+yr.emsBattery+yr.batteryMining)/cap):0;yr.endSoc=soc;
    months.push(...yr.monthly);yearsOut.push(yr);
  }
  return {years:yearsOut,ledger:settle(months,s)};
}

// A bounded family of dispatch plans, all evaluated against the full FIFO bill.
// The zero-mining plan is always admissible. This is not a global optimizer.
function planScore(run,s) {
  return run.years.reduce((sum,r,y)=>sum+r.btc*s.btcPrice*(1+s.btcGrowth)**y-run.ledger.annual[y].bill-r.wear,0);
}
function planFamily(years,s) {
  const nominal=years.flatMap(rows=>Array.from({length:12},(_,m)=>(rows.find(r=>r.month===m)?.exportPrice||0)*s.depositFactor));
  return [0,.25,.5,.75,1].map(f=>nominal.map(p=>p*f));
}
function bestBaseline(years,s,family,investment=false) {
  let best=null;
  for(const shadow of (s.policy==='home'||s.capacity===0?family.slice(0,1):family)) {
    const run=dispatch(years,s,null,shadow,null,investment),score=planScore(run,s);
    if(!best||score>best.score+1e-8)best={run,score,shadow};
  }
  return best;
}

export function calculate(raw,dataset,market,models,imported=null) {
  const s=normalize(raw,market,Boolean(imported)),profile=makeProfile(dataset,s,imported);
  const years=prepareYears(profile,s,market),family=planFamily(years,s);
  const reference=bestBaseline(years,s,family);
  // A local derivative is only one candidate signal, never the final cost of a plan.
  const baseMonths=reference.run.years.flatMap(y=>y.monthly);
  family.push(baseMonths.map((month,index)=>{
    if(month.export<=0)return 0;
    const kwh=Math.min(1,month.export),price=month.exportRaw/month.export;
    const changed=baseMonths.map((r,i)=>i===index?{...r,exportRaw:r.exportRaw-kwh*price}:r);
    return (settle(changed,s).bill-reference.run.ledger.bill)/kwh;
  }));
  const extraBase=bestBaseline(years,s,[family.at(-1)]);
  const bestBase=extraBase.score>reference.score+1e-8?extraBase:reference,baseline=bestBase.run;
  const noBattery=s.capacity>0?bestBaseline(years,{...s,capacity:0},family).run:baseline;
  const results=models.filter(m=>s.selected.includes(m.id)).map(original=>{
    const spec=s.deviceSpecs[original.id]||{};
    const model={...original,th:bounded(spec.th,original.th,1,100000),watts:bounded(spec.watts,original.watts,1,1000000)};
    model.customSpec=(model.th!==original.th || model.watts!==original.watts);
    if(model.customSpec)model.efficiency=model.watts/model.th;
    const overridden=s.devicePrices[model.id];
    const priceKnown=(overridden!=='' && overridden!=null && Number.isFinite(Number(overridden))) || Number.isFinite(model.price);
    const devicePrice=overridden!=='' && overridden!=null ? bounded(overridden,model.price||0,0,1000000) : model.price||0;
    const detailed=Object.values(s.costs),complete=detailed.every(v=>v!==null);
    const infra=s.costMode==='budget'?s.infraBudget:detailed.reduce((v,x)=>v+(x||0),0);
    const capex=devicePrice*s.quantity+infra+(s.battery==='new'?(s.batteryBudget||0):0);
    const investmentOff=bestBaseline(years,s,family,true);
    let run=investmentOff.run,score=investmentOff.score,chosen='off';
    if(s.availability>0)family.forEach((shadow,index)=>{
      const candidate=dispatch(years,s,model,shadow,investmentOff.shadow,true),candidateScore=planScore(candidate,s);
      if(candidate.years.some(r=>r.energy>0)&&candidateScore>score+1e-8){run=candidate;score=candidateScore;chosen=index;}
    });
    const planner={candidateCount:family.length+1,chosen,operatingGain:score-bestBase.score,method:'full-ledger-candidate-search'};
    let btcTotal=0,cash=-capex,payback=null,cashPayback=null;
    const annual=run.years.map((r,y)=>{
      const base=baseline.years[y],ledgerBase=baseline.ledger.annual[y],ledger=run.ledger.annual[y];
      const nbLedger=noBattery.ledger.annual[y];
      const exportLost=(ledgerBase.used+ledgerBase.refund)-(ledger.used+ledger.refund);
      const billDifference=ledgerBase.bill-ledger.bill;
      const opex=y<s.lifetime?s.maintenance:0;
      const extraWear=r.wear-base.wear;
      const price=s.btcPrice*(1+s.btcGrowth)**y;
      const value=r.btc*price;
      const benefit=value+billDifference-opex-extraWear;
      const combinedBenefit=value+(nbLedger.bill-ledger.bill)-opex-r.wear;
      const operatingCash=billDifference-opex-extraWear+(s.sellBtc?value:0);
      btcTotal+=r.btc;cash+=operatingCash;
      const portfolio=s.sellBtc?0:btcTotal*price;
      const result=cash+portfolio;
      if(payback===null && result>=0) payback=y+1;
      if(cashPayback===null && cash>=0) cashPayback=y+1;
      return {...r,year:new Date(Date.parse(market.observedAt)).getUTCFullYear()+1+y,value,benefit,combinedBenefit,exportLost,billDifference,opex,extraWear,btcTotal,portfolio,cash,result,npv:0,depositPending:ledger.pending,depositUsed:ledger.used,depositRefund:ledger.refund,houseSelfConsumption:r.direct+r.batteryHouse};
    });
    // Full investment with a new battery compares against PV without that purchase.
    if(s.battery==='new') {
      let combinedCash=-capex,hold=0;payback=null;cashPayback=null;
      annual.forEach((r,y)=>{
        hold+=r.btc;
        const cashBenefit=r.combinedBenefit-r.value+(s.sellBtc?r.value:0);
        combinedCash+=cashBenefit;r.cash=combinedCash;r.portfolio=s.sellBtc?0:hold*s.btcPrice*(1+s.btcGrowth)**y;r.result=r.cash+r.portfolio;
        if(payback===null&&r.result>=0)payback=y+1;
        if(cashPayback===null&&r.cash>=0)cashPayback=y+1;
      });
    }
    // NPV for holding BTC uses operating cash flows plus hypothetical terminal liquidation.
    let discountedCash=-capex;
    annual.forEach((r,y)=>{
      const previous=y?annual[y-1].cash:-capex;
      discountedCash+=(r.cash-previous)/(1+s.discount)**(y+1);
      r.npv=discountedCash+r.portfolio/(1+s.discount)**(y+1);
    });
    const hydroReady=!model.id.includes('hydro')||(raw.hydroConfirmed===true&&s.costMode==='detailed'&&s.costs.ventilation!==null&&s.extraWatts>0);
    const validEconomics=hydroReady&&priceKnown&&(s.costMode==='budget'?s.infraBudget!==null:complete)&&(s.battery!=='new'||s.batteryBudget!==null);
    const lossAfterPayback=validEconomics&&payback!==null?(annual.findIndex((r,i)=>i+1>payback&&r.result<0)+1||null):null;
    if(!validEconomics) annual.forEach(r=>{r.cash=null;r.result=null;r.npv=null;});
    const paybackFunding=validEconomics&&payback!==null?(annual[payback-1].cash>=0?'cash':'portfolio'):null;
    return {validEconomics,planner,lossAfterPayback,paybackReversed:lossAfterPayback!==null,paybackAfterLife:validEconomics&&payback!==null&&payback>s.lifetime,paybackFunding,model,devicePrice,priceKnown,capex,complete:s.costMode==='detailed'&&complete,priceMode:s.costMode,knownSubtotal:devicePrice*s.quantity+detailed.reduce((v,x)=>v+(x||0),0),annual,payback:validEconomics?payback:null,cashPayback:validEconomics?cashPayback:null,roi:validEconomics&&capex>0?(s.battery==='new'?annual[0].combinedBenefit:annual[0].benefit)/capex:null,npv:validEconomics?annual.at(-1).npv:null};
  });
  return {engineVersion:ENGINE_VERSION,assumptionNotes:!imported&&raw.annualLoad===''?['Nie podano zużycia domu: zastosowano przykładowe 5000 kWh/rok.']:[],settings:s,source:profile.source,note:profile.note,hours:profile.hours,results,baseline:baseline.years[0],baselineLedger:baseline.ledger.annual[0],noBattery:noBattery.years[0],market};
}
