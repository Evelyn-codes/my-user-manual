import { characterImage } from '../data/images';
import type { ResultKey } from '../data/types';
const cache=new Map<ResultKey,Promise<HTMLImageElement>>();
// Decode before canvas use; a data URL keeps the page and exporter on the same bytes.
async function fetchDecoded(src:string):Promise<HTMLImageElement>{
 const controller=new AbortController();
 let timer:ReturnType<typeof setTimeout>;
 const work=async()=>{
  const response=await fetch(src,{signal:controller.signal,cache:'default'});
  if(!response.ok)throw new Error('角色图片加载失败');
  const blob=await response.blob();
  const data=await new Promise<string>((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result));reader.onerror=()=>reject(new Error('图片读取失败'));reader.readAsDataURL(blob)});
  const img=new Image();
  await new Promise<void>((resolve,reject)=>{img.onload=()=>resolve();img.onerror=()=>reject(new Error('图片解码失败'));img.src=data});
  if(img.decode)await img.decode();
  if(!img.naturalWidth||!img.naturalHeight)throw new Error('图片尺寸无效');
  return img;
 };
 try{return await Promise.race([work(),new Promise<never>((_,reject)=>{timer=setTimeout(()=>{controller.abort();reject(new Error('图片加载超时'))},12000)})])}
 finally{clearTimeout(timer!)}
}
export function loadCharacter(key:ResultKey):Promise<HTMLImageElement>{
 const existing=cache.get(key);if(existing)return existing;
 const pending=(async()=>{for(let attempt=0;attempt<2;attempt++){try{return await fetchDecoded(characterImage(key))}catch{if(attempt===1)throw new Error('角色图片暂未加载成功，请检查网络后重试')}}throw new Error('图片加载失败')})();
 cache.set(key,pending);void pending.catch(()=>{if(cache.get(key)===pending)cache.delete(key)});return pending;
}
