import {
  Button,
  CardContainer,
  OrganizationCard,
} from "@mint-vernetzt/components";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useFetcher, useLoaderData, useSearchParams } from "@remix-run/react";
import React from "react";
import { createAuthClient, getSessionUser } from "~/auth.server";
import { GravityType, getImageURL } from "~/images.server";
import {
  filterOrganizationByVisibility,
  filterProfileByVisibility,
} from "~/next-public-fields-filtering.server";
import { getPublicURL } from "~/storage.server";
import { getPaginationValues } from "../explore/utils.server";
import {
  getQueryValueAsArrayOfWords,
  searchOrganizationsViaLike,
} from "./utils.server";
import { useTranslation } from "react-i18next";
// import styles from "../../../common/design/styles/styles.css";

// export const links: LinksFunction = () => [{ rel: "stylesheet", href: styles }];

const i18nNS = ["routes/search/organizations"];
export const handle = {
  i18n: i18nNS,
};

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { authClient } = createAuthClient(request);

  const searchQuery = getQueryValueAsArrayOfWords(request);
  const { skip, take, page, itemsPerPage } = getPaginationValues(request);

  const sessionUser = await getSessionUser(authClient);

  const rawOrganizations = await searchOrganizationsViaLike(
    searchQuery,
    sessionUser,
    skip,
    take
  );

  const enhancedOrganizations = [];

  for (const organization of rawOrganizations) {
    let enhancedOrganization = {
      ...organization,
      areas: organization.areas.map((relation) => relation.area.name),
      focuses: organization.focuses.map((relation) => relation.focus.title),
      types: organization.types.map((item) => item.organizationType.title),
      teamMembers: organization.teamMembers.map((relation) => {
        return relation.profile;
      }),
    };

    if (sessionUser === null) {
      // Filter organization
      type EnhancedOrganization = typeof enhancedOrganization;
      enhancedOrganization =
        filterOrganizationByVisibility<EnhancedOrganization>(
          enhancedOrganization
        );
      // Filter team members
      enhancedOrganization.teamMembers = enhancedOrganization.teamMembers.map(
        (profile) => {
          type Profile = typeof profile;
          const filteredProfile = filterProfileByVisibility<Profile>(profile);
          return { ...filteredProfile };
        }
      );
    }

    // Add images from image proxy
    if (enhancedOrganization.logo !== null) {
      const publicURL = getPublicURL(authClient, enhancedOrganization.logo);
      if (publicURL !== null) {
        enhancedOrganization.logo = getImageURL(publicURL, {
          resize: { type: "fill", width: 136, height: 136 },
          gravity: GravityType.center,
        });
      }
    }

    if (enhancedOrganization.background !== null) {
      const publicURL = getPublicURL(
        authClient,
        enhancedOrganization.background
      );
      if (publicURL !== null) {
        enhancedOrganization.background = getImageURL(publicURL, {
          resize: { type: "fill", width: 348, height: 160 },
        });
      }
    }

    enhancedOrganization.teamMembers = enhancedOrganization.teamMembers.map(
      (profile) => {
        let avatar = profile.avatar;
        if (avatar !== null) {
          const publicURL = getPublicURL(authClient, avatar);
          avatar = getImageURL(publicURL, {
            resize: { type: "fit", width: 36, height: 36 },
          });
        }
        return { ...profile, avatar };
      }
    );

    enhancedOrganizations.push(enhancedOrganization);
  }

  return json({
    organizations: enhancedOrganizations,
    isLoggedIn: sessionUser !== null,
    pagination: {
      page,
      itemsPerPage,
    },
  });
};

export default function SearchView() {
  const loaderData = useLoaderData<typeof loader>();
  const fetcher = useFetcher<typeof loader>();
  const [searchParams] = useSearchParams();
  const [items, setItems] = React.useState(loaderData.organizations);
  const [shouldFetch, setShouldFetch] = React.useState(() => {
    if (loaderData.organizations.length < loaderData.pagination.itemsPerPage) {
      return false;
    }
    return true;
  });
  const [page, setPage] = React.useState(() => {
    const pageParam = searchParams.get("page");
    if (pageParam !== null) {
      return parseInt(pageParam);
    }
    return 1;
  });

  React.useEffect(() => {
    if (fetcher.data !== undefined) {
      setItems((organizations) => {
        return fetcher.data !== undefined
          ? [...organizations, ...fetcher.data.organizations]
          : [...organizations];
      });
      setPage(fetcher.data.pagination.page);
      if (
        fetcher.data.organizations.length < fetcher.data.pagination.itemsPerPage
      ) {
        setShouldFetch(false);
      }
    }
  }, [fetcher.data]);

  React.useEffect(() => {
    if (loaderData.organizations.length < loaderData.pagination.itemsPerPage) {
      setShouldFetch(false);
    }
    setItems(loaderData.organizations);
  }, [loaderData.organizations, loaderData.pagination.itemsPerPage]);

  const query = searchParams.get("query") ?? "";

  const { t } = useTranslation(i18nNS);

  return (
    <section
      id="search-results-organizations"
      className="mv-mx-auto @sm:mv-px-4 @md:mv-px-0 @xl:mv-px-2 mv-w-full @sm:mv-max-w-screen-container-sm @md:mv-max-w-screen-container-md @lg:mv-max-w-screen-container-lg @xl:mv-max-w-screen-container-xl @2xl:mv-max-w-screen-container-2xl"
    >
      {items.length > 0 ? (
        <>
          <CardContainer type="multi row">
            {items.map((organization) => {
              return (
                <OrganizationCard
                  key={`profile-${organization.id}`}
                  publicAccess={!loaderData.isLoggedIn}
                  organization={organization}
                />
              );
            })}
          </CardContainer>
          {shouldFetch && (
            <div className="mv-w-full mv-flex mv-justify-center mv-mb-10 mv-mt-4 @lg:mv-mb-12 @lg:mv-mt-6 @xl:mv-mb-14 @xl:mv-mt-8">
              <fetcher.Form method="get">
                <input key="query" type="hidden" name="query" value={query} />
                <input key="page" type="hidden" name="page" value={page + 1} />
                <Button
                  size="large"
                  variant="outline"
                  loading={fetcher.state === "loading"}
                >
                  {t("more")}
                </Button>
              </fetcher.Form>
            </div>
          )}
        </>
      ) : (
        <p className="text-center text-primary">{t("empty")}</p>
      )}
    </section>
  );
}
