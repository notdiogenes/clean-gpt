(function (global) {
  "use strict";

  const DESTINATIONS = Object.freeze({
    gmail: {
      label: "Gmail",
      copyLabel: "Copy HTML",
      note: "Copies rich HTML with semantic lists and a plain-text fallback.",
      outputClass: "gmail-compose",
      overrides: {
        smartQuotes: false,
        smartDashes: false,
        numericRangesToEnDash: false,
        smartEllipsis: false,
        smartFractions: false,
        measurementPrimes: false,
        strictAscii: false
      }
    },
    googleDocs: {
      label: "Google Docs",
      copyLabel: "Copy HTML",
      note: "Copies rich HTML with semantic lists and a plain-text fallback.",
      outputClass: "document-output",
      overrides: {
        smartQuotes: true,
        smartDashes: true,
        numericRangesToEnDash: true,
        smartEllipsis: true,
        smartFractions: false,
        measurementPrimes: true,
        strictAscii: false
      }
    },
    word: {
      label: "Microsoft Word",
      copyLabel: "Copy HTML",
      note: "Copies rich HTML with semantic lists and a plain-text fallback.",
      outputClass: "document-output",
      overrides: {
        smartQuotes: true,
        smartDashes: true,
        numericRangesToEnDash: true,
        smartEllipsis: true,
        smartFractions: false,
        measurementPrimes: true,
        strictAscii: false
      }
    },

    markdown: {
      label: "Markdown",
      copyLabel: "Copy text",
      note: "Plain Markdown for GitHub, issues, and technical notes. Lists serialize as Markdown markers.",
      outputClass: "markdown-output",
      copyMode: "markdown",
      overrides: {
        smartQuotes: false,
        smartDashes: false,
        numericRangesToEnDash: false,
        smartEllipsis: false,
        smartFractions: false,
        measurementPrimes: false,
        strictAscii: false
      }
    },
    outlook: {
      label: "Outlook",
      copyLabel: "Copy HTML",
      note: "Copies rich HTML with semantic lists and a plain-text fallback.",
      outputClass: "document-output",
      copyMode: "documentHtml",
      overrides: {
        smartQuotes: false,
        smartDashes: false,
        numericRangesToEnDash: false,
        smartEllipsis: false,
        smartFractions: false,
        measurementPrimes: false,
        strictAscii: false
      }
    },
    slack: {
      label: "Slack / Teams",
      copyLabel: "Copy text",
      note: "Markdown-like plain text for chat tools. Avoids rich clipboard HTML.",
      outputClass: "markdown-output",
      copyMode: "markdown",
      overrides: {
        smartQuotes: false,
        smartDashes: false,
        numericRangesToEnDash: false,
        smartEllipsis: false,
        smartFractions: false,
        measurementPrimes: false,
        strictAscii: false
      }
    },
    cms: {
      label: "CMS / web forms",
      copyLabel: "Copy text",
      note: "Plain text for CMS fields and web forms, with conservative character cleanup and preserved paragraph spacing.",
      outputClass: "plain-output",
      copyMode: "plain",
      overrides: {
        smartQuotes: false,
        smartDashes: false,
        numericRangesToEnDash: false,
        smartEllipsis: false,
        smartFractions: false,
        measurementPrimes: false,
        strictAscii: false
      }
    },
    code: {
      label: "Code comments",
      copyLabel: "Copy text",
      note: "Code-safe plain text. Normalizes punctuation to keyboard-safe characters and removes hidden Unicode.",
      outputClass: "strict-output",
      copyMode: "plain",
      overrides: {
        smartQuotes: false,
        smartDashes: false,
        numericRangesToEnDash: false,
        smartEllipsis: false,
        smartFractions: false,
        measurementPrimes: false,
        strictAscii: false,
        collapseRepeatedSpaces: false,
        convertTabs: false
      }
    },
    plain: {
      label: "Plain text / forms",
      copyLabel: "Copy text",
      note: "Keyboard-safe visible characters only. Good for forms, CMS fields, terminals, and places where rich text is a liability.",
      outputClass: "plain-output",
      overrides: {
        smartQuotes: false,
        smartDashes: false,
        numericRangesToEnDash: false,
        smartEllipsis: false,
        smartFractions: false,
        measurementPrimes: false,
        strictAscii: false
      }
    },
    strictAscii: {
      label: "Strict ASCII",
      copyLabel: "Copy text",
      note: "Aggressive compatibility mode. Removes or replaces non-ASCII characters after cleanup.",
      outputClass: "strict-output",
      overrides: {
        smartQuotes: false,
        smartDashes: false,
        numericRangesToEnDash: false,
        smartEllipsis: false,
        smartFractions: false,
        measurementPrimes: false,
        strictAscii: true,
        removeEmoji: true,
        normalizeSuperscriptsSubscripts: true,
        collapseRepeatedSpaces: true,
        convertTabs: true
      }
    }
  });

  const DESTINATION_DETAILS = Object.freeze({
    gmail: { format: "rich HTML", list: "semantic lists unless Gmail flattening is enabled", typography: "keyboard punctuation by default", font: "font and size apply to rich HTML", fallback: "HTML only; falls back to visible text if HTML write fails" },
    googleDocs: { format: "rich HTML", list: "semantic ordered/unordered lists", typography: "document smart typography", font: "font and size apply to rich HTML", fallback: "plain-text fallback included" },
    word: { format: "rich HTML", list: "semantic ordered/unordered lists", typography: "document smart typography", font: "font and size apply to rich HTML", fallback: "plain-text fallback included" },
    outlook: { format: "rich HTML", list: "semantic ordered/unordered lists", typography: "conservative typography", font: "font and size apply to rich HTML", fallback: "plain-text fallback included" },
    markdown: { format: "Markdown plain text", list: "Markdown list markers", typography: "plain punctuation", font: "preview-only", fallback: "plain text only" },
    slack: { format: "plain text", list: "Markdown-like list markers", typography: "plain punctuation", font: "preview-only", fallback: "plain text only" },
    cms: { format: "plain text", list: "visible lines/paragraphs", typography: "conservative plain punctuation", font: "preview-only", fallback: "plain text only" },
    code: { format: "plain text", list: "visible lines", typography: "code-safe keyboard punctuation", font: "preview-only", fallback: "plain text only" },
    plain: { format: "plain text", list: "visible lines/paragraphs", typography: "keyboard-safe punctuation", font: "preview-only", fallback: "plain text only" },
    strictAscii: { format: "strict ASCII plain text", list: "visible ASCII lines", typography: "ASCII replacements only", font: "preview-only", fallback: "plain text only" }
  });

  const INSPECTOR_PRESENTATION_PROFILES = Object.freeze({
    gmail: {
      priorityCategories: ["Typography normalized", "Hidden and suspicious characters", "Whitespace and layout cleanup", "Compatibility cleanup"],
      promotedRows: ["Quotes normalized", "Dashes normalized", "Ellipses normalized", "Hidden/invisible characters removed", "Unusual spaces normalized", "Remaining non-ASCII characters", "Destination typography changes"],
      collapsedCategories: ["Technical details"],
      warningRules: { rows: ["Remaining non-ASCII characters", "Destination typography changes"], categories: ["Still needs review"] }
    },
    googleDocs: {
      priorityCategories: ["Structure detected", "Typography normalized", "Compatibility cleanup", "Hidden and suspicious characters"],
      promotedRows: ["Clipboard HTML available", "Lists detected", "List items", "Destination typography changes", "Hidden/invisible characters removed", "Compatibility changes"],
      collapsedCategories: ["Technical details"],
      warningRules: { rows: ["Compatibility changes", "Superscripts/subscripts flattened"], categories: ["Still needs review"] }
    },
    word: {
      priorityCategories: ["Structure detected", "Typography normalized", "Compatibility cleanup", "Hidden and suspicious characters"],
      promotedRows: ["Clipboard HTML available", "Lists detected", "List items", "Destination typography changes", "Hidden/invisible characters removed", "Compatibility changes"],
      collapsedCategories: ["Technical details"],
      warningRules: { rows: ["Compatibility changes", "Superscripts/subscripts flattened"], categories: ["Still needs review"] }
    },
    outlook: {
      priorityCategories: ["Structure detected", "Typography normalized", "Compatibility cleanup", "Hidden and suspicious characters"],
      promotedRows: ["Clipboard HTML available", "Lists detected", "List items", "Hidden/invisible characters removed", "Compatibility changes"],
      collapsedCategories: ["Technical details"],
      warningRules: { rows: ["Compatibility changes"], categories: ["Still needs review"] }
    },
    markdown: {
      priorityCategories: ["Structure detected", "Typography normalized", "Hidden and suspicious characters", "Whitespace and layout cleanup"],
      promotedRows: ["Lists detected", "List items", "Quotes normalized", "Dashes normalized", "Ellipses normalized", "Hidden/invisible characters removed", "Remaining non-ASCII characters"],
      collapsedCategories: ["Technical details", "Compatibility cleanup"],
      warningRules: { rows: ["Remaining non-ASCII characters"], categories: ["Still needs review"] }
    },
    slack: {
      priorityCategories: ["Whitespace and layout cleanup", "Structure detected", "Typography normalized", "Hidden and suspicious characters"],
      promotedRows: ["Line endings normalized", "Lists detected", "List items", "Clipboard HTML available", "Hidden/invisible characters removed", "Remaining non-ASCII characters"],
      collapsedCategories: ["Technical details", "Compatibility cleanup"],
      warningRules: { rows: ["Remaining non-ASCII characters", "Clipboard HTML available"], categories: ["Still needs review"] }
    },
    cms: {
      priorityCategories: ["Whitespace and layout cleanup", "Hidden and suspicious characters", "Compatibility cleanup", "Typography normalized"],
      promotedRows: ["Unusual spaces normalized", "Trailing spaces removed", "Repeated spaces collapsed", "Hidden/invisible characters removed", "Compatibility changes", "Remaining non-ASCII characters"],
      collapsedCategories: ["Technical details", "Structure detected"],
      warningRules: { rows: ["Remaining non-ASCII characters"], categories: ["Still needs review"] }
    },
    plain: {
      priorityCategories: ["Whitespace and layout cleanup", "Hidden and suspicious characters", "Compatibility cleanup", "Typography normalized"],
      promotedRows: ["Unusual spaces normalized", "Trailing spaces removed", "Repeated spaces collapsed", "Hidden/invisible characters removed", "Compatibility changes", "Remaining non-ASCII characters"],
      collapsedCategories: ["Technical details", "Structure detected"],
      warningRules: { rows: ["Remaining non-ASCII characters"], categories: ["Still needs review"] }
    },
    code: {
      priorityCategories: ["Typography normalized", "Hidden and suspicious characters", "Whitespace and layout cleanup"],
      promotedRows: ["Quotes normalized", "Dashes normalized", "Hidden/invisible characters removed", "Tabs converted", "Unusual spaces normalized", "Remaining directional marks", "Remaining non-ASCII characters"],
      collapsedCategories: ["Technical details", "Structure detected"],
      warningRules: { rows: ["Remaining directional marks", "Remaining non-ASCII characters"], categories: ["Still needs review"] }
    },
    strictAscii: {
      priorityCategories: ["Compatibility cleanup", "Hidden and suspicious characters", "Typography normalized"],
      promotedRows: ["Strict ASCII changes", "Compatibility changes", "Remaining non-ASCII characters", "Emoji removed", "Superscripts/subscripts flattened", "Hidden/invisible characters removed"],
      collapsedCategories: ["Technical details", "Structure detected", "Whitespace and layout cleanup"],
      warningRules: { rows: ["Strict ASCII changes", "Remaining non-ASCII characters", "Emoji removed", "Superscripts/subscripts flattened"], categories: ["Still needs review", "Compatibility cleanup"] }
    }
  });


  const API = {
    DESTINATIONS,
    DESTINATION_DETAILS,
    INSPECTOR_PRESENTATION_PROFILES
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = API;
  } else {
    global.TextSanitizerConfig = Object.assign(global.TextSanitizerConfig || {}, API);
  }
})(typeof window !== "undefined" ? window : globalThis);
