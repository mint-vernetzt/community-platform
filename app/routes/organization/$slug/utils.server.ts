import type { User } from "@supabase/supabase-js";
import { badRequest, unauthorized } from "remix-utils";
import { prismaClient } from "~/prisma.server";

export type Mode = "anon" | "authenticated" | "owner";

export function deriveMode(
  sessionUser: User | null,
  isPrivileged: boolean
): Mode {
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
