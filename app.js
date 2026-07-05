(function (global) {
  "use strict";

  const config = typeof require === "function"
    ? Object.assign(
      {},
      require("./src/config/destinations"),
      require("./src/config/presets"),
      require("./src/config/option-defaults")
    )
    : global.TextSanitizerConfig;

  const optionsCore = typeof require === "function" ? require("./src/core/options") : global.TextSanitizerCore;
  const sanitizeCore = typeof require === "function" ? require("./src/core/sanitize") : global.TextSanitizerCore;
  const htmlEscapeCore = typeof require === "function" ? require("./src/html/escape") : global.TextSanitizerHtml;
  const htmlStyleCore = typeof require === "function" ? require("./src/html/style-attributes") : global.TextSanitizerHtml;
  const gmailHtmlCore = typeof require === "function" ? require("./src/html/gmail-html") : global.TextSanitizerHtml;
  const documentHtmlCore = typeof require === "function" ? require("./src/html/document-html") : global.TextSanitizerHtml;
  const plainTextDocumentParser = typeof require === "function" ? require("./src/document/parse-plain-text") : global.TextSanitizerDocument;
  const htmlDocumentParser = typeof require === "function" ? require("./src/document/parse-html") : global.TextSanitizerDocument;
  const plainTextDocumentSerializer = typeof require === "function" ? require("./src/document/serialize-plain-text") : global.TextSanitizerDocument;
  const documentSanitizer = typeof require === "function" ? require("./src/document/sanitize-doc") : global.TextSanitizerDocument;
  const docxExtractor = typeof require === "function" ? require("./src/document/docx-extract") : global.TextSanitizerDocument;
  const documentAnalysis = typeof require === "function" ? require("./src/document/document-analysis") : global.TextSanitizerDocument;
  const uiController = typeof require === "function" ? require("./src/ui/app-controller") : global.TextSanitizerUi;

  const API = Object.assign({}, {
    sanitize: sanitizeCore.sanitize,
    htmlEscape: htmlEscapeCore.htmlEscape,
    htmlEscapeWithBreaks: htmlEscapeCore.htmlEscapeWithBreaks,
    gmailStyleFromOptions: htmlStyleCore.gmailStyleFromOptions,
    destinationStyleFromOptions: htmlStyleCore.destinationStyleFromOptions,
    styleAttributeFromOptions: htmlStyleCore.styleAttributeFromOptions,
    buildGmailHtml: gmailHtmlCore.buildGmailHtml,
    docBlocksAsGmailLines: gmailHtmlCore.docBlocksAsGmailLines,
    buildGmailLineDiv: gmailHtmlCore.buildGmailLineDiv,
    buildGmailListHtml: gmailHtmlCore.buildGmailListHtml,
    buildGmailHtmlFromDoc: gmailHtmlCore.buildGmailHtmlFromDoc,
    buildDocumentHtmlFromDoc: documentHtmlCore.buildDocumentHtmlFromDoc,
    parsePlainTextToDoc: plainTextDocumentParser.parsePlainTextToDoc,
    parseHtmlToDoc: htmlDocumentParser.parseHtmlToDoc,
    sanitizeDoc: documentSanitizer.sanitizeDoc,
    docToPlainText: plainTextDocumentSerializer.docToPlainText,
    buildOptions: optionsCore.buildOptions,
    PRESETS: config.PRESETS,
    DESTINATIONS: config.DESTINATIONS,
    OPTION_DEFAULTS: config.OPTION_DEFAULTS,
    isDocxFile: docxExtractor.isDocxFile,
    extractDocxText: docxExtractor.extractDocxText,
    extractParagraphsFromDocumentXml: docxExtractor.extractParagraphsFromDocumentXml,
    analyzeDocumentText: documentAnalysis.analyzeDocumentText,
    buildIssueGroups: documentAnalysis.buildIssueGroups
  }, uiController ? { startApp: uiController.startApp } : {});

  if (typeof module !== "undefined" && module.exports) module.exports = API;
  else global.TextSanitizer = API;

  if (typeof document !== "undefined" && API.startApp) {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", API.startApp);
    else API.startApp();
  }
})(typeof window !== "undefined" ? window : globalThis);
