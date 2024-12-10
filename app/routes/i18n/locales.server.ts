import fsExtra from "fs-extra";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

export function getLocaleFiles(locale: string) {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  const dirPath = resolve(__dirname, `../../locales/${locale}`);
  const files = fsExtra.readdirSync(dirPath);
  const localeFiles: Record<string, any> = {};

  for (const file of files) {
    const filePath = resolve(dirPath, file);
    if (fsExtra.statSync(filePath).isDirectory()) {
      const nestedFiles = getLocaleFiles(`${locale}/${file}`);
      Object.keys(nestedFiles).forEach((nestedKey) => {
        localeFiles[`${file}-${nestedKey}`] = nestedFiles[nestedKey];
      });
    } else if (file.endsWith(".json")) {
      const key = file.replace(".json", "");
      localeFiles[key] = JSON.parse(fsExtra.readFileSync(filePath, "utf-8"));
    } else {
      continue;
    }
  }

  return localeFiles;
}
