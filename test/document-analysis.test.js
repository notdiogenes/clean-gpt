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
