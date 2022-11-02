import { prismaClient } from "~/prisma";

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
