(function (global) {
  "use strict";

  const documentModel = typeof require === "function" ? require("./doc-model") : global.TextSanitizerDocument;
  const { normalizeBlockText, makeDoc, countDocLists } = documentModel;

  function parsePlainTextToDoc(text, detectLists) {
    const normalized = normalizeBlockText(text);
    const lines = normalized.split("\n");
    const blocks = [];
    let i = 0;

    function addBlank() {
      const last = blocks[blocks.length - 1];
      if (!last || last.type !== "blank") blocks.push({ type: "blank" });
    }

    function markerForLine(line) {
      const unordered = line.match(/^(\s*)[-*\u2022\u2023\u25E6\u2043\u2219]\s+(.+)$/u);
      if (unordered) return { type: "ul", text: unordered[2], indent: unordered[1].replace(/\t/g, "  ").length };
      const ordered = line.match(/^(\s*)(\d+|[A-Za-z])[.)]\s+(.+)$/u);
      if (ordered) return { type: "ol", text: ordered[3], indent: ordered[1].replace(/\t/g, "  ").length };
      return null;
    }

    function parseListAt(startIndex, baseIndent, expectedType) {
      const list = { type: expectedType, items: [] };
      let index = startIndex;
      while (index < lines.length) {
        const marker = markerForLine(lines[index]);
        if (!marker || marker.indent < baseIndent) break;
        if (marker.indent > baseIndent) {
          const parent = list.items[list.items.length - 1];
          if (!parent) break;
          const child = parseListAt(index, marker.indent, marker.type);
          parent.children = (parent.children || []).concat(child.block);
          index = child.index;
          continue;
        }
        if (marker.type !== expectedType) break;
        list.items.push({ text: marker.text.trim() });
        index += 1;
      }
      return { block: list, index };
    }

    while (i < lines.length) {
      const line = lines[i];
      if (!line.trim()) {
        addBlank();
        i += 1;
        continue;
      }

      const marker = detectLists ? markerForLine(line) : null;
      if (marker) {
        const parsed = parseListAt(i, marker.indent, marker.type);
        blocks.push(parsed.block);
        i = parsed.index;
        continue;
      }

      const paragraphLines = [line.trim()];
      i += 1;
      while (i < lines.length && lines[i].trim() && !(detectLists && markerForLine(lines[i]))) {
        paragraphLines.push(lines[i].trim());
        i += 1;
      }
      blocks.push({ type: "paragraph", text: paragraphLines.join("\n") });
    }

    while (blocks.length && blocks[0].type === "blank") blocks.shift();
    while (blocks.length && blocks[blocks.length - 1].type === "blank") blocks.pop();
    const counts = countDocLists(blocks);
    return makeDoc(blocks, { source: "plain", plainAvailable: true, lists: counts.lists, listItems: counts.items });
  }

  const API = { parsePlainTextToDoc };
  if (typeof module !== "undefined" && module.exports) module.exports = API;
  else global.TextSanitizerDocument = Object.assign(global.TextSanitizerDocument || {}, API);
})(typeof window !== "undefined" ? window : globalThis);
