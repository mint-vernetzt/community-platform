import { prismaClient } from "~/prisma.server";

export async function updateFilterVectorOfOrganization(organizationId: string) {
  const organization = await prismaClient.organization.findFirst({
    where: { id: organizationId },
    select: {
      id: true,
      slug: true,
      types: {
        select: {
          organizationType: {
            select: {
              slug: true,
            },
          },
        },
      },
      focuses: {
        select: {
          focus: {
            select: {
              slug: true,
            },
          },
        },
      },
      areas: {
        select: {
          area: {
            select: {
              slug: true,
            },
          },
        },
      },
    },
  });
  if (organization !== null) {
    if (
      organization.types.length === 0 &&
      organization.focuses.length === 0 &&
      organization.areas.length === 0
    ) {
      await prismaClient.$queryRawUnsafe(
        `update profiles set filter_vector = NULL where id = '${organization.id}'`
      );
    } else {
      const typeVectors = organization.types.map(
        (relation) => `type:${relation.organizationType.slug}`
      );
      const focusVectors = organization.focuses.map(
        (relation) => `focus:${relation.focus.slug}`
      );
      const areaVectors = organization.areas.map(
        (relation) => `area:${relation.area.slug}`
      );
      const vectors = [...typeVectors, ...focusVectors, ...areaVectors];
      const vectorString = `{"${vectors.join(`","`)}"}`;
      const query = `update organizations set filter_vector = array_to_tsvector('${vectorString}') where id = '${organization.id}'`;
      await prismaClient.$queryRawUnsafe(query);
    }
  }
}
