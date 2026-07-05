(function (global) {
  "use strict";

  const SAMPLE_TEXTS = Object.freeze({
    smart: `Here's a “sample” -- with curly quotes, dashes — and ellipsis... and numbers: 1-5 and 6-8.\n\nFeet/inches: 5'10".`,
    hidden: `Zero\u200Bwidth text with a left-to-right mark\u200E and no-break spaces: A\u00A0B.`,
    richList: `- First item\n  - Nested item\n- Second item\n\n1. Ordered item\n2. Another`,
    markdownList: `- Markdown bullet\n- Another bullet\n  1. Nested ordered\n  2. Another nested`,
    ascii: `Café naïve résumé — costs €5 ™ 😀 中文 math: ± × ÷ √ ½ ²`,
    form: `Name:\tJane   Doe\nAddress: 123\u00A0Main St.\n\n\nNotes: copy/paste safe.`,
    code: `TODO — normalize “quotes”, remove zero-width\u200B marks, keep tabs\twhere needed.`
  });

  const API = {
    SAMPLE_TEXTS
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = API;
  } else {
    global.TextSanitizerConfig = Object.assign(global.TextSanitizerConfig || {}, API);
  }
})(typeof window !== "undefined" ? window : globalThis);
