import type { LoaderFunctionArgs } from "react-router";
import { Outlet, redirect, useLoaderData } from "react-router";
import {
  createAuthClient,
  getSessionUserOrRedirectPathToLogin,
} from "~/auth.server";
import { detectLanguage } from "~/i18n.server";
import { invariantResponse } from "~/lib/utils/response";
import { languageModuleMap } from "~/locales/.server";
import { deriveEventMode } from "~/routes/event/utils.server";
import { checkFeatureAbilitiesOrThrow } from "~/routes/feature-access.server";

export const loader = async (args: LoaderFunctionArgs) => {
  const { request, params } = args;
  const slug = params.slug;
  invariantResponse(typeof slug === "string", "Slug is required", {
    status: 400,
  });
  const { authClient } = createAuthClient(request);
  const { sessionUser, redirectPath } =
    await getSessionUserOrRedirectPathToLogin(authClient, request);

  if (sessionUser === null && redirectPath !== null) {
    return redirect(redirectPath);
  }
  const mode = await deriveEventMode(sessionUser, slug);
  invariantResponse(mode === "admin", "Not authorized", { status: 403 });

  const language = await detectLanguage(request);
  const locales = languageModuleMap[language]["next/event/$slug/settings"];

  await checkFeatureAbilitiesOrThrow(authClient, "next_event_settings");
  await checkFeatureAbilitiesOrThrow(authClient, "events");

  return { locales };
};

export default function Settings() {
  const loaderData = useLoaderData<typeof loader>();
  const { locales } = loaderData;

  return (
    <>
      Settings
      <Outlet />
    </>
  );
}
