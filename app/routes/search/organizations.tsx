import type { LoaderArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Link, useLoaderData, useSearchParams } from "@remix-run/react";
import { GravityType } from "imgproxy/dist/types";
import { createAuthClient, getSessionUser } from "~/auth.server";
import { H3 } from "~/components/Heading/Heading";
import { getImageURL } from "~/images.server";
import { useInfiniteItems } from "~/lib/hooks/useInfiniteItems";
import { getInitialsOfName } from "~/lib/string/getInitialsOfName";
import type { ArrayElement } from "~/lib/utils/types";
import { filterOrganizationDataByVisibilitySettings } from "~/public-fields-filtering.server";
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
    rawOrganizations = await filterOrganizationDataByVisibilitySettings<
      ArrayElement<typeof rawOrganizations>
    >(rawOrganizations);
  }
  const enhancedOrganizations = rawOrganizations.map((organization) => {
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
    return { ...otherFields, logo: logoImage };
  });

  return json(
    {
      organizations: enhancedOrganizations,
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
      className="container my-8 md:my-10"
      id="search-results-organizations"
    >
      <div
        ref={refCallback}
        data-testid="grid"
        className="flex flex-wrap justify-center -mx-4 items-stretch"
      >
        {items.length > 0 ? (
          items.map((organization) => {
            let slug = `/organization/${organization.slug}`;
            let image = organization.logo;
            let initials = getInitialsOfName(organization.name);
            let name = organization.name;
            let subtitle = organization.types
              .map(({ organizationType }) => organizationType.title)
              .join(" / ");

            return (
              <div
                key={`organization-${organization.id}`}
                data-testid="gridcell"
                className="flex-100 md:flex-1/2 lg:flex-1/3 px-4 lg:px-4 mb-8"
              >
                <Link
                  to={slug}
                  className="flex flex-wrap content-start items-start px-4 pt-4 lg:p-6 pb-8 rounded-3xl shadow h-full bg-neutral-200 hover:bg-neutral-400"
                >
                  <div className="w-full flex flex-row">
                    {image !== null ? (
                      <div className="w-16 h-16 rounded-full shrink-0 overflow-hidden flex items-center justify-center border">
                        <img
                          className="max-w-full w-auto max-h-16 h-auto"
                          src={image}
                          alt={name}
                        />
                      </div>
                    ) : (
                      <div className="h-16 w-16 bg-primary text-white text-3xl flex items-center justify-center rounded-full overflow-hidden shrink-0">
                        {initials}
                      </div>
                    )}
                    <div className="pl-4">
                      <H3 like="h4" className="text-xl mb-1">
                        {name}
                      </H3>
                      {subtitle !== "" ? (
                        <p className="font-bold text-sm">{subtitle}</p>
                      ) : null}
                    </div>
                  </div>

                  {organization.bio !== null ? (
                    <p className="mt-3 line-clamp-2">{organization.bio}</p>
                  ) : null}

                  {organization.areas.length > 0 ? (
                    <div className="flex font-semibold flex-col lg:flex-row w-full mt-3">
                      <div className="lg:flex-label text-xs lg:text-sm leading-4 lg:leading-6 mb-2 lg:mb-0">
                        Aktivitätsgebiete
                      </div>
                      <div className="flex-auto line-clamp-3">
                        <span>
                          {organization.areas
                            .map((area) => area.area.name)
                            .join(" / ")}
                        </span>
                      </div>
                    </div>
                  ) : null}
                </Link>
              </div>
            );
          })
        ) : (
          <p className="text-center text-primary">
            Für Deine Suche konnten leider keine Organisationen gefunden werden.
          </p>
        )}
      </div>
    </section>
  );
}
