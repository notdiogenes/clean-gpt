(function () {
  "use strict";

  const CORE_TESTS = [
    { category: "Cleanup", name: "Strict ASCII replaces typography", body: "Converts curly quotes, em dashes, fractions, ellipses, and accents to ASCII-safe text.", run(api) {
      const result = api.sanitize("Café “quote” — ½ …", { strictAscii: true, normalizeFractions: true });
      equal(result.cleanText, 'Cafe "quote" -- 1/2 ...');
      equal(/[^\x00-\x7F]/.test(result.cleanText), false);
    }},
    { category: "Parsing", name: "Nested lists keep structure", body: "Parses indented plain-text bullets into nested list items.", run(api) {
      const doc = api.parsePlainTextToDoc("- parent\n  - child\n- sibling", true);
      equal(doc.blocks[0].type, "ul");
      equal(doc.blocks[0].items[0].children[0].items[0].text, "child");
      equal(doc.meta.listItems, 3);
    }},
    { category: "Output", name: "Markdown keeps nested indentation", body: "Serializes nested markdown lists without flattening child items.", run(api) {
      const doc = api.parsePlainTextToDoc("- parent\n  - child", true);
      equal(api.docToPlainText(doc, "markdown"), "- parent\n  - child");
    }},
    { category: "Clipboard", name: "Gmail HTML keeps semantic lists", body: "Builds rich Gmail HTML with nested list markup and selected font styling.", run(api) {
      const doc = api.parsePlainTextToDoc("- parent\n  - child", true);
      const html = api.buildGmailHtmlFromDoc(doc, { gmailListsAsHyphenLines: false, gmailFontFamily: "Arial, Helvetica, sans-serif", gmailFontSize: "13px" });
      match(html, /<ul style="font-family: Arial, Helvetica, sans-serif; font-size: 13px;">/);
      match(html, /parent/);
      match(html, /child/);
    }},
    { category: "Destinations", name: "Destination profiles are registered", body: "Verifies the app exposes expected destination modes and labels.", run(api) {
      equal(api.DESTINATIONS.gmail.copyLabel, "Copy HTML");
      equal(api.DESTINATIONS.markdown.copyLabel, "Copy text");
      ok(Object.keys(api.DESTINATIONS).length >= 10, "expected destination profiles to be registered");
    }},
    { category: "Parsing", name: "HTML lists parse as document lists", body: "Preserves nested list structure when rich HTML is pasted into the sanitizer.", run(api) {
      const doc = api.parseHtmlToDoc("<ul><li>parent<ul><li>child</li></ul></li></ul>");
      equal(doc.blocks[0].type, "ul");
      equal(doc.blocks[0].items[0].children[0].items[0].text, "child");
    }},
    { category: "Parsing", name: "Orphan nested HTML lists attach to parent", body: "Handles browser/editor HTML where a nested list appears as a sibling of the preceding list item.", run(api) {
      const doc = api.parseHtmlToDoc("<ul><li>parent</li><ul><li>child</li></ul><li>sibling</li></ul>");
      equal(doc.blocks[0].type, "ul");
      equal(doc.blocks[0].items[0].children[0].items[0].text, "child");
      equal(doc.blocks[0].items[1].text, "sibling");
    }},
    { category: "Clipboard", name: "Document HTML includes rich list fallback", body: "Builds ordered-list HTML for document destinations with plain-text fallback support.", run(api) {
      const doc = api.parsePlainTextToDoc("1. first\n2. second", true);
      const html = api.buildDocumentHtmlFromDoc(doc, api.buildOptions("googleDocs", null, { structuredListsForDocs: true }));
      match(html, /<ol/);
      match(html, /first/);
      match(html, /second/);
    }},
    { category: "Destinations", name: "All destination profiles produce output", body: "Runs shared stress input through every destination profile.", run(api) {
      Object.keys(api.DESTINATIONS).forEach((destination) => {
        const doc = api.parsePlainTextToDoc("- one\n1. two\nCafé — ½", true);
        const result = api.sanitizeDoc(doc, api.buildOptions(destination));
        ok(result.cleanText.length, `${destination} output`);
      });
    }},
    { category: "Cleanup", name: "All cleanup presets are callable", body: "Applies each preset and verifies output exists.", run(api) {
      Object.entries(api.PRESETS).forEach(([name, preset]) => ok(api.sanitize("Café — ½", api.buildOptions("plain", preset)).cleanText.length, name));
    }},
    { category: "Cleanup", name: "Cleanup toggles are registered", body: "Verifies expected toggle groups are present in OPTION_DEFAULTS.", run(api) {
      ["removeHidden", "normalizeQuotes", "normalizeDashes", "normalizeFullwidth", "expandLigatures", "smartQuotes", "numericRangesToEnDash", "strictAscii"].forEach((key) => ok(key in api.OPTION_DEFAULTS, key));
    }},

    { category: "Changes", name: "Rich change records classify ranges", body: "Asserts hidden characters, punctuation, spaces, emoji, and non-ASCII review changes expose rich metadata and precise occurrence ranges.", run(api) {
      const result = api.sanitize("a\u200Bb “x” — wait… a  b 😀 中", api.buildOptions("plain", null, { removeHidden: true, normalizeQuotes: true, normalizeDashes: true, normalizeEllipsis: true, collapseRepeatedSpaces: true, removeEmoji: true, strictAscii: true }));
      const byNote = (note) => result.changes.filter((change) => change.note === note);
      const hidden = byNote("Hidden or formatting character removed")[0];
      equal(hidden.category, "hidden-character");
      equal(hidden.sourceStart, 1);
      equal(hidden.sourceEnd, 2);
      const quote = byNote("Quote-like character normalized")[0];
      equal(quote.category, "quote");
      equal(quote.sourceStart, 3);
      const dash = byNote("Em-dash-like character normalized")[0];
      equal(dash.category, "dash");
      equal(dash.sourceStart, 6);
      const ellipsis = byNote("Ellipsis normalized")[0];
      equal(ellipsis.category, "ellipsis");
      const spaces = byNote("Repeated spaces collapsed")[0];
      equal(spaces.category, "spacing");
      equal(spaces.subcategory, "repeated-space");
      const emoji = byNote("Emoji or pictographic symbol removed")[0];
      equal(emoji.category, "emoji");
      const nonAscii = byNote("Remaining non-ASCII removed")[0];
      equal(nonAscii.category, "strict-ascii");
      equal(nonAscii.severity, "warning");
      [hidden, quote, dash, ellipsis, spaces, emoji, nonAscii].forEach((change) => ["category", "subcategory", "severity", "sourceStart", "sourceEnd", "outputStart", "outputEnd", "before", "after", "action", "characterName", "codePoint", "message", "suggestion"].forEach((field) => ok(field in change, field)));
    }},
    { category: "Changes", name: "Change records are occurrence-specific", body: "Repeated hidden-character removals produce separate records for inspector highlighting.", run(api) {
      const result = api.sanitize("a\u200Bb\u200Bc", api.buildOptions("plain", { removeHidden: true }));
      const hiddenChanges = result.changes.filter((change) => change.note === "Hidden or formatting character removed");
      equal(hiddenChanges.length, 2);
      equal(hiddenChanges[0].occurrenceIndex, 0);
      equal(hiddenChanges[1].occurrenceIndex, 1);
    }}
  ];

  const EXAMPLE_TESTS = [
    { name: "Hidden characters", destination: "plain", input: "Zero\u200Bwidth\u200E mark", expected: "Zerowidth mark", options: { removeHidden: true } },
    { name: "Smart punctuation", destination: "plain", input: "“Hello” — wait…", expected: '"Hello" -- wait...', options: { normalizeQuotes: true, normalizeDashes: true, normalizeEllipsis: true } },
    { name: "Strict ASCII", destination: "strictAscii", input: "Café ™ 😀", expected: "Cafe TM ", options: {} },
    { name: "Markdown list", destination: "markdown", input: "- One\n  - Two", expected: "- One\n  - Two", options: {} }
  ];

  function equal(actual, expected) { if (!Object.is(actual, expected)) throw new Error(`Expected ${JSON.stringify(expected)}, received ${JSON.stringify(actual)}`); }
  function ok(value, message) { if (!value) throw new Error(message || "Expected value to be truthy"); }
  function match(value, regex) { if (!regex.test(String(value))) throw new Error(`Expected ${JSON.stringify(value)} to match ${regex}`); }
  function escapeHtml(value) { return String(value).replace(/[&<>"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[char])); }

  function getApi() { return window.TextSanitizer; }

  function getDiagnostics(api) {
    return [
      ["Sanitizer API", api ? "available" : "missing"],
      ["User agent", navigator.userAgent],
      ["Clipboard API", navigator.clipboard ? "available" : "unavailable"],
      ["ClipboardItem", window.ClipboardItem ? "available" : "unavailable"],
      ["Secure context", window.isSecureContext ? "yes" : "no"],
      ["Destination profiles", api ? Object.keys(api.DESTINATIONS || {}).join(", ") : "unavailable"],
      ["Default options", api ? Object.keys(api.OPTION_DEFAULTS || {}).length.toString() : "unavailable"]
    ];
  }

  function renderDiagnostics(api) {
    const list = document.querySelector("#debugDiagnostics");
    list.innerHTML = "";
    getDiagnostics(api).forEach(([label, value]) => {
      const item = document.createElement("li");
      item.innerHTML = `<span>${escapeHtml(label)}:</span><strong>${escapeHtml(value)}</strong>`;
      list.append(item);
    });
  }

  function runTests(tests, api) {
    if (!api) return [{ name: "TextSanitizer API is available", category: "Startup", body: "window.TextSanitizer should be exported by app.js.", status: "fail", error: new Error("window.TextSanitizer was not found") }];
    return tests.map((test) => {
      try { test.run(api); return Object.assign({}, test, { status: "pass" }); }
      catch (error) { return Object.assign({}, test, { status: "fail", error }); }
    });
  }

  function renderResults(results) {
    const list = document.querySelector("#testResults");
    const summary = document.querySelector("#testSummary");
    list.innerHTML = "";
    const passed = results.filter((result) => result.status === "pass").length;
    summary.textContent = `${passed}/${results.length} tests passing`;
    summary.className = `test-summary ${passed === results.length ? "pass" : "fail"}`;
    results.forEach((result) => {
      const item = document.createElement("li");
      item.className = `test-result ${result.status}`;
      const detail = result.error ? escapeHtml(result.error.stack || result.error.message) : escapeHtml(result.body || "Passed.");
      item.innerHTML = `<div class="test-result-row"><span class="test-badge">${result.status === "pass" ? "PASS" : "FAIL"}</span><strong>${escapeHtml(result.name)}</strong><span>${escapeHtml(result.category || "General")}</span></div><pre>${detail}</pre>`;
      list.append(item);
    });
  }

  function runExampleTests() {
    const api = getApi();
    const list = document.querySelector("#userTestResults");
    const animation = document.querySelector("#userTestAnimation");
    list.innerHTML = "";
    animation.classList.add("is-running");
    const results = EXAMPLE_TESTS.map((example) => {
      if (!api) return Object.assign({}, example, { actual: "API unavailable", passed: false });
      const options = api.buildOptions(example.destination, example.options || {});
      const actual = api.sanitize(example.input, options).cleanText;
      return Object.assign({}, example, { actual, passed: actual === example.expected });
    });
    results.forEach((result) => {
      const item = document.createElement("li");
      item.className = `user-test-result ${result.passed ? "pass" : "fail"}`;
      item.innerHTML = `<div class="test-result-row"><span class="test-badge">${result.passed ? "PASS" : "FAIL"}</span><strong>${escapeHtml(result.name)}</strong><span>${escapeHtml(result.destination)}</span></div><dl><dt>Input</dt><dd><code>${escapeHtml(result.input)}</code></dd><dt>Expected</dt><dd><code>${escapeHtml(result.expected)}</code></dd><dt>Actual</dt><dd><code>${escapeHtml(result.actual)}</code></dd></dl>`;
      list.append(item);
    });
    window.setTimeout(() => animation.classList.remove("is-running"), 450);
  }

  function runAllTests() {
    const api = getApi();
    renderDiagnostics(api);
    renderResults(runTests(CORE_TESTS, api));
  }

  document.addEventListener("DOMContentLoaded", () => {
    document.querySelector("#runTestsButton").addEventListener("click", runAllTests);
    document.querySelector("#runUserTestsButton").addEventListener("click", runExampleTests);
    runAllTests();
    runExampleTests();
  });
})();
