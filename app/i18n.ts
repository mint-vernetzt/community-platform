import { serverOnly$ } from "vite-env-only/macros";
import { getLocaleFiles } from "./routes/i18n/locales.server";

// This is the list of languages your application supports, the last one is your
// fallback language
export const supportedLngs = ["de", "en"];

// This is the language you want to use in case
// the user language is not in the supportedLngs
export const fallbackLng = "de";

// The default namespace of i18next is "translation", but you can customize it
export const defaultNS = "meta";

// Dynamically load locale files
export const resources = serverOnly$({
  de: getLocaleFiles("de"),
  en: getLocaleFiles("en"),
});
