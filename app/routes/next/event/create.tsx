import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { redirect, useLoaderData } from "react-router";
import {
  createAuthClient,
  getSessionUserOrRedirectPathToLogin,
  getSessionUserOrThrow,
} from "~/auth.server";
import { detectLanguage } from "~/i18n.server";
import { languageModuleMap } from "~/locales/.server";
import { checkFeatureAbilitiesOrThrow } from "~/routes/feature-access.server";

export const loader = async (args: LoaderFunctionArgs) => {
  const { request } = args;
  const { authClient } = createAuthClient(request);
  const { sessionUser, redirectPath } =
    await getSessionUserOrRedirectPathToLogin(authClient, request);

  if (sessionUser === null && redirectPath !== null) {
    return redirect(redirectPath);
  }

  const language = await detectLanguage(request);
  const locales = languageModuleMap[language]["next/event/create"];

  await checkFeatureAbilitiesOrThrow(authClient, "next_event_create");
  await checkFeatureAbilitiesOrThrow(authClient, "events");

  return { locales };
};

export const action = async (args: ActionFunctionArgs) => {
  const { request } = args;
  const { authClient } = createAuthClient(request);
  await getSessionUserOrThrow(authClient);
  await checkFeatureAbilitiesOrThrow(authClient, "next_event_create");
  await checkFeatureAbilitiesOrThrow(authClient, "events");

  return null;
};

export default function Create() {
  const loaderData = useLoaderData<typeof loader>();
  const { locales } = loaderData;

  return <h1>{locales.route.headline}</h1>;
}
