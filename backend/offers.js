import { fingerprint } from './store.js';
import { calculateInternal } from './internal-calculator.js';
const snapshot = record => ({ inquiryId:record.receipt.inquiryId, customer:{ name:record.data.name, email:record.data.email, locality:record.data.locality, ...(record.data.phone ? {phone:record.data.phone} : {}) }, quote:record.offer.quote, revision:record.offer.revision });
export function reviseOffer(record, quote, actor, now = new Date()) {
  if (!actor?.trim()) throw new Error('Wymagany operator właściciela');
  const allowed = ['lines','reserveLaborPercent','allocatedOverheadNet','targetMarginPercent','finalSaleNet','adjustmentVatRate','adjustmentVatApproved','validityDays','terms','exclusions','technicalChecked','marginException','costsChecked','discountPercent','marginBasis','technicalNotes','warrantyTerms','serviceTerms','warrantyApproved','serviceApproved'];
  if (!quote || Object.keys(quote).some(k => !allowed.includes(k)) || !Array.isArray(quote.lines) || quote.lines.length > 100) throw new Error('Nieprawidłowy kosztorys');
  const lineKeys = ['id','label','group','quantity','unitCostNet','hoursPerUnit','hourlyCostNet','unitSaleNet','vatRate','vatApproved','priceApproved','catalogId','manufacturer','model','technicalNotes','workKey'];
  for (const l of quote.lines) if (!l || Object.keys(l).some(k => !lineKeys.includes(k)) || typeof l.label !== 'string' || l.label.length > 300 || typeof l.id !== 'string' || l.id.length > 100 || ['catalogId','manufacturer','model','technicalNotes','workKey'].some(k => l[k] !== undefined && (typeof l[k] !== 'string' || l[k].length > 1000))) throw new Error('Nieprawidłowy opis pozycji');
  for (const key of ['terms','exclusions','marginException','technicalNotes','warrantyTerms','serviceTerms']) if (quote[key] !== undefined && (typeof quote[key] !== 'string' || quote[key].length > 4000)) throw new Error('Nieprawidłowe warunki oferty');
  for (const key of ['technicalChecked','costsChecked','warrantyApproved','serviceApproved','adjustmentVatApproved']) if (quote[key] !== undefined && typeof quote[key] !== 'boolean') throw new Error('Nieprawidłowe zatwierdzenie');
  for (const l of quote.lines) for (const key of ['vatApproved','priceApproved']) if (l[key] !== undefined && typeof l[key] !== 'boolean') throw new Error('Nieprawidłowe zatwierdzenie pozycji');
  if (quote.marginBasis !== undefined && !['direct','total'].includes(quote.marginBasis)) throw new Error('Nieprawidłowa podstawa marży');
  const next = structuredClone(record);
  next.offerHistory ||= [];
  if (record.offer) next.offerHistory.push({ offer:structuredClone(record.offer), data:structuredClone(record.data), receipt:structuredClone(record.receipt) });
  next.offer = { revision:(record.offer?.revision || 0) + 1, state:'draft', quote:structuredClone(quote), calculation:calculateInternal(quote), approval:null };
  next.audit.push({ action:'offer-revised', revision:next.offer.revision, actor, at:now.toISOString() });
  return next;
}
export function approveOffer(record, revision, actor, now = new Date()) {
  if (!actor?.trim()) throw new Error('Wymagany operator właściciela');
  if (!record.offer || record.offer.revision !== revision || record.offer.state !== 'draft') throw new Error('Zatwierdzaj aktualną wersję roboczą');
  const calculation = calculateInternal(record.offer.quote);
  if (calculation.status !== 'complete') throw new Error('Kosztorys ma nieuzupełnione koszty lub VAT');
  const q = record.offer.quote;
  if (q.warrantyTerms?.trim() && q.warrantyApproved !== true || q.serviceTerms?.trim() && q.serviceApproved !== true) throw new Error('Zatwierdź wpisane warunki gwarancji i serwisu');
  if (!q.technicalChecked || !q.costsChecked || !q.terms?.trim() || !Number.isInteger(q.validityDays) || q.validityDays < 1 || q.validityDays > 90) throw new Error('Wymagany odbiór konfiguracji, warunki i ważność 1–90 dni');
  if ((!calculation.totals.meetsMargin || calculation.totals.profitAfterIncludedCostsNet <= 0) && !q.marginException?.trim()) throw new Error('Marża poniżej progu lub brak dodatniego wyniku po kosztach — wymagana świadoma decyzja i uzasadnienie właściciela');
  const next = structuredClone(record);
  next.offer.state = 'approved';
  next.offer.calculation = calculation;
  next.offer.approval = { actor, at:now.toISOString(), hash:fingerprint(snapshot(next)) };
  next.audit.push({ action:'offer-approved', revision, actor, at:now.toISOString(), hash:next.offer.approval.hash, marginException:q.marginException || null });
  return next;
}
export function customerOffer(record, allowDraft = false, now = new Date()) {
  if (!record.offer) throw new Error('Brak oferty');
  const approved = record.offer.state === 'approved' && record.offer.approval?.hash === fingerprint(snapshot(record));
  if (!approved && !allowDraft) throw new Error('Oferta nie jest zatwierdzona lub została zmieniona');
  const calculation = calculateInternal(record.offer.quote);
  if (calculation.status !== 'complete') throw new Error('Niekompletny kosztorys');
  if (!Number.isInteger(record.offer.quote.validityDays) || record.offer.quote.validityDays < 1 || record.offer.quote.validityDays > 90) throw new Error('Wymagana ważność oferty 1–90 dni');
  const issuedAt = approved ? record.offer.approval.at : now.toISOString();
  const validUntil = new Date(Date.parse(issuedAt) + record.offer.quote.validityDays * 86400000).toISOString();
  if (approved && Date.parse(validUntil) <= +now) throw new Error('Oferta wygasła — przygotuj i zatwierdź nową wersję');
  return { inquiryId:record.receipt.inquiryId, revision:record.offer.revision, state:approved ? 'approved' : 'draft', issuedAt, validUntil,
    customer:{ name:record.data.name, email:record.data.email, locality:record.data.locality, ...(record.data.phone ? {phone:record.data.phone} : {}) }, lines:calculation.publicLines,
    totals:{ net:calculation.totals.saleNet, vat:calculation.totals.vat, gross:calculation.totals.saleGross }, terms:record.offer.quote.terms, exclusions:record.offer.quote.exclusions,
    ...(record.offer.quote.warrantyApproved === true ? {warrantyTerms:record.offer.quote.warrantyTerms} : {}),
    ...(record.offer.quote.serviceApproved === true ? {serviceTerms:record.offer.quote.serviceTerms} : {}),
    ...(record.demo === true ? {demo:true} : {}), approvalHash:approved ? record.offer.approval.hash : null };
}
