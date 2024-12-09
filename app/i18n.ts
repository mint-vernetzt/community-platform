import { serverOnly$ } from "vite-env-only/macros";
import { getLocaleFiles } from "~/lib/utils/getLocaleFiles";

// This is the list of languages your application supports, the last one is your
// fallback language
export const supportedLngs = ["de", "en"];

// This is the language you want to use in case
// the user language is not in the supportedLngs
export const fallbackLng = "de";

// The default namespace of i18next is "translation", but you can customize it
export const defaultNS = "meta";

// Dynamically load locale files
const deLocaleFiles = getLocaleFiles("de");
const enLocaleFiles = getLocaleFiles("en");

export const resources = serverOnly$({
  de: deLocaleFiles,
  en: enLocaleFiles,
});
