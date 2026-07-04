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
    convertBullets: true,
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
  });

  const DESTINATIONS = Object.freeze({
    gmail: {
      label: "Gmail",
      copyLabel: "Copy Gmail HTML",
      note: "Keyboard punctuation in the visible output. The primary copy action writes Gmail-shaped rendered HTML with Verdana paragraph divs.",
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
      copyLabel: "Copy for Docs",
      note: "Document typography in visible text: smart quotes, em dashes, numeric en dashes, and ellipses. Copies as text/plain so Docs can inherit the document style.",
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
      copyLabel: "Copy for Word",
      note: "Document typography in visible text. Copies as text/plain so Word can inherit the active document style instead of carrying browser styles.",
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
    plain: {
      label: "Plain text / forms",
      copyLabel: "Copy plain text",
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
      copyLabel: "Copy ASCII",
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

  function buildGmailHtml(text) {
    const lines = String(text || "").replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
    const nonEmptyIndexes = lines.map((line, index) => line.trim() ? index : -1).filter((index) => index >= 0);
    const lastTextIndex = nonEmptyIndexes.length ? nonEmptyIndexes[nonEmptyIndexes.length - 1] : -1;
    const divs = lines.map((line, index) => {
      const prefix = '<div class="gmail_default" style="font-family: verdana, sans-serif;">';
      if (!line) return `${prefix}<br></div>`;
      const suffix = index === lastTextIndex ? "<br></div>" : "</div>";
      return `${prefix}${htmlEscape(line)}${suffix}`;
    });
    return `<div>${divs.join("")}<br clear="all"></div>`;
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
    const inputText = document.getElementById("inputText");
    const outputText = document.getElementById("outputText");
    const clearButton = document.getElementById("clearButton");
    const destinationCopyButton = document.getElementById("destinationCopyButton");
    const copyVisibleButton = document.getElementById("copyVisibleButton");
    const destinationSelect = document.getElementById("destinationSelect");
    const destinationNote = document.getElementById("destinationNote");
    const presetSelect = document.getElementById("presetSelect");
    const status = document.getElementById("status");
    const statsList = document.getElementById("statsList");
    const changesList = document.getElementById("changesList");
    const warningsList = document.getElementById("warningsList");
    const nonAsciiList = document.getElementById("nonAsciiList");
    const optionInputs = Array.from(document.querySelectorAll("[data-option]"));

    if (!inputText || !outputText || !destinationSelect || !presetSelect) return;

    let lastResult = null;

    function setStatus(message) {
      if (status) status.textContent = message || "";
    }

    function applyOptionsToUi(options) {
      optionInputs.forEach((input) => {
        input.checked = Boolean(options[input.dataset.option]);
      });
    }

    function refreshProfileUi() {
      const profile = DESTINATIONS[destinationSelect.value] || DESTINATIONS.gmail;
      if (destinationNote) destinationNote.textContent = profile.note;
      if (destinationCopyButton) destinationCopyButton.textContent = profile.copyLabel;
      outputText.classList.remove("gmail-compose", "document-output", "plain-output", "strict-output");
      outputText.classList.add(profile.outputClass);
    }

    function getOptions() {
      return currentOptionsFromUi(destinationSelect.value, presetSelect, optionInputs);
    }

    function renderStats(result) {
      if (!statsList) return;
      const entries = [
        ["Characters in", inputText.value.length],
        ["Characters out", result.cleanText.length],
        ["Source changes", result.stats.sourceChanges],
        ["Destination changes", result.stats.destinationChanges],
        ["Hidden removed", result.stats.hiddenRemoved],
        ["Spaces normalized", result.stats.spacesNormalized],
        ["Quotes changed", result.stats.quotesChanged],
        ["Dashes changed", result.stats.dashesChanged],
        ["Ellipses changed", result.stats.ellipsesChanged],
        ["Bullets changed", result.stats.bulletsChanged],
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
        statsList.appendChild(li);
      });
    }

    function renderChanges(result) {
      if (!changesList) return;
      changesList.innerHTML = "";
      if (!result.changes.length) {
        const li = document.createElement("li");
        li.textContent = "No changes made.";
        changesList.appendChild(li);
        return;
      }
      result.changes.slice(0, 80).forEach((change) => {
        const li = document.createElement("li");
        const source = getCodeLabelForChangeValue(change.source);
        const target = getCodeLabelForChangeValue(change.target);
        li.textContent = `${change.phase}: ${source} -> ${target} ×${change.count}${change.note ? ` (${change.note})` : ""}`;
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

    function update() {
      refreshProfileUi();
      lastResult = sanitize(inputText.value, getOptions());
      outputText.value = lastResult.cleanText;
      renderStats(lastResult);
      renderChanges(lastResult);
      renderWarnings(lastResult);
      setStatus("");
    }

    function applyPresetAndProfile() {
      const preset = PRESETS[presetSelect.value] || PRESETS.standard;
      const profile = DESTINATIONS[destinationSelect.value] || DESTINATIONS.gmail;
      applyOptionsToUi(Object.assign({}, preset, profile.overrides));
      update();
    }

    function insertPlainTextAtCursor(target, text) {
      const start = target.selectionStart || 0;
      const end = target.selectionEnd || 0;
      const before = target.value.slice(0, start);
      const after = target.value.slice(end);
      target.value = before + text + after;
      const cursor = start + text.length;
      target.selectionStart = cursor;
      target.selectionEnd = cursor;
      target.dispatchEvent(new Event("input", { bubbles: true }));
    }

    inputText.addEventListener("paste", (event) => {
      const clipboard = event.clipboardData || global.clipboardData;
      if (!clipboard) return;
      const plain = clipboard.getData("text/plain");
      if (plain) {
        event.preventDefault();
        insertPlainTextAtCursor(inputText, plain);
      }
    });

    inputText.addEventListener("input", update);
    optionInputs.forEach((input) => input.addEventListener("change", update));
    presetSelect.addEventListener("change", applyPresetAndProfile);
    destinationSelect.addEventListener("change", applyPresetAndProfile);

    if (clearButton) {
      clearButton.addEventListener("click", () => {
        inputText.value = "";
        update();
        inputText.focus();
      });
    }

    if (copyVisibleButton) {
      copyVisibleButton.addEventListener("click", async () => {
        const result = sanitize(inputText.value, getOptions());
        outputText.value = result.cleanText;
        try {
          await navigator.clipboard.writeText(result.cleanText);
          setStatus("Copied visible text.");
        } catch (error) {
          outputText.focus();
          outputText.select();
          document.execCommand("copy");
          setStatus("Copied visible text.");
        }
      });
    }

    if (destinationCopyButton) {
      destinationCopyButton.addEventListener("click", async () => {
        const destination = destinationSelect.value;
        const result = sanitize(inputText.value, getOptions());
        outputText.value = result.cleanText;

        if (destination === "gmail") {
          const html = buildGmailHtml(result.cleanText);
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
              await navigator.clipboard.writeText(result.cleanText);
              setStatus("HTML clipboard unavailable; copied visible text instead.");
            } catch (fallbackError) {
              outputText.focus();
              outputText.select();
              document.execCommand("copy");
              setStatus("HTML clipboard unavailable; copied visible text instead.");
            }
          }
        } else {
          try {
            await navigator.clipboard.writeText(result.cleanText);
            setStatus(`Copied for ${DESTINATIONS[destination].label}.`);
          } catch (error) {
            outputText.focus();
            outputText.select();
            document.execCommand("copy");
            setStatus(`Copied for ${DESTINATIONS[destination].label}.`);
          }
        }
      });
    }

    applyPresetAndProfile();
  }

  const API = {
    sanitize,
    buildGmailHtml,
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
