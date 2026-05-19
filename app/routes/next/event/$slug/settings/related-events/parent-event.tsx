import { type LoaderFunctionArgs } from "react-router";
import { invariantResponse } from "~/lib/utils/response";
import { languageModuleMap } from "~/locales/.server";
import { detectLanguage } from "~/root.server";

export async function loader(args: LoaderFunctionArgs) {
  const { request, params } = args;
  invariantResponse(typeof params.slug === "string", "slug is not defined", {
    status: 400,
  });

  const language = await detectLanguage(request);
  const locales =
    languageModuleMap[language][
      "next/event/$slug/settings/related-events/parent-event"
    ];

  return {
    locales,
  };
}

function ParentEvent() {
  return <>Parent Event</>;
}

export default ParentEvent;
