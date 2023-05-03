import type { Area } from "@prisma/client";
import type { ActionArgs, LoaderArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import { GravityType } from "imgproxy/dist/types";
import { makeDomainFunction } from "remix-domains";
import { performMutation } from "remix-forms";
import { z } from "zod";
import { createAuthClient, getSessionUser } from "~/auth.server";
import { H1, H3 } from "~/components/Heading/Heading";
import { getImageURL } from "~/images.server";
import { useInfiniteItems } from "~/lib/hooks/useInfiniteItems";
import { getInitialsOfName } from "~/lib/string/getInitialsOfName";
import { getFilteredOrganizations } from "~/organization.server";
import { getAllOffers, getAreaById } from "~/profile.server";
import { getPublicURL } from "~/storage.server";
import { getAreas } from "~/utils.server";
import {
  getAllOrganizations,
  getAlreadyFetchedIds,
  getPaginationValues,
} from "./utils.server";

const schema = z.object({
  areaId: z.string().optional(),
});

const environmentSchema = z.object({
  authClient: z.unknown(),
  // authClient: z.instanceof(SupabaseClient),
});

export const loader = async (args: LoaderArgs) => {
  const { request } = args;
  const response = new Response();

  const { take } = getPaginationValues(request);

  const authClient = createAuthClient(request, response);

  const sessionUser = await getSessionUser(authClient);

  const isLoggedIn = sessionUser !== null;

  const areas = await getAreas();
  const offers = await getAllOffers();

  const alreadyFetchedIds = getAlreadyFetchedIds(request);

  let rawOrganizations: Awaited<ReturnType<typeof getAllOrganizations>> = [];

  // Fetch from highest score to lowest score until profiles.length = paginationValues.take.
  for (let score = 4; score >= 0; score--) {
    if (rawOrganizations.length < take) {
      let newPaginationValues: {
        skip: number | undefined;
        take: number;
      } = {
        // We don't need to skip because we take the alreadyFetchedIds list to paginate over the randomly ordered result set
        skip: undefined,
        // We need to adjust the take to fill the resulting profiles array to the a length equal to the original take param
        // Example with an original take parameter of 6:
        // First iteration (profiles.length = 0, take = 6): Only fetched 3 profiles with score greater than 3
        // Second iteration (profiles.length = 3, take = 3): Only fetched 2 profiles with score equal to 3
        // Third iteration (profiles.length = 5, take = 1): Fetched 1 profile with score equal to 2
        // Fourth iteration (profiles.length = 6): Skip iteration because profiles.length >= original take
        take: take - rawOrganizations.length,
      };
      let scoreOptions: {
        scoreEquals: number | undefined;
        scoreGreaterThan: number | undefined;
        scoreLessThan: number | undefined;
      } = {
        scoreEquals: undefined,
        scoreGreaterThan: undefined,
        scoreLessThan: undefined,
      };
      if (score === 4) {
        scoreOptions.scoreGreaterThan = 3;
      } else {
        scoreOptions.scoreEquals = score;
      }
      const organizations = await getAllOrganizations({
        ...newPaginationValues,
        ...scoreOptions,
        alreadyFetchedIds,
      });
      for (let organization of organizations) {
        rawOrganizations.push(organization);
        alreadyFetchedIds.push(organization.id);
      }
    }
  }

  const organizations = rawOrganizations.map((organization) => {
    const { bio, publicFields, logo, ...otherFields } = organization;
    let extensions: { bio?: string } = {};

    if (
      (publicFields.includes("bio") || sessionUser !== null) &&
      bio !== null
    ) {
      extensions.bio = bio;
    }

    let logoImage: string | null = null;

    if (logo !== null) {
      const publicURL = getPublicURL(authClient, logo);
      if (publicURL !== null) {
        logoImage = getImageURL(publicURL, {
          resize: { type: "fit", width: 64, height: 64 },
          gravity: GravityType.center,
        });
      }
    }

    return { ...otherFields, ...extensions, logo: logoImage };
  });

  return json(
    { isLoggedIn, organizations, areas, offers },
    { headers: response.headers }
  );
};

function getCompareValues(
  a: { firstName: string } | { name: string },
  b: { firstName: string } | { name: string }
) {
  let compareValues: { a: string; b: string } = { a: "", b: "" };

  if ("firstName" in a) {
    compareValues.a = a.firstName;
  } else {
    compareValues.a = a.name;
  }
  if ("firstName" in b) {
    compareValues.b = b.firstName;
  } else {
    compareValues.b = b.name;
  }

  return compareValues;
}

const mutation = makeDomainFunction(
  schema,
  environmentSchema
)(async (values, environment) => {
  if (!values.areaId) {
    throw "";
  }

  let areaToFilter: Pick<Area, "id" | "type" | "stateId"> | null | undefined;
  if (values.areaId !== undefined) {
    areaToFilter = await getAreaById(values.areaId);
  }

  let filteredOrganizations = await getFilteredOrganizations(areaToFilter);

  // TODO: Outsource organization sorting (to database?) inside loader with url params

  let sortedOrganizations;
  if (areaToFilter) {
    // Explanation of the below sorting code:
    //
    // Expected sorting when filtering for country ("Bundesweit"):
    // 1. All profiles with a country
    // 2. All remaining profiles with a state
    // 3. All remaining profiles with a district
    //
    // Expected sorting when filtering for state ("Sachsen", "Saarland", etc...):
    // 1. All profiles with exactly the filtered state
    // 2. All remaining profiles with districts inside the filtered state
    // 3. All remaining profiles with a country
    //
    // Expected sorting when filtering for district ("Berlin", "Hamburg", etc...):
    // 1. All profiles with exactly the filtered district
    // 2. All remaining profiles with a state that includes the district
    // 3. All remaining profiles with a country
    //
    // To achieve this:
    // 1. Group the filteredProfiles in ProfilesWithCountry, ProfilesWithState, ProfilesWithDistrict
    // 2. Sort them alphabetical
    // 3. Append the groups together getting the order described above
    // 3.1. Profiles can have more than one area, which leads to the possibility that they got fetched from the database
    //      because they have a country ("Bundesweit") but also have a state or district the user did not filter for.
    //      Therefore another filter method is applied filtering out all profiles with the exact state or district.
    // 4. Step 1. and 3. leads to duplicate Profile entries. To exclude them the Array is transformed to a Set and vice versa.

    // 1.
    const organizationsWithCountry = filteredOrganizations
      .filter((item) => item.areas.some((area) => area.area.type === "country"))
      // 2.
      .sort((a, b) => {
        let compareValues = getCompareValues(a, b);
        return compareValues.a.localeCompare(compareValues.b);
      });
    const organizationsWithState = filteredOrganizations
      .filter((item) => item.areas.some((area) => area.area.type === "state"))
      .sort((a, b) => {
        let compareValues = getCompareValues(a, b);
        return compareValues.a.localeCompare(compareValues.b);
      });
    const organizationsWithDistrict = filteredOrganizations
      .filter((item) =>
        item.areas.some((area) => area.area.type === "district")
      )
      .sort((a, b) => {
        let compareValues = getCompareValues(a, b);
        return compareValues.a.localeCompare(compareValues.b);
      });
    // 3.
    const stateId = areaToFilter.stateId; // TypeScript reasons...
    if (areaToFilter.type === "country") {
      sortedOrganizations = [
        ...organizationsWithCountry,
        ...organizationsWithState,
        ...organizationsWithDistrict,
      ];
    }
    // 3.1.
    if (areaToFilter.type === "state") {
      sortedOrganizations = [
        ...organizationsWithState.filter((item) =>
          item.areas.some((area) => area.area.stateId === stateId)
        ),
        ...organizationsWithDistrict.filter((item) =>
          item.areas.some((area) => area.area.stateId === stateId)
        ),
        ...organizationsWithCountry,
      ];
    }
    if (areaToFilter.type === "district") {
      sortedOrganizations = [
        ...organizationsWithDistrict.filter((item) =>
          item.areas.some((area) => area.area.stateId === stateId)
        ),
        ...organizationsWithState.filter((item) =>
          item.areas.some((area) => area.area.stateId === stateId)
        ),
        ...organizationsWithCountry,
      ];
    }
    // 4.
    const organizationsSet = new Set(sortedOrganizations);
    sortedOrganizations = Array.from(organizationsSet);
  } else {
    // Sorting firstName alphabetical when no area filter is applied
    sortedOrganizations = filteredOrganizations.sort((a, b) =>
      a.name.localeCompare(b.name)
    );
  }

  // Add  logos
  const organizationsWithImages = sortedOrganizations.map((item) => {
    let { logo, ...rest } = item;

    if (logo !== null) {
      const publicURL = getPublicURL(environment.authClient, logo);
      if (publicURL !== null) {
        logo = getImageURL(publicURL, {
          resize: { type: "fill", width: 64, height: 64 },
        });
      }
    }

    return { ...rest, logo };
  });

  return {
    values,
    organizations: organizationsWithImages,
  };
});

export const action = async ({ request }: ActionArgs) => {
  const response = new Response();
  const authClient = createAuthClient(request, response);
  // TODO: Do we need an identity/authorization check for the filter action?
  const result = await performMutation({
    request,
    schema,
    mutation,
    environment: { authClient: authClient },
  });

  return json(result, { headers: response.headers });
};

export default function Index() {
  const loaderData = useLoaderData<typeof loader>();

  const {
    items,
    refCallback,
  }: {
    items: typeof loaderData.organizations;
    refCallback: (node: HTMLDivElement) => void;
  } = useInfiniteItems(
    loaderData.organizations,
    "/explore/organizations?",
    "organizations"
  );

  return (
    <>
      <section className="container mt-8 md:mt-10 lg:mt-20 text-center">
        <H1 like="h0">Entdecke Organisationen</H1>
        <p className="">Hier findest du Organisationen und Netzwerke.</p>
      </section>
      <section
        className="container my-8 md:my-10 lg:my-20"
        id="contact-details"
      >
        <div
          ref={refCallback}
          data-testid="grid"
          className="flex flex-wrap justify-center -mx-4 items-stretch"
        >
          {items.length > 0 ? (
            items.map((organization) => {
              let slug, image, initials, name, subtitle;

              slug = `/organization/${organization.slug}`;
              image = organization.logo;
              initials = getInitialsOfName(organization.name);
              name = organization.name;
              subtitle = organization.organizationTypeTitles.join(" / ");

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

                    {organization.bio !== undefined ? (
                      <p className="mt-3 line-clamp-2">{organization.bio}</p>
                    ) : null}

                    {organization.areaNames.length > 0 ? (
                      <div className="flex font-semibold flex-col lg:flex-row w-full mt-3">
                        <div className="lg:flex-label text-xs lg:text-sm leading-4 lg:leading-6 mb-2 lg:mb-0">
                          Aktivitätsgebiete
                        </div>
                        <div className="flex-auto line-clamp-3">
                          <span>{organization.areaNames.join(" / ")}</span>
                        </div>
                      </div>
                    ) : null}
                  </Link>
                </div>
              );
            })
          ) : (
            <p>
              Für Deine Filterkriterien konnten leider keine Profile gefunden
              werden.
            </p>
          )}
        </div>
      </section>
    </>
  );
}
