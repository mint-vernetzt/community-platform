import backend from "i18next-fs-backend/cjs";
import { resolve } from "node:path";
import { RemixI18Next } from "remix-i18next/server";
import i18n from "~/i18n";
import { createCookie } from "@remix-run/node";

const cookie = createCookie("i18next");

const i18next = new RemixI18Next({
  detection: {
    supportedLanguages: i18n.supportedLngs,
    fallbackLanguage: i18n.fallbackLng,
    order: ["cookie"],
    cookie,
  },
  i18next: {
    ...i18n,
    backend: {
      loadPath: function (lng: string, ns: string) {
        return resolve(`./public/locales/${lng}/${ns}.json`);
      },
    },
  },
  plugins: [backend],
});

export default i18next;
