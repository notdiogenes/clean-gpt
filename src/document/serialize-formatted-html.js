(function (global) {
  "use strict";

  const escapeHtml = typeof require === "function" ? require("../html/escape") : global.TextSanitizerHtml;
  const analysisCore = typeof require === "function" ? require("./document-analysis") : global.TextSanitizerDocument;
  const { htmlEscape } = escapeHtml;
  const { prioritizeIssueRanges } = analysisCore;

  function safeUrl(url) {
    const value = String(url || "").trim();
    if (!value) return "";
    if (/^(https?:|mailto:)/i.test(value)) return value;
    return "";
  }

  function styleForProperties(properties) {
    const styles = [];
    if (properties && properties.bold) styles.push("font-weight:700");
    if (properties && properties.italic) styles.push("font-style:italic");
    if (properties && properties.underline) styles.push("text-decoration:underline");
    if (properties && properties.strike) styles.push("text-decoration:line-through");
    if (properties && properties.highlight) styles.push(`background-color:${htmlEscape(properties.highlight)}`);
    if (properties && /^[0-9A-F]{6}$/i.test(properties.color || "")) styles.push(`color:#${properties.color}`);
    if (properties && properties.superscript) styles.push("vertical-align:super;font-size:smaller");
    if (properties && properties.subscript) styles.push("vertical-align:sub;font-size:smaller");
    return styles.join(";");
  }

  function acceptedIssues(reviewOrIssues) {
    const issues = Array.isArray(reviewOrIssues) ? reviewOrIssues : reviewOrIssues && reviewOrIssues.issues;
    return prioritizeIssueRanges((issues || []).filter((issue) => issue.status === "applied" && issue.start < issue.end));
  }

  function applyAcceptedIssuesToText(text, textStart, textEnd, issues) {
    let cursor = textStart;
    let output = "";
    issues.forEach((issue) => {
      if (issue.end <= textStart || issue.start >= textEnd || issue.start < cursor) return;
      output += String(text || "").slice(cursor - textStart, issue.start - textStart);
      output += issue.replacement == null ? "" : String(issue.replacement);
      cursor = Math.min(issue.end, textEnd);
    });
    return output + String(text || "").slice(cursor - textStart);
  }

  function serializeRun(run, issues) {
    if (run.type === "lineBreak") return "<br>";
    const start = Number.isFinite(run.start) ? run.start : 0;
    const end = Number.isFinite(run.end) ? run.end : start + String(run.text || "").length;
    const text = applyAcceptedIssuesToText(run.text || "", start, end, issues);
    const properties = run.properties || {};
    const style = styleForProperties(properties);
    const content = htmlEscape(text).replace(/\n/g, "<br>").replace(/\t/g, "&#9;");
    const href = safeUrl(properties.href);
    const wrapped = style ? `<span style="${style}">${content}</span>` : content;
    return href ? `<a href="${htmlEscape(href)}">${wrapped}</a>` : wrapped;
  }

  function serializeParagraph(block, issues) {
    const content = (block.runs || []).length ? block.runs.map((run) => serializeRun(run, issues)).join("") : htmlEscape(applyAcceptedIssuesToText(block.text || "", block.start || 0, block.end || 0, issues));
    return `<p>${content || "<br>"}</p>`;
  }

  function serializeTable(block, issues) {
    const rows = (block.rows || []).map((row) => `<tr>${(row.cells || []).map((cell) => `<td>${(cell.paragraphs || []).map((paragraph) => serializeParagraph(paragraph, issues)).join("") || htmlEscape(applyAcceptedIssuesToText(cell.text || "", cell.start || 0, cell.end || 0, issues))}</td>`).join("")}</tr>`).join("");
    return `<table><tbody>${rows}</tbody></table>`;
  }

  function serializeFormattedHtml(model, reviewOrIssues) {
    const issues = acceptedIssues(reviewOrIssues);
    const body = (model && model.blocks || []).map((block) => block.type === "table" ? serializeTable(block, issues) : serializeParagraph(block, issues)).join("");
    return `<!doctype html><html><body>${body}</body></html>`;
  }

  const API = { serializeFormattedHtml, applyAcceptedIssuesToText, styleForProperties, safeUrl };
  if (typeof module !== "undefined" && module.exports) module.exports = API;
  else global.TextSanitizerDocument = Object.assign(global.TextSanitizerDocument || {}, API);
})(typeof window !== "undefined" ? window : globalThis);
