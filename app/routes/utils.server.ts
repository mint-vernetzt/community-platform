import { type Organization, type Prisma } from "@prisma/client";
import { type SupabaseClient } from "@supabase/supabase-js";
import { GravityType } from "imgproxy/dist/types";
import { getImageURL } from "~/images.server";
import { prismaClient } from "~/prisma.server";
import { getPublicURL } from "~/storage.server";

export async function getProfileCount() {
  return await prismaClient.profile.count();
}

export async function getOrganizationCount() {
  return await prismaClient.organization.count();
}

export async function getEventCount() {
  return await prismaClient.event.count();
}

export async function getOrganizationSuggestionsForAutocomplete(
  authClient: SupabaseClient,
  notIncludedSlugs: string[],
  query: string[]
) {
  let whereQueries = [];
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
