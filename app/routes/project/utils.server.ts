import type { User } from "@supabase/supabase-js";
import { unauthorized } from "remix-utils";
import { prismaClient } from "~/prisma.server";
import { deriveMode, type Mode } from "~/utils.server";

export type ProjectMode = Mode | "admin";

export async function deriveProjectMode(
  sessionUser: User | null,
  slug: string
): Promise<ProjectMode> {
  const mode = deriveMode(sessionUser);
  const project = await prismaClient.project.findFirst({
    where: {
      slug,
      admins: {
        some: {
          profileId: sessionUser?.id || "",
        },
      },
    },
    select: {
      id: true,
    },
  });
  if (project !== null) {
    return "admin";
  }
  return mode;
}

export async function checkIdentityOrThrow(
  request: Request,
  sessionUser: User
) {
  const clonedRequest = request.clone();
  const formData = await clonedRequest.formData();
  const formSenderId = formData.get("userId");

  if (formSenderId === null || formSenderId !== sessionUser.id) {
    throw unauthorized({ message: "Identity check failed" });
  }
}

export async function createProjectOnProfile(
  profileId: string,
  projectName: string,
  projectSlug: string
) {
  const [profile] = await prismaClient.$transaction([
    prismaClient.profile.update({
      where: {
        id: profileId,
      },
      data: {
        teamMemberOfProjects: {
          create: {
            isPrivileged: true,
            project: {
              create: {
                name: projectName,
                slug: projectSlug,
                projectVisibility: {
                  create: {},
                },
              },
            },
          },
        },
      },
    }),
    prismaClient.project.update({
      where: {
        slug: projectSlug,
      },
      data: {
        admins: {
          create: {
            profileId: profileId,
          },
        },
      },
    }),
  ]);
  return profile;
}
