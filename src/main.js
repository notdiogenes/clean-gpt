import "./ui/app-controller.js";

const { startApp } = globalThis.TextSanitizerUi || {};

if (typeof document !== "undefined" && typeof startApp === "function") {
  if (document.readyState !== "loading") {
    startApp();
  } else {
    document.addEventListener("DOMContentLoaded", startApp);
  }
}
