import type { LoaderArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import { GravityType } from "imgproxy/dist/types";
import { createAuthClient } from "~/auth.server";
import { H3 } from "~/components/Heading/Heading";
import { getImageURL } from "~/images.server";
import { getInitialsOfName } from "~/lib/string/getInitialsOfName";
import { getPublicURL } from "~/storage.server";
import { searchOrganizationsViaLike } from "../utils.server";

export const loader = async ({ request, params }: LoaderArgs) => {
  const response = new Response();
  const authClient = createAuthClient(request, response);

  const searchQueryForFTS = "'Unicode'"; // Mind the single quotes!
  const searchQueryForFTSMultiple = "'Kontakt' | 'zu' | 'Unternehmen'"; // Mind the single quotes!
  const searchQueryForLike = "Unicode";
  const searchQueryForLikeMultiple = ["a"];

  console.time("Overall time");

  // Prisma logging
  //prismaLog(); // <-- Restart dev server to use this

  // **************
  // 1. Prismas preview feature of Postgresql Full-Text Search
  // - Performance: ~15 ms for full profile on search query 'Kontakt zu Unternehmen'
  // - Raw query: see ./poc-full-text-search-sql-queries/prisma-query-postgres-fts
  // - Fast implemented -> We have to write the where statement for each field on Profiles/Events, etc... -> see prismasFtsQuery()
  // - No substring search
  // - How to search on string arrays ? -> see profile.skills
  //const profiles = await prismasFtsQuery(searchQueryForFTS);
  //const profiles = await prismasFtsQuery(searchQueryForFTSMultiple);

  // **************
  // 2. prismas like filtering with where contains
  // - Performance: ~30 ms for full profile on search query 'Kontakt zu Unternehmen'
  // - Raw query: see ./poc-full-text-search-sql-queries/prisma-query-like
  // - Fast implemented -> We have to write the where statement for each field on Profiles/Events, etc... -> see likeQueryMultiple()
  // - Simple substring search is possibe
  // - How to sort by relevance?
  // - Search on arrays is possible
  // - Search on relations is possible
  // - Case sensitive!
  const organizations = await searchOrganizationsViaLike(
    searchQueryForLikeMultiple
  );

  // **************
  // 3. Build full text index inside schema with ts vector/ ts query

  // **************
  // 4. Own full text search field
  // TODO

  // **************
  // 5. Creating a postgres view
  //const profiles = await createPostgresView();

  //console.log(profiles);

  console.log("\n-------------------------------------------\n");
  console.timeEnd("Overall time");
  console.log("\n-------------------------------------------\n");

  const enhancedOrganizations = organizations.map((organization) => {
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

  // TODO:
  // - Get pagination values (skip, take) from searchParams -> Do we want pagination with the latency?
  // - Get the query from searchParams
  // - Who has access?
  // - Filter public fields if everyone has access

  return json(
    {
      organizations: enhancedOrganizations,
    },
    { headers: response.headers }
  );
};

export default function Organizations() {
  const loaderData = useLoaderData<typeof loader>();

  // TODO: Pagination -> Do we want pagination with the latency?

  // const { items, refCallback } = useInfiniteItems(
  //   loaderData.organizations,
  //   "/explore/organizations",
  //   "organizations"
  // );

  return (
    <section
      className="container my-8 md:my-10 lg:my-20"
      id="search-results-organizations"
    >
      <div
        // ref={refCallback} // TODO: Pagination -> Do we want pagination with the latency?
        data-testid="grid"
        className="flex flex-wrap justify-center -mx-4 items-stretch"
      >
        {loaderData.organizations.length > 0 ? (
          loaderData.organizations.map((organization) => {
            let slug, image, initials, name, subtitle;

            slug = `/organization/${organization.slug}`;
            image = organization.logo;
            initials = getInitialsOfName(organization.name);
            name = organization.name;
            subtitle = organization.types
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
                      {subtitle !== null ? (
                        <p className="font-bold text-sm">{subtitle}</p>
                      ) : null}
                    </div>
                  </div>

                  {organization.bio !== undefined ? (
                    <p className="mt-3 line-clamp-2">{organization.bio}</p>
                  ) : null}

                  {organization.areas !== undefined &&
                  organization.areas.length > 0 ? (
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
          <p>
            Für Deine Suche konnten leider keine Organisationen gefunden werden.
          </p>
        )}
      </div>
    </section>
  );
}
