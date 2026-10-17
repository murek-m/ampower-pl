import { randomUUID } from 'node:crypto';
import { calculateInternal, draftFromEstimate } from './internal-calculator.js';
import { approvalCurrent, projectPublicCatalog } from './catalog.js';
import { estimate, selectionFromRaw } from '../smart-home-energy/pricing.js';
import { analyzeDescription } from './description.js';
import { fingerprint } from './store.js';
export const STATES = ['new','estimating','draft','approved','sent','accepted'];
export const labels = {new:'Nowe zapytanie',estimating:'Oczekuje na wycenę',draft:'Oferta robocza',approved:'Zatwierdzona',sent:'Wysłana ręcznie',accepted:'Zaakceptowane zlecenie'};
export function customerData(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value) || Object.keys(value).some(k => !['name','email','phone','locality'].includes(k))) throw new Error('Nieprawidłowe dane klienta');
  const out = {};
  for (const [key,max] of [['name',160],['email',200],['phone',40],['locality',200]]) {
    if (typeof value[key] !== 'string' || value[key].length > max || /[\x00-\x1f]/.test(value[key])) throw new Error('Nieprawidłowe dane klienta');
    out[key] = value[key].trim();
  }
  if (!out.name || out.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(out.email)) throw new Error('Podaj nazwę klienta i poprawny e-mail, jeśli jest znany');
  return out;
}
export function blankQuote() {
  return {lines:[],reserveLaborPercent:null,allocatedOverheadNet:null,targetMarginPercent:30,marginBasis:'total',discountPercent:0,finalSaleNet:null,adjustmentVatRate:null,adjustmentVatApproved:false,validityDays:14,terms:'',exclusions:'',technicalNotes:'',warrantyTerms:'',serviceTerms:'',warrantyApproved:false,serviceApproved:false,technicalChecked:false,costsChecked:false};
}
export function catalogLine(book, catalogId, quantity = 1, now = new Date()) {
  const product = book.products.find(p => p.id === catalogId);
  const row = product || book.services.find(s => s.id === catalogId);
  if (!row) throw new Error('Brak pozycji w katalogu');
  const group = product ? product.existingOnly ? 'configuration' : 'hardware' : catalogId === 'materials' ? 'materials' : ['travel','shipping'].includes(catalogId) ? 'travel' : catalogId.startsWith('install-') ? 'installation' : 'configuration';
  const ready = Boolean(approvalCurrent(row,now));
  const physical = ['hardware','materials'].includes(group);
  const hourly = group === 'installation' ? book.internalPolicy.costHourlyInstallation : group === 'travel' ? book.internalPolicy.costHourlyTravel : book.internalPolicy.costHourlyConfiguration;
  const policyReady = book.internalPolicy.status === 'approved';
  return {id:randomUUID(),catalogId,label:product ? `${product.manufacturer} — ${product.model}` : row.label,manufacturer:product?.manufacturer || '',model:product?.model || '',group,quantity,
    unitCostNet:ready && Number.isFinite(row.purchaseNet) ? row.purchaseNet : null,
    unitSaleNet:ready && Array.isArray(row.saleNetRange) ? row.saleNetRange[1] : null,
    hoursPerUnit:physical ? 0 : ready && Array.isArray(row.hoursRange) ? row.hoursRange[1] : null,
    hourlyCostNet:physical ? 0 : policyReady ? hourly : null,
    vatRate:ready ? row.vatRate : null,vatApproved:ready && row.vatApproved === true,priceApproved:ready && (physical || policyReady),technicalNotes:''};
}
export function descriptionQuote(analysis, book, now = new Date()) {
  const quote = blankQuote();
  // Brak jednoznacznego modelu/ilości pozostaje brakiem. Sugestie są oddzielone od BOM.
  quote.lines = analysis.suggestions.map(s => ({id:randomUUID(),label:`${s.label} — kwalifikacja i dobór`,group:'configuration',quantity:s.quantity,
    unitCostNet:null,unitSaleNet:null,hoursPerUnit:null,hourlyCostNet:null,vatRate:null,vatApproved:false,priceApproved:false,technicalNotes:'Brak potwierdzonego modelu; nie jest pozycją zakupową.'}));
  quote.technicalNotes = analysis.missing.join('\n');
  return quote;
}
export function draftForInquiry(record, book, now = new Date()) {
  if (record.internalDraft) {
    const quote = structuredClone(record.internalDraft);
    // Zachowaj gotowe wyceny z etapu 7; stare hipotezy nigdy nie stają się zatwierdzeniem.
    for (const line of quote.lines) {
      line.priceApproved ??= false;
      if (book.internalPolicy.status !== 'approved' && line.hoursPerUnit !== 0) line.hourlyCostNet = null;
    }
    quote.marginBasis = 'total'; quote.discountPercent = 0;
    return quote;
  }
  const selection = selectionFromRaw(record.data);
  return draftFromEstimate(estimate(selection,projectPublicCatalog(book,now),now),book,now,selection);
}
export async function createManual(store, body, book, actor, now = new Date()) {
  if (!/^[0-9a-f-]{36}$/i.test(body.key || '')) throw new Error('Wymagany klucz próby zapisu');
  const customer = customerData(body.customer);
  const analysis = analyzeDescription(body.description,book);
  const hash = fingerprint({customer,description:body.description});
  return store.transaction(async () => {
    const key = `manual:${body.key}`;
    const previous = await store.get(key);
    if (previous) {if (previous.payloadHash !== hash) throw Object.assign(new Error('Klucz próby użyty dla innych danych'),{status:409}); return previous;}
    const record = {storageKey:key,payloadHash:hash,receipt:{inquiryId:`AMP-${randomUUID()}`,receivedAt:now.toISOString()},data:{...customer,notes:body.description},source:'manual',demo:true,status:'estimating',descriptionAnalysis:analysis,internalDraft:descriptionQuote(analysis,book,now),notification:{status:'demo-disabled',recipient:'kuba@ampower.pl',attempts:0},offer:null,audit:[{action:'manual-created',actor,at:now.toISOString()}]};
    await store.put(key,record);return record;
  });
}
export function recordState(record) { return record.status || (record.offer ? record.offer.state : 'new'); }
export function dashboard(records, now = new Date()) {
  const counts = Object.fromEntries(STATES.map(s => [s,0]));
  let net = 0, profit = 0, complete = 0;
  const rows = records.map(r => {
    const state = recordState(r); counts[state] = (counts[state] || 0) + 1;
    const c = r.offer ? calculateInternal(r.offer.quote) : null;
    if (c?.status === 'complete') {net += c.totals.saleNet;profit += c.totals.profitAfterIncludedCostsNet;complete++;}
    const reminder = ['new','estimating'].includes(state) && +now - Date.parse(r.receipt.receivedAt) > 2 * 86400000;
    return {id:r.receipt.inquiryId,name:r.data.name,locality:r.data.locality,receivedAt:r.receipt.receivedAt,state,revision:r.offer?.revision || 0,net:c?.totals?.saleNet ?? null,profit:c?.totals?.profitAfterIncludedCostsNet ?? null,reminder,notification:r.notification.status,source:r.source || 'configurator'};
  }).sort((a,b) => b.receivedAt.localeCompare(a.receivedAt));
  return {counts,rows,net:Math.round(net*100)/100,profit:Math.round(profit*100)/100,margin:net ? profit/net*100 : null,complete,reminders:rows.filter(r => r.reminder).length,notice:'Sumy obejmują aktualne, kompletne wersje; dane demonstracyjne. Wartość ofert nie jest przychodem.'};
}
