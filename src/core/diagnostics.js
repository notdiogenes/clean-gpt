(function (global) {
  "use strict";
  const regexCore = typeof require === "function" ? require("./regex") : global.TextSanitizerCore;
  const unicodeData = typeof require === "function" ? require("./unicode-data") : global.TextSanitizerUnicodeData;
  const { REGEX, countMatches } = regexCore;
  const { CHAR_NAMES } = unicodeData;
  function labelChar(char) {
    if (char === "") return "removed";
    return Array.from(char).map((c) => { const cp = c.codePointAt(0); const hex = cp.toString(16).toUpperCase().padStart(4, "0"); return `U+${hex} ${CHAR_NAMES[cp] || "CHARACTER"}`; }).join(" + ");
  }
  function getDiagnostics(text) {
    const warnings = []; const nonAscii = new Map(); const hidden = countMatches(text, REGEX.hidden);
    if (hidden) warnings.push(`${hidden} hidden or formatting character(s) remain.`);
    for (const char of text) if (char.codePointAt(0) > 127) { const label = `${labelChar(char)} ${char}`; nonAscii.set(label, (nonAscii.get(label) || 0) + 1); }
    if (nonAscii.size) warnings.push(`${nonAscii.size} type(s) of non-ASCII character remain.`);
    return { warnings, remainingNonAscii: Array.from(nonAscii.entries()).map(([label, count]) => ({ label, count })) };
  }
  const API = { labelChar, getDiagnostics };
  if (typeof module !== "undefined" && module.exports) module.exports = API;
  else global.TextSanitizerCore = Object.assign(global.TextSanitizerCore || {}, API);
})(typeof window !== "undefined" ? window : globalThis);
