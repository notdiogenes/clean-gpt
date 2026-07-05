const test = require('node:test');
const assert = require('node:assert/strict');
const sanitizer = require('../app');

test('serializes accepted issue state to formatted HTML while preserving inline formatting', () => {
  const model = {
    blocks: [{ type: 'paragraph', start: 0, end: 8, text: 'Hi “Bob”', runs: [{ type: 'text', start: 0, end: 8, text: 'Hi “Bob”', properties: { bold: true, italic: true } }] }]
  };
  const review = { issues: [
    { start: 3, end: 4, status: 'applied', replacement: '"', type: 'double-quote' },
    { start: 7, end: 8, status: 'ignored', replacement: '"', type: 'double-quote' }
  ] };
  const html = sanitizer.serializeFormattedHtml(model, review);
  assert.match(html, /font-weight:700/);
  assert.match(html, /font-style:italic/);
  assert.match(html, /Hi "Bob”/);
});

test('serializes tables lists of paragraphs and safe hyperlinks without script URLs', () => {
  const model = { blocks: [{ type: 'table', rows: [{ cells: [
    { text: 'Link', start: 0, end: 4, paragraphs: [{ type: 'paragraph', text: 'Link', start: 0, end: 4, runs: [{ type: 'text', text: 'Link', start: 0, end: 4, properties: { hyperlink: true, href: 'https://example.com' } }] }] },
    { text: 'Bad', start: 5, end: 8, paragraphs: [{ type: 'paragraph', text: 'Bad', start: 5, end: 8, runs: [{ type: 'text', text: 'Bad', start: 5, end: 8, properties: { hyperlink: true, href: 'javascript:alert(1)' } }] }] }
  ] }] }] };
  const html = sanitizer.serializeFormattedHtml(model, { issues: [] });
  assert.match(html, /<table><tbody><tr><td><p><a href="https:\/\/example.com">Link<\/a><\/p><\/td>/);
  assert.doesNotMatch(html, /javascript:/);
  assert.match(html, />Bad</);
});

test('prioritizes overlapping accepted issues deterministically', () => {
  assert.equal(sanitizer.applyAcceptedIssuesToText('A😀', 0, 3, [
    { start: 1, end: 3, status: 'applied', type: 'emoji', replacement: '' },
    { start: 1, end: 3, status: 'applied', type: 'non-ascii', replacement: '?' }
  ]), 'A');
});
