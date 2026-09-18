import {adminPage} from './admin.mjs';
export const CODES=['DND','ECO','LAN','BG','SOLO','MUTE','TIMER','DRAFT','TBD','LOADING','ROAM','READ','HOTSPOT','SYNC','INSTANT','POWER','LIVE','CLOSER'];
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const encoder=new TextEncoder();
export async function hash(value){return [...new Uint8Array(await crypto.subtle.digest('SHA-256',encoder.encode(value)))].map(n=>n.toString(16).padStart(2,'0')).join('')}
const headers={'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer'};
const json=(data,status=200,cors={})=>new Response(JSON.stringify(data),{status,headers:{...headers,...cors,'Content-Type':'application/json; charset=utf-8'}});
async function readSmallBody(request){
 const reader=request.body?.getReader();if(!reader)throw Error('empty');let size=0,text='';const decoder=new TextDecoder();
 try{while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>512){await reader.cancel();throw Error('large')}text+=decoder.decode(value,{stream:true})}return JSON.parse(text+decoder.decode())}finally{reader.releaseLock()}
}
export default {async fetch(request,env){
 const url=new URL(request.url),origin=request.headers.get('Origin');
 const allowed=(env.ALLOWED_ORIGINS||'').split(',').map(s=>s.trim());
 const cors=origin&&allowed.includes(origin)?{'Access-Control-Allow-Origin':origin,'Vary':'Origin'}:{};
 try{
  if(url.pathname==='/admin'&&request.method==='GET')return new Response(adminPage,{headers:{...headers,'Content-Type':'text/html; charset=utf-8','Content-Security-Policy':"default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; connect-src 'self'; form-action 'none'; frame-ancestors 'none'; base-uri 'none'"}});
  if(url.pathname==='/api/personality-result'){
   if(origin&&!allowed.includes(origin))return json({error:'Origin not allowed'},403);
   if(request.method==='OPTIONS')return new Response(null,{status:204,headers:{...headers,...cors,'Access-Control-Allow-Methods':'POST','Access-Control-Allow-Headers':'Content-Type'}});
   if(request.method!=='POST')return json({error:'Method not allowed'},405,cors);
   if(!request.headers.get('Content-Type')?.toLowerCase().startsWith('application/json'))return json({error:'JSON required'},415,cors);
   let body;try{body=await readSmallBody(request)}catch{return json({error:'Invalid request'},400,cors)}
   if(!body||typeof body.installationId!=='string'||!UUID.test(body.installationId)||!CODES.includes(body.result)||Object.keys(body).some(k=>!['installationId','result'].includes(k)))return json({error:'Invalid request'},400,cors);
   const key=await hash(body.installationId.toLowerCase());
   await env.DB.prepare(`INSERT INTO personality_results(device_key,result_code) VALUES (?,?) ON CONFLICT(device_key) DO UPDATE SET result_code=excluded.result_code, updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE personality_results.result_code<>excluded.result_code`).bind(key,body.result).run();
   return json({ok:true},200,cors);
  }
  if(url.pathname==='/api/admin/personality-stats'){
   if(request.method!=='GET')return json({error:'Method not allowed'},405);
   // Compare fixed-length digests; the configured secret never enters a response.
   const supplied=request.headers.get('Authorization')||'';
   if(!env.ADMIN_TOKEN||env.ADMIN_TOKEN.length<32)return json({error:'Admin authentication unavailable'},503);
   const a=await hash(supplied),b=await hash('Bearer '+env.ADMIN_TOKEN);let diff=0;for(let i=0;i<a.length;i++)diff|=a.charCodeAt(i)^b.charCodeAt(i);
   if(diff)return json({error:'Unauthorized'},401);
   // One query gives a consistent snapshot for both counts and total.
   const {results:rows}=await env.DB.prepare('SELECT result_code, COUNT(*) AS count FROM personality_results GROUP BY result_code').all();
   const counts=new Map(rows.map(r=>[r.result_code,Number(r.count)]));const total=rows.reduce((n,r)=>n+Number(r.count),0);
   const results=CODES.map(result=>({result,count:counts.get(result)||0,percentage:total?Math.round((counts.get(result)||0)/total*1000)/10:0})).sort((a,b)=>b.count-a.count);
   return json({total,results});
  }
  return json({error:'Not found'},404);
 }catch{return json({error:'Service temporarily unavailable'},503,cors)}
}};
