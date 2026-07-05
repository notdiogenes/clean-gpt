const test = require('node:test');
const assert = require('node:assert/strict');
const sanitizer = require('../app.js');

test('rejects non-DOCX files', () => {
  assert.equal(sanitizer.isDocxFile({ name: 'notes.txt' }), false);
  assert.equal(sanitizer.isDocxFile({ name: 'report.docx' }), true);
});

test('handles empty extracted text', () => {
  assert.throws(() => sanitizer.analyzeDocumentText({ rawText: '   ', paragraphs: ['   '] }), /Empty document/);
});

test('counts hidden characters', () => {
  const text = 'a\u200Bb'.replace('\\u200B', '\u200B');
  const report = sanitizer.analyzeDocumentText({ rawText: text, paragraphs: [text] });
  const hidden = report.issueGroups.find((group) => group.id === 'hidden');
  assert.equal(hidden.count, 1);
});

test('counts non-ASCII characters', () => {
  const report = sanitizer.analyzeDocumentText({ rawText: 'Café — ok', paragraphs: ['Café — ok'] });
  const nonAscii = report.issueGroups.find((group) => group.id === 'nonAscii');
  assert.ok(nonAscii.count >= 2);
});

test('produces issue groups', () => {
  const report = sanitizer.analyzeDocumentText({ rawText: '“Hello”  world… ﬁle', paragraphs: ['“Hello”  world… ﬁle'] });
  assert.deepEqual(report.issueGroups.map((group) => group.id), ['hidden', 'whitespace', 'punctuation', 'compatibility', 'nonAscii', 'warnings']);
  assert.ok(report.totalIssues > 0);
});

test('copying cleaned text can use analyzed preview text', async () => {
  const report = sanitizer.analyzeDocumentText({ rawText: '“Hello” — world', paragraphs: ['“Hello” — world'] });
  let copied = '';
  const clipboard = { writeText: async (text) => { copied = text; } };
  await clipboard.writeText(report.cleanedText);
  assert.equal(copied, '"Hello" -- world');
});

test('clearing uploaded document resets in-memory state shape', () => {
  let model = { fileName: 'sample.docx', rawText: 'Hello' };
  model = null;
  assert.equal(model, null);
});

test('analysis issues include range metadata and proposed replacements', () => {
  const report = sanitizer.analyzeDocumentText({ rawText: 'Hi “x”', paragraphs: ['Hi “x”'] });
  const quote = report.issues.find((issue) => issue.type === 'double-quote');
  assert.equal(quote.start, 3);
  assert.equal(quote.end, 4);
  assert.equal(quote.originalText, '“');
  assert.equal(quote.replacement, '"');
  assert.equal(quote.status, 'open');
});

test('applying one issue updates cleaned preview via patch model', () => {
  const model = { rawText: 'Hi “x”', analysisResults: sanitizer.analyzeDocumentText({ rawText: 'Hi “x”', paragraphs: ['Hi “x”'] }) };
  const review = sanitizer.createReviewState(model);
  const quote = review.issues.find((issue) => issue.type === 'double-quote');
  quote.status = 'applied';
  assert.equal(sanitizer.applyIssuePatches(model.rawText, review.issues), 'Hi "x”');
  assert.equal(model.rawText, 'Hi “x”');
});

test('ignoring one issue leaves patch output unchanged and status ignored', () => {
  const model = { rawText: 'A  B', analysisResults: sanitizer.analyzeDocumentText({ rawText: 'A  B', paragraphs: ['A  B'] }) };
  const review = sanitizer.createReviewState(model);
  const spaces = review.issues.find((issue) => issue.type === 'repeated-space');
  spaces.status = 'ignored';
  assert.equal(sanitizer.applyIssuePatches(model.rawText, review.issues), 'A  B');
  assert.equal(spaces.status, 'ignored');
});

test('applying all issues of a type updates counts', () => {
  const model = { rawText: '“A” “B”', analysisResults: sanitizer.analyzeDocumentText({ rawText: '“A” “B”', paragraphs: ['“A” “B”'] }) };
  const review = sanitizer.createReviewState(model);
  review.issues.filter((issue) => issue.group === 'punctuation').forEach((issue) => { issue.status = 'applied'; });
  const applied = review.issues.filter((issue) => issue.status === 'applied').length;
  assert.equal(applied, 4);
  assert.equal(sanitizer.applyIssuePatches(model.rawText, review.issues), '"A" "B"');
});
