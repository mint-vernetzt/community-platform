import { Area } from "@prisma/client";
import { GravityType } from "imgproxy/dist/types";
import React, { FormEvent } from "react";
import {
  ActionFunction,
  Link,
  LoaderFunction,
  useActionData,
  useLoaderData,
  useSubmit,
} from "remix";
import { makeDomainFunction } from "remix-domains";
import {
  Form as RemixForm,
  PerformMutation,
  performMutation,
} from "remix-forms";
import { Schema, z } from "zod";
import { getUserByRequest } from "~/auth.server";
import { H1, H3 } from "~/components/Heading/Heading";
import { getImageURL } from "~/images.server";
import { getOrganizationInitials } from "~/lib/organization/getOrganizationInitials";
import { createAreaOptionFromData } from "~/lib/utils/components";
import { getFilteredOrganizations } from "~/organization.server";
import { getAllOffers, getAreaById } from "~/profile.server";
import { getPublicURL } from "~/storage.server";
import { getAreas } from "~/utils.server";
import { getAllOrganizations, getScoreOfEntity } from "./utils.server";

const schema = z.object({
  areaId: z.string().optional(),
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

  const sessionUser = await getUserByRequest(request);

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
          const publicURL = getPublicURL(logo);
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

  return { isLoggedIn, organizations, areas, offers };
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

const mutation = makeDomainFunction(schema)(async (values) => {
  if (!values.areaId) {
    throw "";
  }

  let areaToFilter: Pick<Area, "id" | "type" | "stateId"> | null | undefined;
  if (values.areaId !== undefined) {
    areaToFilter = await getAreaById(values.areaId);
  }

  let filteredOrganizations = await getFilteredOrganizations(areaToFilter);

  // TODO: Outsource profile sorting to database

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
      const publicURL = getPublicURL(logo);
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
  const result = await performMutation({
    request,
    schema,
    mutation,
  });

  return result;
};

export default function Index() {
  const loaderData = useLoaderData<LoaderData>();
  const actionData = useActionData<ActionData>();
  const submit = useSubmit();
  const areaOptions = createAreaOptionFromData(loaderData.areas);

  let organizations = loaderData.organizations;

  if (actionData && actionData.success) {
    organizations = actionData.data.organizations;
  }

  const handleChange = (event: FormEvent<HTMLFormElement>) => {
    submit(event.currentTarget);
  };

  return (
    <>
      <section className="container mt-8 md:mt-10 lg:mt-20 text-center">
        <H1 like="h0">Organisationen</H1>
      </section>

      {loaderData.isLoggedIn ? (
        <section className="container my-8">
          <RemixForm method="post" schema={schema} onChange={handleChange}>
            {({ Field, Button, Errors, register }) => (
              <>
                <div className="flex flex-wrap -mx-4">
                  <div className="form-control px-4 pb-4 flex-initial w-full md:w-1/3">
                    <Field
                      name="areaId"
                      label="Filtern nach Aktivitätsgebiet:"
                      className=""
                    >
                      {({ Errors }) => (
                        <>
                          <label className="block font-semibold mb-2">
                            Aktivitätsgebiet
                          </label>
                          <select
                            {...register("areaId")}
                            className="select w-full select-bordered"
                          >
                            <option></option>
                            {areaOptions.map((option, index) => (
                              <React.Fragment key={index}>
                                {"value" in option && (
                                  <option
                                    key={`area-${index}`}
                                    value={option.value}
                                  >
                                    {option.label}
                                  </option>
                                )}

                                {"options" in option && (
                                  <optgroup
                                    key={`area-group-${index}`}
                                    label={option.label}
                                  >
                                    {option.options.map(
                                      (groupOption, groupOptionIndex) => (
                                        <option
                                          key={`area-${index}-${groupOptionIndex}`}
                                          value={groupOption.value}
                                        >
                                          {groupOption.label}
                                        </option>
                                      )
                                    )}
                                  </optgroup>
                                )}
                              </React.Fragment>
                            ))}
                          </select>
                        </>
                      )}
                    </Field>
                  </div>

                  <Errors />
                </div>
                <div className="flex justify-end">
                  <noscript>
                    {/* TODO: selection not shown without javascript */}
                    <button type="submit" className="btn btn-primary mr-2">
                      Filter anwenden
                    </button>
                  </noscript>
                  <Link to={"./"} reloadDocument>
                    <div className="btn btn-primary">Filter zurücksetzen</div>
                  </Link>
                </div>
              </>
            )}
          </RemixForm>
        </section>
      ) : null}

      <section
        className="container my-8 md:my-10 lg:my-20"
        id="contact-details"
      >
        <div
          data-testid="grid"
          className="flex flex-wrap justify-center -mx-4 items-stretch"
        >
          {organizations.length > 0 ? (
            organizations.map((item, index) => {
              let slug, image, imageType, initials, name, subtitle;

              slug = `/organization/${item.slug}`;
              image = item.logo;
              imageType = "logo";
              initials = getOrganizationInitials(item.name);
              name = item.name;
              subtitle = item.types
                .map(({ organizationType }) => organizationType.title)
                .join(" / ");

              return (
                <div
                  key={`profile-${index}`}
                  data-testid="gridcell"
                  className="flex-100 md:flex-1/2 lg:flex-1/3 px-4 lg:px-4 mb-8"
                >
                  <Link
                    to={slug}
                    className="flex flex-wrap content-start items-start px-4 pt-4 lg:p-6 pb-8 rounded-3xl shadow h-full bg-neutral-200 hover:bg-neutral-400"
                  >
                    <div className="w-full flex flex-row">
                      {imageType === "logo" && (
                        <>
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
                        </>
                      )}
                      <div className="pl-4">
                        <H3 like="h4" className="text-xl mb-1">
                          {name}
                        </H3>
                        {subtitle !== null && (
                          <p className="font-bold text-sm">{subtitle}</p>
                        )}
                      </div>
                    </div>

                    {item.bio !== undefined && (
                      <p className="mt-3 line-clamp-2">{item.bio}</p>
                    )}

                    {item.areas !== undefined && item.areas.length > 0 && (
                      <div className="flex font-semibold flex-col lg:flex-row w-full mt-3">
                        <div className="lg:flex-label text-xs lg:text-sm leading-4 lg:leading-6 mb-2 lg:mb-0">
                          Aktivitätsgebiete
                        </div>
                        <div className="flex-auto line-clamp-3">
                          <span>
                            {item.areas
                              .map((area) => area.area.name)
                              .join(" / ")}
                          </span>
                        </div>
                      </div>
                    )}
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
