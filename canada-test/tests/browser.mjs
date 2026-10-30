import { createRequire } from 'node:module';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import path from 'node:path';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=path.resolve(process.env.CANADA_SITE_ROOT||'.'),out=path.resolve('canada-test/tests');
const pack=JSON.parse(await readFile('canada-test/pack.json','utf8'));
await mkdir(out,{recursive:true});
const url=file=>process.env.CANADA_SITE_URL ? new URL(file,process.env.CANADA_SITE_URL).href : pathToFileURL(path.join(root,file)).href;
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
const report={at:new Date().toISOString(),site:process.env.CANADA_SITE_ROOT||'workspace',checks:[],errors:[],screenshots:[]};
const check=s=>{report.checks.push(s);console.log('PASS',s);};
async function shot(page,name){await page.screenshot({path:path.join(out,name),fullPage:false});report.screenshots.push(name);}
async function context(options={}){const c=await browser.newContext({viewport:{width:1440,height:900},acceptDownloads:true,...options});c.on('page',p=>p.on('pageerror',e=>report.errors.push(e.message)));return c;}
async function noOverflow(page,label){const sizes=await page.evaluate(()=>({w:innerWidth,sw:document.documentElement.scrollWidth}));assert.ok(sizes.sw<=sizes.w+1,`${label} overflow ${JSON.stringify(sizes)}`);}
try{
  const ctx=await context(),page=await ctx.newPage();
  await page.goto(url('index.html'));await page.locator('#btn-new').click();await page.locator('#c-name').fill('Canada QA');await page.locator('#btn-start').click();await page.getByRole('button',{name:'Let me look around first.'}).click();
  await page.locator('#btn-journal').click();await page.locator('[data-desk-tab="firm"]').click();await page.locator('[data-action="practice-pack"][data-value="canada"]').click();
  assert.equal(await page.locator('[data-scenario]').count(),6);assert.equal(await page.locator('[data-writing]').count(),5);await shot(page,'game-canada-inbox.png');check('Firm selector opens the six level-one questions and five Canadian emails');
  const before=await page.evaluate(()=>{const s=JSON.parse(localStorage.getItem('lawscape_save_v2'));return {ethics:s.ethics,gold:s.gold,streak:s.streak,wrongStreak:s.wrongStreak,casesDone:s.casesDone,correctDone:s.correctDone};});
  for(const [i,q] of pack.questions.filter(q=>q.difficulty===1).entries()){
    await page.locator(`[data-scenario="${q.id}"]`).click();assert.match(await page.locator('#email-source').innerText(),/CANADA/);
    if(i===0)await shot(page,'game-canada-question.png');
    await page.getByRole('button',{name:q.options.find(o=>o.id===q.answer).text,exact:true}).click();
    assert.match(await page.locator('#email-delta').innerText(),/gold/);
    await page.locator('#email-continue').click();
  }
  const after=await page.evaluate(()=>{const s=JSON.parse(localStorage.getItem('lawscape_save_v2'));return {ethics:s.ethics,gold:s.gold,streak:s.streak,wrongStreak:s.wrongStreak,casesDone:s.casesDone,correctDone:s.correctDone};});assert.ok(after.gold>before.gold&&after.casesDone===before.casesDone+6);assert.equal(await page.locator('[data-scenario]').count(),0);check('Level-one Canada answers pay gold like every pack');
  await page.reload();await page.locator('#btn-continue').click();await page.locator('#btn-mail').click();
  await page.locator('#mail-new-round').click();assert.ok(await page.locator('[data-scenario]').count()>0);check('Reload preserves completion and a new study round reopens the tier');
  for(const [i,email] of pack.emails.entries()){
    await page.locator(`[data-writing="${email.id}"]`).click();await page.locator('#canada-email-text').fill(email.sampleResponse);
    if(i===0){await page.reload();await page.locator('#btn-continue').click();await page.locator('#btn-mail').click();await page.locator(`[data-writing="${email.id}"]`).click();assert.equal(await page.locator('#canada-email-text').inputValue(),email.sampleResponse);}
    await page.getByRole('button',{name:'Commit practice reply · local only'}).click();await page.locator('#canada-partner summary').click();assert.match(await page.locator('#canada-partner').innerText(),/Human review only/);
    if(i===0)await shot(page,'game-canada-email.png');
    await page.locator('#canada-back').click();
  }
  assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('lawscape_save_v2')).canada.emailAttempts.length),5);check('All five email drafts commit, reveal authored rubrics and preserve an ungraded response');
  await page.locator(`[data-writing="${pack.emails[0].id}"]`).click();await page.locator('#canada-revise').click();await page.locator('#canada-email-text').fill(pack.emails[0].sampleResponse+'\n\nQA revision.');await page.getByRole('button',{name:'Commit practice reply · local only'}).click();assert.match(await page.locator('#canada-correspondence').innerText(),/2 committed replies/);
  const [responseDownload]=await Promise.all([page.waitForEvent('download'),page.locator('#canada-export').click()]);await responseDownload.saveAs(path.join(out,'practice-response-export.json'));
  const practiceExport=JSON.parse(await readFile(path.join(out,'practice-response-export.json'),'utf8'));assert.equal(practiceExport.emailAttempts.length,6);assert.equal(practiceExport.questionAttempts.length,25);check('Revision keeps the original and response export includes all test activity');
  await page.locator('#canada-back').click();await page.locator('#email-pack').selectOption('mixed');assert.ok(!(await page.locator('[data-scenario]').evaluateAll(nodes=>nodes.map(n=>n.dataset.scenario))).some(id=>id.startsWith('CA-')));
  await page.locator('#email-writing').click();assert.equal(await page.locator('[data-writing]').count(),7);await page.locator('[data-writing="release"]').click();assert.equal(await page.locator('#writing-text').count(),1);assert.equal(await page.locator('.canada-email').count(),0);check('Switching to existing packs restores the six legacy assignments and capstone without stale Canada content');
  await page.locator('#email-pack').selectOption('canada');await page.setViewportSize({width:390,height:844});await shot(page,'game-canada-mobile.png');await noOverflow(page,'game mobile');const first=await page.locator('[data-scenario]').first().getAttribute('data-scenario');await page.locator(`[data-scenario="${first}"]`).click();assert.ok((await page.locator('#email-body').boundingBox()).height>100);await shot(page,'game-canada-question-mobile.png');await page.getByRole('button',{name:pack.questions.find(q=>q.id===first).options[0].text,exact:true}).click();check('A Canada question remains answerable on a mobile viewport');await ctx.close();
  const reviewCtx=await context(),review=await reviewCtx.newPage();await review.goto(url('canada-test/review.html'));assert.equal(await review.locator('.exercise').count(),30);await shot(review,'review-desktop.png');
  await review.locator('#CA-ON-01 > summary').click();await review.locator('#status-CA-ON-01').selectOption('revise');await review.locator('#note-CA-ON-01').fill('Synthetic QA note: verify the exception. <script>window.BAD=true</script>');await review.locator('#reviewer-name').fill('QA reviewer');
  await review.reload();await review.locator('#CA-ON-01 > summary').click();assert.equal(await review.locator('#status-CA-ON-01').inputValue(),'revise');assert.match(await review.locator('#note-CA-ON-01').inputValue(),/Synthetic QA/);assert.equal(await review.evaluate(()=>window.BAD),undefined);
  for(const [name,button] of [['review-export.json','#export-json'],['review-export.md','#export-md']]){const [d]=await Promise.all([review.waitForEvent('download'),review.locator(button).click()]);await d.saveAs(path.join(out,name));}
  const exported=JSON.parse(await readFile(path.join(out,'review-export.json'),'utf8'));assert.equal(exported.items.length,30);assert.equal(exported.items[0].status,'revise');assert.ok(exported.contentSha256);check('Practitioner notes persist safely and both exports contain version-bound decisions for all 30 items');
  await review.locator('#filter').selectOption('emails');assert.equal(await review.locator('.exercise:not(.hidden)').count(),5);await review.locator('#expand').click();assert.equal(await review.locator('.exercise:not(.hidden)[open]').count(),5);
  await review.locator('#filter').selectOption('all');await review.locator('#search').fill('CA-UND-05');assert.equal(await review.locator('.exercise:not(.hidden)').count(),1);await review.locator('#search').fill('');await review.locator('#collapse').click();
  await review.setViewportSize({width:390,height:844});await shot(review,'review-mobile.png');await noOverflow(review,'review mobile');check('Review filters, expanded email records and mobile layout work');await reviewCtx.close();
  const blocked=await context();await blocked.addInitScript(()=>{Storage.prototype.setItem=function(){throw new Error('QA quota');};});const quota=await blocked.newPage();await quota.goto(url('canada-test/review.html'));assert.match(await quota.locator('#save-status').innerText(),/Session only/);await blocked.close();check('Storage failure is visible in reviewer notes');
  for(const [width,height] of [[1280,800],[1440,900],[2560,1440],[430,932],[390,844]]){
    const c=await context({viewport:{width,height},deviceScaleFactor:width===1440?2:1,isMobile:width<500,hasTouch:width<500});const p=await c.newPage();await p.goto(url('canada-test/overview.html'));await p.waitForTimeout(250);await noOverflow(p,`overview ${width}`);
    for(const theme of ['light','dark']){if(theme==='dark'){if(width<500)await p.keyboard.press('Escape');await p.locator('#theme-toggle').click();if(width<500)await p.locator('#ld-read-page').click();}await shot(p,`overview-${width}-${theme}.png`);}
    await c.close();
  }
  check('Overview rendered in both themes at three desktop and two phone sizes, including simulated Retina');
  assert.deepEqual(report.errors,[]);check('No JavaScript page errors during game, review or overview flows');
}finally{await writeFile(path.join(out,'browser-report.json'),JSON.stringify(report,null,2)+'\n');await browser.close();}
