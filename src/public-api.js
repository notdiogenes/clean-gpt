import "./config/destinations.js";
import "./config/presets.js";
import "./config/option-defaults.js";

import "./core/unicode-data.js";
import "./core/regex.js";
import "./core/stats.js";
import "./core/sanitize-source.js";
import "./core/destination-typography.js";
import "./core/strict-ascii.js";
import "./core/diagnostics.js";
import "./core/options.js";
import "./core/sanitize.js";

import "./document/doc-model.js";
import "./document/serialize-plain-text.js";
import "./document/parse-plain-text.js";
import "./document/parse-html.js";
import "./document/sanitize-doc.js";
import "./document/docx-extract.js";
import "./document/document-analysis.js";

import "./html/escape.js";
import "./html/style-attributes.js";
import "./html/gmail-html.js";
import "./html/document-html.js";

const globalScope = typeof window !== "undefined" ? window : globalThis;
const config = globalScope.TextSanitizerConfig || {};
const core = globalScope.TextSanitizerCore || {};
const documentApi = globalScope.TextSanitizerDocument || {};
const htmlApi = globalScope.TextSanitizerHtml || {};

export const { PRESETS, DESTINATIONS, OPTION_DEFAULTS } = config;
export const { sanitize, buildOptions } = core;
export const { parsePlainTextToDoc, parseHtmlToDoc, sanitizeDoc, docToPlainText, isDocxFile, extractDocxText, analyzeDocumentText, buildIssueGroups } = documentApi;
export const { buildGmailHtml, buildGmailHtmlFromDoc, buildDocumentHtmlFromDoc } = htmlApi;
