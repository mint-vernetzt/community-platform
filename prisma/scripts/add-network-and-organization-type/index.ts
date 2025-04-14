import { prismaClient } from "~/prisma.server";

async function main() {
  // get organizations that have network members but dont have organizationType network
  const networkLikeOrganizations = await prismaClient.organization.findMany({
    select: {
      id: true,
    },
    where: {
      types: {
        none: {
          organizationType: {
            slug: "network",
          },
        },
      },
      networkMembers: {
        some: {},
      },
    },
  });

  console.log(
    `${networkLikeOrganizations.length} network (like) organizations found, without organization type "network" set.`
  );

  const organizationTypeNetwork = await prismaClient.organizationType.findFirst(
    {
      select: {
        id: true,
      },
      where: {
        slug: "network",
      },
    }
  );

  const networkTypeOther = await prismaClient.networkType.findFirst({
    select: {
      id: true,
    },
    where: {
      slug: "other-network",
    },
  });

  console.log({ organizationTypeNetwork, networkTypeOther });

  if (organizationTypeNetwork === null || networkTypeOther === null) {
    throw new Error(
      "Organization type 'network' or network type 'other-network' not found."
    );
  }

  for (const organization of networkLikeOrganizations) {
    console.log(
      `Adding organization and network type to organization ${organization.id}...`
    );
    await prismaClient.organization.update({
      where: {
        id: organization.id,
      },
      data: {
        types: {
          connectOrCreate: {
            where: {
              organizationId_organizationTypeId: {
                organizationTypeId: organizationTypeNetwork.id,
                organizationId: organization.id,
              },
            },
            create: {
              organizationTypeId: organizationTypeNetwork.id,
            },
          },
        },
        networkTypes: {
          connectOrCreate: {
            where: {
              organizationId_networkTypeId: {
                networkTypeId: networkTypeOther.id,
                organizationId: organization.id,
              },
            },
            create: {
              networkTypeId: networkTypeOther.id,
            },
          },
        },
      },
    });
  }
}

main()
  .catch((event) => {
    console.error(event);
    process.exit(1);
  })
  .finally(() => {
    prismaClient.$disconnect();
    console.log("Done.");
  });
