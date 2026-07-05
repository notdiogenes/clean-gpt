(function (global) {
  "use strict";

  const OPTION_EXAMPLES = Object.freeze({
    detectLists: "Finds list markers like - item or 1. item and keeps list structure.",
    preferHtmlPaste: "Uses clipboard HTML first so pasted paragraphs and lists survive.",
    removeHidden: "Removes zero-width/directional marks such as U+200B.",
    normalizeLineEndings: "CRLF/CR line breaks → LF line breaks.",
    normalizeSeparators: "Unicode line separator → normal line break.",
    normalizeSpaces: "No-break/thin spaces → regular spaces.",
    trimTrailingSpaces: "Text followed by spaces at line end → text.",
    limitBlankLines: "Three or more blank lines → one blank line.",
    collapseRepeatedSpaces: "Multiple spaces between words → one space.",
    convertTabs: "Tab → two spaces.",
    normalizeQuotes: "Curly quotes like “text” → keyboard quotes before destination styling.",
    preservePrimeMarks: "Keeps existing feet/inches marks like 5′10″ when normalizing quotes.",
    normalizeDashes: "Dash variants like – or — → - or destination-specific dash.",
    normalizeEllipsis: "Ellipsis/dot leaders like … → ... before destination styling.",
    normalizeFullwidth: "Fullwidth ＡＢＣ or １２３ → ABC or 123.",
    expandLigatures: "Ligatures like ﬁ or ﬂ → fi or fl.",
    normalizeFractions: "Single-character fractions like ½ → 1/2.",
    normalizeSuperscriptsSubscripts: "Superscripts/subscripts like x² or H₂O → x2 or H2O.",
    removeEmoji: "Removes pictographic symbols such as 😀.",
    smartQuotes: "Keyboard quotes → smart quotes for document destinations.",
    smartDashes: " --  → — for document destinations.",
    numericRangesToEnDash: "Numeric ranges like 1-5 → 1–5.",
    smartEllipsis: "Three dots ... → ellipsis character ….",
    smartFractions: "Typed fractions like 1/2 → ½.",
    measurementPrimes: `Feet/inches like 5'10" → 5′10″.`,
    structuredListsForDocs: "Copies <ul>/<ol> list HTML for Docs, Word, and Outlook.",
    gmailListsAsHyphenLines: "Gmail lists become plain hyphen lines instead of HTML lists.",
    strictAscii: "Non-ASCII characters are removed or replaced.",
    foldAccents: "Accented letters like é → e in strict mode.",
    replaceSymbolsAscii: "Symbols like ©, ™, → → (C), TM, -> in strict mode.",
    showInvisibles: "Displays spaces, tabs, and hidden characters in the input preview."
  });

  const API = {
    OPTION_EXAMPLES
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = API;
  } else {
    global.TextSanitizerConfig = Object.assign(global.TextSanitizerConfig || {}, API);
  }
})(typeof window !== "undefined" ? window : globalThis);
