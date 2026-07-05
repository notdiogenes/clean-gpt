(function (global) {
  "use strict";

  const WARNING_PARTS = [
    { path: "word/comments.xml", type: "comments", message: "Comments were detected but are not rendered for review." },
    { path: "word/header", type: "headers", message: "Headers were detected but are not rendered for review." },
    { path: "word/footer", type: "footers", message: "Footers were detected but are not rendered for review." },
    { path: "word/footnotes.xml", type: "footnotes", message: "Footnotes were detected but are not rendered for review." }
  ];

  function decodeXmlEntities(text) {
    return String(text || "").replace(/&(?:#(x[0-9a-f]+|\d+)|amp|lt|gt|quot|apos);/gi, (match, numeric) => {
      if (numeric) return String.fromCodePoint(numeric[0].toLowerCase() === "x" ? parseInt(numeric.slice(1), 16) : parseInt(numeric, 10));
      return { "&amp;": "&", "&lt;": "<", "&gt;": ">", "&quot;": '"', "&apos;": "'" }[match.toLowerCase()] || match;
    });
  }

  function localName(name) { return String(name || "").split(":").pop(); }
  function elementChildren(node) { return (node.children || []).filter((child) => child.type === "element"); }
  function childrenByName(node, name) { return elementChildren(node).filter((child) => child.localName === name); }
  function firstChildByName(node, name) { return childrenByName(node, name)[0] || null; }
  function descendantsByName(node, name, acc) {
    const out = acc || [];
    elementChildren(node).forEach((child) => { if (child.localName === name) out.push(child); descendantsByName(child, name, out); });
    return out;
  }
  function attr(node, name) {
    if (!node || !node.attributes) return "";
    return node.attributes[name] || node.attributes[`w:${name}`] || node.attributes[`r:${name}`] || "";
  }
  function hasChild(node, name) { return Boolean(firstChildByName(node, name)); }

  function parseXmlInNode(xml) {
    const root = { type: "root", name: "#document", localName: "#document", attributes: {}, children: [] };
    const stack = [root];
    const tokenPattern = /<!--([\s\S]*?)-->|<!\[CDATA\[([\s\S]*?)\]\]>|<\?[^>]*\?>|<![^>]*>|<([^\s/>]+)([^>]*)\/?>|<\/([^>]+)>|([^<]+)/g;
    let match;
    while ((match = tokenPattern.exec(String(xml || "")))) {
      if (match[2] !== undefined || match[6] !== undefined) {
        stack[stack.length - 1].children.push({ type: "text", text: decodeXmlEntities(match[2] !== undefined ? match[2] : match[6]) });
      } else if (match[3]) {
        const source = match[0];
        const node = { type: "element", name: match[3], localName: localName(match[3]), attributes: {}, children: [] };
        String(match[4] || "").replace(/([^\s=]+)\s*=\s*(["'])([\s\S]*?)\2/g, (m, key, quote, value) => { node.attributes[key] = decodeXmlEntities(value); return m; });
        stack[stack.length - 1].children.push(node);
        if (!source.endsWith("/>")) stack.push(node);
      } else if (match[5] && stack.length > 1) {
        stack.pop();
      }
    }
    return root;
  }

  function fromDomNode(domNode) {
    if (domNode.nodeType === 3 || domNode.nodeType === 4) return { type: "text", text: domNode.nodeValue || "" };
    if (domNode.nodeType !== 1 && domNode.nodeType !== 9) return null;
    const node = { type: domNode.nodeType === 9 ? "root" : "element", name: domNode.nodeName, localName: domNode.localName || localName(domNode.nodeName), attributes: {}, children: [] };
    if (domNode.attributes) Array.from(domNode.attributes).forEach((attribute) => { node.attributes[attribute.name] = attribute.value; });
    Array.from(domNode.childNodes || []).forEach((child) => { const converted = fromDomNode(child); if (converted) node.children.push(converted); });
    return node;
  }

  function parseXml(xml) {
    if (typeof DOMParser === "function") {
      return fromDomNode(new DOMParser().parseFromString(String(xml || ""), "application/xml"));
    }
    return parseXmlInNode(xml);
  }

  function extractStyleMapFromStylesXml(xml) {
    const doc = parseXml(xml);
    const styles = { paragraph: Object.create(null), run: Object.create(null), character: Object.create(null) };
    descendantsByName(doc, "style").forEach((styleNode) => {
      const id = attr(styleNode, "styleId");
      if (!id) return;
      const type = attr(styleNode, "type") || "paragraph";
      const nameNode = firstChildByName(styleNode, "name");
      const style = { id, name: nameNode ? attr(nameNode, "val") : id, type };
      styles[type] = styles[type] || Object.create(null);
      styles[type][id] = style;
      if (type === "character") styles.run[id] = style;
    });
    return styles;
  }

  function resolveStyleName(styleMap, type, styleId) {
    if (!styleId || !styleMap) return "";
    const bucket = styleMap[type] || styleMap[type === "run" ? "character" : type] || {};
    return bucket[styleId] ? bucket[styleId].name : "";
  }

  function extractRunPropertiesFromNode(runNode, styleMap) {
    const propertiesNode = firstChildByName(runNode, "rPr") || { children: [] };
    const styleNode = firstChildByName(propertiesNode, "rStyle");
    const colorNode = firstChildByName(propertiesNode, "color");
    const highlightNode = firstChildByName(propertiesNode, "highlight");
    const vertAlignNode = firstChildByName(propertiesNode, "vertAlign");
    const underlineNode = firstChildByName(propertiesNode, "u");
    const styleId = styleNode ? attr(styleNode, "val") : "";
    const underlineValue = underlineNode ? attr(underlineNode, "val") || "single" : "";
    const verticalAlign = vertAlignNode ? attr(vertAlignNode, "val") : "";
    return { bold: hasChild(propertiesNode, "b"), italic: hasChild(propertiesNode, "i"), underline: Boolean(underlineNode && underlineValue !== "none"), underlineValue, strike: hasChild(propertiesNode, "strike") || hasChild(propertiesNode, "dstrike"), subscript: verticalAlign === "subscript", superscript: verticalAlign === "superscript", highlight: highlightNode ? attr(highlightNode, "val") : "", color: colorNode ? attr(colorNode, "val") : "", styleId, styleName: resolveStyleName(styleMap, "run", styleId) };
  }

  function textContent(node) { return (node.children || []).map((child) => child.type === "text" ? child.text : textContent(child)).join(""); }

  function parseRelationships(xml) {
    const relationships = Object.create(null);
    if (!xml) return relationships;
    descendantsByName(parseXml(xml), "Relationship").forEach((node) => { relationships[attr(node, "Id") || attr(node, "id")] = { id: attr(node, "Id") || attr(node, "id"), target: attr(node, "Target"), type: attr(node, "Type") }; });
    return relationships;
  }

  function paragraphStyle(paragraphNode, styleMap) {
    const styleNode = firstChildByName(firstChildByName(paragraphNode, "pPr") || { children: [] }, "pStyle");
    const styleId = styleNode ? attr(styleNode, "val") : "";
    return { styleId, styleName: resolveStyleName(styleMap, "paragraph", styleId) };
  }

  function appendTextRun(runs, parts, state, text, type, properties, id) {
    const start = state.paragraphStart + state.localOffset;
    runs.push({ id, type, text, start, end: start + text.length, range: { start, end: start + text.length }, rangeInBlock: { start: state.localOffset, end: state.localOffset + text.length }, properties });
    parts.push(text);
    state.localOffset += text.length;
  }

  function extractRunsFromContainer(container, paragraphIndex, paragraphStart, styleMap, idPrefix, relationships) {
    const runs = [];
    const parts = [];
    const state = { paragraphStart, localOffset: 0 };
    let runIndex = 0;
    function visit(node, inherited) {
      elementChildren(node).forEach((child) => {
        if (child.localName === "r") {
          runIndex += 1;
          const properties = Object.assign({}, inherited || {}, extractRunPropertiesFromNode(child, styleMap));
          elementChildren(child).forEach((item) => {
            const id = `${idPrefix || `p-${paragraphIndex}`}-r-${runIndex}-${runs.length + 1}`;
            if (item.localName === "t") appendTextRun(runs, parts, state, textContent(item), "text", properties, id);
            else if (item.localName === "tab") appendTextRun(runs, parts, state, "\t", "tab", properties, id);
            else if (item.localName === "br" || item.localName === "cr") appendTextRun(runs, parts, state, "\n", "lineBreak", properties, id);
          });
        } else if (child.localName === "hyperlink") {
          const relId = attr(child, "id");
          const anchor = attr(child, "anchor");
          visit(child, Object.assign({}, inherited || {}, { hyperlink: true, relationshipId: relId, href: relId && relationships && relationships[relId] ? relationships[relId].target : "", anchor }));
        } else if (child.localName === "ins" || child.localName === "del") {
          visit(child, Object.assign({}, inherited || {}, { revision: child.localName, author: attr(child, "author"), date: attr(child, "date") }));
        }
      });
    }
    visit(container, null);
    return { text: parts.join(""), runs };
  }

  function appendCanonicalSeparator(state) { if (state.hasText) state.offset += 1; }

  function makeParagraphBlock(paragraphNode, state, styleMap, paragraphIndex, idPrefix, extra, relationships) {
    appendCanonicalSeparator(state);
    const paragraphStart = state.offset;
    const style = paragraphStyle(paragraphNode, styleMap);
    const parsed = extractRunsFromContainer(paragraphNode, paragraphIndex, paragraphStart, styleMap, idPrefix, relationships);
    const numberingNode = firstChildByName(firstChildByName(paragraphNode, "pPr") || { children: [] }, "numPr");
    const block = Object.assign({ id: idPrefix || `p-${paragraphIndex}`, type: "paragraph", text: parsed.text, start: paragraphStart, end: paragraphStart + parsed.text.length, range: { start: paragraphStart, end: paragraphStart + parsed.text.length }, styleId: style.styleId, styleName: style.styleName, list: numberingNode ? { level: attr(firstChildByName(numberingNode, "ilvl"), "val"), numId: attr(firstChildByName(numberingNode, "numId"), "val") } : null, runs: parsed.runs }, extra || {});
    state.offset = block.end; state.hasText = true; return block;
  }

  function extractTableBlock(tableNode, state, styleMap, tableIndex, relationships) {
    appendCanonicalSeparator(state);
    const tableStart = state.offset; const rows = []; const textParts = [];
    childrenByName(tableNode, "tr").forEach((rowNode, rowIndex, rowArray) => {
      const cells = []; const cellTexts = [];
      childrenByName(rowNode, "tc").forEach((cellNode, cellIndex, cellArray) => {
        const cellStart = state.offset; const paragraphs = []; const paragraphTexts = [];
        childrenByName(cellNode, "p").forEach((paragraphNode, paragraphCellIndex, paragraphArray) => {
          const parsed = extractRunsFromContainer(paragraphNode, paragraphCellIndex + 1, state.offset, styleMap, `tbl-${tableIndex}-r-${rowIndex + 1}-c-${cellIndex + 1}-p-${paragraphs.length + 1}`, relationships);
          const paragraph = { id: `tbl-${tableIndex}-r-${rowIndex + 1}-c-${cellIndex + 1}-p-${paragraphs.length + 1}`, type: "paragraph", text: parsed.text, start: state.offset, end: state.offset + parsed.text.length, range: { start: state.offset, end: state.offset + parsed.text.length }, runs: parsed.runs };
          paragraphs.push(paragraph); paragraphTexts.push(parsed.text); state.offset = paragraph.end; if (paragraphCellIndex < paragraphArray.length - 1) state.offset += 1;
        });
        const cellText = paragraphTexts.join("\n"); const cellEnd = cellStart + cellText.length;
        cells.push({ id: `tbl-${tableIndex}-r-${rowIndex + 1}-c-${cellIndex + 1}`, type: "cell", text: cellText, start: cellStart, end: cellEnd, range: { start: cellStart, end: cellEnd }, paragraphs });
        cellTexts.push(cellText); state.offset = cellEnd; if (cellIndex < cellArray.length - 1) state.offset += 1;
      });
      const rowText = cellTexts.join("\t"); rows.push({ id: `tbl-${tableIndex}-r-${rowIndex + 1}`, type: "row", text: rowText, cells }); textParts.push(rowText); if (rowIndex < rowArray.length - 1) state.offset += 1;
    });
    const text = textParts.join("\n"); const table = { id: `tbl-${tableIndex}`, type: "table", text, start: tableStart, end: tableStart + text.length, range: { start: tableStart, end: tableStart + text.length }, rows };
    state.offset = table.end; state.hasText = true; return table;
  }

  function buildWarnings(parts) {
    const warnings = [];
    const hasTracked = parts && parts.documentXml && /<w:(ins|del)\b/.test(parts.documentXml);
    if (hasTracked) warnings.push({ type: "tracked-revisions", message: "Tracked revisions were detected and rendered with revision metadata." });
    if (!parts) return warnings;
    Array.from(parts.paths || []).forEach((path) => {
      const found = WARNING_PARTS.find((item) => path === item.path || path.startsWith(item.path));
      if (found && !warnings.some((warning) => warning.type === found.type)) warnings.push({ type: found.type, path, message: found.message });
    });
    return warnings;
  }

  function extractDocumentBlocksFromDocumentXml(xml, styleMap, options) {
    const relationships = options && options.relationships || {};
    const doc = parseXml(xml); const body = descendantsByName(doc, "body")[0] || doc;
    const blocks = []; const state = { offset: 0, hasText: false }; let paragraphIndex = 0; let tableIndex = 0;
    elementChildren(body).forEach((child) => {
      if (child.localName === "tbl") { tableIndex += 1; blocks.push(extractTableBlock(child, state, styleMap, tableIndex, relationships)); }
      else if (child.localName === "p") { paragraphIndex += 1; blocks.push(makeParagraphBlock(child, state, styleMap, paragraphIndex, null, null, relationships)); }
    });
    return blocks;
  }

  function extractParagraphsFromDocumentXml(xml) { return extractDocumentBlocksFromDocumentXml(xml, null).filter((block) => block.type === "paragraph").map((block) => block.text); }
  function extractRunProperties(runXml, styleMap) { return extractRunPropertiesFromNode(descendantsByName(parseXml(runXml), "r")[0] || parseXml(runXml), styleMap); }

  const API = { parseWordprocessingXml: parseXml, parseDocxRelationships: parseRelationships, extractParagraphsFromDocumentXml, extractDocumentBlocksFromDocumentXml, extractRunProperties, extractStyleMapFromStylesXml, buildDocxWarnings: buildWarnings };
  if (typeof module !== "undefined" && module.exports) module.exports = API;
  else global.TextSanitizerDocument = Object.assign(global.TextSanitizerDocument || {}, API);
})(typeof window !== "undefined" ? window : globalThis);
