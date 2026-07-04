# Copy Sanitizer

A static GitHub Pages app for destination-aware copy/paste cleanup.

The app takes pasted text, removes hidden/source artifacts, applies a destination profile, and produces output shaped for the place where the text will be pasted.

## Destination profiles

### Gmail

Gmail mode keeps keyboard-style visible punctuation and uses a Gmail-compatible rendered HTML clipboard payload for paragraph and font behavior.

Visible character policy:

- double quotes: `U+0022 QUOTATION MARK`
- apostrophes: `U+0027 APOSTROPHE`
- em-dash-like interruption: `space + -- + space`
- ellipsis: three full stops, `...`
- list bullets: hyphen lines, when enabled
- no intentionally inserted zero-width spaces

Primary copy policy:

- writes `text/html` to the clipboard
- generated HTML shape:

```html
<div><div class="gmail_default" style="font-family: verdana, sans-serif;">Paragraph one</div><div class="gmail_default" style="font-family: verdana, sans-serif;"><br></div><div class="gmail_default" style="font-family: verdana, sans-serif;">Paragraph two<br></div><br clear="all"></div>
```

The visible textarea remains plain text; the Gmail copy button generates the rendered HTML payload directly from that text.

### Google Docs

Google Docs mode uses document typography and copies `text/plain` so Docs can inherit the current document style.

Default destination typography:

- paired double quotes become `U+201C` and `U+201D`
- apostrophes and closing single quotes become `U+2019`
- opening single quotes become `U+2018`
- ` -- ` becomes `U+2014 EM DASH`
- numeric ranges such as `5-10` become `5–10`
- `...` becomes `U+2026 HORIZONTAL ELLIPSIS`
- typed feet/inches can become prime marks when enabled

### Microsoft Word

Word mode currently uses the same document typography as Google Docs and copies `text/plain` so Word can inherit the active document style instead of browser styles.

The profile is kept separate so Word-specific clipboard behavior can diverge later if needed.

### Plain text / forms

Plain mode keeps keyboard-safe visible characters and copies `text/plain`.

### Strict ASCII

Strict ASCII mode aggressively removes or replaces non-ASCII characters.

Default strict conversions include:

- accent folding through compatibility decomposition
- ligature expansion
- single-character fractions converted to text fractions
- superscript and subscript characters flattened
- common symbols replaced with ASCII equivalents when available
- emoji removed
- remaining non-ASCII characters removed

## Character policy categories

The UI is organized around character classes rather than one-off replacements.

### Source cleanup

- hidden and directional characters
- line endings
- Unicode line/paragraph separators
- unusual spaces
- trailing spaces
- repeated blank lines
- repeated spaces
- tabs

### Punctuation cleanup

- smart quotes and apostrophe-like marks
- prime marks
- em dash, en dash, non-breaking hyphen, figure dash, minus sign, and fullwidth hyphen forms
- ellipsis and dot leaders
- bullets at the beginning of list lines

### Compatibility cleanup

- fullwidth ASCII forms
- ligatures
- single-character fractions
- superscripts and subscripts
- emoji and pictographic symbols

### Destination typography

- smart quotes
- typographic dashes
- numeric en dashes
- ellipsis character
- typed fractions
- measurement prime marks

### Strict ASCII

- accent folding
- common symbol replacements
- removal of remaining non-ASCII characters

## Inspector

The Inspector reports:

- input character count
- output character count
- source cleanup changes
- destination typography changes
- hidden characters removed
- remaining non-ASCII characters
- exact code-point-level replacement records
- warnings

Example change record:

```text
Source: U+201C LEFT DOUBLE QUOTATION MARK -> U+0022 QUOTATION MARK ×1 (Quote-like character normalized)
```

## UI layout

The editor cards use fixed matching rows for the header, action row, textarea, and status line. The input and output panels therefore line up at the top, at the textarea start, and at the bottom.

Destination selection lives in the Character Policy rail. Its help text has reserved height so changing profiles does not shift the editor layout.

All Character Policy sections are expanded by default, including Compatibility Cleanup and Strict ASCII.

## Files

```text
index.html
styles.css
app.js
README.md
.nojekyll
```

No build step is required.

## GitHub Pages deployment

Upload the files to the repository root and enable GitHub Pages from GitHub Actions or from the repository root, depending on your Pages configuration.

## Privacy

The app runs locally in the browser. It does not send text to a server.
