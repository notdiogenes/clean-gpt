(function (global) {
  "use strict";

  const DEFAULT_OPTIONS = Object.freeze({
    removeHidden: true,
    normalizeLineEndings: true,
    normalizeSpaces: true,
    trimTrailingSpaces: true,
    limitBlankLines: true,
    normalizeQuotes: true,
    normalizeDashes: true,
    normalizeEllipsis: true,
    convertBullets: true,
    collapseRepeatedSpaces: false,
    convertTabs: false,
    removeEmoji: false,
    strictAscii: false
  });

  const PRESETS = Object.freeze({
    gmailSafe: {
      removeHidden: true,
      normalizeLineEndings: true,
      normalizeSpaces: true,
      trimTrailingSpaces: true,
      limitBlankLines: true,
      normalizeQuotes: true,
      normalizeDashes: true,
      normalizeEllipsis: true,
      convertBullets: true,
      collapseRepeatedSpaces: false,
      convertTabs: false,
      removeEmoji: false,
      strictAscii: false
    },
    strictPlainText: {
      removeHidden: true,
      normalizeLineEndings: true,
      normalizeSpaces: true,
      trimTrailingSpaces: true,
      limitBlankLines: true,
      normalizeQuotes: true,
      normalizeDashes: true,
      normalizeEllipsis: true,
      convertBullets: true,
      collapseRepeatedSpaces: true,
      convertTabs: true,
      removeEmoji: true,
      strictAscii: true
    },
    lightCleanup: {
      removeHidden: true,
      normalizeLineEndings: true,
      normalizeSpaces: true,
      trimTrailingSpaces: true,
      limitBlankLines: false,
      normalizeQuotes: false,
      normalizeDashes: false,
      normalizeEllipsis: false,
      convertBullets: false,
      collapseRepeatedSpaces: false,
      convertTabs: false,
      removeEmoji: false,
      strictAscii: false
    }
  });

  const DESTINATIONS = Object.freeze({
    gmail: {
      label: "Gmail",
      copyLabel: "Copy for Gmail",
      typography: "keyboard",
      copyMode: "gmailHtml",
      note: "Keeps keyboard quotes/apostrophes and copies Gmail-shaped Verdana HTML."
    },
    googleDocs: {
      label: "Google Docs",
      copyLabel: "Copy for Google Docs",
      typography: "smartDocument",
      copyMode: "plain",
      note: "Converts cleaned keyboard punctuation into smart document punctuation, then copies plain text so Docs can inherit the current document style."
    },
    word: {
      label: "Microsoft Word",
      copyLabel: "Copy for Word",
      typography: "smartDocument",
      copyMode: "plain",
      note: "Converts cleaned keyboard punctuation into smart document punctuation, then copies plain text so Word can inherit the current document style."
    },
    plain: {
      label: "Plain text / forms",
      copyLabel: "Copy plain text",
      typography: "keyboard",
      copyMode: "plain",
      note: "Keeps keyboard-safe punctuation and copies only text/plain."
    }
  });

  const RULES = Object.freeze({
    hiddenChars: /[\u00AD\u034F\u061C\u115F\u1160\u17B4\u17B5\u180B-\u180E\u200B-\u200F\u202A-\u202E\u2060-\u206F\uFE00-\uFE0F\uFEFF\uFFF9-\uFFFB]|[\u{E0000}-\u{E007F}]/gu,
    unusualSpaces: /[\u00A0\u1680\u2000-\u200A\u202F\u205F\u3000]/g,
    // Quote targets intentionally match plain keyboard characters:
    // double quote U+0022 and apostrophe U+0027.
    quoteLikeSingle: /[\u2018\u2019\u201A\u201B\u2032\u2035\u02BC\u02BB\u02BD\u055A\u275B\u275C\uFF07]/g,
    quoteLikeDouble: /[\u201C\u201D\u201E\u201F\u2033\u2036\u275D\u275E\u301D\u301E\u301F\u00AB\u00BB\uFF02]/g,
    emDashLikeWithSurroundingSpaces: /[ \t]*[\u2014\u2015][ \t]*/g,
    emDashLike: /[\u2014\u2015]/g,
    enDashLike: /[\u2010\u2011\u2012\u2013\u2212]/g,
    ellipsis: /\u2026/g,
    bulletsAtLineStart: /^(\s*)([\u2022\u2023\u25E6\u2043\u2219])\s+/gm,
    emoji: /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}]/gu,
    combiningMarks: /[\u0300-\u036f]/g,
    nonAscii: /[^\x00-\x7F]/g
  });

  const CODE_POINT_NAMES = Object.freeze({
    "U+0009": "CHARACTER TABULATION",
    "U+000A": "LINE FEED",
    "U+000D": "CARRIAGE RETURN",
    "U+0020": "SPACE",
    "U+0022": "QUOTATION MARK",
    "U+0027": "APOSTROPHE",
    "U+002D": "HYPHEN-MINUS",
    "U+002E": "FULL STOP",
    "U+00A0": "NO-BREAK SPACE",
    "U+00AB": "LEFT-POINTING DOUBLE ANGLE QUOTATION MARK",
    "U+00AD": "SOFT HYPHEN",
    "U+00BB": "RIGHT-POINTING DOUBLE ANGLE QUOTATION MARK",
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
    "U+2026": "HORIZONTAL ELLIPSIS",
    "U+202A": "LEFT-TO-RIGHT EMBEDDING",
    "U+202B": "RIGHT-TO-LEFT EMBEDDING",
    "U+202C": "POP DIRECTIONAL FORMATTING",
    "U+202D": "LEFT-TO-RIGHT OVERRIDE",
    "U+202E": "RIGHT-TO-LEFT OVERRIDE",
    "U+202F": "NARROW NO-BREAK SPACE",
    "U+2032": "PRIME",
    "U+2033": "DOUBLE PRIME",
    "U+2035": "REVERSED PRIME",
    "U+2036": "REVERSED DOUBLE PRIME",
    "U+2043": "HYPHEN BULLET",
    "U+205F": "MEDIUM MATHEMATICAL SPACE",
    "U+2060": "WORD JOINER",
    "U+2061": "FUNCTION APPLICATION",
    "U+2062": "INVISIBLE TIMES",
    "U+2063": "INVISIBLE SEPARATOR",
    "U+2064": "INVISIBLE PLUS",
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
    "U+FE00": "VARIATION SELECTOR-1",
    "U+FE0F": "VARIATION SELECTOR-16",
    "U+FEFF": "ZERO WIDTH NO-BREAK SPACE",
    "U+FF02": "FULLWIDTH QUOTATION MARK",
    "U+FF07": "FULLWIDTH APOSTROPHE"
  });

  function makeStats() {
    return {
      lineEndingReplacements: 0,
      hiddenCharactersRemoved: 0,
      unusualSpacesNormalized: 0,
      tabsConverted: 0,
      quoteReplacements: 0,
      dashReplacements: 0,
      ellipsisReplacements: 0,
      bulletReplacements: 0,
      trailingSpacesRemoved: 0,
      blankLineRunsReduced: 0,
      repeatedSpacesCollapsed: 0,
      emojiRemoved: 0,
      strictAsciiCharactersChanged: 0
    };
  }

  function countMatches(text, regex) {
    const flags = regex.flags.includes("g") ? regex.flags : regex.flags + "g";
    const clone = new RegExp(regex.source, flags);
    const matches = text.match(clone);
    return matches ? matches.length : 0;
  }

  function replaceWithCount(text, regex, replacement, statName, stats, changeLabel, changes) {
    const count = countMatches(text, regex);
    if (count === 0) return text;
    stats[statName] += count;
    changes.push({ type: changeLabel, count });
    return text.replace(regex, replacement);
  }

  function countTrailingSpaces(text) {
    const matches = text.match(/[ \t]+$/gm);
    if (!matches) return 0;
    return matches.reduce((total, match) => total + match.length, 0);
  }

  function countBlankLineRuns(text) {
    const matches = text.match(/\n{3,}/g);
    return matches ? matches.length : 0;
  }

  function countRepeatedSpaceRuns(text) {
    const matches = text.match(/ {2,}/g);
    return matches ? matches.length : 0;
  }

  function cloneGlobalRegex(regex) {
    const flags = regex.flags.includes("g") ? regex.flags : regex.flags + "g";
    return new RegExp(regex.source, flags);
  }

  function getCodePointLabel(char) {
    const codePoint = char.codePointAt(0).toString(16).toUpperCase().padStart(4, "0");
    return `U+${codePoint}`;
  }

  function getCodePointName(char) {
    const code = getCodePointLabel(char);
    if (CODE_POINT_NAMES[code]) return CODE_POINT_NAMES[code];

    if (/^[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}]$/u.test(char)) {
      return "emoji or pictographic symbol";
    }

    if (/^[\u0300-\u036f]$/u.test(char)) {
      return "combining mark";
    }

    return "non-ASCII character";
  }

  function codePointSequenceLabel(text) {
    if (text === "") return "removed";
    return Array.from(text).map((char) => `${getCodePointLabel(char)} ${getCodePointName(char)}`).join(" + ");
  }

  function addChangeDetail(detailMap, category, originalText, replacementText, count) {
    const key = `${category}\u0000${originalText}\u0000${replacementText}`;
    const existing = detailMap.get(key);
    if (existing) {
      existing.count += count || 1;
      return;
    }

    detailMap.set(key, {
      category,
      originalText,
      originalLabel: codePointSequenceLabel(originalText),
      replacementText,
      replacementLabel: codePointSequenceLabel(replacementText),
      count: count || 1
    });
  }

  function addRegexCharacterDetails(text, regex, replacementText, category, detailMap) {
    const clone = cloneGlobalRegex(regex);
    for (const match of text.matchAll(clone)) {
      for (const char of match[0]) {
        addChangeDetail(detailMap, category, char, replacementText, 1);
      }
    }
  }

  function addLineEndingDetails(text, detailMap) {
    const crlfCount = countMatches(text, /\r\n/g);
    const crOnlyCount = countMatches(text.replace(/\r\n/g, ""), /\r/g);
    if (crlfCount > 0) {
      addChangeDetail(detailMap, "Line endings normalized", "\r\n", "\n", crlfCount);
    }
    if (crOnlyCount > 0) {
      addChangeDetail(detailMap, "Line endings normalized", "\r", "\n", crOnlyCount);
    }
  }

  function addBulletDetails(text, detailMap) {
    const clone = cloneGlobalRegex(RULES.bulletsAtLineStart);
    for (const match of text.matchAll(clone)) {
      addChangeDetail(detailMap, "Line-start bullets converted", match[2], "-", 1);
    }
  }

  function addTrimmedBlankLineDetail(detailMap) {
    addChangeDetail(detailMap, "Leading or trailing blank lines trimmed", "leading/trailing blank line", "removed", 1);
  }

  function getRemainingWarnings(text) {
    const suspicious = [];
    const nonAscii = new Map();

    for (const char of text) {
      const code = char.codePointAt(0);
      if (code > 127) {
        const key = `${getCodePointLabel(char)} ${char}`;
        nonAscii.set(key, (nonAscii.get(key) || 0) + 1);
      }
    }

    const hiddenCount = countMatches(text, RULES.hiddenChars);
    if (hiddenCount > 0) {
      suspicious.push(`${hiddenCount} hidden or formatting character(s) remain`);
    }

    if (nonAscii.size > 0) {
      suspicious.push(`${nonAscii.size} type(s) of non-ASCII character remain`);
    }

    return {
      warnings: suspicious,
      remainingNonAscii: Array.from(nonAscii.entries()).map(([label, count]) => ({ label, count }))
    };
  }

  function sanitize(input, userOptions) {
    const options = Object.assign({}, DEFAULT_OPTIONS, userOptions || {});
    let text = String(input == null ? "" : input);
    const changes = [];
    const detailMap = new Map();
    const stats = makeStats();

    if (options.normalizeLineEndings) {
      const crlfCount = countMatches(text, /\r\n/g);
      const crCount = countMatches(text.replace(/\r\n/g, ""), /\r/g);
      const total = crlfCount + crCount;
      if (total > 0) {
        stats.lineEndingReplacements += total;
        changes.push({ type: "Line endings normalized", count: total });
        addLineEndingDetails(text, detailMap);
        text = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
      }
    }

    if (options.removeHidden) {
      if (countMatches(text, RULES.hiddenChars) > 0) {
        addRegexCharacterDetails(text, RULES.hiddenChars, "", "Hidden or formatting characters removed", detailMap);
      }
      text = replaceWithCount(
        text,
        RULES.hiddenChars,
        "",
        "hiddenCharactersRemoved",
        stats,
        "Hidden or formatting characters removed",
        changes
      );
    }

    if (options.normalizeSpaces) {
      if (countMatches(text, RULES.unusualSpaces) > 0) {
        addRegexCharacterDetails(text, RULES.unusualSpaces, " ", "Unusual spaces normalized", detailMap);
      }
      text = replaceWithCount(
        text,
        RULES.unusualSpaces,
        " ",
        "unusualSpacesNormalized",
        stats,
        "Unusual spaces normalized",
        changes
      );
    }

    if (options.convertTabs) {
      text = replaceWithCount(
        text,
        /\t/g,
        "  ",
        "tabsConverted",
        stats,
        "Tabs converted to two spaces",
        changes
      );
    }

    if (options.normalizeQuotes) {
      const singleQuoteCount = countMatches(text, RULES.quoteLikeSingle);
      const doubleQuoteCount = countMatches(text, RULES.quoteLikeDouble);
      if (singleQuoteCount + doubleQuoteCount > 0) {
        stats.quoteReplacements += singleQuoteCount + doubleQuoteCount;
        changes.push({ type: "Quote-like characters normalized to keyboard quotes", count: singleQuoteCount + doubleQuoteCount });
        addRegexCharacterDetails(text, RULES.quoteLikeSingle, "'", "Quote-like characters normalized", detailMap);
        addRegexCharacterDetails(text, RULES.quoteLikeDouble, '"', "Quote-like characters normalized", detailMap);
        text = text.replace(RULES.quoteLikeSingle, "'").replace(RULES.quoteLikeDouble, '"');
      }
    }

    if (options.normalizeDashes) {
      const emDashCount = countMatches(text, RULES.emDashLikeWithSurroundingSpaces);
      const enDashCount = countMatches(text, RULES.enDashLike);
      if (emDashCount + enDashCount > 0) {
        stats.dashReplacements += emDashCount + enDashCount;
        changes.push({ type: "Dash characters normalized", count: emDashCount + enDashCount });
        addRegexCharacterDetails(text, RULES.emDashLike, " -- ", "Dash characters normalized", detailMap);
        addRegexCharacterDetails(text, RULES.enDashLike, "-", "Dash characters normalized", detailMap);
        text = text
          .replace(RULES.emDashLikeWithSurroundingSpaces, " -- ")
          .replace(RULES.enDashLike, "-");
      }
    }

    if (options.normalizeEllipsis) {
      if (countMatches(text, RULES.ellipsis) > 0) {
        addRegexCharacterDetails(text, RULES.ellipsis, "...", "Ellipsis characters normalized", detailMap);
      }
      text = replaceWithCount(
        text,
        RULES.ellipsis,
        "...",
        "ellipsisReplacements",
        stats,
        "Ellipsis characters normalized",
        changes
      );
    }

    if (options.convertBullets) {
      const count = countMatches(text, RULES.bulletsAtLineStart);
      if (count > 0) {
        stats.bulletReplacements += count;
        changes.push({ type: "Line-start bullets converted to hyphens", count });
        addBulletDetails(text, detailMap);
        text = text.replace(RULES.bulletsAtLineStart, "$1- ");
      }
    }

    if (options.removeEmoji) {
      if (countMatches(text, RULES.emoji) > 0) {
        addRegexCharacterDetails(text, RULES.emoji, "", "Emoji and pictographic symbols removed", detailMap);
      }
      text = replaceWithCount(
        text,
        RULES.emoji,
        "",
        "emojiRemoved",
        stats,
        "Emoji and pictographic symbols removed",
        changes
      );
    }

    if (options.strictAscii) {
      const before = text;
      text = text.normalize("NFKD").replace(RULES.combiningMarks, "");
      const nonAsciiCount = countMatches(text, RULES.nonAscii);
      if (nonAsciiCount > 0 || before !== text) {
        const changedByNormalization = before === text ? 0 : 1;
        stats.strictAsciiCharactersChanged += nonAsciiCount + changedByNormalization;
        changes.push({ type: "Strict ASCII cleanup applied", count: nonAsciiCount + changedByNormalization });
        if (nonAsciiCount > 0) {
          addRegexCharacterDetails(text, RULES.nonAscii, "", "Strict ASCII characters removed", detailMap);
        }
        text = text.replace(RULES.nonAscii, "");
      }
    }

    if (options.trimTrailingSpaces) {
      const count = countTrailingSpaces(text);
      if (count > 0) {
        stats.trailingSpacesRemoved += count;
        changes.push({ type: "Trailing spaces removed", count });
        text = text.replace(/[ \t]+$/gm, "");
      }
    }

    if (options.collapseRepeatedSpaces) {
      const count = countRepeatedSpaceRuns(text);
      if (count > 0) {
        stats.repeatedSpacesCollapsed += count;
        changes.push({ type: "Repeated spaces collapsed", count });
        text = text.replace(/ {2,}/g, " ");
      }
    }

    if (options.limitBlankLines) {
      const count = countBlankLineRuns(text);
      if (count > 0) {
        stats.blankLineRunsReduced += count;
        changes.push({ type: "Extra blank lines reduced", count });
        text = text.replace(/\n{3,}/g, "\n\n");
      }
    }

    if (options.limitBlankLines || options.trimTrailingSpaces) {
      const trimmed = text.replace(/^\n+|\n+$/g, "");
      if (trimmed !== text) {
        text = trimmed;
        changes.push({ type: "Leading or trailing blank lines trimmed", count: 1 });
      }
    }

    const diagnostics = getRemainingWarnings(text);

    return {
      cleanText: text,
      changes,
      changeDetails: Array.from(detailMap.values()),
      stats,
      warnings: diagnostics.warnings,
      remainingNonAscii: diagnostics.remainingNonAscii,
      options
    };
  }

  function getPresetOptions(name) {
    return Object.assign({}, PRESETS[name] || PRESETS.gmailSafe);
  }

  function normalizeToLf(text) {
    return String(text == null ? "" : text).replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  }

  function toWindowsClipboardLineEndings(text) {
    return normalizeToLf(text).replace(/\n/g, "\r\n");
  }

  function escapeHtml(text) {
    return String(text == null ? "" : text)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function textToGmailHtml(text) {
    const normalized = normalizeToLf(text);
    const lines = normalized.length ? normalized.split("\n") : [""];
    const gmailDefaultStyle = "font-family: verdana, sans-serif;";
    const lastNonEmptyIndex = lines.reduce((last, line, index) => line === "" ? last : index, -1);

    const body = lines.map((line, index) => {
      if (line === "") {
        return `<div class="gmail_default" style="${gmailDefaultStyle}"><br></div>`;
      }

      const suffix = index === lastNonEmptyIndex ? "<br>" : "";
      return `<div class="gmail_default" style="${gmailDefaultStyle}">${escapeHtml(line)}${suffix}</div>`;
    }).join("");

    return `<div>${body}<br clear="all"></div>`;
  }

  function applyCurlyQuotes(text, detailMap) {
    let output = "";

    function previousVisibleCharacter() {
      for (let index = output.length - 1; index >= 0; index -= 1) {
        const char = output[index];
        if (!/\s/.test(char)) return char;
      }
      return "";
    }

    for (let index = 0; index < text.length; index += 1) {
      const char = text[index];
      const previous = index > 0 ? text[index - 1] : "";
      const next = index + 1 < text.length ? text[index + 1] : "";

      if (char === '"') {
        const opening = !previous || /[\s([{<\u2014\u2013-]/.test(previous);
        const replacement = opening ? "“" : "”";
        addChangeDetail(detailMap, "Destination typography", char, replacement, 1);
        output += replacement;
        continue;
      }

      if (char === "'") {
        let replacement;
        if (/^[A-Za-z0-9]$/.test(previous) && /^[A-Za-z0-9]$/.test(next)) {
          replacement = "’";
        } else if (!previous && /^[0-9]$/.test(next)) {
          replacement = "’";
        } else {
          replacement = (!previous || /[\s([{<\u2014\u2013-]/.test(previous)) ? "‘" : "’";
        }
        addChangeDetail(detailMap, "Destination typography", char, replacement, 1);
        output += replacement;
        continue;
      }

      output += char;
    }

    return output;
  }

  function applyDestinationTypography(text, destinationName) {
    const destination = DESTINATIONS[destinationName] || DESTINATIONS.gmail;
    let output = String(text == null ? "" : text);
    const detailMap = new Map();

    if (destination.typography !== "smartDocument") {
      return {
        text: output,
        changeDetails: [],
        stats: { destinationTypographyChanges: 0 }
      };
    }

    output = output.replace(/ {1,}-- {1,}/g, (match) => {
      addChangeDetail(detailMap, "Destination typography", match, "—", 1);
      return "—";
    });

    output = output.replace(/\.\.\./g, (match) => {
      addChangeDetail(detailMap, "Destination typography", match, "…", 1);
      return "…";
    });

    output = applyCurlyQuotes(output, detailMap);

    const changeDetails = Array.from(detailMap.values());
    const total = changeDetails.reduce((sum, detail) => sum + detail.count, 0);

    return {
      text: output,
      changeDetails,
      stats: { destinationTypographyChanges: total }
    };
  }

  function buildDestinationOutput(cleanText, destinationName) {
    const destination = DESTINATIONS[destinationName] || DESTINATIONS.gmail;
    const typography = applyDestinationTypography(cleanText, destinationName);

    return {
      destination,
      text: typography.text,
      changeDetails: typography.changeDetails,
      stats: typography.stats
    };
  }

  function copyPlainText(text) {
    return navigator.clipboard.writeText(text);
  }

  function fallbackCopyPlainText(text, statusElement, successMessage) {
    const hidden = document.createElement("textarea");
    hidden.value = text;
    hidden.setAttribute("readonly", "");
    hidden.setAttribute("aria-hidden", "true");
    hidden.style.position = "fixed";
    hidden.style.left = "-9999px";
    hidden.style.top = "0";
    document.body.appendChild(hidden);
    hidden.focus();
    hidden.select();

    let copied = false;
    function onCopy(event) {
      if (!event.clipboardData) return;
      event.clipboardData.setData("text/plain", text);
      event.preventDefault();
      copied = true;
    }

    document.addEventListener("copy", onCopy);
    try {
      document.execCommand("copy");
    } finally {
      document.removeEventListener("copy", onCopy);
      document.body.removeChild(hidden);
    }

    if (statusElement) {
      statusElement.textContent = copied ? successMessage : "Select the output and copy manually.";
    }
    return copied;
  }

  function fallbackCopyGmailHtml(htmlText) {
    if (typeof document === "undefined") {
      throw new Error("Fallback Gmail HTML copy is not available.");
    }

    const trigger = document.createElement("button");
    trigger.type = "button";
    trigger.setAttribute("aria-hidden", "true");
    trigger.style.position = "fixed";
    trigger.style.left = "-9999px";
    trigger.style.top = "0";
    trigger.style.width = "1px";
    trigger.style.height = "1px";
    trigger.style.opacity = "0";
    document.body.appendChild(trigger);
    trigger.focus();

    let copied = false;

    function onCopy(event) {
      if (!event.clipboardData) return;
      event.clipboardData.clearData();
      event.clipboardData.setData("text/html", htmlText);
      event.preventDefault();
      copied = true;
    }

    document.addEventListener("copy", onCopy);
    try {
      copied = document.execCommand("copy") || copied;
    } finally {
      document.removeEventListener("copy", onCopy);
      document.body.removeChild(trigger);
    }

    return copied;
  }

  async function copyGmailHtmlWithClipboardApi(htmlText) {
    if (!navigator.clipboard || !navigator.clipboard.write || typeof ClipboardItem === "undefined") {
      throw new Error("HTML clipboard write is not available in this browser context.");
    }

    const item = new ClipboardItem({
      "text/html": new Blob([htmlText], { type: "text/html" })
    });

    return navigator.clipboard.write([item]);
  }

  function bindDom() {
    const input = document.getElementById("inputText");
    const output = document.getElementById("outputText");
    const copyButton = document.getElementById("copyButton");
    const destinationCopyButton = document.getElementById("destinationCopyButton");
    const clearButton = document.getElementById("clearButton");
    const presetSelect = document.getElementById("presetSelect");
    const destinationSelect = document.getElementById("destinationSelect");
    const destinationNote = document.getElementById("destinationNote");
    const status = document.getElementById("status");
    const statsList = document.getElementById("statsList");
    const warningsList = document.getElementById("warningsList");
    const changesList = document.getElementById("changesList");
    const nonAsciiList = document.getElementById("nonAsciiList");
    const optionInputs = Array.from(document.querySelectorAll("[data-option]"));

    let latestSanitized = null;
    let latestDestinationOutput = null;

    if (!input || !output) return;

    function currentDestinationName() {
      return destinationSelect ? destinationSelect.value : "gmail";
    }

    function optionsFromUi() {
      const options = {};
      optionInputs.forEach((el) => {
        options[el.dataset.option] = el.checked;
      });
      return options;
    }

    function applyPreset(name) {
      const options = getPresetOptions(name);
      optionInputs.forEach((el) => {
        el.checked = Boolean(options[el.dataset.option]);
      });
      update();
    }

    function renderStats(result, destinationOutput) {
      if (!statsList) return;
      statsList.innerHTML = "";
      const entries = [
        ["Characters in", input.value.length],
        ["Characters out", destinationOutput.text.length],
        ["Hidden removed", result.stats.hiddenCharactersRemoved],
        ["Spaces normalized", result.stats.unusualSpacesNormalized],
        ["Quotes normalized", result.stats.quoteReplacements],
        ["Dashes normalized", result.stats.dashReplacements],
        ["Ellipses normalized", result.stats.ellipsisReplacements],
        ["Bullets converted", result.stats.bulletReplacements],
        ["Trailing spaces removed", result.stats.trailingSpacesRemoved],
        ["Blank-line runs reduced", result.stats.blankLineRunsReduced],
        ["Destination typography changes", destinationOutput.stats.destinationTypographyChanges]
      ];

      entries.forEach(([label, value]) => {
        const item = document.createElement("li");
        item.innerHTML = `<span>${label}</span><strong>${value}</strong>`;
        statsList.appendChild(item);
      });
    }

    function renderChangeDetails(result, destinationOutput) {
      if (!changesList) return;
      changesList.innerHTML = "";

      const details = [];
      if (result.changeDetails) details.push(...result.changeDetails);
      if (destinationOutput.changeDetails) details.push(...destinationOutput.changeDetails);

      if (details.length === 0) {
        const item = document.createElement("li");
        item.textContent = "No replacements made.";
        changesList.appendChild(item);
        return;
      }

      details.forEach((detail) => {
        const item = document.createElement("li");
        const category = document.createElement("span");
        const mapping = document.createElement("strong");
        const count = document.createElement("em");

        category.textContent = detail.category;
        mapping.textContent = `${detail.originalLabel} -> ${detail.replacementLabel}`;
        count.textContent = `x ${detail.count}`;

        item.appendChild(category);
        item.appendChild(mapping);
        item.appendChild(count);
        changesList.appendChild(item);
      });
    }

    function renderWarnings(result) {
      if (!warningsList || !nonAsciiList) return;
      warningsList.innerHTML = "";
      nonAsciiList.innerHTML = "";

      if (result.warnings.length === 0) {
        const item = document.createElement("li");
        item.textContent = "No remaining suspicious characters found.";
        warningsList.appendChild(item);
      } else {
        result.warnings.forEach((warning) => {
          const item = document.createElement("li");
          item.textContent = warning;
          warningsList.appendChild(item);
        });
      }

      if (result.remainingNonAscii.length === 0) {
        const item = document.createElement("li");
        item.textContent = "None";
        nonAsciiList.appendChild(item);
      } else {
        result.remainingNonAscii.slice(0, 20).forEach((entry) => {
          const item = document.createElement("li");
          item.textContent = `${entry.label} x ${entry.count}`;
          nonAsciiList.appendChild(item);
        });
      }
    }

    function renderDestinationUi(destinationOutput) {
      const destination = destinationOutput.destination;
      output.value = destinationOutput.text;
      output.dataset.destination = destination.label;

      if (destinationCopyButton) {
        destinationCopyButton.textContent = destination.copyLabel;
      }

      if (destinationNote) {
        destinationNote.textContent = destination.note;
      }
    }

    function update() {
      latestSanitized = sanitize(input.value, optionsFromUi());
      latestDestinationOutput = buildDestinationOutput(latestSanitized.cleanText, currentDestinationName());
      renderDestinationUi(latestDestinationOutput);
      renderStats(latestSanitized, latestDestinationOutput);
      renderChangeDetails(latestSanitized, latestDestinationOutput);
      renderWarnings(latestSanitized);
      if (status) status.textContent = "";
    }

    function insertPlainTextAtCursor(target, text) {
      const start = target.selectionStart;
      const end = target.selectionEnd;
      const before = target.value.slice(0, start);
      const after = target.value.slice(end);
      target.value = before + text + after;
      const cursor = start + text.length;
      target.selectionStart = cursor;
      target.selectionEnd = cursor;
      target.dispatchEvent(new Event("input", { bubbles: true }));
    }

    input.addEventListener("paste", (event) => {
      const clipboard = event.clipboardData || global.clipboardData;
      if (!clipboard) return;
      const plain = clipboard.getData("text/plain");
      if (plain) {
        event.preventDefault();
        insertPlainTextAtCursor(input, plain);
      }
    });

    input.addEventListener("input", update);
    optionInputs.forEach((el) => el.addEventListener("change", update));

    if (presetSelect) {
      presetSelect.addEventListener("change", () => applyPreset(presetSelect.value));
    }

    if (destinationSelect) {
      destinationSelect.addEventListener("change", update);
    }

    async function copyTextWithFallback(text, successMessage) {
      try {
        await copyPlainText(text);
        if (status) status.textContent = successMessage;
      } catch (error) {
        fallbackCopyPlainText(text, status, successMessage);
      }
    }

    async function copyGmailHtml(text) {
      const htmlText = textToGmailHtml(text);

      try {
        await copyGmailHtmlWithClipboardApi(htmlText);
        if (status) status.textContent = "Copied Gmail-compatible Verdana HTML.";
      } catch (apiError) {
        try {
          const copied = fallbackCopyGmailHtml(htmlText);
          if (!copied) throw new Error("Fallback Gmail HTML copy failed.");
          if (status) status.textContent = "Copied Gmail-compatible Verdana HTML.";
        } catch (fallbackError) {
          if (status) status.textContent = "Gmail HTML copy was not available in this browser context.";
        }
      }
    }

    if (copyButton) {
      copyButton.addEventListener("click", async () => {
        update();
        await copyTextWithFallback(latestDestinationOutput.text, "Copied visible textarea text.");
      });
    }

    if (destinationCopyButton) {
      destinationCopyButton.addEventListener("click", async () => {
        update();
        const destination = latestDestinationOutput.destination;

        if (destination.copyMode === "gmailHtml") {
          await copyGmailHtml(latestDestinationOutput.text);
          return;
        }

        await copyTextWithFallback(latestDestinationOutput.text, `Copied ${destination.label} text.`);
      });
    }

    if (clearButton) {
      clearButton.addEventListener("click", () => {
        input.value = "";
        update();
        input.focus();
      });
    }

    applyPreset("gmailSafe");
  }

  const API = {
    sanitize,
    DEFAULT_OPTIONS,
    PRESETS,
    DESTINATIONS,
    getPresetOptions,
    normalizeToLf,
    toWindowsClipboardLineEndings,
    escapeHtml,
    textToGmailHtml,
    applyDestinationTypography,
    buildDestinationOutput
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
