(function (global) {
  "use strict";

  const MAX_DOCX_BYTES = 20 * 1024 * 1024;
  const TEXT_XML_PATHS = ["word/document.xml"];

  function isDocxFile(file) {
    const name = String(file && file.name || "").toLowerCase();
    return name.endsWith(".docx");
  }

  function dosDateTimeToDate(date, time) {
    const day = date & 31;
    const month = ((date >> 5) & 15) - 1;
    const year = ((date >> 9) & 127) + 1980;
    const second = (time & 31) * 2;
    const minute = (time >> 5) & 63;
    const hour = (time >> 11) & 31;
    return new Date(year, month, day || 1, hour, minute, second);
  }

  function readUInt16(bytes, offset) {
    return bytes[offset] | (bytes[offset + 1] << 8);
  }

  function readUInt32(bytes, offset) {
    return (bytes[offset] | (bytes[offset + 1] << 8) | (bytes[offset + 2] << 16) | (bytes[offset + 3] << 24)) >>> 0;
  }

  function findEndOfCentralDirectory(bytes) {
    const min = Math.max(0, bytes.length - 0xffff - 22);
    for (let i = bytes.length - 22; i >= min; i -= 1) {
      if (readUInt32(bytes, i) === 0x06054b50) return i;
    }
    throw new Error("Could not parse document");
  }

  async function inflateRaw(data) {
    if (typeof DecompressionStream === "function") {
      const stream = new Blob([data]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
      return new Uint8Array(await new Response(stream).arrayBuffer());
    }
    if (typeof require === "function") {
      const zlib = require("node:zlib");
      return new Uint8Array(zlib.inflateRawSync(Buffer.from(data)));
    }
    throw new Error("Could not parse document");
  }

  async function readZipEntries(arrayBuffer) {
    const bytes = new Uint8Array(arrayBuffer);
    const decoder = new TextDecoder("utf-8");
    const eocd = findEndOfCentralDirectory(bytes);
    const entries = readUInt16(bytes, eocd + 10);
    let offset = readUInt32(bytes, eocd + 16);
    const files = new Map();
    for (let i = 0; i < entries; i += 1) {
      if (readUInt32(bytes, offset) !== 0x02014b50) throw new Error("Could not parse document");
      const method = readUInt16(bytes, offset + 10);
      const modTime = readUInt16(bytes, offset + 12);
      const modDate = readUInt16(bytes, offset + 14);
      const compressedSize = readUInt32(bytes, offset + 20);
      const uncompressedSize = readUInt32(bytes, offset + 24);
      const nameLength = readUInt16(bytes, offset + 28);
      const extraLength = readUInt16(bytes, offset + 30);
      const commentLength = readUInt16(bytes, offset + 32);
      const localOffset = readUInt32(bytes, offset + 42);
      const name = decoder.decode(bytes.slice(offset + 46, offset + 46 + nameLength));
      if (readUInt32(bytes, localOffset) !== 0x04034b50) throw new Error("Could not parse document");
      const localNameLength = readUInt16(bytes, localOffset + 26);
      const localExtraLength = readUInt16(bytes, localOffset + 28);
      const dataStart = localOffset + 30 + localNameLength + localExtraLength;
      const compressed = bytes.slice(dataStart, dataStart + compressedSize);
      let content;
      if (method === 0) content = compressed;
      else if (method === 8) content = await inflateRaw(compressed);
      else content = new Uint8Array();
      if (uncompressedSize && content.length !== uncompressedSize) content = content.slice(0, uncompressedSize);
      files.set(name, { content, lastModified: dosDateTimeToDate(modDate, modTime) });
      offset += 46 + nameLength + extraLength + commentLength;
    }
    return files;
  }

  function decodeXmlEntities(text) {
    return String(text || "").replace(/&(?:#(x[0-9a-f]+|\d+)|amp|lt|gt|quot|apos);/gi, (match, numeric) => {
      if (numeric) return String.fromCodePoint(numeric[0].toLowerCase() === "x" ? parseInt(numeric.slice(1), 16) : parseInt(numeric, 10));
      return { "&amp;": "&", "&lt;": "<", "&gt;": ">", "&quot;": '"', "&apos;": "'" }[match.toLowerCase()] || match;
    });
  }

  function extractParagraphsFromDocumentXml(xml) {
    const paragraphs = [];
    const paragraphMatches = String(xml || "").match(/<w:p[\s\S]*?<\/w:p>/g) || [];
    paragraphMatches.forEach((paragraphXml) => {
      const parts = [];
      paragraphXml.replace(/<w:(t|tab|br|cr)\b([^>]*)>([\s\S]*?)<\/w:\1>|<w:(tab|br|cr)\b[^>]*\/>/g, (match, tag, attrs, body, emptyTag) => {
        const name = tag || emptyTag;
        if (name === "t") parts.push(decodeXmlEntities(body.replace(/<[^>]+>/g, "")));
        else if (name === "tab") parts.push("\t");
        else parts.push("\n");
        return match;
      });
      const text = parts.join("");
      if (text.length || /<w:p\b/.test(paragraphXml)) paragraphs.push(text);
    });
    return paragraphs;
  }


  function getXmlAttribute(xml, name) {
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const match = String(xml || "").match(new RegExp("\\b" + escaped + "=[\"']([^\"']*)[\"']"));
    return match ? decodeXmlEntities(match[1]) : "";
  }

  function hasXmlElement(xml, name) {
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp("<" + escaped + "(?:\\s|>|/)").test(String(xml || ""));
  }

  function extractStyleMapFromStylesXml(xml) {
    const styles = { paragraph: Object.create(null), run: Object.create(null), character: Object.create(null) };
    const styleMatches = String(xml || "").match(/<w:style\b[\s\S]*?<\/w:style>/g) || [];
    styleMatches.forEach((styleXml) => {
      const id = getXmlAttribute(styleXml, "w:styleId");
      if (!id) return;
      const type = getXmlAttribute(styleXml, "w:type") || "paragraph";
      const nameMatch = styleXml.match(/<w:name\b([^>]*)\/?>(?:<\/w:name>)?/);
      const style = { id, name: nameMatch ? getXmlAttribute(nameMatch[1], "w:val") : id, type };
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

  function extractRunProperties(runXml, styleMap) {
    const propertiesXml = (String(runXml || "").match(/<w:rPr\b[\s\S]*?<\/w:rPr>/) || [""])[0];
    const styleTag = propertiesXml.match(/<w:rStyle\b([^>]*)\/?>(?:<\/w:rStyle>)?/);
    const colorTag = propertiesXml.match(/<w:color\b([^>]*)\/?>(?:<\/w:color>)?/);
    const highlightTag = propertiesXml.match(/<w:highlight\b([^>]*)\/?>(?:<\/w:highlight>)?/);
    const vertAlignTag = propertiesXml.match(/<w:vertAlign\b([^>]*)\/?>(?:<\/w:vertAlign>)?/);
    const underlineTag = propertiesXml.match(/<w:u\b([^>]*)\/?>(?:<\/w:u>)?/);
    const styleId = styleTag ? getXmlAttribute(styleTag[1], "w:val") : "";
    const underlineValue = underlineTag ? getXmlAttribute(underlineTag[1], "w:val") || "single" : "";
    const verticalAlign = vertAlignTag ? getXmlAttribute(vertAlignTag[1], "w:val") : "";
    return {
      bold: hasXmlElement(propertiesXml, "w:b"),
      italic: hasXmlElement(propertiesXml, "w:i"),
      underline: Boolean(underlineTag && underlineValue !== "none"),
      underlineValue,
      strike: hasXmlElement(propertiesXml, "w:strike") || hasXmlElement(propertiesXml, "w:dstrike"),
      subscript: verticalAlign === "subscript",
      superscript: verticalAlign === "superscript",
      highlight: highlightTag ? getXmlAttribute(highlightTag[1], "w:val") : "",
      color: colorTag ? getXmlAttribute(colorTag[1], "w:val") : "",
      styleId,
      styleName: resolveStyleName(styleMap, "run", styleId)
    };
  }

  function extractParagraphStyle(paragraphXml, styleMap) {
    const pPr = (String(paragraphXml || "").match(/<w:pPr\b[\s\S]*?<\/w:pPr>/) || [""])[0];
    const styleTag = pPr.match(/<w:pStyle\b([^>]*)\/?>(?:<\/w:pStyle>)?/);
    const styleId = styleTag ? getXmlAttribute(styleTag[1], "w:val") : "";
    return { styleId, styleName: resolveStyleName(styleMap, "paragraph", styleId) };
  }

  function extractDocumentBlocksFromDocumentXml(xml, styleMap) {
    const blocks = [];
    let offset = 0;
    let paragraphIndex = 0;
    const blockMatches = String(xml || "").match(/<w:p\b[\s\S]*?<\/w:p>|<w:tbl\b[\s\S]*?<\/w:tbl>/g) || [];
    blockMatches.forEach((blockXml) => {
      if (/^<w:tbl\b/.test(blockXml)) {
        const text = "[Table]";
        blocks.push({ id: `tbl-${blocks.length + 1}`, type: "table", text, start: offset, end: offset + text.length, placeholder: true });
        offset += text.length + 1;
        return;
      }
      paragraphIndex += 1;
      const paragraphStart = offset;
      const runs = [];
      const parts = [];
      let localOffset = 0;
      const paragraphStyle = extractParagraphStyle(blockXml, styleMap);
      const runMatches = blockXml.match(/<w:r\b[\s\S]*?<\/w:r>/g) || [];
      runMatches.forEach((runXml, runIndex) => {
        const properties = extractRunProperties(runXml, styleMap);
        runXml.replace(/<w:(t|tab|br|cr)\b([^>]*)>([\s\S]*?)<\/w:\1>|<w:(tab|br|cr)\b[^>]*\/>/g, (match, tag, attrs, body, emptyTag) => {
          const name = tag || emptyTag;
          const text = name === "t" ? decodeXmlEntities(String(body || "").replace(/<[^>]+>/g, "")) : (name === "tab" ? "\t" : "\n");
          const type = name === "t" ? "text" : (name === "tab" ? "tab" : "lineBreak");
          const start = paragraphStart + localOffset;
          const end = start + text.length;
          runs.push({ id: `p-${paragraphIndex}-r-${runIndex + 1}-${runs.length + 1}`, type, text, start, end, properties });
          parts.push(text);
          localOffset += text.length;
          return match;
        });
      });
      const text = parts.join("");
      if (text.length || /<w:p\b/.test(blockXml)) {
        blocks.push({ id: `p-${paragraphIndex}`, type: "paragraph", text, start: paragraphStart, end: paragraphStart + text.length, styleId: paragraphStyle.styleId, styleName: paragraphStyle.styleName, runs });
        offset += text.length + 1;
      }
    });
    return blocks;
  }


  function wordCountForText(text) {
    const matches = String(text || "").trim().match(/\S+/g);
    return matches ? matches.length : 0;
  }

  async function extractDocxText(file) {
    if (!isDocxFile(file)) throw Object.assign(new Error("Unsupported file type"), { code: "unsupported-type" });
    if (file.size > MAX_DOCX_BYTES) throw Object.assign(new Error("File too large"), { code: "file-too-large" });
    const buffer = file.arrayBuffer ? await file.arrayBuffer() : file;
    const zip = await readZipEntries(buffer);
    const entry = TEXT_XML_PATHS.map((path) => zip.get(path)).find(Boolean);
    if (!entry) throw Object.assign(new Error("Could not parse document"), { code: "parse-failed" });
    const xml = new TextDecoder("utf-8").decode(entry.content);
    const stylesEntry = zip.get("word/styles.xml");
    const styleMap = stylesEntry ? extractStyleMapFromStylesXml(new TextDecoder("utf-8").decode(stylesEntry.content)) : null;
    const blocks = extractDocumentBlocksFromDocumentXml(xml, styleMap);
    const paragraphs = blocks.filter((block) => block.type === "paragraph").map((block) => block.text);
    const rawText = paragraphs.join("\n");
    if (!rawText.trim()) throw Object.assign(new Error("Empty document"), { code: "empty-document" });
    return {
      fileName: file.name || "document.docx",
      rawText,
      paragraphs,
      blocks,
      characterCount: rawText.length,
      wordCount: wordCountForText(rawText),
      analysisResults: null
    };
  }

  const API = { MAX_DOCX_BYTES, isDocxFile, readZipEntries, extractParagraphsFromDocumentXml, extractDocumentBlocksFromDocumentXml, extractRunProperties, extractStyleMapFromStylesXml, wordCountForText, extractDocxText };
  if (typeof module !== "undefined" && module.exports) module.exports = API;
  else global.TextSanitizerDocument = Object.assign(global.TextSanitizerDocument || {}, API);
})(typeof window !== "undefined" ? window : globalThis);
