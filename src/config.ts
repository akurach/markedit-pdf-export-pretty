import { MarkEdit } from 'markedit-api';

export interface ExtensionConfig {
  /** Selected text font family name, or undefined for the built-in Roboto. */
  fontFamily?: string;
  /** Selected code font family name, or undefined for the embedded JetBrains Mono. */
  codeFontFamily?: string;
}

const configPath = (): string =>
  `${MarkEdit.getDirectoryPath('documents')}/markedit-pdf-export-pretty.json`;

let cached: ExtensionConfig = {};

export async function loadConfig(): Promise<ExtensionConfig> {
  try {
    const content = await MarkEdit.getFileContent(configPath());
    cached = content ? (JSON.parse(content) as ExtensionConfig) : {};
  } catch {
    cached = {};
  }
  return cached;
}

export function getConfig(): ExtensionConfig {
  return cached;
}

export async function saveConfig(update: Partial<ExtensionConfig>): Promise<void> {
  cached = { ...cached, ...update };
  await MarkEdit.createFile({
    path: configPath(),
    string: JSON.stringify(cached, null, 2),
    overwrites: true,
  });
}
