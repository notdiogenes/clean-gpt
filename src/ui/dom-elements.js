(function (global) {
  "use strict";

  function getDomElements(root) {
    const doc = root || document;
    return {
      inputEditor: doc.getElementById("inputEditor"),
      outputEditor: doc.getElementById("outputEditor"),
      clearButton: doc.getElementById("clearButton"),
      destinationCopyButton: doc.getElementById("destinationCopyButton"),
      copyVisibleButton: doc.getElementById("copyVisibleButton"),
      destinationSelect: doc.getElementById("destinationSelect"),
      destinationNote: doc.getElementById("destinationNote"),
      destinationFontSelect: doc.getElementById("destinationFontSelect"),
      destinationSizeSelect: doc.getElementById("destinationSizeSelect"),
      destinationStyleNote: doc.getElementById("destinationStyleNote"),
      destinationSummary: doc.getElementById("destinationSummary"),
      presetDescription: doc.getElementById("presetDescription"),
      sampleSelect: doc.getElementById("sampleSelect"),
      presetSelect: doc.getElementById("presetSelect"),
      status: doc.getElementById("status"),
      pasteStatus: doc.getElementById("pasteStatus"),
      statsList: doc.getElementById("statsList"),
      changesList: doc.getElementById("changesList"),
      warningsList: doc.getElementById("warningsList"),
      nonAsciiList: doc.getElementById("nonAsciiList"),
      diffViewToggle: doc.getElementById("diffViewToggle"),
      previewTab: doc.getElementById("previewTab"),
      diffTab: doc.getElementById("diffTab") || doc.getElementById("diffViewToggle"),
      advancedSettingsButton: doc.getElementById("advancedSettingsButton"),
      advancedSettings: doc.getElementById("advancedSettings"),
      advancedSettingsSearch: doc.getElementById("advancedSettingsSearch"),
      advancedSettingsSearchStatus: doc.getElementById("advancedSettingsSearchStatus"),
      advancedSettingsClear: doc.getElementById("advancedSettingsClear"),
      runUserTestsButton: doc.getElementById("runUserTestsButton"),
      userTestResults: doc.getElementById("userTestResults"),
      userTestAnimation: doc.getElementById("userTestAnimation"),
      themeToggle: doc.getElementById("themeToggle"),
      optionInputs: Array.from(doc.querySelectorAll("[data-option]"))
    };
  }

  const API = { getDomElements };
  if (typeof module !== "undefined" && module.exports) module.exports = API;
  else global.TextSanitizerUi = Object.assign(global.TextSanitizerUi || {}, API);
})(typeof window !== "undefined" ? window : globalThis);
