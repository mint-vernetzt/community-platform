import { DataFunctionArgs } from "@remix-run/server-runtime";
import { badRequest, forbidden, notFound } from "remix-utils";
import { getUserByRequest } from "~/auth.server";
import { prismaClient } from "~/prisma";

export async function getProfileByEmail(email: string) {
  const profile = await prismaClient.profile.findFirst({
    where: { email },
    include: {
      memberOf: {
        select: {
          organization: {
            select: {
              slug: true,
            },
          },
        },
      },
    },
  });
  return profile;
}

export async function getOrganizationBySlug(slug: string) {
  const organization = await prismaClient.organization.findFirst({
    select: { id: true },
    where: { slug },
  });
  return organization;
}

export async function connectProfileToOrganization(
  profileId: string,
  organizationId: string
) {
  const result = await prismaClient.memberOfOrganization.create({
    data: {
      profileId,
      organizationId,
    },
  });
  return result;
}

export async function disconnectProfileFromOrganization(
  profileId: string,
  organizationId: string
) {
  const result = await prismaClient.memberOfOrganization.delete({
    where: {
      profileId_organizationId: {
        profileId,
        organizationId,
      },
    },
  });
  return result;
}

export async function allowedToModify(
  profileId: string,
  organizationId: string
) {
  const result = await prismaClient.memberOfOrganization.findFirst({
    where: {
      profileId,
      organizationId,
      isPrivileged: true,
    },
  });
  return result !== null;
}

export async function getMembers(organizationId: string) {
  const result = await prismaClient.memberOfOrganization.findMany({
    where: {
      organizationId,
    },
  });
  return result;
}

export async function handleAuthorization(args: DataFunctionArgs) {
  const { params, request } = args;

  const { slug } = params;

  if (slug === undefined) {
    throw badRequest({ message: "Organization slug missing" });
  }

  const currentUser = await getUserByRequest(request);

  if (currentUser === null) {
    throw forbidden({ message: "forbidden" });
  }

  const organization = await getOrganizationBySlug(slug);
  if (organization === null) {
    throw notFound({
      message: `Couldn't find organization with slug "${slug}"`,
    });
  }

  const isAllowedToModify = await allowedToModify(
    currentUser.id,
    organization.id
  );

  if (isAllowedToModify === false) {
    throw forbidden({ message: "forbidden" });
  }

  return {
    currentUser,
    isAllowedToModify,
    organization,
  };
}
