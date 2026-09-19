const {chromium}=require('@playwright/test');const assert=require('node:assert/strict');const vm=require('node:vm');const fs=require('node:fs');
const d=vm.runInNewContext(fs.readFileSync('design/content.js','utf8')+'\nDESIGN');
(async()=>{const browser=await chromium.launch({channel:'chrome',headless:true});try{const p=await browser.newPage();const requests=[];let fail=false;
await p.route('http://localhost:8787/api/personality-result',async route=>{if(route.request().method()==='OPTIONS')return route.fulfill({status:204,headers:{'Access-Control-Allow-Origin':'http://localhost:5177','Access-Control-Allow-Headers':'Content-Type'}});requests.push(route.request().postDataJSON());await route.fulfill({status:fail?503:200,headers:{'Access-Control-Allow-Origin':'http://localhost:5177'},contentType:'application/json',body:JSON.stringify({ok:!fail})})});
await p.goto('http://localhost:5177');const id=await p.evaluate(()=>localStorage.getItem('my-user-manual:installation:v1'));assert.ok(id);
async function seed(key){await p.evaluate(answers=>localStorage.setItem('my-user-manual:progress:v2',JSON.stringify({version:2,runId:crypto.randomUUID(),revision:1,phase:'completed',questionIndex:17,answers})),d.fixtures[key].answers);await p.reload();await p.getByRole('button',{name:'分享我的说明书'}).waitFor()}
await seed('A2-B2-C2');await p.waitForFunction(()=>localStorage.getItem('my-user-manual:stats:ack:v1')==='LOADING');assert.deepEqual(Object.keys(requests[0]).sort(),['installationId','result']);assert.equal(requests[0].installationId,id);
await p.reload();await p.getByRole('button',{name:'分享我的说明书'}).waitFor();assert.equal(requests.length,1);
await seed('A2-B2-C1');await p.waitForFunction(()=>localStorage.getItem('my-user-manual:stats:ack:v1')==='TBD');assert.equal(requests.at(-1).installationId,id);
await p.getByRole('button',{name:'重新测试',exact:true}).click();await p.getByRole('button',{name:'清除并重新开始'}).click();assert.equal(await p.evaluate(()=>localStorage.getItem('my-user-manual:installation:v1')),id);
fail=true;await seed('A1-B1-C2');assert.equal(await p.locator('.personality-name small').textContent(),'ECO');await p.waitForFunction(()=>localStorage.getItem('my-user-manual:stats:pending:v1')==='ECO');fail=false;await p.reload();await p.waitForFunction(()=>localStorage.getItem('my-user-manual:stats:ack:v1')==='ECO');
console.log('PASS: persistent UUID; only two submitted fields; reload deduplication; retest reuses UUID; failure nonblocking; queued retry.');
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exit(1)});
