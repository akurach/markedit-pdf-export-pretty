import { JSDOM } from 'jsdom';
import fs from 'node:fs';
import MarkdownIt from 'markdown-it';
import hljs from 'highlight.js/lib/common';
import footnote from 'markdown-it-footnote';
import taskLists from 'markdown-it-task-lists';
import deflist from 'markdown-it-deflist';
import mark from 'markdown-it-mark';
import sub from 'markdown-it-sub';
import sup from 'markdown-it-sup';
import { transformCallouts } from '../src/callouts';
import { transformCodeBlocks } from '../src/codeblocks';
import { transformTaskLists, transformDefLists, cleanupFootnotes } from '../src/transforms';
import { buildPdf } from '../src/pdf';

const dom = new JSDOM('<!doctype html><html><body></body></html>');
globalThis.window = dom.window;
globalThis.document = dom.window.document;
globalThis.DOMParser = dom.window.DOMParser;

const md = new MarkdownIt({
  html: true, linkify: true, typographer: true,
  highlight: (str, lang) => (lang && hljs.getLanguage(lang)) ? hljs.highlight(str, { language: lang, ignoreIllegals: true }).value : '',
}).use(footnote).use(taskLists).use(deflist).use(mark).use(sub).use(sup);

const source = fs.readFileSync(new URL('./fixture.md', import.meta.url), 'utf8');
const body = source.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, '');
const html = md.render(body);
const doc = new dom.window.DOMParser().parseFromString(html, 'text/html');
transformCallouts(doc);
transformCodeBlocks(doc);
transformTaskLists(doc);
transformDefLists(doc);
cleanupFootnotes(doc);

const b64 = await buildPdf(doc.body.innerHTML, 'smoke3', false);
const buf = Buffer.from(b64, 'base64');
console.log('PDF bytes:', buf.length, 'magic:', buf.subarray(0, 5).toString());
fs.writeFileSync(new URL('./smoke-output.pdf', import.meta.url), buf);
console.log('written smoke3.pdf');
