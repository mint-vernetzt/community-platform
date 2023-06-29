import { CardContainer, ProfileCard } from "@mint-vernetzt/components";
import type { LoaderArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, useSearchParams } from "@remix-run/react";
import { GravityType } from "imgproxy/dist/types";
import { createAuthClient, getSessionUserOrThrow } from "~/auth.server";
import { getImageURL } from "~/images.server";
import { useInfiniteItems } from "~/lib/hooks/useInfiniteItems";
import { getPublicURL } from "~/storage.server";
import { getPaginationValues } from "../explore/utils.server";
import {
  getQueryValueAsArrayOfWords,
  searchProfilesViaLike,
} from "./utils.server";

export const loader = async ({ request }: LoaderArgs) => {
  const response = new Response();
  const authClient = createAuthClient(request, response);
  const sessionUser = await getSessionUserOrThrow(authClient);
  const isLoggedIn = sessionUser !== null;

  const searchQuery = getQueryValueAsArrayOfWords(request);
  const paginationValues = getPaginationValues(request);

  const rawProfiles = await searchProfilesViaLike(
    searchQuery,
    paginationValues.skip,
    paginationValues.take
  );
  const enhancedProfiles = rawProfiles.map((profile) => {
    const { avatar, background, areas, offers, memberOf, ...otherFields } =
      profile;
    let avatarImage: string | null = null;
    if (avatar !== null) {
      const publicURL = getPublicURL(authClient, avatar);
      if (publicURL !== null) {
        avatarImage = getImageURL(publicURL, {
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
    const areaNames = areas.map((item) => item.area.name);
    const offerNames = offers.map((item) => item.offer.title);
    const organizations = memberOf
      .map((item) => item.organization)
      .map((organization) => {
        const { logo, ...otherFields } = organization;
        let logoImage: string | null = null;
        if (logo !== null) {
          const publicURL = getPublicURL(authClient, logo);
          if (publicURL !== null) {
            logoImage = getImageURL(publicURL, {
              resize: { type: "fill", width: 64, height: 64 },
              gravity: GravityType.center,
            });
          }
        }
        return {
          ...otherFields,
          logo: logoImage,
        };
      });
    return {
      ...otherFields,
      avatar: avatarImage,
      background: backgroundImage,
      areaNames,
      offers: offerNames,
      memberOf: organizations,
    };
  });

  return json(
    {
      profiles: enhancedProfiles,
      isLoggedIn,
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
