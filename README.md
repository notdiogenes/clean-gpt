# Copy Sanitizer

A static GitHub Pages app for destination-aware copy/paste cleanup.

The app takes pasted text, removes hidden/source artifacts, applies a character policy, and produces output shaped for the place where the text will be pasted.

## Current destination profiles

### Gmail

Gmail mode keeps keyboard-style visible punctuation and uses a Gmail-compatible HTML clipboard payload for paragraph and font behavior.

Visible character policy:

- double quotes: `U+0022 QUOTATION MARK`
- apostrophes: `U+0027 APOSTROPHE`
- em-dash-like interruption: `space + -- + space`
- ellipsis: three full stops, `...`
- list bullets: hyphen lines, when enabled

Clipboard policy:

- primary button writes `text/html`
- generated HTML shape:

```html
<div><div class="gmail_default" style="font-family: verdana, sans-serif;">Paragraph one</div><div class="gmail_default" style="font-family: verdana, sans-serif;"><br></div><div class="gmail_default" style="font-family: verdana, sans-serif;">Paragraph two<br></div><br clear="all"></div>
```

The app does not intentionally add zero-width spaces.

### Google Docs

Google Docs mode uses document typography and copies `text/plain` so Docs can inherit the current document style.

Default destination typography:

- paired double quotes become `U+201C` and `U+201D`
- apostrophes and closing single quotes become `U+2019`
- opening single quotes become `U+2018`
- ` -- ` becomes `U+2014 EM DASH`
- numeric ranges such as `5-10` become `5–10`
- `...` becomes `U+2026 HORIZONTAL ELLIPSIS`

### Microsoft Word

Word mode currently uses the same default document typography as Google Docs and copies `text/plain` so Word can inherit the current document style.

The UI keeps Word separate because the profile may later diverge if Word-specific clipboard behavior is added.

### Plain text / forms

Plain mode keeps keyboard-safe characters and copies `text/plain`.

### Strict ASCII

Strict ASCII mode aggressively removes or replaces non-ASCII characters.

Default strict conversions include:

- accented letters folded through compatibility decomposition
- ligatures expanded
- single-character fractions converted to text fractions
- superscript and subscript characters flattened
- common symbols replaced with ASCII equivalents when available
- emoji removed
- remaining non-ASCII characters removed

## UI layout

The editor area is intentionally uniform:

- the input and output textareas sit side by side with matched heading rows and matched action rows
- input actions and output copy actions are separated from the title/description area so buttons do not change textarea alignment
- destination selection lives in the Character Policy rail, not above the output textarea
- the destination help text has reserved space so changing profiles does not shift the editor layout
- all Character Policy sections are expanded by default, including Compatibility Cleanup and Strict ASCII

The output textarea always shows the exact visible text for the selected destination. The primary copy button may use a richer clipboard payload when the destination requires it, such as Gmail HTML. The secondary copy button copies the visible textarea text as literal `text/plain`.

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
- optional smart fractions

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
Quote cleanup: U+201C LEFT DOUBLE QUOTATION MARK -> U+0022 QUOTATION MARK ×1
```

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

## UI model

- The editor cards reserve matching status/footer space so the input and output panels keep the same visual height.


## Layout notes

The input and output editor cards use matching fixed header, action, textarea, and status rows so their top and bottom edges line up. The side rail moves below the editors before the editor columns become too narrow for the copy controls.
