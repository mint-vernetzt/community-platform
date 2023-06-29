import { CardContainer, OrganizationCard } from "@mint-vernetzt/components";
import type { LoaderArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, useSearchParams } from "@remix-run/react";
import { GravityType } from "imgproxy/dist/types";
import { createAuthClient, getSessionUser } from "~/auth.server";
import { getImageURL } from "~/images.server";
import { useInfiniteItems } from "~/lib/hooks/useInfiniteItems";
import type { ArrayElement } from "~/lib/utils/types";
import {
  filterOrganizationDataByVisibilitySettings,
  filterProfileDataByVisibilitySettings,
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

  let rawOrganizations = await searchOrganizationsViaLike(
    searchQuery,
    paginationValues.skip,
    paginationValues.take
  );
  const sessionUser = await getSessionUser(authClient);
  if (sessionUser === null) {
    // Filter organizations
    rawOrganizations = await filterOrganizationDataByVisibilitySettings<
      ArrayElement<typeof rawOrganizations>
    >(rawOrganizations);
  }

  const enhancedOrganizations = await Promise.all(
    rawOrganizations.map(async (organization) => {
      const {
        logo,
        background,
        areas,
        focuses,
        teamMembers,
        types,
        ...otherFields
      } = organization;

      let logoImage: string | null = null;
      if (logo !== null) {
        const publicURL = getPublicURL(authClient, logo);
        if (publicURL !== null) {
          logoImage = getImageURL(publicURL, {
            resize: { type: "fill", width: 136, height: 136 },
            gravity: GravityType.center,
          });
        }
      }

      let backgroundImage: string | null = null;
      if (background !== null) {
        const publicURL = getPublicURL(authClient, background);
        if (publicURL !== null) {
          backgroundImage = getImageURL(publicURL, {
            resize: { type: "fit", width: 473, height: 160 },
          });
        }
      }

      // Filter team member of organizations by visibility settings
      if (sessionUser === null) {
        const rawTeamMembers = organization.teamMembers.map((teamMember) => {
          return teamMember.profile;
        });
        const filteredTeamMemberProfiles =
          await filterProfileDataByVisibilitySettings<
            ArrayElement<typeof rawTeamMembers>
          >(rawTeamMembers);
        organization.teamMembers = organization.teamMembers.map(
          (teamMember) => {
            let filteredTeamMember = teamMember;
            for (let filteredProfile of filteredTeamMemberProfiles) {
              if (teamMember.profile.username === filteredProfile.username) {
                filteredTeamMember.profile = filteredProfile;
              }
            }
            return filteredTeamMember;
          }
        );
      }

      const areaNames = areas.map((item) => item.area.name);
      const focusTitles = focuses.map((item) => item.focus.title);
      const profiles = teamMembers
        .map((item) => item.profile)
        .map((profile) => {
          const { avatar, ...otherFields } = profile;

          let avatarImage: string | null = null;
          if (avatar !== null) {
            const publicURL = getPublicURL(authClient, avatar);
            if (publicURL !== null) {
              avatarImage = getImageURL(publicURL, {
                resize: { type: "fill", width: 64, height: 64 },
                gravity: GravityType.center,
              });
            }
          }
          return {
            ...otherFields,
            avatar: avatarImage,
          };
        });

      const typeTitles = types.map((item) => item.organizationType.title);
      return {
        ...otherFields,
        logo: logoImage,
        background: backgroundImage,
        areas: areaNames,
        focuses: focusTitles,
        teamMembers: profiles,
        types: typeTitles,
      };
    })
  );

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
