import { prismaClient } from "~/prisma.server";

async function main() {
  const organizations = await prismaClient.organization.findMany({
    select: {
      id: true,
      name: true,
    },
  });

  for (const organization of organizations) {
    const visibility = await prismaClient.organizationVisibility.findUnique({
      where: {
        organizationId: organization.id,
      },
    });

    if (visibility !== null) {
      continue;
    }

    await prismaClient.organizationVisibility.create({
      data: {
        organizationId: organization.id,
      },
    });

    console.log(
      `Created visibility settings for organization ${organization.name} (${organization.id}).`
    );
  }
}

main()
  .catch((error) => {
    throw error;
  })
  .finally(async () => {
    await prismaClient.$disconnect();
  });
