# Copy Sanitizer

A static GitHub Pages app for cleaning copied text and preparing it for a target destination such as Gmail, Google Docs, Microsoft Word, Markdown/chat, Outlook, CMS/forms, code comments, or strict ASCII workflows.

The app runs fully in the browser. It does not send text to a server.

## Current model

The app now uses controlled textarea-like `contenteditable` panels instead of plain `<textarea>` fields.

Why: a textarea can only show plain text. Clipboard data often includes both `text/html` and `text/plain`, and list structure may be present only in the HTML version. The app intercepts paste, reads `text/html` first when available, parses paragraphs and lists into an internal document model, and then renders the parsed result back into the input panel so the user can see what the clipboard actually contained.

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


## Preview policy

The input panel is a structural preview of the parsed clipboard payload. It renders paragraphs and semantic lists from clipboard HTML when available instead of flattening them into textarea text.

The output panel is also structural:

- Gmail shows Verdana-style Gmail paragraphs and semantic HTML lists by default.
- Google Docs and Microsoft Word show document-style typography and semantic lists.
- Plain text and Strict ASCII show the plain-text serialization.

The visible preview is not a raw-code view. The primary copy button writes the selected destination payload; Copy visible text writes the plain visible-text fallback.

## Destination profiles

### Gmail

Visible output uses keyboard-safe punctuation and the locally saved Gmail font/size preference:

- straight quotes
- straight apostrophes
- ` -- ` instead of em dash
- `...` instead of Unicode ellipsis
- normal spaces only

Primary copy writes Gmail-shaped `text/html` using the selected Gmail font/size:

```html
<div><div class="gmail_default" style="font-family: verdana, sans-serif; font-size: 10pt;">Paragraph one</div><div class="gmail_default" style="font-family: verdana, sans-serif; font-size: 10pt;"><br></div><div class="gmail_default" style="font-family: verdana, sans-serif; font-size: 10pt;">Paragraph two<br></div><br clear="all"></div>
```

The app does not intentionally insert zero-width spaces, spans, font tags, color styles, background-color styles, line-height styles, or extra wrappers.

Detected lists are preserved for Gmail as semantic list HTML by default:

```html
<ul style="font-family: verdana, sans-serif; font-size: 10pt;"><li class="gmail_default" style="font-family: verdana, sans-serif; font-size: 10pt;">First item</li><li class="gmail_default" style="font-family: verdana, sans-serif; font-size: 10pt;">Second item</li></ul>
```

An advanced option can flatten Gmail lists to plain hyphen lines when a deliberately plain fallback is needed. The Gmail font and size controls are saved locally and applied to both the preview and copied HTML.

### Google Docs

Visible output uses document-style typography:

- curly quotes
- curly apostrophes
- em dashes
- numeric en dashes
- ellipsis characters
- measurement primes when enabled

Primary copy writes `text/html` plus `text/plain`. HTML copy preserves semantic lists using `<ul>`, `<ol>`, and `<li>`.

### Microsoft Word

Word uses the same document typography profile as Google Docs by default. Primary copy writes `text/html` plus `text/plain`, so Word can receive semantic lists and then apply its paste behavior.

### Plain text / forms

Copies `text/plain` only. Lists use plain hyphen or numbered lines.

### Strict ASCII

Aggressively replaces or removes non-ASCII characters. Lists use plain hyphen or numbered lines.

## List policy

Bullets are no longer treated as a global character replacement.

The app detects list structure during paste:

1. If clipboard HTML contains `<ul>`, `<ol>`, or `<li>`, it stores list structure in the internal document model.
2. If only plain text is available, it detects lines beginning with markers such as `*`, `-`, `•`, and numbered items such as `1.`.
3. Each destination decides how lists are rendered and copied. Gmail, Google Docs, Microsoft Word, and Outlook preserve semantic lists by default; Markdown/chat, CMS, code comments, Plain text, and Strict ASCII flatten them to plain text.

This replaces the old blanket rule of converting bullet characters to hyphens.

## Character cleanup

The app can remove or normalize:

- hidden Unicode characters
- zero-width spaces
- word joiners
- soft hyphens
- directional marks
- unusual spaces
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

## Inspector

The Inspector reports:

- character counts
- source changes
- destination typography changes
- hidden characters removed
- remaining non-ASCII characters
- clipboard source used
- whether clipboard HTML was available
- detected list count
- detected list-item count
- primary copy formats for the selected destination
- browser Clipboard API compatibility

## Deployment

The project is static. Deploy the repository root to GitHub Pages.

Required root files:

```text
index.html
styles.css
app.js
README.md
.nojekyll
```
