(function (global) {
  "use strict";

  const DEFAULT_OPTIONS = Object.freeze({
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
    convertBullets: true,

    normalizeFullwidth: true,
    expandLigatures: true,
    normalizeFractions: false,
    normalizeSuperscriptsSubscripts: false,
    removeEmoji: false,

    smartQuotes: false,
    smartDashes: false,
    numericRangesToEnDash: false,
    smartEllipsis: false,
    smartFractions: false,

    strictAscii: false,
    foldAccents: true,
    replaceSymbolsAscii: true
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
      convertBullets: true,
      normalizeFullwidth: true,
      expandLigatures: true,
      normalizeFractions: false,
      normalizeSuperscriptsSubscripts: false,
      removeEmoji: false,
      smartQuotes: false,
      smartDashes: false,
      numericRangesToEnDash: false,
      smartEllipsis: false,
      smartFractions: false,
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
      strictAscii: false,
      foldAccents: true,
      replaceSymbolsAscii: true
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
      convertBullets: true,
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
      strictAscii: true,
      foldAccents: true,
      replaceSymbolsAscii: true
    }
  });

  const DESTINATIONS = Object.freeze({
    gmail: {
      label: "Gmail",
      copyLabel: "Copy for Gmail",
      copyMode: "gmailHtml",
      note: "Keyboard punctuation with Gmail-shaped Verdana HTML for paragraph/font behavior. No hidden characters are intentionally added.",
      overrides: {
        smartQuotes: false,
        smartDashes: false,
        numericRangesToEnDash: false,
        smartEllipsis: false,
        smartFractions: false,
        strictAscii: false,
        normalizeFractions: false,
        normalizeSuperscriptsSubscripts: false
      }
    },
    googleDocs: {
      label: "Google Docs",
      copyLabel: "Copy for Google Docs",
      copyMode: "plain",
      note: "Document typography: smart quotes, em dashes, ellipses, and numeric en dashes. Copied as text/plain so Docs can inherit the current document style.",
      overrides: {
        smartQuotes: true,
        smartDashes: true,
        numericRangesToEnDash: true,
        smartEllipsis: true,
        smartFractions: false,
        strictAscii: false
      }
    },
    word: {
      label: "Microsoft Word",
      copyLabel: "Copy for Word",
      copyMode: "plain",
      note: "Document typography: smart quotes, em dashes, ellipses, and numeric en dashes. Copied as text/plain so Word can inherit the current document style.",
      overrides: {
        smartQuotes: true,
        smartDashes: true,
        numericRangesToEnDash: true,
        smartEllipsis: true,
        smartFractions: false,
        strictAscii: false
      }
    },
    plain: {
      label: "Plain text / forms",
      copyLabel: "Copy plain text",
      copyMode: "plain",
      note: "Keyboard-safe punctuation, normalized spacing, and text/plain clipboard output for forms, CMS fields, terminals, and generic editors.",
      overrides: {
        smartQuotes: false,
        smartDashes: false,
        numericRangesToEnDash: false,
        smartEllipsis: false,
        smartFractions: false,
        strictAscii: false
      }
    },
    strictAscii: {
      label: "Strict ASCII",
      copyLabel: "Copy strict ASCII",
      copyMode: "plain",
      note: "Aggressive ASCII output: no smart punctuation, hidden characters, emoji, accents, ligatures, single-character fractions, or typographic symbols.",
      overrides: {
        smartQuotes: false,
        smartDashes: false,
        numericRangesToEnDash: false,
        smartEllipsis: false,
        smartFractions: false,
        strictAscii: true,
        foldAccents: true,
        replaceSymbolsAscii: true,
        removeEmoji: true,
        normalizeFractions: true,
        normalizeSuperscriptsSubscripts: true,
        preservePrimeMarks: false
      }
    }
  });

  const REGEX = Object.freeze({
    hiddenChars: /[\u00AD\u034F\u061C\u115F\u1160\u17B4\u17B5\u180B-\u180E\u200B-\u200F\u202A-\u202E\u2060-\u206F\uFE00-\uFE0F\uFEFF\uFFF9-\uFFFB]|[\u{E0000}-\u{E007F}]/gu,
    unicodeSeparators: /\u2028|\u2029/g,
    unusualSpaces: /[\u00A0\u1680\u180E\u2000-\u200A\u202F\u205F\u3000]/g,
    emoji: /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}]/gu,
    combiningMarks: /[\u0300-\u036f]/g,
    nonAscii: /[^\x00-\x7F]/g
  });

  const SINGLE_QUOTE_LIKE = new Set(Array.from("‘’‚‛‹›′‵ʹʼʻˈ＇´`ʽ՚❛❜"));
  const DOUBLE_QUOTE_LIKE = new Set(Array.from("“”„‟«»″‶〝〞〟＂❝❞"));
  const PRIME_MARKS = new Set(Array.from("′″‴‵‶‷"));
  const EM_DASH_LIKE = new Set(Array.from("—―"));
  const EN_DASH_LIKE = new Set(Array.from("‐‑‒–−﹘﹣－"));
  const DOT_LEADER_MAP = Object.freeze({ "…": "...", "․": ".", "‥": ".." });

  const FULLWIDTH_EXTRA_MAP = Object.freeze({
    "　": " "
  });

  const LIGATURE_MAP = Object.freeze({
    "ﬀ": "ff",
    "ﬁ": "fi",
    "ﬂ": "fl",
    "ﬃ": "ffi",
    "ﬄ": "ffl",
    "ﬅ": "st",
    "ﬆ": "st"
  });

  const FRACTION_TO_ASCII = Object.freeze({
    "¼": "1/4",
    "½": "1/2",
    "¾": "3/4",
    "⅐": "1/7",
    "⅑": "1/9",
    "⅒": "1/10",
    "⅓": "1/3",
    "⅔": "2/3",
    "⅕": "1/5",
    "⅖": "2/5",
    "⅗": "3/5",
    "⅘": "4/5",
    "⅙": "1/6",
    "⅚": "5/6",
    "⅛": "1/8",
    "⅜": "3/8",
    "⅝": "5/8",
    "⅞": "7/8"
  });

  const ASCII_TO_FRACTION = Object.freeze({
    "1/4": "¼",
    "1/2": "½",
    "3/4": "¾",
    "1/3": "⅓",
    "2/3": "⅔",
    "1/5": "⅕",
    "2/5": "⅖",
    "3/5": "⅗",
    "4/5": "⅘",
    "1/6": "⅙",
    "5/6": "⅚",
    "1/8": "⅛",
    "3/8": "⅜",
    "5/8": "⅝",
    "7/8": "⅞"
  });

  const SUPER_SUB_MAP = Object.freeze({
    "⁰": "0", "¹": "1", "²": "2", "³": "3", "⁴": "4", "⁵": "5", "⁶": "6", "⁷": "7", "⁸": "8", "⁹": "9",
    "₀": "0", "₁": "1", "₂": "2", "₃": "3", "₄": "4", "₅": "5", "₆": "6", "₇": "7", "₈": "8", "₉": "9",
    "⁺": "+", "⁻": "-", "⁼": "=", "⁽": "(", "⁾": ")", "ⁿ": "n", "ⁱ": "i",
    "₊": "+", "₋": "-", "₌": "=", "₍": "(", "₎": ")", "ₐ": "a", "ₑ": "e", "ₕ": "h", "ᵢ": "i", "ⱼ": "j", "ₖ": "k", "ₗ": "l", "ₘ": "m", "ₙ": "n", "ₒ": "o", "ₚ": "p", "ᵣ": "r", "ₛ": "s", "ₜ": "t", "ᵤ": "u", "ᵥ": "v", "ₓ": "x"
  });

  const SYMBOL_ASCII_MAP = Object.freeze({
    "©": "(c)",
    "®": "(R)",
    "™": "TM",
    "℠": "SM",
    "№": "No.",
    "§": "Section",
    "¶": "Paragraph",
    "†": "*",
    "‡": "**",
    "•": "-",
    "‣": "-",
    "◦": "-",
    "⁃": "-",
    "‰": " per mille",
    "‱": " per ten thousand",
    "°": " degrees",
    "×": "x",
    "÷": "/",
    "±": "+/-",
    "≤": "<=",
    "≥": ">=",
    "≠": "!=",
    "≈": "~",
    "→": "->",
    "←": "<-",
    "↔": "<->"
  });

  const CODE_POINT_NAMES = Object.freeze({
    "U+0009": "CHARACTER TABULATION",
    "U+000A": "LINE FEED",
    "U+000D": "CARRIAGE RETURN",
    "U+0020": "SPACE",
    "U+0021": "EXCLAMATION MARK",
    "U+0022": "QUOTATION MARK",
    "U+0027": "APOSTROPHE",
    "U+0028": "LEFT PARENTHESIS",
    "U+0029": "RIGHT PARENTHESIS",
    "U+002D": "HYPHEN-MINUS",
    "U+002E": "FULL STOP",
    "U+002F": "SOLIDUS",
    "U+00A0": "NO-BREAK SPACE",
    "U+00A9": "COPYRIGHT SIGN",
    "U+00AB": "LEFT-POINTING DOUBLE ANGLE QUOTATION MARK",
    "U+00AD": "SOFT HYPHEN",
    "U+00AE": "REGISTERED SIGN",
    "U+00B0": "DEGREE SIGN",
    "U+00B4": "ACUTE ACCENT",
    "U+00BB": "RIGHT-POINTING DOUBLE ANGLE QUOTATION MARK",
    "U+00BC": "VULGAR FRACTION ONE QUARTER",
    "U+00BD": "VULGAR FRACTION ONE HALF",
    "U+00BE": "VULGAR FRACTION THREE QUARTERS",
    "U+034F": "COMBINING GRAPHEME JOINER",
    "U+061C": "ARABIC LETTER MARK",
    "U+1680": "OGHAM SPACE MARK",
    "U+180B": "MONGOLIAN FREE VARIATION SELECTOR ONE",
    "U+180C": "MONGOLIAN FREE VARIATION SELECTOR TWO",
    "U+180D": "MONGOLIAN FREE VARIATION SELECTOR THREE",
    "U+180E": "MONGOLIAN VOWEL SEPARATOR",
    "U+2000": "EN QUAD",
    "U+2001": "EM QUAD",
    "U+2002": "EN SPACE",
    "U+2003": "EM SPACE",
    "U+2004": "THREE-PER-EM SPACE",
    "U+2005": "FOUR-PER-EM SPACE",
    "U+2006": "SIX-PER-EM SPACE",
    "U+2007": "FIGURE SPACE",
    "U+2008": "PUNCTUATION SPACE",
    "U+2009": "THIN SPACE",
    "U+200A": "HAIR SPACE",
    "U+200B": "ZERO WIDTH SPACE",
    "U+200C": "ZERO WIDTH NON-JOINER",
    "U+200D": "ZERO WIDTH JOINER",
    "U+200E": "LEFT-TO-RIGHT MARK",
    "U+200F": "RIGHT-TO-LEFT MARK",
    "U+2010": "HYPHEN",
    "U+2011": "NON-BREAKING HYPHEN",
    "U+2012": "FIGURE DASH",
    "U+2013": "EN DASH",
    "U+2014": "EM DASH",
    "U+2015": "HORIZONTAL BAR",
    "U+2018": "LEFT SINGLE QUOTATION MARK",
    "U+2019": "RIGHT SINGLE QUOTATION MARK",
    "U+201A": "SINGLE LOW-9 QUOTATION MARK",
    "U+201B": "SINGLE HIGH-REVERSED-9 QUOTATION MARK",
    "U+201C": "LEFT DOUBLE QUOTATION MARK",
    "U+201D": "RIGHT DOUBLE QUOTATION MARK",
    "U+201E": "DOUBLE LOW-9 QUOTATION MARK",
    "U+201F": "DOUBLE HIGH-REVERSED-9 QUOTATION MARK",
    "U+2022": "BULLET",
    "U+2023": "TRIANGULAR BULLET",
    "U+2024": "ONE DOT LEADER",
    "U+2025": "TWO DOT LEADER",
    "U+2026": "HORIZONTAL ELLIPSIS",
    "U+2028": "LINE SEPARATOR",
    "U+2029": "PARAGRAPH SEPARATOR",
    "U+202A": "LEFT-TO-RIGHT EMBEDDING",
    "U+202B": "RIGHT-TO-LEFT EMBEDDING",
    "U+202C": "POP DIRECTIONAL FORMATTING",
    "U+202D": "LEFT-TO-RIGHT OVERRIDE",
    "U+202E": "RIGHT-TO-LEFT OVERRIDE",
    "U+202F": "NARROW NO-BREAK SPACE",
    "U+2030": "PER MILLE SIGN",
    "U+2031": "PER TEN THOUSAND SIGN",
    "U+2032": "PRIME",
    "U+2033": "DOUBLE PRIME",
    "U+2034": "TRIPLE PRIME",
    "U+2035": "REVERSED PRIME",
    "U+2036": "REVERSED DOUBLE PRIME",
    "U+2037": "REVERSED TRIPLE PRIME",
    "U+2043": "HYPHEN BULLET",
    "U+205F": "MEDIUM MATHEMATICAL SPACE",
    "U+2060": "WORD JOINER",
    "U+2061": "FUNCTION APPLICATION",
    "U+2062": "INVISIBLE TIMES",
    "U+2063": "INVISIBLE SEPARATOR",
    "U+2064": "INVISIBLE PLUS",
    "U+2122": "TRADE MARK SIGN",
    "U+2100": "ACCOUNT OF",
    "U+2116": "NUMERO SIGN",
    "U+2212": "MINUS SIGN",
    "U+2219": "BULLET OPERATOR",
    "U+25E6": "WHITE BULLET",
    "U+275B": "HEAVY SINGLE TURNED COMMA QUOTATION MARK ORNAMENT",
    "U+275C": "HEAVY SINGLE COMMA QUOTATION MARK ORNAMENT",
    "U+275D": "HEAVY DOUBLE TURNED COMMA QUOTATION MARK ORNAMENT",
    "U+275E": "HEAVY DOUBLE COMMA QUOTATION MARK ORNAMENT",
    "U+3000": "IDEOGRAPHIC SPACE",
    "U+301D": "REVERSED DOUBLE PRIME QUOTATION MARK",
    "U+301E": "DOUBLE PRIME QUOTATION MARK",
    "U+301F": "LOW DOUBLE PRIME QUOTATION MARK",
    "U+FB00": "LATIN SMALL LIGATURE FF",
    "U+FB01": "LATIN SMALL LIGATURE FI",
    "U+FB02": "LATIN SMALL LIGATURE FL",
    "U+FB03": "LATIN SMALL LIGATURE FFI",
    "U+FB04": "LATIN SMALL LIGATURE FFL",
    "U+FB05": "LATIN SMALL LIGATURE LONG S T",
    "U+FB06": "LATIN SMALL LIGATURE ST",
    "U+FE00": "VARIATION SELECTOR-1",
    "U+FE0F": "VARIATION SELECTOR-16",
    "U+FEFF": "ZERO WIDTH NO-BREAK SPACE",
    "U+FF02": "FULLWIDTH QUOTATION MARK",
    "U+FF07": "FULLWIDTH APOSTROPHE",
    "U+FF0D": "FULLWIDTH HYPHEN-MINUS"
  });

  function cp(char) {
    const value = char.codePointAt(0).toString(16).toUpperCase().padStart(4, "0");
    return `U+${value}`;
  }

  function nameFor(char) {
    return CODE_POINT_NAMES[cp(char)] || "UNKNOWN CHARACTER";
  }

  function charLabel(text) {
    if (text === "") return "removed";
    return Array.from(text).map(char => `${cp(char)} ${nameFor(char)}`).join(" + ");
  }

  function makeState() {
    return {
      changes: new Map(),
      warnings: [],
      stats: {
        inputCharacters: 0,
        outputCharacters: 0,
        sourceChanges: 0,
        destinationChanges: 0,
        hiddenRemoved: 0,
        spacesNormalized: 0,
        punctuationChanged: 0,
        strictChanged: 0,
        remainingNonAscii: 0
      }
    };
  }

  function addChange(state, category, original, replacement, count = 1) {
    if (count <= 0) return;
    const key = `${category}\u0000${original}\u0000${replacement}`;
    const existing = state.changes.get(key);
    if (existing) {
      existing.count += count;
    } else {
      state.changes.set(key, { category, original, replacement, count });
    }
    if (category === "Destination typography") state.stats.destinationChanges += count;
    else state.stats.sourceChanges += count;

    if (category === "Hidden cleanup") state.stats.hiddenRemoved += count;
    if (category === "Space cleanup") state.stats.spacesNormalized += count;
    if (category === "Quote cleanup" || category === "Dash cleanup" || category === "Ellipsis cleanup" || category === "Bullet cleanup" || category === "Destination typography") state.stats.punctuationChanged += count;
    if (category === "Strict ASCII" || category === "Compatibility cleanup") state.stats.strictChanged += count;
  }

  function replaceEach(text, regex, replacer) {
    return text.replace(regex, (...args) => {
      const match = args[0];
      return replacer(match, args);
    });
  }

  function normalizeLineEndings(text, state) {
    let count = 0;
    const output = text.replace(/\r\n|\r/g, match => {
      count += 1;
      addChange(state, "Line cleanup", match, "\n");
      return "\n";
    });
    return output;
  }

  function normalizeSeparators(text, state) {
    return text.replace(REGEX.unicodeSeparators, match => {
      const replacement = match === "\u2029" ? "\n\n" : "\n";
      addChange(state, "Line cleanup", match, replacement);
      return replacement;
    });
  }

  function normalizeSpaces(text, state) {
    return text.replace(REGEX.unusualSpaces, match => {
      addChange(state, "Space cleanup", match, " ");
      return " ";
    });
  }

  function removeHidden(text, state) {
    return text.replace(REGEX.hiddenChars, match => {
      addChange(state, "Hidden cleanup", match, "");
      return "";
    });
  }

  function convertTabs(text, state) {
    return text.replace(/\t/g, match => {
      addChange(state, "Space cleanup", match, "    ");
      return "    ";
    });
  }

  function trimTrailingSpaces(text, state) {
    return text.replace(/[ \t]+$/gm, match => {
      addChange(state, "Space cleanup", match, "");
      return "";
    });
  }

  function limitBlankLines(text, state) {
    return text.replace(/\n{3,}/g, match => {
      addChange(state, "Line cleanup", match, "\n\n");
      return "\n\n";
    });
  }

  function collapseRepeatedSpaces(text, state) {
    return text.replace(/ {2,}/g, match => {
      addChange(state, "Space cleanup", match, " ");
      return " ";
    });
  }

  function normalizeFullwidth(text, state) {
    let output = "";
    for (const char of text) {
      const code = char.codePointAt(0);
      if (FULLWIDTH_EXTRA_MAP[char]) {
        addChange(state, "Compatibility cleanup", char, FULLWIDTH_EXTRA_MAP[char]);
        output += FULLWIDTH_EXTRA_MAP[char];
      } else if (code >= 0xFF01 && code <= 0xFF5E) {
        const replacement = String.fromCodePoint(code - 0xFEE0);
        addChange(state, "Compatibility cleanup", char, replacement);
        output += replacement;
      } else {
        output += char;
      }
    }
    return output;
  }

  function expandLigatures(text, state) {
    return Array.from(text).map(char => {
      if (LIGATURE_MAP[char]) {
        addChange(state, "Compatibility cleanup", char, LIGATURE_MAP[char]);
        return LIGATURE_MAP[char];
      }
      return char;
    }).join("");
  }

  function normalizeFractions(text, state) {
    return Array.from(text).map(char => {
      if (FRACTION_TO_ASCII[char]) {
        addChange(state, "Compatibility cleanup", char, FRACTION_TO_ASCII[char]);
        return FRACTION_TO_ASCII[char];
      }
      return char;
    }).join("");
  }

  function normalizeSuperscriptsSubscripts(text, state) {
    return Array.from(text).map(char => {
      if (SUPER_SUB_MAP[char]) {
        addChange(state, "Compatibility cleanup", char, SUPER_SUB_MAP[char]);
        return SUPER_SUB_MAP[char];
      }
      return char;
    }).join("");
  }

  function normalizeQuoteLikes(text, state, options) {
    let output = "";
    for (const char of text) {
      if (PRIME_MARKS.has(char) && options.preservePrimeMarks) {
        output += char;
      } else if (SINGLE_QUOTE_LIKE.has(char)) {
        addChange(state, "Quote cleanup", char, "'");
        output += "'";
      } else if (DOUBLE_QUOTE_LIKE.has(char)) {
        addChange(state, "Quote cleanup", char, '"');
        output += '"';
      } else {
        output += char;
      }
    }
    return output;
  }

  function normalizeDashes(text, state) {
    let output = "";
    for (const char of text) {
      if (EM_DASH_LIKE.has(char)) {
        addChange(state, "Dash cleanup", char, " -- ");
        output += " -- ";
      } else if (EN_DASH_LIKE.has(char)) {
        addChange(state, "Dash cleanup", char, "-");
        output += "-";
      } else {
        output += char;
      }
    }
    output = output.replace(/ {2,}-- {2,}| ?-- ?/g, match => {
      const replacement = " -- ";
      if (match !== replacement) addChange(state, "Dash cleanup", match, replacement);
      return replacement;
    });
    output = output.replace(/[ \t]+\n/g, match => {
      addChange(state, "Space cleanup", match, "\n");
      return "\n";
    });
    return output;
  }

  function normalizeEllipsis(text, state) {
    return Array.from(text).map(char => {
      if (DOT_LEADER_MAP[char]) {
        addChange(state, "Ellipsis cleanup", char, DOT_LEADER_MAP[char]);
        return DOT_LEADER_MAP[char];
      }
      return char;
    }).join("");
  }

  function convertBullets(text, state) {
    return text.replace(/^(\s*)([•‣◦⁃∙])\s+/gm, (match, leading, bullet) => {
      const replacement = `${leading}- `;
      addChange(state, "Bullet cleanup", bullet, "-");
      return replacement;
    });
  }

  function removeEmoji(text, state) {
    return text.replace(REGEX.emoji, match => {
      addChange(state, "Strict ASCII", match, "");
      return "";
    });
  }

  function smartenQuotes(text, state) {
    let output = "";
    let doubleOpen = true;
    let singleOpen = true;
    const chars = Array.from(text);

    function previousVisible(index) {
      for (let i = output.length - 1; i >= 0; i -= 1) {
        const ch = output[i];
        if (!/\s/.test(ch)) return ch;
      }
      return "";
    }

    for (let i = 0; i < chars.length; i += 1) {
      const char = chars[i];
      const prev = i === 0 ? "" : chars[i - 1];
      const next = i + 1 < chars.length ? chars[i + 1] : "";
      const priorVisible = previousVisible(i);

      if (char === '"') {
        const isOpening = !priorVisible || /[\s([{<\n\r\t\u2014\u2013-]/.test(priorVisible) || doubleOpen;
        const replacement = isOpening ? "“" : "”";
        addChange(state, "Destination typography", char, replacement);
        output += replacement;
        doubleOpen = !isOpening;
      } else if (char === "'") {
        const betweenWordChars = /[A-Za-z0-9]/.test(prev) && /[A-Za-z0-9]/.test(next);
        const leadingDecade = !/[A-Za-z0-9]/.test(prev) && /[0-9]/.test(next);
        if (betweenWordChars || leadingDecade || (/[A-Za-z0-9]/.test(prev) && !/[A-Za-z0-9]/.test(next))) {
          addChange(state, "Destination typography", char, "’");
          output += "’";
          singleOpen = true;
        } else {
          const isOpening = !priorVisible || /[\s([{<\n\r\t\u2014\u2013-]/.test(priorVisible) || singleOpen;
          const replacement = isOpening ? "‘" : "’";
          addChange(state, "Destination typography", char, replacement);
          output += replacement;
          singleOpen = !isOpening;
        }
      } else {
        output += char;
      }
    }
    return output;
  }

  function smartenDashes(text, state, options) {
    let output = text;
    if (options.numericRangesToEnDash) {
      output = output.replace(/\b(\d{1,4})\s*-\s*(\d{1,4})\b/g, (match, start, end) => {
        const replacement = `${start}–${end}`;
        if (match !== replacement) addChange(state, "Destination typography", match, replacement);
        return replacement;
      });
    }
    output = output.replace(/\s*--\s*/g, match => {
      addChange(state, "Destination typography", match, "—");
      return "—";
    });
    return output;
  }

  function smartenEllipsis(text, state) {
    return text.replace(/\.\.\./g, match => {
      addChange(state, "Destination typography", match, "…");
      return "…";
    });
  }

  function smartenFractions(text, state) {
    return text.replace(/\b(1\/4|1\/2|3\/4|1\/3|2\/3|1\/5|2\/5|3\/5|4\/5|1\/6|5\/6|1\/8|3\/8|5\/8|7\/8)\b/g, match => {
      const replacement = ASCII_TO_FRACTION[match];
      addChange(state, "Destination typography", match, replacement);
      return replacement;
    });
  }

  function replaceSymbolsAscii(text, state) {
    return Array.from(text).map(char => {
      if (SYMBOL_ASCII_MAP[char]) {
        addChange(state, "Strict ASCII", char, SYMBOL_ASCII_MAP[char]);
        return SYMBOL_ASCII_MAP[char];
      }
      return char;
    }).join("");
  }

  function strictAscii(text, state, options) {
    let output = text;
    if (options.foldAccents) {
      const normalized = output.normalize("NFKD");
      output = normalized.replace(REGEX.combiningMarks, mark => {
        addChange(state, "Strict ASCII", mark, "");
        return "";
      });
    }
    if (options.replaceSymbolsAscii) {
      output = replaceSymbolsAscii(output, state);
    }
    output = output.replace(REGEX.nonAscii, match => {
      addChange(state, "Strict ASCII", match, "");
      return "";
    });
    return output;
  }

  function applySourceCleanup(inputText, options, state) {
    let text = inputText;
    state.stats.inputCharacters = Array.from(inputText).length;

    if (options.normalizeLineEndings) text = normalizeLineEndings(text, state);
    if (options.normalizeSeparators) text = normalizeSeparators(text, state);
    if (options.removeHidden) text = removeHidden(text, state);
    if (options.normalizeFullwidth) text = normalizeFullwidth(text, state);
    if (options.normalizeSpaces) text = normalizeSpaces(text, state);
    if (options.convertTabs) text = convertTabs(text, state);
    if (options.expandLigatures) text = expandLigatures(text, state);
    if (options.normalizeFractions) text = normalizeFractions(text, state);
    if (options.normalizeSuperscriptsSubscripts) text = normalizeSuperscriptsSubscripts(text, state);
    if (options.normalizeQuotes) text = normalizeQuoteLikes(text, state, options);
    if (options.normalizeDashes) text = normalizeDashes(text, state);
    if (options.normalizeEllipsis) text = normalizeEllipsis(text, state);
    if (options.convertBullets) text = convertBullets(text, state);
    if (options.removeEmoji) text = removeEmoji(text, state);
    if (options.collapseRepeatedSpaces) text = collapseRepeatedSpaces(text, state);
    if (options.trimTrailingSpaces) text = trimTrailingSpaces(text, state);
    if (options.limitBlankLines) text = limitBlankLines(text, state);

    return text.trim();
  }

  function applyDestinationTypography(cleanText, options, state) {
    let text = cleanText;
    if (options.smartDashes || options.numericRangesToEnDash) text = smartenDashes(text, state, options);
    if (options.smartEllipsis) text = smartenEllipsis(text, state);
    if (options.smartFractions) text = smartenFractions(text, state);
    if (options.smartQuotes) text = smartenQuotes(text, state);
    if (options.strictAscii) text = strictAscii(text, state, options);
    state.stats.outputCharacters = Array.from(text).length;
    state.stats.remainingNonAscii = collectNonAscii(text).length;
    return text;
  }

  function sanitize(inputText, options) {
    const state = makeState();
    const cleanText = applySourceCleanup(inputText, options, state);
    const outputText = applyDestinationTypography(cleanText, options, state);
    const nonAscii = collectNonAscii(outputText);

    if (nonAscii.length > 0 && options.strictAscii) {
      state.warnings.push("Strict ASCII is enabled, but non-ASCII characters remain. Check the remaining-character list.");
    }
    if (!options.removeHidden) {
      state.warnings.push("Hidden-character removal is disabled.");
    }
    if (options.smartFractions) {
      state.warnings.push("Smart fraction conversion can change plain numeric strings into typographic fraction characters.");
    }

    return {
      cleanText,
      outputText,
      stats: state.stats,
      changes: Array.from(state.changes.values()).sort((a, b) => a.category.localeCompare(b.category) || a.original.localeCompare(b.original)),
      warnings: state.warnings,
      nonAscii
    };
  }

  function collectNonAscii(text) {
    const map = new Map();
    for (const char of text) {
      if (/[^\x00-\x7F]/.test(char)) {
        const key = `${char}\u0000${cp(char)}`;
        const existing = map.get(key);
        if (existing) existing.count += 1;
        else map.set(key, { char, code: cp(char), name: nameFor(char), count: 1 });
      }
    }
    return Array.from(map.values()).sort((a, b) => a.code.localeCompare(b.code));
  }

  function escapeHtml(text) {
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;");
  }

  function buildGmailHtml(text) {
    const style = 'class="gmail_default" style="font-family: verdana, sans-serif;"';
    const lines = text.split("\n");
    let lastNonEmpty = -1;
    lines.forEach((line, index) => {
      if (line.length > 0) lastNonEmpty = index;
    });

    const body = lines.map((line, index) => {
      if (line.length === 0) {
        return `<div ${style}><br></div>`;
      }
      const br = index === lastNonEmpty ? "<br>" : "";
      return `<div ${style}>${escapeHtml(line)}${br}</div>`;
    }).join("");

    return `<div>${body}<br clear="all"></div>`;
  }

  async function copyPlain(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return;
    }
    fallbackCopyText(text);
  }

  async function copyGmailHtml(text) {
    const html = buildGmailHtml(text);
    if (navigator.clipboard && navigator.clipboard.write && global.ClipboardItem) {
      const item = new ClipboardItem({
        "text/html": new Blob([html], { type: "text/html" })
      });
      await navigator.clipboard.write([item]);
      return;
    }
    fallbackCopyHtml(html);
  }

  function fallbackCopyText(text) {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.left = "-9999px";
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    document.body.removeChild(textarea);
  }

  function fallbackCopyHtml(html) {
    const div = document.createElement("div");
    div.contentEditable = "true";
    div.innerHTML = html;
    div.style.position = "fixed";
    div.style.left = "-9999px";
    div.style.top = "0";
    document.body.appendChild(div);
    const range = document.createRange();
    range.selectNodeContents(div);
    const selection = global.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
    document.execCommand("copy");
    selection.removeAllRanges();
    document.body.removeChild(div);
  }

  function mergeOptions(base, overrides) {
    return Object.assign({}, DEFAULT_OPTIONS, base || {}, overrides || {});
  }

  function optionElements() {
    return Array.from(document.querySelectorAll("[data-option]"));
  }

  function readOptions() {
    const options = Object.assign({}, DEFAULT_OPTIONS);
    optionElements().forEach(input => {
      options[input.dataset.option] = input.checked;
    });
    return options;
  }

  function writeOptions(options) {
    optionElements().forEach(input => {
      if (Object.prototype.hasOwnProperty.call(options, input.dataset.option)) {
        input.checked = Boolean(options[input.dataset.option]);
      }
    });
  }

  function currentDestination() {
    const select = document.getElementById("destinationSelect");
    return DESTINATIONS[select.value] || DESTINATIONS.gmail;
  }

  function applyPreset(presetName) {
    const destinationKey = document.getElementById("destinationSelect").value;
    const preset = PRESETS[presetName] || PRESETS.standard;
    const destination = DESTINATIONS[destinationKey] || DESTINATIONS.gmail;
    writeOptions(mergeOptions(preset, destination.overrides));
  }

  function renderStats(result) {
    const statsList = document.getElementById("statsList");
    const stats = [
      [result.stats.inputCharacters, "input chars"],
      [result.stats.outputCharacters, "output chars"],
      [result.stats.sourceChanges, "source changes"],
      [result.stats.destinationChanges, "destination changes"],
      [result.stats.hiddenRemoved, "hidden removed"],
      [result.stats.remainingNonAscii, "non-ASCII left"]
    ];
    statsList.innerHTML = stats.map(([number, label]) => `<li><span class="stat-number">${number}</span><span class="stat-label">${label}</span></li>`).join("");
  }

  function renderChanges(result) {
    const changesList = document.getElementById("changesList");
    if (result.changes.length === 0) {
      changesList.innerHTML = "<li>No character changes.</li>";
      return;
    }
    const items = result.changes.slice(0, 80).map(change => {
      const original = charLabel(change.original);
      const replacement = change.replacement === "" ? "removed" : charLabel(change.replacement);
      return `<li><strong>${change.category}</strong>: <span class="codepoint">${escapeHtml(original)}</span> → <span class="codepoint">${escapeHtml(replacement)}</span> <span class="stat-label">×${change.count}</span></li>`;
    });
    if (result.changes.length > 80) items.push(`<li>${result.changes.length - 80} more change types omitted.</li>`);
    changesList.innerHTML = items.join("");
  }

  function renderWarnings(result) {
    const warningsList = document.getElementById("warningsList");
    if (result.warnings.length === 0) {
      warningsList.innerHTML = "<li>No warnings.</li>";
      return;
    }
    warningsList.innerHTML = result.warnings.map(warning => `<li>${escapeHtml(warning)}</li>`).join("");
  }

  function renderNonAscii(result) {
    const list = document.getElementById("nonAsciiList");
    if (result.nonAscii.length === 0) {
      list.innerHTML = "<li>None.</li>";
      return;
    }
    list.innerHTML = result.nonAscii.slice(0, 80).map(item => `<li><span class="codepoint">${escapeHtml(item.char)} ${item.code} ${item.name}</span> <span class="stat-label">×${item.count}</span></li>`).join("");
  }

  function updateDestinationUi() {
    const destination = currentDestination();
    document.getElementById("destinationCopyButton").textContent = destination.copyLabel;
    document.getElementById("destinationNote").textContent = destination.note;
  }

  function run() {
    const input = document.getElementById("inputText").value;
    const result = sanitize(input, readOptions());
    document.getElementById("outputText").value = result.outputText;
    renderStats(result);
    renderChanges(result);
    renderWarnings(result);
    renderNonAscii(result);
    return result;
  }

  function setStatus(message) {
    const status = document.getElementById("status");
    status.textContent = message;
    if (message) {
      global.clearTimeout(setStatus.timer);
      setStatus.timer = global.setTimeout(() => {
        status.textContent = "";
      }, 2500);
    }
  }

  function init() {
    const input = document.getElementById("inputText");
    const output = document.getElementById("outputText");
    const clear = document.getElementById("clearButton");
    const copyVisible = document.getElementById("copyVisibleButton");
    const copyDestination = document.getElementById("destinationCopyButton");
    const preset = document.getElementById("presetSelect");
    const destination = document.getElementById("destinationSelect");

    writeOptions(mergeOptions(PRESETS.standard, DESTINATIONS.gmail.overrides));
    updateDestinationUi();
    run();

    input.addEventListener("input", run);
    optionElements().forEach(checkbox => checkbox.addEventListener("change", run));

    preset.addEventListener("change", () => {
      applyPreset(preset.value);
      run();
    });

    destination.addEventListener("change", () => {
      applyPreset(preset.value);
      updateDestinationUi();
      run();
    });

    clear.addEventListener("click", () => {
      input.value = "";
      run();
      input.focus();
    });

    copyVisible.addEventListener("click", async () => {
      await copyPlain(output.value);
      setStatus("Copied textarea text as text/plain.");
    });

    copyDestination.addEventListener("click", async () => {
      const dest = currentDestination();
      if (dest.copyMode === "gmailHtml") {
        await copyGmailHtml(output.value);
        setStatus("Copied Gmail-compatible HTML.");
      } else {
        await copyPlain(output.value);
        setStatus(`Copied for ${dest.label} as text/plain.`);
      }
    });
  }

  global.CopySanitizer = {
    sanitize,
    buildGmailHtml,
    PRESETS,
    DESTINATIONS
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})(window);
