import { type supportedCookieLanguages } from "~/i18n.shared";
import { type ArrayElement } from "~/lib/utils/types";
import { type languageModuleMap } from "~/locales/.server";

export type SearchEventsLocales = (typeof languageModuleMap)[ArrayElement<
  typeof supportedCookieLanguages
>]["search/events"];
