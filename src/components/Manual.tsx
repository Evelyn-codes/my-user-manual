import { useEffect, useRef, type ReactNode } from 'react';
import type { ResultCard, Scores } from '../data/types';
export function ManualIcon() { return <svg className="manual-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 5C9 3 5 3 2 4v15c3-1 7-1 10 1 3-2 7-2 10-1V4c-3-1-7-1-10 1v15"/><path d="M5 8h4M5 12h4M15 8h4M15 12h4"/></svg> }
export function Header({aside}:{aside?:ReactNode}) {return <header className="appbar"><b><ManualIcon/>本人使用说明书</b><span className="tiny">{aside}</span></header>}
export const themeFor=(card:ResultCard)=>({A1:'blue',A2:'yellow',A3:'green'})[card.key.slice(0,2) as 'A1'|'A2'|'A3'];
export function Name({card}:{card:ResultCard}) {return <h2 className="personality-name"><span>{card.name}</span><span className="name-divider">·</span><small>{card.code}</small></h2>}
export function Tips({card,poster=false}:{card:ResultCard;poster?:boolean}) {return <section className={poster?'poster-tips':'tips'}><h3>好友使用说明</h3>{card.tips.map((tip,index)=><p key={tip}><span>0{index+1}</span><span>{tip}</span></p>)}</section>}
export function Metrics({bars}:{bars:Scores}) {return <div className="metrics">{['社交电量','计划力','直球度'].map((label,index)=><div className="metric" key={label}><div><span>{label}</span><b>{bars[index]}<small>%</small></b></div><div className="track" aria-hidden="true"><i style={{width:`${bars[index]}%`}}/></div></div>)}</div>}
export function Dialog({title,onClose,children,className=''}:{title:string;onClose:()=>void;children:ReactNode;className?:string}) {
 const ref=useRef<HTMLDialogElement>(null);
 useEffect(()=>{const dialog=ref.current!;const previous=document.body.style.overflow;dialog.showModal();document.body.style.overflow='hidden';return()=>{dialog.close();document.body.style.overflow=previous}},[]);
 return <dialog ref={ref} className={`modal ${className}`} aria-label={title} onCancel={e=>{e.preventDefault();onClose()}} onClick={e=>{if(e.target===e.currentTarget)onClose()}}><div className="dialog-content"><div className="preview-heading"><span>{title}</span><button type="button" onClick={onClose} aria-label="关闭">×</button></div>{children}</div></dialog>
}
