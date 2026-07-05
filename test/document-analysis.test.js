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
  assert.deepEqual(blocks[0].range, { start: 0, end: 17 });
  assert.equal(blocks[1].start, 'Hello\tWorld\nAgain\n'.length);

  const [boldRun, tabRun, strikeRun, breakRun, finalRun] = blocks[0].runs;
  assert.deepEqual({ text: boldRun.text, start: boldRun.start, end: boldRun.end, range: boldRun.range, rangeInBlock: boldRun.rangeInBlock }, { text: 'Hello', start: 0, end: 5, range: { start: 0, end: 5 }, rangeInBlock: { start: 0, end: 5 } });
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

test('maps analyzed issues to document block and run locations', () => {
  const model = {
    rawText: 'Clean paragraph\nSecond “quote”  has\u200B hidden'.replace('\\u200B', '\u200B'),
    paragraphs: ['Clean paragraph', 'Second “quote”  has\u200B hidden'.replace('\\u200B', '\u200B')],
    blocks: [
      {
        id: 'p-1',
        type: 'paragraph',
        text: 'Clean paragraph',
        start: 0,
        end: 15,
        runs: [{ id: 'p-1-r-1', text: 'Clean paragraph', start: 0, end: 15 }]
      },
      {
        id: 'p-2',
        type: 'paragraph',
        text: 'Second “quote”  has\u200B hidden'.replace('\\u200B', '\u200B'),
        start: 16,
        end: 44,
        runs: [
          { id: 'p-2-r-1', text: 'Second ', start: 16, end: 23 },
          { id: 'p-2-r-2', text: '“quote”', start: 23, end: 30 },
          { id: 'p-2-r-3', text: '  has\u200B hidden'.replace('\\u200B', '\u200B'), start: 30, end: 44 }
        ]
      }
    ]
  };

  const report = sanitizer.analyzeDocumentText(model);
  const quote = report.issues.find((issue) => issue.type === 'double-quote' && issue.text === '“');
  const space = report.issues.find((issue) => issue.type === 'repeated-space');
  const hidden = report.issues.find((issue) => issue.type === 'hidden');

  assert.deepEqual(
    { blockId: quote.blockId, blockIndex: quote.blockIndex, runId: quote.runId, runIndex: quote.runIndex, rangeInBlock: quote.rangeInBlock, paragraphIndex: quote.paragraphIndex },
    { blockId: 'p-2', blockIndex: 1, runId: 'p-2-r-2', runIndex: 1, rangeInBlock: { start: 7, end: 8 }, paragraphIndex: 2 }
  );
  assert.deepEqual(
    { blockId: space.blockId, blockIndex: space.blockIndex, runId: space.runId, runIndex: space.runIndex, rangeInBlock: space.rangeInBlock, paragraphIndex: space.paragraphIndex },
    { blockId: 'p-2', blockIndex: 1, runId: 'p-2-r-3', runIndex: 2, rangeInBlock: { start: 14, end: 16 }, paragraphIndex: 2 }
  );
  assert.deepEqual(
    { blockId: hidden.blockId, blockIndex: hidden.blockIndex, runId: hidden.runId, runIndex: hidden.runIndex, rangeInBlock: hidden.rangeInBlock, paragraphIndex: hidden.paragraphIndex },
    { blockId: 'p-2', blockIndex: 1, runId: 'p-2-r-3', runIndex: 2, rangeInBlock: { start: 19, end: 20 }, paragraphIndex: 2 }
  );
});

test('plain-text analysis falls back to offset-based paragraph locations', () => {
  const report = sanitizer.analyzeDocumentText({ rawText: 'First\nSecond “quote”', paragraphs: ['First', 'Second “quote”'] });
  const quote = report.issues.find((issue) => issue.type === 'double-quote' && issue.text === '“');
  assert.equal(quote.paragraphIndex, 2);
  assert.equal(quote.start, 13);
  assert.equal(quote.end, 14);
  assert.equal(quote.blockId, undefined);
  assert.equal(quote.rangeInBlock, undefined);
});

test('DOCX model uses canonical offsets when a table appears before a paragraph', () => {
  const xml = '<w:document><w:body><w:tbl><w:tr><w:tc><w:p><w:r><w:t>Cell “one”</w:t></w:r></w:p></w:tc></w:tr></w:tbl><w:p><w:r><w:t>After — table</w:t></w:r></w:p></w:body></w:document>';
  const blocks = sanitizer.extractDocumentBlocksFromDocumentXml(xml, null);
  const rawText = blocks.map((block) => block.text).join('\n');
  assert.equal(rawText, 'Cell “one”\nAfter — table');
  assert.deepEqual({ type: blocks[0].type, start: blocks[0].start, end: blocks[0].end }, { type: 'table', start: 0, end: 10 });
  assert.deepEqual({ type: blocks[1].type, start: blocks[1].start, end: blocks[1].end }, { type: 'paragraph', start: 11, end: 24 });
  const report = sanitizer.analyzeDocumentText({ rawText, paragraphs: ['After — table'], blocks });
  const dash = report.issues.find((issue) => issue.type === 'em-dash');
  assert.equal(dash.start, rawText.indexOf(' — '));
  assert.equal(dash.blockId, 'p-1');
  assert.equal(dash.rangeInBlock.start, 'After'.length);
});

test('DOCX model uses canonical offsets when a table appears between paragraphs', () => {
  const xml = '<w:document><w:body><w:p><w:r><w:t>Before</w:t></w:r></w:p><w:tbl><w:tr><w:tc><w:p><w:r><w:t>Cell café</w:t></w:r></w:p></w:tc></w:tr></w:tbl><w:p><w:r><w:t>After</w:t></w:r></w:p></w:body></w:document>';
  const blocks = sanitizer.extractDocumentBlocksFromDocumentXml(xml, null);
  const rawText = blocks.map((block) => block.text).join('\n');
  assert.equal(rawText, 'Before\nCell café\nAfter');
  assert.deepEqual(blocks.map((block) => [block.type, block.start, block.end]), [['paragraph', 0, 6], ['table', 7, 16], ['paragraph', 17, 22]]);
  const report = sanitizer.analyzeDocumentText({ rawText, paragraphs: ['Before', 'After'], blocks });
  const accent = report.issues.find((issue) => issue.type === 'non-ascii' && issue.text === 'é');
  assert.equal(accent.blockId, 'tbl-1');
  assert.equal(accent.cellId, 'tbl-1-r-1-c-1');
  assert.deepEqual(accent.rangeInCell, { start: 8, end: 9 });
});

test('analysis maps issue inside a table cell to table row cell paragraph and run', () => {
  const xml = '<w:document><w:body><w:tbl><w:tr><w:tc><w:p><w:r><w:t>A</w:t></w:r><w:r><w:t> “cell”</w:t></w:r></w:p></w:tc></w:tr></w:tbl></w:body></w:document>';
  const blocks = sanitizer.extractDocumentBlocksFromDocumentXml(xml, null);
  const rawText = blocks.map((block) => block.text).join('\n');
  const report = sanitizer.analyzeDocumentText({ rawText, paragraphs: [], blocks });
  const quote = report.issues.find((issue) => issue.type === 'double-quote' && issue.text === '“');
  assert.equal(quote.blockId, 'tbl-1');
  assert.equal(quote.rowId, 'tbl-1-r-1');
  assert.equal(quote.cellId, 'tbl-1-r-1-c-1');
  assert.equal(quote.paragraphId, 'tbl-1-r-1-c-1-p-1');
  assert.equal(quote.runIndex, 1);
  assert.deepEqual(quote.rangeInCell, { start: 2, end: 3 });
});

test('overlapping issue ranges are grouped and prioritized deterministically', () => {
  const report = sanitizer.analyzeDocumentText({ rawText: '“😀”', paragraphs: ['“😀”'] });
  const groups = sanitizer.groupOverlappingIssues(report.issues);
  const emojiGroup = groups.find((group) => group.issues.some((issue) => issue.type === 'emoji'));
  assert.ok(emojiGroup.issues.some((issue) => issue.type === 'non-ascii'));
  assert.equal(emojiGroup.primary.type, 'emoji');
  const quoteGroup = groups.find((group) => group.issues.some((issue) => issue.type === 'double-quote' && issue.text === '“'));
  assert.equal(quoteGroup.primary.type, 'double-quote');
});


test('DOCX parser extracts headings lists hyperlinks tables comments and revisions metadata', () => {
  const styles = sanitizer.extractStyleMapFromStylesXml(`
    <w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
      <w:style w:type="paragraph" w:styleId="Heading2"><w:name w:val="heading 2"/></w:style>
    </w:styles>
  `);
  const relationships = sanitizer.parseDocxRelationships(`
    <Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
      <Relationship Id="rId5" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink" Target="https://example.com"/>
    </Relationships>
  `);
  const xml = `
    <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><w:body>
      <w:p><w:pPr><w:pStyle w:val="Heading2"/></w:pPr><w:r><w:t>Section</w:t></w:r></w:p>
      <w:p><w:pPr><w:numPr><w:ilvl w:val="1"/><w:numId w:val="7"/></w:numPr></w:pPr><w:r><w:t>List item</w:t></w:r></w:p>
      <w:p><w:hyperlink r:id="rId5"><w:r><w:t>Example link</w:t></w:r></w:hyperlink></w:p>
      <w:p><w:ins w:author="Ada" w:date="2026-01-02T00:00:00Z"><w:r><w:t>Inserted</w:t></w:r></w:ins></w:p>
      <w:tbl><w:tr><w:tc><w:p><w:r><w:t>Cell</w:t></w:r></w:p></w:tc></w:tr></w:tbl>
    </w:body></w:document>
  `;

  const blocks = sanitizer.extractDocumentBlocksFromDocumentXml(xml, styles, { relationships });
  assert.deepEqual(blocks.map((block) => block.text), ['Section', 'List item', 'Example link', 'Inserted', 'Cell']);
  assert.equal(blocks[0].styleName, 'heading 2');
  assert.deepEqual(blocks[1].list, { level: '1', numId: '7' });
  assert.equal(blocks[2].runs[0].properties.hyperlink, true);
  assert.equal(blocks[2].runs[0].properties.href, 'https://example.com');
  assert.equal(blocks[3].runs[0].properties.revision, 'ins');
  assert.equal(blocks[3].runs[0].properties.author, 'Ada');
  assert.equal(blocks[4].type, 'table');
});

test('DOCX parser reports deferred constructs as warnings', () => {
  const warnings = sanitizer.buildDocxWarnings({
    documentXml: '<w:document><w:body><w:p><w:del w:author="Ada"><w:r><w:t>Removed</w:t></w:r></w:del></w:p></w:body></w:document>',
    paths: new Set(['word/comments.xml', 'word/header1.xml', 'word/footer1.xml', 'word/footnotes.xml'])
  });
  assert.deepEqual(warnings.map((warning) => warning.type), ['tracked-revisions', 'comments', 'headers', 'footers', 'footnotes']);
});
