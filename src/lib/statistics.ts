import {results} from '../data/results';
const ID_KEY='my-user-manual:installation:v1';
const PENDING='my-user-manual:stats:pending:v1';
const ACK='my-user-manual:stats:ack:v1';
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const endpoint=import.meta.env.VITE_STATS_API_URL?.trim();
let busy=false;
export function installationId():string|null {
 try{
  const existing=localStorage.getItem(ID_KEY);if(existing&&uuid.test(existing))return existing;
  const bytes=crypto.getRandomValues(new Uint8Array(16));bytes[6]=(bytes[6]&15)|64;bytes[8]=(bytes[8]&63)|128;
  const hex=[...bytes].map(b=>b.toString(16).padStart(2,'0')).join('');
  const id=`${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20)}`;
  localStorage.setItem(ID_KEY,id);return localStorage.getItem(ID_KEY)===id?id:null;
 }catch{return null} // No persistent identity: skip instead of creating a new sample each visit.
}
async function drain(){
 if(busy||!endpoint)return;busy=true;
 try{
  const target=new URL(endpoint);if(target.protocol!=='https:'&&!(import.meta.env.DEV&&target.hostname==='localhost'))return;
  const send=async()=>{
   const id=installationId();if(!id)return;
   // Sequential latest-value queue; Web Locks also serialize submissions across tabs.
   for(let i=0;i<3;i++){
    const result=localStorage.getItem(PENDING);if(!results.some(r=>r.code===result))return;
    if(localStorage.getItem(ACK)===result)return;
    // A timed-out request may have reached the server. Invalidate the old ack first.
    localStorage.removeItem(ACK);
    const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),8000);
    try{
     const response=await fetch(target.href,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({installationId:id,result}),credentials:'omit',referrerPolicy:'no-referrer',signal:controller.signal});
     if(!response.ok)return;
     localStorage.setItem(ACK,result!);
    }finally{clearTimeout(timeout)}
    if(localStorage.getItem(PENDING)===result)return;
   }
  };
  if(navigator.locks)await navigator.locks.request('manual-stats-submit',send);else await send();
 }catch{ /* Statistics must never block the quiz or log identifiers. */ }
 finally{busy=false}
}
export function submitPersonality(result:string){
 if(!endpoint||!results.some(r=>r.code===result))return;
 try{localStorage.setItem(PENDING,result);void drain()}catch{}
}
export function initStatistics(){
 installationId();
 const retry=()=>{void drain()};const storage=(event:StorageEvent)=>{if(event.key===PENDING)retry()};
 window.addEventListener('online',retry);window.addEventListener('storage',storage);
 const timer=window.setInterval(retry,60000);retry();
 return()=>{clearInterval(timer);window.removeEventListener('online',retry);window.removeEventListener('storage',storage)};
}
