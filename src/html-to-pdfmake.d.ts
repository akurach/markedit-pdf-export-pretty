declare module 'html-to-pdfmake' {
  import type { Content } from 'pdfmake/interfaces';

  interface HtmlToPdfmakeOptions {
    window?: Window & typeof globalThis;
    defaultStyles?: Record<string, unknown>;
    tableAutoSize?: boolean;
    removeExtraBlanks?: boolean;
    imagesByReference?: boolean;
  }

  export default function htmlToPdfmake(html: string, options?: HtmlToPdfmakeOptions): Content;
}
