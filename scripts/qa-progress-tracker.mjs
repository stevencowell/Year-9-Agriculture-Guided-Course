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

await page.goto(`${base}/module.html?module=11`, { waitUntil: 'networkidle' });
must(await page.locator('[data-school-progress]').count() === 1, 'Module 11 shows the controlled school-identity panel');
const groupWithoutConnection = page.locator('.check-group').first();
for (let index = 0; index < 10; index += 1) {
  const check = groupWithoutConnection.locator('.check').nth(index);
  await check.getByRole('radio').first().check();
  await check.getByRole('button', { name: 'Check answer' }).click();
}
await page.waitForTimeout(120);
must(events.length === 0, 'No event is attempted before the student opens the school identity check');

await page.evaluate(() => {
  localStorage.clear();
  localStorage.setItem('year-9-agriculture:progress-pilot:school-check:v2', new Date().toISOString());
});
await page.reload({ waitUntil: 'networkidle' });
const group = page.locator('.check-group').first();
for (let index = 0; index < 10; index += 1) {
  const check = group.locator('.check').nth(index);
  await check.getByRole('radio').first().check();
  await check.getByRole('button', { name: 'Check answer' }).click();
}
await page.waitForTimeout(200);
must(events.length === 1, 'One completed Module 11 knowledge-check event is attempted');
const event = events[0] || {};
must(event.courseId === 'Y9AG-2026' && event.activityId === 'module-11-knowledge-check-1', 'Event is bound to the exact course activity');
must(event.eventType === 'knowledge-check-completed' && event.module === 11, 'Event type and module match the controlled pilot');
must(event.possible === 10 && Number.isInteger(event.score) && event.score >= 0 && event.score <= 10, 'Event contains a bounded score out of ten');
must(Object.keys(event).sort().join(',') === 'activityId,courseId,eventId,eventType,module,possible,score,sourceVersion,timestamp', 'Event contains only the minimal schema');
must(!JSON.stringify(event).match(/student|surname|class|code|answer/i), 'Event contains no client-provided identity, Student Code or answers');
const statusText = await page.locator('[data-school-progress-status]').textContent();
must(!/(confirmed received|saved successfully|receipt confirmed)/i.test(statusText || ''), 'Student page does not falsely claim confirmed receipt');

await page.goto(`${base}/module.html?module=12`, { waitUntil: 'networkidle' });
must(await page.locator('[data-school-progress]').count() === 0, 'Other modules do not expose the one-activity pilot sender');
must(browserErrors.length === 0, `No browser errors: ${browserErrors.join(' | ')}`);

await browser.close();
if (failures.length) {
  console.error(JSON.stringify({ passed: false, checks: checks.length, failures, events, browserErrors }, null, 2));
  process.exit(1);
}
console.log(JSON.stringify({ passed: true, checks: checks.length, capturedEvents: events.length }, null, 2));
