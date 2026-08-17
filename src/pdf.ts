import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
import htmlToPdfmake from 'html-to-pdfmake';
import type { TDocumentDefinitions, Content } from 'pdfmake/interfaces';
import { CALLOUTS } from './callouts';
import { CODE_BLOCK_LAYOUT } from './codeblocks';
import { monoFontFiles } from './mono-font';
import type { LoadedFont } from './fonts';

// vfs_fonts export shape differs across pdfmake 0.2.x releases.
const fonts = pdfFonts as unknown as Record<string, unknown>;
const vfs = (fonts.pdfMake as { vfs?: Record<string, string> } | undefined)?.vfs
  ?? (fonts.vfs as Record<string, string> | undefined)
  ?? (fonts as Record<string, string>);
(pdfMake as unknown as { vfs: Record<string, string> }).vfs = vfs;

const ROBOTO = {
  normal: 'Roboto-Regular.ttf',
  bold: 'Roboto-Medium.ttf',
  italics: 'Roboto-Italic.ttf',
  bolditalics: 'Roboto-MediumItalic.ttf',
};

const MONO = {
  normal: 'JetBrainsMono-Regular.ttf',
  bold: 'JetBrainsMono-Bold.ttf',
  italics: 'JetBrainsMono-Italic.ttf',
  bolditalics: 'JetBrainsMono-Bold.ttf',
};

const pdfMakeAny = pdfMake as unknown as {
  vfs: Record<string, string>;
  fonts?: Record<string, typeof ROBOTO>;
};

Object.assign(pdfMakeAny.vfs, monoFontFiles);

/**
 * Register fonts for the next export. A custom text font goes in as 'Custom';
 * a custom code font replaces the 'Mono' family, so styles need no changes.
 */
export function registerFonts(text?: LoadedFont, mono?: LoadedFont): void {
  if (text) {
    Object.assign(pdfMakeAny.vfs, text.vfsFiles);
  }
  if (mono) {
    Object.assign(pdfMakeAny.vfs, mono.vfsFiles);
  }
  pdfMakeAny.fonts = {
    Roboto: ROBOTO,
    Mono: mono ? mono.definition : MONO,
    ...(text ? { Custom: text.definition } : {}),
  };
}
registerFonts();

const COLORS = {
  text: '#1f2328',
  muted: '#57606a',
  border: '#d0d7de',
  codeBg: '#f6f8fa',
  link: '#0a5dc2',
  rule: '#e0e5ea',
};

const calloutLayout = (accent: string) => ({
  hLineWidth: () => 0,
  vLineWidth: (i: number) => (i === 0 ? 2.5 : 0),
  vLineColor: () => accent,
  paddingLeft: () => 10,
  paddingRight: () => 10,
  paddingTop: () => 7,
  paddingBottom: () => 3,
});

const tableLayouts = {
  ...Object.fromEntries(
    Object.values(CALLOUTS).map((c) => [c.layout, calloutLayout(c.accent)]),
  ),
  [CODE_BLOCK_LAYOUT]: {
    hLineWidth: () => 0,
    vLineWidth: () => 0,
    paddingLeft: () => 10,
    paddingRight: () => 10,
    paddingTop: () => 8,
    paddingBottom: () => 8,
  },
  prettyTable: {
    hLineWidth: () => 0.5,
    vLineWidth: () => 0.5,
    hLineColor: () => COLORS.border,
    vLineColor: () => COLORS.border,
    paddingLeft: () => 8,
    paddingRight: () => 8,
    paddingTop: () => 5,
    paddingBottom: () => 5,
  },
};

export function buildPdf(html: string, title: string, useCustomFont = false): Promise<string> {
  const content = htmlToPdfmake(html, {
    window,
    tableAutoSize: true,
    removeExtraBlanks: true,
    defaultStyles: {
      h1: { fontSize: 22, bold: true, color: COLORS.text, margin: [0, 18, 0, 8] },
      h2: { fontSize: 17, bold: true, color: COLORS.text, margin: [0, 16, 0, 6] },
      h3: { fontSize: 14, bold: true, color: COLORS.text, margin: [0, 12, 0, 5] },
      h4: { fontSize: 12, bold: true, color: COLORS.text, margin: [0, 10, 0, 4] },
      h5: { fontSize: 10.5, bold: true, color: COLORS.text, margin: [0, 8, 0, 4] },
      h6: { fontSize: 10, bold: true, color: COLORS.muted, margin: [0, 8, 0, 4] },
      p: { margin: [0, 0, 0, 8] },
      a: { color: COLORS.link, decoration: 'underline' },
      blockquote: {
        margin: [12, 4, 0, 10],
        italics: true,
        color: COLORS.muted,
      },
      pre: {
        margin: [0, 4, 0, 10],
        font: 'Mono',
        fontSize: 8.5,
        color: COLORS.text,
        preserveLeadingSpaces: true,
      },
      code: {
        font: 'Mono',
        fontSize: 8.5,
        color: '#b53d00',
        background: COLORS.codeBg,
      },
      ul: { margin: [0, 0, 0, 8] },
      ol: { margin: [0, 0, 0, 8] },
      li: { margin: [0, 1, 0, 1] },
      hr: { margin: [0, 10, 0, 10], color: COLORS.rule },
      th: { bold: true, fillColor: COLORS.codeBg },
      mark: { background: '#fff8c5' },
      img: { margin: [0, 4, 0, 10] },
    },
  }) as Content;

  applyTableLayout(content);

  const docDefinition: TDocumentDefinitions = {
    info: { title },
    pageSize: 'A4',
    pageMargins: [57, 57, 57, 64],
    content,
    styles: {
      codeline: {
        font: 'Mono',
        fontSize: 8.5,
        lineHeight: 1.3,
        preserveLeadingSpaces: true,
      },
      footnotes: {
        fontSize: 9,
        color: COLORS.muted,
      },
      taskbox: {
        font: 'Mono',
        bold: true,
      },
    },
    defaultStyle: {
      font: useCustomFont ? 'Custom' : 'Roboto',
      fontSize: 10.5,
      lineHeight: 1.35,
      color: COLORS.text,
    },
    footer: (currentPage, pageCount) => ({
      text: `${currentPage} / ${pageCount}`,
      alignment: 'center',
      fontSize: 8.5,
      color: COLORS.muted,
      margin: [0, 24, 0, 0],
    }),
  };

  return new Promise((resolve, reject) => {
    try {
      pdfMake.createPdf(docDefinition, tableLayouts).getBase64(resolve);
    } catch (error) {
      reject(error);
    }
  });
}

function applyTableLayout(node: unknown): void {
  if (Array.isArray(node)) {
    node.forEach(applyTableLayout);
    return;
  }
  if (node && typeof node === 'object') {
    const record = node as Record<string, unknown>;
    if (record.table && !record.layout) {
      record.layout = 'prettyTable';
    }
    Object.values(record).forEach(applyTableLayout);
  }
}
