(function (global) {
  "use strict";

  const OPTION_DEFAULTS = Object.freeze({
    removeHidden: true,
    normalizeLineEndings: true,
    normalizeSeparators: true,
    normalizeSpaces: true,
    trimTrailingSpaces: true,
    limitBlankLines: true,
    collapseRepeatedSpaces: false,
    convertTabs: false,
    normalizeQuotes: true,
    preservePrimeMarks: true,
    normalizeDashes: true,
    normalizeEllipsis: true,
    convertBullets: false,
    normalizeFullwidth: true,
    expandLigatures: true,
    normalizeFractions: true,
    normalizeSuperscriptsSubscripts: false,
    removeEmoji: false,
    smartQuotes: false,
    smartDashes: false,
    numericRangesToEnDash: false,
    smartEllipsis: false,
    smartFractions: false,
    measurementPrimes: false,
    strictAscii: false,
    foldAccents: true,
    replaceSymbolsAscii: true,
    detectLists: true,
    preferHtmlPaste: true,
    structuredListsForDocs: true,
    gmailListsAsHyphenLines: false,
    showInvisibles: false
  });

  const API = {
    OPTION_DEFAULTS
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = API;
  } else {
    global.TextSanitizerConfig = Object.assign(global.TextSanitizerConfig || {}, API);
  }
})(typeof window !== "undefined" ? window : globalThis);
