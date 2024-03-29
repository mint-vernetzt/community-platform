import type { User } from "@supabase/supabase-js";
import { prismaClient } from "~/prisma.server";
import { deriveMode, type Mode } from "~/utils.server";

export type OrganizationMode = Mode | "admin";

export async function deriveOrganizationMode(
  sessionUser: User | null,
  slug: string
): Promise<OrganizationMode> {
  const mode = deriveMode(sessionUser);
  const organization = await prismaClient.organization.findFirst({
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
  if (organization !== null) {
    return "admin";
  }
  return mode;
}

export async function getOrganizationVisibilitiesById(id: string) {
  const result = await prismaClient.organizationVisibility.findFirst({
    where: {
      organization: {
        id,
      },
    },
  });
  return result;
}
