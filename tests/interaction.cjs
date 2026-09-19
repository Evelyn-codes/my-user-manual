const {chromium}=require('@playwright/test');
const assert=require('node:assert/strict');
const fs=require('node:fs');const path=require('node:path');const vm=require('node:vm');
const {PNG}=require('pngjs');const jsQR=require('jsqr');
const BASE=process.env.TEST_URL||'http://localhost:5174/';
const STORAGE='my-user-manual:progress:v2';
const design=JSON.parse(JSON.stringify(vm.runInNewContext(fs.readFileSync('design/content.js','utf8')+'\nDESIGN')));
(async()=>{
 const {scoreAnswers}=await import('../src/lib/scoring.ts');
 const browser=await chromium.launch({channel:'chrome',headless:true});
 const output=path.resolve('test-results');fs.mkdirSync(output,{recursive:true});const errors=[],checks=[];
 try{
 const context=await browser.newContext({viewport:{width:375,height:812}});
 let page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
 const saved=()=>page.evaluate(key=>JSON.parse(localStorage.getItem(key)),STORAGE);
 const questionNumber=()=>page.locator('.progress-label b').textContent();
 const audit=async(label)=>{const layout=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth}));assert.equal(layout.scroll,layout.width,label);checks.push(label)};
 await page.goto(BASE);await page.getByRole('button',{name:'生成我的说明书'}).waitFor();
 await page.screenshot({path:path.join(output,'landing.png'),fullPage:true});
 assert.equal(await page.locator('.prototype-banner,.demo-note').count(),0);
 await page.getByRole('button',{name:'生成我的说明书'}).click();
 assert.equal(await page.getByRole('button',{name:'下一题'}).isDisabled(),true);
 for(let i=0;i<5;i++){await page.getByRole('radio').nth(i%4).check();await page.getByRole('button',{name:'下一题'}).click()}
 assert.equal(await questionNumber(),'第 6 / 18 题');assert.equal((await saved()).questionIndex,5);
 await page.close();page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));await page.goto(BASE);
 assert.equal(await questionNumber(),'第 6 / 18 题');assert.deepEqual((await saved()).answers.slice(0,5),[0,1,2,3,0]);
 await page.getByRole('radio').nth(2).check();await page.reload();
 assert.equal(await questionNumber(),'第 6 / 18 题');assert.equal(await page.getByRole('radio').nth(2).isChecked(),true);
 await page.getByRole('button',{name:'上一题'}).click();await page.getByRole('radio').nth(3).check();await page.reload();
 assert.equal(await questionNumber(),'第 5 / 18 题');assert.equal(await page.getByRole('radio').nth(3).isChecked(),true);
 await page.getByRole('button',{name:'返回首页'}).click();await page.reload();assert.equal(await questionNumber(),'第 5 / 18 题');
 await page.getByRole('button',{name:'下一题'}).click();
 await page.screenshot({path:path.join(output,'question.png'),fullPage:true});
 for(let i=5;i<18;i++){await page.getByRole('radio').nth(i%4).check();await page.getByRole('button',{name:i===17?'查看我的结果':'下一题'}).click()}
 // Completion is durable even when the page closes during the transition.
 const completed=await saved();assert.equal(completed.phase,'completed');const expected=scoreAnswers(completed.answers);
 await page.close();page=await context.newPage();await page.goto(BASE+'?from=poster&result=A1-B1-C2');
 await page.getByRole('button',{name:'分享我的说明书'}).waitFor();
 assert.equal(await page.locator('.personality-name small').textContent(),design.cards.find(c=>c.key===expected.key).code);
 assert.deepEqual(await page.locator('.metric b').allTextContents(),expected.bars.map(n=>n+'%'));
 await page.reload();assert.equal(await page.getByRole('button',{name:'分享我的说明书'}).count(),1);
 // Add same-document history before testing back navigation across a restart.
 await page.evaluate(()=>history.pushState(history.state,'','#result'));
 // Two tabs follow the newest round; history cannot resurrect previous answers.
 const other=await context.newPage();await other.goto(BASE);await other.getByRole('button',{name:'重新测试',exact:true}).click();
 await other.getByRole('button',{name:'保留当前答案'}).click();assert.equal((await saved()).phase,'completed');
 await other.getByRole('button',{name:'重新测试',exact:true}).click();await other.getByRole('button',{name:'清除并重新开始'}).click();
 await page.getByRole('button',{name:'下一题'}).waitFor();assert.notEqual((await saved()).runId,completed.runId);assert.deepEqual((await saved()).answers,Array(18).fill(null));
 await page.goBack();await page.getByRole('button',{name:'下一题'}).waitFor();assert.equal(await questionNumber(),'第 1 / 18 题');
 await other.getByRole('radio').nth(1).check();await other.getByRole('button',{name:'下一题'}).click();
 await page.waitForFunction(()=>document.querySelector('.progress-label b')?.textContent==='第 2 / 18 题');
 await page.reload();assert.equal(await questionNumber(),'第 2 / 18 题');assert.equal((await saved()).answers[0],1);await other.close();
 checks.push('close/reopen Q6, selected Q6, edit Q5, homepage exit, completed reopen, immediate completion, cancel restart, newest round cross-tab and history');
 // All mappings and real poster PNGs. Fixtures only seed persisted test answers.
 for(const width of [375,390,430,462]){
  await page.setViewportSize({width,height:812});
  for(const card of design.cards){
   const fixture=design.fixtures[card.key];
   await page.evaluate(({STORAGE,fixture,key})=>localStorage.setItem(STORAGE,JSON.stringify({version:2,runId:'test-'+key,revision:1,phase:'completed',questionIndex:17,answers:fixture.answers})),{STORAGE,fixture,key:card.key});
   await page.reload();await page.getByRole('button',{name:'分享我的说明书'}).waitFor();
   assert.equal(await page.locator('.personality-name small').textContent(),card.code);
   assert.equal(await page.locator('.description').textContent(),card.description);
   assert.equal(await page.locator('.self-tips p').textContent(),card.selfTips);
   assert.equal(await page.locator('.status').textContent(),card.footer);
   assert.ok(await page.locator('.status').evaluate(el=>!!(el.compareDocumentPosition(document.querySelector('.self-tips'))&Node.DOCUMENT_POSITION_FOLLOWING)));
   assert.ok(!/undefined|NaN/.test(await page.locator('main').textContent()));
   assert.deepEqual(await page.locator('.metric b').allTextContents(),fixture.bars.map(n=>n+'%'));await audit(`result ${card.key} at ${width}`);
   await page.getByRole('button',{name:'分享我的说明书'}).click();
   const image=page.locator('.poster-image');await image.waitFor({timeout:20000}).catch(async error=>{console.error('Poster failure',card.code,await page.getByRole('dialog').textContent());throw error});await image.evaluate(el=>el.decode());
   const size=await image.evaluate(el=>({width:el.naturalWidth,height:el.naturalHeight}));assert.equal(size.width,1080);assert.ok(size.height>=1440);
   const fit=await page.getByRole('dialog').evaluate(el=>el.scrollWidth<=el.clientWidth+1);assert.ok(fit);
   if(width===375){
    const data=await image.evaluate(async el=>{const b=await (await fetch(el.src)).blob();return await new Promise(resolve=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result.split(',')[1]);reader.readAsDataURL(b)})});
    const bytes=Buffer.from(data,'base64');const png=PNG.sync.read(bytes);
    const x=720,y=png.height-342,w=300,h=300;const cropped=new Uint8ClampedArray(w*h*4);
    for(let row=0;row<h;row++)cropped.set(png.data.subarray(((y+row)*png.width+x)*4,((y+row)*png.width+x+w)*4),row*w*4);
    const decoded=jsQR(cropped,w,h);assert.ok(decoded,`QR decode ${card.code}`);const url=new URL(decoded.data);assert.equal(url.searchParams.get('from'),'poster');assert.equal(url.searchParams.get('result'),card.key);assert.equal(url.origin,new URL(BASE).origin);assert.equal(url.hash,'');
    fs.writeFileSync(path.join(output,`poster-${card.code}.png`),bytes);
    if(card.code==='ECO')await page.screenshot({path:path.join(output,'poster-preview.png')});
   }
   await page.keyboard.press('Escape');assert.equal(await page.getByRole('dialog').count(),0);
  }
 }
 // Result actions have one centered restart and no gallery entry.
 const before=await saved();assert.equal(await page.getByRole('button',{name:'查看全部 18 种说明书'}).count(),0);
 // Clipboard denied: copyable URL remains available.
 await page.evaluate(()=>Object.defineProperty(navigator,'clipboard',{configurable:true,value:undefined}));await page.getByRole('button',{name:'复制说明书链接'}).click();
 const copied=new URL(await page.getByLabel('说明书链接',{exact:true}).inputValue());assert.equal(copied.searchParams.get('result'),scoreAnswers(before.answers).key);await page.keyboard.press('Escape');
 await page.screenshot({path:path.join(output,'result.png'),fullPage:true});
 // Invalid saved data and storage denial do not crash the form.
 await page.evaluate(k=>localStorage.setItem(k,'{broken'),STORAGE);await page.reload();await page.getByRole('button',{name:'生成我的说明书'}).waitFor();assert.equal(await page.locator('.storage-notice').count(),1);
 await page.getByRole('button',{name:'生成我的说明书'}).click();await page.getByRole('button',{name:'下一题'}).waitFor();
 const denied=await browser.newContext();await denied.addInitScript(()=>{Storage.prototype.setItem=function(){throw new DOMException('quota','QuotaExceededError')}});
 const deniedPage=await denied.newPage();await deniedPage.goto(BASE);await deniedPage.getByRole('button',{name:'生成我的说明书'}).click();await deniedPage.getByRole('radio').nth(0).check();await deniedPage.getByRole('button',{name:'下一题'}).click();assert.equal(await deniedPage.locator('.progress-label b').textContent(),'第 2 / 18 题');assert.equal(await deniedPage.locator('.storage-notice').count(),1);await denied.close();
 // WeChat UA: saveable image shown, no fake direct-share or download action.
 const wechat=await browser.newContext({userAgent:'Mozilla/5.0 MicroMessenger/8.0',viewport:{width:375,height:812}});const wp=await wechat.newPage();await wp.goto(BASE);
 await wp.evaluate(({STORAGE,answers})=>localStorage.setItem(STORAGE,JSON.stringify({version:2,runId:'wechat',revision:1,phase:'completed',questionIndex:17,answers})),{STORAGE,answers:design.fixtures['A1-B1-C2'].answers});await wp.reload();await wp.getByRole('button',{name:'分享我的说明书'}).click();await wp.locator('.poster-image').waitFor();assert.equal(await wp.getByText('长按图片保存，再发给朋友。').count(),1);assert.equal(await wp.getByRole('link',{name:'下载海报'}).count(),0);await wechat.close();
 assert.deepEqual(errors,[]);fs.writeFileSync(path.join(output,'checks.json'),JSON.stringify({checks,errors},null,2));
 console.log('PASS: durable Q6/complete/restart/cross-tab recovery; 72 real result/poster layouts; all 18 PNGs and QR decodes; copy fallback; malformed storage and quota errors; WeChat UI.');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
