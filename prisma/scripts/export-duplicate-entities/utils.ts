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
  for (const sample of organizations) {
    const enhancedPossibleDuplicates: EnhancedPossibleDuplicates = [];
    for (const key in sample) {
      const typedKey = key as keyof typeof sample;
      if (
        sample[typedKey] === null ||
        typedKey === "id" ||
        typedKey === "slug"
      ) {
        continue;
      }
      if (typedKey === "teamMembers" || typedKey === "admins") {
        const possibleDuplicates = organizations.filter((organization) => {
          return organization[typedKey].some(({ profileId }) => {
            return (
              sample.id !== organization.id &&
              sample[typedKey].some(
                ({ profileId: sampleProfileId }) =>
                  sampleProfileId === profileId
              )
            );
          });
        });
        for (const possibleDuplicate of possibleDuplicates) {
          if (
            duplicateOrganizations.some((organization) => {
              return (
                organization.sample.id === possibleDuplicate.id ||
                organization.possibleDuplicates.some(
                  (duplicate) => duplicate.id === possibleDuplicate.id
                )
              );
            }) === false
          ) {
            enhancedPossibleDuplicates.push({
              id: possibleDuplicate.id,
              name: possibleDuplicate.name,
              url: `${process.env.COMMUNITY_BASE_URL}/organization/${possibleDuplicate.slug}`,
              reason: `Similar ${typedKey}`,
            });
          }
        }
      } else if (
        typedKey === "zipCode" ||
        typedKey === "streetNumber" ||
        typedKey === "street"
      ) {
        const possibleDuplicates = organizations.filter((organization) => {
          if (
            organization.zipCode === null ||
            organization.street === null ||
            organization.streetNumber === null ||
            sample.zipCode === null ||
            sample.street === null ||
            sample.streetNumber === null
          ) {
            return false;
          }
          return (
            sample.id !== organization.id &&
            (organization.zipCode.includes(sample.zipCode) ||
              sample.zipCode.includes(organization.zipCode)) &&
            (organization.street.includes(sample.street) ||
              sample.street.includes(organization.street)) &&
            (organization.streetNumber.includes(sample.streetNumber) ||
              sample.streetNumber.includes(organization.streetNumber))
          );
        });
        for (const possibleDuplicate of possibleDuplicates) {
          if (
            duplicateOrganizations.some((organization) => {
              return (
                organization.sample.id === possibleDuplicate.id ||
                organization.possibleDuplicates.some(
                  (duplicate) => duplicate.id === possibleDuplicate.id
                )
              );
            }) === false
          ) {
            enhancedPossibleDuplicates.push({
              id: possibleDuplicate.id,
              name: possibleDuplicate.name,
              url: `${process.env.COMMUNITY_BASE_URL}/organization/${possibleDuplicate.slug}`,
              reason: "Similar address",
            });
          }
        }
      } else {
        const possibleDuplicates = organizations.filter((organization) => {
          if (organization[typedKey] === null || sample[typedKey] === null) {
            return false;
          }
          return (
            sample.id !== organization.id &&
            // Even if typescript claims that organization[typedKey] and sample[typedKey] has the correct type i needed to add the below assertion to make the compiler happy when running npm run typecheck
            ((organization[typedKey] as string).includes(
              sample[typedKey] as string
            ) ||
              (sample[typedKey] as string).includes(
                organization[typedKey] as string
              ))
          );
        });
        for (const possibleDuplicate of possibleDuplicates) {
          if (
            duplicateOrganizations.some((organization) => {
              return (
                organization.sample.id === possibleDuplicate.id ||
                organization.possibleDuplicates.some(
                  (duplicate) => duplicate.id === possibleDuplicate.id
                )
              );
            }) === false
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
    }
    if (enhancedPossibleDuplicates.length > 0) {
      duplicateOrganizations.push({
        sample: {
          id: sample.id,
          name: sample.name,
          url: `${process.env.COMMUNITY_BASE_URL}/organization/${sample.slug}`,
        },
        possibleDuplicates: enhancedPossibleDuplicates,
      });
    }
  }

  const now = new Date();
  // eslint-disable-next-line import/no-named-as-default-member
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
  for (const sample of profiles) {
    const enhancedPossibleDuplicates: EnhancedPossibleDuplicates = [];
    for (const key in sample) {
      const typedKey = key as keyof typeof sample;

      if (
        sample[typedKey] === null ||
        typedKey === "id" ||
        typedKey === "username"
      ) {
        continue;
      }
      if (typedKey === "firstName" || typedKey === "lastName") {
        const possibleDuplicates = profiles.filter((profile) => {
          const profileName = `${profile.firstName} ${profile.lastName}`.trim();
          const sampleName = `${sample.firstName} ${sample.lastName}`.trim();
          return (
            sample.id !== profile.id &&
            (profileName.includes(sampleName) ||
              sampleName.includes(profileName))
          );
        });
        for (const possibleDuplicate of possibleDuplicates) {
          if (
            duplicateProfiles.some((profile) => {
              return (
                profile.sample.id === possibleDuplicate.id ||
                profile.possibleDuplicates.some(
                  (duplicate) => duplicate.id === possibleDuplicate.id
                )
              );
            }) === false
          ) {
            enhancedPossibleDuplicates.push({
              id: possibleDuplicate.id,
              name: `${possibleDuplicate.firstName} ${possibleDuplicate.lastName}`,
              url: `${process.env.COMMUNITY_BASE_URL}/profile/${possibleDuplicate.username}`,
              reason: "Similar Name",
            });
          }
        }
      } else {
        const possibleDuplicates = profiles.filter((profile) => {
          if (profile[typedKey] === null || sample[typedKey] === null) {
            return false;
          }
          return (
            sample.id !== profile.id &&
            // Even if typescript claims that profile[typedKey] and sample[typedKey] has the correct type i needed to add the below assertion to make the compiler happy when running npm run typecheck
            ((profile[typedKey] as string).includes(
              sample[typedKey] as string
            ) ||
              (sample[typedKey] as string).includes(
                profile[typedKey] as string
              ))
          );
        });
        for (const possibleDuplicate of possibleDuplicates) {
          if (
            duplicateProfiles.some((profile) => {
              return (
                profile.sample.id === possibleDuplicate.id ||
                profile.possibleDuplicates.some(
                  (duplicate) => duplicate.id === possibleDuplicate.id
                )
              );
            }) === false
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
    }
    if (enhancedPossibleDuplicates.length > 0) {
      duplicateProfiles.push({
        sample: {
          id: sample.id,
          name: `${sample.firstName} ${sample.lastName}`,
          url: `${process.env.COMMUNITY_BASE_URL}/profile/${sample.username}`,
        },
        possibleDuplicates: enhancedPossibleDuplicates,
      });
    }
  }

  const now = new Date();
  // eslint-disable-next-line import/no-named-as-default-member
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
