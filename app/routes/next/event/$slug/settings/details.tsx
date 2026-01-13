import type { LoaderFunctionArgs } from "react-router";
import { detectLanguage } from "~/i18n.server";
import { invariantResponse } from "~/lib/utils/response";
import { LastTimeStamp } from "~/lib/utils/searchParams";
import { languageModuleMap } from "~/locales/.server";
import { getFormPersistenceTimestamp } from "~/utils.server";
import { getEventBySlug } from "./details.server";

export const loader = async (args: LoaderFunctionArgs) => {
  const { request, params } = args;
  invariantResponse(typeof params.slug === "string", "slug is not defined", {
    status: 400,
  });

  const language = await detectLanguage(request);
  const locales =
    languageModuleMap[language]["next/event/$slug/settings/details"];

  const event = await getEventBySlug(params.slug);
  invariantResponse(event !== null, "Event not found", { status: 404 });

  const url = new URL(request.url);
  const lastTimeStampParam = url.searchParams.get(LastTimeStamp);
  const currentTimestamp = getFormPersistenceTimestamp(lastTimeStampParam);

  return { locales, language, event, currentTimestamp };
};

export default function Details() {
  return <>Details</>;
}
