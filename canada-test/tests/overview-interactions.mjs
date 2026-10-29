import { createRequire } from 'node:module';
import { readFile,writeFile } from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import path from 'node:path';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url),{chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
const out=path.resolve('canada-test/tests'),report={checks:[],errors:[]};
try{
 const c=await browser.newContext({viewport:{width:1440,height:900},acceptDownloads:true});await c.addInitScript(()=>{window.showSaveFilePicker=undefined;});
 const p=await c.newPage();p.on('pageerror',e=>report.errors.push(e.message));await p.goto(pathToFileURL(path.resolve('canada-test/overview.html')).href);
 for(const id of ['question','answer','coverage','scope','action']){
  const target=p.locator(`[data-unit="${id}"]`);await target.click();await p.locator('#popup-scrim .pop:visible').waitFor();assert.match(await p.locator('#popup-scrim .pop:visible').innerText(),/What the review package contains/);await p.keyboard.press('Escape');
 }
 report.checks.push('All five overview detail targets open with pointer input and close with Escape.');
 await p.locator('[data-unit="action"]').focus();await p.keyboard.press('Enter');await p.locator('#popup-scrim .pop:visible').waitFor();await p.keyboard.press('Escape');
 assert.ok(await p.locator('[data-unit="action"]').evaluate(e=>e===document.activeElement));report.checks.push('Keyboard activation and focus restoration work.');
 await p.locator('#mode-toggle').click();
 const editable=p.locator('[data-unit="context"] p').first();await editable.dblclick();await editable.fill('QA edited context — original fictional Canadian exercises.');await p.locator('#editor-bold').click();await p.locator('#mode-toggle').click();
 report.checks.push('Context text can be edited using the shared editor.');
 for(const [id,name] of [['export-html','overview-client-qa.html'],['export-template','overview-template-qa.html']]){
  const d=await Promise.all([p.waitForEvent('download'),p.locator('#'+id).click()]);await d[0].saveAs(path.join(out,name));
  const q=await c.newPage();await q.goto(pathToFileURL(path.join(out,name)).href);await q.waitForTimeout(200);
  if(id==='export-html'){
   assert.match(await q.locator('body').innerText(),/QA edited context/);assert.equal(await q.locator('#mode-toggle').count(),0);
   const bytes=await readFile(path.join(out,name),'utf8');assert.ok(!bytes.includes('showSaveFilePicker'));assert.ok(!bytes.includes('createWritable'));
   await q.locator('[data-unit="action"]').click();assert.match(await q.locator('#popup-scrim .pop:visible').innerText(),/Thirty original exercises/);await q.keyboard.press('Escape');
  }else{const bytes=await readFile(path.join(out,name),'utf8');assert.ok(!bytes.includes('QA edited context'));assert.ok(!bytes.includes('Canadian Practice Files'));assert.equal(await q.locator('#mode-toggle').count(),1);}
  await q.close();
 }
 report.checks.push('Client export preserves edits and detail; template clears sample content; both reopen offline.');
 await p.locator('#mode-toggle').click();const [working]=await Promise.all([p.waitForEvent('download'),p.locator('#ld-save').click()]);await working.saveAs(path.join(out,'overview-working-qa.html'));
 const saved=await c.newPage();await saved.goto(pathToFileURL(path.join(out,'overview-working-qa.html')).href);assert.match(await saved.locator('body').innerText(),/QA edited context/);report.checks.push('Working Save/reopen preserves edited text.');
 assert.deepEqual(report.errors,[]);console.log(report);
}finally{await writeFile(path.join(out,'overview-interactions-report.json'),JSON.stringify(report,null,2)+'\n');await browser.close();}
