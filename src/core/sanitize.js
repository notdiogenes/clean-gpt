(function (global) {
  "use strict";
  const config = typeof require === "function" ? require("../config/option-defaults") : global.TextSanitizerConfig;
  const sourceCore = typeof require === "function" ? require("./sanitize-source") : global.TextSanitizerCore;
  const typographyCore = typeof require === "function" ? require("./destination-typography") : global.TextSanitizerCore;
  const asciiCore = typeof require === "function" ? require("./strict-ascii") : global.TextSanitizerCore;
  const diagnosticsCore = typeof require === "function" ? require("./diagnostics") : global.TextSanitizerCore;
  const { OPTION_DEFAULTS } = config;
  const { sanitizeSource } = sourceCore;
  const { applyDestinationTypography } = typographyCore;
  const { applyStrictAscii } = asciiCore;
  const { getDiagnostics } = diagnosticsCore;
  function sanitize(input, options) {
    const mergedOptions = Object.assign({}, OPTION_DEFAULTS, options || {});
    const source = sanitizeSource(input, mergedOptions);
    let text = applyDestinationTypography(source.text, mergedOptions, source.changes, source.stats);
    text = applyStrictAscii(text, mergedOptions, source.changes, source.stats);
    const diagnostics = getDiagnostics(text, input);
    return { cleanText: text, changes: source.changes, stats: source.stats, warnings: diagnostics.warnings, reviewRecords: diagnostics.reviewRecords, remainingNonAscii: diagnostics.remainingNonAscii, options: mergedOptions };
  }
  const API = { sanitize };
  if (typeof module !== "undefined" && module.exports) module.exports = API;
  else global.TextSanitizerCore = Object.assign(global.TextSanitizerCore || {}, API);
})(typeof window !== "undefined" ? window : globalThis);
