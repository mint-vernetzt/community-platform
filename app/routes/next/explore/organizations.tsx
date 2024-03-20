import {
  Button,
  CardContainer,
  OrganizationCard,
} from "@mint-vernetzt/components";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import {
  Form,
  useFetcher,
  useLoaderData,
  useSearchParams,
  useSubmit,
} from "@remix-run/react";
import React from "react";
import { createAuthClient, getSessionUser } from "~/auth.server";
import { H1 } from "~/components/Heading/Heading";
import { GravityType, getImageURL } from "~/images.server";
import { prismaClient } from "~/prisma.server";
import {
  filterOrganizationByVisibility,
  filterProfileByVisibility,
} from "~/next-public-fields-filtering.server";
import { getAllOffers } from "~/routes/utils.server";
import { getPublicURL } from "~/storage.server";
import { getAreas } from "~/utils.server";
import {
  getAreaNameBySlug,
  getAreasBySearchQuery,
  getPaginationValues,
  getSortValue,
} from "./utils.server";
import { useTranslation } from "react-i18next";
import { getFeatureAbilities } from "~/lib/utils/application";
import { z } from "zod";
import { parseWithZod } from "@conform-to/zod-v1";
import { invariantResponse } from "~/lib/utils/response";
import {
  getAllFocuses,
  getAllOrganizationTypes,
  getAllOrganizations,
  getFilterCountForSlug,
  getOrganizationFilterVector,
  getOrganizationsCount,
  getTakeParam,
  getVisibilityFilteredOrganizationsCount,
} from "./organizations.server";
import { ArrayElement } from "~/lib/utils/types";
// import styles from "../../../common/design/styles/styles.css";

// export const links: LinksFunction = () => [{ rel: "stylesheet", href: styles }];

const i18nNS = ["routes/explore/organizations"];
export const handle = {
  i18n: i18nNS,
};

const sortValues = ["name-asc", "name-desc", "createdAt-desc"] as const;

export type GetOrganizationsSchema = z.infer<typeof getOrganizationsSchema>;

const getOrganizationsSchema = z.object({
  filter: z
    .object({
      type: z.array(z.string()),
      focus: z.array(z.string()),
      area: z.array(z.string()),
    })
    .optional(),
  sortBy: z
    .enum(sortValues)
    .optional()
    .transform((sortValue) => {
      if (sortValue !== undefined) {
        const splittedValue = sortValue.split("-");
        return {
          value: splittedValue[0],
          direction: splittedValue[1],
        };
      }
      return sortValue;
    }),
  page: z.number().optional(),
  search: z.string().optional(),
});

export const loader = async (args: LoaderFunctionArgs) => {
  const { request } = args;
  const url = new URL(request.url);
  const searchParams = url.searchParams;
  const submission = parseWithZod(searchParams, {
    schema: getOrganizationsSchema,
  });
  invariantResponse(
    submission.status === "success",
    "Validation failed for get request",
    { status: 400 }
  );
  const take = getTakeParam(submission.value.page);
  const { authClient } = createAuthClient(request);

  const abilities = await getFeatureAbilities(authClient, ["filter"]);
  if (abilities.filter.hasAccess === false) {
    return redirect("/explore/organizations");
  }

  const sessionUser = await getSessionUser(authClient);
  const isLoggedIn = sessionUser !== null;

  let filteredByVisibilityCount;
  if (!isLoggedIn && submission.value.filter !== undefined) {
    filteredByVisibilityCount = await getVisibilityFilteredOrganizationsCount({
      filter: submission.value.filter,
    });
  }
  const organizationsCount = await getOrganizationsCount({
    filter: submission.value.filter,
  });
  const organizations = await getAllOrganizations({
    filter: submission.value.filter,
    sortBy: submission.value.sortBy,
    take,
    isLoggedIn,
  });

  const enhancedOrganizations = [];
  for (const organization of organizations) {
    let enhancedOrganization = {
      ...organization,
    };

    if (!isLoggedIn) {
      // Filter organization
      enhancedOrganization =
        filterOrganizationByVisibility<typeof enhancedOrganization>(
          enhancedOrganization
        );
      // Filter team members
      enhancedOrganization.teamMembers = enhancedOrganization.teamMembers.map(
        (relation) => {
          const filteredProfile = filterProfileByVisibility<
            typeof relation.profile
          >(relation.profile);
          return { ...relation, profile: { ...filteredProfile } };
        }
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
          resize: { type: "fill", width: 136, height: 136 },
          gravity: GravityType.center,
        });
      }
    }

    enhancedOrganization.teamMembers = enhancedOrganization.teamMembers.map(
      (relation) => {
        let avatar = relation.profile.avatar;
        if (avatar !== null) {
          const publicURL = getPublicURL(authClient, avatar);
          avatar = getImageURL(publicURL, {
            resize: { type: "fit", width: 64, height: 64 },
          });
        }
        return { ...relation, profile: { ...relation.profile, avatar } };
      }
    );

    enhancedOrganizations.push(enhancedOrganization);
  }

  const filterVector = await getOrganizationFilterVector({
    filter: submission.value.filter,
  });

  const areas = await getAreasBySearchQuery(submission.value.search);
  type EnhancedAreas = Array<
    ArrayElement<Awaited<ReturnType<typeof getAreasBySearchQuery>>> & {
      vectorCount: ReturnType<typeof getFilterCountForSlug>;
      isChecked: boolean;
    }
  >;
  const enhancedAreas = {
    global: [] as EnhancedAreas,
    country: [] as EnhancedAreas,
    state: [] as EnhancedAreas,
    district: [] as EnhancedAreas,
  };
  for (const area of areas) {
    const vectorCount = getFilterCountForSlug(area.slug, filterVector, "area");
    let isChecked;
    // TODO: Remove '|| area.slug === null' when slug isn't optional anymore (after migration)
    if (submission.value.filter === undefined || area.slug === null) {
      isChecked = false;
    } else {
      isChecked = submission.value.filter.area.includes(area.slug);
    }
    const enhancedArea = {
      ...area,
      vectorCount,
      isChecked,
    };
    enhancedAreas[area.type].push(enhancedArea);
  }
  let selectedAreas: Array<{
    slug: string;
    name: string | null;
    vectorCount: number;
    isInSearchResultsList: boolean;
  }> = [];
  if (submission.value.filter !== undefined) {
    selectedAreas = await Promise.all(
      submission.value.filter.area.map(async (slug) => {
        const vectorCount = getFilterCountForSlug(slug, filterVector, "area");
        const isInSearchResultsList = areas.some((area) => {
          return area.slug === slug;
        });
        return {
          slug,
          name: (await getAreaNameBySlug(slug)) || null,
          vectorCount,
          isInSearchResultsList,
        };
      })
    );
  }

  const types = await getAllOrganizationTypes();
  const enhancedTypes = types.map((type) => {
    const vectorCount = getFilterCountForSlug(type.slug, filterVector, "type");
    let isChecked;
    // TODO: Remove '|| offer.slug === null' when slug isn't optional anymore (after migration)
    if (submission.value.filter === undefined || type.slug === null) {
      isChecked = false;
    } else {
      isChecked = submission.value.filter.type.includes(type.slug);
    }
    return { ...type, vectorCount, isChecked };
  });
  let selectedTypes: Array<{ slug: string; title: string | null }> = [];
  if (submission.value.filter !== undefined) {
    selectedTypes = submission.value.filter.type.map((slug) => {
      const typeMatch = types.find((type) => {
        return type.slug === slug;
      });
      return {
        slug,
        title: typeMatch?.title || null,
      };
    });
  }

  const focuses = await getAllFocuses();
  const enhancedFocuses = focuses.map((focus) => {
    const vectorCount = getFilterCountForSlug(
      focus.slug,
      filterVector,
      "focus"
    );
    let isChecked;
    // TODO: Remove '|| offer.slug === null' when slug isn't optional anymore (after migration)
    if (submission.value.filter === undefined || focus.slug === null) {
      isChecked = false;
    } else {
      isChecked = submission.value.filter.focus.includes(focus.slug);
    }
    return { ...focus, vectorCount, isChecked };
  });
  let selectedFocuses: Array<{ slug: string; title: string | null }> = [];
  if (submission.value.filter !== undefined) {
    selectedFocuses = submission.value.filter.focus.map((slug) => {
      const focusMatch = focuses.find((focus) => {
        return focus.slug === slug;
      });
      return {
        slug,
        title: focusMatch?.title || null,
      };
    });
  }

  let transformedSubmission;
  if (submission.value.sortBy !== undefined) {
    transformedSubmission = {
      ...submission,
      value: {
        ...submission.value,
        sortBy: `${submission.value.sortBy.value}-${submission.value.sortBy.direction}`,
      },
    };
  } else {
    transformedSubmission = {
      ...submission,
      value: {
        ...submission.value,
        sortBy: sortValues[0],
      },
    };
  }

  return json({
    isLoggedIn,
    organizations: enhancedOrganizations,
    areas: enhancedAreas,
    selectedAreas,
    focuses: enhancedFocuses,
    selectedFocuses,
    types: enhancedTypes,
    selectedTypes,
    submission: transformedSubmission,
    filteredByVisibilityCount,
    organizationsCount,
  });
};

export default function Index() {
  const loaderData = useLoaderData<typeof loader>();
  const fetcher = useFetcher<typeof loader>();
  const [searchParams] = useSearchParams();
  const sortBy = searchParams.get("sortBy");
  const [items, setItems] = React.useState(loaderData.organizations);
  const [shouldFetch, setShouldFetch] = React.useState(() => {
    if (loaderData.organizations.length < loaderData.pagination.itemsPerPage) {
      return false;
    }
    return true;
  });
  const [page, setPage] = React.useState(() => {
    const pageParam = searchParams.get("page");
    if (pageParam !== null) {
      return parseInt(pageParam);
    }
    return 1;
  });

  React.useEffect(() => {
    if (fetcher.data !== undefined) {
      setItems((organizations) => {
        return fetcher.data !== undefined
          ? [...organizations, ...fetcher.data.organizations]
          : [...organizations];
      });
      setPage(fetcher.data.pagination.page);
      if (
        fetcher.data.organizations.length < fetcher.data.pagination.itemsPerPage
      ) {
        setShouldFetch(false);
      }
    }
  }, [fetcher.data]);

  React.useEffect(() => {
    setItems(loaderData.organizations);

    if (loaderData.organizations.length < loaderData.pagination.itemsPerPage) {
      setShouldFetch(false);
    } else {
      setShouldFetch(true);
    }
    setPage(1);
  }, [loaderData.organizations, loaderData.pagination.itemsPerPage]);

  const submit = useSubmit();
  function handleChange(event: React.FormEvent<HTMLFormElement>) {
    submit(event.currentTarget);
  }

  const { t } = useTranslation(i18nNS);

  return (
    <>
      <section className="container my-8 md:mt-10 lg:mt-20 text-center">
        <H1 like="h0">{t("title")}</H1>
        <p className="">{t("intro")}</p>
      </section>

      <section className="container mb-8">
        <Form method="get" onChange={handleChange}>
          <input hidden name="page" value={1} readOnly />
          <div className="flex flex-wrap -mx-4">
            <div className="form-control px-4 pb-4 flex-initial w-full md:w-1/4">
              <label className="block font-semibold mb-2">
                {t("filter.sort.label")}
              </label>
              <select
                id="sortBy"
                name="sortBy"
                defaultValue={sortBy || "nameAsc"}
                className="select w-full select-bordered"
              >
                <option key="nameAsc" value="nameAsc">
                  {t("filter.sortBy.nameAsc")}
                </option>
                <option key="nameDesc" value="nameDesc">
                  {t("filter.sortBy.nameDesc")}
                </option>
                <option key="newest" value="newest">
                  {t("filter.sortBy.newest")}
                </option>
              </select>
            </div>
          </div>
          <div className="flex justify-end items-end">
            <noscript>
              <button
                id="noScriptSubmitButton"
                type="submit"
                className="btn btn-primary mr-2"
              >
                Sortierung anwenden
              </button>
            </noscript>
          </div>
        </Form>
      </section>

      <section className="mv-mx-auto sm:mv-px-4 md:mv-px-0 xl:mv-px-2 mv-w-full sm:mv-max-w-screen-sm md:mv-max-w-screen-md lg:mv-max-w-screen-lg xl:mv-max-w-screen-xl 2xl:mv-max-w-screen-2xl">
        <CardContainer type="multi row">
          {items.length > 0 ? (
            items.map((organization) => {
              return (
                <OrganizationCard
                  key={`organization-${organization.id}`}
                  publicAccess={!loaderData.isLoggedIn}
                  organization={organization}
                />
              );
            })
          ) : (
            <p>{t("empty")}</p>
          )}
        </CardContainer>
        {shouldFetch && (
          <div className="mv-w-full mv-flex mv-justify-center mv-mb-8 md:mv-mb-24 lg:mv-mb-8 mv-mt-4 lg:mv-mt-8">
            <fetcher.Form method="get">
              <input
                key="sortBy"
                type="hidden"
                name="sortBy"
                value={sortBy || "nameAsc"}
              />
              <input key="page" type="hidden" name="page" value={page + 1} />
              <Button
                size="large"
                variant="outline"
                loading={fetcher.state === "loading"}
              >
                {t("more")}
              </Button>
            </fetcher.Form>
          </div>
        )}
      </section>
    </>
  );
}
