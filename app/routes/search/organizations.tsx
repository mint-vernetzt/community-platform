import { CardContainer, OrganizationCard } from "@mint-vernetzt/components";
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
  searchOrganizationsViaLike,
} from "./utils.server";

export const loader = async ({ request }: LoaderArgs) => {
  const response = new Response();
  const authClient = createAuthClient(request, response);

  const searchQuery = getQueryValueAsArrayOfWords(request);
  const paginationValues = getPaginationValues(request);

  const sessionUser = await getSessionUser(authClient);

  const rawOrganizations = await searchOrganizationsViaLike(
    searchQuery,
    sessionUser,
    paginationValues.skip,
    paginationValues.take
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
      enhancedOrganization = await filterOrganizationByVisibility<
        typeof enhancedOrganization
      >(enhancedOrganization);
      // Filter team members
      enhancedOrganization.teamMembers = await Promise.all(
        enhancedOrganization.teamMembers.map(async (profile) => {
          const filteredProfile = await filterProfileByVisibility<
            typeof profile
          >(profile);
          return { ...filteredProfile };
        })
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
          resize: { type: "fit", width: 473, height: 160 },
        });
      }
    }

    enhancedOrganization.teamMembers = enhancedOrganization.teamMembers.map(
      (profile) => {
        let avatar = profile.avatar;
        if (avatar !== null) {
          const publicURL = getPublicURL(authClient, avatar);
          avatar = getImageURL(publicURL, {
            resize: { type: "fit", width: 64, height: 64 },
          });
        }
        return { ...profile, avatar };
      }
    );

    enhancedOrganizations.push(enhancedOrganization);
  }

  return json(
    {
      organizations: enhancedOrganizations,
      isLoggedIn: sessionUser !== null,
    },
    { headers: response.headers }
  );
};

export default function SearchView() {
  const loaderData = useLoaderData<typeof loader>();
  const [searchParams] = useSearchParams();
  const type = "organizations";

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
      id="search-results-organizations"
      className="mv-mx-auto sm:mv-px-4 md:mv-px-0 xl:mv-px-2 mv-w-full sm:mv-max-w-screen-sm md:mv-max-w-screen-md lg:mv-max-w-screen-lg xl:mv-max-w-screen-xl 2xl:mv-max-w-screen-2xl"
    >
      {items.length > 0 ? (
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
      ) : (
        <p className="text-center text-primary">
          Für Deine Suche konnten leider keine Organisationen gefunden werden.
        </p>
      )}
    </section>
  );
}
