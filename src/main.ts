import { MarkEdit } from 'markedit-api';
import type { MenuItem } from 'markedit-api';
import { renderMarkdown } from './markdown';
import { buildPdf, registerFonts } from './pdf';
import { getConfig, loadConfig, saveConfig } from './config';
import type { ExtensionConfig } from './config';
import { scanFontFamilies, loadFontFamily } from './fonts';
import type { FontFamily } from './fonts';

let exporting = false;

async function exportAsPdf(): Promise<void> {
  if (exporting) {
    return;
  }
  exporting = true;
  try {
    const source = MarkEdit.editorAPI.getText();
    if (source.trim().length === 0) {
      await MarkEdit.showAlert('The document is empty — nothing to export.');
      return;
    }

    const fileInfo = await MarkEdit.getFileInfo();
    const baseName = fileInfo
      ? fileInfo.filePath.split('/').pop()!.replace(/\.(md|markdown|txt)$/i, '')
      : 'Untitled';

    const useCustomFont = await prepareFonts();
    const { html, title } = await renderMarkdown(source, fileInfo?.parentPath);
    const data = await buildPdf(html, title ?? baseName, useCustomFont);
    await MarkEdit.showSavePanel({ data, fileName: `${baseName}.pdf` });
  } catch (error) {
    await MarkEdit.showAlert({
      title: 'PDF export failed',
      message: error instanceof Error ? error.message : String(error),
    });
  } finally {
    exporting = false;
  }
}

async function loadConfiguredFamily(familyName: string | undefined, fallbackLabel: string) {
  if (!familyName) {
    return undefined;
  }
  const families = await scanFontFamilies();
  const family = families.find((f) => f.name === familyName);
  const loaded = family ? await loadFontFamily(family) : undefined;
  if (!loaded) {
    await MarkEdit.showAlert({
      title: 'Font not available',
      message: `"${familyName}" could not be loaded; using ${fallbackLabel} instead.`,
    });
  }
  return loaded;
}

/** Load the configured font families into pdfmake; falls back to the embedded defaults. */
async function prepareFonts(): Promise<boolean> {
  const config = getConfig();
  const text = await loadConfiguredFamily(config.fontFamily, 'Roboto');
  const mono = await loadConfiguredFamily(config.codeFontFamily, 'JetBrains Mono');
  registerFonts(text, mono);
  return text !== undefined;
}

function fontMenuItem(key: 'fontFamily' | 'codeFontFamily', family: FontFamily | undefined): MenuItem {
  const name = family?.name;
  return {
    title: name ?? (key === 'fontFamily' ? 'Default (Roboto)' : 'Default (JetBrains Mono)'),
    state: () => ({ isSelected: getConfig()[key] === name }),
    action: () => { void saveConfig({ [key]: name } as Partial<ExtensionConfig>); },
  };
}

async function buildMenu(): Promise<void> {
  await loadConfig();
  const families = await scanFontFamilies().catch(() => [] as FontFamily[]);

  const submenu = (key: 'fontFamily' | 'codeFontFamily'): MenuItem[] => {
    const items: MenuItem[] = [fontMenuItem(key, undefined), { separator: true }];
    if (families.length > 0) {
      items.push(...families.map((f) => fontMenuItem(key, f)));
    } else {
      items.push({ title: 'No system fonts found', state: () => ({ isEnabled: false }) });
    }
    return items;
  };

  MarkEdit.addMainMenuItem({
    title: 'PDF Export',
    icon: 'doc.richtext',
    children: [
      {
        title: 'Export as PDF…',
        key: 'E',
        modifiers: ['Command', 'Shift'],
        action: () => { void exportAsPdf(); },
      },
      { separator: true },
      {
        title: 'Text Font',
        children: submenu('fontFamily'),
      },
      {
        title: 'Code Font',
        children: submenu('codeFontFamily'),
      },
    ],
  });
}

void buildMenu();
