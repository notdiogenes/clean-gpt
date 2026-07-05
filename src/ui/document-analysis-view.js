(function (global) {
  "use strict";

  const docxCore = typeof require === "function" ? require("../document/docx-extract") : global.TextSanitizerDocument;
  const analysisCore = typeof require === "function" ? require("../document/document-analysis") : global.TextSanitizerDocument;
  const formattedSerializer = typeof require === "function" ? require("../document/serialize-formatted-html") : global.TextSanitizerDocument;
  const { MAX_DOCX_BYTES, isDocxFile, extractDocxText } = docxCore;
  const { analyzeDocumentText, GROUPS, prioritizeIssueRanges } = analysisCore;
  const { serializeFormattedHtml } = formattedSerializer;

  function formatBytes(bytes) {
    if (!Number.isFinite(bytes)) return "Unknown";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  }

  function appendDefinitionItem(list, term, value, code) {
    const dt = docFor(list).createElement("dt");
    dt.textContent = term;
    const dd = docFor(list).createElement("dd");
    const valueNode = code ? docFor(list).createElement("code") : dd;
    valueNode.textContent = String(value == null ? "" : value);
    if (code) dd.appendChild(valueNode);
    list.append(dt, dd);
  }

  function docFor(node) { return node.ownerDocument || global.document; }

  function appendTextElement(parent, tagName, text, className) {
    const element = docFor(parent).createElement(tagName);
    if (className) element.className = className;
    element.textContent = String(text == null ? "" : text);
    parent.appendChild(element);
    return element;
  }
  function checksumText(text) { return Array.from(String(text || "")).reduce((sum, char) => (sum + char.codePointAt(0)) % 1000000007, 0); }

  function createReviewState(model) {
    const issues = (model.analysisResults.issues || []).map((issue) => Object.assign({ status: "open" }, issue));
    return { issues, selectedIssueId: null, previewMode: "markup", filters: { status: "all", type: "all", hideLow: false }, cleanedText: model.rawText };
  }

  function issueExplanation(issue) {
    const map = {
      hidden: "This invisible formatting character can alter cursor movement or rendered text.",
      whitespace: "This spacing pattern may paste unpredictably or create extra visual gaps.",
      punctuation: "This punctuation can be normalized for plain-text compatibility.",
      compatibility: "This character may not survive every destination or workflow.",
      nonAscii: "This non-ASCII character may need review for strict systems.",
      warnings: "This item describes a DOCX parsing or formatted-preview limitation."
    };
    return map[issue.group] || "Review this issue and decide whether to apply the proposed fix.";
  }

  function applyIssuePatches(rawText, issues) {
    const applied = prioritizeIssueRanges(issues.filter((issue) => issue.status === "applied" && issue.start < issue.end));
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
      summary: doc.getElementById("documentSummaryCards"), groups: doc.getElementById("documentIssueGroups"), formatted: doc.getElementById("documentFormattedPreview"), extracted: doc.getElementById("documentExtractedPreview"), cleaned: doc.getElementById("documentCleanedPreview"),
      sidebar: doc.getElementById("documentIssueSidebar"), details: doc.getElementById("documentIssueDetails"), filterStatus: doc.getElementById("documentIssueStatusFilter"), filterType: doc.getElementById("documentIssueTypeFilter"), hideLow: doc.getElementById("documentHideLowSeverity"),
      reviewPrevious: doc.getElementById("documentPreviousIssueButton"), reviewNext: doc.getElementById("documentNextIssueButton"), reviewApply: doc.getElementById("documentApplyIssueButton"), reviewIgnore: doc.getElementById("documentIgnoreIssueButton"), reviewApplySimilar: doc.getElementById("documentApplySimilarButton"), previewMode: doc.getElementById("documentPreviewModeSelect"), reviewProgress: doc.getElementById("documentReviewProgress"),
      copy: doc.getElementById("copyDocumentCleanedButton"), copyFormatted: doc.getElementById("copyDocumentFormattedButton"), downloadText: doc.getElementById("downloadDocumentTextButton"), download: doc.getElementById("downloadDocumentReportButton"), clear: doc.getElementById("clearDocumentButton")
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
      elements.metadata.textContent = "";
      appendDefinitionItem(elements.metadata, "File name", file.name);
      appendDefinitionItem(elements.metadata, "File size", formatBytes(file.size));
      appendDefinitionItem(elements.metadata, "Last modified", modified);
      appendDefinitionItem(elements.metadata, "Extraction status", status);
    }

    function counts() {
      const issues = review ? review.issues : [];
      return { total: issues.length, open: issues.filter((i) => i.status === "open").length, applied: issues.filter((i) => i.status === "applied").length, ignored: issues.filter((i) => i.status === "ignored").length, types: new Set(issues.map((i) => i.group)).size };
    }

    function visibleIssues() {
      if (!review) return [];
      return review.issues.filter((issue) => (review.filters.status === "all" || issue.status === review.filters.status) && (review.filters.type === "all" || issue.group === review.filters.type) && !(review.filters.hideLow && issue.severity === "low"));
    }

    function selectedIssueIndex() {
      if (!review) return -1;
      const list = visibleIssues();
      return list.findIndex((issue) => issue.id === review.selectedIssueId);
    }

    function reviewProgressLabel() {
      const list = visibleIssues();
      if (!list.length) return "Issue 0 of 0";
      const index = selectedIssueIndex();
      return `Issue ${index >= 0 ? index + 1 : 0} of ${list.length}`;
    }

    function filteredIssues() { return visibleIssues(); }

    function renderSummary() {
      const c = counts();
      elements.summary.innerHTML = "";
      [["Total issues", c.total], ["Open issues", c.open], ["Applied fixes", c.applied], ["Ignored issues", c.ignored], ["Issue types found", c.types]].forEach(([label, value]) => {
        const card = doc.createElement("div"); card.className = "summary-card";
        appendTextElement(card, "span", label);
        appendTextElement(card, "strong", value);
        elements.summary.appendChild(card);
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


    function formattedRunClasses(properties) {
      const classes = ["formatted-run"];
      if (properties && properties.bold) classes.push("is-bold");
      if (properties && properties.italic) classes.push("is-italic");
      if (properties && properties.underline) classes.push("is-underline");
      if (properties && properties.strike) classes.push("is-strike");
      if (properties && properties.highlight) classes.push("has-highlight");
      return classes;
    }

    function issuesForRange(start, end) {
      if (!review) return [];
      return review.issues.filter((issue) => (issue.start < end && issue.end > start) || (issue.start === issue.end && issue.start >= start && issue.start <= end)).sort((a, b) => a.start - b.start || b.end - a.end);
    }

    function isInvisibleIssueText(value) {
      return !String(value || "").replace(/[\u200B-\u200F\u202A-\u202E\u2060-\u206F\uFEFF\s]/g, "").length;
    }

    function issueTextForMode(issue, originalText) {
      const replacement = issue.replacement == null ? "" : String(issue.replacement);
      if (review.previewMode === "accepted" && issue.status === "applied") return replacement;
      return String(originalText || "");
    }

    function appendInvisibleMarker(parent, label) {
      const marker = doc.createElement("span");
      marker.className = "issue-invisible-marker";
      marker.textContent = label;
      parent.appendChild(marker);
    }

    function appendIssueMarker(parent, issues, originalText, properties) {
      const issueList = Array.isArray(issues) ? issues : [issues];
      const primary = issueList[0];
      const wrapper = doc.createElement("span");
      const classes = formattedRunClasses(properties);
      classes.push("inline-issue-review", "issue-highlight", `issue-${primary.group}`, `status-${primary.status}`, `preview-${review.previewMode}`);
      if (issueList.some((issue) => issue.id === review.selectedIssueId)) classes.push("is-selected");
      if (issueList.length > 1) classes.push("has-overlap");
      wrapper.className = classes.join(" ");
      wrapper.dataset.issueId = primary.id;
      wrapper.dataset.issueIds = issueList.map((issue) => issue.id).join(" ");
      wrapper.tabIndex = 0;
      wrapper.title = issueList.map((issue) => `${issue.type}: ${issue.label}`).join(" | ");

      if (review.previewMode === "markup") {
        const problem = doc.createElement(primary.status === "applied" ? "del" : "span");
        problem.className = "issue-original";
        if (originalText && !isInvisibleIssueText(originalText)) problem.textContent = originalText;
        else appendInvisibleMarker(problem, primary.group === "warnings" ? "warning" : "hidden");
        wrapper.appendChild(problem);
        issueList.forEach((issue) => {
          const replacement = issue.replacement == null ? "" : String(issue.replacement);
          if (replacement === String(originalText || "") && issueList.length === 1) return;
          const insertion = doc.createElement("ins");
          insertion.className = "issue-replacement";
          insertion.dataset.issueId = issue.id;
          if (replacement && !isInvisibleIssueText(replacement)) insertion.textContent = replacement;
          else appendInvisibleMarker(insertion, "remove");
          wrapper.appendChild(insertion);
        });
      } else {
        const text = issueTextForMode(primary, originalText);
        if (text && !isInvisibleIssueText(text)) wrapper.textContent = text;
        else appendInvisibleMarker(wrapper, primary.group === "warnings" ? "warning" : "hidden");
      }
      if (issueList.length > 1) {
        const badge = doc.createElement("sup");
        badge.className = "issue-overlap-badge";
        badge.textContent = `+${issueList.length - 1}`;
        wrapper.appendChild(badge);
      }
      parent.appendChild(wrapper);
    }

    function appendFormattedText(parent, text, start, end, properties) {
      const related = issuesForRange(start, end);
      const boundaries = new Set([start, end]);
      related.forEach((issue) => {
        boundaries.add(Math.max(start, Math.min(end, issue.start)));
        boundaries.add(Math.max(start, Math.min(end, issue.end)));
      });
      const points = Array.from(boundaries).sort((a, b) => a - b);
      for (let i = 0; i < points.length - 1; i += 1) {
        const partStart = points[i];
        const partEnd = points[i + 1];
        related.filter((issue) => issue.start === issue.end && issue.start === partStart).forEach((issue) => appendIssueMarker(parent, issue, "", properties));
        if (partStart >= partEnd) continue;
        const activeIssues = related.filter((item) => item.start < partEnd && item.end > partStart);
        if (activeIssues.length) {
          appendIssueMarker(parent, activeIssues, text.slice(partStart - start, partEnd - start), properties);
        } else {
          const span = doc.createElement("span");
          span.className = formattedRunClasses(properties).join(" ");
          span.textContent = text.slice(partStart - start, partEnd - start);
          parent.appendChild(span);
        }
      }
      related.filter((issue) => issue.start === issue.end && issue.start === end).forEach((issue) => appendIssueMarker(parent, issue, "", properties));
    }

    function appendFormattedRun(parent, run) {
      if (run.type === "lineBreak") { parent.appendChild(doc.createElement("br")); return; }
      appendFormattedText(parent, run.text || "", run.start || 0, run.end || run.start || 0, run.properties || {});
    }

    function renderFormattedDocument() {
      if (!elements.formatted) return;
      elements.formatted.innerHTML = "";
      const page = doc.createElement("div");
      page.className = "formatted-document-page";
      const blocks = currentModel && Array.isArray(currentModel.blocks) ? currentModel.blocks : [];
      if (!blocks.length) {
        const empty = doc.createElement("p");
        empty.className = "compact-note";
        empty.textContent = "No formatted document blocks were extracted.";
        page.appendChild(empty);
      }
      blocks.forEach((block) => {
        const node = doc.createElement(block.type === "table" ? "div" : "p");
        node.className = block.type === "table" ? "formatted-table-placeholder" : "formatted-paragraph";
        if (block.styleName) node.dataset.styleName = block.styleName;
        if (Array.isArray(block.runs) && block.runs.length) block.runs.forEach((run) => appendFormattedRun(node, run));
        else appendFormattedText(node, block.text || "", block.start || 0, block.end || block.start || 0, {});
        page.appendChild(node);
      });
      elements.formatted.appendChild(page);
    }

    function renderSidebar() {
      elements.sidebar.innerHTML = "";
      const visible = filteredIssues();
      GROUPS.forEach((group) => {
        const groupIssues = visible.filter((issue) => issue.group === group.id);
        if (!groupIssues.length) return;
        const section = doc.createElement("section"); section.className = "issue-group";
        const heading = doc.createElement("h4");
        heading.append(doc.createTextNode(group.title + " "));
        appendTextElement(heading, "span", groupIssues.length);
        section.appendChild(heading);
        const actions = doc.createElement("div"); actions.className = "issue-group-actions";
        const applyButton = doc.createElement("button");
        applyButton.type = "button";
        applyButton.dataset.applyType = group.id;
        applyButton.textContent = "Apply all";
        const ignoreButton = doc.createElement("button");
        ignoreButton.type = "button";
        ignoreButton.dataset.ignoreType = group.id;
        ignoreButton.textContent = "Ignore all";
        actions.append(applyButton, ignoreButton);
        section.appendChild(actions);
        groupIssues.forEach((issue) => {
          const row = doc.createElement("button"); row.type = "button"; row.className = `issue-row status-${issue.status}${issue.id === review.selectedIssueId ? " is-selected" : ""}`; row.dataset.issueId = issue.id;
          appendTextElement(row, "strong", issue.type);
          appendTextElement(row, "span", `${issue.shortLabel || issue.label} · Paragraph ${issue.paragraphIndex}`);
          appendTextElement(row, "small", `${issue.replacement === issue.originalText ? "Review" : `Replace with ${issue.replacement || "∅"}`} · ${issue.status}`);
          section.appendChild(row);
        });
        elements.sidebar.appendChild(section);
      });
      if (!elements.sidebar.children.length) appendTextElement(elements.sidebar, "p", "No issues match the current filters.", "compact-note");
    }

    function selectedIssue() { return review && review.issues.find((issue) => issue.id === review.selectedIssueId); }
    function paragraphContext(issue) { return (currentModel.paragraphs || [currentModel.rawText])[Math.max(0, issue.paragraphIndex - 1)] || currentModel.rawText; }

    function renderDetails() {
      const issue = selectedIssue();
      elements.details.textContent = "";
      if (!issue) { appendTextElement(elements.details, "p", "Select an issue to review details and actions.", "compact-note"); return; }
      appendTextElement(elements.details, "h3", "Selected issue");
      const list = doc.createElement("dl");
      appendDefinitionItem(list, "Type", issue.type);
      appendDefinitionItem(list, "Explanation", issueExplanation(issue));
      appendDefinitionItem(list, "Original value", issue.originalText || "∅", true);
      appendDefinitionItem(list, "Unicode", issue.codePoint || "Not applicable");
      appendDefinitionItem(list, "Proposed replacement", issue.replacement || "∅", true);
      appendDefinitionItem(list, "Paragraph context", paragraphContext(issue));
      appendDefinitionItem(list, "Status", issue.status);
      const actions = doc.createElement("div");
      actions.className = "document-actions";
      const apply = doc.createElement("button");
      apply.type = "button";
      apply.dataset.action = "apply-selected";
      apply.className = "button primary-button";
      apply.textContent = "Apply";
      const ignore = doc.createElement("button");
      ignore.type = "button";
      ignore.dataset.action = "ignore-selected";
      ignore.className = "button ghost-button";
      ignore.textContent = "Ignore";
      actions.append(apply, ignore);
      elements.details.append(list, actions);
    }

    function renderToolbar() {
      if (elements.reviewProgress) elements.reviewProgress.textContent = reviewProgressLabel();
      if (elements.previewMode) elements.previewMode.value = review ? review.previewMode : "markup";
      const hasSelection = Boolean(selectedIssue());
      [elements.reviewApply, elements.reviewIgnore, elements.reviewApplySimilar].forEach((button) => { if (button) button.disabled = !hasSelection; });
      const hasVisible = visibleIssues().length > 0;
      [elements.reviewPrevious, elements.reviewNext].forEach((button) => { if (button) button.disabled = !hasVisible; });
    }
    function renderCleaned() { review.cleanedText = applyIssuePatches(currentModel.rawText, review.issues); review.formattedHtml = serializeFormattedHtml(currentModel, review); elements.cleaned.textContent = review.cleanedText; }
    function renderAll() { renderSummary(); renderFormattedDocument(); renderHighlights(); renderSidebar(); renderDetails(); renderCleaned(); renderToolbar(); }

    function selectIssue(id) {
      if (!id) return;
      review.selectedIssueId = id;
      renderAll();
      const node = (elements.formatted && elements.formatted.querySelector(`[data-issue-id="${id}"]`)) || elements.extracted.querySelector(`[data-issue-id="${id}"]`);
      if (node) node.scrollIntoView({ block: "center", behavior: "smooth" });
    }
    function selectNextIssue() {
      const list = visibleIssues();
      if (!list.length) return;
      const index = selectedIssueIndex();
      selectIssue(list[index < 0 ? 0 : Math.min(list.length - 1, index + 1)].id);
    }
    function selectPreviousIssue() {
      const list = visibleIssues();
      if (!list.length) return;
      const index = selectedIssueIndex();
      selectIssue(list[index <= 0 ? 0 : index - 1].id);
    }
    function setIssueStatus(issue, status) { if (issue) issue.status = status; }
    function updateSelected(status) { setIssueStatus(selectedIssue(), status); renderAll(); }
    function updateSimilarSelected(status) { const issue = selectedIssue(); if (!issue) return; review.issues.filter((item) => item.type === issue.type && item.originalText === issue.originalText && item.status === "open").forEach((item) => setIssueStatus(item, status)); renderAll(); }
    function updateType(group, status) { review.issues.filter((issue) => issue.group === group && issue.status === "open").forEach((issue) => setIssueStatus(issue, status)); renderAll(); }

    function renderReport(model) {
      elements.report.hidden = false;
      if (elements.filterType) {
        elements.filterType.textContent = "";
        const allOption = doc.createElement("option");
        allOption.value = "all";
        allOption.textContent = "All issue types";
        elements.filterType.appendChild(allOption);
        GROUPS.forEach((group) => {
          const option = doc.createElement("option");
          option.value = group.id;
          option.textContent = group.title;
          elements.filterType.appendChild(option);
        });
      }
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
    elements.formatted?.addEventListener("click", (event) => { const node = event.target.closest("[data-issue-id]"); if (node) selectIssue(node.dataset.issueId); });
    elements.formatted?.addEventListener("focusin", (event) => { const node = event.target.closest("[data-issue-id]"); if (node) selectIssue(node.dataset.issueId); });
    elements.extracted?.addEventListener("click", (event) => { const node = event.target.closest("[data-issue-id]"); if (node) selectIssue(node.dataset.issueId); });
    elements.extracted?.addEventListener("focusin", (event) => { const node = event.target.closest("[data-issue-id]"); if (node) selectIssue(node.dataset.issueId); });
    elements.sidebar?.addEventListener("click", (event) => { const row = event.target.closest("[data-issue-id]"); if (row) selectIssue(row.dataset.issueId); const apply = event.target.closest("[data-apply-type]"); if (apply) updateType(apply.dataset.applyType, "applied"); const ignore = event.target.closest("[data-ignore-type]"); if (ignore) updateType(ignore.dataset.ignoreType, "ignored"); });
    elements.details?.addEventListener("click", (event) => { const action = event.target.dataset.action; if (action === "apply-selected") updateSelected("applied"); if (action === "ignore-selected") updateSelected("ignored"); });
    elements.reviewNext?.addEventListener("click", selectNextIssue);
    elements.reviewPrevious?.addEventListener("click", selectPreviousIssue);
    elements.reviewApply?.addEventListener("click", () => updateSelected("applied"));
    elements.reviewIgnore?.addEventListener("click", () => updateSelected("ignored"));
    elements.reviewApplySimilar?.addEventListener("click", () => updateSimilarSelected("applied"));
    elements.previewMode?.addEventListener("change", () => { if (!review) return; review.previewMode = elements.previewMode.value; renderAll(); });
    function renderAfterFilterChange() { if (review && review.selectedIssueId && selectedIssueIndex() < 0) review.selectedIssueId = visibleIssues()[0]?.id || null; renderAll(); }
    elements.filterStatus?.addEventListener("change", () => { if (!review) return; review.filters.status = elements.filterStatus.value; renderAfterFilterChange(); });
    elements.filterType?.addEventListener("change", () => { if (!review) return; review.filters.type = elements.filterType.value; renderAfterFilterChange(); });
    elements.hideLow?.addEventListener("change", () => { if (!review) return; review.filters.hideLow = elements.hideLow.checked; renderAfterFilterChange(); });
    doc.addEventListener("keydown", (event) => {
      if (!review || elements.documentView.hidden) return;
      if (event.key === "ArrowDown") { event.preventDefault(); selectNextIssue(); }
      if (event.key === "ArrowUp") { event.preventDefault(); selectPreviousIssue(); }
      if (event.key === "Enter") { event.preventDefault(); updateSelected("applied"); }
      if (event.key.toLowerCase() === "i") { event.preventDefault(); updateSelected("ignored"); }
      if (event.key === "Escape") { review.selectedIssueId = null; renderAll(); }
    });
    elements.copy?.addEventListener("click", async () => { if (!currentModel) return; try { await navigator.clipboard.writeText(review.cleanedText); setStatus("Copied cleaned text."); } catch (error) { setStatus("Clipboard write failed; select the cleaned preview and copy manually."); } });
    elements.copyFormatted?.addEventListener("click", async () => {
      if (!currentModel) return;
      try {
        if (!navigator.clipboard || !global.ClipboardItem) throw new Error("HTML clipboard unavailable");
        await navigator.clipboard.write([new ClipboardItem({
          "text/html": new Blob([review.formattedHtml || serializeFormattedHtml(currentModel, review)], { type: "text/html" }),
          "text/plain": new Blob([review.cleanedText], { type: "text/plain" })
        })]);
        setStatus("Copied cleaned formatted content.");
      } catch (error) {
        try { await navigator.clipboard.writeText(review.cleanedText); setStatus("Formatted clipboard unavailable; copied cleaned text instead."); }
        catch (fallbackError) { setStatus("Clipboard write failed; select the cleaned preview and copy manually."); }
      }
    });
    elements.downloadText?.addEventListener("click", () => { if (!currentModel) return; const blob = new Blob([review.cleanedText], { type: "text/plain" }); const a = doc.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `${currentModel.fileName.replace(/\.docx$/i, "")}-cleaned.txt`; a.click(); URL.revokeObjectURL(a.href); });
    elements.download?.addEventListener("click", () => { if (!currentModel) return; const report = { file: { name: currentModel.fileName, size: currentModel.fileSize }, issues: review.issues, appliedIssueIds: review.issues.filter((i) => i.status === "applied").map((i) => i.id), ignoredIssueIds: review.issues.filter((i) => i.status === "ignored").map((i) => i.id), finalCleanedTextLength: review.cleanedText.length, finalCleanedTextChecksum: checksumText(review.cleanedText) }; const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" }); const a = doc.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `${currentModel.fileName.replace(/\.docx$/i, "")}-analysis.json`; a.click(); URL.revokeObjectURL(a.href); });
    elements.clear?.addEventListener("click", clear);
    if (global.location && global.location.hash === "#document") showView("document");
    return { showView, handleFile, clear, getCurrentModel: () => currentModel, getReviewState: () => review, visibleIssues, selectedIssueIndex, selectNextIssue, selectPreviousIssue, reviewProgressLabel };
  }

  const API = { createDocumentAnalysisView, createReviewState, applyIssuePatches, checksumText, formatBytes };
  if (typeof module !== "undefined" && module.exports) module.exports = API;
  else global.TextSanitizerUi = Object.assign(global.TextSanitizerUi || {}, API);
})(typeof window !== "undefined" ? window : globalThis);
