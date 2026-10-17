// Wyłącznie backend/narzędzia. Nigdy nie kopiować tego modułu do Pages.
import { readFile } from 'node:fs/promises';
export async function loadCatalog(path = new URL('./catalog.seed.json', import.meta.url)) {
  return JSON.parse(await readFile(path, 'utf8'));
}
export function approvalCurrent(row, now = new Date()) {
  return row.approvalStatus === 'approved' && typeof row.approvedBy === 'string' && row.approvedBy.trim() &&
    Number.isFinite(Date.parse(row.approvedAt)) && Date.parse(row.approvedAt) <= +now &&
    Number.isFinite(Date.parse(row.validUntil)) && Date.parse(row.validUntil) > +now;
}
function publicRow(row, now, product = false) {
  const approved = Boolean(approvalCurrent(row, now));
  const range = row.saleNetRange;
  const amountValid = Array.isArray(range) && range.length === 2 && range.every(n => Number.isFinite(n) && n >= 0) && range[0] <= range[1];
  const ready = approved && amountValid && row.vatApproved === true && [0, 8, 23].includes(row.vatRate) && Number.isFinite(Date.parse(row.updatedAt)) && Date.parse(row.updatedAt) <= +now;
  // Jawna projekcja, bez spreadowania obiektu prywatnego.
  const out = { id: row.id, label: row.label || `${row.manufacturer} — ${row.model}`, approvalStatus: ready ? 'approved' : 'pending', validUntil: ready ? row.validUntil : null,
    updatedAt: ready ? row.updatedAt : null, saleNetRange: ready ? range : null, vatRate: ready ? row.vatRate : null };
  if (product) Object.assign(out, { category: row.category, existingOnly: row.existingOnly === true, availability: row.availability, installationService: row.installationService,
    configurationService: row.configurationService, systemType: row.systemType, dependencyIds: row.dependencyIds || [],
    compatibilityStatus: row.compatibility?.status, allowedFunctions: row.allowedFunctions || [], allowedControls: row.allowedControls || [], allowedDeliveries: row.allowedDeliveries || ['local'],
    pointsPerUnit: row.pointsPerUnit ?? 1, existingApproved: approved && row.existingApproved === true });
  return out;
}
export function projectPublicCatalog(book, now = new Date()) {
  const enabled = Boolean(approvalCurrent(book, now) && Number.isFinite(Date.parse(book.validFrom)) && Date.parse(book.validFrom) <= +now && approvalCurrent(book.rules, now));
  const rules = enabled ? { minimumOrderNet: book.rules.minimumOrderNet, minimumExpansionNet: book.rules.minimumExpansionNet, minimumConfigurationNet: book.rules.minimumConfigurationNet,
    minimumVatRate: book.rules.minimumVatRate, approvedHostModels: [...(book.rules.approvedHostModels || [])], radioAlternatives: Object.fromEntries(Object.entries(book.rules.radioAlternatives || {}).map(([k,v]) => [k,[...v]])), quantityDiscounts: (book.rules.quantityDiscounts || []).map(r => ({ from: r.from, percent: r.percent })),
    roundingGross: book.rules.roundingGross, travelZones: Object.fromEntries(Object.entries(book.rules.travelZones || {}).map(([key, z]) => [key, { saleNetRange: z.saleNetRange, vatRate: z.vatRate, validUntil: z.validUntil }])) } : null;
  return { version: enabled ? book.version : null, enabled, validFrom: enabled ? book.validFrom : null, validUntil: enabled ? book.validUntil : null,
    products: book.products.map(p => publicRow(p, now, true)), services: book.services.map(s => publicRow(s, now)), rules, subscriptionsEnabled: false };
}
