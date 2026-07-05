(function (global) {
  "use strict";

  const PRESET_DESCRIPTIONS = Object.freeze({
    standard: "Best default for punctuation, spacing, lists, and compatibility cleanup.",
    lightCleanup: "Minimal cleanup. Preserves more original punctuation and formatting.",
    strictPlainText: "Removes rich formatting and aggressively normalizes output for safe plain text."
  });

  const PRESETS = Object.freeze({
    standard: {
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
      replaceSymbolsAscii: true
    },
    lightCleanup: {
      removeHidden: true,
      normalizeLineEndings: true,
      normalizeSeparators: true,
      normalizeSpaces: true,
      trimTrailingSpaces: true,
      limitBlankLines: false,
      collapseRepeatedSpaces: false,
      convertTabs: false,
      normalizeQuotes: false,
      preservePrimeMarks: true,
      normalizeDashes: false,
      normalizeEllipsis: false,
      convertBullets: false,
      normalizeFullwidth: false,
      expandLigatures: false,
      normalizeFractions: false,
      normalizeSuperscriptsSubscripts: false,
      removeEmoji: false,
      smartQuotes: false,
      smartDashes: false,
      numericRangesToEnDash: false,
      smartEllipsis: false,
      smartFractions: false,
      measurementPrimes: false,
      strictAscii: false,
      foldAccents: false,
      replaceSymbolsAscii: false
    },
    strictPlainText: {
      removeHidden: true,
      normalizeLineEndings: true,
      normalizeSeparators: true,
      normalizeSpaces: true,
      trimTrailingSpaces: true,
      limitBlankLines: true,
      collapseRepeatedSpaces: true,
      convertTabs: true,
      normalizeQuotes: true,
      preservePrimeMarks: false,
      normalizeDashes: true,
      normalizeEllipsis: true,
      convertBullets: false,
      normalizeFullwidth: true,
      expandLigatures: true,
      normalizeFractions: true,
      normalizeSuperscriptsSubscripts: true,
      removeEmoji: true,
      smartQuotes: false,
      smartDashes: false,
      numericRangesToEnDash: false,
      smartEllipsis: false,
      smartFractions: false,
      measurementPrimes: false,
      strictAscii: true,
      foldAccents: true,
      replaceSymbolsAscii: true
    }
  });

  const API = {
    PRESET_DESCRIPTIONS,
    PRESETS
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = API;
  } else {
    global.TextSanitizerConfig = Object.assign(global.TextSanitizerConfig || {}, API);
  }
})(typeof window !== "undefined" ? window : globalThis);
