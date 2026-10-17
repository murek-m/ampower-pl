import { CATEGORIES, GOALS } from '../smart-home-energy/data.js';
import { fieldsFor, submissionData, validateSubmission } from '../smart-home-energy/model.js';
const object = value => value && typeof value === 'object' && !Array.isArray(value);
export function validatePayload(payload, noticeVersion) {
  if (!object(payload) || !object(payload.data) || payload.dataNoticeVersion !== noticeVersion || typeof payload.website !== 'string' || payload.website || typeof payload.token !== 'string' || payload.token.length > 2048) throw Object.assign(new Error('Nieprawidłowe zgłoszenie'), { status: 422 });
  const d = payload.data;
  const allowed = new Set(['categories','details','goals','delivery','access','host','hostModel','locality','remoteReady','name','email','phone','notes','infrastructure','radioChoice','complexity','simpleScenes','advancedScenes','support','channel','dataNoticeAccepted']);
  if (Object.keys(d).some(k => !allowed.has(k)) || !Array.isArray(d.categories) || !Array.isArray(d.goals) || !object(d.details) || d.categories.length > 12 || d.goals.length > 3 || new Set(d.categories).size !== d.categories.length || new Set(d.goals).size !== d.goals.length || d.categories.some(id => !CATEGORIES.some(c => c.id === id)) || d.goals.some(id => !Object.hasOwn(GOALS,id))) throw Object.assign(new Error('Nieprawidłowy zakres'), { status: 422 });
  for (const [key, value] of Object.entries(d)) if (!['categories','details','goals','dataNoticeAccepted'].includes(key) && value !== null && typeof value !== 'string') throw Object.assign(new Error('Nieprawidłowy typ pola'), { status: 422 });
  for (const [id, answers] of Object.entries(d.details)) {
    const c = CATEGORIES.find(c => c.id === id);
    if (!c || !d.categories.includes(id) || !object(answers)) throw Object.assign(new Error('Nieprawidłowe szczegóły'), { status: 422 });
    const fields = fieldsFor(c, answers, d.categories);
    for (const [key, val] of Object.entries(answers)) {
      const f = fields.find(f => f.key === key);
      if (!f || (val !== null && !['string','number'].includes(typeof val)) || (f.options && !Object.hasOwn(f.options, val)) || (f.max && String(val || '').length > f.max)) throw Object.assign(new Error('Nieprawidłowe pole urządzenia'), { status: 422 });
    }
  }
  const enums = { delivery:['local','remote','unknown'], access:['home','away','unknown'], host:['owned','needed','unknown'], infrastructure:['ready','unknown'], radioChoice:['unknown','none','p02','p03'], complexity:['simple','complex','unknown'], support:['none','basic','extended'], channel:['email'], remoteReady:[null,'yes','no','unknown'] };
  if (Object.entries(enums).some(([k, vals]) => !vals.includes(d[k]))) throw Object.assign(new Error('Nieprawidłowa opcja'), { status: 422 });
  if (d.phone && d.phone.length > 40 || /[\r\n\x00-\x1f]/.test(d.email || '') || /[\x00]/.test(JSON.stringify(d))) throw Object.assign(new Error('Nieprawidłowy kontakt'), { status: 422 });
  const errors = validateSubmission(d);
  if (errors.length) throw Object.assign(new Error('Sprawdź wymagane dane'), { status: 422 });
  return submissionData(d);
}
