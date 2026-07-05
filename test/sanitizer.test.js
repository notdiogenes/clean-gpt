const test = require('node:test');
const assert = require('node:assert/strict');
const sanitizer = require('../app.js');

test('strict ASCII replaces typographic characters', () => {
  const result = sanitizer.sanitize('Café “quote” — ½ …', { strictAscii: true, normalizeFractions: true });
  assert.equal(result.cleanText, 'Cafe "quote" -- 1/2 ...');
  assert.equal(/[^\x00-\x7F]/.test(result.cleanText), false);
});

test('plain text parser detects nested list indentation', () => {
  const doc = sanitizer.parsePlainTextToDoc('- parent\n  - child\n- sibling', true);
  assert.equal(doc.blocks[0].type, 'ul');
  assert.equal(doc.blocks[0].items[0].text, 'parent');
  assert.equal(doc.blocks[0].items[0].children[0].items[0].text, 'child');
  assert.equal(doc.meta.lists, 2);
  assert.equal(doc.meta.listItems, 3);
});

test('markdown profile serializes nested lists with indentation', () => {
  const doc = sanitizer.parsePlainTextToDoc('- parent\n  - child', true);
  assert.equal(sanitizer.docToPlainText(doc, 'markdown'), '- parent\n  - child');
});

test('Gmail HTML preserves nested semantic lists', () => {
  const doc = sanitizer.parsePlainTextToDoc('- parent\n  - child', true);
  const html = sanitizer.buildGmailHtmlFromDoc(doc, {
    gmailListsAsHyphenLines: false,
    gmailFontFamily: 'Arial, Helvetica, sans-serif',
    gmailFontSize: '13px'
  });
  assert.match(html, /<ul style="font-family: Arial, Helvetica, sans-serif; font-size: 13px;">/);
  assert.match(html, /parent/);
  assert.match(html, /child/);
});

const stressInput = `Here's a "sample" -- with curly quotes, dashes -- and ellipsis... and numbers: 1-5 and 6-8.

Tab	separated   values. Fractions like 1/2 and 3/4. Feet/inches: 5'10".

bullet list:

- First item

- Second item

1. Ordered item

2. Another`;

test('every destination profile sanitizes shared stress input', () => {
  for (const destination of Object.keys(sanitizer.DESTINATIONS)) {
    const result = sanitizer.sanitizeDoc(sanitizer.parsePlainTextToDoc(stressInput, true), sanitizer.buildOptions(destination));
    assert.ok(result.cleanText.length > 0, `${destination} produced output`);
    assert.doesNotThrow(() => sanitizer.docToPlainText(result.doc, destination));
  }
});

test('every cleanup preset can be applied with destination overrides', () => {
  for (const [presetName, preset] of Object.entries(sanitizer.PRESETS)) {
    const result = sanitizer.sanitize(stressInput, sanitizer.buildOptions('plain', preset));
    assert.ok(result.cleanText.length > 0, `${presetName} produced output`);
  }
});

test('major cleanup toggles are individually covered', () => {
  const cases = {
    removeHidden: ['a\\u200Bb', 'ab'],
    normalizeSpaces: ['a\\u00A0b', 'a b'],
    convertTabs: ['a\tb', 'a  b'],
    normalizeQuotes: ['“x”', '"x"'],
    normalizeDashes: ['a—b', 'a -- b'],
    normalizeEllipsis: ['wait…', 'wait...'],
    normalizeFullwidth: ['ＡＢＣ', 'ABC'],
    expandLigatures: ['ﬁle', 'file'],
    normalizeFractions: ['½', '1/2'],
    normalizeSuperscriptsSubscripts: ['x²', 'x2'],
    removeEmoji: ['ok😀', 'ok'],
    strictAscii: ['Café →', 'Cafe ->']
  };
  for (const [option, [rawInput, expected]] of Object.entries(cases)) {
    const input = rawInput.replace('\\u200B', '\u200B').replace('\\u00A0', '\u00A0');
    const options = sanitizer.buildOptions('plain', {}, Object.fromEntries(Object.keys(sanitizer.OPTION_DEFAULTS).map((key) => [key, false])));
    options[option] = true;
    if (option === 'strictAscii') { options.foldAccents = true; options.replaceSymbolsAscii = true; }
    const result = sanitizer.sanitize(input, options);
    assert.equal(result.cleanText, expected, option);
  }
});

test('clipboard HTML and plain-text intake paths preserve mixed lists', () => {
  if (typeof DOMParser !== 'undefined') {
    const htmlDoc = sanitizer.parseHtmlToDoc('<ul><li>one<ol><li>nested</li></ol></li></ul><ol><li>two</li></ol>');
    assert.equal(htmlDoc.meta.listItems, 3);
  }
  const plainDoc = sanitizer.parsePlainTextToDoc('- one\n  1. nested\n1. two', true);
  assert.equal(plainDoc.meta.listItems, 3);
});

test('strict ASCII covers accented text, symbols, emoji, non-Latin scripts, and math', () => {
  const result = sanitizer.sanitize('Café ™ 😀 中文 ± × ÷ ½ ²', sanitizer.buildOptions('strictAscii'));
  assert.equal(/[^\x00-\x7F]/.test(result.cleanText), false);
  assert.match(result.cleanText, /Cafe/);
  assert.match(result.cleanText, /TM/);
});

test('change records stay occurrence-specific for inspector highlights', () => {
  const result = sanitizer.sanitize('a\u200Bb\u200Cc', sanitizer.buildOptions('plain', { removeHidden: true }));
  const hiddenChanges = result.changes.filter((change) => change.note === 'Hidden or formatting character removed');
  assert.equal(result.cleanText, 'abc');
  assert.equal(hiddenChanges.length, 2);
  assert.deepEqual(hiddenChanges.map((change) => change.count), [1, 1]);
});
