(function (global) {
  "use strict";

  function gmailStyleFromOptions(options) {
    const mergedOptions = options || {};
    const fontFamily = mergedOptions.gmailFontFamily || "verdana, sans-serif";
    const fontSize = mergedOptions.gmailFontSize || "";
    const declarations = [`font-family: ${fontFamily};`];
    if (fontSize) declarations.push(`font-size: ${fontSize};`);
    return {
      fontFamily,
      fontSize: fontSize || "10pt",
      inline: declarations.join(" ")
    };
  }

  function destinationStyleFromOptions(options) {
    const mergedOptions = options || {};
    const destination = mergedOptions.destination || "plain";
    const isGmail = destination === "gmail";
    const isDocument = destination === "googleDocs" || destination === "word" || destination === "outlook";
    const defaultFont = isGmail ? "Verdana, sans-serif" : (isDocument ? "Arial, sans-serif" : "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', monospace");
    const defaultSize = isGmail ? "13px" : (isDocument ? "11pt" : "0.92rem");
    return {
      fontFamily: mergedOptions.textFontFamily || mergedOptions.gmailFontFamily || defaultFont,
      fontSize: mergedOptions.textFontSize || mergedOptions.gmailFontSize || defaultSize
    };
  }

  function styleAttributeFromOptions(options) {
    const style = destinationStyleFromOptions(options);
    return `font-family: ${style.fontFamily}; font-size: ${style.fontSize};`;
  }

  const API = { gmailStyleFromOptions, destinationStyleFromOptions, styleAttributeFromOptions };
  if (typeof module !== "undefined" && module.exports) module.exports = API;
  else global.TextSanitizerHtml = Object.assign(global.TextSanitizerHtml || {}, API);
})(typeof window !== "undefined" ? window : globalThis);
