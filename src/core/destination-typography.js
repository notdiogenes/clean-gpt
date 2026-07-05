(function (global) {
  "use strict";

  const regexCore = typeof require === "function" ? require("./regex") : global.TextSanitizerCore;
  const statsCore = typeof require === "function" ? require("./stats") : global.TextSanitizerCore;
  const { REGEX, MAPS } = regexCore;
  const { addChange, replaceRegex } = statsCore;

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
        addChange(changes, "Destination", '"', replacement, 1, "Smart double quote applied", { category: "quote", subcategory: "smart-double-quote", severity: "info", sourceStart: i, sourceEnd: i + 1, outputStart: output.length, outputEnd: output.length + replacement.length });
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
        addChange(changes, "Destination", "'", replacement, 1, replacement === "′" ? "Measurement prime applied" : "Smart single quote/apostrophe applied", { category: "quote", subcategory: replacement === "′" ? "prime" : "smart-single-quote", severity: "info", sourceStart: i, sourceEnd: i + 1, outputStart: output.length, outputEnd: output.length + replacement.length });
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


  const API = { isOpeningContext, isWordChar, applySmartQuotes, applyDestinationTypography };
  if (typeof module !== "undefined" && module.exports) module.exports = API;
  else global.TextSanitizerCore = Object.assign(global.TextSanitizerCore || {}, API);
})(typeof window !== "undefined" ? window : globalThis);
