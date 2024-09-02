import fs from "fs-extra";
import { prismaClient } from "~/prisma.server";

const filename = import.meta.resolve(".");
const currentDirectory = filename.substring(7, filename.lastIndexOf("/"));

type EnhancedPossibleDuplicates = {
  id: string;
  name: string;
  url: string;
  reason: string;
}[];

export async function exportPossibleOrganizationDuplicates() {
  const organizations = await prismaClient.organization.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
      email: true,
      zipCode: true,
      street: true,
      streetNumber: true,
      phone: true,
      website: true,
      facebook: true,
      linkedin: true,
      twitter: true,
      xing: true,
      instagram: true,
      youtube: true,
      tiktok: true,
      mastodon: true,
      teamMembers: {
        select: {
          profileId: true,
        },
      },
      admins: {
        select: {
          profileId: true,
        },
      },
    },
  });

  if (organizations.length === 0) {
    console.log("No organizations found.");
    return;
  }

  const duplicateOrganizations: {
    sample: {
      id: string;
      name: string;
      url: string;
    };
    possibleDuplicates: EnhancedPossibleDuplicates;
  }[] = [];
  for (const organization of organizations) {
    const enhancedPossibleDuplicates: EnhancedPossibleDuplicates = [];
    for (const key in organization) {
      const typedKey = key as keyof typeof organization;
      if (
        organization[typedKey] === null ||
        typedKey === "id" ||
        typedKey === "slug"
      ) {
        continue;
      }
      if (typedKey === "teamMembers" || typedKey === "admins") {
        const possibleDuplicates = await prismaClient.organization.findMany({
          select: {
            id: true,
            name: true,
            slug: true,
          },
          where: {
            [typedKey]: {
              some: {
                profileId: {
                  in: organization[typedKey].map(
                    (teamMember) => teamMember.profileId
                  ),
                },
              },
            },
            id: {
              not: organization.id,
            },
          },
        });
        for (const possibleDuplicate of possibleDuplicates) {
          if (
            duplicateOrganizations.some(
              (duplicate) => duplicate.sample.id === possibleDuplicate.id
            ) === false
          ) {
            enhancedPossibleDuplicates.push({
              id: possibleDuplicate.id,
              name: possibleDuplicate.name,
              url: `${process.env.COMMUNITY_BASE_URL}/organization/${possibleDuplicate.slug}`,
              reason: `Similar ${typedKey}`,
            });
          }
        }
      } else {
        const possibleDuplicates = await prismaClient.organization.findMany({
          select: {
            id: true,
            name: true,
            slug: true,
          },
          where: {
            [typedKey]: {
              contains: organization[typedKey],
              mode: "insensitive",
            },
            id: {
              not: organization.id,
            },
          },
        });
        for (const possibleDuplicate of possibleDuplicates) {
          if (
            duplicateOrganizations.some(
              (duplicate) => duplicate.sample.id === possibleDuplicate.id
            ) === false
          ) {
            enhancedPossibleDuplicates.push({
              id: possibleDuplicate.id,
              name: possibleDuplicate.name,
              url: `${process.env.COMMUNITY_BASE_URL}/organization/${possibleDuplicate.slug}`,
              reason: `Similar ${typedKey}`,
            });
          }
        }
      }
      if (enhancedPossibleDuplicates.length > 0) {
        duplicateOrganizations.push({
          sample: {
            id: organization.id,
            name: organization.name,
            url: `${process.env.COMMUNITY_BASE_URL}/organization/${organization.slug}`,
          },
          possibleDuplicates: enhancedPossibleDuplicates,
        });
      }
    }
  }

  const now = new Date();
  fs.writeJSON(
    `${currentDirectory}/data/duplicate-organizations-${now
      .toISOString()
      .replaceAll(":", "-")
      .replaceAll(".", "_")}.json`,
    duplicateOrganizations,
    {
      spaces: 4,
    }
  );
}

export async function exportPossibleProfileDuplicates() {
  const profiles = await prismaClient.profile.findMany({
    select: {
      id: true,
      firstName: true,
      lastName: true,
      username: true,
      phone: true,
      website: true,
      facebook: true,
      linkedin: true,
      twitter: true,
      xing: true,
      instagram: true,
      youtube: true,
      tiktok: true,
      mastodon: true,
    },
  });

  if (profiles.length === 0) {
    console.log("No profiles found.");
    return;
  }

  const duplicateProfiles: {
    sample: {
      id: string;
      name: string;
      url: string;
    };
    possibleDuplicates: EnhancedPossibleDuplicates;
  }[] = [];
  for (const profile of profiles) {
    const enhancedPossibleDuplicates: EnhancedPossibleDuplicates = [];
    for (const key in profile) {
      const typedKey = key as keyof typeof profile;

      if (
        profile[typedKey] === null ||
        typedKey === "id" ||
        typedKey === "username"
      ) {
        continue;
      }
      const possibleDuplicates = await prismaClient.profile.findMany({
        select: {
          id: true,
          firstName: true,
          lastName: true,
          username: true,
        },
        where: {
          [typedKey]: {
            contains: profile[typedKey],
            mode: "insensitive",
          },
          id: {
            not: profile.id,
          },
        },
      });
      for (const possibleDuplicate of possibleDuplicates) {
        if (
          duplicateProfiles.some(
            (duplicate) => duplicate.sample.id === possibleDuplicate.id
          ) === false
        ) {
          enhancedPossibleDuplicates.push({
            id: possibleDuplicate.id,
            name: `${possibleDuplicate.firstName} ${possibleDuplicate.lastName}`,
            url: `${process.env.COMMUNITY_BASE_URL}/profile/${possibleDuplicate.username}`,
            reason: `Similar ${typedKey}`,
          });
        }
      }
    }
    if (enhancedPossibleDuplicates.length > 0) {
      duplicateProfiles.push({
        sample: {
          id: profile.id,
          name: `${profile.firstName} ${profile.lastName}`,
          url: `${process.env.COMMUNITY_BASE_URL}/profile/${profile.username}`,
        },
        possibleDuplicates: enhancedPossibleDuplicates,
      });
    }
  }

  const now = new Date();
  fs.writeJSON(
    `${currentDirectory}/data/duplicate-profiles-${now
      .toISOString()
      .replaceAll(":", "-")
      .replaceAll(".", "_")}.json`,
    duplicateProfiles,
    {
      spaces: 4,
    }
  );
}
