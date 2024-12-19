import { type supportedCookieLanguages } from "~/i18n.shared";
import { type ArrayElement } from "~/lib/utils/types";
import { type languageModuleMap } from "~/locales/.server";

export type DeleteOrganizationLocales = (typeof languageModuleMap)[ArrayElement<
  typeof supportedCookieLanguages
>]["next/organization/$slug/settings/danger-zone/delete"];
