/** DOM transforms that need no MarkEdit API (testable outside the app). */

export function transformTaskLists(doc: Document): void {
  // Roboto lacks ballot-box glyphs; JetBrains Mono ('taskbox' style) has □ and ✓.
  for (const input of Array.from(doc.querySelectorAll('input.task-list-item-checkbox'))) {
    const checked = input.hasAttribute('checked');
    const box = doc.createElement('span');
    box.setAttribute('class', 'taskbox');
    box.setAttribute('style', `color:${checked ? '#1a7f37' : '#57606a'}`);
    box.textContent = checked ? '✓ ' : '□ ';
    input.replaceWith(box);
  }
}

export function transformDefLists(doc: Document): void {
  // html-to-pdfmake has no dl/dt/dd support; flatten to styled paragraphs.
  for (const dl of Array.from(doc.querySelectorAll('dl'))) {
    const container = doc.createElement('div');
    for (const child of Array.from(dl.children)) {
      const p = doc.createElement('p');
      if (child.tagName === 'DT') {
        const strong = doc.createElement('strong');
        while (child.firstChild) {
          strong.appendChild(child.firstChild);
        }
        p.appendChild(strong);
        p.setAttribute('style', 'margin-bottom:2px');
      } else {
        while (child.firstChild) {
          p.appendChild(child.firstChild);
        }
        p.setAttribute('style', 'margin-left:16px;margin-top:0px');
      }
      container.appendChild(p);
    }
    dl.replaceWith(container);
  }
}

export function cleanupFootnotes(doc: Document): void {
  // Back-reference arrows are navigation chrome; meaningless in a PDF.
  for (const backref of Array.from(doc.querySelectorAll('a.footnote-backref'))) {
    backref.remove();
  }
}
