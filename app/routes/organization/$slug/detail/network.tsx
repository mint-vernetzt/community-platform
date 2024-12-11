import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { useTranslation } from "react-i18next";
import { createAuthClient, getSessionUser } from "~/auth.server";
import i18next from "~/i18next.server";
import { invariantResponse } from "~/lib/utils/response";
import { getParamValueOrThrow } from "~/lib/utils/routes";
import { detectLanguage } from "~/root.server";
import { ListContainer, ListItem } from "~/routes/my/__components";
import { Container } from "~/routes/my/__events.components";
import { deriveOrganizationMode } from "~/routes/organization/$slug/utils.server";
import { i18nNS } from "./__network.shared";
import {
  addImgUrls,
  filterOrganization,
  getOrganization,
} from "./network.server";

export const handle = {
  i18n: i18nNS,
};

export const loader = async (args: LoaderFunctionArgs) => {
  const { request, params } = args;

  const { authClient } = createAuthClient(request);
  const slug = getParamValueOrThrow(params, "slug");
  const sessionUser = await getSessionUser(authClient);
  const mode = await deriveOrganizationMode(sessionUser, slug);
  const locale = await detectLanguage(request);
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
      {organization.memberOf.length > 0 ? (
        <div className="mv-flex mv-flex-col mv-gap-4">
          <h2 className="mv-mb-0 mv-text-neutral-700 mv-text-xl mv-font-bold mv-leading-6">
            {t("headlines.memberOf")}
          </h2>
          <ListContainer listKey="member-of-networks">
            {organization.memberOf.map((relation, index) => {
              return (
                <ListItem
                  key={`member-of-network-${relation.network.slug}`}
                  listIndex={index}
                  entity={relation.network}
                />
              );
            })}
          </ListContainer>
        </div>
      ) : null}
      {organization.networkMembers.length > 0 ? (
        <div className="mv-flex mv-flex-col mv-gap-4">
          <h2 className="mv-mb-0 mv-text-neutral-700 mv-text-xl mv-font-bold mv-leading-6">
            {t("headlines.networkMembers")}
          </h2>
          <ListContainer listKey="member-of-networks">
            {organization.networkMembers.map((relation, index) => {
              return (
                <ListItem
                  key={`network-member-${relation.networkMember.slug}`}
                  listIndex={index}
                  entity={relation.networkMember}
                />
              );
            })}
          </ListContainer>
        </div>
      ) : null}
    </Container.Section>
  );
}

export default Network;
