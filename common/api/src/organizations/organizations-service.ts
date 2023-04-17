import { prismaClient } from "./../../prisma";

export type PublicOrganizations = Awaited<
  ReturnType<typeof getPublicOrganizations>
>;

async function getPublicOrganizations(skip: number, take: number) {
  const publicOrganizations = await prismaClient.organization.findMany({
    select: {
      id: true,
      name: true,
    },
    skip,
    take,
  });
  return publicOrganizations;
}

export async function getAllPublicOrganizations(
  skip: number,
  take: number
): Promise<{ skip: number; take: number; result: PublicOrganizations }> {
  const publicOrganizations = await getPublicOrganizations(skip, take);
  return { skip, take, result: publicOrganizations };
}
