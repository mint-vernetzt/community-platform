import { badRequest, notFound } from "remix-utils";
import { prismaClient } from "~/prisma.server";
import { type getProjectBySlug } from "./general.server";

export function transformProjectToForm(
  project: NonNullable<Awaited<ReturnType<typeof getProjectBySlug>>>
) {
  return {
    ...project,
    targetGroups: project.targetGroups.map((item) => item.targetGroupId) ?? [],
    disciplines: project.disciplines.map((item) => item.disciplineId) ?? [],
  };
}
// TODO: fix any type
export function transformFormToProject(form: any) {
  const { userId: _userId, submit: _submit, ...project } = form;

  return {
    ...project,
  };
}

export async function getOrganizationById(id: string) {
  const organization = await prismaClient.organization.findFirst({
    where: { id },
    select: {
      id: true,
      slug: true,
      name: true,
      responsibleForProject: {
        select: {
          project: {
            select: {
              id: true,
            },
          },
        },
      },
    },
  });
  return organization;
}

export async function updateProjectById(
  id: string,
  // TODO: fix any type
  projectData: any,
  privateFields: string[]
) {
  let projectVisibility = await prismaClient.projectVisibility.findFirst({
    where: {
      project: {
        id,
      },
    },
  });
  if (projectVisibility === null) {
    throw notFound("Project visibilities not found");
  }

  let visibility: keyof typeof projectVisibility;
  for (visibility in projectVisibility) {
    if (
      visibility !== "id" &&
      visibility !== "projectId" &&
      projectData.hasOwnProperty(visibility)
    ) {
      projectVisibility[visibility] = !privateFields.includes(`${visibility}`);
    }
  }
  await prismaClient.$transaction([
    prismaClient.project.update({
      where: { id },
      data: {
        ...projectData,
        updatedAt: new Date(),
        targetGroups: {
          deleteMany: {},
          connectOrCreate: projectData.targetGroups.map(
            (targetGroupId: string) => {
              return {
                where: {
                  targetGroupId_projectId: {
                    targetGroupId,
                    projectId: id,
                  },
                },
                create: {
                  targetGroupId,
                },
              };
            }
          ),
        },
        disciplines: {
          deleteMany: {},
          connectOrCreate: projectData.disciplines.map((itemId: string) => {
            return {
              where: {
                disciplineId_projectId: {
                  disciplineId: itemId,
                  projectId: id,
                },
              },
              create: {
                disciplineId: itemId,
              },
            };
          }),
        },
      },
    }),
    prismaClient.projectVisibility.update({
      where: {
        id: projectVisibility.id,
      },
      data: projectVisibility,
    }),
  ]);
}

export async function deleteProjectById(id: string) {
  await prismaClient.project.delete({
    where: {
      id,
    },
  });
}

export async function checkSameProjectOrThrow(
  request: Request,
  projectId: string
) {
  const clonedRequest = request.clone();
  const formData = await clonedRequest.formData();
  // TODO: can this type assertion be removed and proofen by code?
  const value = formData.get("projectId") as string | null;

  if (value === null || value !== projectId) {
    throw badRequest({ message: "Project IDs differ" });
  }
}
