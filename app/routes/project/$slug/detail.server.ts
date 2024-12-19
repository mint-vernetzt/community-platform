import { type supportedCookieLanguages } from "~/i18n.shared";
import { type ArrayElement } from "~/lib/utils/types";
import { type languageModuleMap } from "~/locales/.server";

export type ProjectDetailLocales = (typeof languageModuleMap)[ArrayElement<
  typeof supportedCookieLanguages
>]["project/$slug/detail"];
