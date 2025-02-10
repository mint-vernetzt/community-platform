import { type User } from "@supabase/supabase-js";
import { prismaClient } from "~/prisma.server";
import { type Mode, deriveMode } from "~/utils.server";

export type ProjectMode = Mode | "admin" | "teamMember";

export async function deriveProjectMode(
  sessionUser: User | null,
  slug: string
): Promise<ProjectMode> {
  const mode = deriveMode(sessionUser);
  const [adminProject, teamMemberProject] = await prismaClient.$transaction([
    prismaClient.project.findFirst({
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
    }),
    prismaClient.project.findFirst({
      where: {
        slug,
        teamMembers: {
          some: {
            profileId: sessionUser?.id || "",
          },
        },
      },
      select: {
        id: true,
      },
    }),
  ]);
  if (adminProject !== null) {
    return "admin";
  }
  if (teamMemberProject !== null) {
    return "teamMember";
  }
  return mode;
}
