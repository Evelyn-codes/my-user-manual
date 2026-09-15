import {useEffect,useState} from 'react';
import type {ResultCard} from '../data/types';
import {loadCharacter} from '../lib/character';
export function Character({card}:{card:ResultCard}){
 const [src,setSrc]=useState(''),[error,setError]=useState(false),[retry,setRetry]=useState(0);
 useEffect(()=>{let active=true;setSrc('');setError(false);loadCharacter(card.key).then(img=>{if(active)setSrc(img.src)},()=>{if(active)setError(true)});return()=>{active=false}},[card.key,retry]);
 return <div className="character">{src?<img src={src} width={600} height={800} alt={`${card.name}角色主视觉`}/>:<div className="character-loading" role="status">{error?<><p>角色图片暂未加载成功</p><button className="text-button" onClick={()=>setRetry(n=>n+1)}>重新加载图片</button></>:'正在加载角色图片……'}</div>}</div>;
}
