import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {questions} from '../src/data/questions.ts';
import {results} from '../src/data/results.ts';
import {scoreAnswers,resultKey} from '../src/lib/scoring.ts';
import {parseProgress,newProgress,saveProgress,readProgress,PROGRESS_KEY} from '../src/lib/progress.ts';
import {buildResultLink} from '../src/lib/links.ts';
const sourceScores=JSON.parse(readFileSync(new URL('./fixtures/source-scores.json',import.meta.url),'utf8'));
assert.equal(sourceScores.length,72);assert.deepEqual(questions.flatMap(q=>q.options.map(o=>o.scores)),sourceScores);
for(const q of questions)for(let axis=0;axis<3;axis++)assert.equal(q.options.reduce((s,o)=>s+o.scores[axis],0),0);
assert.equal(resultKey([-3,3,1],0),'A1-B1-C1');
for(const [a,A] of [[-3,1],[-2,2],[2,2],[3,3]])for(const [b,B] of [[-3,3],[-2,2],[2,2],[3,1]])for(const last of [0,1,2,3])assert.equal(resultKey([a,b,0],last),`A${A}-B${B}-C${last%2===0?1:2}`);
let seed=71;const rnd=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed>>>30};
const tieCases=new Map(),mapped=new Set();
for(let t=0;t<10000;t++){
 const answers=Array.from({length:18},rnd);const scored=scoreAnswers(answers);
 const expected=[0,1,2].map(axis=>answers.reduce((s,a,i)=>s+sourceScores[i*4+a][axis],0));
 assert.deepEqual(scored.scores,expected);assert.deepEqual(scored.bars,expected.map(n=>Math.round((n+18)/36*100)));
 assert.deepEqual(scoreAnswers([...answers]),scored);mapped.add(scored.key);
 if(expected[2]===0){tieCases.set(answers[17],answers);assert.ok(scored.key.endsWith(answers[17]%2===0?'C1':'C2'))}
}
assert.equal(mapped.size,18);assert.equal(tieCases.size,4);
for(const bad of [[],Array(18).fill(null),Array(18).fill(4),Array(18).fill(.5)])assert.throws(()=>scoreAnswers(bad));
const p=newProgress();p.questionIndex=5;p.answers.splice(0,5,0,1,2,3,0);assert.deepEqual(parseProgress(JSON.stringify(p)),p);
assert.equal(parseProgress(JSON.stringify({...p,phase:'completed'})),null);
assert.equal(parseProgress(JSON.stringify({...p,questionIndex:18})),null);
assert.equal(parseProgress('{broken'),null);assert.equal(parseProgress(JSON.stringify({...p,version:99})),null);
const store=new Map();globalThis.localStorage={getItem:k=>store.get(k)??null,setItem:(k,v)=>store.set(k,v)};
assert.equal(saveProgress(p),'');assert.deepEqual(readProgress().progress,p);
const latest=newProgress();saveProgress(latest);assert.equal(store.size,1);assert.equal(readProgress().progress.runId,latest.runId);assert.notEqual(latest.runId,p.runId);
assert.equal(PROGRESS_KEY,'my-user-manual:progress:v1');
globalThis.localStorage={getItem:()=>{throw Error('blocked')},setItem:()=>{throw Error('blocked')}};
assert.ok(readProgress().problem);assert.ok(saveProgress(p));
assert.equal(buildResultLink('A1-B1-C2','https://example.com/manual/','http://localhost:5174/#result'),'https://example.com/manual/?from=poster&result=A1-B1-C2');
assert.equal(buildResultLink('A1-B1-C2',undefined,'https://example.com/path/?foo=1#result'),'https://example.com/path/?from=poster&result=A1-B1-C2');
assert.throws(()=>buildResultLink('A1-B1-C2','javascript:alert(1)','https://example.com'));
console.log('PASS: source scoring audit, 10,000 deterministic cases, all 18 mappings, all 4 Q18 tie cases, boundary values, progress validation/replacement, storage failures, share URLs.');
