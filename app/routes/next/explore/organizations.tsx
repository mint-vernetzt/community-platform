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
} from "~/public-fields-filtering.server";
import { getAllOffers } from "~/routes/utils.server";
import { getPublicURL } from "~/storage.server";
import { getAreas } from "~/utils.server";
import {
  getAllOrganizations,
  getPaginationValues,
  getSortValue,
} from "./utils.server";
import { useTranslation } from "react-i18next";
import { getFeatureAbilities } from "~/lib/utils/application";
// import styles from "../../../common/design/styles/styles.css";

// export const links: LinksFunction = () => [{ rel: "stylesheet", href: styles }];

const i18nNS = ["routes/explore/organizations"];
export const handle = {
  i18n: i18nNS,
};

export const loader = async (args: LoaderFunctionArgs) => {
  const { request } = args;
  const { authClient } = createAuthClient(request);

  const abilities = await getFeatureAbilities(authClient, ["filter"]);

  console.log(abilities);

  if (abilities.filter.hasAccess === false) {
    return redirect("/explore/organizations");
  }

  const { skip, take, page, itemsPerPage } = getPaginationValues(request);
  const { sortBy } = getSortValue(request);

  const sessionUser = await getSessionUser(authClient);

  const isLoggedIn = sessionUser !== null;

  const areas = await getAreas();
  const offers = await getAllOffers();

  const rawOrganizations = await getAllOrganizations({
    skip: skip,
    take: take,
    sortBy,
  });

  const enhancedOrganizations = [];

  for (const organization of rawOrganizations) {
    let enhancedOrganization = {
      ...organization,
      teamMembers: await prismaClient.profile.findMany({
        where: {
          memberOf: {
            some: {
              organizationId: organization.id,
            },
          },
        },
        select: {
          firstName: true,
          lastName: true,
          avatar: true,
          username: true,
          id: true,
        },
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
          resize: { type: "fill", width: 136, height: 136 },
          gravity: GravityType.center,
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

  return json({
    isLoggedIn,
    organizations: enhancedOrganizations,
    areas,
    offers,
    pagination: { page, itemsPerPage },
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
