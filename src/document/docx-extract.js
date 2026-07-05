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
    const paragraphs = extractParagraphsFromDocumentXml(xml);
    const rawText = paragraphs.join("\n");
    if (!rawText.trim()) throw Object.assign(new Error("Empty document"), { code: "empty-document" });
    return {
      fileName: file.name || "document.docx",
      rawText,
      paragraphs,
      characterCount: rawText.length,
      wordCount: wordCountForText(rawText),
      analysisResults: null
    };
  }

  const API = { MAX_DOCX_BYTES, isDocxFile, readZipEntries, extractParagraphsFromDocumentXml, wordCountForText, extractDocxText };
  if (typeof module !== "undefined" && module.exports) module.exports = API;
  else global.TextSanitizerDocument = Object.assign(global.TextSanitizerDocument || {}, API);
})(typeof window !== "undefined" ? window : globalThis);
