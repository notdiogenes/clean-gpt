# Repository guidance for agents

## Project overview

Copy Sanitizer is a static GitHub Pages app for cleaning clipboard content and producing destination-aware output for Gmail, Google Docs, Microsoft Word, Outlook, Markdown/chat, CMS fields, code comments, plain text, and strict ASCII workflows.

The application is browser-only at runtime. It should not send user text to a server.

## Important entry points

- `index.html` is the static application shell loaded by GitHub Pages.
- `styles.css` contains app styling.
- `src/main.js` starts the browser UI.
- `src/public-api.js` defines the stable public API surface.
- `src/browser-shim.js` provides browser-global API compatibility.
- `app.js` is a compatibility wrapper for tests and legacy consumers. Keep it working unless explicitly replacing that compatibility layer.
- `test/` contains Node tests run with `npm test`.
- `playwright.config.js` configures browser tests run with `npm run test:browser`.

## Source layout

- `src/config/` contains static product configuration such as destinations, presets, defaults, examples, samples, and typography options.
- `src/core/` contains pure sanitizer logic and Unicode/regex helpers. It must not depend on DOM APIs.
- `src/document/` contains the document model, HTML/plain-text parsing, serialization, and document-level sanitization.
- `src/html/` contains pure HTML string builders and escaping/style helpers.
- `src/ui/` contains browser-only DOM wiring, preferences, controls, editor rendering, previews, diffing, inspector views, clipboard behavior, sample loading, and the app controller.

Keep dependency direction clean: lower-level pure modules should not import from `src/ui/`.

## Development workflow

1. Inspect existing tests and public exports before changing behavior.
2. Prefer small, behavior-preserving refactors.
3. Keep the stable public API available from both `src/public-api.js` and `app.js`.
4. For browser-visible changes, verify the page manually or with Playwright when practical.
5. Run relevant checks before committing:
   - `npm test`
   - `npm run test:browser` when UI/browser behavior changes

## Coding conventions

- Do not add `try`/`catch` blocks around imports.
- Avoid introducing server-side dependencies for runtime app behavior.
- Keep pure sanitizer, parser, serializer, and HTML builder code testable without a live DOM.
- Keep browser APIs such as `document`, `localStorage`, and Clipboard API usage inside `src/ui/` or browser entry/shim files.
- Preserve destination-specific behavior unless a test or explicit task calls for a behavior change.

## Documentation expectations

- Update the root `README.md` when product behavior, setup, deployment, or top-level repository structure changes.
- Update `src/README.md` when source-module responsibilities or dependency boundaries change.
- Keep this `AGENTS.md` current when development workflow or repository structure guidance changes.
