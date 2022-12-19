import type { Area } from "@prisma/client";
import type { ActionFunction, LoaderFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Link, useActionData, useLoaderData } from "@remix-run/react";
import { createServerClient } from "@supabase/auth-helpers-remix";
import { GravityType } from "imgproxy/dist/types";
import React from "react";
import { makeDomainFunction } from "remix-domains";
import type { PerformMutation } from "remix-forms";
import { performMutation } from "remix-forms";
import type { Schema } from "zod";
import { z } from "zod";
import { createAuthClient, getSessionUser } from "~/auth.server";
import { H1, H3 } from "~/components/Heading/Heading";
import { getImageURL } from "~/images.server";
import { getInitialsOfName } from "~/lib/string/getInitialsOfName";
import { getFilteredOrganizations } from "~/organization.server";
import { getAllOffers, getAreaById } from "~/profile.server";
import { getPublicURL } from "~/storage.server";
import { getAreas } from "~/utils.server";
import { getAllOrganizations, getScoreOfEntity } from "./utils.server";

const schema = z.object({
  areaId: z.string().optional(),
});

const environmentSchema = z.object({
  authClient: z.unknown(),
  // authClient: z.instanceof(SupabaseClient),
});

type Organizations = Awaited<ReturnType<typeof getAllOrganizations>>;

type LoaderData = {
  isLoggedIn: boolean;
  organizations: Organizations;
  areas: Awaited<ReturnType<typeof getAreas>>;
  offers: Awaited<ReturnType<typeof getAllOffers>>;
};

export const loader: LoaderFunction = async (args) => {
  const { request } = args;
  const response = new Response();

  const authClient = createAuthClient(request, response);

  const sessionUser = await getSessionUser(authClient);

  const isLoggedIn = sessionUser !== null;

  const areas = await getAreas();
  const offers = await getAllOffers();

  let organizations;

  const allOrganizations = await getAllOrganizations();
  if (allOrganizations !== null) {
    organizations = allOrganizations
      .map((organization) => {
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
      })
      .sort((a, b) => {
        const scoreA = getScoreOfEntity(a);
        const scoreB = getScoreOfEntity(b);

        if (scoreA === scoreB) {
          return b.updatedAt.getTime() - a.updatedAt.getTime();
        }
        return scoreB - scoreA;
      });
  }
  // TODO: fix type issue
  return json<LoaderData>(
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

type ActionData = PerformMutation<
  z.infer<Schema>,
  z.infer<typeof schema> & {
    organizations: Organizations;
  }
>;

export const action: ActionFunction = async ({ request }) => {
  const response = new Response();
  const authClient = createAuthClient(request, response);
  // TODO: Do we need an identity/authorization check for the filter action?
  const result = await performMutation({
    request,
    schema,
    mutation,
    environment: { authClient: authClient },
  });

  // TODO: fix type issue
  return json<ActionData>(result, { headers: response.headers });
};

export default function Index() {
  const loaderData = useLoaderData<LoaderData>();
  const actionData = useActionData<ActionData>();
  // const submit = useSubmit();
  // const areaOptions = createAreaOptionFromData(loaderData.areas);

  let organizations = loaderData.organizations;

  if (actionData && actionData.success) {
    organizations = actionData.data.organizations;
  }

  // const handleChange = (event: FormEvent<HTMLFormElement>) => {
  //   submit(event.currentTarget);
  // };

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
          data-testid="grid"
          className="flex flex-wrap justify-center -mx-4 items-stretch"
        >
          {organizations.length > 0 ? (
            organizations.map((organization) => {
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
              Für Deine Filterkriterien konnten leider keine Profile gefunden
              werden.
            </p>
          )}
        </div>
      </section>
    </>
  );
}
