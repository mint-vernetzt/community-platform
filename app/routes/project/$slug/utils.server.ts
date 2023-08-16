import type { User } from "@supabase/supabase-js";
import { notFound } from "remix-utils";
import { prismaClient } from "~/prisma.server";

export async function getProjectBySlug(slug: string) {
  return await getProjectByField("slug", slug);
}

export async function getProjectBySlugOrThrow(slug: string) {
  const result = await getProjectBySlug(slug);
  if (result === null) {
    throw notFound({ message: "Project not found" });
  }
  return result;
}

export async function getProjectVisibilitiesBySlugOrThrow(slug: string) {
  const result = await prismaClient.projectVisibility.findFirst({
    where: {
      project: {
        slug,
      },
    },
  });
  if (result === null) {
    throw notFound({ message: "Project visbilities not found." });
  }
  return result;
}

export async function getProjectById(id: string) {
  return await getProjectByField("id", id);
}

export async function getProjectByIdOrThrow(id: string) {
  const result = await getProjectById(id);
  if (result === null) {
    throw notFound({ message: "Project not found" });
  }
  return result;
}

export async function getProjectByField(field: string, value: string) {
  const result = await prismaClient.project.findFirst({
    where: { [field]: value },
    include: {
      targetGroups: {
        select: {
          targetGroupId: true,
          targetGroup: {
            select: {
              title: true,
            },
          },
        },
      },
      disciplines: {
        select: {
          disciplineId: true,
          discipline: {
            select: {
              title: true,
            },
          },
        },
      },
      responsibleOrganizations: {
        select: {
          organization: {
            select: {
              id: true,
              name: true,
              slug: true,
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
          },
        },
        orderBy: {
          organization: {
            name: "asc",
          },
        },
      },
      teamMembers: {
        select: {
          isPrivileged: true,
          profile: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              username: true,
              position: true,
              avatar: true,
            },
          },
        },
        orderBy: {
          profile: {
            firstName: "asc",
          },
        },
      },
      awards: {
        select: {
          awardId: true,
          award: {
            select: {
              title: true,
              shortTitle: true,
              date: true,
              subline: true,
              logo: true,
            },
          },
        },
      },
    },
  });
  return result;
}

export async function deriveMode(
  project: NonNullable<Awaited<ReturnType<typeof getProjectBySlug>>>,
  sessionUser: User | null
) {
  if (sessionUser === null) {
    return "anon";
  }

  const relation = await prismaClient.teamMemberOfProject.findFirst({
    where: {
      projectId: project.id,
      profileId: sessionUser.id,
    },
  });

  if (relation === null || relation.isPrivileged === false) {
    return "authenticated";
  }

  return "owner";
}
