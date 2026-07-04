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
