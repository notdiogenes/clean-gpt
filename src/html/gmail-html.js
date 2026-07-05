(function (global) {
  "use strict";

  const escapeHtml = typeof require === "function"
    ? require("./escape")
    : global.TextSanitizerHtml;
  const styleAttributes = typeof require === "function"
    ? require("./style-attributes")
    : global.TextSanitizerHtml;
  const optionDefaults = typeof require === "function"
    ? require("../config/option-defaults")
    : global.TextSanitizerConfig;

  const { htmlEscape, htmlEscapeWithBreaks } = escapeHtml;
  const { gmailStyleFromOptions } = styleAttributes;
  const { OPTION_DEFAULTS } = optionDefaults;

  function buildGmailHtml(text) {
    const lines = String(text || "").replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
    const nonEmptyIndexes = lines.map((line, index) => line.trim() ? index : -1).filter((index) => index >= 0);
    const lastTextIndex = nonEmptyIndexes.length ? nonEmptyIndexes[nonEmptyIndexes.length - 1] : -1;
    const divs = lines.map((line, index) => {
      const style = gmailStyleFromOptions(OPTION_DEFAULTS);
      const prefix = `<div class="gmail_default" style="${style.inline}">`;
      if (!line) return `${prefix}<br></div>`;
      const suffix = index === lastTextIndex ? "<br></div>" : "</div>";
      return `${prefix}${htmlEscape(line)}${suffix}`;
    });
    return `<div>${divs.join("")}<br clear="all"></div>`;
  }

  function docBlocksAsGmailLines(doc, options) {
    const lines = [];
    (doc.blocks || []).forEach((block) => {
      if (block.type === "blank") {
        lines.push("");
      } else if (block.type === "paragraph") {
        const text = block.text || "";
        const split = text.split("\n");
        split.forEach((line) => lines.push(line));
      } else if (block.type === "ul" || block.type === "ol") {
        function appendList(listBlock, depth) {
          (listBlock.items || []).forEach((item, index) => {
            const marker = listBlock.type === "ol" ? `${index + 1}. ` : (options.gmailListsAsHyphenLines === false ? "• " : "- ");
            lines.push(`${"  ".repeat(depth)}${marker}${item.text || ""}`);
            (item.children || []).forEach((child) => appendList(child, depth + 1));
          });
        }
        appendList(block, 0);
      }
    });
    return lines;
  }

  function buildGmailLineDiv(text, finalText, options) {
    const style = gmailStyleFromOptions(options);
    const prefix = `<div class="gmail_default" style="${style.inline}">`;
    if (!text) return `${prefix}<br></div>`;
    const body = htmlEscapeWithBreaks(text);
    return `${prefix}${body}${finalText ? "<br>" : ""}</div>`;
  }

  function buildGmailListHtml(block, isFinalContent, options) {
    const tag = block.type === "ol" ? "ol" : "ul";
    const style = gmailStyleFromOptions(options);
    const parts = [`<${tag} style="${style.inline}">`];
    const items = block.items || [];
    items.forEach((item, index) => {
      const isFinalItem = isFinalContent && index === items.length - 1;
      const nested = (item.children || []).map((child) => buildGmailListHtml(child, false, options)).join("");
      parts.push(`<li class="gmail_default" style="font-family: verdana, sans-serif;">${htmlEscapeWithBreaks(item.text || "")}${nested}${isFinalItem ? "<br>" : ""}</li>`);
    });
    parts.push(`</${tag}>`);
    return parts.join("");
  }

  function buildGmailHtmlFromDoc(doc, options) {
    if (options && options.gmailListsAsHyphenLines) {
      const lines = docBlocksAsGmailLines(doc, options);
      const nonEmptyIndexes = lines.map((line, index) => line.trim() ? index : -1).filter((index) => index >= 0);
      const lastTextIndex = nonEmptyIndexes.length ? nonEmptyIndexes[nonEmptyIndexes.length - 1] : -1;
      const divs = lines.map((line, index) => buildGmailLineDiv(line, index === lastTextIndex && line.trim(), options));
      return `<div>${divs.join("")}<br clear="all"></div>`;
    }

    const blocks = doc.blocks || [];
    const contentIndexes = blocks.map((block, index) => {
      if (block.type === "paragraph" && (block.text || "").trim()) return index;
      if ((block.type === "ul" || block.type === "ol") && (block.items || []).length) return index;
      return -1;
    }).filter((index) => index >= 0);
    const lastContentIndex = contentIndexes.length ? contentIndexes[contentIndexes.length - 1] : -1;
    const parts = ["<div>"];

    blocks.forEach((block, index) => {
      if (block.type === "blank") {
        parts.push(buildGmailLineDiv("", false, options));
      } else if (block.type === "paragraph") {
        parts.push(buildGmailLineDiv(block.text || "", index === lastContentIndex, options));
      } else if (block.type === "ul" || block.type === "ol") {
        parts.push(buildGmailListHtml(block, index === lastContentIndex, options));
      }
    });
    parts.push('<br clear="all"></div>');
    return parts.join("");
  }

  const API = { buildGmailHtml, docBlocksAsGmailLines, buildGmailLineDiv, buildGmailListHtml, buildGmailHtmlFromDoc };
  if (typeof module !== "undefined" && module.exports) module.exports = API;
  else global.TextSanitizerHtml = Object.assign(global.TextSanitizerHtml || {}, API);
})(typeof window !== "undefined" ? window : globalThis);
