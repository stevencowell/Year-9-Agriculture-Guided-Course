const { chromium } = await import('file:///C:/Users/scowell1/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs');

const base = process.env.AGRICULTURE_QA_BASE || 'http://127.0.0.1:8881';
const failures = [];
const checks = [];
const must = (condition, message) => { checks.push(message); if (!condition) failures.push(message); };
const browser = await chromium.launch({ headless: true, executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page = await context.newPage();
const events = [];
const browserErrors = [];

page.on('pageerror', (error) => browserErrors.push(error.message));
await page.route('https://script.google.com/**', async (route) => {
  if (route.request().method() === 'POST') {
    try { events.push(JSON.parse(route.request().postData() || '{}')); }
    catch (_) { events.push({ invalid: true }); }
  }
  await route.fulfill({ status: 204, body: '' });
});

await page.goto(`${base}/module.html?module=1`, { waitUntil: 'networkidle' });
await page.locator('[name="student-name"]').fill('Steve Cowell');
await page.locator('[name="student-class"]').fill('yr 9 Ag');
const ordinaryCheck = page.locator('.check').first();
await ordinaryCheck.getByRole('radio').first().check();
await ordinaryCheck.getByRole('button', { name: 'Check answer' }).click();
must(events.length === 0, 'Ordinary module URL sends no progress event');
await page.evaluate(() => localStorage.clear());

await page.goto(`${base}/module.html?module=1&progress-pilot=steve-test`, { waitUntil: 'networkidle' });
await page.locator('[name="student-name"]').fill('Steve Cowell');
await page.locator('[name="student-class"]').fill('yr 9 Ag');
const group = page.locator('.check-group').first();
for (let index = 0; index < 10; index += 1) {
  const check = group.locator('.check').nth(index);
  await check.getByRole('radio').first().check();
  await check.getByRole('button', { name: 'Check answer' }).click();
}
await page.waitForTimeout(250);
must(events.length === 1, 'Completed ten-question group sends one event');
const knowledge = events[0] || {};
must(knowledge.eventType === 'knowledge-check-completed' && knowledge.section === 'knowledge-check-1', 'Knowledge event uses the permitted type and section');
must(Object.keys(knowledge).sort().join(',') === 'course,eventId,eventType,module,pilot,progress,section,timestamp', 'Knowledge event contains only the minimal schema');
await page.locator('[name="module-complete"]').check();
await page.waitForTimeout(150);
must(events.some((event) => event.eventType === 'module-completed' && event.progress === 100), 'Module-completion checkbox sends one 100% event');
await page.evaluate(() => localStorage.clear());

events.length = 0;
await page.goto(`${base}/folio.html?progress-pilot=steve-test`, { waitUntil: 'networkidle' });
await page.locator('[name="student-name"]').fill('Steve Cowell');
await page.locator('[name="student-class"]').fill('yr 9 Ag');
await page.locator('#folio-card-01 textarea[data-save]').first().fill('Synthetic folio QA text that must not leave the browser.');
await page.waitForTimeout(1400);
must(events.length === 1, 'Persisted folio response sends one debounced event');
const folio = events[0] || {};
must(folio.eventType === 'folio-response-persisted' && folio.section === 'folio-card-1' && folio.module === 1, 'Folio event maps to the permitted card and module');
must(!JSON.stringify(folio).includes('Synthetic folio QA text'), 'Folio response text is absent from the event');
must(browserErrors.length === 0, `No browser errors: ${browserErrors.join(' | ')}`);

await browser.close();
if (failures.length) {
  console.error(JSON.stringify({ passed: false, checks: checks.length, failures, events, browserErrors }, null, 2));
  process.exit(1);
}
console.log(JSON.stringify({ passed: true, checks: checks.length, capturedEvents: 3 }, null, 2));
