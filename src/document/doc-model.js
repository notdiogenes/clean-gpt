(function (global) {
  "use strict";

  function normalizeBlockText(text) {
    return String(text == null ? "" : text).replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  }

  let nextBlockId = 1;

  function assignStableIds(blocks) {
    (blocks || []).forEach((block) => {
      if (!block.id) block.id = `block-${nextBlockId++}`;
      if (block.type === "ul" || block.type === "ol") {
        (block.items || []).forEach((item) => {
          if (!item.id) item.id = `item-${nextBlockId++}`;
          assignStableIds(item.children || []);
        });
      }
    });
  }

  function makeDoc(blocks, meta) {
    const docBlocks = Array.isArray(blocks) ? blocks : [];
    assignStableIds(docBlocks);
    return {
      blocks: docBlocks,
      meta: Object.assign({ source: "manual", htmlAvailable: false, plainAvailable: false, lists: 0, listItems: 0 }, meta || {})
    };
  }

  function itemTextWithChildren(item) {
    const parts = [item && item.text ? item.text : ""];
    (item && item.children || []).forEach((child) => parts.push(blockText(child)));
    return parts.filter(Boolean).join("\n");
  }

  function blockText(block) {
    if (!block) return "";
    if (block.type === "ul" || block.type === "ol") return (block.items || []).map(itemTextWithChildren).join("\n");
    return block.text || "";
  }

  function countDocLists(blocks) {
    let lists = 0;
    let items = 0;
    function visit(block) {
      if (!block) return;
      if (block.type === "ul" || block.type === "ol") {
        lists += 1;
        items += (block.items || []).length;
        (block.items || []).forEach((item) => (item.children || []).forEach(visit));
      }
    }
    (blocks || []).forEach(visit);
    return { lists, items };
  }

  const API = { normalizeBlockText, assignStableIds, makeDoc, itemTextWithChildren, blockText, countDocLists };
  if (typeof module !== "undefined" && module.exports) module.exports = API;
  else global.TextSanitizerDocument = Object.assign(global.TextSanitizerDocument || {}, API);
})(typeof window !== "undefined" ? window : globalThis);
