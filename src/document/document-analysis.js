(function (global) {
  "use strict";

  const regexCore = typeof require === "function" ? require("../core/regex") : global.TextSanitizerCore;
  const diagnosticsCore = typeof require === "function" ? require("../core/diagnostics") : global.TextSanitizerCore;
  const optionsCore = typeof require === "function" ? require("../core/options") : global.TextSanitizerCore;
  const sanitizeCore = typeof require === "function" ? require("../core/sanitize") : global.TextSanitizerCore;
  const docxCore = typeof require === "function" ? require("./docx-extract") : global.TextSanitizerDocument;
  const { REGEX, MAPS, countMatches } = regexCore;
  const { labelChar } = diagnosticsCore;
  const { buildOptions } = optionsCore;
  const { sanitize } = sanitizeCore;
  const { wordCountForText } = docxCore;

  const GROUPS = [
    { id: "hidden", title: "Hidden characters", explanation: "Invisible, directional, or formatting characters that can affect text rendering." },
    { id: "whitespace", title: "Whitespace issues", explanation: "Spacing, blank-line, separator, and trailing-space patterns that often cause paste problems." },
    { id: "punctuation", title: "Punctuation issues", explanation: "Quote, dash, ellipsis, and dot-leader characters that may need destination-aware normalization." },
    { id: "compatibility", title: "Compatibility issues", explanation: "Ligatures, fractions, superscripts/subscripts, emoji, and fullwidth forms that may not travel well." },
    { id: "nonAscii", title: "Non-ASCII characters", explanation: "Characters outside the ASCII range that may require review for strict systems." },
    { id: "warnings", title: "Warnings", explanation: "Analysis warnings and parse limitations for this MVP." }
  ];

  function paragraphIndexForOffset(paragraphs, offset) {
    let cursor = 0;
    for (let i = 0; i < paragraphs.length; i += 1) {
      const end = cursor + String(paragraphs[i] || "").length;
      if (offset <= end) return i + 1;
      cursor = end + 1;
    }
    return paragraphs.length || 1;
  }

  function replacementForIssue(type, text) {
    if (type === "hidden" || type === "emoji" || type === "trailing-space") return "";
    if (type === "unusual-space" || type === "repeated-space") return " ";
    if (type === "blank-line-run") return "\n\n";
    if (type === "unicode-separator") return text === "\u2029" ? "\n\n" : "\n";
    if (type === "single-quote" || type === "single-prime") return "'";
    if (type === "double-quote" || type === "double-prime") return '"';
    if (type === "em-dash") return " -- ";
    if (type === "en-dash") return "-";
    if (type === "ellipsis") return text === "‥" ? ".." : text === "․" ? "." : "...";
    if (type === "fullwidth") return Array.from(text).map((char) => String.fromCodePoint(char.codePointAt(0) - 0xFEE0)).join("");
    if (type === "ligature") return MAPS.ligatures.get(text) || text;
    if (type === "fraction") return MAPS.fractions.get(text) || text;
    if (type === "super-sub") return Array.from(text).map((char) => MAPS.superSub.get(char) || char).join("");
    return text;
  }

  function severityForIssue(type, group) {
    if (group === "warnings" || type === "emoji" || type === "super-sub") return "warning";
    if (group === "hidden" || group === "compatibility" || group === "nonAscii") return "medium";
    return "low";
  }

  function collectRegexIssues(text, paragraphs, regex, type, group, label) {
    const issues = [];
    String(text || "").replace(regex, (match, ...args) => {
      const offset = args[args.length - 2];
      const replacement = replacementForIssue(type, match);
      issues.push({
        id: `issue-${issues.length}-${type}-${offset}`,
        type,
        group,
        label,
        shortLabel: label,
        text: match,
        originalText: match,
        replacement,
        proposedReplacement: replacement,
        codePoint: Array.from(match).map(labelChar).join(" + "),
        severity: severityForIssue(type, group),
        paragraphIndex: paragraphIndexForOffset(paragraphs, offset),
        start: offset,
        end: offset + match.length,
        location: offset,
        status: "open"
      });
      return match;
    });
    return issues;
  }

  function buildIssueGroups(issues) {
    return GROUPS.map((group) => {
      const groupIssues = issues.filter((issue) => issue.group === group.id);
      return Object.assign({}, group, { count: groupIssues.length, examples: groupIssues.slice(0, 5) });
    });
  }

  function analyzeDocumentText(model) {
    const rawText = String(model && model.rawText || "");
    if (!rawText.trim()) throw Object.assign(new Error("Empty document"), { code: "empty-document" });
    const paragraphs = model.paragraphs || rawText.split(/\n+/);
    const warnings = [{ id: "warning-formatting", group: "warnings", type: "formatting-warning", label: "Formatting not preserved", shortLabel: "Formatting not preserved", text: "This MVP analyzes extracted text only.", originalText: "", replacement: "", proposedReplacement: "", codePoint: "", severity: "warning", paragraphIndex: 1, start: 0, end: 0, location: 0, status: "open" }];
    const issues = [
      ...collectRegexIssues(rawText, paragraphs, REGEX.hidden, "hidden", "hidden", "Hidden or directional character"),
      ...collectRegexIssues(rawText, paragraphs, REGEX.unusualSpaces, "unusual-space", "whitespace", "Unusual space"),
      ...collectRegexIssues(rawText, paragraphs, /\n{3,}/g, "blank-line-run", "whitespace", "Extra blank lines"),
      ...collectRegexIssues(rawText, paragraphs, REGEX.repeatedSpaces, "repeated-space", "whitespace", "Repeated spaces"),
      ...collectRegexIssues(rawText, paragraphs, REGEX.trailingSpaces, "trailing-space", "whitespace", "Trailing spaces"),
      ...collectRegexIssues(rawText, paragraphs, REGEX.separators, "unicode-separator", "whitespace", "Unicode line/paragraph separator"),
      ...collectRegexIssues(rawText, paragraphs, REGEX.curlySingle, "single-quote", "punctuation", "Quote-like character"),
      ...collectRegexIssues(rawText, paragraphs, REGEX.curlyDouble, "double-quote", "punctuation", "Quote-like character"),
      ...collectRegexIssues(rawText, paragraphs, REGEX.primeSingle, "single-prime", "punctuation", "Prime-like character"),
      ...collectRegexIssues(rawText, paragraphs, REGEX.primeDouble, "double-prime", "punctuation", "Prime-like character"),
      ...collectRegexIssues(rawText, paragraphs, REGEX.emDashLike, "em-dash", "punctuation", "Dash variant"),
      ...collectRegexIssues(rawText, paragraphs, REGEX.enDashLike, "en-dash", "punctuation", "Dash variant"),
      ...collectRegexIssues(rawText, paragraphs, /[\u2024\u2025\u2026]/gu, "ellipsis", "punctuation", "Ellipsis or dot leader"),
      ...collectRegexIssues(rawText, paragraphs, REGEX.fullwidthAscii, "fullwidth", "compatibility", "Fullwidth ASCII form"),
      ...collectRegexIssues(rawText, paragraphs, /[ﬀﬁﬂﬃﬄﬅﬆ]/gu, "ligature", "compatibility", "Ligature"),
      ...collectRegexIssues(rawText, paragraphs, /[¼½¾⅐-⅞]/gu, "fraction", "compatibility", "Single-character fraction"),
      ...collectRegexIssues(rawText, paragraphs, /[⁰¹²³⁴⁵⁶⁷⁸⁹₀₁₂₃₄₅₆₇₈₉⁺⁻⁼⁽⁾₊₋₌₍₎ᵃ-ᵗᵘ-ᶻ]/gu, "super-sub", "compatibility", "Superscript or subscript"),
      ...collectRegexIssues(rawText, paragraphs, REGEX.emoji, "emoji", "compatibility", "Emoji or pictographic symbol"),
      ...collectRegexIssues(rawText, paragraphs, REGEX.nonAscii, "non-ascii", "nonAscii", "Non-ASCII character"),
      ...warnings
    ];
    const cleanResult = sanitize(rawText, buildOptions("plain"));
    issues.forEach((issue, index) => { issue.id = `issue-${index + 1}`; });
    const issueGroups = buildIssueGroups(issues);
    const highest = issueGroups.reduce((best, group) => group.count > (best?.count || 0) ? group : best, null);
    return {
      characterCount: rawText.length,
      wordCount: wordCountForText(rawText),
      paragraphCount: paragraphs.length,
      totalIssues: issues.length,
      highestVolumeIssueType: highest && highest.count ? highest.title : "None",
      issueGroups,
      issues,
      cleanedText: cleanResult.cleanText,
      cleanupStats: cleanResult.stats,
      warnings
    };
  }

  const API = { GROUPS, paragraphIndexForOffset, analyzeDocumentText, buildIssueGroups, replacementForIssue };
  if (typeof module !== "undefined" && module.exports) module.exports = API;
  else global.TextSanitizerDocument = Object.assign(global.TextSanitizerDocument || {}, API);
})(typeof window !== "undefined" ? window : globalThis);
