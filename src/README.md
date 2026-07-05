# Source module map

The `src/` tree contains the modular application implementation. The root `app.js` file remains a compatibility wrapper for tests and older consumers; new implementation work should happen in `src/`.

## Entry points

- `main.js` starts the browser UI when `document` is available.
- `public-api.js` re-exports the stable sanitizer API used by tests and consumers.
- `browser-shim.js` exposes the public API for browser-global use when needed.

## Module responsibilities

### `config/`

Static product configuration only:

- destination profiles
- presets and preset descriptions
- option defaults
- option examples
- sample text
- typography font and size options

Config modules should not read the DOM, clipboard, or local storage.

### `core/`

Pure sanitizer logic with no DOM dependencies:

- regex helpers
- stats and change records
- option construction
- source cleanup
- destination typography
- strict ASCII conversion
- diagnostics
- top-level sanitize orchestration
- Unicode character-name reference data

Core modules may import from `config/`, but must not import from `document/`, `html/`, or `ui/` unless a future design explicitly changes the layering.

### `document/`

The internal document model and text/HTML conversion boundary:

- block and list model helpers
- stable IDs
- plain-text parsing
- HTML parsing
- plain-text serialization
- document-level sanitization

Document modules may call pure sanitizer APIs but should not touch the DOM outside parser inputs provided by callers.

#### DOCX canonical text model

`document/docx-extract.js` emits a normalized document model that uses one canonical text coordinate space for extraction, analysis, rendering, and review. `rawText` is `blocks.map((block) => block.text).join("\n")`; every block, table cell, paragraph, and run `start`/`end` range points into that same string. Tables contribute their cell text to the canonical text instead of placeholder-only ranges, with cells separated by tabs and rows/blocks separated by newlines.

Normalized DOCX shapes:

- document: `{ schemaVersion, coordinateSpace, rawText, paragraphs, blocks, characterCount, wordCount, analysisResults }`
- paragraph block: `{ id, type: "paragraph", text, start, end, range, styleId, styleName, runs }`
- run/text/tab/line break: `{ id, type: "text" | "tab" | "lineBreak", text, start, end, range, rangeInBlock, properties }`
- table block: `{ id, type: "table", text, start, end, range, rows }`
- row: `{ id, type: "row", text, cells }`
- cell: `{ id, type: "cell", text, start, end, range, paragraphs }`

`document/document-analysis.js` maps issue anchors back into block/run locations and, for tables, row/cell/paragraph locations. Overlapping issue ranges are grouped deterministically; specific cleanup issues such as emoji and curly quotes take priority over the broad non-ASCII issue for the same range.


#### DOCX WordprocessingML capability matrix

`document/docx-wordprocessingml.js` is the structured DOCX parser used by `document/docx-extract.js`. In browsers it parses WordprocessingML with `DOMParser`; in Node tests it uses the module-local XML parser and then traverses the resulting tree by XML local name. This keeps extraction independent from namespace prefixes such as `w:` and `r:` while remaining testable without a live DOM.

| DOCX construct | Status | Extraction behavior |
| --- | --- | --- |
| Paragraphs (`w:p`) and runs (`w:r`, `w:t`) | Rendered and reviewable | Emitted as paragraph blocks with canonical `start`/`end` ranges and run-level review anchors. |
| Run breaks and tabs (`w:br`, `w:cr`, `w:tab`) | Rendered and reviewable | Converted to `\n` and `\t` runs in the same canonical coordinate space. |
| Paragraph styles and headings (`w:pStyle`, `word/styles.xml`) | Rendered and reviewable | Preserves `styleId` and resolved `styleName` on paragraph blocks so heading-like styles are visible to renderers/review UI. |
| Run styles and formatting (`w:rPr`) | Rendered and reviewable | Preserves bold, italic, underline, strike, subscript/superscript, highlight, color, and character style metadata on runs. |
| Lists/numbering (`w:numPr`) | Rendered and reviewable | Preserves list `level` and `numId` metadata on paragraph blocks; numbering labels are not synthesized yet. |
| Tables (`w:tbl`, `w:tr`, `w:tc`) | Rendered and reviewable | Emits table/row/cell/paragraph shapes with cell text included in `rawText`; cell separators are tabs and row separators are newlines. |
| Hyperlinks (`w:hyperlink` plus `document.xml.rels`) | Rendered and reviewable | Emits hyperlink text as runs and preserves relationship id, target URL, and anchor metadata on run properties. |
| Tracked insertions/deletions (`w:ins`, `w:del`) | Rendered and reviewable, detected with warning | Renders contained text with revision metadata (`revision`, `author`, `date`) on runs and adds a document warning for tracked revisions. |
| Comments (`word/comments.xml`) | Detected with warning | Warns that comments exist; comment ranges and comment text are not rendered yet. |
| Headers/footers (`word/header*.xml`, `word/footer*.xml`) | Detected with warning | Warns that the parts exist; their text is not merged into the main review model yet. |
| Footnotes (`word/footnotes.xml`) | Detected with warning | Warns that footnotes exist; footnote bodies are not rendered yet. |
| Images, drawings, charts, SmartArt, embedded objects, fields, bookmarks, section properties, page layout, and theme data | Ignored | These constructs do not contribute text or review anchors in the current parser. |

The backward-compatible public extraction fields remain `rawText`, `paragraphs`, `blocks`, and `analysisResults`; callers may also inspect `warnings` for deferred DOCX features.

### `html/`

Pure HTML string generation:

- HTML escaping
- inline destination style construction
- Gmail HTML builders
- document-style HTML builders

HTML modules should produce strings and should not use event listeners, clipboard APIs, local storage, or live DOM rendering.

### `ui/`

Browser-only coordination and rendering:

- DOM reference collection
- preferences and local storage
- destination, preset, style, and advanced setting controls
- editor input handling
- output preview rendering
- diff rendering
- inspector rendering
- clipboard read/write handling
- sample loading
- top-level application controller

UI modules are allowed to import from `config/`, `core/`, `document/`, and `html/`. Lower-level modules should not import from `ui/`.

## Dependency direction

Keep dependencies flowing in this direction:

```text
config
  ↓
core
  ↓
document
  ↓
html
  ↓
ui
```

In practice, shared pure helpers can be imported upward by UI code, but lower layers should stay free of browser-only dependencies.

## Development notes

- Preserve the public API exported through `src/public-api.js` and the root `app.js` compatibility wrapper.
- Prefer small extractions and behavior-preserving refactors.
- Add or update tests around module boundaries when changing sanitizer, parser, serializer, or HTML builder behavior.
- Do not put `try`/`catch` blocks around imports.
