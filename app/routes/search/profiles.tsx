import type { LoaderArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Link, useLoaderData, useSearchParams } from "@remix-run/react";
import { GravityType } from "imgproxy/dist/types";
import { createAuthClient, getSessionUserOrThrow } from "~/auth.server";
import { H3 } from "~/components/Heading/Heading";
import { getImageURL } from "~/images.server";
import { useInfiniteItems } from "~/lib/hooks/useInfiniteItems";
import { getFullName } from "~/lib/profile/getFullName";
import { getInitials } from "~/lib/profile/getInitials";
import { getPublicURL } from "~/storage.server";
import { getPaginationValues } from "../explore/utils.server";
import { getQueryValue, searchProfilesViaLike } from "./utils.server";

export const loader = async ({ request }: LoaderArgs) => {
  const response = new Response();
  const authClient = createAuthClient(request, response);
  await getSessionUserOrThrow(authClient);

  const searchQuery = getQueryValue(request);
  const paginationValues = getPaginationValues(request);

  const rawProfiles = await searchProfilesViaLike(
    searchQuery,
    paginationValues.skip,
    paginationValues.take
  );
  const enhancedProfiles = rawProfiles.map((profile) => {
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
    return { ...otherFields, avatar: avatarImage };
  });

  return json(
    {
      profiles: enhancedProfiles,
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
      className="container my-8 md:my-10"
      id="search-results-profiles"
    >
      <div
        data-testid="grid"
        className="flex flex-wrap justify-center -mx-4 items-stretch"
      >
        {items.length > 0 ? (
          items.map((profile) => {
            if ("username" in profile) {
              let slug, image, initials, name, subtitle;
              slug = `/profile/${profile.username}`;
              image = profile.avatar;
              initials = getInitials(profile);
              name = getFullName(profile);
              subtitle = profile.position;
              return (
                <div
                  key={`profile-${profile.id}`}
                  data-testid="gridcell"
                  className="flex-100 md:flex-1/2 lg:flex-1/3 px-4 lg:px-4 mb-8"
                >
                  <Link
                    to={slug}
                    className="flex flex-wrap content-start items-start px-4 pt-4 lg:p-6 pb-8 rounded-3xl shadow h-full bg-neutral-200 hover:bg-neutral-400"
                  >
                    <div className="w-full flex flex-row">
                      <div className="h-16 w-16 bg-primary text-white text-3xl flex items-center justify-center rounded-full overflow-hidden shrink-0 border">
                        {image !== null ? <img src={image} alt="" /> : initials}
                      </div>
                      <div className="pl-4">
                        <H3 like="h4" className="text-xl mb-1">
                          {name}
                        </H3>
                        {subtitle !== null ? (
                          <p className="font-bold text-sm">{subtitle}</p>
                        ) : null}
                      </div>
                    </div>

                    {profile.bio !== undefined ? (
                      <p className="mt-3 line-clamp-2">{profile.bio}</p>
                    ) : null}

                    {profile.areas.length > 0 ? (
                      <div className="flex font-semibold flex-col lg:flex-row w-full mt-3">
                        <div className="lg:flex-label text-xs lg:text-sm leading-4 lg:leading-6 mb-2 lg:mb-0">
                          Aktivitätsgebiete
                        </div>
                        <div className="flex-auto line-clamp-3">
                          <span>
                            {profile.areas
                              .map(({ area }) => area.name)
                              .join(" / ")}
                          </span>
                        </div>
                      </div>
                    ) : null}
                  </Link>
                </div>
              );
            } else {
              return null;
            }
          })
        ) : (
          <p>Für Deine Suche konnten leider keine Profile gefunden werden.</p>
        )}
      </div>
    </section>
  );
}
