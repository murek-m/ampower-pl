// Per-tab state: small inputs in sessionStorage; large CSV in local IndexedDB.
// Nothing is sent over the network. Reset deletes this tab's saved CSV.
const key='ampower-pv-mining-v1';
let cachedProfile;
function db() {
  return new Promise((resolve,reject)=>{
    const request=indexedDB.open('ampower-pv-mining-local',1);
    request.onupgradeneeded=()=>request.result.createObjectStore('profiles');
    request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);
  });
}
async function profileStore(method,id,value) {
  const store=await db();
  return new Promise((resolve,reject)=>{
    const transaction=store.transaction('profiles',method==='get'?'readonly':'readwrite');
    const request=transaction.objectStore('profiles')[method](...(method==='put'?[value,id]:method==='clear'?[]:[id]));
    transaction.oncomplete=()=>{store.close();resolve(request.result);};
    transaction.onerror=()=>{store.close();reject(transaction.error);};
  });
}
export async function readSession() {
  const encoded=sessionStorage.getItem(key);if(!encoded)return null;
  const state=JSON.parse(encoded);if(state.version!==1)return null;
  if(state.csvId){state.imported=await profileStore('get',state.csvId);if(!state.imported)throw new Error('Brak zachowanego CSV. Wczytaj plik ponownie.');}
  cachedProfile=state.imported;return state;
}
export async function writeSession(state) {
  let previous;try {previous=JSON.parse(sessionStorage.getItem(key)||'null');}catch{}
  let csvId=previous?.csvId;
  if(state.imported) {csvId??=crypto.randomUUID();if(state.imported!==cachedProfile)await profileStore('put',csvId,state.imported);cachedProfile=state.imported;}
  else if(csvId){await profileStore('delete',csvId);csvId=null;}
  sessionStorage.setItem(key,JSON.stringify({...state,imported:undefined,csvId,version:1}));
}
export async function clearSession() {
  const state=JSON.parse(sessionStorage.getItem(key)||'null');
  if(state?.csvId)await profileStore('delete',state.csvId);cachedProfile=null;
  sessionStorage.removeItem(key);
}
