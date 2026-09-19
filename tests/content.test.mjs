import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import vm from 'node:vm';
import {questions} from '../src/data/questions.ts';
import {results} from '../src/data/results.ts';
import {images} from '../src/data/images.ts';
import {demoFixtures} from '../src/data/demoFixtures.ts';
const design=JSON.parse(JSON.stringify(vm.runInNewContext(readFileSync(new URL('../design/content.js',import.meta.url),'utf8')+'\nDESIGN')));
assert.deepEqual(questions,design.questions);
assert.equal(questions.length,18);
assert.equal(questions.flatMap(q=>q.options).length,72);
assert.equal(results.length,18);
assert.equal(new Set(results.map(r=>r.key)).size,18);
for(const [index,result] of results.entries()){
 const {image,...content}=design.cards[index];assert.deepEqual(result,content);
 assert.equal(images[result.key],'/characters/'+image.split('/').at(-1));
 assert.ok(existsSync(new URL('../public'+images[result.key],import.meta.url)));
 const fixture=demoFixtures[result.key];
 const scores=[0,1,2].map(axis=>questions.reduce((sum,q,i)=>sum+q.options[fixture.answers[i]].scores[axis],0));
 assert.deepEqual(fixture.scores,scores);
 assert.deepEqual(fixture.bars,scores.map(score=>Math.round((score+6)/12*100)));
}
const source=JSON.parse(readFileSync(new URL('./fixtures/content-v2.json',import.meta.url),'utf8'));
assert.deepEqual(questions,source.questions);assert.deepEqual(results,source.cards);
assert.equal(results[9].name,'缓冲中');assert.ok(results.every(c=>c.selfTips&&c.tips.length===2));
console.log('PASS: exact V2 questions/options/scores/cards; images and all 18 fixtures.');
