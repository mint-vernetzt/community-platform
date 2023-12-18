export default {
  supportedLngs: ["de", "en"],
  fallbackLng: "de",
  debug: false,
  interpolation: {
    escapeValue: false,
  },
  react: {
    bindI18n: "languageChanged",
    transSupportBasicHtmlNodes: true,
    transKeepBasicHtmlNodesFor: ["br", "strong", "i", "p", "b", "span"],
    useSuspense: false,
  },
};
