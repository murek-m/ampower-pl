import { REVIEWS_API_BASE } from './reviews-config.js';

const section=document.getElementById('opinie');
const base=REVIEWS_API_BASE.replace(/\/$/,'');
if(base && (new URL(base).origin!==base || !base.startsWith('https://'))) throw new Error('Nieprawidłowy adres opinii.');
const api=path=>base+path;
const byId=id=>document.getElementById(id);
const list=byId('reviews-list'),feedback=byId('reviews-feedback'),more=byId('reviews-more'),form=byId('review-form'),fields=byId('review-fields'),compose=byId('dodaj-opinie'),status=byId('review-status');
let total=0,cursor=null,token='',tokenAt=0,tokenLifetime=0,minAge=2000,preparing=null,submitting=false,loading=false,photo=null,photoBusy=false,photoVersion=0,requestKey=null,lastPayload=null;
const seen=new Set();
const node=(tag,text,className)=>{const element=document.createElement(tag);if(text!==undefined)element.textContent=text;if(className)element.className=className;return element;};
async function request(path,options={}) {
  let response;
  try {response=await fetch(api(path),{credentials:'omit',cache:'no-store',signal:AbortSignal.timeout(20000),...options});}
  catch {throw new Error('Nie udało się połączyć z usługą opinii. Sprawdź połączenie i spróbuj ponownie.');}
  let body; try {body=await response.json();} catch {throw new Error('Usługa opinii jest chwilowo niedostępna. Spróbuj ponownie później.');}
  if(!response.ok) throw Object.assign(new Error(body.error||'Nie udało się potwierdzić operacji. Spróbuj ponownie.'),{code:body.code,retryAfterMs:body.retryAfterMs});
  return body;
}
function card(review) {
  const article=node('article',undefined,'review-card');
  if(review.photoUrl) {const image=node('img',undefined,'review-photo');image.src=api(review.photoUrl);image.alt=`Zdjęcie do opinii: ${review.service}`;image.width=640;image.height=440;image.loading='lazy';article.append(image);}
  const body=node('div',undefined,'review-body'),stars=node('div','★'.repeat(review.rating)+'☆'.repeat(5-review.rating),'review-stars');
  stars.setAttribute('role','img');stars.setAttribute('aria-label',`Ocena ${review.rating} na 5`);
  body.append(stars,node('p',review.text,'review-text'),node('strong',review.name,'review-name'),node('p',`${review.city} · ${new Date(review.createdAt).toLocaleDateString('pl-PL')}`,'review-meta'),node('span',review.service,'review-service'));
  if(review.reply) {const answer=node('div',undefined,'review-reply');answer.append(node('strong','Odpowiedź AmPower'),node('span',review.reply));body.append(answer);}
  article.append(body); return article;
}
async function loadReviews() {
  if(loading) return;loading=true;
  more.disabled=true;
  try {
    const data=await request('/api/reviews?limit=3'+(cursor?'&cursor='+encodeURIComponent(cursor):''));
    if(!Array.isArray(data.reviews)) throw new Error('Nie udało się odczytać opinii.');
    for(const review of data.reviews) {if(!seen.has(review.id)){list.append(card(review));seen.add(review.id);}}
    cursor=data.nextCursor;total=data.total; more.hidden=!cursor;
    more.textContent='Rozwiń — kolejne opinie';
    byId('reviews-score').textContent=total?`${Number(data.average).toLocaleString('pl-PL')} / 5 · ${total} ${total===1?'opinia':'opinii'}`:'';
    feedback.textContent=total?'':'Nie ma jeszcze opublikowanych opinii. Korzystałeś z moich usług? Podziel się swoim doświadczeniem.';
  } catch(error) {feedback.textContent=error.message;more.hidden=false;more.textContent='Spróbuj wczytać opinie ponownie';}
  finally {more.disabled=false;loading=false;}
}
function prepareForm(force=false) {
  if(preparing) return preparing;
  if(!force && token && Date.now()-tokenAt<tokenLifetime-60000) return Promise.resolve(true);
  preparing=(async()=>{
    byId('review-retry').disabled=true;
    try {
      const data=await request('/api/reviews/form');token=data.token;tokenAt=Date.now();tokenLifetime=data.validForMs;minAge=data.minAgeMs;
      fields.disabled=submitting;byId('review-submit').disabled=photoBusy;byId('review-retry').hidden=true;
      byId('review-availability').textContent='Twoja opinia pojawi się po sprawdzeniu przez AmPower.';return true;
    } catch {
      token='';fields.disabled=true;byId('review-retry').hidden=false;
      byId('review-availability').textContent='Dodawanie opinii jest chwilowo niedostępne. Spróbuj ponownie — wpisane dane pozostaną w formularzu.';return false;
    } finally {preparing=null;byId('review-retry').disabled=false;}
  })();return preparing;
}
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function sendReview(payload,renew=true) {
  if(!await prepareForm()) throw new Error('Nie udało się uruchomić formularza. Spróbuj ponownie.');
  const wait=minAge-(Date.now()-tokenAt);if(wait>0) await pause(wait+50);
  try {return await request('/api/reviews',{method:'POST',headers:{'Content-Type':'application/json','Idempotency-Key':requestKey},body:JSON.stringify({...payload,token})});}
  catch(error) {
    if(renew && ['FORM_RENEW','FORM_WAIT'].includes(error.code)) {
      if(error.code==='FORM_RENEW'){if(!await prepareForm(true)) throw error;}
      else await pause(Math.min(5000,Math.max(0,Number(error.retryAfterMs)||2000))+50);
      return sendReview(payload,false);
    }
    throw error;
  }
}
function openCompose() {if(location.hash==='#dodaj-opinie') compose.open=true;}
window.addEventListener('hashchange',openCompose);openCompose();
compose.addEventListener('toggle',()=>{if(compose.open)prepareForm();});
byId('review-retry').addEventListener('click',()=>prepareForm(true));
more.addEventListener('click',loadReviews);
byId('review-photo').addEventListener('change',async event=>{
  const version=++photoVersion;
  const file=event.target.files[0],preview=byId('review-photo-preview');
  photo=null;preview.hidden=true;preview.removeAttribute('src');byId('review-photo-remove').hidden=true;byId('review-photo-consent-row').hidden=true;byId('review-photo-consent').checked=false;status.textContent='';
  if(!file) {photoBusy=false;byId('review-submit').disabled=false;return;}
  photoBusy=true;byId('review-submit').disabled=true;
  try {
    if(!['image/jpeg','image/png','image/webp'].includes(file.type) || file.size>12000000) throw new Error('Wybierz zdjęcie JPG, PNG lub WebP do 12 MB.');
    const image=await createImageBitmap(file);
    try {
      if(image.width*image.height>50000000) throw new Error('Zdjęcie ma zbyt dużą rozdzielczość. Wybierz mniejszy plik.');
      let size=1280,encoded;
      do {
        const ratio=Math.min(1,size/Math.max(image.width,image.height)),canvas=document.createElement('canvas');
        canvas.width=Math.max(1,Math.round(image.width*ratio));canvas.height=Math.max(1,Math.round(image.height*ratio));
        const context=canvas.getContext('2d');context.fillStyle='#ffffff';context.fillRect(0,0,canvas.width,canvas.height);context.drawImage(image,0,0,canvas.width,canvas.height);
        encoded=canvas.toDataURL('image/png');size=Math.floor(size*.75);
      } while(encoded.length>1900000 && size>=300);
      if(encoded.length>1900000) throw new Error('Nie udało się zmniejszyć zdjęcia. Wybierz inny plik.');
      if(version!==photoVersion) return;
      photo=encoded.split(',')[1];preview.src=encoded;preview.hidden=false;byId('review-photo-remove').hidden=false;byId('review-photo-consent-row').hidden=false;
    } finally {image.close();}
  } catch(error) {if(version===photoVersion){event.target.value='';status.textContent=error.message||'Nie udało się przygotować zdjęcia. Wybierz inne.';}}
  finally {if(version===photoVersion){photoBusy=false;byId('review-submit').disabled=false;}}
});
byId('review-photo-remove').addEventListener('click',()=>{byId('review-photo').value='';byId('review-photo').dispatchEvent(new Event('change'));});
form.addEventListener('submit',async event=>{
  event.preventDefault();if(submitting || photoBusy || !form.reportValidity()) return;
  const values=new FormData(form),payload={firstName:values.get('firstName'),initial:values.get('initial'),city:values.get('city'),service:values.get('service'),rating:Number(values.get('rating')),text:values.get('text'),photo,photoConsent:byId('review-photo-consent').checked,consent:byId('review-consent').checked,consentVersion:'reviews-v1',website:values.get('website')};
  if(photo && !payload.photoConsent) {status.textContent='Potwierdź, że możesz udostępnić zdjęcie.';byId('review-photo-consent').focus();return;}
  const snapshot=JSON.stringify(payload);
  if(snapshot!==lastPayload || !requestKey) {requestKey=crypto.randomUUID();lastPayload=snapshot;}
  submitting=true;fields.disabled=true;status.textContent='Zapisuję opinię…';
  try {
    const data=await sendReview(payload);
    if(data.accepted!==true) throw new Error('Nie potwierdzono zapisu opinii. Spróbuj ponownie.');
    form.reset();photo=null;requestKey=null;lastPayload=null;byId('review-photo-preview').hidden=true;byId('review-photo-preview').removeAttribute('src');byId('review-photo-remove').hidden=true;byId('review-photo-consent-row').hidden=true;
    status.textContent=data.message;token='';await prepareForm(true);
  } catch(error) {status.textContent=error.message;}
  finally {submitting=false;fields.disabled=!token;byId('review-submit').disabled=photoBusy;}
});
if(section) {loadReviews();prepareForm();}
