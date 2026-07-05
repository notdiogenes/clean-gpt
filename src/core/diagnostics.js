(function (global) {
  "use strict";
  const regexCore = typeof require === "function" ? require("./regex") : global.TextSanitizerCore;
  const unicodeData = typeof require === "function" ? require("./unicode-data") : global.TextSanitizerUnicodeData;
  const { REGEX } = regexCore;
  const { CHAR_NAMES } = unicodeData;
  function codePointLabel(char) {
    const cp = char.codePointAt(0);
    return `U+${cp.toString(16).toUpperCase().padStart(4, "0")}`;
  }
  function characterName(char) {
    return CHAR_NAMES[char.codePointAt(0)] || "CHARACTER";
  }
  function labelChar(char) {
    if (char === "") return "removed";
    return Array.from(char).map((c) => `${codePointLabel(c)} ${characterName(c)}`).join(" + ");
  }
  function rangesForText(text, predicate) {
    const ranges = [];
    for (let i = 0; i < text.length;) {
      const char = Array.from(text.slice(i))[0];
      if (predicate(char)) ranges.push({ char, start: i, end: i + char.length });
      i += char.length;
    }
    return ranges;
  }
  function buildOutputToSourceMap(sourceText, outputText) {
    if (typeof sourceText !== "string") return new Map();
    const source = Array.from(sourceText || "");
    const output = Array.from(outputText || "");
    const sourceOffsets = []; let s = 0;
    source.forEach((char) => { sourceOffsets.push(s); s += char.length; });
    const outputOffsets = []; let o = 0;
    output.forEach((char) => { outputOffsets.push(o); o += char.length; });
    const dp = Array.from({ length: source.length + 1 }, () => Array(output.length + 1).fill(0));
    for (let i = source.length - 1; i >= 0; i -= 1) {
      for (let j = output.length - 1; j >= 0; j -= 1) dp[i][j] = source[i] === output[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
    const map = new Map();
    let i = 0; let j = 0;
    while (i < source.length && j < output.length) {
      if (source[i] === output[j]) {
        map.set(outputOffsets[j], { start: sourceOffsets[i], end: sourceOffsets[i] + source[i].length });
        i += 1; j += 1;
      } else if (dp[i + 1][j] >= dp[i][j + 1]) i += 1;
      else j += 1;
    }
    return map;
  }
  function makeReviewRecord(subcategory, severity, char, locations, sourceMap) {
    const cp = codePointLabel(char);
    const name = characterName(char);
    const sourceLocations = locations.map((loc) => sourceMap.get(loc.start)).filter(Boolean);
    const isHidden = subcategory === "remaining-hidden";
    return {
      category: "review",
      subcategory,
      severity,
      character: char,
      codePoint: cp,
      characterName: name,
      count: locations.length,
      outputLocations: locations.map(({ start, end }) => ({ start, end })),
      sourceLocations,
      message: isHidden ? `${locations.length} hidden or formatting ${locations.length === 1 ? "character remains" : "characters remain"}.` : `${locations.length} ${cp} ${name} ${locations.length === 1 ? "character remains" : "characters remain"}.`,
      suggestion: isHidden ? "Remove it unless it is intentionally needed for formatting or language direction." : "Confirm this character is appropriate for the destination, or choose Strict ASCII to replace/remove it."
    };
  }
  function getDiagnostics(text, sourceText) {
    const value = String(text == null ? "" : text);
    const sourceMap = buildOutputToSourceMap(typeof sourceText === "string" ? sourceText : value, value);
    const grouped = new Map();
    function add(subcategory, severity, char, start, end) {
      const key = `${subcategory}|${char}`;
      if (!grouped.has(key)) grouped.set(key, { subcategory, severity, char, locations: [] });
      grouped.get(key).locations.push({ start, end });
    }
    rangesForText(value, (char) => regexCore.regexMatchesText ? regexCore.regexMatchesText(REGEX.hidden, char) : new RegExp(REGEX.hidden.source, REGEX.hidden.flags.replace("g", "")).test(char)).forEach(({ char, start, end }) => add("remaining-hidden", "warning", char, start, end));
    rangesForText(value, (char) => char.codePointAt(0) > 127).forEach(({ char, start, end }) => add("remaining-non-ascii", "needs-review", char, start, end));
    const reviewRecords = Array.from(grouped.values()).map((entry) => makeReviewRecord(entry.subcategory, entry.severity, entry.char, entry.locations, sourceMap));
    return {
      warnings: reviewRecords,
      warningMessages: reviewRecords.map((record) => record.message),
      reviewRecords,
      remainingNonAscii: reviewRecords.filter((record) => record.subcategory === "remaining-non-ascii").map((record) => ({ label: `${labelChar(record.character)} ${record.character}`, count: record.count, record }))
    };
  }
  const API = { labelChar, getDiagnostics };
  if (typeof module !== "undefined" && module.exports) module.exports = API;
  else global.TextSanitizerCore = Object.assign(global.TextSanitizerCore || {}, API);
})(typeof window !== "undefined" ? window : globalThis);
