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
    { id: "warnings", title: "Warnings", explanation: "Analysis warnings and DOCX parsing limitations for the local preview." }
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

  function rangeIntersects(start, end, targetStart, targetEnd) {
    return start >= targetStart && start < targetEnd || start === targetEnd && targetStart === targetEnd;
  }

  function findRunLocation(runs, safeOffset) {
    const runIndex = (Array.isArray(runs) ? runs : []).findIndex((run) => rangeIntersects(safeOffset, safeOffset + 1, run.start, run.end));
    if (runIndex === -1) return null;
    const run = runs[runIndex];
    return { runId: run.id || "", runIndex };
  }

  function structuredLocationForOffset(blocks, offset, length) {
    if (!Array.isArray(blocks) || !blocks.length) return null;
    const safeOffset = Math.max(0, Number(offset) || 0);
    const safeLength = Math.max(0, Number(length) || 0);
    const issueEnd = safeOffset + safeLength;
    const blockIndex = blocks.findIndex((block) => safeOffset >= block.start && safeOffset <= block.end);
    if (blockIndex === -1) return null;
    const block = blocks[blockIndex];
    const rangeInBlock = {
      start: Math.max(0, safeOffset - block.start),
      end: Math.min(String(block.text || "").length, issueEnd - block.start)
    };
    const location = { blockId: block.id || "", blockIndex, rangeInBlock };

    if (block.type === "table") {
      (block.rows || []).some((row, rowIndex) => (row.cells || []).some((cell, cellIndex) => {
        if (!rangeIntersects(safeOffset, issueEnd, cell.start, cell.end)) return false;
        location.rowId = row.id || "";
        location.rowIndex = rowIndex;
        location.cellId = cell.id || "";
        location.cellIndex = cellIndex;
        location.rangeInCell = { start: Math.max(0, safeOffset - cell.start), end: Math.min(String(cell.text || "").length, issueEnd - cell.start) };
        (cell.paragraphs || []).some((paragraph, paragraphIndex) => {
          if (!rangeIntersects(safeOffset, issueEnd, paragraph.start, paragraph.end)) return false;
          location.paragraphId = paragraph.id || "";
          location.paragraphIndexInCell = paragraphIndex;
          location.rangeInParagraph = { start: Math.max(0, safeOffset - paragraph.start), end: Math.min(String(paragraph.text || "").length, issueEnd - paragraph.start) };
          Object.assign(location, findRunLocation(paragraph.runs, safeOffset) || {});
          return true;
        });
        return true;
      }));
      return location;
    }

    Object.assign(location, findRunLocation(block.runs, safeOffset) || {});
    return location;
  }

  const ISSUE_PRIORITY = { hidden: 100, emoji: 90, "unusual-space": 85, "repeated-space": 84, "trailing-space": 83, "unicode-separator": 82, "double-quote": 75, "single-quote": 75, "double-prime": 74, "single-prime": 74, "em-dash": 73, "en-dash": 73, ellipsis: 72, fullwidth: 70, ligature: 69, fraction: 68, "super-sub": 67, "non-ascii": 10 };

  function issuePriority(issue) { return ISSUE_PRIORITY[issue && issue.type] || 0; }

  function groupOverlappingIssues(issues) {
    const sorted = (Array.isArray(issues) ? issues : [])
      .filter((issue) => Number.isFinite(issue.start) && Number.isFinite(issue.end) && issue.start < issue.end)
      .slice()
      .sort((a, b) => a.start - b.start || b.end - a.end || issuePriority(b) - issuePriority(a));
    const groups = [];
    sorted.forEach((issue) => {
      const last = groups[groups.length - 1];
      if (!last || issue.start >= last.end) groups.push({ start: issue.start, end: issue.end, issues: [issue] });
      else {
        last.end = Math.max(last.end, issue.end);
        last.issues.push(issue);
      }
    });
    return groups.map((group) => Object.assign(group, { primary: group.issues.slice().sort((a, b) => issuePriority(b) - issuePriority(a) || (a.end - a.start) - (b.end - b.start) || a.start - b.start)[0] }));
  }

  function prioritizeIssueRanges(issues) {
    return groupOverlappingIssues(issues).map((group) => group.primary).filter(Boolean).sort((a, b) => a.start - b.start || b.end - a.end);
  }


  function enrichIssueLocation(issue, model, paragraphs) {
    const structuredLocation = structuredLocationForOffset(model && model.blocks, issue.start, issue.end - issue.start);
    if (structuredLocation) return Object.assign(issue, structuredLocation);
    issue.paragraphIndex = paragraphIndexForOffset(paragraphs, issue.start);
    return issue;
  }

  function collectRegexIssues(text, model, paragraphs, regex, type, group, label) {
    const issues = [];
    String(text || "").replace(regex, (match, ...args) => {
      const offset = args[args.length - 2];
      const replacement = replacementForIssue(type, match);
      const issue = {
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
      };
      issues.push(enrichIssueLocation(issue, model, paragraphs));
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
    const warnings = [{ id: "warning-formatting", group: "warnings", type: "formatting-warning", label: "Formatted preview is approximate", shortLabel: "Formatted preview is approximate", text: "Formatted preview is approximate; comments, tracked changes, footnotes/endnotes, headers, footers, images, text boxes, complex tables, and exact Word layout are not fully represented.", originalText: "", replacement: "", proposedReplacement: "", codePoint: "", severity: "warning", paragraphIndex: 1, start: 0, end: 0, location: 0, status: "open" }];
    const issues = [
      ...collectRegexIssues(rawText, model, paragraphs, REGEX.hidden, "hidden", "hidden", "Hidden or directional character"),
      ...collectRegexIssues(rawText, model, paragraphs, REGEX.unusualSpaces, "unusual-space", "whitespace", "Unusual space"),
      ...collectRegexIssues(rawText, model, paragraphs, /\n{3,}/g, "blank-line-run", "whitespace", "Extra blank lines"),
      ...collectRegexIssues(rawText, model, paragraphs, REGEX.repeatedSpaces, "repeated-space", "whitespace", "Repeated spaces"),
      ...collectRegexIssues(rawText, model, paragraphs, REGEX.trailingSpaces, "trailing-space", "whitespace", "Trailing spaces"),
      ...collectRegexIssues(rawText, model, paragraphs, REGEX.separators, "unicode-separator", "whitespace", "Unicode line/paragraph separator"),
      ...collectRegexIssues(rawText, model, paragraphs, REGEX.curlySingle, "single-quote", "punctuation", "Quote-like character"),
      ...collectRegexIssues(rawText, model, paragraphs, REGEX.curlyDouble, "double-quote", "punctuation", "Quote-like character"),
      ...collectRegexIssues(rawText, model, paragraphs, REGEX.primeSingle, "single-prime", "punctuation", "Prime-like character"),
      ...collectRegexIssues(rawText, model, paragraphs, REGEX.primeDouble, "double-prime", "punctuation", "Prime-like character"),
      ...collectRegexIssues(rawText, model, paragraphs, REGEX.emDashLike, "em-dash", "punctuation", "Dash variant"),
      ...collectRegexIssues(rawText, model, paragraphs, REGEX.enDashLike, "en-dash", "punctuation", "Dash variant"),
      ...collectRegexIssues(rawText, model, paragraphs, /[\u2024\u2025\u2026]/gu, "ellipsis", "punctuation", "Ellipsis or dot leader"),
      ...collectRegexIssues(rawText, model, paragraphs, REGEX.fullwidthAscii, "fullwidth", "compatibility", "Fullwidth ASCII form"),
      ...collectRegexIssues(rawText, model, paragraphs, /[ﬀﬁﬂﬃﬄﬅﬆ]/gu, "ligature", "compatibility", "Ligature"),
      ...collectRegexIssues(rawText, model, paragraphs, /[¼½¾⅐-⅞]/gu, "fraction", "compatibility", "Single-character fraction"),
      ...collectRegexIssues(rawText, model, paragraphs, /[⁰¹²³⁴⁵⁶⁷⁸⁹₀₁₂₃₄₅₆₇₈₉⁺⁻⁼⁽⁾₊₋₌₍₎ᵃ-ᵗᵘ-ᶻ]/gu, "super-sub", "compatibility", "Superscript or subscript"),
      ...collectRegexIssues(rawText, model, paragraphs, REGEX.emoji, "emoji", "compatibility", "Emoji or pictographic symbol"),
      ...collectRegexIssues(rawText, model, paragraphs, REGEX.nonAscii, "non-ascii", "nonAscii", "Non-ASCII character"),
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

  const API = { GROUPS, paragraphIndexForOffset, structuredLocationForOffset, groupOverlappingIssues, prioritizeIssueRanges, analyzeDocumentText, buildIssueGroups, replacementForIssue };
  if (typeof module !== "undefined" && module.exports) module.exports = API;
  else global.TextSanitizerDocument = Object.assign(global.TextSanitizerDocument || {}, API);
})(typeof window !== "undefined" ? window : globalThis);
