import { type LoaderFunctionArgs } from "@remix-run/node";
import { redirectWithAlert } from "~/alert.server";
import { detectLanguage } from "~/i18n.server";
import { insertParametersIntoLocale } from "~/lib/utils/i18n";
import { languageModuleMap } from "~/locales/.server";

export const loader = async (args: LoaderFunctionArgs) => {
  const { request } = args;
  const language = await detectLanguage(request);
  const locales = languageModuleMap[language]["$"];

  return redirectWithAlert("/", {
    message: insertParametersIntoLocale(locales.alert.message, {
      url: request.url,
    }),
    level: "negative",
  });
};
