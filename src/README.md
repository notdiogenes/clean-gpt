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
