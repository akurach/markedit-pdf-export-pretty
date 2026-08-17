# MarkEdit PDF Export (Pretty)

A [MarkEdit](https://markedit.app) extension that exports the current Markdown document as a nicely rendered PDF — headings, lists, tables, code blocks, blockquotes, links, and images, with Cyrillic support. Not a dump of raw Markdown.

## Usage

In MarkEdit: **Extensions → Export as PDF…** (or ⌘⇧E), pick where to save.

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

## Notes

- Only PNG/JPEG images are embedded (pdfmake limitation); others are replaced with an `[image: …]` placeholder.
- Default text font is Roboto (bundled with pdfmake), which covers Latin and Cyrillic.
- Font collections (`.ttc`) such as San Francisco and Helvetica cannot be embedded — pdfmake only accepts single-face `.ttf`/`.otf` files.
