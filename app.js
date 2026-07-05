(function (global) {
  "use strict";

  const CHAR_NAMES = Object.freeze({
    0x0009: "CHARACTER TABULATION",
    0x000A: "LINE FEED",
    0x000D: "CARRIAGE RETURN",
    0x0020: "SPACE",
    0x0021: "EXCLAMATION MARK",
    0x0022: "QUOTATION MARK",
    0x0023: "NUMBER SIGN",
    0x0024: "DOLLAR SIGN",
    0x0025: "PERCENT SIGN",
    0x0026: "AMPERSAND",
    0x0027: "APOSTROPHE",
    0x0028: "LEFT PARENTHESIS",
    0x0029: "RIGHT PARENTHESIS",
    0x002A: "ASTERISK",
    0x002B: "PLUS SIGN",
    0x002C: "COMMA",
    0x002D: "HYPHEN-MINUS",
    0x002E: "FULL STOP",
    0x002F: "SOLIDUS",
    0x0030: "DIGIT ZERO",
    0x0031: "DIGIT ONE",
    0x0032: "DIGIT TWO",
    0x0033: "DIGIT THREE",
    0x0034: "DIGIT FOUR",
    0x0035: "DIGIT FIVE",
    0x0036: "DIGIT SIX",
    0x0037: "DIGIT SEVEN",
    0x0038: "DIGIT EIGHT",
    0x0039: "DIGIT NINE",
    0x003A: "COLON",
    0x003B: "SEMICOLON",
    0x003C: "LESS-THAN SIGN",
    0x003D: "EQUALS SIGN",
    0x003E: "GREATER-THAN SIGN",
    0x003F: "QUESTION MARK",
    0x0040: "COMMERCIAL AT",
    0x005B: "LEFT SQUARE BRACKET",
    0x005C: "REVERSE SOLIDUS",
    0x005D: "RIGHT SQUARE BRACKET",
    0x005E: "CIRCUMFLEX ACCENT",
    0x005F: "LOW LINE",
    0x0060: "GRAVE ACCENT",
    0x007B: "LEFT CURLY BRACKET",
    0x007C: "VERTICAL LINE",
    0x007D: "RIGHT CURLY BRACKET",
    0x007E: "TILDE",
    0x00A0: "NO-BREAK SPACE",
    0x00A2: "CENT SIGN",
    0x00A3: "POUND SIGN",
    0x00A5: "YEN SIGN",
    0x00A9: "COPYRIGHT SIGN",
    0x00AB: "LEFT-POINTING DOUBLE ANGLE QUOTATION MARK",
    0x00AD: "SOFT HYPHEN",
    0x00AE: "REGISTERED SIGN",
    0x00B0: "DEGREE SIGN",
    0x00B1: "PLUS-MINUS SIGN",
    0x00B4: "ACUTE ACCENT",
    0x00B5: "MICRO SIGN",
    0x00B7: "MIDDLE DOT",
    0x00BB: "RIGHT-POINTING DOUBLE ANGLE QUOTATION MARK",
    0x00BC: "VULGAR FRACTION ONE QUARTER",
    0x00BD: "VULGAR FRACTION ONE HALF",
    0x00BE: "VULGAR FRACTION THREE QUARTERS",
    0x034F: "COMBINING GRAPHEME JOINER",
    0x061C: "ARABIC LETTER MARK",
    0x1680: "OGHAM SPACE MARK",
    0x180B: "MONGOLIAN FREE VARIATION SELECTOR ONE",
    0x180C: "MONGOLIAN FREE VARIATION SELECTOR TWO",
    0x180D: "MONGOLIAN FREE VARIATION SELECTOR THREE",
    0x180E: "MONGOLIAN VOWEL SEPARATOR",
    0x2000: "EN QUAD",
    0x2001: "EM QUAD",
    0x2002: "EN SPACE",
    0x2003: "EM SPACE",
    0x2004: "THREE-PER-EM SPACE",
    0x2005: "FOUR-PER-EM SPACE",
    0x2006: "SIX-PER-EM SPACE",
    0x2007: "FIGURE SPACE",
    0x2008: "PUNCTUATION SPACE",
    0x2009: "THIN SPACE",
    0x200A: "HAIR SPACE",
    0x200B: "ZERO WIDTH SPACE",
    0x200C: "ZERO WIDTH NON-JOINER",
    0x200D: "ZERO WIDTH JOINER",
    0x200E: "LEFT-TO-RIGHT MARK",
    0x200F: "RIGHT-TO-LEFT MARK",
    0x2010: "HYPHEN",
    0x2011: "NON-BREAKING HYPHEN",
    0x2012: "FIGURE DASH",
    0x2013: "EN DASH",
    0x2014: "EM DASH",
    0x2015: "HORIZONTAL BAR",
    0x2018: "LEFT SINGLE QUOTATION MARK",
    0x2019: "RIGHT SINGLE QUOTATION MARK",
    0x201A: "SINGLE LOW-9 QUOTATION MARK",
    0x201B: "SINGLE HIGH-REVERSED-9 QUOTATION MARK",
    0x201C: "LEFT DOUBLE QUOTATION MARK",
    0x201D: "RIGHT DOUBLE QUOTATION MARK",
    0x201E: "DOUBLE LOW-9 QUOTATION MARK",
    0x201F: "DOUBLE HIGH-REVERSED-9 QUOTATION MARK",
    0x2022: "BULLET",
    0x2023: "TRIANGULAR BULLET",
    0x2024: "ONE DOT LEADER",
    0x2025: "TWO DOT LEADER",
    0x2026: "HORIZONTAL ELLIPSIS",
    0x2028: "LINE SEPARATOR",
    0x2029: "PARAGRAPH SEPARATOR",
    0x202A: "LEFT-TO-RIGHT EMBEDDING",
    0x202B: "RIGHT-TO-LEFT EMBEDDING",
    0x202C: "POP DIRECTIONAL FORMATTING",
    0x202D: "LEFT-TO-RIGHT OVERRIDE",
    0x202E: "RIGHT-TO-LEFT OVERRIDE",
    0x202F: "NARROW NO-BREAK SPACE",
    0x2030: "PER MILLE SIGN",
    0x2032: "PRIME",
    0x2033: "DOUBLE PRIME",
    0x2035: "REVERSED PRIME",
    0x2036: "REVERSED DOUBLE PRIME",
    0x2043: "HYPHEN BULLET",
    0x2044: "FRACTION SLASH",
    0x2047: "DOUBLE QUESTION MARK",
    0x2048: "QUESTION EXCLAMATION MARK",
    0x2049: "EXCLAMATION QUESTION MARK",
    0x205F: "MEDIUM MATHEMATICAL SPACE",
    0x2060: "WORD JOINER",
    0x2061: "FUNCTION APPLICATION",
    0x2062: "INVISIBLE TIMES",
    0x2063: "INVISIBLE SEPARATOR",
    0x2064: "INVISIBLE PLUS",
    0x2066: "LEFT-TO-RIGHT ISOLATE",
    0x2067: "RIGHT-TO-LEFT ISOLATE",
    0x2068: "FIRST STRONG ISOLATE",
    0x2069: "POP DIRECTIONAL ISOLATE",
    0x20AC: "EURO SIGN",
    0x2122: "TRADE MARK SIGN",
    0x2190: "LEFTWARDS ARROW",
    0x2191: "UPWARDS ARROW",
    0x2192: "RIGHTWARDS ARROW",
    0x2193: "DOWNWARDS ARROW",
    0x2212: "MINUS SIGN",
    0x2219: "BULLET OPERATOR",
    0x25E6: "WHITE BULLET",
    0x3000: "IDEOGRAPHIC SPACE",
    0xFE00: "VARIATION SELECTOR-1",
    0xFE0F: "VARIATION SELECTOR-16",
    0xFEFF: "ZERO WIDTH NO-BREAK SPACE",
    0xFB00: "LATIN SMALL LIGATURE FF",
    0xFB01: "LATIN SMALL LIGATURE FI",
    0xFB02: "LATIN SMALL LIGATURE FL",
    0xFB03: "LATIN SMALL LIGATURE FFI",
    0xFB04: "LATIN SMALL LIGATURE FFL",
    0xFF02: "FULLWIDTH QUOTATION MARK",
    0xFF07: "FULLWIDTH APOSTROPHE",
    0xFF0D: "FULLWIDTH HYPHEN-MINUS",
    0xFF5E: "FULLWIDTH TILDE"
  });

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

  const GMAIL_FONT_OPTIONS = Object.freeze([
    { label: "Sans Serif", value: "Arial, Helvetica, sans-serif" },
    { label: "Serif", value: "Georgia, 'Times New Roman', serif" },
    { label: "Fixed Width", value: "'Courier New', Courier, monospace" },
    { label: "Wide", value: "Verdana, Geneva, sans-serif" },
    { label: "Narrow", value: "'Arial Narrow', Arial, sans-serif" },
    { label: "Comic Sans MS", value: "'Comic Sans MS', cursive" },
    { label: "Garamond", value: "Garamond, serif" },
    { label: "Georgia", value: "Georgia, serif" },
    { label: "Tahoma", value: "Tahoma, Geneva, sans-serif" },
    { label: "Trebuchet MS", value: "'Trebuchet MS', sans-serif" },
    { label: "Verdana", value: "Verdana, sans-serif" }
  ]);

  const GMAIL_SIZE_OPTIONS = Object.freeze([
    { label: "Small", value: "10px" },
    { label: "Normal", value: "13px" },
    { label: "Large", value: "18px" },
    { label: "Huge", value: "24px" }
  ]);

  const DOCUMENT_FONT_OPTIONS = Object.freeze([
    { label: "Arial", value: "Arial, sans-serif" },
    { label: "Times New Roman", value: "'Times New Roman', serif" },
    { label: "Georgia", value: "Georgia, serif" },
    { label: "Verdana", value: "Verdana, Geneva, sans-serif" },
    { label: "Courier New", value: "'Courier New', Courier, monospace" }
  ]);

  const DOCUMENT_SIZE_OPTIONS = Object.freeze([
    { label: "Normal text (11 pt)", value: "11pt" },
    { label: "Title (26 pt)", value: "26pt" },
    { label: "Subtitle (15 pt)", value: "15pt" },
    { label: "Heading 1 (20 pt)", value: "20pt" },
    { label: "Heading 2 (16 pt)", value: "16pt" },
    { label: "Heading 3 (14 pt)", value: "14pt" },
    { label: "Heading 4 (12 pt)", value: "12pt" },
    { label: "Heading 5 (11 pt)", value: "11pt" },
    { label: "Heading 6 (11 pt)", value: "11pt" }
  ]);

  const PLAIN_FONT_OPTIONS = Object.freeze([
    { label: "Monospace", value: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', monospace" },
    { label: "Sans Serif", value: "Arial, Helvetica, sans-serif" },
    { label: "Serif", value: "Georgia, 'Times New Roman', serif" }
  ]);

  const PLAIN_SIZE_OPTIONS = Object.freeze([
    { label: "Small", value: "0.86rem" },
    { label: "Normal", value: "0.92rem" },
    { label: "Large", value: "1rem" }
  ]);

  const DESTINATIONS = Object.freeze({
    gmail: {
      label: "Gmail",
      copyLabel: "Copy HTML",
      note: "Copies rich HTML with semantic lists and a plain-text fallback.",
      outputClass: "gmail-compose",
      overrides: {
        smartQuotes: false,
        smartDashes: false,
        numericRangesToEnDash: false,
        smartEllipsis: false,
        smartFractions: false,
        measurementPrimes: false,
        strictAscii: false
      }
    },
    googleDocs: {
      label: "Google Docs",
      copyLabel: "Copy HTML",
      note: "Copies rich HTML with semantic lists and a plain-text fallback.",
      outputClass: "document-output",
      overrides: {
        smartQuotes: true,
        smartDashes: true,
        numericRangesToEnDash: true,
        smartEllipsis: true,
        smartFractions: false,
        measurementPrimes: true,
        strictAscii: false
      }
    },
    word: {
      label: "Microsoft Word",
      copyLabel: "Copy HTML",
      note: "Copies rich HTML with semantic lists and a plain-text fallback.",
      outputClass: "document-output",
      overrides: {
        smartQuotes: true,
        smartDashes: true,
        numericRangesToEnDash: true,
        smartEllipsis: true,
        smartFractions: false,
        measurementPrimes: true,
        strictAscii: false
      }
    },

    markdown: {
      label: "Markdown",
      copyLabel: "Copy text",
      note: "Plain Markdown for GitHub, issues, and technical notes. Lists serialize as Markdown markers.",
      outputClass: "markdown-output",
      copyMode: "markdown",
      overrides: {
        smartQuotes: false,
        smartDashes: false,
        numericRangesToEnDash: false,
        smartEllipsis: false,
        smartFractions: false,
        measurementPrimes: false,
        strictAscii: false
      }
    },
    outlook: {
      label: "Outlook",
      copyLabel: "Copy HTML",
      note: "Copies rich HTML with semantic lists and a plain-text fallback.",
      outputClass: "document-output",
      copyMode: "documentHtml",
      overrides: {
        smartQuotes: false,
        smartDashes: false,
        numericRangesToEnDash: false,
        smartEllipsis: false,
        smartFractions: false,
        measurementPrimes: false,
        strictAscii: false
      }
    },
    slack: {
      label: "Slack / Teams",
      copyLabel: "Copy text",
      note: "Markdown-like plain text for chat tools. Avoids rich clipboard HTML.",
      outputClass: "markdown-output",
      copyMode: "markdown",
      overrides: {
        smartQuotes: false,
        smartDashes: false,
        numericRangesToEnDash: false,
        smartEllipsis: false,
        smartFractions: false,
        measurementPrimes: false,
        strictAscii: false
      }
    },
    cms: {
      label: "CMS / web forms",
      copyLabel: "Copy text",
      note: "Plain text for CMS fields and web forms, with conservative character cleanup and preserved paragraph spacing.",
      outputClass: "plain-output",
      copyMode: "plain",
      overrides: {
        smartQuotes: false,
        smartDashes: false,
        numericRangesToEnDash: false,
        smartEllipsis: false,
        smartFractions: false,
        measurementPrimes: false,
        strictAscii: false
      }
    },
    code: {
      label: "Code comments",
      copyLabel: "Copy text",
      note: "Code-safe plain text. Normalizes punctuation to keyboard-safe characters and removes hidden Unicode.",
      outputClass: "strict-output",
      copyMode: "plain",
      overrides: {
        smartQuotes: false,
        smartDashes: false,
        numericRangesToEnDash: false,
        smartEllipsis: false,
        smartFractions: false,
        measurementPrimes: false,
        strictAscii: false,
        collapseRepeatedSpaces: false,
        convertTabs: false
      }
    },
    plain: {
      label: "Plain text / forms",
      copyLabel: "Copy text",
      note: "Keyboard-safe visible characters only. Good for forms, CMS fields, terminals, and places where rich text is a liability.",
      outputClass: "plain-output",
      overrides: {
        smartQuotes: false,
        smartDashes: false,
        numericRangesToEnDash: false,
        smartEllipsis: false,
        smartFractions: false,
        measurementPrimes: false,
        strictAscii: false
      }
    },
    strictAscii: {
      label: "Strict ASCII",
      copyLabel: "Copy text",
      note: "Aggressive compatibility mode. Removes or replaces non-ASCII characters after cleanup.",
      outputClass: "strict-output",
      overrides: {
        smartQuotes: false,
        smartDashes: false,
        numericRangesToEnDash: false,
        smartEllipsis: false,
        smartFractions: false,
        measurementPrimes: false,
        strictAscii: true,
        removeEmoji: true,
        normalizeSuperscriptsSubscripts: true,
        collapseRepeatedSpaces: true,
        convertTabs: true
      }
    }
  });


  const PRESET_DESCRIPTIONS = Object.freeze({
    standard: "Best default for punctuation, spacing, lists, and compatibility cleanup.",
    lightCleanup: "Minimal cleanup. Preserves more original punctuation and formatting.",
    strictPlainText: "Removes rich formatting and aggressively normalizes output for safe plain text."
  });

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

  const SAMPLE_TEXTS = Object.freeze({
    smart: `Here's a “sample” -- with curly quotes, dashes — and ellipsis... and numbers: 1-5 and 6-8.\n\nFeet/inches: 5'10".`,
    hidden: `Zero\u200Bwidth text with a left-to-right mark\u200E and no-break spaces: A\u00A0B.`,
    richList: `- First item\n  - Nested item\n- Second item\n\n1. Ordered item\n2. Another`,
    markdownList: `- Markdown bullet\n- Another bullet\n  1. Nested ordered\n  2. Another nested`,
    ascii: `Café naïve résumé — costs €5 ™ 😀 中文 math: ± × ÷ √ ½ ²`,
    form: `Name:\tJane   Doe\nAddress: 123\u00A0Main St.\n\n\nNotes: copy/paste safe.`,
    code: `TODO — normalize “quotes”, remove zero-width\u200B marks, keep tabs\twhere needed.`
  });

  const DESTINATION_DETAILS = Object.freeze({
    gmail: { format: "rich HTML", list: "semantic lists unless Gmail flattening is enabled", typography: "keyboard punctuation by default", font: "font and size apply to rich HTML", fallback: "HTML only; falls back to visible text if HTML write fails" },
    googleDocs: { format: "rich HTML", list: "semantic ordered/unordered lists", typography: "document smart typography", font: "font and size apply to rich HTML", fallback: "plain-text fallback included" },
    word: { format: "rich HTML", list: "semantic ordered/unordered lists", typography: "document smart typography", font: "font and size apply to rich HTML", fallback: "plain-text fallback included" },
    outlook: { format: "rich HTML", list: "semantic ordered/unordered lists", typography: "conservative typography", font: "font and size apply to rich HTML", fallback: "plain-text fallback included" },
    markdown: { format: "Markdown plain text", list: "Markdown list markers", typography: "plain punctuation", font: "preview-only", fallback: "plain text only" },
    slack: { format: "plain text", list: "Markdown-like list markers", typography: "plain punctuation", font: "preview-only", fallback: "plain text only" },
    cms: { format: "plain text", list: "visible lines/paragraphs", typography: "conservative plain punctuation", font: "preview-only", fallback: "plain text only" },
    code: { format: "plain text", list: "visible lines", typography: "code-safe keyboard punctuation", font: "preview-only", fallback: "plain text only" },
    plain: { format: "plain text", list: "visible lines/paragraphs", typography: "keyboard-safe punctuation", font: "preview-only", fallback: "plain text only" },
    strictAscii: { format: "strict ASCII plain text", list: "visible ASCII lines", typography: "ASCII replacements only", font: "preview-only", fallback: "plain text only" }
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

  const REGEX = Object.freeze({
    hidden: /[\u00AD\u034F\u061C\u115F\u1160\u17B4\u17B5\u180B-\u180E\u200B-\u200F\u202A-\u202E\u2060-\u206F\uFE00-\uFE0F\uFEFF\uFFF9-\uFFFB]|[\u{E0000}-\u{E007F}]/gu,
    unusualSpaces: /[\u00A0\u1680\u2000-\u200A\u202F\u205F\u3000]/gu,
    separators: /\u2028|\u2029/gu,
    curlySingle: /[\u2018\u2019\u201A\u201B\u02BC\u00B4\u0060\uFF07]/gu,
    primeSingle: /[\u2032\u2035]/gu,
    curlyDouble: /[\u201C\u201D\u201E\u201F\u00AB\u00BB\uFF02]/gu,
    primeDouble: /[\u2033\u2036]/gu,
    emDashLike: /[ \t]*[\u2014\u2015][ \t]*/gu,
    enDashLike: /[\u2010\u2011\u2012\u2013\u2212\uFF0D]/gu,
    ellipsis: /\u2026/gu,
    oneDotLeader: /\u2024/gu,
    twoDotLeader: /\u2025/gu,
    bulletLine: /^(\s*)[\u2022\u2023\u25E6\u2043\u2219]\s+/gmu,
    emoji: /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}]/gu,
    combiningMarks: /[\u0300-\u036f]/gu,
    nonAscii: /[^\x00-\x7F]/gu,
    trailingSpaces: /[ \t]+$/gm,
    blankLineRuns: /\n{3,}/g,
    repeatedSpaces: / {2,}/g,
    fullwidthAscii: /[\uFF01-\uFF5E]/gu,
    measurementFeet: /(\d)'(?=\s|$|\d)/g,
    measurementInches: /(\d)"(?=\s|$|\D)/g,
    numericRange: /(\b\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?\b)/g,
    typedEllipsis: /\.\.\./g,
    typedEmDash: /\s--\s/g,
    commonFractionsTyped: /\b(1\/2|1\/4|3\/4)\b/g,
    htmlSensitive: /[&<>]/g
  });

  const MAPS = Object.freeze({
    ligatures: new Map([
      ["ﬀ", "ff"], ["ﬁ", "fi"], ["ﬂ", "fl"], ["ﬃ", "ffi"], ["ﬄ", "ffl"], ["ﬅ", "st"], ["ﬆ", "st"]
    ]),
    fractions: new Map([
      ["¼", "1/4"], ["½", "1/2"], ["¾", "3/4"], ["⅐", "1/7"], ["⅑", "1/9"], ["⅒", "1/10"],
      ["⅓", "1/3"], ["⅔", "2/3"], ["⅕", "1/5"], ["⅖", "2/5"], ["⅗", "3/5"], ["⅘", "4/5"],
      ["⅙", "1/6"], ["⅚", "5/6"], ["⅛", "1/8"], ["⅜", "3/8"], ["⅝", "5/8"], ["⅞", "7/8"]
    ]),
    smartFractions: new Map([["1/2", "½"], ["1/4", "¼"], ["3/4", "¾"]]),
    superSub: new Map([
      ["⁰", "0"], ["¹", "1"], ["²", "2"], ["³", "3"], ["⁴", "4"], ["⁵", "5"], ["⁶", "6"], ["⁷", "7"], ["⁸", "8"], ["⁹", "9"],
      ["₀", "0"], ["₁", "1"], ["₂", "2"], ["₃", "3"], ["₄", "4"], ["₅", "5"], ["₆", "6"], ["₇", "7"], ["₈", "8"], ["₉", "9"],
      ["⁺", "+"], ["⁻", "-"], ["⁼", "="], ["⁽", "("], ["⁾", ")"], ["₊", "+"], ["₋", "-"], ["₌", "="], ["₍", "("], ["₎", ")"],
      ["ᵃ", "a"], ["ᵇ", "b"], ["ᶜ", "c"], ["ᵈ", "d"], ["ᵉ", "e"], ["ᶠ", "f"], ["ᵍ", "g"], ["ʰ", "h"], ["ⁱ", "i"], ["ʲ", "j"], ["ᵏ", "k"], ["ˡ", "l"], ["ᵐ", "m"], ["ⁿ", "n"], ["ᵒ", "o"], ["ᵖ", "p"], ["ʳ", "r"], ["ˢ", "s"], ["ᵗ", "t"], ["ᵘ", "u"], ["ᵛ", "v"], ["ʷ", "w"], ["ˣ", "x"], ["ʸ", "y"], ["ᶻ", "z"]
    ]),
    asciiSymbols: new Map([
      ["©", "(C)"], ["®", "(R)"], ["™", "TM"], ["℠", "SM"], ["°", " degrees"], ["±", "+/-"], ["×", "x"], ["÷", "/"], ["µ", "u"], ["€", "EUR"], ["£", "GBP"], ["¥", "JPY"], ["¢", "c"], ["–", "-"], ["—", " -- "], ["…", "..."], ["•", "-"], ["←", "<-"], ["→", "->"], ["↑", "^"], ["↓", "v"], ["‰", " per mille"], ["†", "*"], ["‡", "**"], ["№", "No."]
    ]),
    html: new Map([["&", "&amp;"], ["<", "&lt;"], [">", "&gt;"]])
  });

  function labelChar(char) {
    if (char === "") return "removed";
    return Array.from(char).map((c) => {
      const cp = c.codePointAt(0);
      const hex = cp.toString(16).toUpperCase().padStart(4, "0");
      return `U+${hex} ${CHAR_NAMES[cp] || "CHARACTER"}`;
    }).join(" + ");
  }

  function visibleChar(char) {
    if (char === " ") return "SPACE";
    if (char === "\n") return "LINE FEED";
    if (char === "\t") return "TAB";
    if (char === "") return "removed";
    return char;
  }

  function makeStats() {
    return {
      sourceChanges: 0,
      destinationChanges: 0,
      hiddenRemoved: 0,
      spacesNormalized: 0,
      lineEndingsNormalized: 0,
      separatorsNormalized: 0,
      trailingSpacesRemoved: 0,
      blankLineRunsReduced: 0,
      repeatedSpacesCollapsed: 0,
      tabsConverted: 0,
      quotesChanged: 0,
      dashesChanged: 0,
      ellipsesChanged: 0,
      bulletsChanged: 0,
      fullwidthChanged: 0,
      ligaturesChanged: 0,
      fractionsChanged: 0,
      superSubChanged: 0,
      emojiRemoved: 0,
      strictAsciiChanged: 0
    };
  }

  function countMatches(text, regex) {
    const flags = regex.flags.includes("g") ? regex.flags : regex.flags + "g";
    const clone = new RegExp(regex.source, flags);
    const matches = text.match(clone);
    return matches ? matches.length : 0;
  }

  function addChange(changes, phase, source, target, count, note) {
    if (!count) return;
    const key = `${phase}|${source}|${target}|${note || ""}`;
    const existing = changes.find((change) => change.key === key);
    if (existing) {
      existing.count += count;
      return;
    }
    changes.push({ key, phase, source, target, count, note: note || "" });
  }

  function replaceMappedChars(text, map, phase, changes, stats, statName, note) {
    let output = "";
    let localCount = 0;
    for (const char of text) {
      if (map.has(char)) {
        const replacement = map.get(char);
        output += replacement;
        localCount += 1;
        addChange(changes, phase, char, replacement, 1, note);
      } else {
        output += char;
      }
    }
    if (localCount) {
      stats[statName] += localCount;
      stats[phase === "Destination" ? "destinationChanges" : "sourceChanges"] += localCount;
    }
    return output;
  }

  function replaceRegex(text, regex, replacement, phase, changes, stats, statName, note, sourceLabel) {
    let count = 0;
    const out = text.replace(regex, (match, ...args) => {
      count += 1;
      const actualReplacement = typeof replacement === "function" ? replacement(match, ...args) : replacement;
      addChange(changes, phase, sourceLabel || match, actualReplacement, 1, note);
      return actualReplacement;
    });
    if (count) {
      stats[statName] += count;
      stats[phase === "Destination" ? "destinationChanges" : "sourceChanges"] += count;
    }
    return out;
  }

  function normalizeFullwidthChar(char) {
    const cp = char.codePointAt(0);
    if (cp >= 0xFF01 && cp <= 0xFF5E) {
      return String.fromCodePoint(cp - 0xFEE0);
    }
    return char;
  }

  function fullwidthMapForText(text) {
    const map = new Map();
    for (const char of text.match(REGEX.fullwidthAscii) || []) {
      map.set(char, normalizeFullwidthChar(char));
    }
    return map;
  }

  function fractionMapForText(text) {
    const map = new Map();
    for (const char of text) {
      if (MAPS.fractions.has(char)) map.set(char, MAPS.fractions.get(char));
    }
    return map;
  }

  function superSubMapForText(text) {
    const map = new Map();
    for (const char of text) {
      if (MAPS.superSub.has(char)) map.set(char, MAPS.superSub.get(char));
    }
    return map;
  }

  function buildOptions(destination, presetOptions, uiOptions) {
    return Object.assign(
      {},
      OPTION_DEFAULTS,
      presetOptions || {},
      (DESTINATIONS[destination] || DESTINATIONS.gmail).overrides,
      uiOptions || {}
    );
  }

  function sanitizeSource(input, options) {
    let text = String(input == null ? "" : input);
    const stats = makeStats();
    const changes = [];

    if (options.normalizeLineEndings) {
      const crlf = countMatches(text, /\r\n/g);
      const cr = countMatches(text.replace(/\r\n/g, ""), /\r/g);
      if (crlf || cr) {
        text = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
        stats.lineEndingsNormalized += crlf + cr;
        stats.sourceChanges += crlf + cr;
        if (crlf) addChange(changes, "Source", "\r\n", "\n", crlf, "Line endings normalized");
        if (cr) addChange(changes, "Source", "\r", "\n", cr, "Line endings normalized");
      }
    }

    if (options.normalizeSeparators) {
      text = replaceRegex(text, /\u2028/gu, "\n", "Source", changes, stats, "separatorsNormalized", "Unicode separator normalized");
      text = replaceRegex(text, /\u2029/gu, "\n\n", "Source", changes, stats, "separatorsNormalized", "Unicode separator normalized");
    }

    if (options.removeHidden) {
      text = replaceRegex(text, REGEX.hidden, "", "Source", changes, stats, "hiddenRemoved", "Hidden or formatting character removed");
    }

    if (options.normalizeSpaces) {
      text = replaceRegex(text, REGEX.unusualSpaces, " ", "Source", changes, stats, "spacesNormalized", "Unusual space normalized");
    }

    if (options.normalizeFullwidth) {
      text = replaceMappedChars(text, fullwidthMapForText(text), "Source", changes, stats, "fullwidthChanged", "Fullwidth ASCII normalized");
    }

    if (options.convertTabs) {
      text = replaceRegex(text, /\t/g, "  ", "Source", changes, stats, "tabsConverted", "Tab converted to two spaces");
    }

    if (options.normalizeQuotes) {
      text = replaceRegex(text, REGEX.curlySingle, "'", "Source", changes, stats, "quotesChanged", "Quote-like character normalized");
      text = replaceRegex(text, REGEX.curlyDouble, '"', "Source", changes, stats, "quotesChanged", "Quote-like character normalized");
      if (!options.preservePrimeMarks) {
        text = replaceRegex(text, REGEX.primeSingle, "'", "Source", changes, stats, "quotesChanged", "Prime mark normalized");
        text = replaceRegex(text, REGEX.primeDouble, '"', "Source", changes, stats, "quotesChanged", "Prime mark normalized");
      }
    }

    if (options.normalizeDashes) {
      text = replaceRegex(text, REGEX.emDashLike, " -- ", "Source", changes, stats, "dashesChanged", "Em-dash-like character normalized");
      text = replaceRegex(text, REGEX.enDashLike, "-", "Source", changes, stats, "dashesChanged", "Dash-like character normalized");
    }

    if (options.normalizeEllipsis) {
      text = replaceRegex(text, REGEX.ellipsis, "...", "Source", changes, stats, "ellipsesChanged", "Ellipsis normalized");
      text = replaceRegex(text, REGEX.twoDotLeader, "..", "Source", changes, stats, "ellipsesChanged", "Dot leader normalized");
      text = replaceRegex(text, REGEX.oneDotLeader, ".", "Source", changes, stats, "ellipsesChanged", "Dot leader normalized");
    }

    if (options.convertBullets) {
      let bulletCount = 0;
      text = text.replace(REGEX.bulletLine, (match, indent) => {
        bulletCount += 1;
        addChange(changes, "Source", match.trim().slice(0, 1), "-", 1, "Line-start bullet converted");
        return `${indent}- `;
      });
      if (bulletCount) {
        stats.bulletsChanged += bulletCount;
        stats.sourceChanges += bulletCount;
      }
    }

    if (options.expandLigatures) {
      text = replaceMappedChars(text, MAPS.ligatures, "Source", changes, stats, "ligaturesChanged", "Ligature expanded");
    }

    if (options.normalizeFractions) {
      text = replaceMappedChars(text, fractionMapForText(text), "Source", changes, stats, "fractionsChanged", "Single-character fraction converted");
    }

    if (options.normalizeSuperscriptsSubscripts) {
      text = replaceMappedChars(text, superSubMapForText(text), "Source", changes, stats, "superSubChanged", "Superscript/subscript flattened");
    }

    if (options.removeEmoji) {
      text = replaceRegex(text, REGEX.emoji, "", "Source", changes, stats, "emojiRemoved", "Emoji or pictographic symbol removed");
    }

    if (options.trimTrailingSpaces) {
      let removed = 0;
      text = text.replace(REGEX.trailingSpaces, (match) => {
        removed += match.length;
        return "";
      });
      if (removed) {
        stats.trailingSpacesRemoved += removed;
        stats.sourceChanges += removed;
        addChange(changes, "Source", "trailing spaces", "removed", removed, "Trailing spaces removed");
      }
    }

    if (options.collapseRepeatedSpaces) {
      let runs = 0;
      text = text.replace(REGEX.repeatedSpaces, (match) => {
        runs += 1;
        addChange(changes, "Source", `${match.length} spaces`, "1 space", 1, "Repeated spaces collapsed");
        return " ";
      });
      if (runs) {
        stats.repeatedSpacesCollapsed += runs;
        stats.sourceChanges += runs;
      }
    }

    if (options.limitBlankLines) {
      let runs = 0;
      text = text.replace(REGEX.blankLineRuns, (match) => {
        runs += 1;
        addChange(changes, "Source", `${match.length} line feeds`, "2 line feeds", 1, "Extra blank lines reduced");
        return "\n\n";
      });
      if (runs) {
        stats.blankLineRunsReduced += runs;
        stats.sourceChanges += runs;
      }
    }

    const trimmed = text.replace(/^\n+|\n+$/g, "");
    if (trimmed !== text && (options.limitBlankLines || options.trimTrailingSpaces)) {
      addChange(changes, "Source", "outer blank lines", "removed", 1, "Leading/trailing blank lines trimmed");
      stats.sourceChanges += 1;
      text = trimmed;
    }

    return { text, changes, stats };
  }

  function isOpeningContext(previousChar) {
    return previousChar == null || /[\s([{<\/\-–—]/.test(previousChar);
  }

  function isWordChar(char) {
    return /[A-Za-z0-9]/.test(char || "");
  }

  function applySmartQuotes(text, changes, stats) {
    let output = "";
    for (let i = 0; i < text.length; i += 1) {
      const char = text[i];
      const prev = output.length ? output[output.length - 1] : null;
      const next = text[i + 1] || null;
      if (char === '"') {
        const replacement = isOpeningContext(prev) ? "“" : "”";
        output += replacement;
        addChange(changes, "Destination", '"', replacement, 1, "Smart double quote applied");
        stats.quotesChanged += 1;
        stats.destinationChanges += 1;
      } else if (char === "'") {
        let replacement;
        if (isWordChar(prev) && isWordChar(next)) {
          replacement = "’";
        } else if (/^\d$/.test(prev || "") && (next == null || /\s|\d|\W/.test(next))) {
          replacement = "′";
        } else {
          replacement = isOpeningContext(prev) ? "‘" : "’";
        }
        output += replacement;
        addChange(changes, "Destination", "'", replacement, 1, replacement === "′" ? "Measurement prime applied" : "Smart single quote/apostrophe applied");
        stats.quotesChanged += 1;
        stats.destinationChanges += 1;
      } else {
        output += char;
      }
    }
    return output;
  }

  function applyDestinationTypography(sourceText, options, changes, stats) {
    let text = sourceText;

    if (options.measurementPrimes) {
      text = replaceRegex(text, REGEX.measurementFeet, (match, digit) => `${digit}′`, "Destination", changes, stats, "quotesChanged", "Typed feet mark converted to prime", "digit + apostrophe");
      text = replaceRegex(text, REGEX.measurementInches, (match, digit) => `${digit}″`, "Destination", changes, stats, "quotesChanged", "Typed inch mark converted to double prime", "digit + quotation mark");
    }

    if (options.smartDashes) {
      text = replaceRegex(text, REGEX.typedEmDash, "—", "Destination", changes, stats, "dashesChanged", "Double hyphen converted to em dash", "space + -- + space");
    }

    if (options.numericRangesToEnDash) {
      text = text.replace(REGEX.numericRange, (match, left, right) => {
        if (match.includes("–")) return match;
        addChange(changes, "Destination", "numeric hyphen range", "numeric en dash range", 1, "Numeric range converted to en dash");
        stats.dashesChanged += 1;
        stats.destinationChanges += 1;
        return `${left}–${right}`;
      });
    }

    if (options.smartEllipsis) {
      text = replaceRegex(text, REGEX.typedEllipsis, "…", "Destination", changes, stats, "ellipsesChanged", "Three periods converted to ellipsis", "three full stops");
    }

    if (options.smartFractions) {
      text = text.replace(REGEX.commonFractionsTyped, (match) => {
        const replacement = MAPS.smartFractions.get(match) || match;
        if (replacement !== match) {
          addChange(changes, "Destination", match, replacement, 1, "Typed fraction converted");
          stats.fractionsChanged += 1;
          stats.destinationChanges += 1;
        }
        return replacement;
      });
    }

    if (options.smartQuotes) {
      text = applySmartQuotes(text, changes, stats);
    }

    return text;
  }

  function applyStrictAscii(sourceText, options, changes, stats) {
    let text = sourceText;
    if (!options.strictAscii) return text;

    if (options.replaceSymbolsAscii) {
      text = replaceMappedChars(text, MAPS.asciiSymbols, "Source", changes, stats, "strictAsciiChanged", "Common symbol replaced for ASCII");
    }

    if (options.foldAccents) {
      const before = text;
      text = text.normalize("NFKD").replace(REGEX.combiningMarks, "");
      if (text !== before) {
        addChange(changes, "Source", "accented/compatibility characters", "ASCII decomposition", 1, "Accents folded");
        stats.strictAsciiChanged += 1;
        stats.sourceChanges += 1;
      }
    }

    let removed = 0;
    text = text.replace(REGEX.nonAscii, (match) => {
      removed += 1;
      addChange(changes, "Source", match, "", 1, "Remaining non-ASCII removed");
      return "";
    });
    if (removed) {
      stats.strictAsciiChanged += removed;
      stats.sourceChanges += removed;
    }
    return text;
  }

  function getDiagnostics(text) {
    const warnings = [];
    const nonAscii = new Map();
    const hidden = countMatches(text, REGEX.hidden);

    if (hidden) warnings.push(`${hidden} hidden or formatting character(s) remain.`);

    for (const char of text) {
      if (char.codePointAt(0) > 127) {
        const label = `${labelChar(char)} ${char}`;
        nonAscii.set(label, (nonAscii.get(label) || 0) + 1);
      }
    }

    if (nonAscii.size) warnings.push(`${nonAscii.size} type(s) of non-ASCII character remain.`);

    return {
      warnings,
      remainingNonAscii: Array.from(nonAscii.entries()).map(([label, count]) => ({ label, count }))
    };
  }

  function sanitize(input, options) {
    const mergedOptions = Object.assign({}, OPTION_DEFAULTS, options || {});
    const source = sanitizeSource(input, mergedOptions);
    let text = applyDestinationTypography(source.text, mergedOptions, source.changes, source.stats);
    text = applyStrictAscii(text, mergedOptions, source.changes, source.stats);
    const diagnostics = getDiagnostics(text);
    return {
      cleanText: text,
      changes: source.changes,
      stats: source.stats,
      warnings: diagnostics.warnings,
      remainingNonAscii: diagnostics.remainingNonAscii,
      options: mergedOptions
    };
  }

  function htmlEscape(text) {
    return String(text).replace(REGEX.htmlSensitive, (char) => MAPS.html.get(char));
  }

  function gmailStyleFromOptions(options) {
    const mergedOptions = options || {};
    const fontFamily = mergedOptions.gmailFontFamily || "verdana, sans-serif";
    const fontSize = mergedOptions.gmailFontSize || "";
    const declarations = [`font-family: ${fontFamily};`];
    if (fontSize) declarations.push(`font-size: ${fontSize};`);
    return {
      fontFamily,
      fontSize: fontSize || "10pt",
      inline: declarations.join(" ")
    };
  }


  function destinationStyleFromOptions(options) {
    const mergedOptions = options || {};
    const destination = mergedOptions.destination || "plain";
    const isGmail = destination === "gmail";
    const isDocument = destination === "googleDocs" || destination === "word" || destination === "outlook";
    const defaultFont = isGmail ? "Verdana, sans-serif" : (isDocument ? "Arial, sans-serif" : "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', monospace");
    const defaultSize = isGmail ? "13px" : (isDocument ? "11pt" : "0.92rem");
    return {
      fontFamily: mergedOptions.textFontFamily || mergedOptions.gmailFontFamily || defaultFont,
      fontSize: mergedOptions.textFontSize || mergedOptions.gmailFontSize || defaultSize
    };
  }

  function styleAttributeFromOptions(options) {
    const style = destinationStyleFromOptions(options);
    return `font-family: ${style.fontFamily}; font-size: ${style.fontSize};`;
  }

  function buildGmailHtml(text) {
    const lines = String(text || "").replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
    const nonEmptyIndexes = lines.map((line, index) => line.trim() ? index : -1).filter((index) => index >= 0);
    const lastTextIndex = nonEmptyIndexes.length ? nonEmptyIndexes[nonEmptyIndexes.length - 1] : -1;
    const divs = lines.map((line, index) => {
      const style = gmailStyleFromOptions(OPTION_DEFAULTS);
      const prefix = `<div class="gmail_default" style="${style.inline}">`;
      if (!line) return `${prefix}<br></div>`;
      const suffix = index === lastTextIndex ? "<br></div>" : "</div>";
      return `${prefix}${htmlEscape(line)}${suffix}`;
    });
    return `<div>${divs.join("")}<br clear="all"></div>`;
  }


  function normalizeBlockText(text) {
    return String(text == null ? "" : text).replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  }

  let nextBlockId = 1;

  function assignStableIds(blocks) {
    (blocks || []).forEach((block) => {
      if (!block.id) block.id = `block-${nextBlockId++}`;
      if (block.type === "ul" || block.type === "ol") {
        (block.items || []).forEach((item) => {
          if (!item.id) item.id = `item-${nextBlockId++}`;
          assignStableIds(item.children || []);
        });
      }
    });
  }

  function makeDoc(blocks, meta) {
    const docBlocks = Array.isArray(blocks) ? blocks : [];
    assignStableIds(docBlocks);
    return {
      blocks: docBlocks,
      meta: Object.assign({ source: "manual", htmlAvailable: false, plainAvailable: false, lists: 0, listItems: 0 }, meta || {})
    };
  }

  function itemTextWithChildren(item) {
    const parts = [item && item.text ? item.text : ""];
    (item && item.children || []).forEach((child) => parts.push(blockText(child)));
    return parts.filter(Boolean).join("\n");
  }

  function blockText(block) {
    if (!block) return "";
    if (block.type === "ul" || block.type === "ol") return (block.items || []).map(itemTextWithChildren).join("\n");
    return block.text || "";
  }

  function countDocLists(blocks) {
    let lists = 0;
    let items = 0;
    function visit(block) {
      if (!block) return;
      if (block.type === "ul" || block.type === "ol") {
        lists += 1;
        items += (block.items || []).length;
        (block.items || []).forEach((item) => (item.children || []).forEach(visit));
      }
    }
    (blocks || []).forEach(visit);
    return { lists, items };
  }

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
      if (child.tagName !== "LI") return;
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

  function docToPlainText(doc, destination) {
    const lines = [];
    const markdownLike = destination === "markdown" || destination === "slack";
    function appendList(block, depth) {
      (block.items || []).forEach((item, index) => {
        const indent = markdownLike ? "  ".repeat(depth) : "";
        const marker = block.type === "ol" ? `${index + 1}.` : ((destination === "plain" || destination === "strictAscii" || markdownLike || destination === "cms" || destination === "code") ? "-" : "•");
        lines.push(`${indent}${marker} ${item.text || ""}`);
        (item.children || []).forEach((child) => appendList(child, depth + 1));
      });
    }
    (doc.blocks || []).forEach((block) => {
      if (block.type === "blank") {
        lines.push("");
      } else if (block.type === "paragraph") {
        lines.push(block.text || "");
      } else if (block.type === "ul" || block.type === "ol") {
        appendList(block, 0);
      }
    });
    return lines.join("\n");
  }

  function mergeStats(target, source) {
    Object.keys(source || {}).forEach((key) => {
      if (typeof source[key] === "number") target[key] = (target[key] || 0) + source[key];
    });
  }

  function sanitizeTextPart(text, options, aggregateChanges, aggregateStats) {
    const source = sanitizeSource(text, options);
    let clean = applyDestinationTypography(source.text, options, source.changes, source.stats);
    clean = applyStrictAscii(clean, options, source.changes, source.stats);
    aggregateChanges.push(...source.changes);
    mergeStats(aggregateStats, source.stats);
    return clean;
  }

  function sanitizeDoc(doc, options) {
    const stats = makeStats();
    const changes = [];
    const outBlocks = (doc.blocks || []).map((block) => {
      if (block.type === "paragraph") return { type: "paragraph", id: block.id, text: sanitizeTextPart(block.text || "", options, changes, stats) };
      if (block.type === "blank") return { type: "blank", id: block.id };
      if (block.type === "ul" || block.type === "ol") {
        function sanitizeItem(item) {
          const children = (item.children || []).map(sanitizeListBlock).filter((child) => child.items.length);
          return Object.assign({ id: item.id, text: sanitizeTextPart(item.text || "", options, changes, stats) }, children.length ? { children } : {});
        }
        function sanitizeListBlock(listBlock) {
          return { type: listBlock.type, id: listBlock.id, items: (listBlock.items || []).map(sanitizeItem) };
        }
        return sanitizeListBlock(block);
      }
      return { type: "paragraph", id: block.id, text: sanitizeTextPart(blockText(block), options, changes, stats) };
    }).filter((block) => block.type === "blank" || block.type === "paragraph" || block.items?.length);
    const outputDoc = makeDoc(outBlocks, Object.assign({}, doc.meta));
    const visibleText = docToPlainText(outputDoc, options.destination || "gmail");
    const diagnostics = getDiagnostics(visibleText);
    return {
      doc: outputDoc,
      cleanText: visibleText,
      changes,
      stats,
      warnings: diagnostics.warnings,
      remainingNonAscii: diagnostics.remainingNonAscii,
      options
    };
  }

  function htmlEscapeWithBreaks(text) {
    return htmlEscape(text).replace(/\n/g, "<br>");
  }

  function visualizeInvisibles(text) {
    const labels = new Map([
      ["\t", "→"],
      ["\u00a0", "⍽"],
      ["\u00ad", "[SHY]"],
      ["\u200b", "[ZWSP]"],
      ["\u200c", "[ZWNJ]"],
      ["\u200d", "[ZWJ]"],
      ["\u200e", "[LRM]"],
      ["\u200f", "[RLM]"],
      ["\u2028", "[LS]"],
      ["\u2029", "[PS]"],
      ["\u2060", "[WJ]"],
      ["\ufeff", "[BOM]"]
    ]);
    return String(text || "").replace(/[\u0009\u00a0\u00ad\u034f\u061c\u180e\u2000-\u200f\u2028-\u202f\u205f\u2060-\u2069\ufeff]|[\u{E0000}-\u{E007F}]/gu, (char) => {
      return labels.get(char) || `[${labelChar(char).split(" ")[0]}]`;
    });
  }


  function docBlocksAsGmailLines(doc, options) {
    const lines = [];
    (doc.blocks || []).forEach((block) => {
      if (block.type === "blank") {
        lines.push("");
      } else if (block.type === "paragraph") {
        const text = block.text || "";
        const split = text.split("\n");
        split.forEach((line) => lines.push(line));
      } else if (block.type === "ul" || block.type === "ol") {
        function appendList(listBlock, depth) {
          (listBlock.items || []).forEach((item, index) => {
            const marker = listBlock.type === "ol" ? `${index + 1}. ` : (options.gmailListsAsHyphenLines === false ? "• " : "- ");
            lines.push(`${"  ".repeat(depth)}${marker}${item.text || ""}`);
            (item.children || []).forEach((child) => appendList(child, depth + 1));
          });
        }
        appendList(block, 0);
      }
    });
    return lines;
  }


  function buildGmailLineDiv(text, finalText, options) {
    const style = gmailStyleFromOptions(options);
    const prefix = `<div class="gmail_default" style="${style.inline}">`;
    if (!text) return `${prefix}<br></div>`;
    const body = htmlEscapeWithBreaks(text);
    return `${prefix}${body}${finalText ? "<br>" : ""}</div>`;
  }

  function buildGmailListHtml(block, isFinalContent, options) {
    const tag = block.type === "ol" ? "ol" : "ul";
    const style = gmailStyleFromOptions(options);
    const parts = [`<${tag} style="${style.inline}">`];
    const items = block.items || [];
    items.forEach((item, index) => {
      const isFinalItem = isFinalContent && index === items.length - 1;
      const nested = (item.children || []).map((child) => buildGmailListHtml(child, false, options)).join("");
      parts.push(`<li class="gmail_default" style="font-family: verdana, sans-serif;">${htmlEscapeWithBreaks(item.text || "")}${nested}${isFinalItem ? "<br>" : ""}</li>`);
    });
    parts.push(`</${tag}>`);
    return parts.join("");
  }

  function buildGmailHtmlFromDoc(doc, options) {
    if (options && options.gmailListsAsHyphenLines) {
      const lines = docBlocksAsGmailLines(doc, options);
      const nonEmptyIndexes = lines.map((line, index) => line.trim() ? index : -1).filter((index) => index >= 0);
      const lastTextIndex = nonEmptyIndexes.length ? nonEmptyIndexes[nonEmptyIndexes.length - 1] : -1;
      const divs = lines.map((line, index) => buildGmailLineDiv(line, index === lastTextIndex && line.trim(), options));
      return `<div>${divs.join("")}<br clear="all"></div>`;
    }

    const blocks = doc.blocks || [];
    const contentIndexes = blocks.map((block, index) => {
      if (block.type === "paragraph" && (block.text || "").trim()) return index;
      if ((block.type === "ul" || block.type === "ol") && (block.items || []).length) return index;
      return -1;
    }).filter((index) => index >= 0);
    const lastContentIndex = contentIndexes.length ? contentIndexes[contentIndexes.length - 1] : -1;
    const parts = ["<div>"];

    blocks.forEach((block, index) => {
      if (block.type === "blank") {
        parts.push(buildGmailLineDiv("", false, options));
      } else if (block.type === "paragraph") {
        parts.push(buildGmailLineDiv(block.text || "", index === lastContentIndex, options));
      } else if (block.type === "ul" || block.type === "ol") {
        parts.push(buildGmailListHtml(block, index === lastContentIndex, options));
      }
    });
    parts.push('<br clear="all"></div>');
    return parts.join("");
  }

  function buildDocumentHtmlFromDoc(doc, options) {
    const style = styleAttributeFromOptions(Object.assign({ destination: "googleDocs" }, options || {}));
    const parts = [`<div style="${style}">`];
    (doc.blocks || []).forEach((block) => {
      if (block.type === "blank") {
        parts.push("<p><br></p>");
      } else if (block.type === "paragraph") {
        parts.push(`<p style="${style}">${htmlEscapeWithBreaks(block.text || "")}</p>`);
      } else if (block.type === "ul" || block.type === "ol") {
        const tag = block.type;
        parts.push(`<${tag}>`);
        (block.items || []).forEach((item) => {
          const nested = (item.children || []).map((child) => buildDocumentHtmlFromDoc({ blocks: [child] }, options).replace(/^<div[^>]*>|<\/div>$/g, "")).join("");
          parts.push(`<li>${htmlEscapeWithBreaks(item.text || "")}${nested}</li>`);
        });
        parts.push(`</${tag}>`);
      }
    });
    parts.push("</div>");
    return parts.join("");
  }


  function renderDocFragment(doc, mode, destination, options) {
    const frag = document.createDocumentFragment();
    const isOutput = mode === "output";

    function blockDiv(text, className) {
      const div = document.createElement("div");
      div.className = className || "editor-paragraph";
      div.textContent = options && options.showInvisibles ? visualizeInvisibles(text || "") : (text || "");
      if (!text) div.appendChild(document.createElement("br"));
      return div;
    }

    function gmailDiv(text, isFinalText) {
      const div = document.createElement("div");
      div.className = "gmail_default editor-paragraph gmail-line";
      div.setAttribute("style", "font-family: verdana, sans-serif;");
      div.textContent = options && options.showInvisibles ? visualizeInvisibles(text || "") : (text || "");
      if (!text || isFinalText) div.appendChild(document.createElement("br"));
      return div;
    }

    function appendPlainTextList(block) {
      function appendList(listBlock, depth) {
        (listBlock.items || []).forEach((item, index) => {
          const marker = listBlock.type === "ol" ? `${index + 1}. ` : "- ";
          frag.appendChild(blockDiv(`${"  ".repeat(depth)}${marker}${item.text || ""}`, "editor-paragraph list-as-text"));
          (item.children || []).forEach((child) => appendList(child, depth + 1));
        });
      }
      appendList(block, 0);
    }

    function createSemanticList(block) {
      const list = document.createElement(block.type);
      list.className = "editor-list";
      (block.items || []).forEach((item) => {
        const li = document.createElement("li");
        li.textContent = options && options.showInvisibles ? visualizeInvisibles(item.text || "") : (item.text || "");
        (item.children || []).forEach((child) => li.appendChild(createSemanticList(child)));
        list.appendChild(li);
      });
      return list;
    }

    function appendSemanticList(block) {
      frag.appendChild(createSemanticList(block));
    }

    function appendGmailSemanticList(block, isFinalContent) {
      const list = document.createElement(block.type);
      list.className = "editor-list gmail-list";
      const style = gmailStyleFromOptions(options);
      list.setAttribute("style", style.inline);
      const items = block.items || [];
      items.forEach((item, index) => {
        const li = document.createElement("li");
        li.className = "gmail_default";
        li.setAttribute("style", "font-family: verdana, sans-serif;");
        li.textContent = options && options.showInvisibles ? visualizeInvisibles(item.text || "") : (item.text || "");
        (item.children || []).forEach((child) => li.appendChild(createSemanticList(child)));
        if (isFinalContent && index === items.length - 1) li.appendChild(document.createElement("br"));
        list.appendChild(li);
      });
      frag.appendChild(list);
    }

    if (isOutput && destination === "gmail") {
      if (options && options.gmailListsAsHyphenLines) {
        const lines = docBlocksAsGmailLines(doc, options || {});
        const nonEmptyIndexes = lines.map((line, index) => line.trim() ? index : -1).filter((index) => index >= 0);
        const lastTextIndex = nonEmptyIndexes.length ? nonEmptyIndexes[nonEmptyIndexes.length - 1] : -1;
        lines.forEach((line, index) => frag.appendChild(gmailDiv(line, index === lastTextIndex && line.trim())));
        return frag;
      }

      const blocks = doc.blocks || [];
      const contentIndexes = blocks.map((block, index) => {
        if (block.type === "paragraph" && (block.text || "").trim()) return index;
        if ((block.type === "ul" || block.type === "ol") && (block.items || []).length) return index;
        return -1;
      }).filter((index) => index >= 0);
      const lastContentIndex = contentIndexes.length ? contentIndexes[contentIndexes.length - 1] : -1;
      blocks.forEach((block, index) => {
        if (block.type === "blank") frag.appendChild(gmailDiv("", false));
        else if (block.type === "paragraph") frag.appendChild(gmailDiv(block.text || "", index === lastContentIndex));
        else if (block.type === "ul" || block.type === "ol") appendGmailSemanticList(block, index === lastContentIndex);
      });
      return frag;
    }

    (doc.blocks || []).forEach((block) => {
      if (block.type === "blank") {
        frag.appendChild(blockDiv("", "editor-blank"));
      } else if (block.type === "paragraph") {
        frag.appendChild(blockDiv(block.text || "", "editor-paragraph"));
      } else if (block.type === "ul" || block.type === "ol") {
        if (isOutput && (destination === "plain" || destination === "strictAscii" || destination === "markdown" || destination === "slack" || destination === "cms" || destination === "code")) appendPlainTextList(block);
        else appendSemanticList(block);
      }
    });
    return frag;
  }

  function renderDocInto(editor, doc, mode, destination, options) {
    editor.innerHTML = "";
    editor.appendChild(renderDocFragment(doc, mode, destination, options || {}));
  }

  function parseEditorToDoc(editor) {
    const blocks = [];
    function addBlank() {
      const last = blocks[blocks.length - 1];
      if (!last || last.type !== "blank") blocks.push({ type: "blank" });
    }
    Array.from(editor.childNodes || []).forEach((node) => {
      if (node.nodeType === 3) {
        const text = normalizeBlockText(node.nodeValue || "").trim();
        if (text) blocks.push({ type: "paragraph", text });
        return;
      }
      if (node.nodeType !== 1) return;
      const tag = node.tagName;
      if (tag === "UL" || tag === "OL") {
        const listBlock = parseListElement(node, tag === "OL");
        if (listBlock.items.length) blocks.push(listBlock);
        return;
      }
      if (tag === "BR") {
        addBlank();
        return;
      }
      const text = cleanNodeText(node);
      if (!text) addBlank();
      else blocks.push({ type: "paragraph", text });
    });
    const counts = countDocLists(blocks);
    return makeDoc(blocks, { source: "editor", lists: counts.lists, listItems: counts.items });
  }

  function insertDocAtSelection(editor, doc) {
    const fragment = renderDocFragment(doc, "input", "source", {});
    const marker = document.createElement("span");
    marker.setAttribute("data-caret-marker", "true");
    marker.appendChild(document.createTextNode(""));
    fragment.appendChild(marker);
    const selection = global.getSelection ? global.getSelection() : null;
    if (selection && selection.rangeCount && editor.contains(selection.anchorNode)) {
      const range = selection.getRangeAt(0);
      range.deleteContents();
      range.insertNode(fragment);
    } else {
      editor.appendChild(fragment);
    }
    const range = document.createRange();
    range.setStartAfter(marker);
    range.collapse(true);
    marker.remove();
    if (selection) {
      selection.removeAllRanges();
      selection.addRange(range);
    }
  }

  function currentOptionsFromUi(destination, presetSelect, optionInputs) {
    const preset = PRESETS[presetSelect.value] || PRESETS.standard;
    const ui = {};
    optionInputs.forEach((input) => { ui[input.dataset.option] = input.checked; });
    return buildOptions(destination, preset, ui);
  }

  function getCodeLabelForChangeValue(value) {
    if (value === "") return "removed";
    if (value === "\r\n") return "U+000D CARRIAGE RETURN + U+000A LINE FEED";
    if (value === "\r") return "U+000D CARRIAGE RETURN";
    if (value === "\n") return "U+000A LINE FEED";
    if (value === "\n\n") return "U+000A LINE FEED + U+000A LINE FEED";
    if (value === "  ") return "U+0020 SPACE + U+0020 SPACE";
    if (value.length > 24 && !Array.from(value).some((char) => char.codePointAt(0) > 127)) return value;
    return Array.from(value).map((char) => labelChar(char)).join(" + ");
  }

  function bindDom() {
    const inputEditor = document.getElementById("inputEditor");
    const outputEditor = document.getElementById("outputEditor");
    const clearButton = document.getElementById("clearButton");
    const destinationCopyButton = document.getElementById("destinationCopyButton");
    const copyVisibleButton = document.getElementById("copyVisibleButton");
    const destinationSelect = document.getElementById("destinationSelect");
    const destinationNote = document.getElementById("destinationNote");
    const destinationFontSelect = document.getElementById("destinationFontSelect");
    const destinationSizeSelect = document.getElementById("destinationSizeSelect");
    const destinationStyleNote = document.getElementById("destinationStyleNote");
    const destinationSummary = document.getElementById("destinationSummary");
    const presetDescription = document.getElementById("presetDescription");
    const sampleSelect = document.getElementById("sampleSelect");
    const presetSelect = document.getElementById("presetSelect");
    const status = document.getElementById("status");
    const pasteStatus = document.getElementById("pasteStatus");
    const statsList = document.getElementById("statsList");
    const changesList = document.getElementById("changesList");
    const warningsList = document.getElementById("warningsList");
    const nonAsciiList = document.getElementById("nonAsciiList");
    const diffViewToggle = document.getElementById("diffViewToggle");
    const previewTab = document.getElementById("previewTab");
    const diffTab = document.getElementById("diffTab") || diffViewToggle;
    const advancedSettingsButton = document.getElementById("advancedSettingsButton");
    const advancedSettings = document.getElementById("advancedSettings");
    const advancedSettingsSearch = document.getElementById("advancedSettingsSearch");
    const advancedSettingsSearchStatus = document.getElementById("advancedSettingsSearchStatus");
    const advancedSettingsClear = document.getElementById("advancedSettingsClear");
    const runUserTestsButton = document.getElementById("runUserTestsButton");
    const userTestResults = document.getElementById("userTestResults");
    const userTestAnimation = document.getElementById("userTestAnimation");
    const themeToggle = document.getElementById("themeToggle");
    const optionInputs = Array.from(document.querySelectorAll("[data-option]"));

    if (!inputEditor || !outputEditor || !destinationSelect || !presetSelect) return;

    let lastResult = null;
    let inputDoc = makeDoc([], { source: "manual" });
    let suppressInputEvent = false;

    function setStatus(message) {
      if (status) status.textContent = message || "";
    }

    function setPasteStatus(message) {
      if (pasteStatus) pasteStatus.textContent = message || "Ready for paste.";
    }

    function applyTheme(isDark) {
      document.documentElement.dataset.theme = isDark ? "dark" : "light";
      if (themeToggle) themeToggle.checked = isDark;
      try { global.localStorage?.setItem("copySanitizer.theme", isDark ? "dark" : "light"); } catch (error) {}
    }

    function loadThemePreference() {
      try {
        const saved = global.localStorage?.getItem("copySanitizer.theme");
        if (saved === "dark" || saved === "light") return saved;
      } catch (error) {}
      return global.matchMedia && global.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }

    function applyOptionsToUi(options) {
      optionInputs.forEach((input) => {
        input.checked = Boolean(options[input.dataset.option]);
        const example = OPTION_EXAMPLES[input.dataset.option];
        if (example) {
          const item = input.closest(".setting-item") || input.closest("label");
          if (item) {
            item.title = example;
            input.setAttribute("aria-describedby", `${input.dataset.option}Example`);
            if (!item.querySelector(".setting-item-description, .toggle-example")) {
              const hint = document.createElement("span");
              hint.className = item.classList.contains("setting-item") ? "setting-item-description" : "toggle-example";
              hint.id = `${input.dataset.option}Example`;
              hint.textContent = example;
              const content = item.querySelector(".setting-item-content") || item;
              content.appendChild(hint);
            }
          }
        }
      });
    }

    function styleConfigForDestination(destination) {
      if (destination === "gmail") {
        return {
          fonts: GMAIL_FONT_OPTIONS,
          sizes: GMAIL_SIZE_OPTIONS,
          defaultFont: "Verdana, sans-serif",
          defaultSize: "13px",
          note: "Applies to preview and rich-copy HTML."
        };
      }
      if (destination === "googleDocs" || destination === "word" || destination === "outlook") {
        return {
          fonts: DOCUMENT_FONT_OPTIONS,
          sizes: DOCUMENT_SIZE_OPTIONS,
          defaultFont: "Arial, sans-serif",
          defaultSize: "11pt",
          note: "Applies to preview and rich-copy HTML."
        };
      }
      return {
        fonts: PLAIN_FONT_OPTIONS,
        sizes: PLAIN_SIZE_OPTIONS,
        defaultFont: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', monospace",
        defaultSize: "0.92rem",
        note: "Preview only. Plain-text copies do not include font or size."
      };
    }

    function populateSelect(select, options, selectedValue) {
      if (!select) return;
      select.innerHTML = "";
      options.forEach((option) => {
        const element = document.createElement("option");
        element.value = option.value;
        element.textContent = option.label;
        select.appendChild(element);
      });
      if (selectedValue && options.some((option) => option.value === selectedValue)) select.value = selectedValue;
    }

    function getStylePreferenceKey(destination) {
      return `copySanitizer.destinationStyle.${destination}`;
    }

    function loadDestinationStylePreference(destination) {
      try {
        return JSON.parse(global.localStorage?.getItem(getStylePreferenceKey(destination)) || "{}");
      } catch (error) {
        return {};
      }
    }

    function saveDestinationStylePreference() {
      const destination = destinationSelect.value;
      try {
        global.localStorage?.setItem(getStylePreferenceKey(destination), JSON.stringify({
          fontFamily: destinationFontSelect ? destinationFontSelect.value : "",
          fontSize: destinationSizeSelect ? destinationSizeSelect.value : ""
        }));
      } catch (error) {
        // Local storage may be unavailable in private or locked-down contexts.
      }
    }

    function refreshStyleControls() {
      const destination = destinationSelect.value;
      const config = styleConfigForDestination(destination);
      const saved = loadDestinationStylePreference(destination);
      populateSelect(destinationFontSelect, config.fonts, saved.fontFamily || config.defaultFont);
      populateSelect(destinationSizeSelect, config.sizes, saved.fontSize || config.defaultSize);
      const detail = DESTINATION_DETAILS[destination] || DESTINATION_DETAILS.gmail;
      if (destinationStyleNote) destinationStyleNote.textContent = detail.font === "preview-only" ? "Preview only. Plain-text copies do not include font or size." : config.note;
      const disabled = false;
      if (destinationFontSelect) destinationFontSelect.disabled = disabled;
      if (destinationSizeSelect) destinationSizeSelect.disabled = disabled;
    }

    function refreshProfileUi() {
      const profile = DESTINATIONS[destinationSelect.value] || DESTINATIONS.gmail;
      if (destinationNote) destinationNote.textContent = profile.note;
      const details = DESTINATION_DETAILS[destinationSelect.value] || DESTINATION_DETAILS.gmail;
      if (destinationSummary) {
        destinationSummary.innerHTML = "";
        [["Copies", details.format], ["Lists", details.list], ["Typography", details.typography], ["Style", details.font], ["Fallback", details.fallback]].forEach(([term, desc]) => {
          const dt = document.createElement("dt");
          const dd = document.createElement("dd");
          dt.textContent = term;
          dd.textContent = desc;
          destinationSummary.append(dt, dd);
        });
      }
      if (destinationCopyButton) destinationCopyButton.textContent = profile.copyLabel;
      const plainOnly = (DESTINATION_DETAILS[destinationSelect.value] || DESTINATION_DETAILS.gmail).format.toLowerCase().includes("plain text") || profile.copyLabel === "Copy text";
      if (copyVisibleButton) {
        copyVisibleButton.hidden = plainOnly;
        copyVisibleButton.textContent = "Copy visible text";
      }
      outputEditor.classList.remove("gmail-compose", "document-output", "plain-output", "strict-output", "markdown-output", "diff-output", "compact-diff-output");
      outputEditor.classList.add(profile.outputClass);
    }

    function getOptions() {
      const options = currentOptionsFromUi(destinationSelect.value, presetSelect, optionInputs);
      options.destination = destinationSelect.value;
      if (destinationFontSelect) options.textFontFamily = destinationFontSelect.value;
      if (destinationSizeSelect) options.textFontSize = destinationSizeSelect.value;
      if (options.destination === "gmail") {
        options.gmailFontFamily = options.textFontFamily;
        options.gmailFontSize = options.textFontSize;
      }
      return options;
    }

    function sourceChangeMatchesMetric(part, label) {
      const source = part.source || "";
      const target = part.text || "";
      if (/Dashes/i.test(label)) return /[-‐‑‒–—―]/u.test(source) || /[-–—]/u.test(target);
      if (/Quotes/i.test(label)) return /["'“”‘’′″]/u.test(source) || /["'“”‘’′″]/u.test(target);
      if (/Ellipses/i.test(label)) return source.includes("…") || target.includes("...") || target.includes("…");
      if (/Spaces/i.test(label)) return /\s/.test(source) || /\s/.test(target);
      if (/Hidden/i.test(label)) return source.length > 0 && target.length === 0;
      if (/ASCII|Compatibility|changes/i.test(label)) return true;
      return true;
    }

    function sourceChangeMatchesRecord(part, change) {
      if (!change) return true;
      const source = part.source || "";
      const target = part.text || "";
      return source === change.source || target === change.target || source.includes(change.source || "\u0000") || target.includes(change.target || "\u0000");
    }

    function highlightInputForMetric(label, matcher) {
      if (!lastResult) return;
      const options = getOptions();
      renderInputDiffHighlights(inputDoc, lastResult.doc, options, matcher || ((part) => sourceChangeMatchesMetric(part, label)));
      inputEditor.classList.add("inspector-pulse");
    }

    function clearInputMetricHighlight() {
      inputEditor.classList.remove("inspector-pulse");
      const options = getOptions();
      suppressInputEvent = true;
      renderDocInto(inputEditor, inputDoc, "input", "source", options.showInvisibles ? options : {});
      inputEditor.dataset.showingInvisibles = options.showInvisibles ? "true" : "false";
      suppressInputEvent = false;
    }

    function renderStats(result) {
      if (!statsList) return;
      const inputChars = docToPlainText(inputDoc, "plain").length;
      const entries = [
        ["Characters in", inputChars],
        ["Characters out", result.cleanText.length],
        ["Source changes", result.stats.sourceChanges],
        ["Destination changes", result.stats.destinationChanges],
        ["Hidden removed", result.stats.hiddenRemoved],
        ["Spaces normalized", result.stats.spacesNormalized],
        ["Quotes changed", result.stats.quotesChanged],
        ["Dashes changed", result.stats.dashesChanged],
        ["Ellipses changed", result.stats.ellipsesChanged],
        ["Lists detected", result.doc.meta.lists || 0],
        ["List items", result.doc.meta.listItems || 0],
        ["Compatibility changes", result.stats.fullwidthChanged + result.stats.ligaturesChanged + result.stats.fractionsChanged + result.stats.superSubChanged],
        ["Strict ASCII changes", result.stats.strictAsciiChanged]
      ];
      statsList.innerHTML = "";
      entries.forEach(([label, value]) => {
        const li = document.createElement("li");
        const span = document.createElement("span");
        const strong = document.createElement("strong");
        span.textContent = label;
        strong.textContent = String(value);
        li.append(span, strong);
        const canLink = /changes|Hidden|Spaces|Quotes|Dashes|Ellipses|Lists|ASCII|Compatibility/i.test(label) && Number(value) > 0;
        if (canLink) {
          li.tabIndex = 0;
          li.role = "button";
          li.title = "Hover to highlight related input text.";
          li.addEventListener("mouseenter", () => highlightInputForMetric(label));
          li.addEventListener("mouseleave", clearInputMetricHighlight);
          li.addEventListener("focus", () => highlightInputForMetric(label));
          li.addEventListener("blur", clearInputMetricHighlight);
        } else {
          li.title = "This metric summarizes the document and does not map to one exact text span.";
        }
        statsList.appendChild(li);
      });
    }

    function renderChanges(result) {
      if (!changesList) return;
      changesList.innerHTML = "";
      if (!result.changes.length) {
        const li = document.createElement("li");
        li.textContent = "No character changes made.";
        changesList.appendChild(li);
        return;
      }
      result.changes.slice(0, 80).forEach((change) => {
        const li = document.createElement("li");
        const source = getCodeLabelForChangeValue(change.source);
        const target = getCodeLabelForChangeValue(change.target);
        const button = document.createElement("button");
        button.type = "button";
        button.className = "inspector-link";
        button.textContent = `${change.phase}: ${source} -> ${target} ×${change.count}${change.note ? ` (${change.note})` : ""}`;
        button.addEventListener("mouseenter", () => highlightInputForMetric(change.note || change.target || change.source, (part) => sourceChangeMatchesRecord(part, change)));
        button.addEventListener("mouseleave", clearInputMetricHighlight);
        button.addEventListener("focus", () => highlightInputForMetric(change.note || change.target || change.source, (part) => sourceChangeMatchesRecord(part, change)));
        button.addEventListener("blur", clearInputMetricHighlight);
        li.appendChild(button);
        changesList.appendChild(li);
      });
      if (result.changes.length > 80) {
        const li = document.createElement("li");
        li.textContent = `...and ${result.changes.length - 80} more grouped change records.`;
        changesList.appendChild(li);
      }
    }

    function renderWarnings(result) {
      if (!warningsList || !nonAsciiList) return;
      warningsList.innerHTML = "";
      nonAsciiList.innerHTML = "";

      if (!result.warnings.length) {
        const li = document.createElement("li");
        li.textContent = "No remaining suspicious characters found.";
        warningsList.appendChild(li);
      } else {
        result.warnings.forEach((warning) => {
          const li = document.createElement("li");
          li.textContent = warning;
          warningsList.appendChild(li);
        });
      }

      if (!result.remainingNonAscii.length) {
        const li = document.createElement("li");
        li.textContent = "None";
        nonAsciiList.appendChild(li);
      } else {
        result.remainingNonAscii.slice(0, 30).forEach((entry) => {
          const li = document.createElement("li");
          li.textContent = `${entry.label} ×${entry.count}`;
          nonAsciiList.appendChild(li);
        });
      }
    }


    function appendDiffLine(container, marker, text, className) {
      const row = document.createElement("div");
      row.className = `diff-line ${className}`;
      const mark = document.createElement("span");
      mark.className = "diff-marker";
      mark.textContent = marker;
      const body = document.createElement("span");
      body.textContent = text || "";
      if (!text) body.className = "diff-empty";
      row.append(mark, body);
      container.appendChild(row);
    }

    function compactDiffLines(beforeText, afterText, options) {
      const before = String(beforeText || "").replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
      const after = String(afterText || "").replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
      const max = Math.max(before.length, after.length);
      const rows = [];
      let changed = 0;
      for (let index = 0; index < max; index += 1) {
        const left = before[index] == null ? "" : before[index];
        const right = after[index] == null ? "" : after[index];
        if (left === right) {
          if (left && rows.length < 8) rows.push({ type: "context", text: left });
          continue;
        }
        changed += 1;
        rows.push({ type: "remove", text: left });
        rows.push({ type: "add", text: right });
      }
      return {
        changed,
        rows: rows.map((row) => Object.assign({}, row, {
          text: options && options.showInvisibles ? visualizeInvisibles(row.text) : row.text
        }))
      };
    }

    function renderDiagnosticDiffView(result, options) {
      outputEditor.innerHTML = "";
      const beforeText = docToPlainText(inputDoc, "plain");
      const diff = compactDiffLines(beforeText, result.cleanText, options);
      if (!diff.rows.length) {
        appendDiffLine(outputEditor, " ", result.cleanText || "No output yet.", "diff-context");
        return;
      }
      diff.rows.slice(0, 80).forEach((row) => {
        const marker = row.type === "remove" ? "−" : (row.type === "add" ? "+" : " ");
        const className = row.type === "remove" ? "diff-remove" : (row.type === "add" ? "diff-add" : "diff-context");
        appendDiffLine(outputEditor, marker, row.text, className);
      });
      if (diff.rows.length > 80) appendDiffLine(outputEditor, "…", `${diff.rows.length - 80} more diff rows hidden`, "diff-context");
    }

    function replacementTitle(source, target) {
      if (!source) return `Inserted ${getCodeLabelForChangeValue(target)}`;
      if (!target) return `Removed ${getCodeLabelForChangeValue(source)}`;
      return `${getCodeLabelForChangeValue(source)} -> ${getCodeLabelForChangeValue(target)}`;
    }

    function diffTextParts(beforeText, afterText) {
      const a = Array.from(beforeText || "");
      const b = Array.from(afterText || "");
      if (a.length * b.length > 120000) {
        const prefix = (() => { let i = 0; while (i < a.length && i < b.length && a[i] === b[i]) i += 1; return i; })();
        let as = a.length, bs = b.length;
        while (as > prefix && bs > prefix && a[as - 1] === b[bs - 1]) { as -= 1; bs -= 1; }
        return [
          prefix ? { type: "equal", text: b.slice(0, prefix).join("") } : null,
          (a.length !== as || b.length !== bs) ? { type: b.slice(prefix, bs).length ? "replace" : "remove", source: a.slice(prefix, as).join(""), text: b.slice(prefix, bs).join("") } : null,
          bs < b.length ? { type: "equal", text: b.slice(bs).join("") } : null
        ].filter(Boolean);
      }
      const dp = Array.from({ length: a.length + 1 }, () => Array(b.length + 1).fill(0));
      for (let i = a.length - 1; i >= 0; i -= 1) {
        for (let j = b.length - 1; j >= 0; j -= 1) dp[i][j] = a[i] === b[j] ? 1 + dp[i + 1][j + 1] : Math.max(dp[i + 1][j], dp[i][j + 1]);
      }
      const raw = [];
      let i = 0, j = 0;
      while (i < a.length || j < b.length) {
        if (i < a.length && j < b.length && a[i] === b[j]) { raw.push({ type: "equal", text: b[j++] }); i += 1; }
        else if (j < b.length && (i >= a.length || dp[i][j + 1] > dp[i + 1][j])) raw.push({ type: "add", text: b[j++] });
        else raw.push({ type: "remove", source: a[i++] });
      }
      const parts = [];
      function push(part) {
        const last = parts[parts.length - 1];
        if (last && last.type === part.type) {
          last.text = (last.text || "") + (part.text || "");
          last.source = (last.source || "") + (part.source || "");
        } else parts.push(Object.assign({}, part));
      }
      for (let k = 0; k < raw.length; k += 1) {
        if (raw[k].type === "remove" && raw[k + 1] && raw[k + 1].type === "add") { push({ type: "replace", source: raw[k].source, text: raw[k + 1].text }); k += 1; }
        else if (raw[k].type === "add") push({ type: "replace", source: "", text: raw[k].text });
        else push(raw[k]);
      }
      return parts;
    }

    function appendAnnotatedText(container, beforeText, afterText, options) {
      diffTextParts(beforeText, afterText).forEach((part) => {
        if (part.type === "equal") container.appendChild(document.createTextNode(options && options.showInvisibles ? visualizeInvisibles(part.text) : part.text));
        else if (part.type === "remove") {
          // Pure removals are shown on the source/input side in diff mode so the
          // output text keeps the same footprint as preview text.
        } else {
          const span = document.createElement("span");
          span.className = "char-change";
          span.title = replacementTitle(part.source, part.text);
          span.setAttribute("aria-label", span.title);
          span.textContent = options && options.showInvisibles ? visualizeInvisibles(part.text) : part.text;
          container.appendChild(span);
        }
      });
    }

    function destinationPreservesLists(options) {
      if (options.destination === "gmail") return !options.gmailListsAsHyphenLines;
      if (options.destination === "googleDocs" || options.destination === "word" || options.destination === "outlook") return Boolean(options.structuredListsForDocs || options.destination === "outlook");
      return false;
    }

    function appendListPreview(parent, inputBlock, outputBlock, options) {
      const list = document.createElement(outputBlock.type === "ol" ? "ol" : "ul");
      list.className = "diff-block list";
      (outputBlock.items || []).forEach((item, index) => {
        const li = document.createElement("li");
        const before = inputBlock && inputBlock.items && inputBlock.items[index] ? inputBlock.items[index].text || "" : "";
        appendAnnotatedText(li, before, item.text || "", options);
        list.appendChild(li);
      });
      parent.appendChild(list);
    }

    function appendSourceAnnotatedText(container, beforeText, afterText, options, highlighter) {
      diffTextParts(beforeText, afterText).forEach((part) => {
        if (part.type === "equal") {
          container.appendChild(document.createTextNode(options && options.showInvisibles ? visualizeInvisibles(part.text) : part.text));
        } else if (part.type === "remove" || part.type === "replace") {
          const shouldHighlight = highlighter && highlighter.matches(part);
          if (shouldHighlight) {
            const span = document.createElement("span");
            span.className = "source-change";
            span.title = replacementTitle(part.source, part.text || "");
            span.setAttribute("aria-label", span.title);
            span.textContent = options && (options.showInvisibles || part.type === "remove" || !part.text) ? visualizeInvisibles(part.source) : part.source;
            container.appendChild(span);
          } else {
            container.appendChild(document.createTextNode(options && options.showInvisibles ? visualizeInvisibles(part.source) : part.source));
          }
        }
      });
    }

    function renderInputDiffHighlights(inputModel, outputModel, options, matcher) {
      const highlighter = { matches: matcher || (() => true) };
      suppressInputEvent = true;
      inputEditor.innerHTML = "";
      (inputModel.blocks || []).forEach((block, index) => {
        const outputBlock = (outputModel.blocks || [])[index];
        if (block.type === "blank") { inputEditor.appendChild(document.createElement("br")); return; }
        if (block.type === "paragraph") {
          const div = document.createElement("div");
          div.className = "editor-paragraph";
          appendSourceAnnotatedText(div, block.text || "", outputBlock && outputBlock.type === "paragraph" ? outputBlock.text || "" : "", options, highlighter);
          inputEditor.appendChild(div);
        } else if (block.type === "ul" || block.type === "ol") {
          const list = document.createElement(block.type);
          (block.items || []).forEach((item, itemIndex) => {
            const li = document.createElement("li");
            const outputItem = outputBlock && outputBlock.items ? outputBlock.items[itemIndex] : null;
            appendSourceAnnotatedText(li, item.text || "", outputItem ? outputItem.text || "" : "", options, highlighter);
            list.appendChild(li);
          });
          inputEditor.appendChild(list);
        }
      });
      inputEditor.dataset.showingInvisibles = options && options.showInvisibles ? "true" : "false";
      suppressInputEvent = false;
    }

    function renderCompactDiff(inputModel, outputModel, changeRecords, destinationProfile, options) {
      outputEditor.innerHTML = "";
      const blocks = outputModel.blocks || [];
      const contentIndexes = blocks.map((block, index) => {
        if (block.type === "paragraph" && (block.text || "").trim()) return index;
        if ((block.type === "ul" || block.type === "ol") && (block.items || []).length) return index;
        return -1;
      }).filter((index) => index >= 0);
      const lastContentIndex = contentIndexes.length ? contentIndexes[contentIndexes.length - 1] : -1;

      blocks.forEach((block, index) => {
        const inputBlock = (inputModel.blocks || [])[index];
        if (block.type === "blank") {
          const blank = document.createElement("div");
          blank.className = options.destination === "gmail" ? "gmail_default editor-paragraph gmail-line" : "editor-blank";
          if (options.destination === "gmail") blank.setAttribute("style", "font-family: verdana, sans-serif;");
          blank.appendChild(document.createElement("br"));
          outputEditor.appendChild(blank);
          return;
        }
        if (block.type === "paragraph") {
          const div = document.createElement("div");
          div.className = options.destination === "gmail" ? "gmail_default editor-paragraph gmail-line" : "editor-paragraph";
          if (options.destination === "gmail") div.setAttribute("style", "font-family: verdana, sans-serif;");
          appendAnnotatedText(div, inputBlock && inputBlock.type === "paragraph" ? inputBlock.text || "" : "", block.text || "", options);
          if (options.destination === "gmail" && index === lastContentIndex && (block.text || "").trim()) div.appendChild(document.createElement("br"));
          outputEditor.appendChild(div);
        } else if (block.type === "ul" || block.type === "ol") appendListPreview(outputEditor, inputBlock, block, options);
      });
    }

    function renderInputEditorForOptions(options) {
      const shouldVisualize = Boolean(options.showInvisibles);
      const isVisualized = inputEditor.dataset.showingInvisibles === "true";
      if (!shouldVisualize && !isVisualized) return;
      suppressInputEvent = true;
      renderDocInto(inputEditor, inputDoc, "input", "source", shouldVisualize ? options : {});
      inputEditor.dataset.showingInvisibles = shouldVisualize ? "true" : "false";
      suppressInputEvent = false;
    }

    function showRawInputEditor() {
      if (inputEditor.dataset.showingInvisibles !== "true") return;
      suppressInputEvent = true;
      renderDocInto(inputEditor, inputDoc, "input", "source", {});
      inputEditor.dataset.showingInvisibles = "false";
      suppressInputEvent = false;
    }

    function update() {
      if (!suppressInputEvent && inputEditor.dataset.showingInvisibles !== "true") inputDoc = parseEditorToDoc(inputEditor);
      refreshProfileUi();
      const options = getOptions();
      renderInputEditorForOptions(options);
      const destinationStyle = destinationStyleFromOptions(options);
      outputEditor.style.setProperty("--destination-font-family", destinationStyle.fontFamily);
      outputEditor.style.setProperty("--destination-font-size", destinationStyle.fontSize);
      outputEditor.style.setProperty("--gmail-font-family", destinationStyle.fontFamily);
      outputEditor.style.setProperty("--gmail-font-size", destinationStyle.fontSize);
      lastResult = sanitizeDoc(inputDoc, options);
      const showDiff = diffViewToggle ? diffViewToggle.checked : false;
      if (previewTab) previewTab.setAttribute("aria-selected", String(!showDiff));
      if (diffTab) diffTab.setAttribute("aria-selected", String(showDiff));
      if (showDiff) {
        outputEditor.classList.remove("diff-output", "compact-diff-output");
        renderInputDiffHighlights(inputDoc, lastResult.doc, options, () => true);
        renderCompactDiff(inputDoc, lastResult.doc, lastResult.changes, DESTINATIONS[destinationSelect.value], options);
      } else {
        outputEditor.classList.remove("diff-output", "compact-diff-output");
        renderDocInto(outputEditor, lastResult.doc, "output", destinationSelect.value, options);
        renderInputEditorForOptions(options);
      }
      renderStats(lastResult);
      renderChanges(lastResult);
      renderWarnings(lastResult);
      setStatus("");
    }

    function applyPresetAndProfile() {
      const preset = PRESETS[presetSelect.value] || PRESETS.standard;
      const profile = DESTINATIONS[destinationSelect.value] || DESTINATIONS.gmail;
      const before = currentOptionsFromUi(destinationSelect.value, presetSelect, optionInputs);
      const next = Object.assign({}, OPTION_DEFAULTS, preset, profile.overrides);
      applyOptionsToUi(next);
      if (presetDescription) presetDescription.textContent = PRESET_DESCRIPTIONS[presetSelect.value] || "";
      refreshStyleControls();
      update();
    }

    const OPTION_TAGS = Object.freeze({
      detectLists: "clipboard lists html plain text structure nested",
      preferHtmlPaste: "clipboard html rich paste intake",
      removeHidden: "hidden invisible zero width directional unicode marks",
      normalizeLineEndings: "line breaks crlf newline",
      normalizeSeparators: "unicode separators paragraphs lines",
      normalizeSpaces: "spaces nbsp thin no-break whitespace",
      trimTrailingSpaces: "spaces line endings trailing whitespace",
      limitBlankLines: "blank lines paragraphs spacing",
      collapseRepeatedSpaces: "spaces whitespace repeated",
      convertTabs: "tabs indentation spaces",
      normalizeQuotes: "quotes smart curly keyboard punctuation",
      preservePrimeMarks: "prime feet inches measurements quotes",
      normalizeDashes: "dash hyphen en em punctuation",
      normalizeEllipsis: "ellipsis dots leaders punctuation",
      normalizeFullwidth: "fullwidth ascii compatibility",
      expandLigatures: "ligatures typography compatibility",
      normalizeFractions: "fractions unicode compatibility",
      normalizeSuperscriptsSubscripts: "superscript subscript math compatibility",
      removeEmoji: "emoji pictographic symbols removal",
      smartQuotes: "quotes smart typography documents",
      smartDashes: "dash em typography documents",
      numericRangesToEnDash: "ranges numbers en dash typography",
      smartEllipsis: "ellipsis typography documents",
      smartFractions: "fractions typography documents",
      measurementPrimes: "feet inches prime measurements typography",
      structuredListsForDocs: "lists html docs word outlook semantic",
      gmailListsAsHyphenLines: "gmail lists hyphen plain text",
      strictAscii: "ascii strict non-ascii compatibility",
      foldAccents: "accents ascii diacritics",
      replaceSymbolsAscii: "symbols ascii arrows copyright trademark",
      showInvisibles: "hidden invisible preview diagnostics"
    });

    function filterAdvancedSettings() {
      if (!advancedSettingsSearch) return;
      const query = advancedSettingsSearch.value.trim().toLowerCase();
      let visible = 0;
      optionInputs.forEach((input) => {
        const item = input.closest(".setting-item") || input.closest("label");
        if (!item) return;
        const key = input.dataset.option || "";
        const haystack = [key, item.textContent, OPTION_EXAMPLES[key], OPTION_TAGS[key]].join(" ").toLowerCase();
        const match = !query || haystack.includes(query);
        item.classList.toggle("setting-filter-hidden", !match);
        if (match) visible += 1;
      });
      Array.from(document.querySelectorAll(".advanced-settings details")).forEach((group) => {
        if (group.id === "advancedSettings") return;
        const hasMatch = Boolean(group.querySelector(".setting-item:not(.setting-filter-hidden), label:not(.setting-filter-hidden)"));
        group.classList.toggle("setting-filter-hidden", !hasMatch && Boolean(query));
        if (query && hasMatch) group.open = true;
      });
      if (advancedSettingsSearchStatus) advancedSettingsSearchStatus.textContent = query ? `${visible} matching settings` : "";
    }


    function escapeHtml(value) {
      return String(value).replace(/[&<>"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[char]));
    }

    const USER_EXAMPLES = Object.freeze([
      { name: "Smart quotes and dashes", input: "“Hello” — 1–5...", destination: "plain", options: { normalizeQuotes: true, normalizeDashes: true, normalizeEllipsis: true }, expected: '"Hello" -- 1-5...' },
      { name: "Nested lists", input: "- parent\n  - child\n- sibling", destination: "markdown", doc: true, expected: "- parent\n  - child\n- sibling" },
      { name: "Emoji removal", input: "Launch 🚀 and smile 😀", destination: "plain", options: { removeEmoji: true, collapseRepeatedSpaces: true }, expected: "Launch and smile" },
      { name: "Hidden characters", input: "Zero\u200Bwidth\u200E mark", destination: "plain", options: { removeHidden: true }, expected: "Zerowidth mark" },
      { name: "Heavy emoji usage", input: "🔥🔥 Ship it ✅✨", destination: "plain", options: { removeEmoji: true, collapseRepeatedSpaces: true }, expected: " Ship it" },
      { name: "Right-to-left text", input: "abc\u200F def", destination: "plain", options: { removeHidden: true }, expected: "abc def" },
      { name: "Superscripts and subscripts", input: "x² + H₂O", destination: "plain", options: { normalizeSuperscriptsSubscripts: true }, expected: "x2 + H2O" },
      { name: "Ligatures", input: "office ﬁle ﬂow", destination: "plain", options: { expandLigatures: true }, expected: "office file flow" },
      { name: "Mathematical symbols", input: "± × ÷ √", destination: "strictAscii", options: { strictAscii: true, replaceSymbolsAscii: true }, expected: "+/- x / " },
      { name: "Strict ASCII conversion", input: "Café — ™", destination: "strictAscii", options: { strictAscii: true, foldAccents: true, replaceSymbolsAscii: true, normalizeDashes: true }, expected: "Cafe -- TM" },
      { name: "Markdown lists", input: "- One\n- Two", destination: "markdown", doc: true, expected: "- One\n- Two" },
      { name: "Rich pasted lists", input: "<ul><li>One</li><li>Two</li></ul>", destination: "googleDocs", html: true, expected: "One\nTwo" },
      { name: "Code comment cleanup", input: "TODO — fix “quotes”\u200B", destination: "code", expected: 'TODO -- fix "quotes"' },
      { name: "Form-safe plain text", input: "Name:\tJane   Doe\n\n\nNotes", destination: "plain", expected: "Name: Jane   Doe\n\nNotes" }
    ]);

    function runExampleCase(example) {
      const options = Object.assign(buildOptions(example.destination || "plain"), example.options || {});
      if (example.html) return docToPlainText(sanitizeDoc(parseHtmlToDoc(example.input), options).doc, example.destination || "plain");
      if (example.doc) return docToPlainText(sanitizeDoc(parsePlainTextToDoc(example.input, true), options).doc, example.destination || "plain");
      return sanitize(example.input, options).cleanText;
    }

    function runUserExamples() {
      if (!userTestResults) return;
      userTestAnimation?.classList.remove("running");
      void userTestAnimation?.offsetWidth;
      userTestAnimation?.classList.add("running");
      userTestResults.innerHTML = "";
      USER_EXAMPLES.forEach((example, index) => {
        window.setTimeout(() => {
          const actual = runExampleCase(example);
          const passed = actual === example.expected;
          const li = document.createElement("li");
          li.className = `user-test-result ${passed ? "pass" : "fail"}`;
          li.innerHTML = `<div class="user-test-title"><strong>${escapeHtml(example.name)}</strong><span class="test-badge">${passed ? "PASS" : "FAIL"}</span></div><dl><dt>Input</dt><dd><code>${escapeHtml(example.input)}</code></dd><dt>Expected</dt><dd><code>${escapeHtml(example.expected)}</code></dd><dt>Actual</dt><dd><code>${escapeHtml(actual)}</code></dd></dl>`;
          userTestResults.appendChild(li);
          if (index === USER_EXAMPLES.length - 1) window.setTimeout(() => userTestAnimation?.classList.remove("running"), 900);
        }, index * 90);
      });
    }

    function parseClipboardEvent(event) {
      const options = getOptions();
      const clipboard = event.clipboardData || global.clipboardData;
      if (!clipboard) return null;
      const html = clipboard.getData("text/html");
      const plain = clipboard.getData("text/plain");
      let doc;
      if (options.preferHtmlPaste && html) {
        doc = parseHtmlToDoc(html);
        doc.meta.plainAvailable = Boolean(plain);
      } else {
        doc = parsePlainTextToDoc(plain || "", options.detectLists);
        doc.meta.htmlAvailable = Boolean(html);
      }
      doc.meta.plainAvailable = Boolean(plain);
      if (!doc.blocks.length && plain) doc = parsePlainTextToDoc(plain, options.detectLists);
      return doc;
    }

    inputEditor.addEventListener("beforeinput", () => {
      showRawInputEditor();
    });

    inputEditor.addEventListener("paste", (event) => {
      showRawInputEditor();
      const doc = parseClipboardEvent(event);
      if (!doc) return;
      event.preventDefault();
      suppressInputEvent = true;
      insertDocAtSelection(inputEditor, doc);
      suppressInputEvent = false;
      inputDoc = parseEditorToDoc(inputEditor);
      inputDoc.meta = Object.assign({}, doc.meta, countDocLists(inputDoc.blocks));
      setPasteStatus(doc.meta.source === "html" ? "Pasted from clipboard HTML." : "Pasted from clipboard plain text.");
      update();
    });

    inputEditor.addEventListener("input", () => {
      inputDoc = parseEditorToDoc(inputEditor);
      inputDoc.meta.source = "editor";
      setPasteStatus("Edited manually.");
      update();
    });

    optionInputs.forEach((input) => input.addEventListener("change", update));
    if (sampleSelect) sampleSelect.addEventListener("change", () => {
      const text = SAMPLE_TEXTS[sampleSelect.value];
      if (!text) return;
      const sampleText = text.replace(/\\n/g, "\n").replace(/\\t/g, "\t").replace(/\\u200B/g, "\u200B").replace(/\\u200E/g, "\u200E").replace(/\\u00A0/g, "\u00A0");
      inputDoc = parsePlainTextToDoc(sampleText, getOptions().detectLists);
      inputDoc.meta.source = "sample";
      suppressInputEvent = true;
      renderDocInto(inputEditor, inputDoc, "input", "source", {});
      suppressInputEvent = false;
      setPasteStatus("Loaded sample text.");
      sampleSelect.value = "";
      update();
    });
    if (diffViewToggle) diffViewToggle.addEventListener("change", update);
    document.querySelectorAll(".setting-item").forEach((item) => {
      const input = item.querySelector("[data-option]");
      if (!input) return;
      item.addEventListener("click", (event) => {
        if (event.target === input) return;
        input.checked = !input.checked;
        input.dispatchEvent(new Event("change", { bubbles: true }));
      });
    });
    if (advancedSettingsButton && advancedSettings) advancedSettingsButton.addEventListener("click", () => { advancedSettings.open = true; });
    document.addEventListener("keydown", (event) => { if (event.key === "Escape" && advancedSettings) advancedSettings.open = false; });
    document.addEventListener("pointerdown", (event) => {
      if (!advancedSettings || !advancedSettings.open) return;
      const sheet = advancedSettings.closest(".advanced-sheet");
      if (sheet && !sheet.contains(event.target) && event.target !== advancedSettingsButton) advancedSettings.open = false;
    });
    if (previewTab && diffViewToggle) previewTab.addEventListener("click", () => { diffViewToggle.checked = false; update(); });
    if (diffTab && diffViewToggle && diffTab !== diffViewToggle) diffTab.addEventListener("click", () => { diffViewToggle.checked = true; update(); });
    function clearAdvancedSettingsSearch() {
      if (!advancedSettingsSearch) return;
      advancedSettingsSearch.value = "";
      filterAdvancedSettings();
      advancedSettingsSearch.focus();
    }
    if (advancedSettingsSearch) {
      advancedSettingsSearch.addEventListener("input", filterAdvancedSettings);
      advancedSettingsSearch.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && advancedSettingsSearch.value) {
          event.preventDefault();
          clearAdvancedSettingsSearch();
        }
      });
    }
    if (advancedSettingsClear) advancedSettingsClear.addEventListener("click", clearAdvancedSettingsSearch);
    if (runUserTestsButton) runUserTestsButton.addEventListener("click", runUserExamples);
    if (themeToggle) themeToggle.addEventListener("change", () => applyTheme(themeToggle.checked));
    presetSelect.addEventListener("change", applyPresetAndProfile);
    destinationSelect.addEventListener("change", applyPresetAndProfile);
    [destinationFontSelect, destinationSizeSelect].forEach((select) => {
      if (!select) return;
      select.addEventListener("change", () => {
        saveDestinationStylePreference();
        update();
      });
    });

    if (clearButton) {
      clearButton.addEventListener("click", () => {
        inputDoc = makeDoc([], { source: "manual" });
        inputEditor.innerHTML = "";
        update();
        setPasteStatus("Ready for paste.");
        inputEditor.focus();
      });
    }

    if (copyVisibleButton) {
      copyVisibleButton.addEventListener("click", async () => {
        const result = sanitizeDoc(inputDoc, getOptions());
        const visibleText = docToPlainText(result.doc, destinationSelect.value);
        try {
          await navigator.clipboard.writeText(visibleText);
          setStatus("Copied visible text.");
        } catch (error) {
          setStatus("Clipboard write failed; select the preview and copy manually.");
        }
      });
    }

    if (destinationCopyButton) {
      destinationCopyButton.addEventListener("click", async () => {
        const destination = destinationSelect.value;
        const options = getOptions();
        const result = sanitizeDoc(inputDoc, options);
        const visibleText = docToPlainText(result.doc, destination);

        if (destination === "gmail") {
          const html = buildGmailHtmlFromDoc(result.doc, options);
          try {
            if (!navigator.clipboard || !global.ClipboardItem) throw new Error("HTML clipboard unavailable");
            await navigator.clipboard.write([
              new ClipboardItem({
                "text/html": new Blob([html], { type: "text/html" })
              })
            ]);
            setStatus("Copied Gmail-compatible rendered HTML.");
          } catch (error) {
            try {
              await navigator.clipboard.writeText(visibleText);
              setStatus("HTML clipboard unavailable; copied visible text instead.");
            } catch (fallbackError) {
              setStatus("Clipboard write failed; select the preview and copy manually.");
            }
          }
          return;
        }

        if ((destination === "googleDocs" || destination === "word" || destination === "outlook") && options.structuredListsForDocs) {
          const html = buildDocumentHtmlFromDoc(result.doc, options);
          try {
            if (!navigator.clipboard || !global.ClipboardItem) throw new Error("HTML clipboard unavailable");
            await navigator.clipboard.write([
              new ClipboardItem({
                "text/html": new Blob([html], { type: "text/html" }),
                "text/plain": new Blob([visibleText], { type: "text/plain" })
              })
            ]);
            setStatus(`Copied structured content for ${DESTINATIONS[destination].label}.`);
          } catch (error) {
            try {
              await navigator.clipboard.writeText(visibleText);
              setStatus("HTML clipboard unavailable; copied visible text instead.");
            } catch (fallbackError) {
              setStatus("Clipboard write failed; select the preview and copy manually.");
            }
          }
          return;
        }

        try {
          await navigator.clipboard.writeText(visibleText);
          setStatus(`Copied for ${DESTINATIONS[destination].label}.`);
        } catch (error) {
          setStatus("Clipboard write failed; select the preview and copy manually.");
        }
      });
    }

    applyTheme(loadThemePreference() === "dark");
    refreshStyleControls();
    applyPresetAndProfile();
    filterAdvancedSettings();
  }

  const API = {
    sanitize,
    buildGmailHtml,
    buildGmailHtmlFromDoc,
    buildDocumentHtmlFromDoc,
    parsePlainTextToDoc,
    parseHtmlToDoc,
    sanitizeDoc,
    docToPlainText,
    buildOptions,
    PRESETS,
    DESTINATIONS,
    OPTION_DEFAULTS
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = API;
  } else {
    global.TextSanitizer = API;
  }

  if (typeof document !== "undefined") {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", bindDom);
    } else {
      bindDom();
    }
  }
})(typeof window !== "undefined" ? window : globalThis);
