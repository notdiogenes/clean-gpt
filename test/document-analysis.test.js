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

test('extracts formatted DOCX runs into document blocks while preserving plain text', () => {
  const styles = sanitizer.extractStyleMapFromStylesXml(`
    <w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
      <w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/></w:style>
      <w:style w:type="character" w:styleId="Emphasis"><w:name w:val="Emphasis"/></w:style>
    </w:styles>
  `);
  const xml = `
    <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>
      <w:p>
        <w:pPr><w:pStyle w:val="Heading1"/></w:pPr>
        <w:r><w:rPr><w:b/><w:i/><w:u w:val="single"/><w:color w:val="FF0000"/><w:highlight w:val="yellow"/><w:rStyle w:val="Emphasis"/></w:rPr><w:t>Hello</w:t></w:r>
        <w:r><w:tab/></w:r>
        <w:r><w:rPr><w:strike/><w:vertAlign w:val="superscript"/></w:rPr><w:t>World</w:t><w:br/><w:t>Again</w:t></w:r>
      </w:p>
      <w:p><w:r><w:t>Plain</w:t></w:r></w:p>
    </w:body></w:document>
  `;

  assert.deepEqual(sanitizer.extractParagraphsFromDocumentXml(xml), ['Hello\tWorld\nAgain', 'Plain']);
  const blocks = sanitizer.extractDocumentBlocksFromDocumentXml(xml, styles);

  assert.equal(blocks.length, 2);
  assert.equal(blocks[0].id, 'p-1');
  assert.equal(blocks[0].text, 'Hello\tWorld\nAgain');
  assert.equal(blocks[0].styleId, 'Heading1');
  assert.equal(blocks[0].styleName, 'heading 1');
  assert.equal(blocks[1].start, 'Hello\tWorld\nAgain\n'.length);

  const [boldRun, tabRun, strikeRun, breakRun, finalRun] = blocks[0].runs;
  assert.deepEqual({ text: boldRun.text, start: boldRun.start, end: boldRun.end }, { text: 'Hello', start: 0, end: 5 });
  assert.equal(boldRun.properties.bold, true);
  assert.equal(boldRun.properties.italic, true);
  assert.equal(boldRun.properties.underline, true);
  assert.equal(boldRun.properties.color, 'FF0000');
  assert.equal(boldRun.properties.highlight, 'yellow');
  assert.equal(boldRun.properties.styleId, 'Emphasis');
  assert.equal(boldRun.properties.styleName, 'Emphasis');
  assert.deepEqual({ type: tabRun.type, text: tabRun.text, start: tabRun.start, end: tabRun.end }, { type: 'tab', text: '\t', start: 5, end: 6 });
  assert.equal(strikeRun.properties.strike, true);
  assert.equal(strikeRun.properties.superscript, true);
  assert.deepEqual({ type: breakRun.type, text: breakRun.text }, { type: 'lineBreak', text: '\n' });
  assert.deepEqual({ text: finalRun.text, start: finalRun.start, end: finalRun.end }, { text: 'Again', start: 12, end: 17 });
});
