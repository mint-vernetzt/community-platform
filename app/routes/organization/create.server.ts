import { type Organization, type Prisma } from "@prisma/client";
import { prismaClient } from "~/prisma.server";
import { type supportedCookieLanguages } from "~/i18n.shared";
import { type ArrayElement } from "~/lib/utils/types";
import { type languageModuleMap } from "~/locales/.server";

export type CreateOrganizationLocales = (typeof languageModuleMap)[ArrayElement<
  typeof supportedCookieLanguages
>]["organization/create"];

export async function createOrganizationOnProfile(
  profileId: string,
  organizationName: string,
  organizationSlug: string
) {
  const [profile] = await prismaClient.$transaction([
    prismaClient.profile.update({
      where: {
        id: profileId,
      },
      data: {
        memberOf: {
          create: {
            organization: {
              create: {
                name: organizationName,
                slug: organizationSlug,
                organizationVisibility: {
                  create: {},
                },
              },
            },
          },
        },
      },
    }),
    prismaClient.organization.update({
      where: {
        slug: organizationSlug,
      },
      data: {
        admins: {
          create: {
            profileId: profileId,
          },
        },
      },
    }),
  ]);
  return profile;
}

export async function searchForOrganizationsByName(name: string) {
  const query = name.split(" ");

  let searchResult: { name: string; slug: string; logo: string | null }[] = [];

  const whereQueries: {
    OR: {
      [K in Organization as string]: {
        contains: string;
        mode: Prisma.QueryMode;
      };
    }[];
  }[] = [];
  for (const word of query) {
    whereQueries.push({
      OR: [{ name: { contains: word, mode: "insensitive" } }],
    });
  }
  searchResult = await prismaClient.organization.findMany({
    where: {
      AND: whereQueries,
    },
    select: {
      name: true,
      slug: true,
      logo: true,
    },
    take: 5,
  });
  return searchResult;
}

export async function countOrganizationsBySearchQuery(name: string) {
  const query = name.split(" ");

  let count = 0;

  const whereQueries: {
    OR: {
      [K in Organization as string]: {
        contains: string;
        mode: Prisma.QueryMode;
      };
    }[];
  }[] = [];
  for (const word of query) {
    whereQueries.push({
      OR: [{ name: { contains: word, mode: "insensitive" } }],
    });
  }
  count = await prismaClient.organization.count({
    where: {
      AND: whereQueries,
    },
  });
  return count;
}
