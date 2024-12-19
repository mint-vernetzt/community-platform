import { parseWithZod } from "@conform-to/zod-v1";
import { type Organization, type Prisma, type Profile } from "@prisma/client";
import { type SupabaseClient } from "@supabase/supabase-js";
import { BlurFactor, ImageSizes, getImageURL } from "~/images.server";
import { filterProfileByVisibility } from "~/next-public-fields-filtering.server";
import { prismaClient } from "~/prisma.server";
import { searchProfilesSchema } from "~/form-helpers";
import { SearchProfiles } from "~/lib/utils/searchParams";
import { getPublicURL } from "~/storage.server";
import { type Mode } from "~/utils.server";
import { type OrganizationAdminSettingsLocales } from "./next/organization/$slug/settings/admins.server";
import { type OrganizationTeamSettingsLocales } from "./next/organization/$slug/settings/team.server";

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
              slug: true,
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
      let blurredLogo;
      if (logo !== null) {
        const publicURL = getPublicURL(authClient, logo);
        if (publicURL !== null) {
          logo = getImageURL(publicURL, {
            resize: {
              type: "fill",
              width:
                ImageSizes.Organization.ListItemEventAndOrganizationSettings
                  .Logo.width,
              height:
                ImageSizes.Organization.ListItemEventAndOrganizationSettings
                  .Logo.height,
            },
          });
          blurredLogo = getImageURL(publicURL, {
            resize: {
              type: "fill",
              width:
                ImageSizes.Organization.ListItemEventAndOrganizationSettings
                  .BlurredLogo.width,
              height:
                ImageSizes.Organization.ListItemEventAndOrganizationSettings
                  .BlurredLogo.height,
            },
            blur: BlurFactor,
          });
        }
      }
      return { ...organization, logo, blurredLogo };
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
    let blurredAvatar;
    if (avatar !== null) {
      const publicURL = getPublicURL(authClient, avatar);
      if (publicURL !== null) {
        avatar = getImageURL(publicURL, {
          resize: {
            type: "fill",
            width:
              ImageSizes.Profile.ListItemEventAndOrganizationSettings.Avatar
                .width,
            height:
              ImageSizes.Profile.ListItemEventAndOrganizationSettings.Avatar
                .height,
          },
        });
        blurredAvatar = getImageURL(publicURL, {
          resize: {
            type: "fill",
            width:
              ImageSizes.Profile.ListItemEventAndOrganizationSettings
                .BlurredAvatar.width,
            height:
              ImageSizes.Profile.ListItemEventAndOrganizationSettings
                .BlurredAvatar.height,
          },
          blur: BlurFactor,
        });
      }
    }
    return { ...profile, avatar, blurredAvatar };
  });
  return enhancedProfileSuggestions;
}

export async function getAllOffers() {
  return await prismaClient.offer.findMany({
    select: {
      id: true,
      slug: true,
    },
  });
}

export async function searchProfiles(options: {
  searchParams: URLSearchParams;
  idsToExclude?: string[];
  authClient: SupabaseClient;
  locales: OrganizationAdminSettingsLocales | OrganizationTeamSettingsLocales;
  mode: Mode;
}) {
  const { searchParams, idsToExclude, authClient, locales, mode } = options;
  type WhereStatements = (
    | {
        OR: {
          [K in Profile as string]: {
            contains: string;
            mode: Prisma.QueryMode;
          };
        }[];
      }
    | {
        id: { notIn: string[] };
      }
  )[];
  const prismaQuery = async (whereStatements: WhereStatements) => {
    return await prismaClient.profile.findMany({
      where: {
        AND: whereStatements,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        username: true,
        avatar: true,
        academicTitle: true,
        position: true,
        profileVisibility: {
          select: {
            firstName: true,
            lastName: true,
            username: true,
            avatar: true,
            academicTitle: true,
            position: true,
          },
        },
      },
      take: 10,
    });
  };

  const submission = parseWithZod(searchParams, {
    schema: searchProfilesSchema(locales),
  });
  if (
    submission.status !== "success" ||
    submission.value[SearchProfiles] === undefined
  ) {
    return {
      searchedProfiles: [] as Awaited<ReturnType<typeof prismaQuery>>,
      submission: submission.reply(),
    };
  }

  const query = submission.value[SearchProfiles].trim().split(" ");
  const whereStatements: WhereStatements = [];
  if (idsToExclude !== undefined && idsToExclude.length > 0) {
    whereStatements.push({
      id: {
        notIn: idsToExclude,
      },
    });
  }
  for (const word of query) {
    whereStatements.push({
      OR: [
        { firstName: { contains: word, mode: "insensitive" } },
        { lastName: { contains: word, mode: "insensitive" } },
        { username: { contains: word, mode: "insensitive" } },
        { email: { contains: word, mode: "insensitive" } },
      ],
    });
  }
  const searchedProfiles = await prismaQuery(whereStatements);

  let filteredSearchedProfiles;
  if (mode === "anon") {
    filteredSearchedProfiles = searchedProfiles.map((profile) => {
      return filterProfileByVisibility<typeof profile>(profile);
    });
  } else {
    filteredSearchedProfiles = searchedProfiles;
  }

  const enhancedSearchedProfiles = filteredSearchedProfiles.map((relation) => {
    let avatar = relation.avatar;
    let blurredAvatar;
    if (avatar !== null) {
      const publicURL = getPublicURL(authClient, avatar);
      if (publicURL !== null) {
        avatar = getImageURL(publicURL, {
          resize: {
            type: "fill",
            ...ImageSizes.Profile.ListItem.Avatar,
          },
        });
        blurredAvatar = getImageURL(publicURL, {
          resize: {
            type: "fill",
            ...ImageSizes.Profile.ListItem.BlurredAvatar,
          },
          blur: BlurFactor,
        });
      }
    }
    return { ...relation, avatar, blurredAvatar };
  });

  return {
    searchedProfiles: enhancedSearchedProfiles,
    submission: submission.reply(),
  };
}
