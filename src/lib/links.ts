import type {ResultKey} from '../data/types.ts';
export function buildResultLink(key:ResultKey,configured:string|undefined,current:string):string {
 const url=new URL(configured?.trim()||new URL(current).pathname,current);
 if(!['http:','https:'].includes(url.protocol))throw new Error('站点地址必须以 http 或 https 开头');
 url.search='';url.hash='';url.searchParams.set('from','poster');url.searchParams.set('result',key);
 return url.href;
}
export const resultLink=(key:ResultKey)=>buildResultLink(key,import.meta.env.VITE_SITE_URL,window.location.href);
