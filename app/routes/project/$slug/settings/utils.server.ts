import type { Project } from "@prisma/client";
import type { User } from "@supabase/supabase-js";
import { badRequest, unauthorized } from "remix-utils";
import { prismaClient } from "~/prisma";
import type { getProjectBySlugOrThrow } from "../utils.server";

export async function checkOwnership(
  project: Project,
  sessionUser: User | null,
  options: {
    throw: boolean;
  } = { throw: false }
) {
  let isOwner = false;
  if (sessionUser !== null) {
    const relation = await prismaClient.teamMemberOfProject.findFirst({
      where: {
        projectId: project.id,
        profileId: sessionUser.id,
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
  sessionUser: User | null
) {
  return await checkOwnership(project, sessionUser, { throw: true });
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

export async function deleteProjectById(id: string) {
  return await prismaClient.project.delete({ where: { id } });
}

export function getResponsibleOrganizationDataFromProject(
  project: Awaited<ReturnType<typeof getProjectBySlugOrThrow>>
) {
  const organizationData = project.responsibleOrganizations.map((item) => {
    return item.organization;
  });
  return organizationData;
}

export async function checkSameProjectOrThrow(
  request: Request,
  projectId: string
) {
  const clonedRequest = request.clone();
  const formData = await clonedRequest.formData();
  const value = formData.get("projectId") as string | null;

  if (value === null || value !== projectId) {
    throw badRequest({ message: "Project IDs differ" });
  }
}

export function getTeamMemberProfileDataFromProject(
  project: Awaited<ReturnType<typeof getProjectBySlugOrThrow>>,
  currentUserId: string
) {
  const profileData = project.teamMembers.map((teamMember) => {
    const { isPrivileged, profile } = teamMember;
    const isCurrentUser = profile.id === currentUserId;
    return { isPrivileged, ...profile, isCurrentUser };
  });
  return profileData;
}
