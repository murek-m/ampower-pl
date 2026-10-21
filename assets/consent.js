/* Basic consent: no Google code or requests until a current, explicit opt-in.
   Analytics is limited to the home page; the configurator never loads Google. */
(() => {
  'use strict';
  const id='G-3D328MRNWG',key='ampower-consent-v2',lifetime=180*86400000;
  const eligible=()=>['/','/index.html'].includes(location.pathname)&&!location.search;
  const valid=value=>value&&value.version===2&&typeof value.analytics==='boolean'&&Number.isFinite(value.savedAt)&&value.savedAt<=Date.now()&&Date.now()-value.savedAt<lifetime;
  const read=()=>{try{const value=JSON.parse(localStorage.getItem(key));return valid(value)?value:null;}catch{return null;}};
  let choice=read(),loaded=false,configured=false,returnFocus=null;
  const allowed=()=>Boolean(valid(choice)&&choice.analytics&&eligible());
  window['ga-disable-'+id]=!allowed();
  const node=(tag,text,props={})=>{const element=document.createElement(tag);if(text)element.textContent=text;Object.assign(element,props);return element;};
  const panel=node('section',null,{className:'amp-consent',id:'cookie-banner',hidden:Boolean(choice)});
  panel.setAttribute('role','region');panel.setAttribute('aria-labelledby','cookie-title');
  const title=node('h2','Twój wybór cookies',{id:'cookie-title'});
  const copy=node('p','Za Twoją zgodą używamy Google Analytics do statystyk odwiedzin. Strona i konfigurator działają także bez zgody. ');
  copy.append(node('a','Prywatność i cookies',{href:'/prywatnosc/'}));
  const actions=node('div',null,{className:'amp-consent-actions'});
  const reject=node('button','Tylko niezbędne',{type:'button',id:'cookie-reject',className:'amp-choice'});
  const accept=node('button','Zgadzam się na statystyki',{type:'button',id:'cookie-accept',className:'amp-choice'});
  actions.append(reject,accept);panel.append(title,copy,actions);document.body.append(panel);
  const status=node('p',null,{className:'amp-consent-note'});status.setAttribute('role','status');document.body.append(status);
  function eraseGoogleCookies(){
    const names=document.cookie.split(';').map(p=>p.split('=')[0].trim()).filter(n=>/^_ga(?:_|$)|^_gid$|^_gat/.test(n));
    const parts=location.hostname.split('.'),domains=['',location.hostname];
    for(let i=0;i<parts.length-1;i++)domains.push('.'+parts.slice(i).join('.'));
    for(const name of names)for(const domain of new Set(domains))document.cookie=name+'=; Max-Age=0; Path=/; SameSite=Lax'+(domain?'; Domain='+domain:'')+(location.protocol==='https:'?'; Secure':'');
  }
  function disable(){
    window['ga-disable-'+id]=true;
    // Do not send even a denied/cookieless ping when withdrawing consent.
    if(window.dataLayer)window.dataLayer.length=0;
    configured=false;eraseGoogleCookies();
  }
  function configure(){
    if(!allowed()||configured)return;
    window['ga-disable-'+id]=false;
    window.dataLayer=window.dataLayer||[];
    window.gtag=function(){window.dataLayer.push(arguments);};
    window.gtag('consent','default',{analytics_storage:'denied',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied'});
    window.gtag('consent','update',{analytics_storage:'granted',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied'});
    window.gtag('js',new Date());
    window.gtag('config',id,{send_page_view:false,page_location:location.origin+'/',page_referrer:'',allow_google_signals:false,allow_ad_personalization_signals:false,cookie_expires:180*86400,cookie_update:false});
    window.gtag('event','page_view',{page_location:location.origin+'/',page_title:document.title,page_referrer:''});
    configured=true;
  }
  function enable(){
    if(!allowed())return;
    configure();
    if(loaded)return;
    loaded=true;
    const script=node('script',null,{id:'ampower-google-tag',async:true,src:'https://www.googletagmanager.com/gtag/js?id='+id});
    script.referrerPolicy='no-referrer';
    script.onerror=()=>{script.remove();loaded=false;configured=false;};
    script.onload=()=>{if(!allowed())disable();};
    document.head.append(script);
  }
  function apply(){if(allowed())enable();else if(!valid(choice)||!choice.analytics)disable();else window['ga-disable-'+id]=true;}
  function choose(analytics){
    choice={version:2,analytics,savedAt:Date.now()};
    try{localStorage.setItem(key,JSON.stringify(choice));localStorage.removeItem('ampower-analytics-consent');}catch{/* Choice still applies to this page if storage is unavailable. */}
    apply();panel.hidden=true;
    status.textContent=analytics?'Zapisano zgodę na statystyki. Możesz ją zmienić w ustawieniach cookies.':'Statystyki wyłączone. Strona działa z niezbędnymi ustawieniami.';
    if(returnFocus?.isConnected)returnFocus.focus();
  }
  function show(){returnFocus=document.activeElement;panel.hidden=false;reject.focus();}
  reject.addEventListener('click',()=>choose(false));accept.addEventListener('click',()=>choose(true));
  for(const button of document.querySelectorAll('[data-cookie-settings]')){button.hidden=false;button.addEventListener('click',show);}
  panel.addEventListener('keydown',event=>{if(event.key==='Escape'&&choice){panel.hidden=true;returnFocus?.focus();}});
  window.addEventListener('storage',event=>{if(event.key===key||event.key===null){choice=read();panel.hidden=Boolean(choice);apply();}});
  window.addEventListener('pageshow',()=>{if(!valid(choice)){choice=null;panel.hidden=false;disable();}});
  // Register before Google: contact targets may contain private message text.
  window.addEventListener('click',event=>{
    const link=event.target.closest?.('a[href]');if(!link||!/^(?:mailto|tel|sms):/.test(link.getAttribute('href')))return;
    if(allowed()&&configured)window.gtag('event','contact_click',{method:link.protocol.slice(0,-1),page_location:location.origin+'/'});
    event.stopImmediatePropagation(); // Native link navigation still works; no URL is sent to automatic click listeners.
  },true);
  window.AmpowerConsent={showSettings:show,getState:()=>valid(choice)?{analytics:choice.analytics}:null};
  apply();
})();
