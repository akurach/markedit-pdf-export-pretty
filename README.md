# MarkEdit PDF Export (Pretty)

**English** | [Русский](README.ru.md)

A [MarkEdit](https://markedit.app) extension that exports the current Markdown document as a nicely rendered PDF — headings, lists, tables, code blocks, blockquotes, links, and images, with Cyrillic support. Not a dump of raw Markdown.

![Markdown source and the exported PDF side by side](screenshots/editor-and-pdf.png)

## Usage

In MarkEdit: **Extensions → PDF Export → Export as PDF…** (or ⌘⇧E), pick where to save.

![The PDF Export menu](screenshots/menu.png)

**Extensions → PDF Export → Text Font / Code Font** let you pick any installed system font (`.ttf`/`.otf`) for body text and code respectively; choices are remembered. Defaults: Roboto for text, JetBrains Mono for code (both embedded — macOS system monospace fonts like Menlo and SF Mono are `.ttc` collections, which pdfmake cannot embed).

Supported Markdown: headings, lists, tables, blockquotes, links, images (PNG/JPEG/SVG; WebP/GIF converted on the fly), fenced code with syntax highlighting (JetBrains Mono), GitHub callouts (`> [!NOTE]` … `[!CAUTION]`) as colored panels, task lists `- [ ]`, footnotes, definition lists, `==mark==`, `~sub~`/`^sup^`, strikethrough, YAML frontmatter (stripped; `title:` becomes PDF metadata).

## Install

```bash
npm install
npm run install-script
```

Then restart MarkEdit.

## How it works

`markdown-it` renders the document to HTML, local/remote images are inlined as data URLs through the MarkEdit API, `html-to-pdfmake` + `pdfmake` produce a vector-text A4 PDF with page numbers, and MarkEdit's native save panel writes it to disk.

## Limitations

- Only PNG/JPEG images are embedded (pdfmake limitation); SVG goes in as vectors, WebP/GIF are converted to PNG via canvas, everything else becomes an `[image: …]` placeholder.
- Default text font is Roboto (bundled with pdfmake), which covers Latin and Cyrillic.
- Font collections (`.ttc`) such as San Francisco, Helvetica, and Menlo cannot be embedded — pdfmake only accepts single-face `.ttf`/`.otf` files.
- Math (KaTeX/LaTeX) is not supported.

## Development

```bash
npm run build       # build dist/markedit-pdf-export-pretty.cjs
npm run typecheck   # type check
npm run smoke       # headless render of test/fixture.md → test/smoke-output.pdf
```
