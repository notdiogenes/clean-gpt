# Copy Sanitizer

Copy Sanitizer is a static, destination-aware clipboard cleanup app. It helps turn messy copied content into output shaped for Gmail, Google Docs, Microsoft Word, Outlook, Markdown/chat, CMS fields, code comments, plain text, or strict ASCII workflows.

The app runs fully in the browser. Text is processed locally and is not sent to a server.

## Project status

The codebase has been split out of the legacy single-file implementation into focused modules under `src/`. The root `app.js` file remains as a CommonJS/browser compatibility entry point for tests and older consumers, while `index.html` loads the browser modules directly.

Both README files are intentional:

- This root `README.md` is the product and repository overview for users and contributors.
- `src/README.md` is the source-tree map for developers working inside the modularized application code.

## How the app works

The app uses controlled `contenteditable` panels instead of plain `<textarea>` fields. A textarea can only show plain text, while clipboard data often includes both `text/html` and `text/plain`; list structure may only exist in the HTML payload.

Pipeline:

```text
clipboard paste
  -> read text/html when available
  -> fall back to text/plain
  -> parse paragraphs, blank lines, unordered lists, and ordered lists
  -> sanitize text inside each block
  -> render destination preview
  -> copy using destination-specific clipboard formats
```

## Destination profiles

- **Gmail**: uses Gmail-friendly punctuation and rich HTML with locally saved Gmail font/size settings. Semantic lists are preserved unless the advanced Gmail list-flattening option is enabled.
- **Google Docs**: uses document-style typography and writes `text/html` plus `text/plain`, preserving semantic lists where possible.
- **Microsoft Word**: uses the document typography profile and writes rich plus plain clipboard payloads.
- **Outlook**: favors rich destination output with semantic list support.
- **Markdown/chat, CMS/forms, and code comments**: flatten structure toward destination-safe plain text conventions.
- **Plain text / forms**: copies `text/plain` only.
- **Strict ASCII**: replaces or removes non-ASCII characters aggressively.

## Cleanup capabilities

Copy Sanitizer can remove or normalize:

- hidden Unicode characters
- zero-width spaces, word joiners, soft hyphens, and directional marks
- unusual spaces and repeated spaces
- mixed line endings
- Unicode line and paragraph separators
- quote-like characters
- dash variants
- ellipsis and dot leaders
- fullwidth ASCII forms
- ligatures
- single-character fractions
- superscripts and subscripts
- emoji and pictographic symbols
- remaining non-ASCII characters in strict mode

The Inspector reports a grouped review, starting with a Cleanup summary and then sections for hidden and suspicious characters, typography normalization, whitespace/layout cleanup, compatibility cleanup, detected structure, items that still need review, and technical details such as character counts, clipboard source details, and Clipboard API compatibility.

## Document analysis exports

The DOCX analysis workflow keeps existing cleaned plain-text copy and `.txt` download behavior. After reviewing issues, users can also copy cleaned formatted content to the clipboard as `text/html` with a `text/plain` fallback. The formatted HTML is generated locally from the extracted normalized document model plus applied issue state, preserving safe inline formatting such as bold, italic, underline, strike-through, highlight, color, superscript/subscript, tables, and safe hyperlinks.

Sanitized DOCX download is deferred to a later milestone. The current export scope is cleaned plain text, JSON review reports, and clipboard-only formatted HTML; generating a replacement `.docx` requires a separate package writer that preserves document relationships and removes unsafe or stale WordprocessingML safely.

## Repository layout

```text
.
├── index.html              # Static GitHub Pages application shell
├── styles.css              # Application styles
├── app.js                  # Compatibility API wrapper for tests/legacy consumers
├── tests.html              # Browser debugging/test page
├── test/                   # Node test suite
├── src/
│   ├── main.js             # Browser startup entry point
│   ├── public-api.js       # Public API re-export surface
│   ├── browser-shim.js     # Browser global shim
│   ├── config/             # Static product configuration
│   ├── core/               # Pure sanitizer logic
│   ├── document/           # Internal document model, parsing, serialization
│   ├── html/               # Pure HTML string builders
│   └── ui/                 # DOM, clipboard, preferences, rendering controllers
└── playwright.config.js    # Browser test configuration
```

See `src/README.md` for details about module responsibilities and dependency direction.

## Development

Install dependencies:

```sh
npm install
```

Run the Node test suite:

```sh
npm test
```

Run Playwright browser tests:

```sh
npm run test:browser
```

## Deployment

The project is static. Deploy the repository root to GitHub Pages.

Required root files include:

```text
index.html
styles.css
app.js
src/
README.md
.nojekyll
```
