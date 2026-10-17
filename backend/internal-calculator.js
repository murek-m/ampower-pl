// Poufne koszty AMPOWER: moduł poza publicznym buildem i API.
import { cents } from '../smart-home-energy/pricing.js';
import { approvalCurrent } from './catalog.js';
export function calculateInternal(quote) {
  const gaps = [];
  const num = (n, name) => { if (!Number.isFinite(n) || n < 0) { gaps.push(name); return 0; } return n; };
  const keys = new Set();
  const workKeys = new Set();
  let hardware = 0, materials = 0, installation = 0, configuration = 0, travel = 0, additional = 0, hours = 0, sale = 0, labor = 0;
  const publicLines = [];
  for (const line of quote.lines || []) {
    if (line.priceApproved === false) gaps.push(`${line.id}: ceny wymagają zatwierdzenia`);
    if (!line.id || keys.has(line.id)) gaps.push('Powtórzona czynność: ' + line.id);
    keys.add(line.id);
    if (line.workKey) { if (workKeys.has(line.workKey)) gaps.push(`Powtórzony zakres pracy: ${line.workKey}`); workKeys.add(line.workKey); }
    const quantity = num(line.quantity, `${line.id}: ilość`);
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 999) gaps.push(`${line.id}: pełna ilość 1–999`);
    const unitCost = num(line.unitCostNet, `${line.id}: koszt zakupu / koszt dodatkowy`);
    const time = num(line.hoursPerUnit, `${line.id}: czas pracy`);
    const hourly = num(line.hourlyCostNet, `${line.id}: koszt godziny`);
    if (time > 0 && hourly <= 0) gaps.push(`${line.id}: własna praca wymaga dodatniej stawki`);
    const group = line.group;
    if (!['hardware', 'materials', 'installation', 'configuration', 'travel', 'additional'].includes(group)) gaps.push(`${line.id}: grupa kosztów`);
    if (['hardware', 'materials', 'additional'].includes(group) && time > 0) gaps.push(`${line.id}: robociznę zapisz oddzielnie`);
    const ownLabor = cents(time * quantity * hourly);
    const cost = cents(unitCost * quantity) + ownLabor;
    if (group === 'hardware') hardware += cost;
    if (group === 'materials') materials += cost;
    if (group === 'installation') installation += cost;
    if (group === 'configuration') configuration += cost;
    if (group === 'travel') travel += cost;
    if (group === 'additional') additional += cost;
    hours += time * quantity;
    labor += ownLabor;
    const netCents = cents(num(line.unitSaleNet, `${line.id}: cena sprzedaży`) * quantity);
    if (![0, 8, 23].includes(line.vatRate) || line.vatApproved !== true) gaps.push(`${line.id}: kwalifikacja VAT`);
    const vat = [0, 8, 23].includes(line.vatRate) ? line.vatRate : 0;
    sale += netCents;
    publicLines.push({ id: line.id, label: line.label, ...(line.manufacturer ? {manufacturer:line.manufacturer} : {}), ...(line.model ? {model:line.model} : {}), group, quantity, netCents, vatRate: vat, vatCents: Math.round(netCents * vat / 100) });
  }
  if (!quote.lines?.length) gaps.push('Brak pozycji kosztorysu');
  const reservePercent = num(quote.reserveLaborPercent, 'Rezerwa kosztowa');
  if (reservePercent > 100) gaps.push('Rezerwa poza zakresem');
  const reserve = Math.round(labor * reservePercent / 100);
  const overhead = cents(num(quote.allocatedOverheadNet, 'Koszty stałe i pozyskania'));
  const direct = hardware + materials + installation + configuration + travel + additional + reserve;
  const total = direct + overhead;
  const discountPercent = num(quote.discountPercent ?? 0, 'Rabat');
  if (discountPercent >= 100) gaps.push('Rabat 0–<100%');
  if (discountPercent > 0 && quote.finalSaleNet != null) gaps.push('Wybierz rabat albo końcową korektę ceny');
  const beforeDiscount = sale;
  // Podatek od rzeczywistej ceny każdej pozycji po rabacie, również przy mieszanym VAT.
  for (const line of publicLines) {
    line.netCents = Math.round(line.netCents * (1 - discountPercent / 100));
    line.vatCents = Math.round(line.netCents * line.vatRate / 100);
  }
  sale = publicLines.reduce((sum, line) => sum + line.netCents, 0);
  const target = quote.targetMarginPercent;
  if (!Number.isFinite(target) || target < 0 || target >= 100) gaps.push('Docelowa marża 0–<100%');
  if (quote.finalSaleNet !== null && quote.finalSaleNet !== undefined) {
    const final = cents(num(quote.finalSaleNet, 'Końcowa cena sprzedaży'));
    // Korekta ceny osobno, podatek tej korekty musi być świadomie zakwalifikowany.
    const adjustment = final - sale;
    if (adjustment !== 0) {
      if (![0, 8, 23].includes(quote.adjustmentVatRate) || quote.adjustmentVatApproved !== true) gaps.push('VAT korekty właściciela');
      const vat = [0, 8, 23].includes(quote.adjustmentVatRate) ? quote.adjustmentVatRate : 0;
      publicLines.push({ id: 'owner-adjustment', label: 'Korekta ceny uzgodnionego zakresu', group: 'additional', quantity: 1, netCents: adjustment, vatRate: vat, vatCents: Math.round(adjustment * vat / 100) });
    }
    sale = final;
  }
  if (sale <= 0) gaps.push('Cena sprzedaży musi być dodatnia');
  if (gaps.length) return { status: 'incomplete', gaps: [...new Set(gaps)], totals: null, publicLines: [] };
  const vat = publicLines.reduce((sum, l) => sum + l.vatCents, 0);
  const gross = sale + vat;
  if (gross < 0 || !Number.isSafeInteger(gross)) return { status: 'incomplete', gaps: ['Nieprawidłowa kwota końcowa'], totals: null, publicLines: [] };
  const contribution = sale - direct;
  const profit = sale - total;
  const marginBasis = quote.marginBasis === 'total' ? total : direct;
  const marginValue = sale - marginBasis;
  if (![direct,total,sale,vat,gross].every(Number.isSafeInteger)) return { status:'incomplete', gaps:['Kwoty przekraczają bezpieczny zakres'], totals:null, publicLines:[] };
  return { status: 'complete', gaps: [], totals: { hardwareNet: hardware / 100, materialsNet: materials / 100, installationNet: installation / 100, configurationNet: configuration / 100,
    travelNet: travel / 100, additionalNet: additional / 100, laborNet: labor / 100, hours, reserveNet: reserve / 100, allocatedOverheadNet: overhead / 100,
    directCostNet: direct / 100, totalCostNet: total / 100, saleNet: sale / 100, vat: vat / 100, saleGross: gross / 100,
    contributionNet: contribution / 100, marginPercent: contribution / sale * 100, markupPercent: direct ? contribution / direct * 100 : null,
    marginAfterIncludedCostsPercent:profit / sale * 100, markupAfterIncludedCostsPercent:total ? profit / total * 100 : null,
    discountNet:(beforeDiscount - (discountPercent > 0 ? sale : beforeDiscount)) / 100, marginBasis:quote.marginBasis === 'total' ? 'total' : 'direct',
    profitAfterIncludedCostsNet: profit / 100, targetMarginPercent: target, targetSaleNet: Math.ceil(marginBasis * 100 / (100 - target) - 1e-8) / 100,
    meetsMargin: marginValue / sale * 100 + 1e-9 >= target, disclaimer: 'Wynik po uwzględnionych kosztach, przed podatkiem dochodowym; nie zysk netto firmy.' }, publicLines };
}
export function draftFromEstimate(estimate, book, now = new Date(), selection = null) {
  const sourceLines = [...estimate.lines];
  if (!sourceLines.length && selection) {
    const hardware = new Map();
    for (const [index, entry] of selection.items.entries()) {
      const p = book.products.find(p => p.id === entry.deviceId);
      if (entry.ownership !== 'existing') sourceLines.push({ key:`scope:${index}`, id:p?.id || 'unselected', label:p ? `${p.manufacturer} — ${p.model}` : `Dobór urządzeń: ${entry.category}`, group:'hardware', quantity:entry.quantity, netCents:[null,null], vatRate:null });
      if (entry.ownership === 'new' && p?.installationService && selection.delivery !== 'remote') sourceLines.push({ key:`installation:${index}`, id:p.installationService, label:'Montaż: ' + p.model, group:'installation', quantity:entry.quantity, netCents:[null,null], vatRate:null });
      if (entry.ownership === 'new') for (const id of p?.dependencyIds || []) if (!selection.ownedInfrastructure?.includes(id)) hardware.set(id,1);
    }
    if (selection.host === 'needed') hardware.set('p01',1);
    for (const [id,quantity] of hardware) {
      if (sourceLines.some(l=>l.id===id)) continue;
      const p=book.products.find(p=>p.id===id);
      sourceLines.push({key:`shared:${id}`,id,label:p ? `${p.manufacturer} — ${p.model}` : id,group:'hardware',quantity,netCents:[null,null],vatRate:null});
    }
    const knownSystems=selection.items.every(i=>i.systemId);
    const knownPoints=selection.items.every(i=>Number.isInteger(i.quantity));
    for (const [id, quantity] of [[selection.host === 'owned' ? 'expansion' : 'base',selection.host === 'unknown' ? null : 1],['integration',knownSystems ? new Set(selection.items.map(i => i.systemId)).size : null],['point',knownPoints ? selection.items.reduce((n,i)=>n+i.quantity*(book.products.find(p=>p.id===i.deviceId)?.pointsPerUnit ?? 1),0) : null],['simple',selection.simpleScenes],['advanced',selection.advancedScenes]]) {
      if (quantity === 0) continue;
      const s = book.services.find(s => s.id === id);
      sourceLines.push({ key:id,id,label:s.label,group:'configuration',quantity,netCents:[null,null],vatRate:null });
    }
    if (selection.delivery === 'local') sourceLines.push({ key:'travel',id:'travel',label:'Dojazd do ustalenia',group:'travel',quantity:1,netCents:[null,null],vatRate:null });
  }

  const lines = sourceLines.map(l => {
    const item = [...book.products, ...book.services].find(row => row.id === l.id);
    const hours = item?.hoursRange;
    const approved = item && approvalCurrent(item, now);
    const group = l.group === 'hardware' && l.id === 'materials' ? 'materials' : l.group;
    return { id: l.key, label: l.label, group, quantity: l.quantity, ...(item ? {catalogId:item.id,manufacturer:item.manufacturer || '',model:item.model || ''} : {}), priceApproved:Boolean(approved),
      unitCostNet: approved && Number.isFinite(item?.purchaseNet) ? item.purchaseNet : null,
      hoursPerUnit: approved && Array.isArray(hours) ? hours[1] : null,
      hourlyCostNet: group === 'installation' ? book.internalPolicy.costHourlyInstallation : group === 'travel' ? book.internalPolicy.costHourlyTravel : book.internalPolicy.costHourlyConfiguration,
      unitSaleNet: l.netCents[1] === null ? null : l.netCents[1] / 100 / l.quantity, vatRate: l.vatRate, vatApproved: approved && item?.vatApproved === true };
  });
  return { lines, reserveLaborPercent: book.internalPolicy.reserveLaborPercent, allocatedOverheadNet: null, targetMarginPercent: book.internalPolicy.targetMarginPercent,
    finalSaleNet: null, adjustmentVatRate: null, adjustmentVatApproved: false, validityDays: 14, terms: '', exclusions: '', technicalChecked: false, costsChecked: false };
}
