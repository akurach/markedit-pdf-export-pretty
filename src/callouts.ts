/**
 * GitHub-style callouts: blockquotes starting with [!NOTE], [!TIP],
 * [!IMPORTANT], [!WARNING], [!CAUTION] become colored panels in the PDF.
 */

interface CalloutStyle {
  title: string;
  accent: string;
  fill: string;
  layout: string;
}

export const CALLOUTS: Record<string, CalloutStyle> = {
  NOTE: { title: 'Note', accent: '#0969da', fill: '#f0f6ff', layout: 'calloutNote' },
  TIP: { title: 'Tip', accent: '#1a7f37', fill: '#effaf2', layout: 'calloutTip' },
  IMPORTANT: { title: 'Important', accent: '#8250df', fill: '#f7f2fd', layout: 'calloutImportant' },
  WARNING: { title: 'Warning', accent: '#9a6700', fill: '#fff8e5', layout: 'calloutWarning' },
  CAUTION: { title: 'Caution', accent: '#cf222e', fill: '#fdf1f2', layout: 'calloutCaution' },
};

const MARKER = /^\s*\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*(<br\s*\/?>)?\s*/i;

export function transformCallouts(doc: Document): void {
  for (const quote of Array.from(doc.querySelectorAll('blockquote'))) {
    const first = quote.querySelector('p');
    if (!first) {
      continue;
    }
    const match = MARKER.exec(first.innerHTML);
    if (!match) {
      continue;
    }
    const style = CALLOUTS[match[1].toUpperCase()];
    first.innerHTML = first.innerHTML.replace(MARKER, '');
    if (first.innerHTML.trim() === '') {
      first.remove();
    }

    const table = doc.createElement('table');
    table.setAttribute('data-pdfmake', JSON.stringify({ layout: style.layout, widths: ['*'] }));
    const row = doc.createElement('tr');
    const cell = doc.createElement('td');
    cell.setAttribute('data-pdfmake', JSON.stringify({ fillColor: style.fill }));

    const heading = doc.createElement('p');
    const label = doc.createElement('strong');
    label.textContent = style.title;
    label.setAttribute('style', `color:${style.accent}`);
    heading.appendChild(label);
    cell.appendChild(heading);

    while (quote.firstChild) {
      cell.appendChild(quote.firstChild);
    }
    row.appendChild(cell);
    table.appendChild(row);
    quote.replaceWith(table);
  }
}
