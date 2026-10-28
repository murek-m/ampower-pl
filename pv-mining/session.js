// Inputs/drafts are per-tab; CSV copies stay local for at most 24 h since last write.
// Expired copies are purged on the next visit. No data is sent over the network.
export const PROFILE_TTL_MS=24*60*60*1000;
const key='ampower-pv-mining-v1';
let cachedProfile, cachedId, queue=Promise.resolve();
function decoded(){try{return JSON.parse(sessionStorage.getItem(key)||'null');}catch{return null;}}
function db(){return new Promise((resolve,reject)=>{
  let expired=false;
  const timer=setTimeout(()=>{expired=true;reject(new Error('Lokalny magazyn CSV nie odpowiada.'));},4000);
  const request=indexedDB.open('ampower-pv-mining-local',1);
  request.onupgradeneeded=()=>request.result.createObjectStore('profiles');
  request.onsuccess=()=>{clearTimeout(timer);if(expired)request.result.close();else resolve(request.result);};
  request.onerror=request.onblocked=()=>{expired=true;clearTimeout(timer);reject(request.error||new Error('Lokalny magazyn CSV jest zablokowany.'));};
});}
async function transaction(action,readonly=false){
  const database=await db();
  return new Promise((resolve,reject)=>{
    const tx=database.transaction('profiles',readonly?'readonly':'readwrite');
    let result;
    try{result=action(tx.objectStore('profiles'));}catch(error){database.close();reject(error);return;}
    tx.oncomplete=()=>{database.close();resolve(typeof result==='function'?result():result?.result);};
    tx.onerror=tx.onabort=()=>{database.close();reject(tx.error||new Error('Nie udało się zapisać CSV lokalnie.'));};
  });
}
export function profileExpired(record,now=Date.now()){
  return record?.version!==2||!Number.isFinite(record.updatedAt)||record.updatedAt>now+300000||now-record.updatedAt>=PROFILE_TTL_MS;
}
function pruneProfiles(){return transaction(store=>{
  const request=store.openCursor();
  request.onsuccess=()=>{const cursor=request.result;if(!cursor)return;if(cursor.value?.source==='csv'&&Array.isArray(cursor.value.rows))cursor.update({version:2,updatedAt:Date.now(),profile:cursor.value});else if(profileExpired(cursor.value))cursor.delete();cursor.continue();};
});}
function serial(action){const next=queue.then(action);queue=next.catch(()=>{});return next;}
export async function readSession(){
  await pruneProfiles();
  const state=decoded();if(!state||state.version!==1||!state.raw||typeof state.raw!=='object'||!Array.isArray(state.raw.selected))return null;
  if(state.csvId){
    const record=await transaction(store=>store.get(state.csvId),true);
    if(profileExpired(record)){
      delete state.csvId;sessionStorage.setItem(key,JSON.stringify(state));
      state.restoreNotice='Lokalny CSV wygasł lub został usunięty. Wczytaj go ponownie; pozostałe parametry zachowano.';
    }else {state.imported=record.profile;cachedId=state.csvId;}
  }
  cachedProfile=state.imported;return state;
}
// Write the small state synchronously before awaiting IndexedDB, so reload does not lose edits.
export async function writeSession(state){
  const previous=decoded(),previousId=cachedId||previous?.csvId;
  const id=state.imported?(previousId||crypto.randomUUID()):null;
  const imported=state.imported;
  sessionStorage.setItem(key,JSON.stringify({...state,imported:undefined,csvId:id,version:1}));
  cachedId=id;
  return serial(async()=>{
    if(imported){
      if(imported!==cachedProfile||id!==previousId)await transaction(store=>store.put({version:2,updatedAt:Date.now(),profile:imported},id));
      cachedProfile=imported;
    }else {if(previousId)await transaction(store=>store.delete(previousId));cachedProfile=undefined;}
  });
}
export async function clearSession(){
  const id=cachedId||decoded()?.csvId;
  // Invalid JSON must never block resetting the inputs.
  sessionStorage.removeItem(key);cachedId=null;cachedProfile=undefined;
  await serial(async()=>{if(id)await transaction(store=>store.delete(id));});
}
// Explicit UI action: includes orphaned copies from previous sessions and other tabs.
export async function clearAllProfiles(){
  await serial(()=>transaction(store=>store.clear()));
  const state=decoded();if(state){delete state.csvId;sessionStorage.setItem(key,JSON.stringify(state));}
  cachedId=null;cachedProfile=undefined;
}
