import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import path from 'node:path';
const require=createRequire(import.meta.url);
const { chromium }=require('/Users/joelarthurkaufmann/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const browser=await chromium.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
try{const page=await browser.newPage({viewport:{width:1440,height:900}});page.on('pageerror',e=>console.log('PAGE ERROR',e.message));await page.goto(pathToFileURL(path.resolve('canada-test/overview.html')).href);await page.screenshot({path:'canada-test/tests/overview-initial.png'});console.log(JSON.stringify(await page.locator('button').evaluateAll(els=>els.map(e=>({id:e.id,text:e.textContent,title:e.title})))));console.log(await page.locator('body').innerText());}finally{await browser.close();}
