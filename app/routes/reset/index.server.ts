import { type supportedCookieLanguages } from "~/i18n.shared";
import { type ArrayElement } from "~/lib/utils/types";
import { type languageModuleMap } from "~/locales/.server";

export type ResetPasswordLocales = (typeof languageModuleMap)[ArrayElement<
  typeof supportedCookieLanguages
>]["reset/index"];
