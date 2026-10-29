/* Cloudflare Web Analytics: aggregate, cookieless measurement; no Google tag. */
(() => {
  'use strict';
  window['ga-disable-G-3D328MRNWG']=true;
  // Remove cookies left by the previous Google integration, without creating new ones.
  const names=document.cookie.split(';').map(p=>p.split('=')[0].trim()).filter(n=>/^_ga(?:_|$)|^_gid$|^_gat/.test(n));
  const parts=location.hostname.split('.'),domains=['',location.hostname];
  for(let i=0;i<parts.length-1;i++)domains.push('.'+parts.slice(i).join('.'));
  for(const name of names)for(const domain of new Set(domains))document.cookie=name+'=; Max-Age=0; Path=/; SameSite=Lax'+(domain?'; Domain='+domain:'')+(location.protocol==='https:'?'; Secure':'');
  // The public filename stays stable so cached pages also stop loading Google.
  // Analytics stays on the home page; configurator inputs and privacy pages are excluded.
  const paths=['/','/index.html'];
  const cleanUrl=value=>{try{const u=new URL(value);return !u.search&&(!u.hash||Boolean(document.getElementById(u.hash.slice(1))));}catch{return false;}};
  const privateReferrer=()=>{if(!document.referrer)return false;try{const u=new URL(document.referrer);return Boolean(u.search||u.hash)||(u.origin===location.origin&&!paths.includes(u.pathname));}catch{return true;}};
  const enabled=location.hostname==='ampower.pl'&&paths.includes(location.pathname)&&cleanUrl(location.href)&&!privateReferrer()&&navigator.doNotTrack!=='1'&&window.doNotTrack!=='1'&&navigator.globalPrivacyControl!==true;
  window.AmpowerAnalytics={provider:'cloudflare',enabled};
  // Hide legacy controls when an older HTML page remains in a browser cache.
  for(const button of document.querySelectorAll('[data-cookie-settings]'))button.hidden=true;
  if(!enabled)return;
  const script=document.createElement('script');
  script.type='module';script.src='https://static.cloudflareinsights.com/beacon.min.js';
  script.dataset.cfBeacon=JSON.stringify({token:'d2593253c7244887ba5776a66e1ad67a',spa:false});
  script.referrerPolicy='strict-origin';
  script.onerror=()=>{window.AmpowerAnalytics.enabled=false;script.remove();};
  document.head.append(script);
})();
