import { useCallback, useEffect, useRef, useState } from 'react';
import { questions } from './data/questions';
import { results } from './data/results';
import { characterImage } from './data/images';
import { site } from './data/site';
import { scoreAnswers } from './lib/scoring';
import { newProgress, readProgress, saveProgress, PROGRESS_KEY, type Progress } from './lib/progress';
import { track } from './lib/tracking';
import { resultLink } from './lib/links';
import type { ResultKey } from './data/types';
import { Dialog, Header, Metrics, Name, Tips, themeFor } from './components/Manual';

type Screen='landing'|'question'|'calculating'|'result'|'gallery'|'detail';
type Route={screen:Screen;index:number;runId?:string;detailKey?:ResultKey};
const home:Route={screen:'landing',index:0};
const routeFor=(p:Progress|null):Route=>p?{screen:p.phase==='completed'?'result':'question',index:p.questionIndex,runId:p.runId}:home;

export default function App(){
 const [boot]=useState(readProgress);
 const [progress,setProgress]=useState<Progress|null>(boot.progress);
 const progressRef=useRef(progress);
 const unsavedRef=useRef(false);
 const [route,setRoute]=useState<Route>(()=>routeFor(boot.progress));
 const [storageNotice,setStorageNotice]=useState(boot.problem);
 const [modal,setModal]=useState<'poster'|'restart'|'copy'|null>(null);
 const [toast,setToast]=useState('');
 const [axis,setAxis]=useState(0);
 const [copyUrl,setCopyUrl]=useState('');
 const [poster,setPoster]=useState<{url:string;width:number;height:number;link:string}|null>(null);
 const [posterError,setPosterError]=useState('');
 const [posterBusy,setPosterBusy]=useState(false);
 const generation=useRef(0);
 const focusRef=useRef<HTMLElement>(null);
 const answers=progress?.answers??Array<number|null>(18).fill(null);
 const score=progress?.phase==='completed'?scoreAnswers(answers):null;
 const key=score?.key??'A1-B1-C2';
 const card=results.find(card=>card.key===(route.screen==='detail'?route.detailKey:key))??results[1];
 const question=questions[route.index];
 const count=answers.filter(answer=>answer!==null).length;
 const isWeChat=/MicroMessenger/i.test(navigator.userAgent);
 const applyRoute=useCallback((next:Route,replace=false)=>{
  window.history[replace?'replaceState':'pushState'](next,'',`#${next.screen}${next.screen==='question'?`-${next.index+1}`:''}`);setRoute(next);setModal(null);
 },[]);
 const adopt=useCallback((p:Progress|null)=>{progressRef.current=p;unsavedRef.current=false;setProgress(p);generation.current++;setPosterBusy(false);setPoster(null);applyRoute(routeFor(p),true)},[applyRoute]);
 // Save synchronously before acknowledging each answer, navigation or completion.
 const commit=useCallback((update:(p:Progress|null)=>Progress,force=false)=>{
  const fresh=readProgress();const current=progressRef.current;
  if(!force&&!unsavedRef.current&&!fresh.problem&&((fresh.progress?.runId??null)!==(current?.runId??null)||(fresh.progress?.revision??0)!==(current?.revision??0))){adopt(fresh.progress);setToast('已同步另一页面的最新进度');return null}
  const next=update(current);next.revision=(force?0:current?.revision??0)+1;
  const problem=saveProgress(next);unsavedRef.current=!!problem;setStorageNotice(problem);progressRef.current=next;setProgress(next);return next;
 },[adopt]);
 const navigate=useCallback((screen:Screen,index=0,replace=false,detailKey?:ResultKey)=>{
  let p=progressRef.current;
  if(screen==='question'){
   if(p?.phase==='completed'){applyRoute(routeFor(p),replace);return}
   if(!p){applyRoute(home,replace);return}
   const first=p.answers.findIndex(a=>a===null);index=Math.max(0,Math.min(17,index,first===-1?17:first));
   p=commit(current=>({...current!,questionIndex:index}));if(!p)return;
  }
  applyRoute({screen,index,runId:p?.runId,detailKey},replace);
 },[applyRoute,commit]);
 useEffect(()=>{
  const initial=routeFor(progressRef.current);window.history.replaceState(initial,'',window.location.pathname+window.location.search+`#${initial.screen}${initial.screen==='question'?`-${initial.index+1}`:''}`);
  const reconcile=()=>{if(unsavedRef.current)return;const fresh=readProgress();if(fresh.problem){setStorageNotice(fresh.problem);return}if(JSON.stringify(fresh.progress)!==JSON.stringify(progressRef.current))adopt(fresh.progress)};
  const storage=(event:StorageEvent)=>{if(event.key===PROGRESS_KEY||event.key===null)reconcile()};
  const visible=()=>{if(document.visibilityState==='visible')reconcile()};
  const pop=(event:PopStateEvent)=>{
   const p=progressRef.current;const state=event.state as Route|null;
   if(!state||state.runId!==p?.runId||!['landing','question','result','gallery','detail'].includes(state.screen)||!Number.isInteger(state.index)||state.index<0||state.index>17||(p?.phase==='completed'&&state.screen==='question')){applyRoute(routeFor(p),true);return}
   if(state.screen==='question')navigate('question',state.index,true);else applyRoute(state,true);
  };
  window.addEventListener('storage',storage);window.addEventListener('pageshow',reconcile);window.addEventListener('popstate',pop);document.addEventListener('visibilitychange',visible);
  return()=>{window.removeEventListener('storage',storage);window.removeEventListener('pageshow',reconcile);window.removeEventListener('popstate',pop);document.removeEventListener('visibilitychange',visible)};
 },[adopt,applyRoute,navigate]);
 useEffect(()=>{window.scrollTo(0,0);focusRef.current?.focus({preventScroll:true});if(route.screen==='landing')track('landing_view');if(route.screen==='result'&&score)track('result_viewed',{resultKey:score.key})},[route]);
 useEffect(()=>{if(!toast)return;const id=window.setTimeout(()=>setToast(''),3000);return()=>clearTimeout(id)},[toast]);
 useEffect(()=>{if(!poster)return;return()=>URL.revokeObjectURL(poster.url)},[poster]);
 useEffect(()=>{
  if(route.screen!=='calculating')return;
  setAxis(0);const timer=window.setInterval(()=>setAxis(value=>Math.min(value+1,2)),350);
  const finish=window.setTimeout(()=>navigate('result',0,true),1100);
  return()=>{clearInterval(timer);clearTimeout(finish)};
 },[route.screen,navigate]);
 const start=()=>{if(progressRef.current){applyRoute(routeFor(progressRef.current));return}const p=commit(()=>newProgress());if(p){track('test_start');applyRoute(routeFor(p))}};
 const restart=()=>{const p=commit(()=>newProgress(),true);if(p){generation.current++;setPoster(null);setPosterBusy(false);track('restart_clicked');track('test_start');applyRoute(routeFor(p),true)}};
 const answer=(value:number)=>{const p=commit(current=>({...current!,answers:current!.answers.map((a,i)=>i===route.index?value:a),questionIndex:route.index}));if(p)track('question_answered',{questionNumber:route.index+1})};
 const copy=async()=>{
  let url:string;try{url=resultLink(key);setCopyUrl(url)}catch{setToast('站点地址配置有误，请联系站点维护者');return}
  try{if(!navigator.clipboard)throw new Error('手动复制');await navigator.clipboard.writeText(url);track('result_link_copied',{resultKey:key});setToast('说明书链接已复制')}catch{setModal('copy')}
 };
 const share=async()=>{
  setModal('poster');setPosterError('');if(poster)return;
  const job=++generation.current;setPosterBusy(true);
  try{const {generatePoster}=await import('./lib/poster');const image=await generatePoster(results.find(r=>r.key===key)!);if(job!==generation.current){URL.revokeObjectURL(image.url);return}setPoster(image);track('poster_generated',{resultKey:key})}
  catch(error){if(job===generation.current)setPosterError(error instanceof Error?error.message:'生成失败，请重试')}
  finally{if(job===generation.current)setPosterBusy(false)};
 };
 const friendKey=new URLSearchParams(window.location.search);
 const friend=friendKey.get('from')==='poster'?results.find(r=>r.key===friendKey.get('result')):undefined;
 const next=()=>{if(answers[route.index]===null)return;if(route.index===17){if(count!==18)return;const p=commit(current=>({...current!,phase:'completed',questionIndex:17}));if(p){track('test_completed',{resultKey:scoreAnswers(p.answers).key});navigate('calculating')}}else navigate('question',route.index+1)};
 return <>
 {storageNotice&&<aside className="storage-notice" role="status">{storageNotice}</aside>}
 <main ref={focusRef} tabIndex={-1} className={`app-shell screen ${(route.screen==='result'||route.screen==='detail')?`result ${themeFor(card)}`:route.screen}`}>
 {route.screen==='landing'&&<><Header aside="18 道生活小题"/><div className="landing-title"><h1>{site.title}</h1><p className="landing-subtitle">{site.subtitle}</p><p className="landing-intro">18 道生活小题，<br/>看看你的社交系统到底怎么个事儿。</p></div>{friend&&<p className="friend-hint">朋友测出了「{friend.name} {friend.code}」，你会是哪一种？</p>}<div className="hero-gallery">{[results[8],results[1],results[13]].map((r,i)=><figure key={r.key} className={i===1?'hero-main':'hero-side'}><img src={characterImage(r.key)} alt={`${r.name}角色`}/><figcaption>{r.name}</figcaption></figure>)}</div><div className="landing-bottom"><div className="chips">{site.homeTags.map(t=><span key={t}>{t}</span>)}</div><button className="primary" onClick={start}>{progress?.phase==='completed'?'查看我的说明书':progress?'继续填写说明书':site.startLabel}<span>↗</span></button><p className="fine">无需登录，约 3 分钟完成。</p><p className="privacy">◇ 答案只保存在当前设备，不收集个人信息。</p></div></>}
 {route.screen==='question'&&<><Header aside={<button className="header-link" onClick={()=>navigate('landing')}>返回首页</button>}/><div className="question-content"><div className="progress-label"><b>第 {route.index+1} / 18 题</b><span>已选 {count} 题</span></div><div className="progress" role="progressbar" aria-label="答题进度" aria-valuemin={0} aria-valuemax={18} aria-valuenow={route.index+1}><i style={{width:`${(route.index+1)/18*100}%`}}/></div><span className="question-number">{String(route.index+1).padStart(2,'0')}<span> / 生活瞬间</span></span><fieldset><legend>{question.title}</legend><div className="options">{question.options.map((option,i)=><label key={option.letter} className={`option ${answers[route.index]===i?'selected':''}`}><input type="radio" name={`question-${question.id}`} value={i} checked={answers[route.index]===i} onChange={()=>answer(i)}/><span className="letter">{option.letter}</span><span className="option-copy">{option.text}</span>{answers[route.index]===i&&<b className="check" aria-hidden="true">✓</b>}</label>)}</div></fieldset><div className="question-actions">{route.index>0&&<button className="previous" onClick={()=>navigate('question',route.index-1)}>上一题</button>}<button className="primary" disabled={answers[route.index]===null} onClick={next}>{route.index===17?'查看我的结果':'下一题'}<span>→</span></button></div></div></>}
 {route.screen==='calculating'&&<><Header/><div className="calculation-body"><div className="geometric-battery" aria-hidden="true"><i/><i/><i/></div><h1>正在整理你的<br/>使用说明书……</h1><div className="axis-list" aria-live="polite">{['社交电量','生活节奏','表达方式'].map((name,i)=><p key={name} className={axis>=i?'axis-ready':''}><span>0{i+1}</span>{name}<b>{axis>=i?'✓':'· · ·'}</b></p>)}</div><button className="text-button" onClick={()=>navigate('result',0,true)}>跳过，查看说明书 →</button></div></>}
 {(route.screen==='result'||route.screen==='detail')&&<><Header aside={`说明书 / ${String(results.indexOf(card)+1).padStart(2,'0')}`}/><div className="result-title"><div className="kicker">本人的使用说明书</div><Name card={card}/><p>{card.dimensions}</p></div><blockquote className="result-quote">{card.os}</blockquote><div className="character"><img src={characterImage(card.key)} alt={`${card.name}角色主视觉`}/></div><div className="result-body"><p className="description">{card.description}</p>{route.screen==='result'&&score&&<Metrics bars={score.bars}/>}<Tips card={card}/><div className="status"><span className="dot"/>{card.footer}</div></div><div className="result-actions">{route.screen==='result'?<><button className="primary" onClick={share}>分享我的说明书<span>↗</span></button><button className="secondary" onClick={copy}>复制说明书链接</button><button className="text-button" onClick={()=>setModal('restart')}>重新测试</button></>:<button className="secondary" onClick={()=>navigate('gallery')}>返回全部说明书</button>}<p className="fine">娱乐向自我观察。</p></div></>}
 {route.screen==='gallery'&&<><Header aside={<button className="header-link" onClick={()=>navigate(progress?.phase==='completed'?'result':'landing')}>返回{progress?.phase==='completed'?'结果':'首页'}</button>}/><h1 className="gallery-title">18 种使用说明书</h1><p className="gallery-intro">{site.subtitle}</p><div className="collection">{results.map(r=><button key={r.key} className={`collection-card ${themeFor(r)}`} onClick={()=>navigate('detail',0,false,r.key)}><img loading="lazy" src={characterImage(r.key)} alt=""/><strong>{r.name} <small>· {r.code}</small></strong><span>{r.os}</span><span className="collection-link">查看说明书 →</span></button>)}</div></>}
 </main>
 {modal==='poster'&&<Dialog className="poster-modal" title="我的说明书海报" onClose={()=>setModal(null)}>{posterBusy&&<p role="status">正在生成海报……</p>}{posterError&&<div role="alert"><p>{posterError}</p><button className="primary" onClick={share}>重新生成</button></div>}{poster&&<><img className="poster-image" src={poster.url} width={poster.width} height={poster.height} alt={`${card.name} · ${card.code} 的完整说明书海报`}/><p className="save-tip">长按图片保存，再发给朋友。</p>{!isWeChat&&<a className="download-button" href={poster.url} download={`本人使用说明书-${card.code}.png`}>下载海报</a>}</>}<button className="preview-close" onClick={()=>setModal(null)}>返回说明书</button></Dialog>}
 {modal==='restart'&&<Dialog title="重新填写说明书" onClose={()=>setModal(null)}><p className="confirm-copy">清除本轮 {count} 道题的选择，从第一题重新开始？</p><button className="primary" onClick={restart}>清除并重新开始<span>↗</span></button><button className="preview-close" onClick={()=>setModal(null)}>保留当前答案</button></Dialog>}
 {modal==='copy'&&<Dialog title="复制说明书链接" onClose={()=>setModal(null)}><p>请长按下方链接复制。</p><input onCopy={()=>track('result_link_copied',{resultKey:key})} className="copy-field" aria-label="说明书链接" readOnly value={copyUrl} onFocus={e=>e.target.select()}/><button className="preview-close" onClick={()=>setModal(null)}>完成</button></Dialog>}
 {toast&&<div className="toast" role="status">{toast}</div>}
 </>;
}
