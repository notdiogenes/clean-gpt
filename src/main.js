import "./ui/app-controller.js";

const { startApp, createDocumentAnalysisView } = globalThis.TextSanitizerUi || {};

if (typeof document !== "undefined" && typeof startApp === "function") {
  if (document.readyState !== "loading") {
    startApp();
    if (typeof createDocumentAnalysisView === "function") createDocumentAnalysisView(document);
  } else {
    document.addEventListener("DOMContentLoaded", () => {
      startApp();
      if (typeof createDocumentAnalysisView === "function") createDocumentAnalysisView(document);
    });
  }
}
