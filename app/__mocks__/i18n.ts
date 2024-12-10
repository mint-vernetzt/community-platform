import { getLocaleFiles } from "./locales.server";

const supportedLngs = ["de", "en"];

const fallbackLng = "de";

const defaultNS = "meta";

const resources = {
  de: getLocaleFiles("de"),
  en: getLocaleFiles("en"),
};

export { supportedLngs, fallbackLng, defaultNS, resources };
