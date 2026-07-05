(function (global) {
  "use strict";

  const documentModel = typeof require === "function" ? require("./doc-model") : global.TextSanitizerDocument;
  const { normalizeBlockText, makeDoc, countDocLists } = documentModel;

  function isBlockElement(node) {
    if (!node || node.nodeType !== 1) return false;
    return /^(DIV|P|UL|OL|LI|BLOCKQUOTE|PRE|H[1-6]|TABLE|TR)$/i.test(node.tagName);
  }

  function cleanNodeText(node) {
    return normalizeBlockText((node.textContent || "").replace(/\u00a0/g, " ")).replace(/[ \t]+\n/g, "\n").trim();
  }

  function directTextContent(node) {
    let text = "";
    Array.from(node.childNodes || []).forEach((child) => {
      if (child.nodeType === 3) text += child.nodeValue || "";
      if (child.nodeType === 1 && child.tagName === "BR") text += "\n";
    });
    return text;
  }

  function parseListElement(element, ordered) {
    const items = [];
    Array.from(element.children || []).forEach((child) => {
      const tag = child.tagName;
      if (tag === "UL" || tag === "OL") {
        const nested = parseListElement(child, tag === "OL");
        const parent = items[items.length - 1];
        if (parent && nested.items.length) parent.children = (parent.children || []).concat(nested);
        return;
      }
      if (tag !== "LI") return;
      const nestedLists = Array.from(child.children || []).filter((nested) => nested.tagName === "UL" || nested.tagName === "OL");
      const clone = child.cloneNode(true);
      Array.from(clone.querySelectorAll("ul,ol")).forEach((nested) => nested.remove());
      const text = cleanNodeText(clone);
      const children = nestedLists.map((nested) => parseListElement(nested, nested.tagName === "OL")).filter((nested) => nested.items.length);
      if (text || children.length) items.push(Object.assign({ text }, children.length ? { children } : {}));
    });
    return { type: ordered ? "ol" : "ul", items };
  }

  function parseHtmlToDoc(html) {
    const parser = new DOMParser();
    const parsed = parser.parseFromString(String(html || ""), "text/html");
    const blocks = [];

    function addParagraph(text, sourceTag) {
      const normalized = normalizeBlockText(text).trim();
      if (normalized) blocks.push({ type: "paragraph", text: normalized, sourceTag: sourceTag || "" });
    }

    function addBlank() {
      const last = blocks[blocks.length - 1];
      if (!last || last.type !== "blank") blocks.push({ type: "blank" });
    }

    function nextElementSibling(node) {
      let next = node.nextSibling;
      while (next && next.nodeType !== 1) next = next.nextSibling;
      return next;
    }

    function shouldAddParagraphBreakAfter(node) {
      const tag = node.tagName;
      if (!/^(P|BLOCKQUOTE|PRE|H[1-6])$/i.test(tag)) return false;
      const next = nextElementSibling(node);
      if (!next) return false;
      return /^(P|DIV|BLOCKQUOTE|PRE|H[1-6])$/i.test(next.tagName || "");
    }

    function walk(parent) {
      Array.from(parent.childNodes || []).forEach((node) => {
        if (node.nodeType === 3) {
          addParagraph(node.nodeValue || "", "text");
          return;
        }
        if (node.nodeType !== 1) return;
        const tag = node.tagName;
        if (tag === "BR") {
          addBlank();
          return;
        }
        if (tag === "UL" || tag === "OL") {
          const listBlock = parseListElement(node, tag === "OL");
          if (listBlock.items.length) blocks.push(listBlock);
          const next = nextElementSibling(node);
          if (next && /^(P|DIV|BLOCKQUOTE|PRE|H[1-6])$/i.test(next.tagName || "")) addBlank();
          return;
        }
        const hasBlockChildren = Array.from(node.children || []).some(isBlockElement);
        const direct = directTextContent(node).replace(/\u00a0/g, " ").trim();
        if (hasBlockChildren && !direct) {
          walk(node);
          return;
        }
        if (/^(DIV|P|LI|BLOCKQUOTE|PRE|H[1-6])$/i.test(tag)) {
          const text = cleanNodeText(node);
          if (text) addParagraph(text, tag.toLowerCase());
          else addBlank();
          if (shouldAddParagraphBreakAfter(node)) addBlank();
          return;
        }
        walk(node);
      });
    }

    walk(parsed.body);
    while (blocks.length && blocks[0].type === "blank") blocks.shift();
    while (blocks.length && blocks[blocks.length - 1].type === "blank") blocks.pop();
    const counts = countDocLists(blocks);
    return makeDoc(blocks, { source: "html", htmlAvailable: true, lists: counts.lists, listItems: counts.items });
  }

  const API = { isBlockElement, cleanNodeText, directTextContent, parseListElement, parseHtmlToDoc };
  if (typeof module !== "undefined" && module.exports) module.exports = API;
  else global.TextSanitizerDocument = Object.assign(global.TextSanitizerDocument || {}, API);
})(typeof window !== "undefined" ? window : globalThis);
