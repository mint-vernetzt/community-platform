import { type LoaderFunctionArgs } from "react-router";
import { redirectWithAlert } from "~/alert.server";
import { createAuthClient, getSessionUser } from "~/auth.server";
import { detectLanguage } from "~/i18n.server";
import { insertParametersIntoLocale } from "~/lib/utils/i18n";
import { languageModuleMap } from "~/locales/.server";

export const loader = async (args: LoaderFunctionArgs) => {
  const { request } = args;
  const language = await detectLanguage(request);
  const locales = languageModuleMap[language]["$"];
  const { authClient } = createAuthClient(request);
  const sessionUser = await getSessionUser(authClient);

  if (sessionUser === null) {
    return redirectWithAlert("/", {
      message: insertParametersIntoLocale(locales.alert.message, {
        url: request.url,
      }),
      level: "negative",
    });
  }
  return redirectWithAlert("/dashboard", {
    message: insertParametersIntoLocale(locales.alert.message, {
      url: request.url,
    }),
    level: "negative",
  });
};
