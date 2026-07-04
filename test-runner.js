(function () {
  "use strict";

  const tests = [
    {
      name: "Strict ASCII replaces typographic characters",
      run(api) {
        const result = api.sanitize("Café “quote” — ½ …", { strictAscii: true, normalizeFractions: true });
        equal(result.cleanText, 'Cafe "quote" -- 1/2 ...');
        equal(/[^\x00-\x7F]/.test(result.cleanText), false);
      }
    },
    {
      name: "Plain text parser detects nested list indentation",
      run(api) {
        const doc = api.parsePlainTextToDoc("- parent\n  - child\n- sibling", true);
        equal(doc.blocks[0].type, "ul");
        equal(doc.blocks[0].items[0].text, "parent");
        equal(doc.blocks[0].items[0].children[0].items[0].text, "child");
        equal(doc.meta.lists, 2);
        equal(doc.meta.listItems, 3);
      }
    },
    {
      name: "Markdown profile serializes nested lists with indentation",
      run(api) {
        const doc = api.parsePlainTextToDoc("- parent\n  - child", true);
        equal(api.docToPlainText(doc, "markdown"), "- parent\n  - child");
      }
    },
    {
      name: "Gmail HTML preserves nested semantic lists",
      run(api) {
        const doc = api.parsePlainTextToDoc("- parent\n  - child", true);
        const html = api.buildGmailHtmlFromDoc(doc, {
          gmailListsAsHyphenLines: false,
          gmailFontFamily: "Arial, Helvetica, sans-serif",
          gmailFontSize: "13px"
        });
        match(html, /<ul style="font-family: Arial, Helvetica, sans-serif; font-size: 13px;">/);
        match(html, /parent/);
        match(html, /child/);
      }
    },
    {
      name: "Destination profiles expose expected copy labels",
      run(api) {
        equal(api.DESTINATIONS.gmail.copyLabel, "Copy output");
        equal(api.DESTINATIONS.markdown.copyLabel, "Copy Markdown");
        ok(Object.keys(api.DESTINATIONS).length >= 10, "expected destination profiles to be registered");
      }
    },
    {
      name: "HTML parser preserves list structure",
      run(api) {
        const doc = api.parseHtmlToDoc("<ul><li>parent<ul><li>child</li></ul></li></ul>");
        equal(doc.blocks[0].type, "ul");
        equal(doc.blocks[0].items[0].children[0].items[0].text, "child");
      }
    },
    {
      name: "Document HTML includes rich clipboard fallback structure",
      run(api) {
        const doc = api.parsePlainTextToDoc("1. first\n2. second", true);
        const html = api.buildDocumentHtmlFromDoc(doc, api.buildOptions({ structuredListsForDocs: true }));
        match(html, /<ol/);
        match(html, /first/);
        match(html, /second/);
      }
    }
  ];

  function equal(actual, expected) {
    if (!Object.is(actual, expected)) {
      throw new Error(`Expected ${JSON.stringify(expected)}, received ${JSON.stringify(actual)}`);
    }
  }

  function ok(value, message) {
    if (!value) throw new Error(message || "Expected value to be truthy");
  }

  function match(value, regex) {
    if (!regex.test(String(value))) {
      throw new Error(`Expected ${JSON.stringify(value)} to match ${regex}`);
    }
  }

  function getDiagnostics(api) {
    return [
      ["User agent", navigator.userAgent],
      ["Clipboard API", navigator.clipboard ? "available" : "unavailable"],
      ["ClipboardItem", window.ClipboardItem ? "available" : "unavailable"],
      ["Secure context", window.isSecureContext ? "yes" : "no"],
      ["Destination profiles", Object.keys(api.DESTINATIONS || {}).join(", ")],
      ["Default options", Object.keys(api.OPTION_DEFAULTS || {}).length.toString()]
    ];
  }

  function renderDiagnostics(api) {
    const list = document.querySelector("#debugDiagnostics");
    list.innerHTML = "";
    getDiagnostics(api).forEach(([label, value]) => {
      const item = document.createElement("li");
      item.innerHTML = `<strong>${label}:</strong> <span></span>`;
      item.querySelector("span").textContent = value;
      list.append(item);
    });
  }

  function renderResults(results) {
    const list = document.querySelector("#testResults");
    const summary = document.querySelector("#testSummary");
    list.innerHTML = "";
    const passed = results.filter((result) => result.status === "pass").length;
    const categories = results.reduce((acc, result) => { acc[result.category || "General"] = (acc[result.category || "General"] || 0) + 1; return acc; }, {});
    summary.textContent = `${passed}/${results.length} tests passing · Destination coverage: ${categories.Destinations || 0} · Cleanup-toggle coverage: ${categories.Cleanup || 0} · Clipboard-format coverage: ${categories.Clipboard || 0}`;
    summary.className = passed === results.length ? "test-summary pass" : "test-summary fail";

    results.forEach((result) => {
      const item = document.createElement("li");
      item.className = `test-result ${result.status}`;
      const body = result.body || String(result.run).replace(/\s+/g, " ").slice(0, 220);
      const detail = result.error ? `<pre>${escapeHtml(result.error.stack || result.error.message)}</pre>` : `<pre>${escapeHtml(body)}</pre>`;
      item.innerHTML = `<span class="test-badge">${result.status === "pass" ? "PASS" : "FAIL"}</span><span>${escapeHtml(result.category || "General")}: ${escapeHtml(result.name)}</span>${detail}`;
      list.append(item);
    });
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[char]));
  }

  function addCoverageTests(api) {
    if (tests.some((test) => test.name === "all destination profiles produce output")) return;
    tests.push({ category: "Destinations", name: "all destination profiles produce output", body: "Runs shared stress input through every destination profile.", run(api) {
      Object.keys(api.DESTINATIONS).forEach((destination) => {
        const doc = api.parsePlainTextToDoc("- one\n1. two\nCafé — ½", true);
        const result = api.sanitizeDoc(doc, api.buildOptions(destination));
        ok(result.cleanText.length, `${destination} output`);
      });
    }});
    tests.push({ category: "Cleanup", name: "all cleanup presets are callable", body: "Applies each preset and verifies output exists.", run(api) {
      Object.entries(api.PRESETS).forEach(([name, preset]) => ok(api.sanitize("Café — ½", api.buildOptions("plain", preset)).cleanText.length, name));
    }});
    tests.push({ category: "Cleanup", name: "source, punctuation, compatibility, typography toggles are registered", body: "Verifies expected toggle groups are present in OPTION_DEFAULTS.", run(api) {
      ["removeHidden","normalizeQuotes","normalizeDashes","normalizeFullwidth","expandLigatures","smartQuotes","numericRangesToEnDash","strictAscii"].forEach((key) => ok(key in api.OPTION_DEFAULTS, key));
    }});
    tests.push({ category: "Clipboard", name: "copy format capabilities are represented", body: "Checks HTML destinations and plain-text destinations expose distinct copy modes/labels.", run(api) {
      ok(api.DESTINATIONS.gmail.copyLabel.includes("Copy"));
      equal(api.DESTINATIONS.markdown.copyMode, "markdown");
      equal(api.DESTINATIONS.cms.copyMode, "plain");
    }});
  }

  function runAllTests() {
    const api = window.TextSanitizer;
    if (!api) {
      renderResults([{ name: "TextSanitizer API is available", status: "fail", error: new Error("window.TextSanitizer was not found") }]);
      return;
    }

    renderDiagnostics(api);
    addCoverageTests(api);
    const results = tests.map((test) => {
      try {
        test.run(api);
        return { name: test.name, category: test.category, body: test.body, run: test.run, status: "pass" };
      } catch (error) {
        return { name: test.name, category: test.category, body: test.body, run: test.run, status: "fail", error };
      }
    });
    renderResults(results);
  }

  document.addEventListener("DOMContentLoaded", () => {
    document.querySelector("#runTestsButton").addEventListener("click", runAllTests);
    runAllTests();
  });
})();
