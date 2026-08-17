import { MarkEdit } from 'markedit-api';

/** A font family discovered on disk: file paths per style. */
export interface FontFamily {
  name: string;
  normal: string;
  bold?: string;
  italics?: string;
  bolditalics?: string;
}

/** pdfmake font definition: vfs file names per style. */
export interface LoadedFont {
  vfsFiles: Record<string, string>; // vfs file name -> base64
  definition: { normal: string; bold: string; italics: string; bolditalics: string };
}

const FONT_DIRS = (): string[] => {
  const home = MarkEdit.getDirectoryPath('home');
  return [
    `${home}/Library/Fonts`,
    '/Library/Fonts',
    '/System/Library/Fonts',
    '/System/Library/Fonts/Supplemental',
  ];
};

const BOLD = /^(bold|semibold|demibold|heavy|black)$/;
const ITALIC = /^(italic|oblique)$/;
const BOLD_ITALIC = /^(bolditalic|boldoblique|semibolditalic|heavyitalic|blackitalic)$/;
const REGULAR = /^(regular|book|roman|normal|medium)$/;

/**
 * Split a font file name into family + style.
 * Handles "PTSerif-BoldItalic.ttf", "Arial Bold Italic.ttf", "Georgia.ttf".
 */
function parseFileName(fileName: string): { family: string; style: 'normal' | 'bold' | 'italics' | 'bolditalics' } | undefined {
  const match = /\.(ttf|otf)$/i.exec(fileName);
  if (!match) {
    return undefined; // .ttc/.dfont collections are not supported by pdfmake
  }
  const base = fileName.slice(0, -match[0].length);
  const words = base.split(/[-_ ]+/).filter(Boolean);

  const styleTokens: string[] = [];
  while (words.length > 1) {
    const last = words[words.length - 1].toLowerCase();
    if (BOLD.test(last) || ITALIC.test(last) || BOLD_ITALIC.test(last) || REGULAR.test(last)) {
      styleTokens.unshift(last);
      words.pop();
    } else {
      break;
    }
  }

  const joined = styleTokens.join('');
  let style: 'normal' | 'bold' | 'italics' | 'bolditalics' = 'normal';
  const hasBold = styleTokens.some((t) => BOLD.test(t)) || BOLD_ITALIC.test(joined);
  const hasItalic = styleTokens.some((t) => ITALIC.test(t)) || BOLD_ITALIC.test(joined);
  if (hasBold && hasItalic) {
    style = 'bolditalics';
  } else if (hasBold) {
    style = 'bold';
  } else if (hasItalic) {
    style = 'italics';
  }
  return { family: words.join(' '), style };
}

let familiesCache: FontFamily[] | undefined;

export async function scanFontFamilies(): Promise<FontFamily[]> {
  if (familiesCache) {
    return familiesCache;
  }
  const byName = new Map<string, Partial<FontFamily> & { name: string }>();

  for (const dir of FONT_DIRS()) {
    const files = await MarkEdit.listFiles(dir).catch(() => undefined);
    if (!files) {
      continue;
    }
    for (const file of files) {
      const parsed = parseFileName(file);
      if (!parsed) {
        continue;
      }
      const entry = byName.get(parsed.family) ?? { name: parsed.family };
      const path = `${dir}/${file}`;
      // First hit wins: user fonts shadow system fonts of the same family.
      if (!entry[parsed.style]) {
        entry[parsed.style] = path;
      }
      byName.set(parsed.family, entry);
    }
  }

  familiesCache = Array.from(byName.values())
    .filter((f): f is FontFamily => typeof f.normal === 'string')
    .sort((a, b) => a.name.localeCompare(b.name));
  return familiesCache;
}

/**
 * Load a family's font files as base64 for pdfmake's vfs.
 * Missing styles fall back to the regular cut.
 */
export async function loadFontFamily(family: FontFamily): Promise<LoadedFont | undefined> {
  const vfsFiles: Record<string, string> = {};

  const load = async (path: string | undefined): Promise<string | undefined> => {
    if (!path) {
      return undefined;
    }
    const vfsName = `custom-${path.split('/').pop()!}`;
    if (!vfsFiles[vfsName]) {
      const file = await MarkEdit.getFileObject(path);
      if (!file?.data) {
        return undefined;
      }
      vfsFiles[vfsName] = file.data;
    }
    return vfsName;
  };

  const normal = await load(family.normal);
  if (!normal) {
    return undefined;
  }
  const bold = (await load(family.bold)) ?? normal;
  const italics = (await load(family.italics)) ?? normal;
  const bolditalics = (await load(family.bolditalics)) ?? bold;

  return { vfsFiles, definition: { normal, bold, italics, bolditalics } };
}
