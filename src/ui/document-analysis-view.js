(function (global) {
  "use strict";

  const docxCore = typeof require === "function" ? require("../document/docx-extract") : global.TextSanitizerDocument;
  const analysisCore = typeof require === "function" ? require("../document/document-analysis") : global.TextSanitizerDocument;
  const { MAX_DOCX_BYTES, isDocxFile, extractDocxText } = docxCore;
  const { analyzeDocumentText } = analysisCore;

  function formatBytes(bytes) {
    if (!Number.isFinite(bytes)) return "Unknown";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  }

  function escapeText(value) { return String(value == null ? "" : value); }

  function createDocumentAnalysisView(doc) {
    const elements = {
      pasteView: doc.getElementById("pasteView"), documentView: doc.getElementById("documentView"), analyzeWordButton: doc.getElementById("analyzeWordButton"), backToPasteButton: doc.getElementById("backToPasteButton"),
      dropZone: doc.getElementById("documentDropZone"), fileInput: doc.getElementById("documentFileInput"), status: doc.getElementById("documentStatus"), metadata: doc.getElementById("documentMetadata"), report: doc.getElementById("documentReport"),
      summary: doc.getElementById("documentSummaryCards"), groups: doc.getElementById("documentIssueGroups"), extracted: doc.getElementById("documentExtractedPreview"), cleaned: doc.getElementById("documentCleanedPreview"),
      copy: doc.getElementById("copyDocumentCleanedButton"), download: doc.getElementById("downloadDocumentReportButton"), clear: doc.getElementById("clearDocumentButton")
    };
    let currentModel = null;

    function showView(name) {
      const documentMode = name === "document";
      if (elements.pasteView) elements.pasteView.hidden = documentMode;
      if (elements.documentView) elements.documentView.hidden = !documentMode;
      if (global.history && global.location) global.history.replaceState(null, "", documentMode ? "#document" : "#paste");
    }

    function setStatus(message) { if (elements.status) elements.status.textContent = message || ""; }

    function renderMetadata(file, status) {
      if (!elements.metadata) return;
      elements.metadata.hidden = false;
      const modified = file.lastModified ? new Date(file.lastModified).toLocaleString() : "Not available";
      elements.metadata.innerHTML = `<dt>File name</dt><dd>${escapeText(file.name)}</dd><dt>File size</dt><dd>${formatBytes(file.size)}</dd><dt>Last modified</dt><dd>${escapeText(modified)}</dd><dt>Extraction status</dt><dd>${escapeText(status)}</dd>`;
    }

    function renderReport(model) {
      const analysis = model.analysisResults;
      elements.report.hidden = false;
      elements.summary.innerHTML = "";
      [["Total characters", analysis.characterCount], ["Total words", analysis.wordCount], ["Paragraph count", analysis.paragraphCount], ["Total issues found", analysis.totalIssues], ["Highest-volume issue type", analysis.highestVolumeIssueType]].forEach(([label, value]) => {
        const card = doc.createElement("div"); card.className = "summary-card"; card.innerHTML = `<span>${label}</span><strong>${value}</strong>`; elements.summary.appendChild(card);
      });
      elements.groups.innerHTML = "";
      analysis.issueGroups.forEach((group) => {
        const section = doc.createElement("section"); section.className = "issue-group";
        const examples = group.examples.length ? `<ul>${group.examples.map((issue) => `<li><strong>${escapeText(issue.label)}</strong>: ${escapeText(issue.codePoint || issue.text)} <span>Paragraph ${issue.paragraphIndex}, approx. offset ${issue.location}</span></li>`).join("")}</ul>` : "<p>No issues found.</p>";
        section.innerHTML = `<h4>${escapeText(group.title)} <span>${group.count}</span></h4><p>${escapeText(group.explanation)}</p>${examples}`;
        elements.groups.appendChild(section);
      });
      elements.extracted.textContent = model.rawText;
      elements.cleaned.textContent = analysis.cleanedText;
    }

    async function handleFile(file) {
      if (!file) return;
      currentModel = null;
      if (!isDocxFile(file)) { setStatus("Unsupported file type. Please choose a .docx file."); renderMetadata(file, "Unsupported file type"); return; }
      if (file.size > MAX_DOCX_BYTES) { setStatus("File too large. Please choose a .docx file under 20 MB."); renderMetadata(file, "File too large"); return; }
      try {
        setStatus("Extracting document text..."); renderMetadata(file, "Extracting");
        const model = await extractDocxText(file);
        model.analysisResults = analyzeDocumentText(model);
        currentModel = model;
        renderMetadata(file, "Extracted and analyzed");
        renderReport(model);
        setStatus("Document analysis ready.");
      } catch (error) {
        const message = error && error.code === "empty-document" ? "Empty document." : (error && error.message) || "Could not parse document.";
        setStatus(message);
        renderMetadata(file, message);
        if (elements.report) elements.report.hidden = true;
      }
    }

    function clear() {
      currentModel = null;
      if (elements.fileInput) elements.fileInput.value = "";
      if (elements.metadata) { elements.metadata.hidden = true; elements.metadata.innerHTML = ""; }
      if (elements.report) elements.report.hidden = true;
      setStatus("No file selected.");
    }

    elements.analyzeWordButton?.addEventListener("click", () => showView("document"));
    elements.backToPasteButton?.addEventListener("click", () => showView("paste"));
    elements.fileInput?.addEventListener("change", () => handleFile(elements.fileInput.files && elements.fileInput.files[0]));
    elements.dropZone?.addEventListener("click", (event) => { if (event.target !== elements.fileInput) elements.fileInput?.click(); });
    elements.dropZone?.addEventListener("dragover", (event) => { event.preventDefault(); elements.dropZone.classList.add("is-dragover"); });
    elements.dropZone?.addEventListener("dragleave", () => elements.dropZone.classList.remove("is-dragover"));
    elements.dropZone?.addEventListener("drop", (event) => { event.preventDefault(); elements.dropZone.classList.remove("is-dragover"); handleFile(event.dataTransfer?.files?.[0]); });
    elements.copy?.addEventListener("click", async () => {
      if (!currentModel) return;
      try { await navigator.clipboard.writeText(currentModel.analysisResults.cleanedText); setStatus("Copied cleaned text."); }
      catch (error) { setStatus("Clipboard write failed; select the cleaned preview and copy manually."); }
    });
    elements.download?.addEventListener("click", () => {
      if (!currentModel) return;
      const blob = new Blob([JSON.stringify(currentModel, null, 2)], { type: "application/json" });
      const a = doc.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `${currentModel.fileName.replace(/\.docx$/i, "")}-analysis.json`; a.click(); URL.revokeObjectURL(a.href);
    });
    elements.clear?.addEventListener("click", clear);
    if (global.location && global.location.hash === "#document") showView("document");
    return { showView, handleFile, clear, getCurrentModel: () => currentModel };
  }

  const API = { createDocumentAnalysisView, formatBytes };
  if (typeof module !== "undefined" && module.exports) module.exports = API;
  else global.TextSanitizerUi = Object.assign(global.TextSanitizerUi || {}, API);
})(typeof window !== "undefined" ? window : globalThis);
