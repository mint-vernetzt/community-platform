import { type supportedCookieLanguages } from "~/i18n";
import { type ArrayElement } from "~/lib/utils/types";
import { type languageModuleMap } from "~/locales-next/.server/utils";

export type SearchProfileLocales = (typeof languageModuleMap)[ArrayElement<
  typeof supportedCookieLanguages
>]["search/profiles"];
