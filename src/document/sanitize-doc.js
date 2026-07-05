(function (global) {
  "use strict";

  const documentModel = typeof require === "function" ? require("./doc-model") : global.TextSanitizerDocument;
  const plainTextSerializer = typeof require === "function" ? require("./serialize-plain-text") : global.TextSanitizerDocument;
  const statsCore = typeof require === "function" ? require("../core/stats") : global.TextSanitizerCore;
  const sourceCore = typeof require === "function" ? require("../core/sanitize-source") : global.TextSanitizerCore;
  const typographyCore = typeof require === "function" ? require("../core/destination-typography") : global.TextSanitizerCore;
  const asciiCore = typeof require === "function" ? require("../core/strict-ascii") : global.TextSanitizerCore;
  const diagnosticsCore = typeof require === "function" ? require("../core/diagnostics") : global.TextSanitizerCore;

  const { makeDoc, blockText } = documentModel;
  const { docToPlainText } = plainTextSerializer;
  const { makeStats } = statsCore;
  const { sanitizeSource } = sourceCore;
  const { applyDestinationTypography } = typographyCore;
  const { applyStrictAscii } = asciiCore;
  const { getDiagnostics } = diagnosticsCore;

  function mergeStats(target, source) {
    Object.keys(source || {}).forEach((key) => {
      if (typeof source[key] === "number") target[key] = (target[key] || 0) + source[key];
    });
  }

  function sanitizeTextPart(text, options, aggregateChanges, aggregateStats, sourceOffset) {
    const source = sanitizeSource(text, options);
    let clean = applyDestinationTypography(source.text, options, source.changes, source.stats);
    clean = applyStrictAscii(clean, options, source.changes, source.stats);
    aggregateChanges.push(...source.changes.map((change) => {
      if (!Number.isInteger(sourceOffset) || !Number.isInteger(change.sourceStart) || !Number.isInteger(change.sourceEnd)) return change;
      return Object.assign({}, change, {
        sourceStart: change.sourceStart + sourceOffset,
        sourceEnd: change.sourceEnd + sourceOffset
      });
    }));
    mergeStats(aggregateStats, source.stats);
    return clean;
  }

  function sanitizeDoc(doc, options) {
    const stats = makeStats();
    const changes = [];
    let sourceOffset = 0;
    const nextOffset = (text) => { const offset = sourceOffset; sourceOffset += String(text || "").length + 1; return offset; };
    const outBlocks = (doc.blocks || []).map((block) => {
      if (block.type === "paragraph") return { type: "paragraph", id: block.id, text: sanitizeTextPart(block.text || "", options, changes, stats, nextOffset(block.text || "")) };
      if (block.type === "blank") { sourceOffset += 1; return { type: "blank", id: block.id }; }
      if (block.type === "ul" || block.type === "ol") {
        function sanitizeItem(item) {
          const children = (item.children || []).map(sanitizeListBlock).filter((child) => child.items.length);
          return Object.assign({ id: item.id, text: sanitizeTextPart(item.text || "", options, changes, stats, nextOffset(item.text || "")) }, children.length ? { children } : {});
        }
        function sanitizeListBlock(listBlock) {
          return { type: listBlock.type, id: listBlock.id, items: (listBlock.items || []).map(sanitizeItem) };
        }
        return sanitizeListBlock(block);
      }
      return { type: "paragraph", id: block.id, text: sanitizeTextPart(blockText(block), options, changes, stats, nextOffset(blockText(block))) };
    }).filter((block) => block.type === "blank" || block.type === "paragraph" || block.items?.length);
    const outputDoc = makeDoc(outBlocks, Object.assign({}, doc.meta));
    const visibleText = docToPlainText(outputDoc, options.destination || "gmail");
    const diagnostics = getDiagnostics(visibleText);
    return {
      doc: outputDoc,
      cleanText: visibleText,
      changes,
      stats,
      warnings: diagnostics.warnings,
      remainingNonAscii: diagnostics.remainingNonAscii,
      options
    };
  }

  const API = { mergeStats, sanitizeTextPart, sanitizeDoc };
  if (typeof module !== "undefined" && module.exports) module.exports = API;
  else global.TextSanitizerDocument = Object.assign(global.TextSanitizerDocument || {}, API);
})(typeof window !== "undefined" ? window : globalThis);
