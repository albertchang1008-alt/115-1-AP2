import fs from 'node:fs';import {chromium} from 'playwright';
const browser=await chromium.launch({channel:'chrome'});
try{for(const slug of ['airway-structure','lungs-pleura','breathing-mechanics','lung-function','gas-exchange','o2-co2-transport','respiratory-control'])for(const width of [390,1280]){
const c=JSON.parse(fs.readFileSync(`materials-src/${slug}/content.json`));const page=await browser.newPage({viewport:{width,height:844}});
await page.route('**/course-learning.js',r=>r.fulfill({body:'window.CourseLearning={explore(){},nodeTime(){},answer(){},complete(){}}'}));
await page.goto('file://'+process.cwd()+`/public/materials/${slug}-v1/index.html`);
await page.locator('.stage:not([hidden])').screenshot({path:`docs/respiratory-screenshots/${slug}-${width}-foundation.png`});
for(let i=0;i<6;i++){const stage=page.locator(`[data-kind="foundation"][data-index="${i}"]`);await stage.locator(`[data-answer="${c.foundation[i].answer}"]`).click();await stage.locator('.feedback button').click();}
await page.locator('[data-kind="case"][data-index="0"]').screenshot({path:`docs/respiratory-screenshots/${slug}-${width}-case.png`});await page.close();
}}finally{await browser.close();}
console.log('28 foundation/case screenshots saved');
