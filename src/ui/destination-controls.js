(function (global) {
  "use strict";

  const API = {};
  if (typeof module !== "undefined" && module.exports) module.exports = API;
  else global.TextSanitizerUi = Object.assign(global.TextSanitizerUi || {}, API);
})(typeof window !== "undefined" ? window : globalThis);
