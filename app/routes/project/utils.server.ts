import { type User } from "@supabase/supabase-js";
import { prismaClient } from "~/prisma.server";
import { type Mode, deriveMode } from "~/utils.server";

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
