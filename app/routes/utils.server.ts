import { type Organization, type Prisma, type Profile } from "@prisma/client";
import { type SupabaseClient } from "@supabase/supabase-js";
import { GravityType, getImageURL } from "~/images.server";
import { prismaClient } from "~/prisma.server";
import { getPublicURL } from "~/storage.server";

export async function getProfileCount() {
  return await prismaClient.profile.count();
}

export async function getOrganizationCount() {
  return await prismaClient.organization.count();
}

export async function getEventCount() {
  return await prismaClient.event.count({
    where: {
      published: true,
    },
  });
}

export async function getProjectCount() {
  return await prismaClient.project.count({
    where: {
      published: true,
    },
  });
}

export async function getOrganizationSuggestionsForAutocomplete(
  authClient: SupabaseClient,
  notIncludedSlugs: string[],
  query: string[]
) {
  const whereQueries = [];
  for (const word of query) {
    const contains: {
      OR: [
        {
          [K in Organization as string]: {
            contains: string;
            mode: Prisma.QueryMode;
          };
        }
      ];
    } = {
      OR: [
        {
          name: {
            contains: word,
            mode: "insensitive",
          },
        },
      ],
    };
    whereQueries.push(contains);
  }
  const organizationSuggestions = await prismaClient.organization.findMany({
    select: {
      id: true,
      name: true,
      logo: true,
      types: {
        select: {
          organizationType: {
            select: {
              title: true,
            },
          },
        },
      },
    },
    where: {
      AND: [
        {
          slug: {
            notIn: notIncludedSlugs,
          },
        },
        ...whereQueries,
      ],
    },
    take: 6,
    orderBy: {
      name: "asc",
    },
  });

  const enhancedOrganizationSuggestions = organizationSuggestions.map(
    (organization) => {
      let logo = organization.logo;
      if (logo !== null) {
        const publicURL = getPublicURL(authClient, logo);
        if (publicURL !== null) {
          logo = getImageURL(publicURL, {
            resize: { type: "fit", width: 64, height: 64 },
            gravity: GravityType.center,
          });
        }
      }
      return { ...organization, logo };
    }
  );

  return enhancedOrganizationSuggestions;
}

export async function getProfileSuggestionsForAutocomplete(
  authClient: SupabaseClient,
  notIncludedIds: string[],
  query: string[]
) {
  const whereQueries = [];
  for (const word of query) {
    const contains: {
      OR: {
        [K in Profile as string]: { contains: string; mode: Prisma.QueryMode };
      }[];
    } = {
      OR: [
        {
          firstName: {
            contains: word,
            mode: "insensitive",
          },
        },
        {
          lastName: {
            contains: word,
            mode: "insensitive",
          },
        },
        {
          email: {
            contains: word,
            mode: "insensitive",
          },
        },
      ],
    };
    whereQueries.push(contains);
  }
  const profileSuggestions = await prismaClient.profile.findMany({
    select: {
      id: true,
      firstName: true,
      lastName: true,
      avatar: true,
      position: true,
    },
    where: {
      AND: [
        {
          id: {
            notIn: notIncludedIds,
          },
        },
        ...whereQueries,
      ],
    },
    take: 6,
    orderBy: {
      firstName: "asc",
    },
  });

  const enhancedProfileSuggestions = profileSuggestions.map((profile) => {
    let avatar = profile.avatar;
    if (avatar !== null) {
      const publicURL = getPublicURL(authClient, avatar);
      if (publicURL !== null) {
        avatar = getImageURL(publicURL, {
          resize: { type: "fit", width: 64, height: 64 },
          gravity: GravityType.center,
        });
      }
    }
    return { ...profile, avatar };
  });
  return enhancedProfileSuggestions;
}

export async function getAllOffers() {
  return await prismaClient.offer.findMany({
    orderBy: {
      title: "asc",
    },
    select: {
      id: true,
      title: true,
    },
  });
}
