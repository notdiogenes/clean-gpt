(function (global) {
  "use strict";

  const regexCore = typeof require === "function"
    ? require("../core/regex")
    : global.TextSanitizerCore;

  const { REGEX, MAPS } = regexCore;

  function htmlEscape(text) {
    return String(text).replace(REGEX.htmlSensitive, (char) => MAPS.html.get(char));
  }

  function htmlEscapeWithBreaks(text) {
    return htmlEscape(text).replace(/\n/g, "<br>");
  }

  const API = { htmlEscape, htmlEscapeWithBreaks };
  if (typeof module !== "undefined" && module.exports) module.exports = API;
  else global.TextSanitizerHtml = Object.assign(global.TextSanitizerHtml || {}, API);
})(typeof window !== "undefined" ? window : globalThis);
