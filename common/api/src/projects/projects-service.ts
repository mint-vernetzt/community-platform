import { prismaClient } from "../../prisma";

type Projects = Awaited<ReturnType<typeof getProjects>>;

async function getProjects(skip: number, take: number) {
  const publicProjects = await prismaClient.project.findMany({
    select: {
      id: true,
      name: true,
    },
    skip,
    take,
  });
  return publicProjects;
}

export async function getAllProjects(
  skip: number,
  take: number
): Promise<{ skip: number; take: number; result: Projects }> {
  const publicProjects = await getProjects(skip, take);
  return { skip, take, result: publicProjects };
}
