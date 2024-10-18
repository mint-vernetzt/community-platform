import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { createAuthClient, getSessionUser } from "~/auth.server";
import i18next from "~/i18next.server";
import { checkFeatureAbilitiesOrThrow } from "~/lib/utils/application";
import { getParamValueOrThrow } from "~/lib/utils/routes";
import { detectLanguage } from "~/root.server";
import { deriveOrganizationMode } from "~/routes/organization/$slug/utils.server";
import {
  addImgUrls,
  filterOrganization,
  getOrganization,
} from "./events.server";
import { invariantResponse } from "~/lib/utils/response";
import { useTranslation } from "react-i18next";
import { useLoaderData } from "@remix-run/react";
import { Container, ListItem } from "~/routes/my/__events.components";
import { i18nNS } from "./__events.shared";
import { ListContainer } from "~/routes/my/__components";

export const handle = {
  i18n: i18nNS,
};

export const loader = async (args: LoaderFunctionArgs) => {
  const { request, params } = args;

  const { authClient } = createAuthClient(request);
  await checkFeatureAbilitiesOrThrow(authClient, "next-organization-detail");
  const slug = getParamValueOrThrow(params, "slug");
  const sessionUser = await getSessionUser(authClient);
  const mode = await deriveOrganizationMode(sessionUser, slug);
  const locale = detectLanguage(request);
  const t = await i18next.getFixedT(locale, i18nNS);

  const organization = await getOrganization(slug);
  invariantResponse(
    organization !== null,
    t("server.error.organizationNotFound"),
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

  return json({
    organization: enhancedOrganization,
  });
};

function Network() {
  const { t } = useTranslation(i18nNS);
  const loaderData = useLoaderData<typeof loader>();
  const { organization } = loaderData;

  return (
    <Container.Section className="-mv-mt-4 @md:-mv-mt-6 @lg:-mv-mt-8 mv-pt-10 @sm:mv-py-8 @sm:mv-px-4 @lg:mv-px-6 mv-flex mv-flex-col mv-gap-10 @sm:mv-border-b @sm:mv-border-x @sm:mv-border-neutral-200 mv-bg-white @sm:mv-rounded-b-2xl">
      {organization.futureEvents.length > 0 ? (
        <div className="mv-flex mv-flex-col mv-gap-4">
          <h2 className="mv-mb-0 mv-text-neutral-700 mv-text-xl mv-font-bold mv-leading-6">
            {t("headlines.futureEvents")}
          </h2>
          <ListContainer listKey="future-events" hideAfter={3}>
            {organization.futureEvents.map((relation, index) => {
              return (
                <ListItem.Event
                  key={`future-event-${relation.event.slug}`}
                  to={`/event/${relation.event.slug}`}
                  listIndex={index}
                  hideAfter={3}
                >
                  <ListItem.Event.Image
                    src={relation.event.background}
                    blurredSrc={relation.event.blurredBackground}
                    alt={relation.event.name}
                  />
                  <ListItem.Event.Content event={relation.event} />
                </ListItem.Event>
              );
            })}
          </ListContainer>
        </div>
      ) : null}
      {organization.pastEvents.length > 0 ? (
        <div className="mv-flex mv-flex-col mv-gap-4">
          <h2 className="mv-mb-0 mv-text-neutral-700 mv-text-xl mv-font-bold mv-leading-6">
            {t("headlines.pastEvents")}
          </h2>
          <ListContainer listKey="past-events" hideAfter={3}>
            {organization.pastEvents.map((relation, index) => {
              return (
                <ListItem.Event
                  key={`past-event-${relation.event.slug}`}
                  to={`/event/${relation.event.slug}`}
                  listIndex={index}
                  hideAfter={3}
                >
                  <ListItem.Event.Image
                    src={relation.event.background}
                    blurredSrc={relation.event.blurredBackground}
                    alt={relation.event.name}
                  />
                  <ListItem.Event.Content event={relation.event} />
                </ListItem.Event>
              );
            })}
          </ListContainer>
        </div>
      ) : null}
    </Container.Section>
  );
}

export default Network;
