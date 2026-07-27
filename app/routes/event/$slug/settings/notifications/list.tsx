import { redirect, useLoaderData, type LoaderFunctionArgs } from "react-router";
import { createAuthClient, getSessionUser } from "~/auth.server";
import TitleSection from "~/components/next/TitleSection";
import { invariantResponse } from "~/lib/utils/response";
import { getRedirectPathOnProtectedEventRoute } from "../../settings.server";
import { checkFeatureAbilitiesOrThrow } from "~/routes/feature-access.server";
import { detectLanguage } from "~/i18n.server";
import { languageModuleMap } from "~/locales/.server";

export async function loader(args: LoaderFunctionArgs) {
  const { request, params } = args;
  const { slug } = params;

  invariantResponse(typeof slug === "string", "slug is not defined", {
    status: 400,
  });
  const { authClient } = createAuthClient(request);
  const sessionUser = await getSessionUser(authClient);
  const redirectPath = await getRedirectPathOnProtectedEventRoute({
    request,
    slug,
    sessionUser,
    authClient,
  });
  if (redirectPath !== null) {
    return redirect(redirectPath);
  }
  invariantResponse(sessionUser, "User not authenticated", { status: 401 });
  await checkFeatureAbilitiesOrThrow(authClient, ["events"]);

  const language = await detectLanguage(request);
  const locales =
    languageModuleMap[language]["event/$slug/settings/notifications/list"];

  return { locales };
}

function NotificationsList() {
  const loaderData = useLoaderData<typeof loader>();
  const { locales } = loaderData;

  return (
    <div className="flex flex-col gap-8 pt-4">
      <div className="flex flex-col gap-4">
        <TitleSection>
          <TitleSection.Headline>
            {locales.route.system.title}
          </TitleSection.Headline>
          <TitleSection.Subline>
            {locales.route.system.description}
          </TitleSection.Subline>
        </TitleSection>
        <ul className="flex flex-col border border-neutral-200 rounded-xl *:border-b *:border-neutral-200 *:last:border-b-0 text-neutral-700 text-sm">
          <li className="flex flex-col gap-0.5 p-4">
            <p className="font-semibold">
              {locales.route.system.list.confirmation.title}
            </p>
            <p>{locales.route.system.list.confirmation.description}</p>
          </li>
          <li className="flex flex-col gap-0.5 p-4">
            <p className="font-semibold">
              {locales.route.system.list.moveUpToParticipants.title}
            </p>
            <p>{locales.route.system.list.moveUpToParticipants.description}</p>
          </li>
          <li className="flex flex-col gap-0.5 p-4">
            <p className="font-semibold">
              {locales.route.system.list.cancellation.title}
            </p>
            <p>{locales.route.system.list.cancellation.description}</p>
          </li>
        </ul>
      </div>
    </div>
  );
}

export default NotificationsList;
