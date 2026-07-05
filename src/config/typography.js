(function (global) {
  "use strict";

  const GMAIL_FONT_OPTIONS = Object.freeze([
    { label: "Sans Serif", value: "Arial, Helvetica, sans-serif" },
    { label: "Serif", value: "Georgia, 'Times New Roman', serif" },
    { label: "Fixed Width", value: "'Courier New', Courier, monospace" },
    { label: "Wide", value: "Verdana, Geneva, sans-serif" },
    { label: "Narrow", value: "'Arial Narrow', Arial, sans-serif" },
    { label: "Comic Sans MS", value: "'Comic Sans MS', cursive" },
    { label: "Garamond", value: "Garamond, serif" },
    { label: "Georgia", value: "Georgia, serif" },
    { label: "Tahoma", value: "Tahoma, Geneva, sans-serif" },
    { label: "Trebuchet MS", value: "'Trebuchet MS', sans-serif" },
    { label: "Verdana", value: "Verdana, sans-serif" }
  ]);

  const GMAIL_SIZE_OPTIONS = Object.freeze([
    { label: "Small", value: "10px" },
    { label: "Normal", value: "13px" },
    { label: "Large", value: "18px" },
    { label: "Huge", value: "24px" }
  ]);

  const DOCUMENT_FONT_OPTIONS = Object.freeze([
    { label: "Arial", value: "Arial, sans-serif" },
    { label: "Times New Roman", value: "'Times New Roman', serif" },
    { label: "Georgia", value: "Georgia, serif" },
    { label: "Verdana", value: "Verdana, Geneva, sans-serif" },
    { label: "Courier New", value: "'Courier New', Courier, monospace" }
  ]);

  const DOCUMENT_SIZE_OPTIONS = Object.freeze([
    { label: "Normal text (11 pt)", value: "11pt" },
    { label: "Title (26 pt)", value: "26pt" },
    { label: "Subtitle (15 pt)", value: "15pt" },
    { label: "Heading 1 (20 pt)", value: "20pt" },
    { label: "Heading 2 (16 pt)", value: "16pt" },
    { label: "Heading 3 (14 pt)", value: "14pt" },
    { label: "Heading 4 (12 pt)", value: "12pt" },
    { label: "Heading 5 (11 pt)", value: "11pt" },
    { label: "Heading 6 (11 pt)", value: "11pt" }
  ]);

  const PLAIN_FONT_OPTIONS = Object.freeze([
    { label: "Monospace", value: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', monospace" },
    { label: "Sans Serif", value: "Arial, Helvetica, sans-serif" },
    { label: "Serif", value: "Georgia, 'Times New Roman', serif" }
  ]);

  const PLAIN_SIZE_OPTIONS = Object.freeze([
    { label: "Small", value: "0.86rem" },
    { label: "Normal", value: "0.92rem" },
    { label: "Large", value: "1rem" }
  ]);

  const API = {
    GMAIL_FONT_OPTIONS,
    GMAIL_SIZE_OPTIONS,
    DOCUMENT_FONT_OPTIONS,
    DOCUMENT_SIZE_OPTIONS,
    PLAIN_FONT_OPTIONS,
    PLAIN_SIZE_OPTIONS
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = API;
  } else {
    global.TextSanitizerConfig = Object.assign(global.TextSanitizerConfig || {}, API);
  }
})(typeof window !== "undefined" ? window : globalThis);
