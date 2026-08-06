import fs from 'node:fs';
import path from 'node:path';
const { chromium } = await import('file:///C:/Users/scowell1/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs');
const repo = path.resolve(import.meta.dirname,'..');
const output = path.resolve(repo,'..','..','outputs','qa-browser');
fs.mkdirSync(output,{recursive:true});
const base = process.env.AGRICULTURE_QA_BASE || 'http://127.0.0.1:8881';
const failures=[]; const checks=[]; const must=(condition,message)=>{checks.push(message);if(!condition)failures.push(message);};
const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});

async function viewportRun(label,viewport){
  const context=await browser.newContext({viewport,deviceScaleFactor:1}); const page=await context.newPage(); const browserErrors=[];
  page.on('pageerror',(error)=>browserErrors.push(error.message));
  page.on('response',(response)=>{if(response.status()>=400 && response.url().startsWith(base))browserErrors.push(`${response.status()} ${response.url()}`);});
  await page.goto(`${base}/index.html`,{waitUntil:'networkidle'});
  must(await page.locator('h1').count()===1,`${label}: landing page has one H1`);
  must(await page.locator('.module-card').count()===19,`${label}: landing page shows 19 modules`);
  must(await page.getByRole('link',{name:/Open Busy Work/}).count()===1,`${label}: Busy Work destination is visible`);
  must(await page.getByRole('link',{name:/Open YouTube library/}).count()===1,`${label}: YouTube destination is visible`);
  must((await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth))<=1,`${label}: landing page has no horizontal overflow`);
  await page.screenshot({path:path.join(output,`${label}-index.png`),fullPage:true});

  for(const moduleNumber of [1,10,11,19]){
    await page.goto(`${base}/module.html?module=${moduleNumber}`,{waitUntil:'networkidle'});
    must(await page.getByRole('button',{name:'Check answer'}).count()===30,`${label}: module ${moduleNumber} has 30 checks`);
    must(await page.getByRole('radio').count()===120,`${label}: module ${moduleNumber} has 120 options`);
    must(await page.locator('.written-evidence textarea').count()===3,`${label}: module ${moduleNumber} has three written responses`);
    must(await page.locator('a').filter({hasText:'Open larger'}).count()>=1,`${label}: module ${moduleNumber} has an Open larger visual route`);
    must((await page.evaluate(()=>[...document.images].filter((image)=>!image.complete||image.naturalWidth===0).length))===0,`${label}: module ${moduleNumber} has no broken images`);
    must((await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth))<=1,`${label}: module ${moduleNumber} has no horizontal overflow`);
  }

  await page.goto(`${base}/module.html?module=1`,{waitUntil:'networkidle'});
  const firstCheck=page.locator('.check').first(); const answerIndex=await page.evaluate(()=>window.COURSE_DATA.modules[0].checks[0].answerIndex);
  await firstCheck.getByRole('radio').nth((answerIndex+1)%4).check(); await firstCheck.getByRole('button',{name:'Check answer'}).click();
  must((await firstCheck.locator('.feedback').innerText()).startsWith('Not yet.'),`${label}: incorrect MCQ gives useful feedback`);
  await firstCheck.getByRole('radio').nth(answerIndex).check(); await firstCheck.getByRole('button',{name:'Check answer'}).click();
  must((await firstCheck.locator('.feedback').innerText()).startsWith('Correct.'),`${label}: correct MCQ gives feedback`);
  await page.locator('.written-evidence textarea').first().fill('Autosave browser QA response.'); await page.waitForTimeout(150); await page.reload({waitUntil:'networkidle'});
  must(await page.locator('.written-evidence textarea').first().inputValue()==='Autosave browser QA response.',`${label}: module autosave restores`); await page.evaluate(()=>localStorage.clear());

  await page.goto(`${base}/folio.html`,{waitUntil:'networkidle'});
  must(await page.locator('.folio-card').count()===12,`${label}: folio has 12 cards`);
  must(await page.locator('textarea').count()===36,`${label}: folio has 36 evidence textareas`);
  must(await page.locator('input[data-photo]').count()===12,`${label}: folio has 12 optional photo controls`);
  must(await page.getByText(/Autosaves on this browser and device/i).count()>=1,`${label}: folio autosave status is visible`);
  await page.locator('textarea').first().fill('Folio autosave browser QA.'); await page.waitForTimeout(150); await page.reload({waitUntil:'networkidle'});
  must(await page.locator('textarea').first().inputValue()==='Folio autosave browser QA.',`${label}: folio autosave restores`); await page.evaluate(()=>localStorage.clear());
  await page.screenshot({path:path.join(output,`${label}-folio.png`),fullPage:false});

  await page.goto(`${base}/busy-work/`,{waitUntil:'networkidle'}); must(await page.locator('.busy-card').count()===21,`${label}: Busy Work landing has 21 activities`);
  const activityLinks=page.locator('a[href^="activity.html"]'); must(await activityLinks.count()===21,`${label}: each Busy Work card must open an activity`);
  await activityLinks.first().click(); await page.waitForLoadState('networkidle');
  must(await page.locator('.task-card').count()===3,`${label}: Busy Work activity has three answerable tasks`);
  await page.locator('input[type=radio]').first().check(); await page.getByRole('button',{name:'Check response'}).first().click(); must(await page.locator('.task-feedback').first().innerText()!=='',`${label}: Busy Work gives immediate feedback`);

  await page.goto(`${base}/youtube-library/`,{waitUntil:'networkidle'}); must(await page.locator('.video-card').count()===11,`${label}: YouTube library has 11 clips`);
  await page.locator('[data-play]').first().click(); must(await page.locator('iframe[src*="youtube-nocookie.com"]').count()===1,`${label}: click-to-load opens privacy-enhanced embed`); await page.keyboard.press('Escape');
  await page.goto(`${base}/plans.html`,{waitUntil:'networkidle'}); must(await page.getByRole('link',{name:/Open larger/}).count()>=1,`${label}: plan route exposes Open larger`); must(await page.getByText(/Do not invent scale/i).count()>=1,`${label}: plan-reading safeguard is visible`);
  await page.goto(`${base}/assessment.html`,{waitUntil:'networkidle'}); must(await page.getByRole('link',{name:/Open authorised Task 1 paper/}).count()===1,`${label}: assessment retains the authorised task-paper link`);
  must(browserErrors.length===0,`${label}: no local browser errors: ${browserErrors.join(' | ')}`);
  await context.close();
}

await viewportRun('desktop',{width:1440,height:1000});
await viewportRun('mobile-390',{width:390,height:844});
await browser.close();
const report={passed:failures.length===0,checks:checks.length,failures}; fs.writeFileSync(path.join(output,'qa-report.json'),`${JSON.stringify(report,null,2)}\n`,'utf8');
if(failures.length){console.error(failures.join('\n'));process.exit(1);} console.log(`Browser QA passed at desktop and 390px across course, folio, Busy Work, YouTube, plans and assessment (${checks.length} checks).`);
