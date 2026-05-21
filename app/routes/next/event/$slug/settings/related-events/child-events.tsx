import { redirect, useLoaderData, type LoaderFunctionArgs } from "react-router";
import { createAuthClient, getSessionUser } from "~/auth.server";
import { invariantResponse } from "~/lib/utils/response";
import { languageModuleMap } from "~/locales/.server";
import { detectLanguage } from "~/root.server";
import { getRedirectPathOnProtectedEventRoute } from "../../settings.server";
import { getEventBySlug } from "./child-events.server";
import TitleSection from "~/components/next/TitleSection";
import Hint from "~/components/next/Hint";

export async function loader(args: LoaderFunctionArgs) {
  const { request, params } = args;
  invariantResponse(typeof params.slug === "string", "slug is not defined", {
    status: 400,
  });

  const { authClient } = createAuthClient(request);
  const sessionUser = await getSessionUser(authClient);
  const redirectPath = await getRedirectPathOnProtectedEventRoute({
    request,
    slug: params.slug,
    sessionUser,
    authClient,
  });
  if (redirectPath !== null) {
    return redirect(redirectPath);
  }

  invariantResponse(sessionUser !== null, "Unauthorized", { status: 401 }); // Needed for type narrowing

  const language = await detectLanguage(request);
  const locales =
    languageModuleMap[language][
      "next/event/$slug/settings/related-events/child-events"
    ];

  const event = await getEventBySlug({
    authClient,
    sessionUser,
    slug: params.slug,
  });

  invariantResponse(event !== null, "Event not found", { status: 404 });

  return {
    locales,
    event,
  };
}

function ChildEvents() {
  const loaderData = useLoaderData<typeof loader>();
  const { locales, event } = loaderData;

  return (
    <>
      {event.parentEventId !== null ? (
        <>
          <TitleSection>
            <TitleSection.Headline>
              {locales.route.addOrCreate.headline}
            </TitleSection.Headline>
          </TitleSection>
          <Hint>
            <Hint.InfoIcon />
            {locales.route.addOrCreate.hasParentEventHint}
          </Hint>
        </>
      ) : (
        <></>
      )}
    </>
  );
}

export default ChildEvents;
