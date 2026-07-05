(function (global) {
  "use strict";

  function docToPlainText(doc, destination) {
    const lines = [];
    const markdownLike = destination === "markdown" || destination === "slack";
    function appendList(block, depth) {
      (block.items || []).forEach((item, index) => {
        const indent = markdownLike ? "  ".repeat(depth) : "";
        const marker = block.type === "ol" ? `${index + 1}.` : ((destination === "plain" || destination === "strictAscii" || markdownLike || destination === "cms" || destination === "code") ? "-" : "•");
        lines.push(`${indent}${marker} ${item.text || ""}`);
        (item.children || []).forEach((child) => appendList(child, depth + 1));
      });
    }
    (doc.blocks || []).forEach((block) => {
      if (block.type === "blank") {
        lines.push("");
      } else if (block.type === "paragraph") {
        lines.push(block.text || "");
      } else if (block.type === "ul" || block.type === "ol") {
        appendList(block, 0);
      }
    });
    return lines.join("\n");
  }

  const API = { docToPlainText };
  if (typeof module !== "undefined" && module.exports) module.exports = API;
  else global.TextSanitizerDocument = Object.assign(global.TextSanitizerDocument || {}, API);
})(typeof window !== "undefined" ? window : globalThis);
