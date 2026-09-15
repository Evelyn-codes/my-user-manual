const {chromium}=require('@playwright/test');
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const vm=require('node:vm');
const design=vm.runInNewContext(readFileSync('design/content.js','utf8')+'\nDESIGN');
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true});
 try{
 const page=await browser.newPage({viewport:{width:375,height:812}});
 const base=process.env.TEST_URL||'http://localhost:5174/';
 await page.goto(base);
 await page.evaluate(answers=>localStorage.setItem('my-user-manual:progress:v1',JSON.stringify({version:1,runId:'image-check',revision:1,phase:'completed',questionIndex:17,answers})),design.fixtures['A1-B3-C2'].answers);
 let requests=0;
 await page.route('**/characters/v2/06.jpg',async route=>{requests++;await new Promise(r=>setTimeout(r,1500));await route.continue()});
 await page.reload();await page.getByRole('button',{name:'分享我的说明书'}).click();
 await page.locator('.poster-image').waitFor({timeout:20000});assert.equal(requests,1,'page and poster share a single image request');
 await page.keyboard.press('Escape');await page.unroute('**/characters/v2/06.jpg');
 await page.route('**/characters/v2/06.jpg',route=>route.abort());await page.reload();
 await page.getByRole('button',{name:'重新加载图片'}).waitFor();
 await page.getByRole('button',{name:'分享我的说明书'}).click();await page.getByRole('alert').waitFor();
 assert.equal(await page.locator('.poster-image').count(),0,'failed image cannot produce a blank poster');
 await page.unroute('**/characters/v2/06.jpg');await page.getByRole('button',{name:'重新生成',exact:true}).click();await page.locator('.poster-image').waitFor({timeout:20000});
 console.log('PASS: delayed MUTE image shared once; network failure prevents export; retry recovers.');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
