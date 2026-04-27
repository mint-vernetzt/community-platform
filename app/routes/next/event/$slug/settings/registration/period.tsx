import { useLoaderData, type LoaderFunctionArgs } from "react-router";
import TitleSection from "~/components/next/TitleSection";
import { detectLanguage } from "~/i18n.server";
import { invariantResponse } from "~/lib/utils/response";
import { languageModuleMap } from "~/locales/.server";
import { getEventBySlug } from "./period.server";

export async function loader(args: LoaderFunctionArgs) {
  const { request, params } = args;
  const { slug } = params;

  invariantResponse(typeof slug === "string", "slug is not defined", {
    status: 400,
  });

  const language = await detectLanguage(request);
  const locales =
    languageModuleMap[language][
      "next/event/$slug/settings/registration/period"
    ];

  const event = await getEventBySlug(slug);

  return { locales, event };
}

function RegistrationPeriod() {
  const loaderData = useLoaderData<typeof loader>();
  const { locales, event } = loaderData;

  return (
    <TitleSection>
      <TitleSection.Headline>{locales.route.headline}</TitleSection.Headline>
      <TitleSection.Subline>{locales.route.subline}</TitleSection.Subline>
    </TitleSection>
  );
}

export default RegistrationPeriod;
