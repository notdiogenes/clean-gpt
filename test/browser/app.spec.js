const { test, expect } = require('@playwright/test');

test('loads and switches destination profiles', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Copy Sanitizer' })).toBeVisible();
  await page.locator('#inputEditor').fill('Hello — world');
  await page.locator('#destinationSelect').selectOption('markdown');
  await expect(page.locator('#destinationCopyButton')).toHaveText('Copy Markdown');
  await expect(page.locator('#outputEditor')).toContainText('Hello -- world');
});

test('shows browser compatibility status', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#compatibilityList')).toContainText('ClipboardItem support:');
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

test('shows invisible characters in input and output previews', async ({ page }) => {
  await page.goto('/');
  const sample = 'A\u00a0B\u200bC\u00adD';
  await page.locator('#inputEditor').fill(sample);
  await page.locator('[data-option="removeHidden"]').uncheck();
  await page.locator('[data-option="normalizeSpaces"]').uncheck();
  await page.getByLabel('Show invisible characters').check();

  await expect(page.locator('#inputEditor')).toContainText('A⍽B[ZWSP]C[SHY]D');
  await expect(page.locator('#outputEditor')).toContainText('A⍽B[ZWSP]C[SHY]D');

  await page.getByLabel('Show invisible characters').uncheck();
  await expect(page.locator('#inputEditor')).toContainText(sample);
});


test('offers compact diff view beside the output preview', async ({ page }) => {
  await page.goto('/');
  await page.locator('#inputEditor').fill('Hello — world');

  await expect(page.locator('#diffViewMode')).toHaveValue('compact');
  await expect(page.locator('#outputEditor')).toContainText('Hello -- world');
  await expect(page.locator('#outputEditor .char-change')).toContainText(' -- ');
  await expect(page.locator('#outputEditor')).not.toContainText('changed line');

  await page.locator('#diffViewMode').selectOption('diagnostic');
  await expect(page.locator('#outputEditor')).toContainText('Full diagnostic diff');
  await expect(page.locator('#outputEditor .diff-remove')).toContainText('Hello — world');
  await expect(page.locator('#outputEditor .diff-add')).toContainText('Hello -- world');
});

test('links to tests and debugging page with runnable checks', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'Tests & debugging' }).click();
  await expect(page).toHaveURL(/\/tests\.html$/);
  await expect(page.getByRole('heading', { name: 'Tests and Debugging' })).toBeVisible();
  await expect(page.locator('#testSummary')).toHaveText(/7\/7 tests passing/);
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

  await expect(page.locator('#outputEditor')).toContainText('Unordered list preserved: 2 items.');
  await expect(page.locator('#outputEditor .diff-note')).not.toContainText('hyphen lines');
  await expect(page.locator('#outputEditor li').first()).toHaveText('Approximately 38 box lunches');
});
