const { test, expect } = require('@playwright/test');

async function createSampleDocxBuffer(documentXml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:rPr><w:b/><w:i/><w:u w:val="single"/><w:highlight w:val="yellow"/></w:rPr><w:t>Hello “Word” — café</w:t></w:r></w:p><w:p><w:r><w:t>Hidden</w:t></w:r><w:r><w:t>​</w:t></w:r><w:r><w:t>marker</w:t></w:r></w:p></w:body></w:document>') {
  const zlib = require('node:zlib');
  const encoder = new TextEncoder();
  const entries = [
    { name: '[Content_Types].xml', content: '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"></Types>' },
    { name: 'word/document.xml', content: documentXml }
  ].map((entry) => ({ name: entry.name, raw: encoder.encode(entry.content) }));
  const chunks = [];
  const centralDirectory = [];
  let offset = 0;
  for (const entry of entries) {
    const compressed = zlib.deflateRawSync(entry.raw);
    const nameBytes = encoder.encode(entry.name);
    const crc = crc32(entry.raw);
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(8, 8);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(compressed.length, 18);
    local.writeUInt32LE(entry.raw.length, 22);
    local.writeUInt16LE(nameBytes.length, 26);
    chunks.push(local, Buffer.from(nameBytes), compressed);

    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(20, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(8, 10);
    central.writeUInt32LE(crc, 16);
    central.writeUInt32LE(compressed.length, 20);
    central.writeUInt32LE(entry.raw.length, 24);
    central.writeUInt16LE(nameBytes.length, 28);
    central.writeUInt32LE(offset, 42);
    centralDirectory.push(central, Buffer.from(nameBytes));
    offset += local.length + nameBytes.length + compressed.length;
  }
  const centralStart = offset;
  const centralSize = centralDirectory.reduce((size, chunk) => size + chunk.length, 0);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(entries.length, 8);
  end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(centralSize, 12);
  end.writeUInt32LE(centralStart, 16);
  return Buffer.concat([...chunks, ...centralDirectory, end]);
}

function crc32(bytes) {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
  }
  return (crc ^ 0xffffffff) >>> 0;
}


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
  await page.locator('#inspectorSections li', { hasText: 'Dashes normalized' }).evaluate((item) => item.dispatchEvent(new MouseEvent('click', { bubbles: true })));

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
  await expect(page.locator('#testSummary')).toHaveText(/13\/13 tests passing/);
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

  await page.locator('#inspectorLabel').scrollIntoViewIfNeeded();
  await expect(page.locator('#inputEditor')).toBeInViewport();
  await expect(page.locator('#inspectorLabel')).toBeInViewport();
});

test('advanced setting items include descriptions', async ({ page }) => {
  await page.goto('/');
  await page.locator('#advancedSettingsButton').click();
  await page.locator('#advancedSettings details', { hasText: 'Source cleanup' }).locator('summary').click();
  await expect(page.locator('.setting-item', { hasText: 'Collapse repeated spaces' }).locator('.setting-item-description')).toContainText('Multiple spaces');
});


test('document analysis treats DOCX text and file metadata as text instead of markup', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Analyze Word file' }).click();

  const payload = '<img src=x onerror=alert(1)>';
  const xml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:t>Unsafe “&lt;img src=x onerror=alert(1)&gt;” content</w:t></w:r></w:p></w:body></w:document>`;
  const docxBuffer = await createSampleDocxBuffer(xml);
  await page.locator('#documentFileInput').setInputFiles({
    name: `${payload}.docx`,
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    buffer: docxBuffer
  });

  await expect(page.locator('#documentStatus')).toContainText('Document analysis ready');
  await expect(page.locator('#documentMetadata')).toContainText(`${payload}.docx`);
  await expect(page.locator('#documentFormattedPreview')).toContainText(payload);
  await expect(page.locator('#documentExtractedPreview')).toContainText(payload);
  await page.locator('#documentIssueSidebar .issue-row').first().click();
  await expect(page.locator('#documentIssueDetails')).toContainText(payload);
  await expect(page.locator('#documentView img')).toHaveCount(0);
});

test('document analysis uploads DOCX and returns to paste view', async ({ page }) => {
  await page.addInitScript(() => {
    window.__clipboardWrites = [];
    window.ClipboardItem = class ClipboardItem { constructor(items) { this.items = items; } };
    Object.defineProperty(navigator, 'clipboard', { value: {
      writeText: async (text) => window.__clipboardWrites.push({ type: 'text', text }),
      write: async (items) => window.__clipboardWrites.push({ type: 'rich', items })
    }, configurable: true });
  });
  await page.goto('/');
  await page.getByRole('button', { name: 'Analyze Word file' }).click();
  await expect(page.getByRole('heading', { name: 'Document analysis' })).toBeVisible();

  const docxBuffer = await createSampleDocxBuffer();
  await page.locator('#documentFileInput').setInputFiles({
    name: 'sample.docx',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    buffer: docxBuffer
  });
  await expect(page.locator('#documentStatus')).toContainText('Document analysis ready');
  await expect(page.locator('#documentSummaryCards')).toContainText('Total');
  await expect(page.locator('#documentFormattedPreview')).toContainText('Hello');
  await expect(page.locator('#documentFormattedPreview')).toContainText('Word');
  await expect(page.locator('#documentFormattedPreview .formatted-run.is-bold.is-italic.is-underline.has-highlight').first()).toBeVisible();
  await expect(page.locator('#documentFormattedPreview .issue-highlight').first()).toBeVisible();
  await page.locator('#documentDisplayModeSelect').selectOption('extracted');
  await expect(page.locator('#documentExtractedPreview')).toContainText('Hello “Word”');
  await expect(page.locator('#documentExtractedPreview .issue-highlight').first()).toBeVisible();
  await page.locator('#documentDisplayModeSelect').selectOption('formatted');
  await expect(page.locator('#documentIssueSidebar .issue-row').first()).toBeVisible();

  const openBefore = await page.locator('#documentSummaryCards .summary-card', { hasText: 'Open' }).locator('strong').innerText();
  await page.locator('#documentIssueSidebar .issue-row').first().click();
  await expect(page.locator('#documentIssueDetails')).toContainText('Selected issue');
  await page.locator('#documentIssueDetails').getByRole('button', { name: 'Apply' }).click();
  await expect(page.locator('#documentSummaryCards .summary-card', { hasText: 'Applied' }).locator('strong')).toHaveText('1');
  await expect(page.locator('#documentSummaryCards .summary-card', { hasText: 'Open' }).locator('strong')).not.toHaveText(openBefore);
  await page.getByRole('button', { name: 'Copy cleaned text' }).click();
  await expect(page.locator('#documentStatus')).toContainText('Copied cleaned text.');
  expect(await page.evaluate(() => window.__clipboardWrites.at(-1))).toMatchObject({ type: 'text' });

  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download cleaned text as .txt' }).click();
  expect((await downloadPromise).suggestedFilename()).toBe('sample-cleaned.txt');

  await page.getByRole('button', { name: 'Copy cleaned formatted content' }).click();
  await expect(page.locator('#documentStatus')).toContainText('Copied cleaned formatted content.');
  const richWrite = await page.evaluate(async () => {
    const write = window.__clipboardWrites.at(-1);
    const item = write.items[0];
    return { type: write.type, types: Object.keys(item.items), html: await item.items['text/html'].text(), plain: await item.items['text/plain'].text() };
  });
  expect(richWrite.type).toBe('rich');
  expect(richWrite.types).toEqual(expect.arrayContaining(['text/html', 'text/plain']));
  expect(richWrite.html).toContain('<span');
  expect(richWrite.plain).toContain('Hello');

  await page.getByRole('button', { name: 'Return to paste cleaner' }).click();
  await expect(page.getByRole('heading', { name: 'Original clipboard content' })).toBeVisible();
});

test('document formatted review supports inline selection navigation actions modes and filters', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Analyze Word file' }).click();
  const docxBuffer = await createSampleDocxBuffer();
  await page.locator('#documentFileInput').setInputFiles({
    name: 'review.docx',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    buffer: docxBuffer
  });
  await expect(page.locator('#documentStatus')).toContainText('Document analysis ready');

  await page.locator('#documentLeftPanelToggle').click();
  const firstIssue = page.locator('#documentFormattedPreview [data-issue-id]').first();
  await firstIssue.click();
  await page.locator('#documentLeftPanelToggle').click();
  await expect(firstIssue).toHaveClass(/is-selected/);
  await expect(page.locator('#documentIssueSidebar .issue-row.is-selected')).toHaveCount(1);
  const initialProgress = await page.locator('#documentReviewProgress').innerText();
  expect(initialProgress).toMatch(/Issue \d+ of \d+/);

  await page.getByRole('button', { name: 'Previous issue' }).click();
  const previousProgress = await page.locator('#documentReviewProgress').innerText();
  expect(previousProgress).toMatch(/Issue \d+ of \d+/);
  expect(previousProgress).not.toBe(initialProgress);
  await page.getByRole('button', { name: 'Next issue' }).click();
  await expect(page.locator('#documentReviewProgress')).toHaveText(initialProgress);

  await page.locator('#documentApplyIssueButton').click();
  await expect(page.locator('#documentIssueDetails')).toContainText('applied');
  await expect(page.locator('#documentFormattedPreview .status-applied').first()).toBeVisible();

  await page.getByRole('button', { name: 'Next issue' }).click();
  await page.locator('#documentIgnoreIssueButton').click();
  await expect(page.locator('#documentIssueDetails')).toContainText('ignored');
  await expect(page.locator('#documentFormattedPreview .status-ignored').first()).toBeVisible();

  await page.locator('#documentPreviewModeSelect').selectOption('original');
  await expect(page.locator('#documentFormattedPreview .preview-original').first()).toBeVisible();
  await expect(page.locator('#documentFormattedPreview .issue-replacement')).toHaveCount(0);
  await page.locator('#documentPreviewModeSelect').selectOption('markup');
  await expect(page.locator('#documentFormattedPreview .issue-replacement').first()).toBeVisible();
  await page.locator('#documentPreviewModeSelect').selectOption('accepted');
  await expect(page.locator('#documentFormattedPreview .preview-accepted').first()).toBeVisible();

  await page.locator('#documentIssueStatusFilter').selectOption('open');
  await expect(page.locator('#documentIssueSidebar .status-applied')).toHaveCount(0);
  await expect(page.locator('#documentIssueSidebar .status-ignored')).toHaveCount(0);
  await expect(page.locator('#documentReviewProgress')).toHaveText(/Issue \d+ of \d+/);

  await page.locator('#documentIssueTypeFilter').selectOption('punctuation');
  await expect(page.locator('#documentIssueSidebar .issue-group h4').first()).toContainText('Punctuation');
});


test('document analysis uses document-first workspace with collapsible panels and display modes', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Analyze Word file' }).click();
  const docxBuffer = await createSampleDocxBuffer();
  await page.locator('#documentFileInput').setInputFiles({
    name: 'layout.docx',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    buffer: docxBuffer
  });
  await expect(page.locator('#documentStatus')).toContainText('Document analysis ready');

  await expect(page.locator('.document-analyzer-grid')).toHaveCount(0);
  expect(await page.locator('#documentCanvas').evaluate((node) => Boolean(node.closest('.document-analyzer-grid, .analyzer-main')))).toBe(false);
  await expect(page.locator('#documentCanvas')).toBeVisible();

  const canvasWidthOpen = await page.locator('#documentCanvas').evaluate((node) => node.getBoundingClientRect().width);
  await page.locator('#documentLeftPanelToggle').click();
  await page.locator('#documentRightPanelToggle').click();
  await expect(page.locator('#documentIssuePanel')).toHaveClass(/is-collapsed/);
  await expect(page.locator('#documentIssueDetails')).toHaveClass(/is-collapsed/);
  const canvasWidthClosed = await page.locator('#documentCanvas').evaluate((node) => node.getBoundingClientRect().width);
  expect(canvasWidthClosed).toBeGreaterThanOrEqual(canvasWidthOpen);

  await page.locator('#documentLeftPanelToggle').click();
  await page.locator('#documentRightPanelToggle').click();
  await expect(page.locator('#documentIssuePanel')).toHaveClass(/is-open/);
  await expect(page.locator('#documentIssueDetails')).toHaveClass(/is-open/);

  await page.locator('#documentIssueSidebar .issue-row').first().click();
  const selectedIssueId = await page.locator('#documentIssueSidebar .issue-row.is-selected').first().getAttribute('data-issue-id');
  await page.locator('#documentLeftPanelToggle').click();
  await page.locator('#documentLeftPanelToggle').click();
  await expect(page.locator(`#documentIssueSidebar .issue-row[data-issue-id="${selectedIssueId}"]`)).toHaveClass(/is-selected/);

  await expect(page.locator('#documentFormattedPreview')).toBeVisible();
  await page.locator('#documentDisplayModeSelect').selectOption('extracted');
  await expect(page.locator('#documentExtractedPreview')).toBeVisible();
  await expect(page.locator('#documentExtractedPreview')).toContainText('Hello “Word”');
  await page.locator('#documentDisplayModeSelect').selectOption('cleaned');
  await expect(page.locator('#documentCleanedPreview')).toBeVisible();
  await expect(page.locator('#documentCleanedPreview')).toContainText('Hello');
  await page.locator('#documentDisplayModeSelect').selectOption('formatted');
  await expect(page.locator('#documentFormattedPreview')).toBeVisible();
});
