export const PROGRESS_KEY='my-user-manual:progress:v2';
export type Progress={version:2;runId:string;revision:number;phase:'answering'|'completed';questionIndex:number;answers:(number|null)[]};
export type ReadResult={progress:Progress|null;problem:string};
export function newProgress():Progress {return {version:2,runId:globalThis.crypto?.randomUUID?.()??`${Date.now()}-${Math.random()}`,revision:0,phase:'answering',questionIndex:0,answers:Array(18).fill(null)}}
export function parseProgress(raw:string|null):Progress|null {
 if(!raw)return null;
 try{
  const p=JSON.parse(raw);
  if(p.version!==2||typeof p.runId!=='string'||!p.runId||!Number.isSafeInteger(p.revision)||p.revision<0||!['answering','completed'].includes(p.phase)||!Number.isInteger(p.questionIndex)||p.questionIndex<0||p.questionIndex>17||!Array.isArray(p.answers)||p.answers.length!==18||p.answers.some((v:unknown)=>v!==null&&(!Number.isInteger(v)||typeof v!=='number'||v<0||v>3)))return null;
  if(p.answers.slice(0,p.questionIndex).some((v:unknown)=>v===null))return null;
  if(p.phase==='completed'&&p.answers.some((v:unknown)=>v===null))return null;
  return {version:2,runId:p.runId,revision:p.revision,phase:p.phase,questionIndex:p.questionIndex,answers:[...p.answers]};
 }catch{return null}
}
export function readProgress():ReadResult {
 try{const raw=localStorage.getItem(PROGRESS_KEY);const progress=parseProgress(raw);return {progress,problem:raw&&!progress?'保存的进度无法读取，请重新开始。':!raw&&localStorage.getItem('my-user-manual:progress:v1')?'题库已升级，请重新测试。旧版记录仍保留在本机，新版进度将单独保存。':''}}
 catch{return {progress:null,problem:'浏览器暂不允许保存进度；本次可继续答题，但退出后可能无法恢复。'}}
}
export function saveProgress(progress:Progress):string {
 try{localStorage.setItem(PROGRESS_KEY,JSON.stringify(progress));return ''}
 catch{return '进度未能保存。请保持页面打开；退出后可能无法恢复。'}
}
