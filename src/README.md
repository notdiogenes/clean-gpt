# Source module map

`app.js` remains the browser entry point for GitHub Pages. New code should keep pure parsing,
sanitizing, rendering, clipboard, and UI responsibilities separated according to this map before
they are extracted into standalone modules:

- `constants` — option defaults, presets, destination profiles, character maps, regexes.
- `sanitize` — source cleanup, destination typography, strict ASCII conversion.
- `parse` — HTML, plain-text, and editor-to-document parsers.
- `render` — document previews and destination HTML/plain-text serializers.
- `clipboard` — destination copy routing and Clipboard API fallbacks.
- `ui` — DOM binding, status messages, controls, inspector, compatibility panel.

This keeps the app deployable as static files while documenting the intended module boundaries.
