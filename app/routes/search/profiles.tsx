import { Button, CardContainer, ProfileCard } from "@mint-vernetzt/components";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useFetcher, useLoaderData, useSearchParams } from "@remix-run/react";
import imgproxy from "imgproxy/dist/types.js";
import React from "react";
import { createAuthClient, getSessionUser } from "~/auth.server";
import { getImageURL } from "~/images.server";
import {
  filterOrganizationByVisibility,
  filterProfileByVisibility,
} from "~/public-fields-filtering.server";
import { getPublicURL } from "~/storage.server";
import { getPaginationValues } from "../explore/utils.server";
import {
  getQueryValueAsArrayOfWords,
  searchProfilesViaLike,
} from "./utils.server";
// import styles from "../../../common/design/styles/styles.css";

// export const links: LinksFunction = () => [{ rel: "stylesheet", href: styles }];

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { authClient, response } = createAuthClient(request);

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
      enhancedProfile = await filterProfileByVisibility<typeof enhancedProfile>(
        enhancedProfile
      );
      // Filter organizations where profile belongs to
      enhancedProfile.memberOf = await Promise.all(
        enhancedProfile.memberOf.map(async (organization) => {
          const filteredOrganization = await filterOrganizationByVisibility<
            typeof organization
          >(organization);
          return { ...filteredOrganization };
        })
      );
    }

    // Add images from image proxy
    if (enhancedProfile.avatar !== null) {
      const publicURL = getPublicURL(authClient, enhancedProfile.avatar);
      if (publicURL !== null) {
        enhancedProfile.avatar = getImageURL(publicURL, {
          resize: { type: "fill", width: 136, height: 136 },
          gravity: imgproxy.GravityType.center,
        });
      }
    }

    if (enhancedProfile.background !== null) {
      const publicURL = getPublicURL(authClient, enhancedProfile.background);
      if (publicURL !== null) {
        enhancedProfile.background = getImageURL(publicURL, {
          resize: { type: "fill", width: 136, height: 136 },
          gravity: imgproxy.GravityType.center,
        });
      }
    }

    enhancedProfile.memberOf = enhancedProfile.memberOf.map((organization) => {
      let logo = organization.logo;
      if (logo !== null) {
        const publicURL = getPublicURL(authClient, logo);
        logo = getImageURL(publicURL, {
          resize: { type: "fit", width: 64, height: 64 },
        });
      }
      return { ...organization, logo };
    });

    enhancedProfiles.push(enhancedProfile);
  }

  return json(
    {
      profiles: enhancedProfiles,
      isLoggedIn: sessionUser !== null,
      pagination: {
        page,
        itemsPerPage,
      },
    },
    { headers: response.headers }
  );
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

  return (
    <section
      id="search-results-profiles"
      className="mv-mx-auto sm:mv-px-4 md:mv-px-0 xl:mv-px-2 mv-w-full sm:mv-max-w-screen-sm md:mv-max-w-screen-md lg:mv-max-w-screen-lg xl:mv-max-w-screen-xl 2xl:mv-max-w-screen-2xl"
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
            <div className="mv-w-full mv-flex mv-justify-center mv-mb-8 md:mv-mb-24 lg:mv-mb-8 mv-mt-4 lg:mv-mt-8">
              <fetcher.Form method="get">
                <input key="query" type="hidden" name="query" value={query} />
                <input key="page" type="hidden" name="page" value={page + 1} />
                <Button
                  size="large"
                  variant="outline"
                  loading={fetcher.state === "loading"}
                >
                  Weitere laden
                </Button>
              </fetcher.Form>
            </div>
          )}
        </>
      ) : (
        <p className="text-center text-primary">
          Für Deine Suche konnten leider keine Profile gefunden werden.
        </p>
      )}
    </section>
  );
}
