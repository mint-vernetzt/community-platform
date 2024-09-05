import type { User } from "@supabase/supabase-js";
import { prismaClient } from "~/prisma.server";
import { deriveMode, type Mode } from "~/utils.server";

export type OrganizationMode = Mode | "admin";

export async function deriveOrganizationMode(
  sessionUser: User | null,
  slug?: string,
  id?: string
) {
  if (slug === undefined && id === undefined) {
    throw new Error("Either slug or id must be defined.");
  }

  const mode = deriveMode(sessionUser);
  const organization = await prismaClient.organization.findFirst({
    where:
      id !== undefined
        ? {
            id,
            admins: {
              some: {
                profileId: sessionUser?.id || "",
              },
            },
          }
        : {
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
