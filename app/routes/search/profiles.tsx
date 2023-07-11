import { CardContainer, ProfileCard } from "@mint-vernetzt/components";
import type { LoaderArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, useSearchParams } from "@remix-run/react";
import { GravityType } from "imgproxy/dist/types";
import { createAuthClient, getSessionUser } from "~/auth.server";
import { getImageURL } from "~/images.server";
import { useInfiniteItems } from "~/lib/hooks/useInfiniteItems";
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

export const loader = async ({ request }: LoaderArgs) => {
  const response = new Response();
  const authClient = createAuthClient(request, response);

  const searchQuery = getQueryValueAsArrayOfWords(request);
  const paginationValues = getPaginationValues(request);

  const sessionUser = await getSessionUser(authClient);

  const rawProfiles = await searchProfilesViaLike(
    searchQuery,
    sessionUser,
    paginationValues.skip,
    paginationValues.take
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
          gravity: GravityType.center,
        });
      }
    }

    if (enhancedProfile.background !== null) {
      const publicURL = getPublicURL(authClient, enhancedProfile.background);
      if (publicURL !== null) {
        enhancedProfile.background = getImageURL(publicURL, {
          resize: { type: "fill", width: 136, height: 136 },
          gravity: GravityType.center,
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
    },
    { headers: response.headers }
  );
};

export default function Profiles() {
  const loaderData = useLoaderData<typeof loader>();
  const [searchParams] = useSearchParams();
  const type = "profiles";

  const {
    items,
    refCallback,
  }: {
    items: typeof loaderData[typeof type];
    refCallback: (node: HTMLDivElement) => void;
  } = useInfiniteItems(
    loaderData[type],
    `/search/${type}?`,
    type,
    searchParams
  );

  return (
    <section
      ref={refCallback}
      id="search-results-profiles"
      className="mv-mx-auto sm:mv-px-4 md:mv-px-0 xl:mv-px-2 mv-w-full sm:mv-max-w-screen-sm md:mv-max-w-screen-md lg:mv-max-w-screen-lg xl:mv-max-w-screen-xl 2xl:mv-max-w-screen-2xl"
    >
      {items.length > 0 ? (
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
      ) : (
        <p className="text-center text-primary">
          Für Deine Suche konnten leider keine Profile gefunden werden.
        </p>
      )}
    </section>
  );
}
