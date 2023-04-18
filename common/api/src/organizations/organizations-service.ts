import { prismaClient } from "./../../prisma";

type Organizations = Awaited<ReturnType<typeof getOrganizations>>;

async function getOrganizations(skip: number, take: number) {
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

export async function getAllOrganizations(
  skip: number,
  take: number
): Promise<{ skip: number; take: number; result: Organizations }> {
  const publicOrganizations = await getOrganizations(skip, take);
  return { skip, take, result: publicOrganizations };
}
