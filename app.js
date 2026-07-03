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

  const RULES = Object.freeze({
    hiddenChars: /[\u00AD\u034F\u061C\u115F\u1160\u17B4\u17B5\u180B-\u180E\u200B-\u200F\u202A-\u202E\u2060-\u206F\uFE00-\uFE0F\uFEFF\uFFF9-\uFFFB]|[\u{E0000}-\u{E007F}]/gu,
    unusualSpaces: /[\u00A0\u1680\u2000-\u200A\u202F\u205F\u3000]/g,
    curlySingleQuotes: /[\u2018\u2019\u201A\u201B\u2032\u2035\u02BC\uFF07]/g,
    curlyDoubleQuotes: /[\u201C\u201D\u201E\u201F\u2033\u2036\u00AB\u00BB\uFF02]/g,
    emDashLikeWithSurroundingSpaces: /[ \t]*[\u2014\u2015][ \t]*/g,
    enDashLike: /[\u2010\u2011\u2012\u2013\u2212]/g,
    ellipsis: /\u2026/g,
    bulletsAtLineStart: /^(\s*)[\u2022\u2023\u25E6\u2043\u2219]\s+/gm,
    emoji: /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}]/gu,
    combiningMarks: /[\u0300-\u036f]/g,
    nonAscii: /[^\x00-\x7F]/g
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

  function getCodePointLabel(char) {
    const codePoint = char.codePointAt(0).toString(16).toUpperCase().padStart(4, "0");
    return `U+${codePoint}`;
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
    const stats = makeStats();

    if (options.normalizeLineEndings) {
      const crlfCount = countMatches(text, /\r\n/g);
      const crCount = countMatches(text, /\r/g);
      const total = crlfCount + crCount;
      if (total > 0) {
        stats.lineEndingReplacements += total;
        changes.push({ type: "Line endings normalized", count: total });
        text = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
      }
    }

    if (options.removeHidden) {
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
      const singleQuoteCount = countMatches(text, RULES.curlySingleQuotes);
      const doubleQuoteCount = countMatches(text, RULES.curlyDoubleQuotes);
      if (singleQuoteCount + doubleQuoteCount > 0) {
        stats.quoteReplacements += singleQuoteCount + doubleQuoteCount;
        changes.push({ type: "Typographic quote marks normalized", count: singleQuoteCount + doubleQuoteCount });
        text = text.replace(RULES.curlySingleQuotes, "'").replace(RULES.curlyDoubleQuotes, '"');
      }
    }

    if (options.normalizeDashes) {
      const emDashCount = countMatches(text, RULES.emDashLikeWithSurroundingSpaces);
      const enDashCount = countMatches(text, RULES.enDashLike);
      if (emDashCount + enDashCount > 0) {
        stats.dashReplacements += emDashCount + enDashCount;
        changes.push({ type: "Dash characters normalized", count: emDashCount + enDashCount });
        text = text
          .replace(RULES.emDashLikeWithSurroundingSpaces, " -- ")
          .replace(RULES.enDashLike, "-");
      }
    }

    if (options.normalizeEllipsis) {
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
        text = text.replace(RULES.bulletsAtLineStart, "$1- ");
      }
    }

    if (options.removeEmoji) {
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
      stats,
      warnings: diagnostics.warnings,
      remainingNonAscii: diagnostics.remainingNonAscii,
      options
    };
  }

  function getPresetOptions(name) {
    return Object.assign({}, PRESETS[name] || PRESETS.gmailSafe);
  }

  function bindDom() {
    const input = document.getElementById("inputText");
    const output = document.getElementById("outputText");
    const copyButton = document.getElementById("copyButton");
    const clearButton = document.getElementById("clearButton");
    const presetSelect = document.getElementById("presetSelect");
    const status = document.getElementById("status");
    const statsList = document.getElementById("statsList");
    const warningsList = document.getElementById("warningsList");
    const nonAsciiList = document.getElementById("nonAsciiList");
    const optionInputs = Array.from(document.querySelectorAll("[data-option]"));

    if (!input || !output) return;

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

    function renderStats(result) {
      if (!statsList) return;
      statsList.innerHTML = "";
      const entries = [
        ["Characters in", input.value.length],
        ["Characters out", result.cleanText.length],
        ["Hidden removed", result.stats.hiddenCharactersRemoved],
        ["Spaces normalized", result.stats.unusualSpacesNormalized],
        ["Quotes normalized", result.stats.quoteReplacements],
        ["Dashes normalized", result.stats.dashReplacements],
        ["Ellipses normalized", result.stats.ellipsisReplacements],
        ["Bullets converted", result.stats.bulletReplacements],
        ["Trailing spaces removed", result.stats.trailingSpacesRemoved],
        ["Blank-line runs reduced", result.stats.blankLineRunsReduced]
      ];

      entries.forEach(([label, value]) => {
        const item = document.createElement("li");
        item.innerHTML = `<span>${label}</span><strong>${value}</strong>`;
        statsList.appendChild(item);
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

    function update() {
      const result = sanitize(input.value, optionsFromUi());
      output.value = result.cleanText;
      renderStats(result);
      renderWarnings(result);
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

    if (copyButton) {
      copyButton.addEventListener("click", async () => {
        const result = sanitize(input.value, optionsFromUi());
        output.value = result.cleanText;
        try {
          await navigator.clipboard.writeText(result.cleanText);
          if (status) status.textContent = "Copied clean plain text.";
        } catch (error) {
          output.focus();
          output.select();
          document.execCommand("copy");
          if (status) status.textContent = "Copied clean plain text.";
        }
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
    getPresetOptions
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
