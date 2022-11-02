import { User } from "@supabase/supabase-js";
import { notFound } from "remix-utils";
import { prismaClient } from "~/prisma";

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
  currentUser: User | null
) {
  if (currentUser === null) {
    return "anon";
  }

  const relation = await prismaClient.teamMemberOfProject.findFirst({
    where: {
      projectId: project.id,
      profileId: currentUser.id,
    },
  });

  if (relation === null || relation.isPrivileged === false) {
    return "authenticated";
  }

  return "owner";
}
