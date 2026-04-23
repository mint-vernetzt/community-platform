import { Form, useLoaderData, type LoaderFunctionArgs } from "react-router";
import Hint from "~/components/next/Hint";
import TitleSection from "~/components/next/TitleSection";
import { detectLanguage } from "~/i18n.server";
import { invariantResponse } from "~/lib/utils/response";
import { languageModuleMap } from "~/locales/.server";
import { getEventBySlug } from "./access.server";

export async function loader(args: LoaderFunctionArgs) {
  const { request, params } = args;
  const { slug } = params;

  invariantResponse(typeof slug === "string", "slug is not defined", {
    status: 400,
  });

  const language = await detectLanguage(request);
  const locales =
    languageModuleMap[language][
      "next/event/$slug/settings/registration/access"
    ];

  const event = await getEventBySlug(slug);
  invariantResponse(event !== null, "Event not found", { status: 404 });

  return { locales, event };
}

function RegistrationAccess() {
  const loaderData = useLoaderData<typeof loader>();
  const { locales, event } = loaderData;

  event.published = true;

  return (
    <div className="flex flex-col gap-8 pt-4">
      <div className="flex flex-col gap-4">
        <TitleSection>
          <TitleSection.Headline>
            {locales.route.type.headline}
          </TitleSection.Headline>
          <TitleSection.Subline>
            {locales.route.type.subline}
          </TitleSection.Subline>
        </TitleSection>
        <Hint>
          <Hint.InfoIcon />
          {locales.route.type.hint}
        </Hint>
        <Form method="post" className="flex flex-col gap-4">
          <button
            type="submit"
            name="type"
            value="internal"
            className="w-full p-4 rounded-lg hover:bg-neutral-100 ring focus:outline-none focus:ring-2 focus:ring-primary-200"
          >
            <div className="w-full flex gap-2 items-center">
              <div className="w-5 h-5 rounded-full bg-white border border-neutral-700 flex items-center justify-center">
                <div className="w-3.5 h-3.5 rounded-full bg-primary-700 border border-neutral-700" />
              </div>
              <div className="inline-flex flex-col items-start text-neutral-700">
                <span className="font-semibold">
                  {locales.route.type.internal.headline}
                </span>
                <span className="text-sm">
                  {locales.route.type.internal.subline}
                </span>
              </div>
            </div>
          </button>
          <button
            type="submit"
            name="type"
            value="external"
            disabled={event.published}
            className="w-full p-4 rounded-lg hover:bg-neutral-100 ring focus:outline-none focus:ring-2 focus:ring-primary-200"
          >
            <div className="w-full flex gap-2 items-center">
              <div className="w-5 h-5 rounded-full bg-white border border-neutral-700 flex items-center justify-center">
                {event.external && (
                  <div className="w-3.5 h-3.5 rounded-full bg-primary-700 border border-neutral-700" />
                )}
              </div>
              <div className="inline-flex flex-col items-start text-neutral-700">
                <span className="font-semibold">
                  {locales.route.type.external.headline}
                </span>
                <span className="text-sm">
                  {locales.route.type.external.subline}
                </span>
              </div>
            </div>
          </button>
        </Form>
      </div>
      <div className="flex flex-col gap-4">
        <TitleSection>
          <TitleSection.Headline>
            {locales.route.access.headline}
          </TitleSection.Headline>
          <TitleSection.Subline>
            {locales.route.access.subline}
          </TitleSection.Subline>
        </TitleSection>
      </div>
    </div>
  );
}

export default RegistrationAccess;
