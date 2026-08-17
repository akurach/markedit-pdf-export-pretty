/**
 * Turns highlighted <pre><code> blocks into single-cell tables of per-line
 * divs, so pdfmake gets a full-width background and guaranteed line breaks.
 */

// GitHub-light-ish colors for highlight.js token classes.
const HLJS_COLORS: Record<string, string> = {
  comment: '#6e7781',
  quote: '#6e7781',
  keyword: '#cf222e',
  'selector-tag': '#116329',
  'template-tag': '#cf222e',
  doctag: '#cf222e',
  string: '#0a3069',
  regexp: '#0a3069',
  'template-variable': '#0a3069',
  number: '#0550ae',
  literal: '#0550ae',
  symbol: '#0550ae',
  bullet: '#0550ae',
  link: '#0550ae',
  meta: '#8250df',
  title: '#8250df',
  section: '#8250df',
  'title.function': '#8250df',
  'title.class': '#953800',
  type: '#953800',
  'built_in': '#953800',
  attr: '#0550ae',
  attribute: '#0550ae',
  variable: '#953800',
  params: '#24292f',
  name: '#116329',
  tag: '#116329',
  addition: '#116329',
  deletion: '#82071e',
};

interface Run {
  text: string;
  color?: string;
}

function colorForElement(el: Element, inherited?: string): string | undefined {
  for (const cls of Array.from(el.classList)) {
    if (cls.startsWith('hljs-')) {
      const token = cls.slice(5);
      if (HLJS_COLORS[token]) {
        return HLJS_COLORS[token];
      }
    }
  }
  return inherited;
}

function extractRuns(node: Node, color: string | undefined, lines: Run[][]): void {
  if (node.nodeType === 3 /* TEXT_NODE */) {
    const parts = (node.textContent ?? '').split('\n');
    parts.forEach((part, index) => {
      if (index > 0) {
        lines.push([]);
      }
      if (part.length > 0) {
        lines[lines.length - 1].push({ text: part, color });
      }
    });
    return;
  }
  if (node.nodeType === 1 /* ELEMENT_NODE */) {
    const el = node as Element;
    const next = colorForElement(el, color);
    for (const child of Array.from(el.childNodes)) {
      extractRuns(child, next, lines);
    }
  }
}

export const CODE_BLOCK_LAYOUT = 'codeBlock';
export const CODE_BG = '#f6f8fa';

export function transformCodeBlocks(doc: Document): void {
  for (const pre of Array.from(doc.querySelectorAll('pre'))) {
    const code = pre.querySelector('code');
    if (!code) {
      continue;
    }
    const lines: Run[][] = [[]];
    extractRuns(code, undefined, lines);
    // Drop the trailing empty line markdown-it always leaves after the final \n.
    while (lines.length > 1 && lines[lines.length - 1].length === 0) {
      lines.pop();
    }

    const table = doc.createElement('table');
    table.setAttribute('data-pdfmake', JSON.stringify({ layout: CODE_BLOCK_LAYOUT, widths: ['*'] }));
    const row = doc.createElement('tr');
    const cell = doc.createElement('td');
    cell.setAttribute('data-pdfmake', JSON.stringify({ fillColor: CODE_BG }));

    for (const line of lines) {
      const div = doc.createElement('div');
      div.setAttribute('class', 'codeline');
      if (line.length === 0) {
        div.textContent = ' ';
      } else {
        for (const run of line) {
          const span = doc.createElement('span');
          span.textContent = run.text;
          if (run.color) {
            span.setAttribute('style', `color:${run.color}`);
          }
          div.appendChild(span);
        }
      }
      cell.appendChild(div);
    }

    row.appendChild(cell);
    table.appendChild(row);
    pre.replaceWith(table);
  }
}
