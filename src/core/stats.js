(function (global) {
  "use strict";

  function makeStats() {
    return { sourceChanges: 0, destinationChanges: 0, hiddenRemoved: 0, spacesNormalized: 0, lineEndingsNormalized: 0, separatorsNormalized: 0, trailingSpacesRemoved: 0, blankLineRunsReduced: 0, repeatedSpacesCollapsed: 0, tabsConverted: 0, quotesChanged: 0, dashesChanged: 0, ellipsesChanged: 0, bulletsChanged: 0, fullwidthChanged: 0, ligaturesChanged: 0, fractionsChanged: 0, superSubChanged: 0, emojiRemoved: 0, strictAsciiChanged: 0 };
  }

  function codePointLabel(value) {
    if (!value) return "";
    const cp = Array.from(String(value))[0].codePointAt(0);
    return `U+${cp.toString(16).toUpperCase().padStart(4, "0")}`;
  }

  function inferCategory(note, phase) {
    const text = String(note || "").toLowerCase();
    if (/hidden|formatting/.test(text)) return "hidden-character";
    if (/space|tab|blank/.test(text)) return "spacing";
    if (/line ending|separator/.test(text)) return "line-break";
    if (/quote|apostrophe|prime/.test(text)) return "quote";
    if (/dash|hyphen|range/.test(text)) return "dash";
    if (/ellipsis|dot leader|period/.test(text)) return "ellipsis";
    if (/emoji|pictographic/.test(text)) return "emoji";
    if (/ascii|accent|non-ascii|symbol/.test(text)) return "strict-ascii";
    return phase === "Destination" ? "destination-typography" : "source-cleanup";
  }

  function inferAction(before, after) {
    if (after === "") return "remove";
    if (before === "") return "insert";
    return "replace";
  }

  function normalizeChange(phase, source, target, count, note, details) {
    const before = details?.before ?? source;
    const after = details?.after ?? target;
    const category = details?.category || inferCategory(note, phase);
    const sourceStart = Number.isInteger(details?.sourceStart) ? details.sourceStart : null;
    const sourceEnd = Number.isInteger(details?.sourceEnd) ? details.sourceEnd : (sourceStart == null ? null : sourceStart + String(before).length);
    const outputStart = Number.isInteger(details?.outputStart) ? details.outputStart : null;
    const outputEnd = Number.isInteger(details?.outputEnd) ? details.outputEnd : (outputStart == null ? null : outputStart + String(after).length);
    return {
      category,
      subcategory: details?.subcategory || category,
      severity: details?.severity || "info",
      sourceStart,
      sourceEnd,
      outputStart,
      outputEnd,
      before,
      after,
      action: details?.action || inferAction(before, after),
      characterName: details?.characterName || codePointLabel(before),
      codePoint: details?.codePoint || codePointLabel(before),
      message: details?.message || note || "Text changed",
      suggestion: details?.suggestion || "Review this automatic cleanup."
    };
  }

  function addChange(changes, phase, source, target, count, note, details) {
    if (!count) return;
    const rich = typeof phase === "object" && phase ? phase : normalizeChange(phase, source, target, count, note, details || {});
    const legacyPhase = rich.phase || phase || (rich.category === "destination-typography" ? "Destination" : "Source");
    const legacySource = rich.source ?? rich.before ?? source ?? "";
    const legacyTarget = rich.target ?? rich.after ?? target ?? "";
    const legacyNote = rich.note ?? rich.message ?? note ?? "";
    const matchKey = `${legacyPhase}|${legacySource}|${legacyTarget}|${legacyNote}`;
    const occurrenceIndex = changes.filter((change) => change.matchKey === matchKey).length;
    changes.push(Object.assign({}, rich, { key: `${matchKey}|${occurrenceIndex}`, matchKey, occurrenceIndex, phase: legacyPhase, source: legacySource, target: legacyTarget, count, note: legacyNote }));
  }

  function replaceMappedChars(text, map, phase, changes, stats, statName, note, detailsFor) {
    let output = ""; let localCount = 0;
    for (let i = 0; i < text.length;) {
      const char = Array.from(text.slice(i))[0];
      if (map.has(char)) {
        const replacement = map.get(char);
        addChange(changes, phase, char, replacement, 1, note, Object.assign({ sourceStart: i, sourceEnd: i + char.length, outputStart: output.length, outputEnd: output.length + replacement.length }, typeof detailsFor === "function" ? detailsFor(char, replacement) : detailsFor));
        output += replacement; localCount += 1;
      } else output += char;
      i += char.length;
    }
    if (localCount) { stats[statName] += localCount; stats[phase === "Destination" ? "destinationChanges" : "sourceChanges"] += localCount; }
    return output;
  }

  function replaceRegex(text, regex, replacement, phase, changes, stats, statName, note, sourceLabel, detailsFor) {
    let count = 0; let output = ""; let lastIndex = 0;
    const flags = regex.flags.includes("g") ? regex.flags : `${regex.flags}g`;
    const re = new RegExp(regex.source, flags);
    let match;
    while ((match = re.exec(text))) {
      const matchText = match[0];
      const index = match.index;
      output += text.slice(lastIndex, index);
      const args = [...match, index, text, match.groups];
      const actualReplacement = typeof replacement === "function" ? replacement(...args) : replacement;
      const before = sourceLabel || matchText;
      addChange(changes, phase, before, actualReplacement, 1, note, Object.assign({ before: matchText, sourceStart: index, sourceEnd: index + matchText.length, outputStart: output.length, outputEnd: output.length + String(actualReplacement).length }, typeof detailsFor === "function" ? detailsFor(matchText, actualReplacement, match) : detailsFor));
      output += actualReplacement;
      lastIndex = index + matchText.length;
      count += 1;
      if (matchText === "") re.lastIndex += 1;
    }
    output += text.slice(lastIndex);
    if (count) { stats[statName] += count; stats[phase === "Destination" ? "destinationChanges" : "sourceChanges"] += count; }
    return output;
  }
  const API = { makeStats, addChange, replaceMappedChars, replaceRegex };
  if (typeof module !== "undefined" && module.exports) module.exports = API;
  else global.TextSanitizerCore = Object.assign(global.TextSanitizerCore || {}, API);
})(typeof window !== "undefined" ? window : globalThis);
