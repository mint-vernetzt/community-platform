import { prismaClient } from "~/prisma.server";

export async function connectOrganizationToProject(
  projectId: string,
  organizationId: string
) {
  await prismaClient.responsibleOrganizationOfProject.create({
    data: {
      projectId,
      organizationId,
    },
  });
}

export async function disconnectOrganizationFromProject(
  projectId: string,
  organizationId: string
) {
  await prismaClient.responsibleOrganizationOfProject.delete({
    where: {
      projectId_organizationId: {
        projectId,
        organizationId,
      },
    },
  });
}

export async function getProjectBySlug(slug: string) {
  return await prismaClient.project.findUnique({
    select: {
      id: true,
    },
    where: {
      slug,
    },
  });
}
