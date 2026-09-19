import { questions } from '../data/questions.ts';
import type { ResultKey, Scores } from '../data/types.ts';
export function resultKey([a,b,c]: Scores, last: number): ResultKey {
  if(!Number.isInteger(last)||last<0||last>3) throw new Error('第18题选项无效');
  return `A${a>=2?3:a<=-2?1:2}-B${b>=2?1:b<=-2?3:2}-C${c>0 || (c===0 && (last===0||last===1))?1:2}`;
}
export function percentage(score:number):number { return Math.max(0,Math.min(100,Math.round((score+6)/12*100))); }
export function scoreAnswers(answers:readonly (number|null)[]) {
  if(answers.length!==18 || answers.some(a=>a===null||!Number.isInteger(a)||a<0||a>3))throw new Error('请完成全部18道题');
  const scores:[number,number,number]=[0,0,0];
  questions.forEach((q,i)=>q.options[answers[i]!].scores.forEach((s,axis)=>scores[axis]+=s));
  const bars=scores.map(s=>percentage(s)) as [number,number,number];
  return {scores,bars,key:resultKey(scores,answers[17]!)};
}
