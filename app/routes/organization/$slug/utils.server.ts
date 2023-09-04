import type { User } from "@supabase/supabase-js";
import { badRequest, unauthorized } from "remix-utils";
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

export type ModeLegacy = "anon" | "authenticated" | "owner";

export function deriveModeLegacy(
  sessionUser: User | null,
  isPrivileged: boolean
): ModeLegacy {
  if (sessionUser === null) {
    return "anon";
  }

  return isPrivileged ? "owner" : "authenticated";
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

export async function checkSameOrganizationOrThrow(
  request: Request,
  organizationId: string
) {
  const clonedRequest = request.clone();
  const formData = await clonedRequest.formData();
  // TODO: can this type assertion be removed and proofen by code?
  const value = formData.get("organizationId") as string | null;

  if (value === null || value !== organizationId) {
    throw badRequest({ message: "Organization IDs differ" });
  }
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
