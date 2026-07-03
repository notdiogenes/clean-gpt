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
    name: "quote-like double marks become keyboard double quotes",
    input: "\u201c\u201d\u2033\uff02\u275d\u275e\u301d\u301e\u301f",
    expected: "\"\"\"\"\"\"\"\"\""
  },
  {
    name: "quote-like single marks become keyboard apostrophes",
    input: "\u2018\u2019\u2032\u02bc\uff07\u275b\u275c",
    expected: "'''''''"
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
  },
  {
    name: "Gmail copy mode converts LF paragraphs to CRLF paragraphs",
    input: "One\n\nTwo",
    expected: "One\r\n\r\nTwo",
    transform: "gmailLineEndings"
  },
  {
    name: "Gmail copy mode normalizes mixed line endings before CRLF output",
    input: "One\r\nTwo\rThree\nFour",
    expected: "One\r\nTwo\r\nThree\r\nFour",
    transform: "gmailLineEndings"
  },
  {
    name: "HTML escaping for Gmail output",
    input: "5 > 3 & \"quoted\" <tag>",
    expected: "5 &gt; 3 &amp; &quot;quoted&quot; &lt;tag&gt;",
    transform: "escapeHtml"
  },
  {
    name: "Gmail HTML creates Verdana paragraph blocks",
    input: "One\n\nTwo",
    expected: "<div style=\"font-family: Verdana, sans-serif; font-size: 10pt; font-weight: normal; font-style: normal; color: #000000; line-height: normal;\">One</div><div style=\"font-family: Verdana, sans-serif; font-size: 10pt; font-weight: normal; font-style: normal; color: #000000; line-height: normal;\"><br></div><div style=\"font-family: Verdana, sans-serif; font-size: 10pt; font-weight: normal; font-style: normal; color: #000000; line-height: normal;\">Two</div>",
    transform: "gmailHtml"
  }
];

let passed = 0;
for (const test of tests) {
  const sanitized = TextSanitizer.sanitize(test.input, TextSanitizer.getPresetOptions("gmailSafe"));
  let actual;
  if (test.transform === "gmailLineEndings") {
    actual = TextSanitizer.toWindowsClipboardLineEndings(sanitized.cleanText);
  } else if (test.transform === "escapeHtml") {
    actual = TextSanitizer.escapeHtml(test.input);
  } else if (test.transform === "gmailHtml") {
    actual = TextSanitizer.textToGmailHtml(sanitized.cleanText);
  } else {
    actual = sanitized.cleanText;
  }
  const ok = actual === test.expected;
  if (ok) {
    passed += 1;
    console.log(`PASS: ${test.name}`);
  } else {
    console.error(`FAIL: ${test.name}`);
    console.error(`  Expected: ${JSON.stringify(test.expected)}`);
    console.error(`  Actual:   ${JSON.stringify(actual)}`);
  }
}

if (passed !== tests.length) {
  process.exitCode = 1;
}
console.log(`${passed}/${tests.length} tests passed.`);
