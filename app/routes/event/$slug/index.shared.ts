import { type SUPPORTED_COOKIE_LANGUAGES } from "~/i18n.shared";
import { insertParametersIntoLocale } from "~/lib/utils/i18n";
import { type ArrayElement } from "~/lib/utils/types";

export function formatDateTime(
  date: Date,
  language: ArrayElement<typeof SUPPORTED_COOKIE_LANGUAGES>,
  locales: string
) {
  return insertParametersIntoLocale(locales, {
    date: date.toLocaleDateString(language, {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }),
    time: date.toLocaleTimeString(language, {
      hour: "2-digit",
      minute: "2-digit",
    }),
  });
}
