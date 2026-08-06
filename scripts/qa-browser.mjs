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
  const progressEvents=[];
  await page.route('https://script.google.com/**',async(route)=>{if(route.request().method()==='POST'){try{progressEvents.push(JSON.parse(route.request().postData()||'{}'));}catch(_){progressEvents.push({invalid:true});}}await route.fulfill({status:204,body:''});});
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
  must(progressEvents.length===0,`${label}: ordinary student module does not initialise the tracker sender`);
  const firstCheck=page.locator('.check').first(); const answerIndex=await page.evaluate(()=>window.COURSE_DATA.modules[0].checks[0].answerIndex);
  await firstCheck.getByRole('radio').nth((answerIndex+1)%4).check(); await firstCheck.getByRole('button',{name:'Check answer'}).click();
  must((await firstCheck.locator('.feedback').innerText()).startsWith('Not yet.'),`${label}: incorrect MCQ gives useful feedback`);
  await firstCheck.getByRole('radio').nth(answerIndex).check(); await firstCheck.getByRole('button',{name:'Check answer'}).click();
  must((await firstCheck.locator('.feedback').innerText()).startsWith('Correct.'),`${label}: correct MCQ gives feedback`);
  await page.locator('.written-evidence textarea').first().fill('Autosave browser QA response.'); await page.waitForTimeout(150); await page.reload({waitUntil:'networkidle'});
  must(await page.locator('.written-evidence textarea').first().inputValue()==='Autosave browser QA response.',`${label}: module autosave restores`); await page.evaluate(()=>localStorage.clear());

  await page.goto(`${base}/module.html?module=1`,{waitUntil:'networkidle'});
  await page.locator('[name="student-name"]').fill('Steve Cowell');
  await page.locator('[name="student-class"]').fill('yr 9 Ag');
  const firstGroup=page.locator('.check-group').first();
  for(let index=0;index<10;index+=1){const check=firstGroup.locator('.check').nth(index);await check.getByRole('radio').first().check();await check.getByRole('button',{name:'Check answer'}).click();}
  await page.waitForTimeout(200);
  must(progressEvents.length===1,`${label}: completing one ten-question group creates one automatic summary event`);
  const eventPreview=progressEvents[0]||{};
  must(eventPreview.course==='Year 9 Agriculture'&&eventPreview.module===1&&eventPreview.section==='knowledge-check-1',`${label}: knowledge-check event identifies only the permitted course location`);
  must(eventPreview.eventType==='knowledge-check-completed'&&Number.isInteger(eventPreview.progress)&&typeof eventPreview.timestamp==='string',`${label}: knowledge-check event contains its type, summary progress and timestamp`);
  must(Object.keys(eventPreview).sort().join(',')==='course,eventId,eventType,module,pilot,progress,section,timestamp',`${label}: automatic event schema excludes identity, answers and browsing details`);
  await page.locator('[name="module-complete"]').check(); await page.waitForTimeout(150);
  must(progressEvents.some((event)=>event.eventType==='module-completed'&&event.progress===100),`${label}: existing module-completion checkbox creates one automatic completion event`);
  await page.screenshot({path:path.join(output,`${label}-progress-pilot.png`),fullPage:false});
  await page.evaluate(()=>localStorage.clear());

  await page.goto(`${base}/teacher-progress-demo.html`,{waitUntil:'networkidle'});
  must(await page.getByText('Action required',{exact:true}).count()===1,`${label}: teacher dashboard shell remains Action required`);
  must(await page.getByText(/Secure receiver not configured/i).count()===1,`${label}: teacher dashboard shell has no live receiver`);
  must(await page.getByText(/Static password deliberately not implemented/i).count()===1,`${label}: teacher dashboard shell explains the static-password boundary`);
  must(await page.locator('.dashboard-course-card').count()===3,`${label}: planned post-sign-in discovery uses course cards`);
  must((await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth))<=1,`${label}: teacher dashboard shell has no horizontal overflow`);
  await page.screenshot({path:path.join(output,`${label}-teacher-dashboard.png`),fullPage:true});

  await page.goto(`${base}/folio.html`,{waitUntil:'networkidle'});
  must(await page.locator('.folio-card').count()===12,`${label}: folio has 12 cards`);
  must(await page.locator('textarea').count()===36,`${label}: folio has 36 evidence textareas`);
  must(await page.locator('input[data-photo]').count()===12,`${label}: folio has 12 optional photo controls`);
  must(await page.getByText(/Autosaves on this browser and device/i).count()>=1,`${label}: folio autosave status is visible`);
  await page.locator('textarea').first().fill('Folio autosave browser QA.'); await page.waitForTimeout(150); await page.reload({waitUntil:'networkidle'});
  must(await page.locator('textarea').first().inputValue()==='Folio autosave browser QA.',`${label}: folio autosave restores`); await page.evaluate(()=>localStorage.clear());
  await page.screenshot({path:path.join(output,`${label}-folio.png`),fullPage:false});

  progressEvents.length=0;
  await page.goto(`${base}/folio.html`,{waitUntil:'networkidle'});
  await page.locator('[name="student-name"]').fill('Steve Cowell'); await page.locator('[name="student-class"]').fill('yr 9 Ag');
  await page.locator('#folio-card-01 textarea[data-save]').first().fill('Persisted synthetic folio QA response.'); await page.waitForTimeout(1350);
  must(progressEvents.length===1&&progressEvents[0].eventType==='folio-response-persisted',`${label}: persisted folio response creates one debounced automatic summary event`);
  must(progressEvents[0]?.section==='folio-card-1'&&progressEvents[0]?.module===1,`${label}: folio event maps to its card and related module`);
  must(!JSON.stringify(progressEvents[0]||{}).includes('Persisted synthetic folio QA response'),`${label}: folio response text is not transmitted`);
  await page.evaluate(()=>localStorage.clear());

  const busyUrl='https://stevencowell.github.io/busy-worksheets/?library=agriculture-year-9';
  const busyRedirect=await page.request.get(`${base}/busy-work/index.html`); const busyRedirectHtml=await busyRedirect.text();
  must(busyRedirect.ok()&&busyRedirectHtml.includes(busyUrl),`${label}: Busy Work route targets the approved Year 9 Agriculture library`);
  const busyLive=await page.request.get(busyUrl); const busyLiveHtml=await busyLive.text();
  must(busyLive.ok()&&busyLiveHtml.includes('id="activity-grid"'),`${label}: approved live Busy Work hub resolves with its activity grid`);

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
