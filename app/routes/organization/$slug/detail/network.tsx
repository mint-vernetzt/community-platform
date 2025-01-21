import { type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { createAuthClient, getSessionUser } from "~/auth.server";
import { invariantResponse } from "~/lib/utils/response";
import { getParamValueOrThrow } from "~/lib/utils/routes";
import { detectLanguage } from "~/i18n.server";
import { ListContainer } from "~/components-next/ListContainer";
import { ListItem } from "~/components-next/ListItem";
import { Container } from "~/components-next/MyEventsOrganizationDetailContainer";
import { deriveOrganizationMode } from "~/routes/organization/$slug/utils.server";
import {
  addImgUrls,
  filterOrganization,
  getOrganization,
} from "./network.server";
import { languageModuleMap } from "~/locales/.server";

export const loader = async (args: LoaderFunctionArgs) => {
  const { request, params } = args;

  const { authClient } = createAuthClient(request);
  const slug = getParamValueOrThrow(params, "slug");
  const sessionUser = await getSessionUser(authClient);
  const mode = await deriveOrganizationMode(sessionUser, slug);
  const language = await detectLanguage(request);
  const locales =
    languageModuleMap[language]["organization/$slug/detail/network"];

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
  };
};

function Network() {
  const loaderData = useLoaderData<typeof loader>();
  const { organization, locales } = loaderData;

  return (
    <Container.Section className="-mv-mt-4 @md:-mv-mt-6 @lg:-mv-mt-8 mv-pt-10 @sm:mv-py-8 @sm:mv-px-4 @lg:mv-px-6 mv-flex mv-flex-col mv-gap-10 @sm:mv-border-b @sm:mv-border-x @sm:mv-border-neutral-200 mv-bg-white @sm:mv-rounded-b-2xl">
      {organization.memberOf.length > 0 ? (
        <div className="mv-flex mv-flex-col mv-gap-4">
          <h2 className="mv-mb-0 mv-text-neutral-700 mv-text-xl mv-font-bold mv-leading-6">
            {locales.route.headlines.memberOf}
          </h2>
          <ListContainer listKey="member-of-networks" locales={locales}>
            {organization.memberOf.map((relation, index) => {
              return (
                <ListItem
                  key={`member-of-network-${relation.network.slug}`}
                  listIndex={index}
                  entity={relation.network}
                  locales={locales}
                />
              );
            })}
          </ListContainer>
        </div>
      ) : null}
      {organization.networkMembers.length > 0 ? (
        <div className="mv-flex mv-flex-col mv-gap-4">
          <h2 className="mv-mb-0 mv-text-neutral-700 mv-text-xl mv-font-bold mv-leading-6">
            {locales.route.headlines.networkMembers}
          </h2>
          <ListContainer listKey="member-of-networks" locales={locales}>
            {organization.networkMembers.map((relation, index) => {
              return (
                <ListItem
                  key={`network-member-${relation.networkMember.slug}`}
                  listIndex={index}
                  entity={relation.networkMember}
                  locales={locales}
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
