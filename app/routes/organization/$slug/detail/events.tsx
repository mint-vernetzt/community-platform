import { type LoaderFunctionArgs } from "react-router";
import { useLoaderData } from "react-router";
import { createAuthClient, getSessionUser } from "~/auth.server";
import { invariantResponse } from "~/lib/utils/response";
import { getParamValueOrThrow } from "~/lib/utils/routes";
import { detectLanguage } from "~/i18n.server";
import { ListContainer } from "~/components-next/ListContainer";
import { Container } from "~/components-next/MyEventsOrganizationDetailContainer";
import { EventListItem } from "~/components-next/EventListItem";
import { deriveOrganizationMode } from "~/routes/organization/$slug/utils.server";
import {
  addImgUrls,
  filterOrganization,
  getOrganization,
} from "./events.server";
import { languageModuleMap } from "~/locales/.server";

export const loader = async (args: LoaderFunctionArgs) => {
  const { request, params } = args;

  const { authClient } = createAuthClient(request);
  const slug = getParamValueOrThrow(params, "slug");
  const sessionUser = await getSessionUser(authClient);
  const mode = await deriveOrganizationMode(sessionUser, slug);
  const language = await detectLanguage(request);
  const locales =
    languageModuleMap[language]["organization/$slug/detail/events"];

  const organization = await getOrganization(slug);
  invariantResponse(
    organization !== null,
    locales.route.server.error.organizationNotFound,
    {
      status: 404,
    }
  );

  let filteredOrganization;
  if (mode === "anon") {
    filteredOrganization = filterOrganization(organization);
  } else {
    filteredOrganization = organization;
  }

  const enhancedOrganization = addImgUrls(authClient, filteredOrganization);

  return {
    organization: enhancedOrganization,
    locales,
    language,
  };
};

function Network() {
  const loaderData = useLoaderData<typeof loader>();
  const { organization, locales, language } = loaderData;

  return (
    <Container.Section className="-mv-mt-4 @md:-mv-mt-6 @lg:-mv-mt-8 mv-pt-10 @sm:mv-py-8 @sm:mv-px-4 @lg:mv-px-6 mv-flex mv-flex-col mv-gap-10 @sm:mv-border-b @sm:mv-border-x @sm:mv-border-neutral-200 mv-bg-white @sm:mv-rounded-b-2xl">
      {organization.futureEvents.length > 0 ? (
        <div className="mv-flex mv-flex-col mv-gap-4">
          <h2 className="mv-mb-0 mv-text-neutral-700 mv-text-xl mv-font-bold mv-leading-6">
            {locales.route.headlines.futureEvents}
          </h2>
          <ListContainer listKey="future-events" locales={locales}>
            {organization.futureEvents.map((relation, index) => {
              return (
                <EventListItem
                  key={`future-event-${relation.event.slug}`}
                  to={`/event/${relation.event.slug}`}
                  listIndex={index}
                >
                  <EventListItem.Image
                    src={relation.event.background}
                    blurredSrc={relation.event.blurredBackground}
                    alt={relation.event.name}
                  />
                  <EventListItem.Content
                    event={relation.event}
                    locales={locales}
                    currentLanguage={language}
                  />
                </EventListItem>
              );
            })}
          </ListContainer>
        </div>
      ) : null}
      {organization.pastEvents.length > 0 ? (
        <div className="mv-flex mv-flex-col mv-gap-4">
          <h2 className="mv-mb-0 mv-text-neutral-700 mv-text-xl mv-font-bold mv-leading-6">
            {locales.route.headlines.pastEvents}
          </h2>
          <ListContainer listKey="past-events" hideAfter={3} locales={locales}>
            {organization.pastEvents.map((relation, index) => {
              return (
                <EventListItem
                  key={`past-event-${relation.event.slug}`}
                  to={`/event/${relation.event.slug}`}
                  listIndex={index}
                  hideAfter={3}
                >
                  <EventListItem.Image
                    src={relation.event.background}
                    blurredSrc={relation.event.blurredBackground}
                    alt={relation.event.name}
                  />
                  <EventListItem.Content
                    event={relation.event}
                    locales={locales}
                    currentLanguage={language}
                  />
                </EventListItem>
              );
            })}
          </ListContainer>
        </div>
      ) : null}
    </Container.Section>
  );
}

export default Network;
