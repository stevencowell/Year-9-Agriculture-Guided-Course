import fs from 'node:fs/promises';
import path from 'node:path';

const { chromium } = await import('file:///C:/Users/scowell1/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs');

const repo = path.resolve(import.meta.dirname, '..');
const base = process.env.AGRICULTURE_QA_BASE || 'http://127.0.0.1:8881';
const reportPath = path.resolve(repo, '..', '..', 'outputs', 'folio-backup-qa.json');
const fixture = path.resolve(repo, 'assets', 'visuals', 'folio-card-01.svg');
const downloadDir = path.resolve(repo, '..', '..', 'outputs', 'qa-downloads');
await fs.mkdir(downloadDir, { recursive: true });

const browser = await chromium.launch({ headless: true, executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
const context = await browser.newContext({ acceptDownloads: true });
const page = await context.newPage();
const checks = [];
const must = (condition, label) => {
  checks.push({ label, passed: Boolean(condition) });
  if (!condition) throw new Error(label);
};

try {
  await page.goto(`${base}/folio.html`, { waitUntil: 'networkidle' });
  await page.locator('textarea[name="folio-01"]').fill('Backup and restore browser QA evidence.');
  await page.locator('[data-photo]').first().setInputFiles(fixture);
  await page.locator('[data-photo-preview] img').first().waitFor({ state: 'visible' });
  await page.reload({ waitUntil: 'networkidle' });
  must(await page.locator('textarea[name="folio-01"]').inputValue() === 'Backup and restore browser QA evidence.', 'written evidence persists after reload');
  must(await page.locator('[data-photo-preview] img').first().isVisible(), 'saved photo persists after reload');

  const downloadPromise = page.waitForEvent('download');
  await page.locator('[data-export]').click();
  const download = await downloadPromise;
  const backupPath = path.join(downloadDir, download.suggestedFilename());
  await download.saveAs(backupPath);
  const payload = JSON.parse(await fs.readFile(backupPath, 'utf8'));
  must(payload.version === 2, 'backup uses photo-capable schema version 2');
  must(payload.photos?.length === 1, 'backup contains one saved photo');
  must(String(payload.photos?.[0]?.dataUrl || '').startsWith('data:image/'), 'backup embeds the photo as an image data URL');

  page.once('dialog', (dialog) => dialog.accept());
  await page.locator('[data-reset]').click();
  await page.waitForTimeout(1000);
  await page.reload({ waitUntil: 'networkidle' });
  must(await page.locator('textarea[name="folio-01"]').inputValue() === '', 'reset clears written evidence');
  must(await page.locator('[data-photo-preview] img').count() === 0, 'reset clears saved photos');

  page.once('dialog', (dialog) => dialog.accept());
  await page.locator('[data-import]').setInputFiles(backupPath);
  await page.waitForTimeout(1000);
  await page.reload({ waitUntil: 'networkidle' });
  must(await page.locator('textarea[name="folio-01"]').inputValue() === 'Backup and restore browser QA evidence.', 'restore returns written evidence');
  must(await page.locator('[data-photo-preview] img').first().isVisible(), 'restore returns the saved photo');

  await fs.writeFile(reportPath, `${JSON.stringify({ passed: true, base, checks }, null, 2)}\n`);
  console.log(`Folio backup QA passed (${checks.length} checks).`);
} finally {
  await browser.close();
}
