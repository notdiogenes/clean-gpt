(function (global) {
  "use strict";

  const regexCore = typeof require === "function" ? require("./regex") : global.TextSanitizerCore;
  const statsCore = typeof require === "function" ? require("./stats") : global.TextSanitizerCore;
  const { REGEX, MAPS } = regexCore;
  const { addChange, replaceMappedChars } = statsCore;

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


  const API = { applyStrictAscii };
  if (typeof module !== "undefined" && module.exports) module.exports = API;
  else global.TextSanitizerCore = Object.assign(global.TextSanitizerCore || {}, API);
})(typeof window !== "undefined" ? window : globalThis);
