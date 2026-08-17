---
title: Полный прогон Markdown
tags: [test]
---

# Полный прогон

Абзац с `inline code`, ~~зачёркнутым~~, ==выделенным==, H~2~O и x^2^. Сноска[^1].

## Код с подсветкой

```js
// Комментарий однострочный
/* Многострочный
   комментарий */
function greet(name) {
  const message = `Привет, ${name}!`;
  return message.length > 10 ? message : null;
}
```

```python
import os

def main():
    """Docstring."""
    print("Кириллица в коде: привет")
    return 42
```

## Задачи

- [x] сделанная задача
- [ ] несделанная задача
- обычный пункт

## Definition list

Термин
: Определение термина с пояснением.

Второй термин
: Ещё одно определение.

## SVG inline

<svg width="120" height="60" xmlns="http://www.w3.org/2000/svg"><rect width="120" height="60" rx="8" fill="#0969da"/><circle cx="30" cy="30" r="15" fill="#fff"/><text x="55" y="36" fill="#fff" font-size="14">SVG</text></svg>

## Callout

> [!TIP]
> Совет с `кодом внутри` и **жирным**.

## Таблица

| Функция | Статус | Примечание |
|---------|:------:|------------|
| Код     | ✓      | подсветка  |
| Сноски  | ✓      | внизу      |

[^1]: Текст сноски с [ссылкой](https://example.com).
