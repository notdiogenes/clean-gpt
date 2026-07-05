(function (global) {
  "use strict";

  const regexCore = typeof require === "function" ? require("./regex") : global.TextSanitizerCore;
  const statsCore = typeof require === "function" ? require("./stats") : global.TextSanitizerCore;
  const { REGEX, MAPS, countMatches } = regexCore;
  const { makeStats, addChange, replaceMappedChars, replaceRegex } = statsCore;

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
        if (crlf) addChange(changes, "Source", "\r\n", "\n", crlf, "Line endings normalized", { category: "line-break", subcategory: "crlf", severity: "info" });
        if (cr) addChange(changes, "Source", "\r", "\n", cr, "Line endings normalized", { category: "line-break", subcategory: "cr", severity: "info" });
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
      text = replaceMappedChars(text, superSubMapForText(text), "Source", changes, stats, "superSubChanged", "Superscript/subscript flattened", { category: "compatibility", subcategory: "super-sub-flatten", severity: "warning", suggestion: "May change meaning. Review output." });
    }

    if (options.removeEmoji) {
      text = replaceRegex(text, REGEX.emoji, "", "Source", changes, stats, "emojiRemoved", "Emoji or pictographic symbol removed", null, { category: "emoji", subcategory: "emoji-remove", severity: "warning", suggestion: "May change meaning. Review output." });
    }

    if (options.trimTrailingSpaces) {
      text = replaceRegex(text, REGEX.trailingSpaces, "", "Source", changes, stats, "trailingSpacesRemoved", "Trailing spaces removed", null, { category: "spacing", subcategory: "trailing-space", severity: "info", suggestion: "Remove trailing spaces at line ends." });
    }

    if (options.collapseRepeatedSpaces) {
      text = replaceRegex(text, REGEX.repeatedSpaces, " ", "Source", changes, stats, "repeatedSpacesCollapsed", "Repeated spaces collapsed", null, { category: "spacing", subcategory: "repeated-space", severity: "info", suggestion: "Use a single regular space." });
    }

    if (options.limitBlankLines) {
      text = replaceRegex(text, REGEX.blankLineRuns, "\n\n", "Source", changes, stats, "blankLineRunsReduced", "Extra blank lines reduced", null, { category: "spacing", subcategory: "blank-line-run", severity: "info", suggestion: "Limit blank-line runs to one blank line." });
    }

    const trimmed = text.replace(/^\n+|\n+$/g, "");
    if (trimmed !== text && (options.limitBlankLines || options.trimTrailingSpaces)) {
      addChange(changes, "Source", "outer blank lines", "removed", 1, "Leading/trailing blank lines trimmed");
      stats.sourceChanges += 1;
      text = trimmed;
    }

    return { text, changes, stats };
  }


  const API = { normalizeFullwidthChar, fullwidthMapForText, fractionMapForText, superSubMapForText, sanitizeSource };
  if (typeof module !== "undefined" && module.exports) module.exports = API;
  else global.TextSanitizerCore = Object.assign(global.TextSanitizerCore || {}, API);
})(typeof window !== "undefined" ? window : globalThis);
