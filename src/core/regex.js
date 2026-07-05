(function (global) {
  "use strict";

  const REGEX = Object.freeze({
    hidden: /[\u00AD\u034F\u061C\u115F\u1160\u17B4\u17B5\u180B-\u180F\u200B-\u200F\u202A-\u202E\u2060-\u206F\uFE00-\uFE0F\uFEFF\uFFF9-\uFFFB]|[\u{E0001}\u{E0020}-\u{E007F}\u{E0100}-\u{E01EF}]/gu,
    unusualSpaces: /[\u00A0\u1680\u2000-\u200A\u202F\u205F\u3000]/gu,
    separators: /\u2028|\u2029/gu,
    curlySingle: /[\u2018\u2019\u201A\u201B\u02BC\u00B4\u0060\uFF07]/gu,
    primeSingle: /[\u2032\u2035]/gu,
    curlyDouble: /[\u201C\u201D\u201E\u201F\u00AB\u00BB\uFF02]/gu,
    primeDouble: /[\u2033\u2036]/gu,
    emDashLike: /[ \t]*[\u2014\u2015][ \t]*/gu,
    enDashLike: /[\u2010\u2011\u2012\u2013\u2212\uFF0D]/gu,
    ellipsis: /\u2026/gu,
    oneDotLeader: /\u2024/gu,
    twoDotLeader: /\u2025/gu,
    bulletLine: /^(\s*)[\u2022\u2023\u25E6\u2043\u2219]\s+/gmu,
    emoji: /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}]/gu,
    combiningMarks: /[\u0300-\u036f]/gu,
    nonAscii: /[^\x00-\x7F]/gu,
    trailingSpaces: /[ \t]+$/gm,
    blankLineRuns: /\n{3,}/g,
    repeatedSpaces: / {2,}/g,
    fullwidthAscii: /[\uFF01-\uFF5E]/gu,
    measurementFeet: /(\d)'(?=\s|$|\d)/g,
    measurementInches: /(\d)"(?=\s|$|\D)/g,
    numericRange: /(\b\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?\b)/g,
    typedEllipsis: /\.\.\./g,
    typedEmDash: /\s--\s/g,
    commonFractionsTyped: /\b(1\/2|1\/4|3\/4)\b/g,
    htmlSensitive: /[&<>]/g
  });

  const INSPECTOR_UNICODE_CATEGORIES = Object.freeze([
    { label: "Zero-width & join controls", regex: /[\u00AD\u034F\u180B-\u180F\u200B-\u200D\u2060\uFEFF]/gu },
    { label: "Bidirectional controls", regex: /[\u061C\u200E\u200F\u202A-\u202E\u2066-\u2069]/gu },
    { label: "Invisible math operators", regex: /[\u2061-\u2064]/gu },
    { label: "Variation selectors", regex: /[\u180B-\u180D\u180F\uFE00-\uFE0F]|[\u{E0100}-\u{E01EF}]/gu },
    { label: "Tag & annotation controls", regex: /[\uFFF9-\uFFFB]|[\u{E0001}\u{E0020}-\u{E007F}]/gu },
    { label: "Space-like blanks", regex: /[\u00A0\u1680\u2000-\u200A\u2028\u2029\u202F\u205F\u3000]/gu },
    { label: "C0/C1 controls", regex: /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/gu }
  ]);

  const MAPS = Object.freeze({
    ligatures: new Map([["ﬀ", "ff"], ["ﬁ", "fi"], ["ﬂ", "fl"], ["ﬃ", "ffi"], ["ﬄ", "ffl"], ["ﬅ", "st"], ["ﬆ", "st"]]),
    fractions: new Map([["¼", "1/4"], ["½", "1/2"], ["¾", "3/4"], ["⅐", "1/7"], ["⅑", "1/9"], ["⅒", "1/10"], ["⅓", "1/3"], ["⅔", "2/3"], ["⅕", "1/5"], ["⅖", "2/5"], ["⅗", "3/5"], ["⅘", "4/5"], ["⅙", "1/6"], ["⅚", "5/6"], ["⅛", "1/8"], ["⅜", "3/8"], ["⅝", "5/8"], ["⅞", "7/8"]]),
    smartFractions: new Map([["1/2", "½"], ["1/4", "¼"], ["3/4", "¾"]]),
    superSub: new Map([["⁰", "0"], ["¹", "1"], ["²", "2"], ["³", "3"], ["⁴", "4"], ["⁵", "5"], ["⁶", "6"], ["⁷", "7"], ["⁸", "8"], ["⁹", "9"], ["₀", "0"], ["₁", "1"], ["₂", "2"], ["₃", "3"], ["₄", "4"], ["₅", "5"], ["₆", "6"], ["₇", "7"], ["₈", "8"], ["₉", "9"], ["⁺", "+"], ["⁻", "-"], ["⁼", "="], ["⁽", "("], ["⁾", ")"], ["₊", "+"], ["₋", "-"], ["₌", "="], ["₍", "("], ["₎", ")"], ["ᵃ", "a"], ["ᵇ", "b"], ["ᶜ", "c"], ["ᵈ", "d"], ["ᵉ", "e"], ["ᶠ", "f"], ["ᵍ", "g"], ["ʰ", "h"], ["ⁱ", "i"], ["ʲ", "j"], ["ᵏ", "k"], ["ˡ", "l"], ["ᵐ", "m"], ["ⁿ", "n"], ["ᵒ", "o"], ["ᵖ", "p"], ["ʳ", "r"], ["ˢ", "s"], ["ᵗ", "t"], ["ᵘ", "u"], ["ᵛ", "v"], ["ʷ", "w"], ["ˣ", "x"], ["ʸ", "y"], ["ᶻ", "z"]]),
    asciiSymbols: new Map([["©", "(C)"], ["®", "(R)"], ["™", "TM"], ["℠", "SM"], ["°", " degrees"], ["±", "+/-"], ["×", "x"], ["÷", "/"], ["µ", "u"], ["€", "EUR"], ["£", "GBP"], ["¥", "JPY"], ["¢", "c"], ["–", "-"], ["—", " -- "], ["…", "..."], ["•", "-"], ["←", "<-"], ["→", "->"], ["↑", "^"], ["↓", "v"], ["‰", " per mille"], ["†", "*"], ["‡", "**"], ["№", "No."]]),
    html: new Map([["&", "&amp;"], ["<", "&lt;"], [">", "&gt;"]])
  });

  function cloneRegex(regex) { const flags = regex.flags.includes("g") ? regex.flags : regex.flags + "g"; return new RegExp(regex.source, flags); }
  function countMatches(text, regex) { const matches = String(text || "").match(cloneRegex(regex)); return matches ? matches.length : 0; }
  function regexMatchesText(regex, text) { return cloneRegex(regex).test(String(text || "")); }

  const API = { REGEX, INSPECTOR_UNICODE_CATEGORIES, MAPS, cloneRegex, countMatches, regexMatchesText };
  if (typeof module !== "undefined" && module.exports) module.exports = API;
  else global.TextSanitizerCore = Object.assign(global.TextSanitizerCore || {}, API);
})(typeof window !== "undefined" ? window : globalThis);
