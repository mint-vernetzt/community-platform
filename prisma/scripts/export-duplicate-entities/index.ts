import { program } from "commander";
import { type ArrayElement } from "~/lib/utils/types";
import { prismaClient } from "~/prisma.server";

program.option(
  "-e, --equality",
  "Per default this script performs a like search based on several entity fields. With this option it finds duplicates only with strict equal names."
);

program.parse(process.argv);

const options = program.opts();

async function main() {
  const organizations = await prismaClient.organization.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
      email: true,
      zipCode: true,
      street: true,
      streetNumber: true,
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

  // TODO: Combine base url with slug
  const duplicateOrganizations: {
    sample: ArrayElement<typeof organizations>;
    possibleDuplicates: {
      name: string;
      url: string;
      reason: string;
    }[];
  }[] = [];
  for (const organization of organizations) {
    const enhancedPossibleDuplicates: {
      name: string;
      url: string;
      reason: string;
    }[] = [];
    if (options.equality) {
      const equalNamePossibleDuplicates =
        await prismaClient.organization.findMany({
          select: {
            id: true,
            name: true,
            slug: true,
          },
          where: {
            AND: [
              {
                name: organization.name,
              },
              {
                id: {
                  not: organization.id,
                },
              },
            ],
          },
        });
      for (const possibleDuplicate of equalNamePossibleDuplicates) {
        if (
          duplicateOrganizations.some(
            (duplicate) => duplicate.sample.id === possibleDuplicate.id
          ) === false
        ) {
          enhancedPossibleDuplicates.push({
            name: possibleDuplicate.name,
            url: `${process.env.COMMUNITY_BASE_URL}/organization/${possibleDuplicate.slug}`,
            reason: "Equal name",
          });
        }
      }
    } else {
      const similarNamePossibleDuplicates =
        await prismaClient.organization.findMany({
          select: {
            id: true,
            name: true,
            slug: true,
          },
          where: {
            name: {
              contains: organization.name,
              mode: "insensitive",
            },
            id: {
              not: organization.id,
            },
          },
        });
      for (const possibleDuplicate of similarNamePossibleDuplicates) {
        if (
          duplicateOrganizations.some(
            (duplicate) => duplicate.sample.id === possibleDuplicate.id
          ) === false
        ) {
          enhancedPossibleDuplicates.push({
            name: possibleDuplicate.name,
            url: `${process.env.COMMUNITY_BASE_URL}/organization/${possibleDuplicate.slug}`,
            reason: "Similar name",
          });
        }
      }
      if (organization.email !== null) {
        const similarEmailPossibleDuplicates =
          await prismaClient.organization.findMany({
            select: {
              id: true,
              name: true,
              slug: true,
            },
            where: {
              email: {
                contains: organization.email,
                mode: "insensitive",
              },
              id: {
                not: organization.id,
              },
            },
          });
        for (const possibleDuplicate of similarEmailPossibleDuplicates) {
          if (
            duplicateOrganizations.some(
              (duplicate) => duplicate.sample.id === possibleDuplicate.id
            ) === false
          ) {
            enhancedPossibleDuplicates.push({
              name: possibleDuplicate.name,
              url: `${process.env.COMMUNITY_BASE_URL}/organization/${possibleDuplicate.slug}`,
              reason: "Similar email",
            });
          }
        }
      }
      if (
        organization.zipCode !== null &&
        organization.street !== null &&
        organization.streetNumber !== null
      ) {
        const similarAdressPossibleDuplicates =
          await prismaClient.organization.findMany({
            select: {
              id: true,
              name: true,
              slug: true,
            },
            where: {
              zipCode: {
                contains: organization.zipCode,
                mode: "insensitive",
              },
              street: {
                contains: organization.street,
                mode: "insensitive",
              },
              streetNumber: {
                contains: organization.streetNumber,
                mode: "insensitive",
              },
              id: {
                not: organization.id,
              },
            },
          });
        for (const possibleDuplicate of similarAdressPossibleDuplicates) {
          if (
            duplicateOrganizations.some(
              (duplicate) => duplicate.sample.id === possibleDuplicate.id
            ) === false
          ) {
            enhancedPossibleDuplicates.push({
              name: possibleDuplicate.name,
              url: `${process.env.COMMUNITY_BASE_URL}/organization/${possibleDuplicate.slug}`,
              reason: "Similar address",
            });
          }
        }
      }
      if (organization.teamMembers.length > 0) {
        const atLeastOneTeamMemberPossibleDuplicates =
          await prismaClient.organization.findMany({
            select: {
              id: true,
              name: true,
              slug: true,
            },
            where: {
              teamMembers: {
                some: {
                  profileId: {
                    in: organization.teamMembers.map(
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
        for (const possibleDuplicate of atLeastOneTeamMemberPossibleDuplicates) {
          if (
            duplicateOrganizations.some(
              (duplicate) => duplicate.sample.id === possibleDuplicate.id
            ) === false
          ) {
            enhancedPossibleDuplicates.push({
              name: possibleDuplicate.name,
              url: `${process.env.COMMUNITY_BASE_URL}/organization/${possibleDuplicate.slug}`,
              reason: "At least one equal team member",
            });
          }
        }
      }
      if (organization.admins.length > 0) {
        const atLeastOneAdminPossibleDuplicates =
          await prismaClient.organization.findMany({
            select: {
              id: true,
              name: true,
              slug: true,
            },
            where: {
              admins: {
                some: {
                  profileId: {
                    in: organization.admins.map((admin) => admin.profileId),
                  },
                },
              },
              id: {
                not: organization.id,
              },
            },
          });
        for (const possibleDuplicate of atLeastOneAdminPossibleDuplicates) {
          if (
            duplicateOrganizations.some(
              (duplicate) => duplicate.sample.id === possibleDuplicate.id
            ) === false
          ) {
            enhancedPossibleDuplicates.push({
              name: possibleDuplicate.name,
              url: `${process.env.COMMUNITY_BASE_URL}/organization/${possibleDuplicate.slug}`,
              reason: "At least one equal admin",
            });
          }
        }
      }
    }
    if (enhancedPossibleDuplicates.length > 0) {
      duplicateOrganizations.push({
        sample: organization,
        possibleDuplicates: enhancedPossibleDuplicates,
      });
      console.log({
        sample: {
          name: organization.name,
          url: `${process.env.COMMUNITY_BASE_URL}/organization/${organization.slug}`,
        },
        possibleDuplicates: enhancedPossibleDuplicates,
      });
    }
  }

  // TODO: Export to CSV in path ./data/duplicate-organizations-${date}.csv

  // TODO: Profiles
}

main()
  .catch((error) => {
    throw error;
  })
  .finally(async () => {
    await prismaClient.$disconnect();
  });
