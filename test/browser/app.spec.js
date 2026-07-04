const { test, expect } = require('@playwright/test');

test('loads and switches destination profiles', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Copy Sanitizer' })).toBeVisible();
  await page.locator('#inputEditor').fill('Hello — world');
  await page.locator('#destinationSelect').selectOption('markdown');
  await expect(page.locator('#destinationCopyButton')).toHaveText('Copy text');
  await expect(page.locator('#outputEditor')).toContainText('Hello -- world');
});

test('shows browser compatibility status', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#compatibilityList')).toContainText('ClipboardItem support:');
});

test('toggles page theme', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('data-theme', /light|dark/);
  await page.locator('#themeToggle').check();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.locator('#themeToggle').uncheck();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
});

test('uses destination-specific style selectors', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#destinationStyleLabel')).toHaveText('Destination text style');
  await expect(page.locator('#destinationFontSelect option:checked')).toHaveText('Verdana');
  await expect(page.locator('#destinationSizeSelect')).toContainText('Normal');

  await page.locator('#destinationSelect').selectOption('googleDocs');
  await expect(page.locator('#destinationFontSelect')).toContainText('Arial');
  await expect(page.locator('#destinationSizeSelect')).toContainText('Heading 1 (20 pt)');
});

test('persists Gmail Verdana style distinctly from Wide', async ({ page }) => {
  await page.goto('/');
  await page.locator('#destinationFontSelect').selectOption({ label: 'Verdana' });
  await expect(page.locator('#destinationFontSelect')).toHaveValue('Verdana, sans-serif');

  await page.reload();
  await expect(page.locator('#destinationFontSelect')).toHaveValue('Verdana, sans-serif');
  await expect(page.locator('#destinationFontSelect')).toHaveText(/Verdana/);
  await expect(page.locator('#destinationFontSelect option:checked')).toHaveText('Verdana');
});

test('removes the show invisible characters input option', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByLabel('Show invisible characters')).toHaveCount(0);
});


test('toggles compact diff view beside the output preview', async ({ page }) => {
  await page.goto('/');
  await page.locator('#inputEditor').fill('Hello — world');

  await expect(page.locator('#diffViewToggle')).toBeChecked();
  await expect(page.locator('#outputEditor')).toContainText('Hello -- world');
  await expect(page.locator('#outputEditor .char-change')).toContainText(' -- ');
  await expect(page.locator('#outputEditor')).not.toContainText('character changes');

  await page.locator('#diffViewToggle').uncheck();
  await expect(page.locator('#outputEditor .char-change')).toHaveCount(0);
  await expect(page.locator('#outputEditor')).toContainText('Hello -- world');
});

test('links to tests and debugging page with runnable checks', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'Tests & debugging' }).click();
  await expect(page).toHaveURL(/\/tests\.html$/);
  await expect(page.getByRole('heading', { name: 'Tests and Debugging' })).toBeVisible();
  await expect(page.locator('#testSummary')).toHaveText(/11\/11 tests passing/);
  await expect(page.locator('#debugDiagnostics')).toContainText('Clipboard API:');

  await page.getByRole('button', { name: 'Run tests' }).click();
  await expect(page.locator('#testResults .test-result.fail')).toHaveCount(0);
});

test('compact diff preserves HTML list provenance for Gmail', async ({ page }) => {
  await page.goto('/');
  await page.locator('#inputEditor').evaluate((editor) => {
    editor.innerHTML = '<ul><li>Approximately 38 box lunches</li><li>Pickup or delivery around 12:00 p.m. on Monday</li></ul>';
    editor.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertFromPaste' }));
  });

  await expect(page.locator('#outputEditor')).not.toContainText('Unordered list preserved: 2 items.');
  await expect(page.locator('#outputEditor .diff-note')).toHaveCount(0);
  await expect(page.locator('#outputEditor li').first()).toHaveText('Approximately 38 box lunches');
});
