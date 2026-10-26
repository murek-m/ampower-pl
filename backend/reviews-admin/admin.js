const $=id=>document.getElementById(id);
const node=(tag,text,className)=>{const element=document.createElement(tag);if(text!==undefined)element.textContent=text;if(className)element.className=className;return element;};
const labels={pending:'Oczekuje',published:'Opublikowana',rejected:'Odrzucona'};
const mailLabels={disabled:'wyłączone',pending:'oczekuje na wysłanie',sending:'wysyłanie',retry:'oczekuje na ponowną próbę','provider-accepted':'przyjęte przez dostawcę poczty','check-needed':'wymaga sprawdzenia przez operatora'};
let csrf='',records=[],cursor=null,total=0,counts={},listVersion=0,activeAction=null;
async function api(path,body) {
  const response=await fetch('/api/reviews-admin/'+path,{credentials:'same-origin',cache:'no-store',signal:AbortSignal.timeout(20000),...(body?{method:'POST',headers:{'Content-Type':'application/json','X-CSRF-Token':csrf},body:JSON.stringify(body)}:{})});
  const data=await response.json();
  if(!response.ok) {if(response.status===401 && path!=='login') loginView();throw new Error(data.error||'Nie potwierdzono operacji.');}
  return data;
}
function loginView() {$('review-workspace').hidden=true;$('review-login-view').hidden=false;csrf='';records=[];$('review-admin-list').replaceChildren();$('review-share-link').value='';}
async function openWorkspace() {
  const info=await api('me');csrf=info.csrf;$('review-share-link').value=info.shareUrl;
  $('review-mail-status').textContent=info.mailEnabled?'Powiadomienia o nowych opiniach są włączone. Odbiorca: kuba@ampower.pl.':'Powiadomienia e-mail są wyłączone. Przed uruchomieniem online trzeba skonfigurować dostawcę poczty.';
  $('review-mail-status').classList.toggle('mail-warning',!info.mailEnabled);
  $('review-storage-status').textContent=info.storage?.ok?`Magazyn opinii: ${Math.round(info.storage.databaseBytes/1024/1024)} z ${Math.round(info.storage.maxBytes/1024/1024)} MB. Kopie zapasowe sprawdzaj zgodnie z harmonogramem hostingu.`:'Magazyn opinii wymaga sprawdzenia. Dodawanie nowych wpisów może być niedostępne.';
  $('review-storage-status').classList.toggle('mail-warning',!info.storage?.ok);
  $('review-login-view').hidden=true;$('review-workspace').hidden=false;await refresh();
}
function actionButton(text,action,review,danger=false) {const button=node('button',text,danger?'danger':'');button.type='button';button.addEventListener('click',()=>openAction(action,review));return button;}
function render() {
  const list=$('review-admin-list');list.replaceChildren();
  $('review-admin-count').textContent=`Wczytano ${records.length} z ${total} opinii w tej grupie. Wszystkich oczekujących: ${counts.pending||0}.`;
  if(!records.length)list.append(node('p','Brak opinii w tej grupie.','empty'));
  for(const review of records) {
    const article=node('article',undefined,'card admin-review'),head=node('div',undefined,'admin-review-head'),identity=node('div');
    identity.append(node('h2',review.name,'admin-review-name'),node('p',`${review.city} · ${review.service} · ${new Date(review.createdAt).toLocaleDateString('pl-PL')}`,'muted'));
    head.append(identity,node('span',labels[review.status],'pill '+(review.status==='published'?'approved':'new')));
    const stars=node('div','★'.repeat(review.rating)+'☆'.repeat(5-review.rating),'admin-review-stars');stars.setAttribute('aria-label',`Ocena ${review.rating} na 5`);
    article.append(head,stars,node('p',review.text,'admin-review-text'));
    if(review.photoUrl){const image=node('img',undefined,'admin-review-photo');image.src=review.photoUrl;image.alt='Zdjęcie do opinii — sprawdź przed publikacją';image.loading='lazy';article.append(image);}
    if(review.reply)article.append(node('p','Odpowiedź AmPower:\n'+review.reply,'admin-review-reply'));
    if(review.reason)article.append(node('p','Powód odrzucenia: '+review.reason,'reason'));
    article.append(node('p','Powiadomienie e-mail: '+(mailLabels[review.mailState]||review.mailState),'muted'));
    const actions=node('div',undefined,'actions');
    if(review.status!=='published')actions.append(actionButton('Opublikuj','publish',review));
    actions.append(actionButton(review.reply?'Edytuj odpowiedź':'Odpowiedz','reply',review));
    if(review.status!=='rejected')actions.append(actionButton(review.status==='published'?'Wycofaj publikację':'Odrzuć','reject',review));
    actions.append(actionButton('Usuń dane i zdjęcie','delete',review,true));article.append(actions);list.append(article);
  }
  $('review-admin-more').hidden=!cursor;
}
async function loadMore(version=listVersion) {
  const filter=$('review-filter').value;
  const data=await api('list?status='+filter+(cursor?'&cursor='+encodeURIComponent(cursor):''));
  if(version!==listVersion) return;
  const seen=new Set(records.map(r=>r.id));records.push(...data.reviews.filter(r=>!seen.has(r.id)));cursor=data.nextCursor;total=data.total;counts=data.counts||{};render();
}
async function refresh() {const version=++listVersion;try {records=[];cursor=null;total=0;$('review-admin-list').replaceChildren();$('review-admin-more').hidden=true;await loadMore(version);}catch(error){if(version===listVersion)$('review-admin-status').textContent=error.message;}}
function openAction(action,review) {
  activeAction={action,review};const title={publish:'Opublikować opinię?',reply:'Odpowiedź AmPower',reject:'Powód odrzucenia lub wycofania',delete:'Usunąć opinię i jej dane?'};
  const description={publish:'Opinia i dołączone zdjęcie staną się publicznie widoczne. Sprawdź, czy nie ujawniają danych innych osób. Niska ocena sama w sobie nie jest powodem odrzucenia.',reply:'Odpowiedź będzie widoczna przy opublikowanej opinii. Puste pole usuwa dotychczasową odpowiedź.',reject:'Wpisz powód, np. spam, obraźliwa treść lub ujawnienie danych. Rzeczowe opinie krytyczne również publikujemy.',delete:'Ta operacja usuwa treść, podpis, miejscowość, odpowiedź i zdjęcie z systemu. Nie można jej cofnąć. Kopie zapasowe podlegają osobnej retencji.'};
  $('review-dialog-title').textContent=title[action];$('review-dialog-description').textContent=description[action];$('review-dialog-field').hidden=!['reply','reject'].includes(action);
  const field=$('review-dialog-text');field.value=action==='reply'?review.reply:review.reason;field.required=action==='reject';field.minLength=action==='reject'?5:0;field.maxLength=action==='reject'?500:2000;
  $('review-dialog-status').textContent='';$('review-dialog-submit').disabled=false;$('review-action-dialog').showModal();
}
$('review-admin-login').addEventListener('submit',async event=>{event.preventDefault();const button=event.target.querySelector('button');button.disabled=true;try{const result=await api('login',{password:$('review-admin-password').value});csrf=result.csrf;$('review-admin-password').value='';$('review-login-status').textContent='';await openWorkspace();}catch(error){$('review-login-status').textContent=error.message;}finally{button.disabled=false;}});
$('review-admin-logout').addEventListener('click',async()=>{try{await api('logout',{});loginView();}catch(error){$('review-admin-status').textContent=error.message;}});
$('review-action-form').addEventListener('submit',async event=>{event.preventDefault();const {review,action}=activeAction,button=$('review-dialog-submit');button.disabled=true;try{await api(review.id,{action,version:review.version,reply:$('review-dialog-text').value,reason:$('review-dialog-text').value,...(action==='delete'?{confirm:review.id}:{})});$('review-action-dialog').close();$('review-admin-status').textContent='Zapisano zmianę.';await refresh();}catch(error){$('review-dialog-status').textContent=error.message;}finally{button.disabled=false;}});
$('review-dialog-cancel').addEventListener('click',()=>$('review-action-dialog').close());
$('review-refresh').addEventListener('click',refresh);$('review-filter').addEventListener('change',refresh);
$('review-admin-more').addEventListener('click',async()=>{const button=$('review-admin-more');button.disabled=true;try{await loadMore();}catch(error){$('review-admin-status').textContent=error.message;}finally{button.disabled=false;}});
$('review-copy-link').addEventListener('click',async()=>{try{await navigator.clipboard.writeText($('review-share-link').value);$('review-admin-status').textContent='Skopiowano link do formularza.';}catch{$('review-share-link').select();$('review-admin-status').textContent='Zaznaczono link — skopiuj go z pola.';}});
openWorkspace().catch(()=>loginView());
