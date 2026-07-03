const TextSanitizer = require("./app.js");

const tests = [
  {
    name: "curly quotes and apostrophe",
    input: "\u201cDon\u2019t send this yet,\u201d she said.",
    expected: "\"Don't send this yet,\" she said."
  },
  {
    name: "em dash becomes spaced double hyphen",
    input: "text\u2014text",
    expected: "text -- text"
  },
  {
    name: "spaced em dash normalizes to one spaced double hyphen",
    input: "text \u2014 text",
    expected: "text -- text"
  },
  {
    name: "en dash becomes single hyphen",
    input: "Monday\u2013Friday",
    expected: "Monday-Friday"
  },
  {
    name: "ellipsis becomes three periods",
    input: "Wait\u2026 maybe.",
    expected: "Wait... maybe."
  },
  {
    name: "non-breaking space becomes regular space",
    input: "Hello\u00a0there",
    expected: "Hello there"
  },
  {
    name: "zero-width space removed",
    input: "re\u200bview",
    expected: "review"
  },
  {
    name: "directional marks removed",
    input: "a\u200eb\u200fc",
    expected: "abc"
  },
  {
    name: "soft hyphen removed",
    input: "hy\u00adphen",
    expected: "hyphen"
  },
  {
    name: "line-start bullets converted",
    input: "\u2022 First\n\u2022 Second",
    expected: "- First\n- Second"
  },
  {
    name: "trailing spaces removed",
    input: "Line one.    \nLine two.",
    expected: "Line one.\nLine two."
  },
  {
    name: "extra blank lines reduced",
    input: "One\n\n\nTwo\n\n\n\nThree",
    expected: "One\n\nTwo\n\nThree"
  },
  {
    name: "mixed line endings normalized",
    input: "One\r\nTwo\rThree\nFour",
    expected: "One\nTwo\nThree\nFour"
  },
  {
    name: "combined Gmail Safe preset",
    input: "\u201cLet\u2019s review this\u2014carefully\u2026\u201d\n\u2022 First point\n\u2022 Second point",
    expected: "\"Let's review this -- carefully...\"\n- First point\n- Second point"
  }
];

let passed = 0;
for (const test of tests) {
  const result = TextSanitizer.sanitize(test.input, TextSanitizer.getPresetOptions("gmailSafe"));
  const ok = result.cleanText === test.expected;
  if (ok) {
    passed += 1;
    console.log(`PASS: ${test.name}`);
  } else {
    console.error(`FAIL: ${test.name}`);
    console.error(`  Expected: ${JSON.stringify(test.expected)}`);
    console.error(`  Actual:   ${JSON.stringify(result.cleanText)}`);
  }
}

if (passed !== tests.length) {
  process.exitCode = 1;
}
console.log(`${passed}/${tests.length} tests passed.`);
