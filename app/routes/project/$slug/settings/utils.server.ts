import type { Organization, Prisma, Profile, Project } from "@prisma/client";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { GravityType } from "imgproxy/dist/types";
import { badRequest, notFound, unauthorized } from "remix-utils";
import { getImageURL } from "~/images.server";
import { prismaClient } from "~/prisma.server";
import { getPublicURL } from "~/storage.server";
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

export async function getOrganizationById(id: string) {
  const organization = await prismaClient.organization.findFirst({
    where: { id },
    select: {
      id: true,
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

export function getResponsibleOrganizationDataFromProject(
  project: Awaited<ReturnType<typeof getProjectBySlugOrThrow>>
) {
  const organizationData = project.responsibleOrganizations.map((item) => {
    return item.organization;
  });
  return organizationData;
}

export async function getResponsibleOrganizationSuggestions(
  authClient: SupabaseClient,
  alreadyResponsibleOrganizationSlugs: string[],
  query: string[]
) {
  let whereQueries = [];
  for (const word of query) {
    const contains: {
      OR: {
        [K in Organization as string]: {
          contains: string;
          mode: Prisma.QueryMode;
        };
      }[];
    } = {
      OR: [
        {
          name: {
            contains: word,
            mode: "insensitive",
          },
        },
      ],
    };
    whereQueries.push(contains);
  }
  const responsibleOrganizationSuggestions =
    await prismaClient.organization.findMany({
      select: {
        id: true,
        name: true,
        logo: true,
        types: {
          select: {
            organizationType: {
              select: {
                title: true,
              },
            },
          },
        },
      },
      where: {
        AND: [
          {
            slug: {
              notIn: alreadyResponsibleOrganizationSlugs,
            },
          },
          ...whereQueries,
        ],
      },
      take: 6,
      orderBy: {
        name: "asc",
      },
    });

  const enhancedResponsibleOrganizationSuggestions =
    responsibleOrganizationSuggestions.map((organization) => {
      if (organization.logo !== null) {
        const publicURL = getPublicURL(authClient, organization.logo);
        if (publicURL !== null) {
          organization.logo = getImageURL(publicURL, {
            resize: { type: "fit", width: 64, height: 64 },
            gravity: GravityType.center,
          });
        }
      }
      return organization;
    });

  return enhancedResponsibleOrganizationSuggestions;
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

export async function getTeamMemberSuggestions(
  authClient: SupabaseClient,
  alreadyTeamMemberIds: string[],
  query: string[]
) {
  let whereQueries = [];
  for (const word of query) {
    const contains: {
      OR: {
        [K in Profile as string]: { contains: string; mode: Prisma.QueryMode };
      }[];
    } = {
      OR: [
        {
          firstName: {
            contains: word,
            mode: "insensitive",
          },
        },
        {
          lastName: {
            contains: word,
            mode: "insensitive",
          },
        },
      ],
    };
    whereQueries.push(contains);
  }
  const teamMemberSuggestions = await prismaClient.profile.findMany({
    select: {
      id: true,
      firstName: true,
      lastName: true,
      avatar: true,
      position: true,
    },
    where: {
      AND: [
        {
          id: {
            notIn: alreadyTeamMemberIds,
          },
        },
        ...whereQueries,
      ],
    },
    take: 6,
    orderBy: {
      firstName: "asc",
    },
  });

  const enhancedTeamMemberSuggestions = teamMemberSuggestions.map((member) => {
    if (member.avatar !== null) {
      const publicURL = getPublicURL(authClient, member.avatar);
      if (publicURL !== null) {
        member.avatar = getImageURL(publicURL, {
          resize: { type: "fit", width: 64, height: 64 },
          gravity: GravityType.center,
        });
      }
    }
    return member;
  });
  return enhancedTeamMemberSuggestions;
}

export async function getProfileById(id: string) {
  const profile = await prismaClient.profile.findFirst({
    where: { id },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      teamMemberOfProjects: {
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
  return profile;
}
