(function (global) {
  "use strict";

  const domElementsModule = typeof require === "function"
    ? require("./dom-elements")
    : global.TextSanitizerUi;
  const { getDomElements } = domElementsModule;

  const config = typeof require === "function"
    ? Object.assign(
      {},
      require("../config/destinations"),
      require("../config/presets"),
      require("../config/option-defaults"),
      require("../config/option-examples"),
      require("../config/samples"),
      require("../config/typography")
    )
    : global.TextSanitizerConfig;

  const {
    DESTINATIONS,
    DESTINATION_DETAILS,
    PRESETS,
    PRESET_DESCRIPTIONS,
    OPTION_DEFAULTS,
    OPTION_EXAMPLES,
    SAMPLE_TEXTS,
    GMAIL_FONT_OPTIONS,
    GMAIL_SIZE_OPTIONS,
    DOCUMENT_FONT_OPTIONS,
    DOCUMENT_SIZE_OPTIONS,
    PLAIN_FONT_OPTIONS,
    PLAIN_SIZE_OPTIONS
  } = config;

  const unicodeData = typeof require === "function"
    ? require("../core/unicode-data")
    : global.TextSanitizerUnicodeData;

  const regexCore = typeof require === "function"
    ? require("../core/regex")
    : global.TextSanitizerCore;
  const statsCore = typeof require === "function"
    ? require("../core/stats")
    : global.TextSanitizerCore;
  const optionsCore = typeof require === "function"
    ? require("../core/options")
    : global.TextSanitizerCore;
  const sourceCore = typeof require === "function"
    ? require("../core/sanitize-source")
    : global.TextSanitizerCore;
  const typographyCore = typeof require === "function"
    ? require("../core/destination-typography")
    : global.TextSanitizerCore;
  const asciiCore = typeof require === "function"
    ? require("../core/strict-ascii")
    : global.TextSanitizerCore;
  const diagnosticsCore = typeof require === "function"
    ? require("../core/diagnostics")
    : global.TextSanitizerCore;
  const sanitizeCore = typeof require === "function"
    ? require("../core/sanitize")
    : global.TextSanitizerCore;

  const htmlEscapeCore = typeof require === "function"
    ? require("../html/escape")
    : global.TextSanitizerHtml;
  const htmlStyleCore = typeof require === "function"
    ? require("../html/style-attributes")
    : global.TextSanitizerHtml;
  const gmailHtmlCore = typeof require === "function"
    ? require("../html/gmail-html")
    : global.TextSanitizerHtml;
  const documentHtmlCore = typeof require === "function"
    ? require("../html/document-html")
    : global.TextSanitizerHtml;

  const { CHAR_NAMES } = unicodeData;
  const { REGEX, INSPECTOR_UNICODE_CATEGORIES, MAPS, countMatches, regexMatchesText } = regexCore;
  const { makeStats } = statsCore;
  const { buildOptions } = optionsCore;
  const { sanitizeSource } = sourceCore;
  const { applyDestinationTypography } = typographyCore;
  const { applyStrictAscii } = asciiCore;
  const { labelChar, getDiagnostics } = diagnosticsCore;
  const { sanitize } = sanitizeCore;
  const { htmlEscape, htmlEscapeWithBreaks } = htmlEscapeCore;
  const { gmailStyleFromOptions, destinationStyleFromOptions, styleAttributeFromOptions } = htmlStyleCore;
  const { buildGmailHtml, docBlocksAsGmailLines, buildGmailLineDiv, buildGmailListHtml, buildGmailHtmlFromDoc } = gmailHtmlCore;
  const { buildDocumentHtmlFromDoc } = documentHtmlCore;

  function visibleChar(char) {
    if (char === " ") return "SPACE";
    if (char === "\n") return "LINE FEED";
    if (char === "\t") return "TAB";
    if (char === "") return "removed";
    return char;
  }

  const documentCore = typeof require === "function"
    ? require("../document/doc-model")
    : global.TextSanitizerDocument;
  const htmlDocumentParser = typeof require === "function"
    ? require("../document/parse-html")
    : global.TextSanitizerDocument;
  const plainTextDocumentParser = typeof require === "function"
    ? require("../document/parse-plain-text")
    : global.TextSanitizerDocument;
  const plainTextDocumentSerializer = typeof require === "function"
    ? require("../document/serialize-plain-text")
    : global.TextSanitizerDocument;
  const documentSanitizer = typeof require === "function"
    ? require("../document/sanitize-doc")
    : global.TextSanitizerDocument;

  const { normalizeBlockText, makeDoc, countDocLists } = documentCore;
  const { isBlockElement, cleanNodeText, directTextContent, parseListElement, parseHtmlToDoc } = htmlDocumentParser;
  const { parsePlainTextToDoc } = plainTextDocumentParser;
  const { docToPlainText } = plainTextDocumentSerializer;
  const { sanitizeDoc } = documentSanitizer;


  function invisibleLabel(char) {
    return Array.from(char).map((c) => {
      const cp = c.codePointAt(0);
      const hex = cp.toString(16).toUpperCase().padStart(4, "0");
      return `${CHAR_NAMES[cp] || "CHARACTER"} U+${hex}`;
    }).join(" + ");
  }

  const INSPECTOR_MARKER_LABELS = new Map([
    ["\u200B", "ZWSP"],
    ["\u2060", "WORD JOINER"],
    ["\u200E", "LRM"],
    ["\u200F", "RLM"],
    ["\u00AD", "SOFT HYPHEN"],
    ["\u00A0", "NBSP"],
    ["\t", "TAB"]
  ]);

  const INSPECTOR_SUBCATEGORY_MARKER_LABELS = {
    "trailing-space": "TRAILING SPACE",
    "blank-line-run": "EXTRA BLANK LINE",
    "repeated-space": "REPEATED SPACE"
  };

  function markerLabelForText(text) {
    const chars = Array.from(String(text || ""));
    if (chars.length !== 1) return "";
    return INSPECTOR_MARKER_LABELS.get(chars[0]) || "";
  }

  function visualizeInvisibles(text) {
    return String(text || "").replace(/[\u0009\u00a0\u00ad\u034f\u061c\u180b-\u180f\u2000-\u200f\u2028-\u202f\u205f\u2060-\u2069\ufeff\ufff9-\ufffb]|[\u{E0001}\u{E0020}-\u{E007F}\u{E0100}-\u{E01EF}]/gu, (char) => `[${markerLabelForText(char) || invisibleLabel(char)}]`);
  }

  function appendMarkerBadge(container, label, title) {
    const badge = document.createElement("span");
    badge.className = "inline-invisible-badge inspector-marker-badge";
    badge.textContent = `[${label}]`;
    badge.title = title || label;
    badge.setAttribute("aria-label", badge.title);
    container.appendChild(badge);
  }

  function appendVisualizedText(container, text) {
    String(text || "").split(/([\u0009\u00a0\u00ad\u034f\u061c\u180b-\u180f\u2000-\u200f\u2028-\u202f\u205f\u2060-\u2069\ufeff\ufff9-\ufffb]|[\u{E0001}\u{E0020}-\u{E007F}\u{E0100}-\u{E01EF}])/u).forEach((part) => {
      if (!part) return;
      if (regexMatchesText(/[\u0009\u00a0\u00ad\u034f\u061c\u180b-\u180f\u2000-\u200f\u2028-\u202f\u205f\u2060-\u2069\ufeff\ufff9-\ufffb]|[\u{E0001}\u{E0020}-\u{E007F}\u{E0100}-\u{E01EF}]/u, part)) {
        const badge = document.createElement("span");
        badge.className = "inline-invisible-badge";
        badge.textContent = markerLabelForText(part) || invisibleLabel(part);
        badge.title = labelChar(part);
        badge.setAttribute("aria-label", badge.title);
        container.appendChild(badge);
      } else container.appendChild(document.createTextNode(part));
    });
  }


  function renderDocFragment(doc, mode, destination, options) {
    const frag = document.createDocumentFragment();
    const isOutput = mode === "output";

    function blockDiv(text, className) {
      const div = document.createElement("div");
      div.className = className || "editor-paragraph";
      div.textContent = options && options.showInvisibles ? visualizeInvisibles(text || "") : (text || "");
      if (!text) div.appendChild(document.createElement("br"));
      return div;
    }

    function gmailDiv(text, isFinalText) {
      const div = document.createElement("div");
      div.className = "gmail_default editor-paragraph gmail-line";
      div.setAttribute("style", "font-family: verdana, sans-serif;");
      div.textContent = options && options.showInvisibles ? visualizeInvisibles(text || "") : (text || "");
      if (!text || isFinalText) div.appendChild(document.createElement("br"));
      return div;
    }

    function appendPlainTextList(block) {
      function appendList(listBlock, depth) {
        (listBlock.items || []).forEach((item, index) => {
          const marker = listBlock.type === "ol" ? `${index + 1}. ` : "- ";
          frag.appendChild(blockDiv(`${"  ".repeat(depth)}${marker}${item.text || ""}`, "editor-paragraph list-as-text"));
          (item.children || []).forEach((child) => appendList(child, depth + 1));
        });
      }
      appendList(block, 0);
    }

    function createSemanticList(block) {
      const list = document.createElement(block.type);
      list.className = "editor-list";
      (block.items || []).forEach((item) => {
        const li = document.createElement("li");
        li.textContent = options && options.showInvisibles ? visualizeInvisibles(item.text || "") : (item.text || "");
        (item.children || []).forEach((child) => li.appendChild(createSemanticList(child)));
        list.appendChild(li);
      });
      return list;
    }

    function appendSemanticList(block) {
      frag.appendChild(createSemanticList(block));
    }

    function appendGmailSemanticList(block, isFinalContent) {
      const list = document.createElement(block.type);
      list.className = "editor-list gmail-list";
      const style = gmailStyleFromOptions(options);
      list.setAttribute("style", style.inline);
      const items = block.items || [];
      items.forEach((item, index) => {
        const li = document.createElement("li");
        li.className = "gmail_default";
        li.setAttribute("style", "font-family: verdana, sans-serif;");
        li.textContent = options && options.showInvisibles ? visualizeInvisibles(item.text || "") : (item.text || "");
        (item.children || []).forEach((child) => li.appendChild(createSemanticList(child)));
        if (isFinalContent && index === items.length - 1) li.appendChild(document.createElement("br"));
        list.appendChild(li);
      });
      frag.appendChild(list);
    }

    if (isOutput && destination === "gmail") {
      if (options && options.gmailListsAsHyphenLines) {
        const lines = docBlocksAsGmailLines(doc, options || {});
        const nonEmptyIndexes = lines.map((line, index) => line.trim() ? index : -1).filter((index) => index >= 0);
        const lastTextIndex = nonEmptyIndexes.length ? nonEmptyIndexes[nonEmptyIndexes.length - 1] : -1;
        lines.forEach((line, index) => frag.appendChild(gmailDiv(line, index === lastTextIndex && line.trim())));
        return frag;
      }

      const blocks = doc.blocks || [];
      const contentIndexes = blocks.map((block, index) => {
        if (block.type === "paragraph" && (block.text || "").trim()) return index;
        if ((block.type === "ul" || block.type === "ol") && (block.items || []).length) return index;
        return -1;
      }).filter((index) => index >= 0);
      const lastContentIndex = contentIndexes.length ? contentIndexes[contentIndexes.length - 1] : -1;
      blocks.forEach((block, index) => {
        if (block.type === "blank") frag.appendChild(gmailDiv("", false));
        else if (block.type === "paragraph") frag.appendChild(gmailDiv(block.text || "", index === lastContentIndex));
        else if (block.type === "ul" || block.type === "ol") appendGmailSemanticList(block, index === lastContentIndex);
      });
      return frag;
    }

    (doc.blocks || []).forEach((block) => {
      if (block.type === "blank") {
        frag.appendChild(blockDiv("", "editor-blank"));
      } else if (block.type === "paragraph") {
        frag.appendChild(blockDiv(block.text || "", "editor-paragraph"));
      } else if (block.type === "ul" || block.type === "ol") {
        if (isOutput && (destination === "plain" || destination === "strictAscii" || destination === "markdown" || destination === "slack" || destination === "cms" || destination === "code")) appendPlainTextList(block);
        else appendSemanticList(block);
      }
    });
    return frag;
  }

  function renderDocInto(editor, doc, mode, destination, options) {
    editor.innerHTML = "";
    editor.appendChild(renderDocFragment(doc, mode, destination, options || {}));
  }

  function parseEditorToDoc(editor) {
    const blocks = [];
    function addBlank() {
      const last = blocks[blocks.length - 1];
      if (!last || last.type !== "blank") blocks.push({ type: "blank" });
    }
    Array.from(editor.childNodes || []).forEach((node) => {
      if (node.nodeType === 3) {
        const text = normalizeBlockText(node.nodeValue || "").trim();
        if (text) blocks.push({ type: "paragraph", text });
        return;
      }
      if (node.nodeType !== 1) return;
      const tag = node.tagName;
      if (tag === "UL" || tag === "OL") {
        const listBlock = parseListElement(node, tag === "OL");
        if (listBlock.items.length) blocks.push(listBlock);
        return;
      }
      if (tag === "BR") {
        addBlank();
        return;
      }
      const text = cleanNodeText(node);
      if (!text) addBlank();
      else blocks.push({ type: "paragraph", text });
    });
    const counts = countDocLists(blocks);
    return makeDoc(blocks, { source: "editor", lists: counts.lists, listItems: counts.items });
  }

  function insertDocAtSelection(editor, doc) {
    const fragment = renderDocFragment(doc, "input", "source", {});
    const marker = document.createElement("span");
    marker.setAttribute("data-caret-marker", "true");
    marker.appendChild(document.createTextNode(""));
    fragment.appendChild(marker);
    const selection = global.getSelection ? global.getSelection() : null;
    if (selection && selection.rangeCount && editor.contains(selection.anchorNode)) {
      const range = selection.getRangeAt(0);
      range.deleteContents();
      range.insertNode(fragment);
    } else {
      editor.appendChild(fragment);
    }
    const range = document.createRange();
    range.setStartAfter(marker);
    range.collapse(true);
    marker.remove();
    if (selection) {
      selection.removeAllRanges();
      selection.addRange(range);
    }
  }

  function currentOptionsFromUi(destination, presetSelect, optionInputs) {
    const preset = PRESETS[presetSelect.value] || PRESETS.standard;
    const ui = {};
    optionInputs.forEach((input) => { ui[input.dataset.option] = input.checked; });
    return buildOptions(destination, preset, ui);
  }

  function getCodeLabelForChangeValue(value) {
    if (value === "") return "removed";
    if (value === "\r\n") return "U+000D CARRIAGE RETURN + U+000A LINE FEED";
    if (value === "\r") return "U+000D CARRIAGE RETURN";
    if (value === "\n") return "U+000A LINE FEED";
    if (value === "\n\n") return "U+000A LINE FEED + U+000A LINE FEED";
    if (value === "  ") return "U+0020 SPACE + U+0020 SPACE";
    if (value.length > 24 && !Array.from(value).some((char) => char.codePointAt(0) > 127)) return value;
    return Array.from(value).map((char) => labelChar(char)).join(" + ");
  }

  function startApp() {
    const {
      inputEditor,
      outputEditor,
      clearButton,
      destinationCopyButton,
      copyVisibleButton,
      destinationSelect,
      destinationNote,
      destinationFontSelect,
      destinationSizeSelect,
      destinationStyleNote,
      destinationSummary,
      presetDescription,
      sampleSelect,
      presetSelect,
      status,
      pasteStatus,
      inspectorSections,
      statsList,
      changesList,
      warningsList,
      nonAsciiList,
      diffViewToggle,
      previewTab,
      diffTab,
      advancedSettingsButton,
      advancedSettings,
      advancedSettingsSearch,
      advancedSettingsSearchStatus,
      advancedSettingsClear,
      runUserTestsButton,
      userTestResults,
      userTestAnimation,
      themeToggle,
      optionInputs
    } = getDomElements(document);

    if (!inputEditor || !outputEditor || !destinationSelect || !presetSelect) return;

    let lastResult = null;
    let inputDoc = makeDoc([], { source: "manual" });
    let suppressInputEvent = false;
    let pinnedInspectorElement = null;

    function setStatus(message) {
      if (status) status.textContent = message || "";
    }

    function setPasteStatus(message) {
      if (pasteStatus) pasteStatus.textContent = message || "Ready for paste.";
    }

    function applyTheme(isDark) {
      document.documentElement.dataset.theme = isDark ? "dark" : "light";
      if (themeToggle) themeToggle.checked = isDark;
      try { global.localStorage?.setItem("copySanitizer.theme", isDark ? "dark" : "light"); } catch (error) {}
    }

    function loadThemePreference() {
      try {
        const saved = global.localStorage?.getItem("copySanitizer.theme");
        if (saved === "dark" || saved === "light") return saved;
      } catch (error) {}
      return global.matchMedia && global.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }

    function applyOptionsToUi(options) {
      optionInputs.forEach((input) => {
        input.checked = Boolean(options[input.dataset.option]);
        const example = OPTION_EXAMPLES[input.dataset.option];
        if (example) {
          const item = input.closest(".setting-item") || input.closest("label");
          if (item) {
            item.title = example;
            input.setAttribute("aria-describedby", `${input.dataset.option}Example`);
            if (!item.querySelector(".setting-item-description, .toggle-example")) {
              const hint = document.createElement("span");
              hint.className = item.classList.contains("setting-item") ? "setting-item-description" : "toggle-example";
              hint.id = `${input.dataset.option}Example`;
              hint.textContent = example;
              const content = item.querySelector(".setting-item-content") || item;
              content.appendChild(hint);
            }
          }
        }
      });
    }

    function styleConfigForDestination(destination) {
      if (destination === "gmail") {
        return {
          fonts: GMAIL_FONT_OPTIONS,
          sizes: GMAIL_SIZE_OPTIONS,
          defaultFont: "Verdana, sans-serif",
          defaultSize: "13px",
          note: "Applies to preview and rich-copy HTML."
        };
      }
      if (destination === "googleDocs" || destination === "word" || destination === "outlook") {
        return {
          fonts: DOCUMENT_FONT_OPTIONS,
          sizes: DOCUMENT_SIZE_OPTIONS,
          defaultFont: "Arial, sans-serif",
          defaultSize: "11pt",
          note: "Applies to preview and rich-copy HTML."
        };
      }
      return {
        fonts: PLAIN_FONT_OPTIONS,
        sizes: PLAIN_SIZE_OPTIONS,
        defaultFont: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', monospace",
        defaultSize: "0.92rem",
        note: "Preview only. Plain-text copies do not include font or size."
      };
    }

    function populateSelect(select, options, selectedValue) {
      if (!select) return;
      select.innerHTML = "";
      options.forEach((option) => {
        const element = document.createElement("option");
        element.value = option.value;
        element.textContent = option.label;
        select.appendChild(element);
      });
      if (selectedValue && options.some((option) => option.value === selectedValue)) select.value = selectedValue;
    }

    function getStylePreferenceKey(destination) {
      return `copySanitizer.destinationStyle.${destination}`;
    }

    function loadDestinationStylePreference(destination) {
      try {
        return JSON.parse(global.localStorage?.getItem(getStylePreferenceKey(destination)) || "{}");
      } catch (error) {
        return {};
      }
    }

    function saveDestinationStylePreference() {
      const destination = destinationSelect.value;
      try {
        global.localStorage?.setItem(getStylePreferenceKey(destination), JSON.stringify({
          fontFamily: destinationFontSelect ? destinationFontSelect.value : "",
          fontSize: destinationSizeSelect ? destinationSizeSelect.value : ""
        }));
      } catch (error) {
        // Local storage may be unavailable in private or locked-down contexts.
      }
    }

    function refreshStyleControls() {
      const destination = destinationSelect.value;
      const config = styleConfigForDestination(destination);
      const saved = loadDestinationStylePreference(destination);
      populateSelect(destinationFontSelect, config.fonts, saved.fontFamily || config.defaultFont);
      populateSelect(destinationSizeSelect, config.sizes, saved.fontSize || config.defaultSize);
      const detail = DESTINATION_DETAILS[destination] || DESTINATION_DETAILS.gmail;
      if (destinationStyleNote) destinationStyleNote.textContent = detail.font === "preview-only" ? "Preview only. Plain-text copies do not include font or size." : config.note;
      const disabled = false;
      if (destinationFontSelect) destinationFontSelect.disabled = disabled;
      if (destinationSizeSelect) destinationSizeSelect.disabled = disabled;
    }

    function refreshProfileUi() {
      const profile = DESTINATIONS[destinationSelect.value] || DESTINATIONS.gmail;
      if (destinationNote) destinationNote.textContent = profile.note;
      const details = DESTINATION_DETAILS[destinationSelect.value] || DESTINATION_DETAILS.gmail;
      if (destinationSummary) {
        destinationSummary.innerHTML = "";
        [["Copies", details.format], ["Lists", details.list], ["Typography", details.typography], ["Style", details.font], ["Fallback", details.fallback]].forEach(([term, desc]) => {
          const dt = document.createElement("dt");
          const dd = document.createElement("dd");
          dt.textContent = term;
          dd.textContent = desc;
          destinationSummary.append(dt, dd);
        });
      }
      if (destinationCopyButton) destinationCopyButton.textContent = profile.copyLabel;
      const plainOnly = (DESTINATION_DETAILS[destinationSelect.value] || DESTINATION_DETAILS.gmail).format.toLowerCase().includes("plain text") || profile.copyLabel === "Copy text";
      if (copyVisibleButton) {
        copyVisibleButton.hidden = plainOnly;
        copyVisibleButton.textContent = "Copy visible text";
      }
      outputEditor.classList.remove("gmail-compose", "document-output", "plain-output", "strict-output", "markdown-output", "diff-output", "compact-diff-output");
      outputEditor.classList.add(profile.outputClass);
    }

    function getOptions() {
      const options = currentOptionsFromUi(destinationSelect.value, presetSelect, optionInputs);
      options.destination = destinationSelect.value;
      if (destinationFontSelect) options.textFontFamily = destinationFontSelect.value;
      if (destinationSizeSelect) options.textFontSize = destinationSizeSelect.value;
      if (options.destination === "gmail") {
        options.gmailFontFamily = options.textFontFamily;
        options.gmailFontSize = options.textFontSize;
      }
      return options;
    }

    function changeRecordHasSourceSpan(change) {
      return Number.isInteger(change?.sourceStart) && Number.isInteger(change?.sourceEnd) && change.sourceEnd >= change.sourceStart;
    }

    function changeRecordHasOutputSpan(change) {
      return Number.isInteger(change?.outputStart) && Number.isInteger(change?.outputEnd) && change.outputEnd >= change.outputStart;
    }

    function rangesOverlap(startA, endA, startB, endB) {
      return startA < endB && startB < endA;
    }

    function changeRecordMatchesPartSpan(change, part) {
      if (!change || !part) return false;
      if (changeRecordHasSourceSpan(change) && Number.isInteger(part.sourceStart) && Number.isInteger(part.sourceEnd) && rangesOverlap(change.sourceStart, change.sourceEnd, part.sourceStart, part.sourceEnd)) return true;
      if (changeRecordHasOutputSpan(change) && Number.isInteger(part.outputStart) && Number.isInteger(part.outputEnd) && rangesOverlap(change.outputStart, change.outputEnd, part.outputStart, part.outputEnd)) return true;
      return false;
    }

    function changeRecordMatchesPartText(change, part) {
      if (!change || !part) return false;
      const source = part.source || "";
      const target = part.text || "";
      const before = change.before ?? change.source ?? "";
      const after = change.after ?? change.target ?? "";
      return source === before || target === after || (before && source.includes(before)) || (after && target.includes(after));
    }

    function changeRecordsMatchPart(records, part) {
      const changes = records || [];
      return changes.some((change) => changeRecordMatchesPartSpan(change, part) || changeRecordMatchesPartText(change, part));
    }

    function markerLabelForChangeRecord(change) {
      if (!change) return "";
      if (INSPECTOR_SUBCATEGORY_MARKER_LABELS[change.subcategory]) return INSPECTOR_SUBCATEGORY_MARKER_LABELS[change.subcategory];
      if (change.note === "Tab converted to two spaces") return "TAB";
      return markerLabelForText(change.before ?? change.source ?? "");
    }

    function markerLabelForChangeRecords(records, part) {
      const change = (records || []).find((record) => markerLabelForChangeRecord(record) && (changeRecordMatchesPartSpan(record, part) || changeRecordMatchesPartText(record, part)));
      return change ? markerLabelForChangeRecord(change) : "";
    }

    function filterChangeRecords(predicate) {
      return (lastResult?.changes || []).filter(predicate);
    }

    function changeRecordsForCategory(category) {
      return filterChangeRecords((change) => change.category === category);
    }

    function changeRecordsForCategories(categories) {
      const allowed = new Set(categories || []);
      return filterChangeRecords((change) => allowed.has(change.category));
    }

    function changeRecordsForSubcategory(subcategory) {
      return filterChangeRecords((change) => change.subcategory === subcategory);
    }

    function changeRecordsForSubcategories(subcategories) {
      const allowed = new Set(subcategories || []);
      return filterChangeRecords((change) => allowed.has(change.subcategory));
    }

    function changeRecordsForNotes(notes) {
      const allowed = new Set(notes || []);
      return filterChangeRecords((change) => allowed.has(change.note));
    }

    function changeRecordsForExactTransform(before, after) {
      return filterChangeRecords((change) => (change.before ?? change.source ?? "") === before && (change.after ?? change.target ?? "") === after);
    }

    function changeRecordsForPhase(phase) {
      return filterChangeRecords((change) => change.phase === phase);
    }

    function reviewRecords(result) {
      return result?.reviewRecords || [];
    }

    function locationMatchesPart(locations, part, prefix) {
      const startKey = `${prefix}Start`;
      const endKey = `${prefix}End`;
      return (locations || []).some((location) => Number.isInteger(part[startKey]) && Number.isInteger(part[endKey]) && rangesOverlap(location.start, location.end, part[startKey], part[endKey]));
    }

    function reviewRecordMatchesInputPart(record, part) {
      return locationMatchesPart(record.sourceLocations, part, "source");
    }

    function reviewRecordMatchesOutputPart(record, part) {
      return locationMatchesPart(record.outputLocations, part, "output");
    }

    function highlightInputForChangeRecords(records, blockMatcher) {
      if (!lastResult) return;
      const options = getOptions();
      const spanRecords = records || [];
      renderInputDiffHighlights(inputDoc, lastResult.doc, options, (part) => changeRecordsMatchPart(spanRecords, part), blockMatcher, (part) => markerLabelForChangeRecords(spanRecords, part));
      inputEditor.classList.add("inspector-pulse");
    }

    function highlightInputForReviewRecord(record) {
      if (!lastResult || !(record.sourceLocations || []).length) return;
      const options = getOptions();
      renderInputDiffHighlights(inputDoc, lastResult.doc, options, (part) => reviewRecordMatchesInputPart(record, part), null, () => record.codePoint);
      inputEditor.classList.add("inspector-pulse");
    }

    function appendOutputReviewText(container, text, baseOutputOffset, record) {
      let cursor = Number.isInteger(baseOutputOffset) ? baseOutputOffset : 0;
      for (const char of String(text || "")) {
        const part = { outputStart: cursor, outputEnd: cursor + char.length };
        if (reviewRecordMatchesOutputPart(record, part)) {
          const span = document.createElement("span");
          span.className = "char-change";
          span.title = `${record.codePoint} ${record.characterName}: ${record.suggestion}`;
          span.setAttribute("aria-label", span.title);
          span.textContent = char;
          container.appendChild(span);
        } else container.appendChild(document.createTextNode(char));
        cursor += char.length;
      }
    }

    function highlightOutputForReviewRecord(record) {
      if (!lastResult) return;
      const options = getOptions();
      outputEditor.innerHTML = "";
      let outputOffset = 0;
      const appendBlock = (text, className) => {
        const div = document.createElement("div");
        div.className = className || "editor-paragraph";
        appendOutputReviewText(div, text || "", outputOffset, record);
        if (!text) div.appendChild(document.createElement("br"));
        outputEditor.appendChild(div);
        outputOffset += String(text || "").length + 1;
      };
      (lastResult.doc.blocks || []).forEach((block) => {
        if (block.type === "blank") appendBlock("", "editor-blank");
        else if (block.type === "paragraph") appendBlock(block.text || "", "editor-paragraph");
        else if (block.type === "ul" || block.type === "ol") {
          const list = document.createElement(block.type);
          (block.items || []).forEach((item) => {
            const li = document.createElement("li");
            appendOutputReviewText(li, item.text || "", outputOffset, record);
            outputOffset += String(item.text || "").length + 1;
            list.appendChild(li);
          });
          outputEditor.appendChild(list);
        }
      });
      outputEditor.classList.add("inspector-pulse");
    }

    function clearOutputReviewHighlight() {
      if (!lastResult) return;
      outputEditor.classList.remove("inspector-pulse");
      if (diffViewToggle && diffViewToggle.checked) renderCompactDiff(inputDoc, lastResult.doc, lastResult.changes, DESTINATIONS[destinationSelect.value], getOptions());
      else renderDocInto(outputEditor, lastResult.doc, "output", destinationSelect.value, getOptions());
    }

    function highlightInputForMetric(label, matcher, blockMatcher, records) {
      if (!lastResult) return;
      if (records) {
        highlightInputForChangeRecords(typeof records === "function" ? records() : records, blockMatcher);
        return;
      }
      const options = getOptions();
      renderInputDiffHighlights(inputDoc, lastResult.doc, options, matcher || (() => false), blockMatcher);
      inputEditor.classList.add("inspector-pulse");
    }

    function clearInputMetricHighlight(options = {}) {
      if (options.preservePinned && pinnedInspectorElement) return;
      if (!options.preservePinned) {
        if (pinnedInspectorElement) pinnedInspectorElement.classList.remove("is-pinned");
        pinnedInspectorElement = null;
      }
      activeInspectorElement = null;
      inputEditor.classList.remove("inspector-pulse");
      const currentOptions = getOptions();
      suppressInputEvent = true;
      renderDocInto(inputEditor, inputDoc, "input", "source", currentOptions.showInvisibles ? currentOptions : {});
      inputEditor.dataset.showingInvisibles = currentOptions.showInvisibles ? "true" : "false";
      inputEditor.dataset.diffHighlight = "false";
      suppressInputEvent = false;
    }

    function pinInputMetricHighlight(element, render) {
      if (pinnedInspectorElement && pinnedInspectorElement !== element) pinnedInspectorElement.classList.remove("is-pinned");
      pinnedInspectorElement = element;
      activeInspectorElement = element;
      element.classList.add("is-pinned");
      render();
    }

    function renderTransientInputMetricHighlight(element, render) {
      if (pinnedInspectorElement && pinnedInspectorElement !== element) return;
      activeInspectorElement = element;
      render();
    }

    function clearTransientInputMetricHighlight(element) {
      if (pinnedInspectorElement) return;
      if (activeInspectorElement !== element) return;
      clearInputMetricHighlight({ preservePinned: true });
      clearOutputReviewHighlight();
    }

    function clearAnyInspectorHighlight() {
      if (!pinnedInspectorElement && !activeInspectorElement) return;
      clearInputMetricHighlight();
      clearOutputReviewHighlight();
    }

    function createInspectorInteractiveRow(options) {
      const li = document.createElement("li");
      li.className = `inspector-interactive-row${options.severity === "warning" ? " inspector-warning-row" : ""}`;
      const button = document.createElement("button");
      button.type = "button";
      button.className = "inspector-row-button";
      button.setAttribute("aria-label", options.ariaLabel);
      if (options.title) button.title = options.title;
      if (options.text) button.textContent = options.text;
      else button.append(...options.children);
      const renderHighlight = options.renderHighlight;
      button.addEventListener("mouseenter", () => renderTransientInputMetricHighlight(button, renderHighlight));
      button.addEventListener("click", () => pinInputMetricHighlight(button, renderHighlight));
      button.addEventListener("mouseleave", () => clearTransientInputMetricHighlight(button));
      button.addEventListener("focus", () => renderTransientInputMetricHighlight(button, renderHighlight));
      button.addEventListener("blur", () => clearTransientInputMetricHighlight(button));
      li.appendChild(button);
      return li;
    }

    function createInspectorMetadataRow(children, title, options) {
      const li = document.createElement("li");
      li.className = `inspector-metadata-row${options?.severity === "warning" ? " inspector-warning-row" : ""}`;
      if (title) li.title = title;
      li.append(...children);
      return li;
    }

    let activeInspectorElement = null;

    function makeInspectorMetric(label, value, matcher, blockMatcher, records, options) {
      return { type: "metric", label, value, matcher, blockMatcher, records, severity: options?.severity || "info", warningText: options?.warningText || "" };
    }

    function makeInspectorNote(text) {
      return { type: "note", text };
    }

    function createInspectorMetricRow(entry) {
      const span = document.createElement("span");
      const strong = document.createElement("strong");
      span.textContent = entry.label;
      strong.textContent = String(entry.value);
      const children = [span, strong];
      if (entry.severity === "warning" && entry.warningText) {
        const warning = document.createElement("small");
        warning.className = "inspector-warning-copy";
        warning.textContent = entry.warningText;
        children.splice(1, 0, warning);
      }
      const canHighlight = Boolean(entry.matcher || entry.blockMatcher || entry.records) && Number(entry.value) > 0;
      if (!canHighlight) {
        return createInspectorMetadataRow(children, "This metric summarizes the document and does not map to one exact text span.", { severity: entry.severity });
      }
      return createInspectorInteractiveRow({
        ariaLabel: `Highlight ${entry.label.toLowerCase()} in input`,
        title: "Hover, focus, or click to highlight related input text.",
        children,
        severity: entry.severity,
        renderHighlight: () => highlightInputForMetric(entry.label, entry.matcher, entry.blockMatcher, entry.records)
      });
    }

    function createInspectorChangeRow(change) {
      const source = getCodeLabelForChangeValue(change.source);
      const target = getCodeLabelForChangeValue(change.target);
      const text = `${change.phase}: ${source} -> ${target} ×${change.count}${change.note ? ` (${change.note})` : ""}${change.severity === "warning" ? " — May change meaning. Review output." : ""}`;
      const exactTransformRecords = () => changeRecordsForExactTransform(change.before ?? change.source ?? "", change.after ?? change.target ?? "").filter((record) => record.key === change.key);
      return createInspectorInteractiveRow({
        ariaLabel: `Highlight ${change.phase} change from ${source} to ${target} in input`,
        title: change.severity === "warning" ? "May change meaning. Review output." : "Hover, focus, or click to highlight this input change.",
        text,
        severity: change.severity,
        renderHighlight: () => highlightInputForChangeRecords(exactTransformRecords())
      });
    }

    function createInspectorReviewRow(record) {
      const text = `${visibleChar(record.character)} ${record.codePoint} ${record.characterName} ×${record.count} — ${record.severity === "warning" ? "May change meaning. Review output." : record.suggestion}`;
      return createInspectorInteractiveRow({
        ariaLabel: `Highlight remaining ${record.codePoint} in output${(record.sourceLocations || []).length ? " and input" : ""}`,
        title: record.severity === "warning" ? "May change meaning. Review output." : ((record.sourceLocations || []).length ? "Hover, focus, or click to highlight the output first and the mapped input source." : "Hover, focus, or click to highlight the output."),
        text,
        severity: record.severity,
        renderHighlight: () => {
          highlightOutputForReviewRecord(record);
          if ((record.sourceLocations || []).length) highlightInputForReviewRecord(record);
        }
      });
    }

    function appendInspectorSection(title, entries, options) {
      if (!inspectorSections || !entries.length) return;
      const section = document.createElement("section");
      section.className = "inspector-section";
      const heading = document.createElement("h3");
      heading.textContent = title;
      const list = document.createElement("ul");
      list.className = options?.compact ? "plain-list compact" : "stats-list";
      entries.forEach((entry) => {
        if (entry.type === "metric") list.appendChild(createInspectorMetricRow(entry));
        else if (entry.type === "change") list.appendChild(createInspectorChangeRow(entry.change));
        else if (entry.type === "review") list.appendChild(createInspectorReviewRow(entry.record));
        else {
          const li = document.createElement("li");
          li.className = `inspector-metadata-row${entry.severity === "warning" ? " inspector-warning-row" : ""}`;
          li.textContent = entry.text;
          list.appendChild(li);
        }
      });
      section.append(heading, list);
      inspectorSections.appendChild(section);
    }


    function pluralize(count, singular, plural) {
      return `${count} ${count === 1 ? singular : plural}`;
    }

    function countMeaningfulCleanupChanges(stats) {
      const cleanupStatNames = [
        "hiddenRemoved",
        "spacesNormalized",
        "lineEndingsNormalized",
        "separatorsNormalized",
        "trailingSpacesRemoved",
        "blankLineRunsReduced",
        "repeatedSpacesCollapsed",
        "tabsConverted",
        "quotesChanged",
        "dashesChanged",
        "ellipsesChanged",
        "bulletsChanged",
        "fullwidthChanged",
        "ligaturesChanged",
        "fractionsChanged",
        "superSubChanged",
        "emojiRemoved",
        "strictAsciiChanged"
      ];
      return cleanupStatNames.reduce((total, statName) => total + Number(stats?.[statName] || 0), 0);
    }

    function countReviewItems(result) {
      return reviewRecords(result).length;
    }

    function getDestinationSafetyStatus(result) {
      const options = result.options || getOptions();
      const destination = options.destination || destinationSelect.value;
      const profile = DESTINATIONS[destination] || DESTINATIONS.gmail;
      const hasReviewItems = countReviewItems(result) > 0;
      const remainingNonAsciiCount = reviewRecords(result).filter((record) => record.subcategory === "remaining-non-ascii").length;
      if (options.strictAscii || destination === "strictAscii") {
        if (remainingNonAsciiCount > 0) return "Destination safety: Strict ASCII needs review";
        return "Destination safety: Strict ASCII ready";
      }
      if (hasReviewItems) return `Destination safety: Review before copying to ${profile.label}`;
      return `Destination safety: Ready for ${profile.label}`;
    }

    function buildInspectorSummary(result) {
      const cleanupChanges = countMeaningfulCleanupChanges(result.stats || {});
      const reviewItems = countReviewItems(result);
      let statusText = "No changes needed";
      if (cleanupChanges > 0 && reviewItems === 0) statusText = "Cleaned";
      else if (cleanupChanges > 0 && reviewItems > 0) statusText = "Cleaned with warnings";
      else if (cleanupChanges === 0 && reviewItems > 0) statusText = "Needs review";
      return [
        makeInspectorNote(`Status: ${statusText}`),
        makeInspectorNote(`${pluralize(cleanupChanges, "change", "changes")} applied`),
        makeInspectorNote(`${pluralize(reviewItems, "item", "items")} still ${reviewItems === 1 ? "needs" : "need"} review`),
        makeInspectorNote(getDestinationSafetyStatus(result))
      ];
    }

    function renderInspector(result) {
      const container = inspectorSections || statsList;
      if (!container) return;
      container.innerHTML = "";
      const inputText = docToPlainText(inputDoc, "plain");
      const inputChars = inputText.length;
      appendInspectorSection("Inspector summary", buildInspectorSummary(result), { compact: true });
      const unicodeCategoryEntries = INSPECTOR_UNICODE_CATEGORIES.map((category) => makeInspectorMetric(
        category.label,
        countMatches(inputText, category.regex)
      )).filter((entry) => entry.value > 0);
      const sourceChanges = makeInspectorMetric("Source changes", result.stats.sourceChanges, null, null, () => changeRecordsForPhase("Source"));
      const destinationChanges = makeInspectorMetric("Destination changes", result.stats.destinationChanges, null, null, () => changeRecordsForPhase("Destination"));
      const groups = [
        ["Cleanup summary", [sourceChanges, destinationChanges]],
        ["Hidden and suspicious characters", [
          makeInspectorMetric("Hidden/invisible characters removed", result.stats.hiddenRemoved, null, null, () => changeRecordsForCategory("hidden-character")),
          ...unicodeCategoryEntries
        ]],
        ["Typography normalized", [
          makeInspectorMetric("Quotes normalized", result.stats.quotesChanged, null, null, () => changeRecordsForCategory("quote")),
          makeInspectorMetric("Dashes normalized", result.stats.dashesChanged, null, null, () => changeRecordsForCategory("dash")),
          makeInspectorMetric("Ellipses normalized", result.stats.ellipsesChanged, null, null, () => changeRecordsForCategory("ellipsis"))
        ]],
        ["Whitespace and layout cleanup", [
          makeInspectorMetric("Line endings normalized", result.stats.lineEndingsNormalized, null, null, () => changeRecordsForSubcategories(["crlf", "cr"])),
          makeInspectorMetric("Unicode line/paragraph separators normalized", result.stats.separatorsNormalized, null, null, () => changeRecordsForNotes(["Unicode separator normalized"])),
          makeInspectorMetric("Unusual spaces normalized", result.stats.spacesNormalized, null, null, () => changeRecordsForNotes(["Unusual space normalized"])),
          makeInspectorMetric("Trailing spaces removed", result.stats.trailingSpacesRemoved, null, null, () => changeRecordsForSubcategory("trailing-space")),
          makeInspectorMetric("Repeated spaces collapsed", result.stats.repeatedSpacesCollapsed, null, null, () => changeRecordsForSubcategory("repeated-space")),
          makeInspectorMetric("Extra blank-line runs reduced", result.stats.blankLineRunsReduced, null, null, () => changeRecordsForSubcategory("blank-line-run")),
          makeInspectorMetric("Tabs converted", result.stats.tabsConverted, null, null, () => changeRecordsForNotes(["Tab converted to two spaces"]))
        ]],
        ["Compatibility cleanup", [
          makeInspectorMetric("Bullets converted", result.stats.bulletsChanged, null, null, () => changeRecordsForNotes(["Line-start bullet converted"])),
          makeInspectorMetric("Emoji removed", result.stats.emojiRemoved, null, null, () => changeRecordsForCategory("emoji"), { severity: "warning", warningText: "May change meaning. Review output." }),
          makeInspectorMetric("Compatibility changes", result.stats.fullwidthChanged + result.stats.ligaturesChanged + result.stats.fractionsChanged, null, null, () => changeRecordsForNotes(["Fullwidth ASCII normalized", "Ligature expanded", "Single-character fraction converted"])),
          makeInspectorMetric("Superscripts/subscripts flattened", result.stats.superSubChanged, null, null, () => changeRecordsForNotes(["Superscript/subscript flattened"]), { severity: "warning", warningText: "May change meaning. Review output." }),
          makeInspectorMetric("Strict ASCII changes", result.stats.strictAsciiChanged, null, null, () => changeRecordsForCategory("strict-ascii"), { severity: "warning", warningText: "May change meaning. Review output." })
        ]],
        ["Structure detected", [
          makeInspectorMetric("Lists detected", result.doc.meta.lists || 0, null, (block) => block.type === "ul" || block.type === "ol"),
          makeInspectorMetric("List items", result.doc.meta.listItems || 0, null, (block) => block.type === "ul" || block.type === "ol")
        ]]
      ];
      groups.forEach(([title, entries]) => appendInspectorSection(title, entries));

      const reviewEntries = reviewRecords(result).length
        ? reviewRecords(result).slice(0, 30).map((record) => ({ type: "review", record }))
        : [makeInspectorNote("No suspicious characters remaining.")];
      if (reviewRecords(result).length > 30) reviewEntries.push(makeInspectorNote(`...and ${reviewRecords(result).length - 30} more review records.`));
      appendInspectorSection("Still needs review", reviewEntries, { compact: true });

      const changeEntries = result.changes.length
        ? result.changes.slice(0, 80).map((change) => ({ type: "change", change }))
        : [makeInspectorNote("No character changes made.")];
      if (result.changes.length > 80) changeEntries.push(makeInspectorNote(`...and ${result.changes.length - 80} more grouped change records.`));
      const sourceMeta = inputDoc.meta || {};
      appendInspectorSection("Technical details", [
        makeInspectorMetric("Characters in", inputChars),
        makeInspectorMetric("Characters out", result.cleanText.length),
        makeInspectorNote(`Clipboard source: ${sourceMeta.source || "manual"}`),
        makeInspectorNote(`Clipboard HTML available: ${sourceMeta.htmlAvailable ? "yes" : "no"}`),
        makeInspectorNote(`Clipboard plain text available: ${sourceMeta.plainAvailable ? "yes" : "no"}`),
        makeInspectorNote(`Clipboard API: ${navigator.clipboard ? "available" : "unavailable"}`),
        makeInspectorNote(`Rich clipboard write: ${global.ClipboardItem ? "available" : "unavailable"}`),
        ...changeEntries
      ], { compact: true });
    }

    function appendDiffLine(container, marker, text, className) {
      const row = document.createElement("div");
      row.className = `diff-line ${className}`;
      const mark = document.createElement("span");
      mark.className = "diff-marker";
      mark.textContent = marker;
      const body = document.createElement("span");
      body.textContent = text || "";
      if (!text) body.className = "diff-empty";
      row.append(mark, body);
      container.appendChild(row);
    }

    function compactDiffLines(beforeText, afterText, options) {
      const before = String(beforeText || "").replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
      const after = String(afterText || "").replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
      const max = Math.max(before.length, after.length);
      const rows = [];
      let changed = 0;
      for (let index = 0; index < max; index += 1) {
        const left = before[index] == null ? "" : before[index];
        const right = after[index] == null ? "" : after[index];
        if (left === right) {
          if (left && rows.length < 8) rows.push({ type: "context", text: left });
          continue;
        }
        changed += 1;
        rows.push({ type: "remove", text: left });
        rows.push({ type: "add", text: right });
      }
      return {
        changed,
        rows: rows.map((row) => Object.assign({}, row, {
          text: options && options.showInvisibles ? visualizeInvisibles(row.text) : row.text
        }))
      };
    }

    function renderDiagnosticDiffView(result, options) {
      outputEditor.innerHTML = "";
      const beforeText = docToPlainText(inputDoc, "plain");
      const diff = compactDiffLines(beforeText, result.cleanText, options);
      if (!diff.rows.length) {
        appendDiffLine(outputEditor, " ", result.cleanText || "No output yet.", "diff-context");
        return;
      }
      diff.rows.slice(0, 80).forEach((row) => {
        const marker = row.type === "remove" ? "−" : (row.type === "add" ? "+" : " ");
        const className = row.type === "remove" ? "diff-remove" : (row.type === "add" ? "diff-add" : "diff-context");
        appendDiffLine(outputEditor, marker, row.text, className);
      });
      if (diff.rows.length > 80) appendDiffLine(outputEditor, "…", `${diff.rows.length - 80} more diff rows hidden`, "diff-context");
    }

    function replacementTitle(source, target) {
      if (!source) return `Inserted ${getCodeLabelForChangeValue(target)}`;
      if (!target) return `Removed ${getCodeLabelForChangeValue(source)}`;
      return `${getCodeLabelForChangeValue(source)} -> ${getCodeLabelForChangeValue(target)}`;
    }

    function diffTextParts(beforeText, afterText) {
      const a = Array.from(beforeText || "");
      const b = Array.from(afterText || "");
      if (a.length * b.length > 120000) {
        const prefix = (() => { let i = 0; while (i < a.length && i < b.length && a[i] === b[i]) i += 1; return i; })();
        let as = a.length, bs = b.length;
        while (as > prefix && bs > prefix && a[as - 1] === b[bs - 1]) { as -= 1; bs -= 1; }
        return [
          prefix ? { type: "equal", text: b.slice(0, prefix).join("") } : null,
          (a.length !== as || b.length !== bs) ? { type: b.slice(prefix, bs).length ? "replace" : "remove", source: a.slice(prefix, as).join(""), text: b.slice(prefix, bs).join("") } : null,
          bs < b.length ? { type: "equal", text: b.slice(bs).join("") } : null
        ].filter(Boolean);
      }
      const dp = Array.from({ length: a.length + 1 }, () => Array(b.length + 1).fill(0));
      for (let i = a.length - 1; i >= 0; i -= 1) {
        for (let j = b.length - 1; j >= 0; j -= 1) dp[i][j] = a[i] === b[j] ? 1 + dp[i + 1][j + 1] : Math.max(dp[i + 1][j], dp[i][j + 1]);
      }
      const raw = [];
      let i = 0, j = 0;
      while (i < a.length || j < b.length) {
        if (i < a.length && j < b.length && a[i] === b[j]) { raw.push({ type: "equal", text: b[j++] }); i += 1; }
        else if (j < b.length && (i >= a.length || dp[i][j + 1] > dp[i + 1][j])) raw.push({ type: "add", text: b[j++] });
        else raw.push({ type: "remove", source: a[i++] });
      }
      const parts = [];
      function push(part) {
        const last = parts[parts.length - 1];
        if (last && last.type === part.type) {
          last.text = (last.text || "") + (part.text || "");
          last.source = (last.source || "") + (part.source || "");
        } else parts.push(Object.assign({}, part));
      }
      for (let k = 0; k < raw.length; k += 1) {
        if (raw[k].type === "remove" && raw[k + 1] && raw[k + 1].type === "add") { push({ type: "replace", source: raw[k].source, text: raw[k + 1].text }); k += 1; }
        else if (raw[k].type === "add") push({ type: "replace", source: "", text: raw[k].text });
        else push(raw[k]);
      }
      return parts;
    }

    function appendAnnotatedText(container, beforeText, afterText, options) {
      diffTextParts(beforeText, afterText).forEach((part) => {
        if (part.type === "equal") container.appendChild(document.createTextNode(options && options.showInvisibles ? visualizeInvisibles(part.text) : part.text));
        else if (part.type === "remove") {
          // Pure removals are shown on the source/input side in diff mode so the
          // output text keeps the same footprint as preview text.
        } else {
          const span = document.createElement("span");
          span.className = "char-change";
          span.title = replacementTitle(part.source, part.text);
          span.setAttribute("aria-label", span.title);
          span.textContent = options && options.showInvisibles ? visualizeInvisibles(part.text) : part.text;
          container.appendChild(span);
        }
      });
    }

    function destinationPreservesLists(options) {
      if (options.destination === "gmail") return !options.gmailListsAsHyphenLines;
      if (options.destination === "googleDocs" || options.destination === "word" || options.destination === "outlook") return Boolean(options.structuredListsForDocs || options.destination === "outlook");
      return false;
    }

    function appendListPreview(parent, inputBlock, outputBlock, options) {
      const list = document.createElement(outputBlock.type === "ol" ? "ol" : "ul");
      list.className = "diff-block list";
      (outputBlock.items || []).forEach((item, index) => {
        const li = document.createElement("li");
        const before = inputBlock && inputBlock.items && inputBlock.items[index] ? inputBlock.items[index].text || "" : "";
        appendAnnotatedText(li, before, item.text || "", options);
        list.appendChild(li);
      });
      parent.appendChild(list);
    }

    function appendSourceAnnotatedText(container, beforeText, afterText, options, highlighter, baseSourceOffset, baseOutputOffset) {
      let sourceCursor = Number.isInteger(baseSourceOffset) ? baseSourceOffset : 0;
      let outputCursor = Number.isInteger(baseOutputOffset) ? baseOutputOffset : 0;
      diffTextParts(beforeText, afterText).forEach((rawPart) => {
        const sourceLength = rawPart.type === "equal" ? String(rawPart.text || "").length : String(rawPart.source || "").length;
        const outputLength = rawPart.type === "remove" ? 0 : String(rawPart.text || "").length;
        const part = Object.assign({}, rawPart, {
          sourceStart: sourceCursor,
          sourceEnd: sourceCursor + sourceLength,
          outputStart: outputCursor,
          outputEnd: outputCursor + outputLength
        });
        sourceCursor += sourceLength;
        outputCursor += outputLength;
        if (part.type === "equal") {
          if (options && options.showInvisibles) appendVisualizedText(container, part.text);
          else container.appendChild(document.createTextNode(part.text));
        } else if (part.type === "remove" || part.type === "replace") {
          const shouldHighlight = highlighter && highlighter.matches(part);
          if (shouldHighlight) {
            const markerLabel = highlighter && highlighter.markerLabel ? highlighter.markerLabel(part) : "";
            const hiddenOnlyRemoval = part.type === "remove" && Array.from(part.source || "").every((char) => regexMatchesText(REGEX.hidden, char)) && !part.text;
            const span = document.createElement("span");
            span.className = "source-change";
            span.title = markerLabel ? `${markerLabel}: ${replacementTitle(part.source, part.text || "")}` : replacementTitle(part.source, part.text || "");
            span.setAttribute("aria-label", span.title);
            if (markerLabel) appendMarkerBadge(span, markerLabel, span.title);
            else if (hiddenOnlyRemoval || (options && (options.showInvisibles || part.type === "remove" || !part.text))) appendVisualizedText(span, part.source);
            else span.textContent = part.source;
            container.appendChild(span);
          } else {
            if (options && options.showInvisibles) appendVisualizedText(container, part.source);
            else container.appendChild(document.createTextNode(part.source));
          }
        }
      });
    }

    function renderInputDiffHighlights(inputModel, outputModel, options, matcher, blockMatcher, markerLabel) {
      const highlighter = { matches: matcher || (() => true), markerLabel: markerLabel || (() => "") };
      let sourceOffset = 0;
      let outputOffset = 0;
      const advanceOffsets = (sourceText, outputText) => {
        const offsets = { source: sourceOffset, output: outputOffset };
        sourceOffset += String(sourceText || "").length + 1;
        outputOffset += String(outputText || "").length + 1;
        return offsets;
      };
      suppressInputEvent = true;
      inputEditor.innerHTML = "";
      (inputModel.blocks || []).forEach((block, index) => {
        const outputBlock = (outputModel.blocks || [])[index];
        if (block.type === "blank") {
          const blankPart = { type: "remove", source: "\n", text: "", sourceStart: sourceOffset, sourceEnd: sourceOffset + 1, outputStart: outputOffset, outputEnd: outputOffset };
          if (highlighter.matches(blankPart)) {
            const span = document.createElement("span");
            span.className = "source-change";
            const marker = highlighter.markerLabel(blankPart) || "EXTRA BLANK LINE";
            appendMarkerBadge(span, marker, marker);
            inputEditor.appendChild(span);
          }
          sourceOffset += 1;
          outputOffset += 1;
          inputEditor.appendChild(document.createElement("br"));
          return;
        }
        if (block.type === "paragraph") {
          const outputText = outputBlock && outputBlock.type === "paragraph" ? outputBlock.text || "" : "";
          const offsets = advanceOffsets(block.text || "", outputText);
          const div = document.createElement("div");
          div.className = `editor-paragraph${blockMatcher && blockMatcher(block) ? " source-change" : ""}`;
          appendSourceAnnotatedText(div, block.text || "", outputText, options, highlighter, offsets.source, offsets.output);
          inputEditor.appendChild(div);
        } else if (block.type === "ul" || block.type === "ol") {
          const list = document.createElement(block.type);
          if (blockMatcher && blockMatcher(block)) list.className = "source-change";
          (block.items || []).forEach((item, itemIndex) => {
            const li = document.createElement("li");
            const outputItem = outputBlock && outputBlock.items ? outputBlock.items[itemIndex] : null;
            const outputText = outputItem ? outputItem.text || "" : "";
            const offsets = advanceOffsets(item.text || "", outputText);
            appendSourceAnnotatedText(li, item.text || "", outputText, options, highlighter, offsets.source, offsets.output);
            list.appendChild(li);
          });
          inputEditor.appendChild(list);
        }
      });
      inputEditor.dataset.showingInvisibles = options && options.showInvisibles ? "true" : "false";
      inputEditor.dataset.diffHighlight = "true";
      suppressInputEvent = false;
    }

    function renderCompactDiff(inputModel, outputModel, changeRecords, destinationProfile, options) {
      outputEditor.innerHTML = "";
      const blocks = outputModel.blocks || [];
      const contentIndexes = blocks.map((block, index) => {
        if (block.type === "paragraph" && (block.text || "").trim()) return index;
        if ((block.type === "ul" || block.type === "ol") && (block.items || []).length) return index;
        return -1;
      }).filter((index) => index >= 0);
      const lastContentIndex = contentIndexes.length ? contentIndexes[contentIndexes.length - 1] : -1;

      blocks.forEach((block, index) => {
        const inputBlock = (inputModel.blocks || [])[index];
        if (block.type === "blank") {
          const blank = document.createElement("div");
          blank.className = options.destination === "gmail" ? "gmail_default editor-paragraph gmail-line" : "editor-blank";
          if (options.destination === "gmail") blank.setAttribute("style", "font-family: verdana, sans-serif;");
          blank.appendChild(document.createElement("br"));
          outputEditor.appendChild(blank);
          return;
        }
        if (block.type === "paragraph") {
          const div = document.createElement("div");
          div.className = options.destination === "gmail" ? "gmail_default editor-paragraph gmail-line" : "editor-paragraph";
          if (options.destination === "gmail") div.setAttribute("style", "font-family: verdana, sans-serif;");
          appendAnnotatedText(div, inputBlock && inputBlock.type === "paragraph" ? inputBlock.text || "" : "", block.text || "", options);
          if (options.destination === "gmail" && index === lastContentIndex && (block.text || "").trim()) div.appendChild(document.createElement("br"));
          outputEditor.appendChild(div);
        } else if (block.type === "ul" || block.type === "ol") appendListPreview(outputEditor, inputBlock, block, options);
      });
    }

    function renderInputEditorForOptions(options) {
      const shouldVisualize = Boolean(options.showInvisibles);
      const isVisualized = inputEditor.dataset.showingInvisibles === "true";
      const hasDiffHighlight = inputEditor.dataset.diffHighlight === "true";
      if (!shouldVisualize && !isVisualized && !hasDiffHighlight) return;
      suppressInputEvent = true;
      renderDocInto(inputEditor, inputDoc, "input", "source", shouldVisualize ? options : {});
      inputEditor.dataset.showingInvisibles = shouldVisualize ? "true" : "false";
      inputEditor.dataset.diffHighlight = "false";
      suppressInputEvent = false;
    }

    function showRawInputEditor() {
      if (inputEditor.dataset.showingInvisibles !== "true" && inputEditor.dataset.diffHighlight !== "true") return;
      suppressInputEvent = true;
      renderDocInto(inputEditor, inputDoc, "input", "source", {});
      inputEditor.dataset.showingInvisibles = "false";
      inputEditor.dataset.diffHighlight = "false";
      suppressInputEvent = false;
    }

    function update() {
      if (!suppressInputEvent && inputEditor.dataset.showingInvisibles !== "true" && inputEditor.dataset.diffHighlight !== "true") inputDoc = parseEditorToDoc(inputEditor);
      refreshProfileUi();
      const options = getOptions();
      renderInputEditorForOptions(options);
      const destinationStyle = destinationStyleFromOptions(options);
      outputEditor.style.setProperty("--destination-font-family", destinationStyle.fontFamily);
      outputEditor.style.setProperty("--destination-font-size", destinationStyle.fontSize);
      outputEditor.style.setProperty("--gmail-font-family", destinationStyle.fontFamily);
      outputEditor.style.setProperty("--gmail-font-size", destinationStyle.fontSize);
      lastResult = sanitizeDoc(inputDoc, options);
      const showDiff = diffViewToggle ? diffViewToggle.checked : false;
      if (previewTab) previewTab.setAttribute("aria-selected", String(!showDiff));
      if (diffTab) diffTab.setAttribute("aria-selected", String(showDiff));
      if (showDiff) {
        outputEditor.classList.remove("diff-output", "compact-diff-output");
        renderInputDiffHighlights(inputDoc, lastResult.doc, options, () => true);
        renderCompactDiff(inputDoc, lastResult.doc, lastResult.changes, DESTINATIONS[destinationSelect.value], options);
      } else {
        outputEditor.classList.remove("diff-output", "compact-diff-output");
        renderDocInto(outputEditor, lastResult.doc, "output", destinationSelect.value, options);
        renderInputEditorForOptions(options);
      }
      renderInspector(lastResult);
      setStatus("");
    }

    function applyPresetAndProfile() {
      const preset = PRESETS[presetSelect.value] || PRESETS.standard;
      const profile = DESTINATIONS[destinationSelect.value] || DESTINATIONS.gmail;
      const before = currentOptionsFromUi(destinationSelect.value, presetSelect, optionInputs);
      const next = Object.assign({}, OPTION_DEFAULTS, preset, profile.overrides);
      applyOptionsToUi(next);
      if (presetDescription) presetDescription.textContent = PRESET_DESCRIPTIONS[presetSelect.value] || "";
      refreshStyleControls();
      update();
    }

    const OPTION_TAGS = Object.freeze({
      detectLists: "clipboard lists html plain text structure nested",
      preferHtmlPaste: "clipboard html rich paste intake",
      removeHidden: "hidden invisible zero width directional unicode marks",
      normalizeLineEndings: "line breaks crlf newline",
      normalizeSeparators: "unicode separators paragraphs lines",
      normalizeSpaces: "spaces nbsp thin no-break whitespace",
      trimTrailingSpaces: "spaces line endings trailing whitespace",
      limitBlankLines: "blank lines paragraphs spacing",
      collapseRepeatedSpaces: "spaces whitespace repeated",
      convertTabs: "tabs indentation spaces",
      normalizeQuotes: "quotes smart curly keyboard punctuation",
      preservePrimeMarks: "prime feet inches measurements quotes",
      normalizeDashes: "dash hyphen en em punctuation",
      normalizeEllipsis: "ellipsis dots leaders punctuation",
      normalizeFullwidth: "fullwidth ascii compatibility",
      expandLigatures: "ligatures typography compatibility",
      normalizeFractions: "fractions unicode compatibility",
      normalizeSuperscriptsSubscripts: "superscript subscript math compatibility",
      removeEmoji: "emoji pictographic symbols removal",
      smartQuotes: "quotes smart typography documents",
      smartDashes: "dash em typography documents",
      numericRangesToEnDash: "ranges numbers en dash typography",
      smartEllipsis: "ellipsis typography documents",
      smartFractions: "fractions typography documents",
      measurementPrimes: "feet inches prime measurements typography",
      structuredListsForDocs: "lists html docs word outlook semantic",
      gmailListsAsHyphenLines: "gmail lists hyphen plain text",
      strictAscii: "ascii strict non-ascii compatibility",
      foldAccents: "accents ascii diacritics",
      replaceSymbolsAscii: "symbols ascii arrows copyright trademark",
      showInvisibles: "hidden invisible preview diagnostics"
    });

    function filterAdvancedSettings() {
      if (!advancedSettingsSearch) return;
      const query = advancedSettingsSearch.value.trim().toLowerCase();
      let visible = 0;
      optionInputs.forEach((input) => {
        const item = input.closest(".setting-item") || input.closest("label");
        if (!item) return;
        const key = input.dataset.option || "";
        const haystack = [key, item.textContent, OPTION_EXAMPLES[key], OPTION_TAGS[key]].join(" ").toLowerCase();
        const match = !query || haystack.includes(query);
        item.classList.toggle("setting-filter-hidden", !match);
        if (match) visible += 1;
      });
      Array.from(document.querySelectorAll(".advanced-settings details")).forEach((group) => {
        if (group.id === "advancedSettings") return;
        const hasMatch = Boolean(group.querySelector(".setting-item:not(.setting-filter-hidden), label:not(.setting-filter-hidden)"));
        group.classList.toggle("setting-filter-hidden", !hasMatch && Boolean(query));
        if (query && hasMatch) group.open = true;
      });
      if (advancedSettingsSearchStatus) advancedSettingsSearchStatus.textContent = query ? `${visible} matching settings` : "";
    }


    function escapeHtml(value) {
      return String(value).replace(/[&<>"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[char]));
    }

    const USER_EXAMPLES = Object.freeze([
      { name: "Smart quotes and dashes", input: "“Hello” — 1–5...", destination: "plain", options: { normalizeQuotes: true, normalizeDashes: true, normalizeEllipsis: true }, expected: '"Hello" -- 1-5...' },
      { name: "Nested lists", input: "- parent\n  - child\n- sibling", destination: "markdown", doc: true, expected: "- parent\n  - child\n- sibling" },
      { name: "Emoji removal", input: "Launch 🚀 and smile 😀", destination: "plain", options: { removeEmoji: true, collapseRepeatedSpaces: true }, expected: "Launch and smile" },
      { name: "Hidden characters", input: "Zero\u200Bwidth\u200E mark", destination: "plain", options: { removeHidden: true }, expected: "Zerowidth mark" },
      { name: "Heavy emoji usage", input: "🔥🔥 Ship it ✅✨", destination: "plain", options: { removeEmoji: true, collapseRepeatedSpaces: true }, expected: " Ship it" },
      { name: "Right-to-left text", input: "abc\u200F def", destination: "plain", options: { removeHidden: true }, expected: "abc def" },
      { name: "Superscripts and subscripts", input: "x² + H₂O", destination: "plain", options: { normalizeSuperscriptsSubscripts: true }, expected: "x2 + H2O" },
      { name: "Ligatures", input: "office ﬁle ﬂow", destination: "plain", options: { expandLigatures: true }, expected: "office file flow" },
      { name: "Mathematical symbols", input: "± × ÷ √", destination: "strictAscii", options: { strictAscii: true, replaceSymbolsAscii: true }, expected: "+/- x / " },
      { name: "Strict ASCII conversion", input: "Café — ™", destination: "strictAscii", options: { strictAscii: true, foldAccents: true, replaceSymbolsAscii: true, normalizeDashes: true }, expected: "Cafe -- TM" },
      { name: "Markdown lists", input: "- One\n- Two", destination: "markdown", doc: true, expected: "- One\n- Two" },
      { name: "Rich pasted lists", input: "<ul><li>One</li><li>Two</li></ul>", destination: "googleDocs", html: true, expected: "One\nTwo" },
      { name: "Code comment cleanup", input: "TODO — fix “quotes”\u200B", destination: "code", expected: 'TODO -- fix "quotes"' },
      { name: "Form-safe plain text", input: "Name:\tJane   Doe\n\n\nNotes", destination: "plain", expected: "Name: Jane   Doe\n\nNotes" }
    ]);

    function runExampleCase(example) {
      const options = Object.assign(buildOptions(example.destination || "plain"), example.options || {});
      if (example.html) return docToPlainText(sanitizeDoc(parseHtmlToDoc(example.input), options).doc, example.destination || "plain");
      if (example.doc) return docToPlainText(sanitizeDoc(parsePlainTextToDoc(example.input, true), options).doc, example.destination || "plain");
      return sanitize(example.input, options).cleanText;
    }

    function runUserExamples() {
      if (!userTestResults) return;
      userTestAnimation?.classList.remove("running");
      void userTestAnimation?.offsetWidth;
      userTestAnimation?.classList.add("running");
      userTestResults.innerHTML = "";
      USER_EXAMPLES.forEach((example, index) => {
        window.setTimeout(() => {
          const actual = runExampleCase(example);
          const passed = actual === example.expected;
          const li = document.createElement("li");
          li.className = `user-test-result ${passed ? "pass" : "fail"}`;
          li.innerHTML = `<div class="user-test-title"><strong>${escapeHtml(example.name)}</strong><span class="test-badge">${passed ? "PASS" : "FAIL"}</span></div><dl><dt>Input</dt><dd><code>${escapeHtml(example.input)}</code></dd><dt>Expected</dt><dd><code>${escapeHtml(example.expected)}</code></dd><dt>Actual</dt><dd><code>${escapeHtml(actual)}</code></dd></dl>`;
          userTestResults.appendChild(li);
          if (index === USER_EXAMPLES.length - 1) window.setTimeout(() => userTestAnimation?.classList.remove("running"), 900);
        }, index * 90);
      });
    }

    function parseClipboardEvent(event) {
      const options = getOptions();
      const clipboard = event.clipboardData || global.clipboardData;
      if (!clipboard) return null;
      const html = clipboard.getData("text/html");
      const plain = clipboard.getData("text/plain");
      let doc;
      if (options.preferHtmlPaste && html) {
        doc = parseHtmlToDoc(html);
        doc.meta.plainAvailable = Boolean(plain);
      } else {
        doc = parsePlainTextToDoc(plain || "", options.detectLists);
        doc.meta.htmlAvailable = Boolean(html);
      }
      doc.meta.plainAvailable = Boolean(plain);
      if (!doc.blocks.length && plain) doc = parsePlainTextToDoc(plain, options.detectLists);
      return doc;
    }

    inputEditor.addEventListener("beforeinput", () => {
      showRawInputEditor();
    });

    inputEditor.addEventListener("paste", (event) => {
      showRawInputEditor();
      const doc = parseClipboardEvent(event);
      if (!doc) return;
      event.preventDefault();
      suppressInputEvent = true;
      insertDocAtSelection(inputEditor, doc);
      suppressInputEvent = false;
      inputDoc = parseEditorToDoc(inputEditor);
      inputDoc.meta = Object.assign({}, doc.meta, countDocLists(inputDoc.blocks));
      setPasteStatus(doc.meta.source === "html" ? "Pasted from clipboard HTML." : "Pasted from clipboard plain text.");
      update();
    });

    inputEditor.addEventListener("input", () => {
      inputDoc = parseEditorToDoc(inputEditor);
      inputDoc.meta.source = "editor";
      setPasteStatus("Edited manually.");
      update();
    });

    optionInputs.forEach((input) => input.addEventListener("change", update));
    if (sampleSelect) sampleSelect.addEventListener("change", () => {
      const text = SAMPLE_TEXTS[sampleSelect.value];
      if (!text) return;
      const sampleText = text.replace(/\\n/g, "\n").replace(/\\t/g, "\t").replace(/\\u200B/g, "\u200B").replace(/\\u200E/g, "\u200E").replace(/\\u00A0/g, "\u00A0");
      inputDoc = parsePlainTextToDoc(sampleText, getOptions().detectLists);
      inputDoc.meta.source = "sample";
      suppressInputEvent = true;
      renderDocInto(inputEditor, inputDoc, "input", "source", {});
      inputEditor.dataset.showingInvisibles = "false";
      inputEditor.dataset.diffHighlight = "false";
      suppressInputEvent = false;
      setPasteStatus("Loaded sample text.");
      sampleSelect.value = "";
      update();
    });
    if (diffViewToggle) diffViewToggle.addEventListener("change", update);
    document.querySelectorAll(".setting-item").forEach((item) => {
      const input = item.querySelector("[data-option]");
      if (!input) return;
      item.addEventListener("click", (event) => {
        if (event.target === input) return;
        input.checked = !input.checked;
        input.dispatchEvent(new Event("change", { bubbles: true }));
      });
    });
    if (advancedSettingsButton && advancedSettings) advancedSettingsButton.addEventListener("click", () => { advancedSettings.open = true; });
    document.addEventListener("keydown", (event) => {
      if (event.key !== "Escape") return;
      if (advancedSettings) advancedSettings.open = false;
      clearAnyInspectorHighlight();
    });
    document.addEventListener("pointerdown", (event) => {
      if (!advancedSettings || !advancedSettings.open) return;
      const sheet = advancedSettings.closest(".advanced-sheet");
      if (sheet && !sheet.contains(event.target) && event.target !== advancedSettingsButton) advancedSettings.open = false;
    });
    if (previewTab && diffViewToggle) previewTab.addEventListener("click", () => { diffViewToggle.checked = false; update(); });
    if (diffTab && diffViewToggle && diffTab !== diffViewToggle) diffTab.addEventListener("click", () => { diffViewToggle.checked = true; update(); });
    function clearAdvancedSettingsSearch() {
      if (!advancedSettingsSearch) return;
      advancedSettingsSearch.value = "";
      filterAdvancedSettings();
      advancedSettingsSearch.focus();
    }
    if (advancedSettingsSearch) {
      advancedSettingsSearch.addEventListener("input", filterAdvancedSettings);
      advancedSettingsSearch.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && advancedSettingsSearch.value) {
          event.preventDefault();
          clearAdvancedSettingsSearch();
        }
      });
    }
    if (advancedSettingsClear) advancedSettingsClear.addEventListener("click", clearAdvancedSettingsSearch);
    if (runUserTestsButton) runUserTestsButton.addEventListener("click", runUserExamples);
    if (themeToggle) themeToggle.addEventListener("change", () => applyTheme(themeToggle.checked));
    presetSelect.addEventListener("change", applyPresetAndProfile);
    destinationSelect.addEventListener("change", applyPresetAndProfile);
    [destinationFontSelect, destinationSizeSelect].forEach((select) => {
      if (!select) return;
      select.addEventListener("change", () => {
        saveDestinationStylePreference();
        update();
      });
    });

    if (clearButton) {
      clearButton.addEventListener("click", () => {
        inputDoc = makeDoc([], { source: "manual" });
        inputEditor.innerHTML = "";
        update();
        setPasteStatus("Ready for paste.");
        inputEditor.focus();
      });
    }

    if (copyVisibleButton) {
      copyVisibleButton.addEventListener("click", async () => {
        const result = sanitizeDoc(inputDoc, getOptions());
        const visibleText = docToPlainText(result.doc, destinationSelect.value);
        try {
          await navigator.clipboard.writeText(visibleText);
          setStatus("Copied visible text.");
        } catch (error) {
          setStatus("Clipboard write failed; select the preview and copy manually.");
        }
      });
    }

    if (destinationCopyButton) {
      destinationCopyButton.addEventListener("click", async () => {
        const destination = destinationSelect.value;
        const options = getOptions();
        const result = sanitizeDoc(inputDoc, options);
        const visibleText = docToPlainText(result.doc, destination);

        if (destination === "gmail") {
          const html = buildGmailHtmlFromDoc(result.doc, options);
          try {
            if (!navigator.clipboard || !global.ClipboardItem) throw new Error("HTML clipboard unavailable");
            await navigator.clipboard.write([
              new ClipboardItem({
                "text/html": new Blob([html], { type: "text/html" })
              })
            ]);
            setStatus("Copied Gmail-compatible rendered HTML.");
          } catch (error) {
            try {
              await navigator.clipboard.writeText(visibleText);
              setStatus("HTML clipboard unavailable; copied visible text instead.");
            } catch (fallbackError) {
              setStatus("Clipboard write failed; select the preview and copy manually.");
            }
          }
          return;
        }

        if ((destination === "googleDocs" || destination === "word" || destination === "outlook") && options.structuredListsForDocs) {
          const html = buildDocumentHtmlFromDoc(result.doc, options);
          try {
            if (!navigator.clipboard || !global.ClipboardItem) throw new Error("HTML clipboard unavailable");
            await navigator.clipboard.write([
              new ClipboardItem({
                "text/html": new Blob([html], { type: "text/html" }),
                "text/plain": new Blob([visibleText], { type: "text/plain" })
              })
            ]);
            setStatus(`Copied structured content for ${DESTINATIONS[destination].label}.`);
          } catch (error) {
            try {
              await navigator.clipboard.writeText(visibleText);
              setStatus("HTML clipboard unavailable; copied visible text instead.");
            } catch (fallbackError) {
              setStatus("Clipboard write failed; select the preview and copy manually.");
            }
          }
          return;
        }

        try {
          await navigator.clipboard.writeText(visibleText);
          setStatus(`Copied for ${DESTINATIONS[destination].label}.`);
        } catch (error) {
          setStatus("Clipboard write failed; select the preview and copy manually.");
        }
      });
    }

    applyTheme(loadThemePreference() === "dark");
    refreshStyleControls();
    applyPresetAndProfile();
    filterAdvancedSettings();
  }

  const API = {
    startApp,
    renderDocInto,
    parseEditorToDoc,
    insertDocAtSelection,
    currentOptionsFromUi,
    visibleChar,
    visualizeInvisibles
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = API;
  } else {
    global.TextSanitizerUi = Object.assign(global.TextSanitizerUi || {}, API);
  }

})(typeof window !== "undefined" ? window : globalThis);
