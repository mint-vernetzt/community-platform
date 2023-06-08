import type { User } from "@supabase/supabase-js";
import { badRequest, notFound, unauthorized } from "remix-utils";
import { prismaClient } from "~/prisma";

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
  const value = formData.get("organizationId") as string | null;

  if (value === null || value !== organizationId) {
    throw badRequest({ message: "Organization IDs differ" });
  }
}

export async function createOrganizationVisibilities(slug: string) {
  const organization = await prismaClient.organization.findFirst({
    select: {
      id: true,
    },
    where: {
      slug,
    },
  });
  if (organization === null) {
    throw notFound("Organization not found");
  }
  await prismaClient.organizationVisibility.create({
    data: {
      organizationId: organization.id,
    },
  });
}

export async function getOrganizationVisibilitiesById(id: string) {
  const result = await prismaClient.organizationVisibility.findFirst({
    where: {
      organizationId: id,
    },
  });
  return result;
}

export async function updateOrganizationVisibilitiesById(
  id: string,
  publicFields: string[]
) {
  let organizationVisibilities =
    await prismaClient.organizationVisibility.findFirst({
      where: {
        organizationId: id,
      },
    });
  if (organizationVisibilities === null) {
    throw notFound("Organization visibilities not found");
  }

  let visibility: keyof typeof organizationVisibilities;
  for (visibility in organizationVisibilities) {
    if (visibility !== "id" && visibility !== "organizationId") {
      organizationVisibilities[visibility] = publicFields.includes(
        `${visibility}`
      );
    }
  }
  await prismaClient.organizationVisibility.update({
    where: {
      id: organizationVisibilities.id,
    },
    data: {
      ...organizationVisibilities,
    },
  });
}

export async function deleteOrganizationVisibilities(slug: string) {
  const organization = prismaClient.organization.findFirst({
    where: {
      slug,
    },
  });
  // TODO: Delete with cascaded relation
}
