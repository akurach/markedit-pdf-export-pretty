---
title: Full Markdown Showcase
tags: [test]
---

# Full Markdown Showcase

A paragraph with `inline code`, ~~strikethrough~~, ==highlight==, H~2~O and x^2^. A footnote[^1].

## Syntax-highlighted code

```js
// A single-line comment
/* A multi-line
   comment */
function greet(name) {
  const message = `Hello, ${name}!`;
  return message.length > 10 ? message : null;
}
```

```python
import os

def main():
    """Docstring."""
    print("Answer:", 42)
    return 42
```

## Tasks

- [x] a completed task
- [ ] a pending task
- a regular item

## Definition list

Term
: The definition of the term, with details.

Another term
: One more definition.

## SVG inline

<svg width="120" height="60" xmlns="http://www.w3.org/2000/svg"><rect width="120" height="60" rx="8" fill="#0969da"/><circle cx="30" cy="30" r="15" fill="#fff"/><text x="55" y="36" fill="#fff" font-size="14">SVG</text></svg>

## Callout

> [!TIP]
> A tip with `inline code` and **bold text**.

## Table

| Feature   | Status | Notes       |
|-----------|:------:|-------------|
| Code      | done   | highlighted |
| Footnotes | done   | at the end  |

## Cyrillic support

Кириллица работает из коробки: **жирный**, *курсив* и `код с кириллицей` — съешь ещё этих мягких французских булок.

[^1]: Footnote text with a [link](https://example.com).
