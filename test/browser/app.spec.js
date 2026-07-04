const { test, expect } = require('@playwright/test');

test('loads and switches destination profiles', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Copy Sanitizer' })).toBeVisible();
  await page.locator('#inputEditor').fill('Hello — world');
  await page.locator('#destinationSelect').selectOption('markdown');
  await expect(page.locator('#destinationCopyButton')).toHaveText('Copy text');
  await expect(page.locator('#outputEditor')).toContainText('Hello -- world');
});

test('omits debug-only inspector sections', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Browser compatibility' })).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Clipboard and lists' })).toHaveCount(0);
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
  await expect(page.locator('#destinationStyleLabel')).toHaveText('Style');
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


test('defaults to preview and toggles compact diff view beside the output preview', async ({ page }) => {
  await page.goto('/');
  await page.locator('#inputEditor').fill('Hello — world');

  await expect(page.locator('#diffViewToggle')).not.toBeChecked();
  await expect(page.locator('#outputEditor .char-change')).toHaveCount(0);
  await expect(page.locator('#outputEditor')).toContainText('Hello -- world');

  await page.locator('#diffViewToggle').check();
  await expect(page.locator('#outputEditor')).toContainText('Hello -- world');
  await expect(page.locator('#outputEditor .char-change')).toContainText(' -- ');
  await expect(page.locator('#outputEditor')).not.toContainText('character changes');
});

test('inspector highlights changed source text without scrolling', async ({ page }) => {
  await page.goto('/');
  await page.locator('#inputEditor').fill('“Hello” — world');

  const beforeScroll = await page.evaluate(() => window.scrollY);
  await page.locator('#statsList li', { hasText: 'Dashes changed' }).evaluate((item) => item.dispatchEvent(new MouseEvent('click', { bubbles: true })));

  await expect(page.locator('#inputEditor .source-change')).toHaveCount(1);
  await expect(page.locator('#inputEditor .source-change')).toHaveText('—');
  await expect(page.locator('#outputEditor')).not.toHaveClass(/inspector-pulse/);
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(beforeScroll);
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


test('advanced settings sheet opens from the left, supports item toggles, and dismisses', async ({ page }) => {
  await page.goto('/');
  await page.locator('#advancedSettingsButton').click();
  await expect(page.locator('#advancedSettings')).toHaveAttribute('open', '');
  const sheetBox = await page.locator('.advanced-sheet').boundingBox();
  expect(sheetBox.x).toBeLessThan(80);

  await page.locator('#advancedSettings details', { hasText: 'Source cleanup' }).locator('summary').click();
  await page.locator('#advancedSettings details', { hasText: 'Punctuation cleanup' }).locator('summary').click();
  const collapseRepeated = page.locator('[data-option="collapseRepeatedSpaces"]');
  await expect(collapseRepeated).not.toBeChecked();
  await page.locator('.setting-item', { hasText: 'Collapse repeated spaces' }).click();
  await expect(collapseRepeated).toBeChecked();

  await page.keyboard.press('Escape');
  await expect(page.locator('#advancedSettings')).not.toHaveAttribute('open', '');

  await page.locator('#advancedSettingsButton').click();
  await page.mouse.click(900, 200);
  await expect(page.locator('#advancedSettings')).not.toHaveAttribute('open', '');
});


test('editor tops align and input remains visible while reviewing inspector', async ({ page }) => {
  await page.goto('/');
  const tops = await page.evaluate(() => ({
    input: document.querySelector('#inputEditor').getBoundingClientRect().top,
    output: document.querySelector('#outputEditor').getBoundingClientRect().top
  }));
  expect(Math.abs(tops.input - tops.output)).toBeLessThan(1);

  await page.locator('#statsLabel').scrollIntoViewIfNeeded();
  await expect(page.locator('#inputEditor')).toBeInViewport();
  await expect(page.locator('#statsLabel')).toBeInViewport();
});

test('advanced setting items include descriptions', async ({ page }) => {
  await page.goto('/');
  await page.locator('#advancedSettingsButton').click();
  await page.locator('#advancedSettings details', { hasText: 'Source cleanup' }).locator('summary').click();
  await expect(page.locator('.setting-item', { hasText: 'Collapse repeated spaces' }).locator('.setting-item-description')).toContainText('Multiple spaces');
});
