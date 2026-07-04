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
    summary.textContent = `${passed}/${results.length} tests passing`;
    summary.className = passed === results.length ? "test-summary pass" : "test-summary fail";

    results.forEach((result) => {
      const item = document.createElement("li");
      item.className = `test-result ${result.status}`;
      const detail = result.error ? `<pre>${escapeHtml(result.error.stack || result.error.message)}</pre>` : "";
      item.innerHTML = `<span class="test-badge">${result.status === "pass" ? "PASS" : "FAIL"}</span><span>${escapeHtml(result.name)}</span>${detail}`;
      list.append(item);
    });
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[char]));
  }

  function runAllTests() {
    const api = window.TextSanitizer;
    if (!api) {
      renderResults([{ name: "TextSanitizer API is available", status: "fail", error: new Error("window.TextSanitizer was not found") }]);
      return;
    }

    renderDiagnostics(api);
    const results = tests.map((test) => {
      try {
        test.run(api);
        return { name: test.name, status: "pass" };
      } catch (error) {
        return { name: test.name, status: "fail", error };
      }
    });
    renderResults(results);
  }

  document.addEventListener("DOMContentLoaded", () => {
    document.querySelector("#runTestsButton").addEventListener("click", runAllTests);
    runAllTests();
  });
})();
