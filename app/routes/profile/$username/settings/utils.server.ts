import { Profile } from "@prisma/client";
import { badRequest, forbidden } from "remix-utils";
import { getUserByRequest } from "~/auth.server";
import { prismaClient } from "~/prisma";

export async function handleAuthorization(request: Request, username: string) {
  if (typeof username !== "string" || username === "") {
    throw badRequest({ message: "username must be provided" });
  }
  const currentUser = await getUserByRequest(request);

  if (currentUser?.user_metadata.username !== username) {
    throw forbidden({ message: "not allowed" });
  }

  return currentUser;
}

export async function getWholeProfileFromId(id: string) {
  const result = await prismaClient.profile.findFirst({
    where: { id },
    include: {
      areas: { select: { area: { select: { id: true } } } },
      offers: { select: { offer: { select: { id: true } } } },
      seekings: { select: { offer: { select: { id: true } } } },
    },
  });
  return result;
}

export async function updateProfileById(
  id: string,
  data: Omit<
    Profile,
    | "id"
    | "username"
    | "avatar"
    | "background"
    | "createdAt"
    | "updatedAt"
    | "termsAccepted"
    | "termsAcceptedAt"
  > & {
    areas: string[] | undefined;
  } & {
    offers: string[] | undefined;
  } & { seekings: string[] | undefined }
) {
  let areasQuery, offersQuery, seekingsQuery;

  if (data.areas !== undefined) {
    areasQuery = {
      deleteMany: {},
      connectOrCreate: data.areas.map((areaId) => ({
        where: {
          profileId_areaId: { areaId, profileId: id },
        },
        create: {
          areaId,
        },
      })),
    };
  }
  if (data.offers !== undefined) {
    offersQuery = {
      deleteMany: {},
      connectOrCreate: data.offers.map((offerId) => ({
        where: {
          profileId_offerId: { offerId, profileId: id },
        },
        create: {
          offerId,
        },
      })),
    };
  }
  if (data.seekings !== undefined) {
    seekingsQuery = {
      deleteMany: {},
      connectOrCreate: data.seekings.map((offerId) => ({
        where: {
          profileId_offerId: { offerId, profileId: id },
        },
        create: {
          offerId,
        },
      })),
    };
  }

  const { email: _email, ...rest } = data;

  await prismaClient.profile.update({
    where: {
      id,
    },
    data: {
      ...rest,
      areas: areasQuery,
      offers: offersQuery,
      seekings: seekingsQuery,
    },
  });
}
