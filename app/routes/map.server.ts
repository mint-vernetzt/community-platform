import { type ArrayElement } from "~/lib/utils/types";
import { type GetSearchSchema } from "./explore/all.shared";
import { type GetOrganizationsSchema } from "./explore/organizations.shared";
import { type SUPPORTED_COOKIE_LANGUAGES } from "~/i18n.shared";
import { getOrganizationWhereClauses } from "./explore/organizations.server";
import { prismaClient } from "~/prisma.server";
import { type languageModuleMap } from "~/locales/.server";

export type MapLocales = (typeof languageModuleMap)[ArrayElement<
  typeof SUPPORTED_COOKIE_LANGUAGES
>]["map"];

export async function getAllOrganizations(options: {
  filter: GetOrganizationsSchema["orgFilter"];
  sortBy: GetOrganizationsSchema["orgSortBy"];
  search: GetSearchSchema["search"];
  language: ArrayElement<typeof SUPPORTED_COOKIE_LANGUAGES>;
}) {
  const { filter, sortBy, search, language } = options;

  const whereClauses = getOrganizationWhereClauses({
    filter,
    search,
    isLoggedIn: false,
    language,
  });

  const organizations = await prismaClient.organization.findMany({
    select: {
      id: true,
      slug: true,
      name: true,
      logo: true,
      longitude: true,
      latitude: true,
      street: true,
      streetNumber: true,
      zipCode: true,
      city: true,
      types: {
        select: {
          organizationType: {
            select: {
              slug: true,
            },
          },
        },
      },
      networkTypes: {
        select: {
          networkType: {
            select: {
              slug: true,
            },
          },
        },
      },
      organizationVisibility: {
        select: {
          id: true,
          slug: true,
          name: true,
          logo: true,
          longitude: true,
          latitude: true,
          types: true,
          networkTypes: true,
        },
      },
    },
    where: {
      AND: [
        whereClauses,
        {
          longitude: {
            not: null,
          },
          latitude: {
            not: null,
          },
        },
      ],
    },
    orderBy: [
      {
        [sortBy.split("-")[0]]: sortBy.split("-")[1],
      },
      {
        id: "asc",
      },
    ],
  });

  return organizations;
}
