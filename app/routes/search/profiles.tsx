import { Button, CardContainer, ProfileCard } from "@mint-vernetzt/components";
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
  searchProfilesViaLike,
} from "./utils.server";
import { useTranslation } from "react-i18next";
// import styles from "../../../common/design/styles/styles.css";

// export const links: LinksFunction = () => [{ rel: "stylesheet", href: styles }];

const i18nNS = ["routes/search/profiles"];
export const handle = {
  i18n: i18nNS,
};

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { authClient } = createAuthClient(request);

  const searchQuery = getQueryValueAsArrayOfWords(request);
  const { skip, take, page, itemsPerPage } = getPaginationValues(request);

  const sessionUser = await getSessionUser(authClient);

  const rawProfiles = await searchProfilesViaLike(
    searchQuery,
    sessionUser,
    skip,
    take
  );

  const enhancedProfiles = [];

  for (const profile of rawProfiles) {
    let enhancedProfile = {
      ...profile,
      areas: profile.areas.map((item) => item.area.name),
      offers: profile.offers.map((item) => item.offer.title),
      memberOf: profile.memberOf.map((relation) => {
        return relation.organization;
      }),
    };

    if (sessionUser === null) {
      // Filter profile
      type EnhancedProfile = typeof enhancedProfile;
      enhancedProfile =
        filterProfileByVisibility<EnhancedProfile>(enhancedProfile);
      // Filter organizations where profile belongs to
      enhancedProfile.memberOf = enhancedProfile.memberOf.map(
        (organization) => {
          type Organization = typeof organization;
          const filteredOrganization =
            filterOrganizationByVisibility<Organization>(organization);
          return { ...filteredOrganization };
        }
      );
    }

    // Add imgUrls for imgproxy call on client
    if (enhancedProfile.avatar !== null) {
      const publicURL = getPublicURL(authClient, enhancedProfile.avatar);
      if (publicURL !== null) {
        enhancedProfile.avatar = getImageURL(publicURL, {
          resize: { type: "fill", width: 136, height: 136 },
          gravity: GravityType.center,
        });
      }
    }

    if (enhancedProfile.background !== null) {
      const publicURL = getPublicURL(authClient, enhancedProfile.background);
      if (publicURL !== null) {
        enhancedProfile.background = getImageURL(publicURL, {
          resize: { type: "fill", width: 348, height: 160 },
          gravity: GravityType.center,
        });
      }
    }

    enhancedProfile.memberOf = enhancedProfile.memberOf.map((organization) => {
      let logo = organization.logo;
      if (logo !== null) {
        const publicURL = getPublicURL(authClient, logo);
        logo = getImageURL(publicURL, {
          resize: { type: "fit", width: 36, height: 36 },
        });
      }
      return { ...organization, logo };
    });

    enhancedProfiles.push(enhancedProfile);
  }

  return json({
    profiles: enhancedProfiles,
    isLoggedIn: sessionUser !== null,
    pagination: {
      page,
      itemsPerPage,
    },
  });
};

export default function Profiles() {
  const loaderData = useLoaderData<typeof loader>();
  const fetcher = useFetcher<typeof loader>();
  const [searchParams] = useSearchParams();
  const [items, setItems] = React.useState(loaderData.profiles);
  const [shouldFetch, setShouldFetch] = React.useState(() => {
    if (loaderData.profiles.length < loaderData.pagination.itemsPerPage) {
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
      setItems((profiles) => {
        return fetcher.data !== undefined
          ? [...profiles, ...fetcher.data.profiles]
          : [...profiles];
      });
      setPage(fetcher.data.pagination.page);
      if (fetcher.data.profiles.length < fetcher.data.pagination.itemsPerPage) {
        setShouldFetch(false);
      }
    }
  }, [fetcher.data]);

  React.useEffect(() => {
    if (loaderData.profiles.length < loaderData.pagination.itemsPerPage) {
      setShouldFetch(false);
    }
    setItems(loaderData.profiles);
  }, [loaderData.profiles, loaderData.pagination.itemsPerPage]);

  const query = searchParams.get("query") ?? "";

  const { t } = useTranslation(i18nNS);

  return (
    <section
      id="search-results-profiles"
      className="mv-mx-auto @sm:mv-px-4 @md:mv-px-0 @xl:mv-px-2 mv-w-full @sm:mv-max-w-screen-container-sm @md:mv-max-w-screen-container-md @lg:mv-max-w-screen-container-lg @xl:mv-max-w-screen-container-xl @2xl:mv-max-w-screen-container-2xl"
    >
      {items.length > 0 ? (
        <>
          <CardContainer type="multi row">
            {items.map((profile) => {
              return (
                <ProfileCard
                  key={`profile-${profile.id}`}
                  publicAccess={!loaderData.isLoggedIn}
                  profile={profile}
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
