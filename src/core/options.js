(function (global) {
  "use strict";
  const config = typeof require === "function" ? Object.assign({}, require("../config/destinations"), require("../config/option-defaults")) : global.TextSanitizerConfig;
  const { DESTINATIONS, OPTION_DEFAULTS } = config;
  function buildOptions(destination, presetOptions, uiOptions) {
    return Object.assign({}, OPTION_DEFAULTS, presetOptions || {}, (DESTINATIONS[destination] || DESTINATIONS.gmail).overrides, uiOptions || {});
  }
  const API = { buildOptions };
  if (typeof module !== "undefined" && module.exports) module.exports = API;
  else global.TextSanitizerCore = Object.assign(global.TextSanitizerCore || {}, API);
})(typeof window !== "undefined" ? window : globalThis);
