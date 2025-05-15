import { type LoaderFunctionArgs } from "react-router";
import { useLoaderData } from "react-router";
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
import {
  decideBetweenSingularOrPlural,
  insertParametersIntoLocale,
} from "~/lib/utils/i18n";

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

  // console.log(enhancedOrganization.memberOf)

  type NetworkType = keyof typeof locales.networkTypes;
  const networksByType: {
    [Key in NetworkType]: typeof enhancedOrganization.memberOf;
  } = {
    alliance: [],
    "mint-cluster": [],
    "mint-region": [],
    "national-initiative": [],
    "other-network": [],
  };
  for (const type in locales.networkTypes) {
    networksByType[type as NetworkType] = enhancedOrganization.memberOf.filter(
      (relation) => {
        return relation.network.networkTypes.some(
          (item) => item.networkType.slug === type
        );
      }
    );
  }

  return {
    organization: enhancedOrganization,
    networksByType,
    locales,
  };
};

function Network() {
  const loaderData = useLoaderData<typeof loader>();
  const { organization, locales, networksByType } = loaderData;

  const networkTypeEntries = Object.entries(networksByType) as Array<
    [keyof typeof locales.networkTypes, typeof organization.memberOf]
  >;

  return (
    <Container.Section className="-mv-mt-4 @md:-mv-mt-6 @lg:-mv-mt-8 mv-pt-10 @sm:mv-py-8 @sm:mv-px-4 @lg:mv-px-6 mv-flex mv-flex-col mv-gap-10 @sm:mv-border-b @sm:mv-border-x @sm:mv-border-neutral-200 mv-bg-white @sm:mv-rounded-b-2xl">
      {networkTypeEntries.map(([networkType, networks]) => {
        if (networks.length === 0) {
          return null;
        }
        return (
          <div key={networkType} className="mv-flex mv-flex-col mv-gap-4">
            <h2 className="mv-mb-0 mv-text-neutral-700 mv-text-xl mv-font-bold mv-leading-6">
              {insertParametersIntoLocale(
                decideBetweenSingularOrPlural(
                  locales.route.headlines.memberOf[`${networkType}_one`],
                  locales.route.headlines.memberOf[`${networkType}_other`],
                  networks.length
                ),
                { networkName: organization.name }
              )}

              {/* {locales.networkTypes[networkType as keyof typeof locales.networkTypes]} */}
            </h2>
            <ListContainer listKey="member-of-networks" locales={locales}>
              {networks.map((relation, index) => {
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
        );
      })}
      {organization.networkMembers.length > 0 ? (
        <div className="mv-flex mv-flex-col mv-gap-4">
          <h2 className="mv-mb-0 mv-text-neutral-700 mv-text-xl mv-font-bold mv-leading-6">
            {insertParametersIntoLocale(
              decideBetweenSingularOrPlural(
                locales.route.headlines.networkMembers_one,
                locales.route.headlines.networkMembers_other,
                organization.networkMembers.length
              ),
              { networkName: organization.name }
            )}
          </h2>
          <ListContainer listKey="member-of-networks" locales={locales}>
            {organization.networkMembers.map((relation, index) => {
              return (
                <ListItem
                  key={`member-of-network-${relation.networkMember.slug}`}
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
