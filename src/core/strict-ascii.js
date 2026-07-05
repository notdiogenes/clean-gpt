(function (global) {
  "use strict";

  const regexCore = typeof require === "function" ? require("./regex") : global.TextSanitizerCore;
  const statsCore = typeof require === "function" ? require("./stats") : global.TextSanitizerCore;
  const { REGEX, MAPS } = regexCore;
  const { addChange, replaceMappedChars, replaceRegex } = statsCore;

  function applyStrictAscii(sourceText, options, changes, stats) {
    let text = sourceText;
    if (!options.strictAscii) return text;

    if (options.replaceSymbolsAscii) {
      text = replaceMappedChars(text, MAPS.asciiSymbols, "Source", changes, stats, "strictAsciiChanged", "Common symbol replaced for ASCII", { category: "strict-ascii", subcategory: "symbol-replace", severity: "warning", suggestion: "May change meaning. Review output." });
    }

    if (options.foldAccents) {
      let output = "";
      let folded = 0;
      for (let i = 0; i < text.length;) {
        const char = Array.from(text.slice(i))[0];
        const replacement = char.normalize("NFKD").replace(REGEX.combiningMarks, "");
        if (replacement !== char) {
          addChange(changes, "Source", char, replacement, 1, "Accents folded", { category: "strict-ascii", subcategory: "accent-fold", severity: "warning", sourceStart: i, sourceEnd: i + char.length, outputStart: output.length, outputEnd: output.length + replacement.length, suggestion: "May change meaning. Review output." });
          folded += 1;
        }
        output += replacement;
        i += char.length;
      }
      if (folded) {
        text = output;
        stats.strictAsciiChanged += folded;
        stats.sourceChanges += folded;
      }
    }

    text = replaceRegex(text, REGEX.nonAscii, "", "Source", changes, stats, "strictAsciiChanged", "Remaining non-ASCII removed", null, { category: "strict-ascii", subcategory: "non-ascii-remove", severity: "warning", suggestion: "May change meaning. Review output." });
    return text;
  }


  const API = { applyStrictAscii };
  if (typeof module !== "undefined" && module.exports) module.exports = API;
  else global.TextSanitizerCore = Object.assign(global.TextSanitizerCore || {}, API);
})(typeof window !== "undefined" ? window : globalThis);
