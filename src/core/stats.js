(function (global) {
  "use strict";
  function makeStats() {
    return { sourceChanges: 0, destinationChanges: 0, hiddenRemoved: 0, spacesNormalized: 0, lineEndingsNormalized: 0, separatorsNormalized: 0, trailingSpacesRemoved: 0, blankLineRunsReduced: 0, repeatedSpacesCollapsed: 0, tabsConverted: 0, quotesChanged: 0, dashesChanged: 0, ellipsesChanged: 0, bulletsChanged: 0, fullwidthChanged: 0, ligaturesChanged: 0, fractionsChanged: 0, superSubChanged: 0, emojiRemoved: 0, strictAsciiChanged: 0 };
  }
  function addChange(changes, phase, source, target, count, note) {
    if (!count) return;
    const matchKey = `${phase}|${source}|${target}|${note || ""}`;
    const occurrenceIndex = changes.filter((change) => change.matchKey === matchKey).length;
    changes.push({ key: `${matchKey}|${occurrenceIndex}`, matchKey, occurrenceIndex, phase, source, target, count, note: note || "" });
  }
  function replaceMappedChars(text, map, phase, changes, stats, statName, note) {
    let output = ""; let localCount = 0;
    for (const char of text) { if (map.has(char)) { const replacement = map.get(char); output += replacement; localCount += 1; addChange(changes, phase, char, replacement, 1, note); } else output += char; }
    if (localCount) { stats[statName] += localCount; stats[phase === "Destination" ? "destinationChanges" : "sourceChanges"] += localCount; }
    return output;
  }
  function replaceRegex(text, regex, replacement, phase, changes, stats, statName, note, sourceLabel) {
    let count = 0;
    const out = text.replace(regex, (match, ...args) => { count += 1; const actualReplacement = typeof replacement === "function" ? replacement(match, ...args) : replacement; addChange(changes, phase, sourceLabel || match, actualReplacement, 1, note); return actualReplacement; });
    if (count) { stats[statName] += count; stats[phase === "Destination" ? "destinationChanges" : "sourceChanges"] += count; }
    return out;
  }
  const API = { makeStats, addChange, replaceMappedChars, replaceRegex };
  if (typeof module !== "undefined" && module.exports) module.exports = API;
  else global.TextSanitizerCore = Object.assign(global.TextSanitizerCore || {}, API);
})(typeof window !== "undefined" ? window : globalThis);
