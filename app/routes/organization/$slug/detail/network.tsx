import { useLoaderData, type LoaderFunctionArgs } from "react-router";
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
import { hasContent } from "~/utils.shared";

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

  const networkMembers = enhancedOrganization.networkMembers.map((relation) => {
    const types = relation.networkMember.types.map((item) => {
      return item.organizationType;
    });
    const networkTypes = relation.networkMember.networkTypes.map((item) => {
      return item.networkType;
    });
    return {
      ...relation,
      networkMember: { ...relation.networkMember, types, networkTypes },
    };
  });

  const memberOf = enhancedOrganization.memberOf.map((relation) => {
    const types = relation.network.types.map((item) => {
      return item.organizationType;
    });
    const networkTypes = relation.network.networkTypes.map((item) => {
      return item.networkType;
    });
    return {
      ...relation,
      network: { ...relation.network, types, networkTypes },
    };
  });

  const formattedOrganization = {
    ...enhancedOrganization,
    networkMembers,
    memberOf,
  };

  type NetworkType = keyof typeof locales.networkTypes;
  const networksByType: {
    [Key in NetworkType]: typeof formattedOrganization.memberOf;
  } = {
    alliance: [],
    "mint-cluster": [],
    "mint-region": [],
    "national-initiative": [],
    "other-network": [],
  };
  for (const type in locales.networkTypes) {
    networksByType[type as NetworkType] = formattedOrganization.memberOf.filter(
      (relation) => {
        return relation.network.networkTypes.some((item) => item.slug === type);
      }
    );
  }

  return {
    organization: formattedOrganization,
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
    <Container.Section className="-mt-4 @md:-mt-6 @lg:-mt-8 pt-10 @sm:py-8 @sm:px-4 @lg:px-6 flex flex-col gap-10 @sm:border-b @sm:border-x @sm:border-neutral-200 bg-white @sm:rounded-b-2xl">
      {networkTypeEntries.map(([networkType, networks]) => {
        if (hasContent(networks) === false) {
          return null;
        }
        return (
          <div key={networkType} className="flex flex-col gap-4">
            <h2 className="mb-0 text-neutral-700 text-xl font-bold leading-6">
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
                    prefetch="intent"
                  />
                );
              })}
            </ListContainer>
          </div>
        );
      })}
      {hasContent(organization.networkMembers) ? (
        <div className="flex flex-col gap-4">
          <h2 className="mb-0 text-neutral-700 text-xl font-bold leading-6">
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
                  prefetch="intent"
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
