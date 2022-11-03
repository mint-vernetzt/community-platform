import { Project } from "@prisma/client";
import { User } from "@supabase/supabase-js";
import { unauthorized } from "remix-utils";
import { prismaClient } from "~/prisma";
import { getProjectBySlugOrThrow } from "../utils.server";

export async function checkOwnership(
  project: Project,
  currentUser: User | null,
  options: {
    throw: boolean;
  } = { throw: false }
) {
  let isOwner = false;
  if (currentUser !== null) {
    const relation = await prismaClient.teamMemberOfProject.findFirst({
      where: {
        projectId: project.id,
        profileId: currentUser.id,
        isPrivileged: true,
      },
    });
    if (relation !== null) {
      isOwner = true;
    }
  }

  if (isOwner === false && options.throw) {
    throw unauthorized({ message: "Not privileged" });
  }

  return { isOwner };
}

export async function checkOwnershipOrThrow(
  project: Project,
  currentUser: User | null
) {
  return await checkOwnership(project, currentUser, { throw: true });
}

export function transformProjectToForm(
  project: NonNullable<Awaited<ReturnType<typeof getProjectBySlugOrThrow>>>
) {
  return {
    ...project,
    targetGroups: project.targetGroups.map((item) => item.targetGroupId) ?? [],
    disciplines: project.disciplines.map((item) => item.disciplineId) ?? [],
  };
}

export function transformFormToProject(form: any) {
  const { userId: _userId, submit: _submit, ...project } = form;

  return {
    ...project,
  };
}

export async function updateProjectById(id: string, data: any) {
  await prismaClient.project.update({
    where: { id },
    data: {
      ...data,
      updatedAt: new Date(),
      targetGroups: {
        deleteMany: {},
        connectOrCreate: data.targetGroups.map((targetGroupId: string) => {
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
        }),
      },
      disciplines: {
        deleteMany: {},
        connectOrCreate: data.disciplines.map((itemId: string) => {
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
  });
}
