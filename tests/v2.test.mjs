import assert from 'node:assert/strict';
import {questions} from '../src/data/questions.ts';
import {results} from '../src/data/results.ts';
import {scoreAnswers,percentage} from '../src/lib/scoring.ts';
// Find actual answer sets for each requested boundary, independently by dimension.
function answersFor(targets,last){
 const answers=Array(18).fill(0);
 for(let axis=0;axis<3;axis++){
  const indexes=questions.flatMap((q,i)=>q.options.some(o=>o.scores[axis])?[i]:[]);
  function find(n,sum){if(n===indexes.length)return sum===targets[axis];const i=indexes[n];for(const a of i===17&&last!==undefined?[last]:[0,1,2,3]){answers[i]=a;if(find(n+1,sum+questions[i].options[a].scores[axis]))return true}return false}
  assert.ok(find(0,0),'Reachable scores '+targets);
 }
 const result=scoreAnswers(answers);assert.deepEqual(result.scores,targets);return result;
}
assert.ok(answersFor([6,0,1]).key.startsWith('A3'));console.log('Test 1 PASS: A=+6 -> A3');
assert.ok(answersFor([-6,0,1]).key.startsWith('A1'));console.log('Test 2 PASS: A=-6 -> A1');
for(const n of [-1,0,1]){assert.ok(answersFor([n,0,1]).key.startsWith('A2'));assert.ok(answersFor([0,n,1]).key.includes('-B2-'))}
for(const [n,level] of [[-6,'B3'],[-2,'B3'],[2,'B1'],[6,'B1']])assert.ok(answersFor([0,n,1]).key.includes('-'+level+'-'));
console.log('Test 3 PASS: A/B neutral -1,0,+1 and both outer intervals');
for(const c of [-6,-1,1,6])assert.ok(answersFor([0,0,c]).key.endsWith(c>0?'C1':'C2'));
console.log('Test 4 PASS: C positive/negative');
for(const last of [0,1,2,3])assert.ok(answersFor([0,0,0],last).key.endsWith(last<2?'C1':'C2'));
console.log('Test 5 PASS: C=0 with Q18 A/B -> C1, C/D -> C2 (Q18 included in sum)');
for(const [scores,code] of [[[-2,2,1],'DND'],[[0,0,-1],'LOADING'],[[2,0,-1],'POWER'],[[2,-2,1],'LIVE']])assert.equal(results.find(r=>r.key===answersFor(scores).key).code,code);
console.log('Test 6 PASS: DND, LOADING, POWER, LIVE mappings');
for(const [n,pct] of [[-6,0],[0,50],[6,100]]){assert.deepEqual(answersFor([n,n,n]).bars,[pct,pct,pct]);assert.equal(percentage(n),pct)}
console.log('Test 7 PASS: all three bars -6=0%, 0=50%, +6=100%');
