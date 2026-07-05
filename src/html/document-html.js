(function (global) {
  "use strict";

  const escapeHtml = typeof require === "function"
    ? require("./escape")
    : global.TextSanitizerHtml;
  const styleAttributes = typeof require === "function"
    ? require("./style-attributes")
    : global.TextSanitizerHtml;

  const { htmlEscapeWithBreaks } = escapeHtml;
  const { styleAttributeFromOptions } = styleAttributes;

  function buildDocumentHtmlFromDoc(doc, options) {
    const style = styleAttributeFromOptions(Object.assign({ destination: "googleDocs" }, options || {}));
    const parts = [`<div style="${style}">`];
    (doc.blocks || []).forEach((block) => {
      if (block.type === "blank") {
        parts.push("<p><br></p>");
      } else if (block.type === "paragraph") {
        parts.push(`<p style="${style}">${htmlEscapeWithBreaks(block.text || "")}</p>`);
      } else if (block.type === "ul" || block.type === "ol") {
        const tag = block.type;
        parts.push(`<${tag}>`);
        (block.items || []).forEach((item) => {
          const nested = (item.children || []).map((child) => buildDocumentHtmlFromDoc({ blocks: [child] }, options).replace(/^<div[^>]*>|<\/div>$/g, "")).join("");
          parts.push(`<li>${htmlEscapeWithBreaks(item.text || "")}${nested}</li>`);
        });
        parts.push(`</${tag}>`);
      }
    });
    parts.push("</div>");
    return parts.join("");
  }

  const API = { buildDocumentHtmlFromDoc };
  if (typeof module !== "undefined" && module.exports) module.exports = API;
  else global.TextSanitizerHtml = Object.assign(global.TextSanitizerHtml || {}, API);
})(typeof window !== "undefined" ? window : globalThis);
