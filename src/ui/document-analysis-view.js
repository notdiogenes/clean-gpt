(function (global) {
  "use strict";

  const docxCore = typeof require === "function" ? require("../document/docx-extract") : global.TextSanitizerDocument;
  const analysisCore = typeof require === "function" ? require("../document/document-analysis") : global.TextSanitizerDocument;
  const { MAX_DOCX_BYTES, isDocxFile, extractDocxText } = docxCore;
  const { analyzeDocumentText, GROUPS } = analysisCore;

  function formatBytes(bytes) {
    if (!Number.isFinite(bytes)) return "Unknown";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  }

  function escapeText(value) { return String(value == null ? "" : value); }
  function checksumText(text) { return Array.from(String(text || "")).reduce((sum, char) => (sum + char.codePointAt(0)) % 1000000007, 0); }

  function createReviewState(model) {
    const issues = (model.analysisResults.issues || []).map((issue) => Object.assign({ status: "open" }, issue));
    return { issues, selectedIssueId: null, filters: { status: "all", type: "all", hideLow: false }, cleanedText: model.rawText };
  }

  function issueExplanation(issue) {
    const map = {
      hidden: "This invisible formatting character can alter cursor movement or rendered text.",
      whitespace: "This spacing pattern may paste unpredictably or create extra visual gaps.",
      punctuation: "This punctuation can be normalized for plain-text compatibility.",
      compatibility: "This character may not survive every destination or workflow.",
      nonAscii: "This non-ASCII character may need review for strict systems.",
      warnings: "This item describes a limitation of the text-only analysis."
    };
    return map[issue.group] || "Review this issue and decide whether to apply the proposed fix.";
  }

  function applyIssuePatches(rawText, issues) {
    const applied = issues.filter((issue) => issue.status === "applied" && issue.start < issue.end).sort((a, b) => a.start - b.start || b.end - a.end);
    let cursor = 0;
    let output = "";
    applied.forEach((issue) => {
      if (issue.start < cursor) return;
      output += rawText.slice(cursor, issue.start) + (issue.replacement == null ? "" : issue.replacement);
      cursor = issue.end;
    });
    return output + rawText.slice(cursor);
  }

  function createDocumentAnalysisView(doc) {
    const elements = {
      pasteView: doc.getElementById("pasteView"), documentView: doc.getElementById("documentView"), analyzeWordButton: doc.getElementById("analyzeWordButton"), backToPasteButton: doc.getElementById("backToPasteButton"),
      dropZone: doc.getElementById("documentDropZone"), fileInput: doc.getElementById("documentFileInput"), status: doc.getElementById("documentStatus"), metadata: doc.getElementById("documentMetadata"), report: doc.getElementById("documentReport"),
      summary: doc.getElementById("documentSummaryCards"), groups: doc.getElementById("documentIssueGroups"), extracted: doc.getElementById("documentExtractedPreview"), cleaned: doc.getElementById("documentCleanedPreview"),
      sidebar: doc.getElementById("documentIssueSidebar"), details: doc.getElementById("documentIssueDetails"), filterStatus: doc.getElementById("documentIssueStatusFilter"), filterType: doc.getElementById("documentIssueTypeFilter"), hideLow: doc.getElementById("documentHideLowSeverity"),
      copy: doc.getElementById("copyDocumentCleanedButton"), downloadText: doc.getElementById("downloadDocumentTextButton"), download: doc.getElementById("downloadDocumentReportButton"), clear: doc.getElementById("clearDocumentButton")
    };
    let currentModel = null;
    let review = null;

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

    function counts() {
      const issues = review ? review.issues : [];
      return { total: issues.length, open: issues.filter((i) => i.status === "open").length, applied: issues.filter((i) => i.status === "applied").length, ignored: issues.filter((i) => i.status === "ignored").length, types: new Set(issues.map((i) => i.group)).size };
    }

    function filteredIssues() {
      if (!review) return [];
      return review.issues.filter((issue) => (review.filters.status === "all" || issue.status === review.filters.status) && (review.filters.type === "all" || issue.group === review.filters.type) && !(review.filters.hideLow && issue.severity === "low"));
    }

    function renderSummary() {
      const c = counts();
      elements.summary.innerHTML = "";
      [["Total issues", c.total], ["Open issues", c.open], ["Applied fixes", c.applied], ["Ignored issues", c.ignored], ["Issue types found", c.types]].forEach(([label, value]) => {
        const card = doc.createElement("div"); card.className = "summary-card"; card.innerHTML = `<span>${label}</span><strong>${value}</strong>`; elements.summary.appendChild(card);
      });
    }

    function renderHighlights() {
      const raw = currentModel.rawText;
      const sorted = review.issues.filter((i) => i.start < i.end).sort((a, b) => a.start - b.start || b.end - a.end);
      elements.extracted.innerHTML = "";
      let cursor = 0;
      sorted.forEach((issue) => {
        if (issue.start < cursor) return;
        elements.extracted.append(doc.createTextNode(raw.slice(cursor, issue.start)));
        const span = doc.createElement("span");
        span.className = `issue-highlight issue-${issue.group} status-${issue.status}${issue.id === review.selectedIssueId ? " is-selected" : ""}`;
        span.dataset.issueId = issue.id;
        span.tabIndex = 0;
        span.textContent = raw.slice(issue.start, issue.end);
        span.title = `${issue.type}: ${issue.label}`;
        elements.extracted.append(span);
        cursor = issue.end;
      });
      elements.extracted.append(doc.createTextNode(raw.slice(cursor)));
    }

    function renderSidebar() {
      elements.sidebar.innerHTML = "";
      const visible = filteredIssues();
      GROUPS.forEach((group) => {
        const groupIssues = visible.filter((issue) => issue.group === group.id);
        if (!groupIssues.length) return;
        const section = doc.createElement("section"); section.className = "issue-group";
        section.innerHTML = `<h4>${escapeText(group.title)} <span>${groupIssues.length}</span></h4>`;
        const actions = doc.createElement("div"); actions.className = "issue-group-actions";
        actions.innerHTML = `<button type="button" data-apply-type="${group.id}">Apply all</button><button type="button" data-ignore-type="${group.id}">Ignore all</button>`;
        section.appendChild(actions);
        groupIssues.forEach((issue) => {
          const row = doc.createElement("button"); row.type = "button"; row.className = `issue-row status-${issue.status}${issue.id === review.selectedIssueId ? " is-selected" : ""}`; row.dataset.issueId = issue.id;
          row.innerHTML = `<strong>${escapeText(issue.type)}</strong><span>${escapeText(issue.shortLabel || issue.label)} · Paragraph ${issue.paragraphIndex}</span><small>${escapeText(issue.replacement === issue.originalText ? "Review" : `Replace with ${issue.replacement || "∅"}`)} · ${issue.status}</small>`;
          section.appendChild(row);
        });
        elements.sidebar.appendChild(section);
      });
      if (!elements.sidebar.children.length) elements.sidebar.innerHTML = '<p class="compact-note">No issues match the current filters.</p>';
    }

    function selectedIssue() { return review && review.issues.find((issue) => issue.id === review.selectedIssueId); }
    function paragraphContext(issue) { return (currentModel.paragraphs || [currentModel.rawText])[Math.max(0, issue.paragraphIndex - 1)] || currentModel.rawText; }

    function renderDetails() {
      const issue = selectedIssue();
      if (!issue) { elements.details.innerHTML = '<p class="compact-note">Select an issue to review details and actions.</p>'; return; }
      elements.details.innerHTML = `<h3>Selected issue</h3><dl><dt>Type</dt><dd>${escapeText(issue.type)}</dd><dt>Explanation</dt><dd>${escapeText(issueExplanation(issue))}</dd><dt>Original value</dt><dd><code>${escapeText(issue.originalText || "∅")}</code></dd><dt>Unicode</dt><dd>${escapeText(issue.codePoint || "Not applicable")}</dd><dt>Proposed replacement</dt><dd><code>${escapeText(issue.replacement || "∅")}</code></dd><dt>Paragraph context</dt><dd>${escapeText(paragraphContext(issue))}</dd><dt>Status</dt><dd>${escapeText(issue.status)}</dd></dl><div class="document-actions"><button type="button" data-action="apply-selected" class="button primary-button">Apply</button><button type="button" data-action="ignore-selected" class="button ghost-button">Ignore</button></div>`;
    }

    function renderCleaned() { review.cleanedText = applyIssuePatches(currentModel.rawText, review.issues); elements.cleaned.textContent = review.cleanedText; }
    function renderAll() { renderSummary(); renderHighlights(); renderSidebar(); renderDetails(); renderCleaned(); }

    function selectIssue(id) {
      review.selectedIssueId = id;
      renderAll();
      const node = elements.extracted.querySelector(`[data-issue-id="${id}"]`);
      if (node) node.scrollIntoView({ block: "center", behavior: "smooth" });
    }
    function setIssueStatus(issue, status) { if (issue) issue.status = status; }
    function updateSelected(status) { setIssueStatus(selectedIssue(), status); renderAll(); }
    function updateType(group, status) { review.issues.filter((issue) => issue.group === group && issue.status === "open").forEach((issue) => setIssueStatus(issue, status)); renderAll(); }

    function renderReport(model) {
      elements.report.hidden = false;
      if (elements.filterType) elements.filterType.innerHTML = '<option value="all">All issue types</option>' + GROUPS.map((g) => `<option value="${g.id}">${g.title}</option>`).join("");
      renderAll();
    }

    async function handleFile(file) {
      if (!file) return;
      currentModel = null; review = null;
      if (!isDocxFile(file)) { setStatus("Unsupported file type. Please choose a .docx file."); renderMetadata(file, "Unsupported file type"); return; }
      if (file.size > MAX_DOCX_BYTES) { setStatus("File too large. Please choose a .docx file under 20 MB."); renderMetadata(file, "File too large"); return; }
      try {
        setStatus("Extracting document text..."); renderMetadata(file, "Extracting");
        const model = await extractDocxText(file);
        model.analysisResults = analyzeDocumentText(model);
        currentModel = model; review = createReviewState(model);
        renderMetadata(file, "Extracted and analyzed"); renderReport(model); setStatus("Document analysis ready.");
      } catch (error) {
        const message = error && error.code === "empty-document" ? "Empty document." : (error && error.message) || "Could not parse document.";
        setStatus(message); renderMetadata(file, message); if (elements.report) elements.report.hidden = true;
      }
    }

    function clear() {
      currentModel = null; review = null;
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
    elements.extracted?.addEventListener("click", (event) => { const node = event.target.closest("[data-issue-id]"); if (node) selectIssue(node.dataset.issueId); });
    elements.sidebar?.addEventListener("click", (event) => { const row = event.target.closest("[data-issue-id]"); if (row) selectIssue(row.dataset.issueId); const apply = event.target.closest("[data-apply-type]"); if (apply) updateType(apply.dataset.applyType, "applied"); const ignore = event.target.closest("[data-ignore-type]"); if (ignore) updateType(ignore.dataset.ignoreType, "ignored"); });
    elements.details?.addEventListener("click", (event) => { const action = event.target.dataset.action; if (action === "apply-selected") updateSelected("applied"); if (action === "ignore-selected") updateSelected("ignored"); });
    elements.filterStatus?.addEventListener("change", () => { if (!review) return; review.filters.status = elements.filterStatus.value; renderAll(); });
    elements.filterType?.addEventListener("change", () => { if (!review) return; review.filters.type = elements.filterType.value; renderAll(); });
    elements.hideLow?.addEventListener("change", () => { if (!review) return; review.filters.hideLow = elements.hideLow.checked; renderAll(); });
    doc.addEventListener("keydown", (event) => {
      if (!review || elements.documentView.hidden) return;
      const list = filteredIssues(); const index = Math.max(0, list.findIndex((issue) => issue.id === review.selectedIssueId));
      if (event.key === "ArrowDown") { event.preventDefault(); selectIssue(list[Math.min(list.length - 1, index + 1)]?.id); }
      if (event.key === "ArrowUp") { event.preventDefault(); selectIssue(list[Math.max(0, index - 1)]?.id); }
      if (event.key === "Enter") { event.preventDefault(); updateSelected("applied"); }
      if (event.key.toLowerCase() === "i") { event.preventDefault(); updateSelected("ignored"); }
      if (event.key === "Escape") { review.selectedIssueId = null; renderAll(); }
    });
    elements.copy?.addEventListener("click", async () => { if (!currentModel) return; try { await navigator.clipboard.writeText(review.cleanedText); setStatus("Copied cleaned text."); } catch (error) { setStatus("Clipboard write failed; select the cleaned preview and copy manually."); } });
    elements.downloadText?.addEventListener("click", () => { if (!currentModel) return; const blob = new Blob([review.cleanedText], { type: "text/plain" }); const a = doc.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `${currentModel.fileName.replace(/\.docx$/i, "")}-cleaned.txt`; a.click(); URL.revokeObjectURL(a.href); });
    elements.download?.addEventListener("click", () => { if (!currentModel) return; const report = { file: { name: currentModel.fileName, size: currentModel.fileSize }, issues: review.issues, appliedIssueIds: review.issues.filter((i) => i.status === "applied").map((i) => i.id), ignoredIssueIds: review.issues.filter((i) => i.status === "ignored").map((i) => i.id), finalCleanedTextLength: review.cleanedText.length, finalCleanedTextChecksum: checksumText(review.cleanedText) }; const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" }); const a = doc.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `${currentModel.fileName.replace(/\.docx$/i, "")}-analysis.json`; a.click(); URL.revokeObjectURL(a.href); });
    elements.clear?.addEventListener("click", clear);
    if (global.location && global.location.hash === "#document") showView("document");
    return { showView, handleFile, clear, getCurrentModel: () => currentModel, getReviewState: () => review };
  }

  const API = { createDocumentAnalysisView, createReviewState, applyIssuePatches, checksumText, formatBytes };
  if (typeof module !== "undefined" && module.exports) module.exports = API;
  else global.TextSanitizerUi = Object.assign(global.TextSanitizerUi || {}, API);
})(typeof window !== "undefined" ? window : globalThis);
