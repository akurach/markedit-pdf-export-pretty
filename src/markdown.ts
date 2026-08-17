import MarkdownIt from 'markdown-it';
import hljs from 'highlight.js/lib/common';
import footnote from 'markdown-it-footnote';
import taskLists from 'markdown-it-task-lists';
import deflist from 'markdown-it-deflist';
import mark from 'markdown-it-mark';
import sub from 'markdown-it-sub';
import sup from 'markdown-it-sup';
import { MarkEdit } from 'markedit-api';
import { transformCallouts } from './callouts';
import { transformCodeBlocks } from './codeblocks';
import { transformTaskLists, transformDefLists, cleanupFootnotes } from './transforms';

const md: MarkdownIt = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
  highlight: (str, lang) => {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return hljs.highlight(str, { language: lang, ignoreIllegals: true }).value;
      } catch {
        // fall through to no highlighting
      }
    }
    return '';
  },
})
  .use(footnote)
  .use(taskLists)
  .use(deflist)
  .use(mark)
  .use(sub)
  .use(sup);

export interface RenderedMarkdown {
  html: string;
  /** Title from YAML frontmatter, if present. */
  title?: string;
}

/**
 * Render Markdown to HTML with all images resolved to data URLs,
 * since pdfmake cannot load images from the file system or network by itself.
 */
export async function renderMarkdown(source: string, parentPath?: string): Promise<RenderedMarkdown> {
  const { body, title } = stripFrontmatter(source);
  const html = md.render(body);
  const doc = new DOMParser().parseFromString(html, 'text/html');
  transformCallouts(doc);
  transformCodeBlocks(doc);
  transformTaskLists(doc);
  transformDefLists(doc);
  cleanupFootnotes(doc);
  await resolveImages(doc, parentPath);
  return { html: doc.body.innerHTML, title };
}

function stripFrontmatter(source: string): { body: string; title?: string } {
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n/.exec(source);
  if (!match) {
    return { body: source };
  }
  const titleMatch = /^title:\s*["']?(.+?)["']?\s*$/m.exec(match[1]);
  return { body: source.slice(match[0].length), title: titleMatch?.[1] };
}

async function resolveImages(doc: Document, parentPath?: string): Promise<void> {
  const images = Array.from(doc.querySelectorAll('img'));
  await Promise.all(images.map(async (img) => {
    const src = img.getAttribute('src') ?? '';
    const resolved = await resolveImage(src, parentPath);
    if (resolved?.kind === 'raster') {
      img.setAttribute('src', resolved.dataUrl);
    } else if (resolved?.kind === 'svg') {
      const holder = doc.createElement('div');
      holder.innerHTML = resolved.text;
      const svg = holder.querySelector('svg');
      if (svg) {
        img.replaceWith(svg);
        return;
      }
      replaceWithPlaceholder(doc, img, src);
    } else {
      replaceWithPlaceholder(doc, img, src);
    }
  }));
}

function replaceWithPlaceholder(doc: Document, img: Element, src: string): void {
  const alt = img.getAttribute('alt') || src || 'image';
  const placeholder = doc.createElement('em');
  placeholder.textContent = `[image: ${alt}]`;
  img.replaceWith(placeholder);
}

type ResolvedImage = { kind: 'raster'; dataUrl: string } | { kind: 'svg'; text: string };

async function resolveImage(src: string, parentPath?: string): Promise<ResolvedImage | undefined> {
  try {
    if (src.startsWith('data:')) {
      return await normalizeDataUrl(src);
    }
    if (/^https?:\/\//.test(src)) {
      return await fetchImage(src);
    }
    const path = src.startsWith('/')
      ? src
      : parentPath
        ? `${parentPath}/${decodeURIComponent(src)}`
        : undefined;
    if (!path) {
      return undefined;
    }
    const file = await MarkEdit.getFileObject(path);
    if (!file?.data || !file.mimeType?.startsWith('image/')) {
      return undefined;
    }
    if (file.mimeType === 'image/svg+xml') {
      return { kind: 'svg', text: base64ToText(file.data) };
    }
    return await normalizeDataUrl(`data:${file.mimeType};base64,${file.data}`);
  } catch {
    return undefined;
  }
}

async function fetchImage(url: string): Promise<ResolvedImage | undefined> {
  const response = await fetch(url);
  if (!response.ok) {
    return undefined;
  }
  const blob = await response.blob();
  if (blob.type === 'image/svg+xml') {
    return { kind: 'svg', text: await blob.text() };
  }
  if (!blob.type.startsWith('image/')) {
    return undefined;
  }
  const dataUrl = await new Promise<string | undefined>((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => resolve(undefined);
    reader.readAsDataURL(blob);
  });
  return dataUrl ? await normalizeDataUrl(dataUrl) : undefined;
}

/** pdfmake accepts only PNG/JPEG; rasterize everything else through a canvas. */
async function normalizeDataUrl(dataUrl: string): Promise<ResolvedImage | undefined> {
  if (/^data:image\/(png|jpe?g)[;,]/.test(dataUrl)) {
    return { kind: 'raster', dataUrl };
  }
  if (dataUrl.startsWith('data:image/svg+xml')) {
    const [, payload] = dataUrl.split(',', 2);
    const text = dataUrl.includes(';base64')
      ? base64ToText(payload)
      : decodeURIComponent(payload);
    return { kind: 'svg', text };
  }
  const converted = await rasterizeToPng(dataUrl);
  return converted ? { kind: 'raster', dataUrl: converted } : undefined;
}

function rasterizeToPng(dataUrl: string): Promise<string | undefined> {
  return new Promise((resolve) => {
    try {
      const image = new Image();
      image.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = image.naturalWidth;
          canvas.height = image.naturalHeight;
          const context = canvas.getContext('2d');
          if (!context) {
            resolve(undefined);
            return;
          }
          context.drawImage(image, 0, 0);
          resolve(canvas.toDataURL('image/png'));
        } catch {
          resolve(undefined);
        }
      };
      image.onerror = () => resolve(undefined);
      image.src = dataUrl;
    } catch {
      resolve(undefined);
    }
  });
}

function base64ToText(base64: string): string {
  const bytes = atob(base64);
  const buffer = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i += 1) {
    buffer[i] = bytes.charCodeAt(i);
  }
  return new TextDecoder('utf-8').decode(buffer);
}
