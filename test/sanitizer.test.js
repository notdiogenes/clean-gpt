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
  const html = sanitizer.buildGmailHtmlFromDoc(doc, { gmailListsAsHyphenLines: false });
  assert.match(html, /<ul style="font-family: arial, sans-serif; font-size: 13px;">/);
  assert.match(html, /parent/);
  assert.match(html, /child/);
});


test('Gmail HTML uses configured font and size', () => {
  const doc = sanitizer.parsePlainTextToDoc('Styled paragraph', true);
  const html = sanitizer.buildGmailHtmlFromDoc(doc, {
    gmailFontFamily: 'verdana',
    gmailFontSize: 'large'
  });
  assert.match(html, /font-family: Verdana, sans-serif; font-size: 18px;/);
});
