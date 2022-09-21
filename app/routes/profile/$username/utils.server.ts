import { Profile } from "@prisma/client";
import { badRequest, forbidden } from "remix-utils";
import { getUserByRequest } from "~/auth.server";
import {
  filterPublishedEvents,
  getRootEvents,
  sortEventsAlphabetically,
} from "~/lib/event/utils";
import { prismaClient } from "~/prisma";
import { getProfileByUsername } from "~/profile.server";

export type Mode = "anon" | "authenticated" | "owner";

export function deriveMode(
  profileUsername: string,
  sessionUsername: string
): Mode {
  if (sessionUsername === "" || sessionUsername === undefined) {
    return "anon";
  }

  return profileUsername === sessionUsername ? "owner" : "authenticated";
}

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
    areas: string[];
  } & {
    offers: string[];
  } & {
    seekings: string[];
  }
) {
  const { email: _email, ...rest } = data;

  await prismaClient.profile.update({
    where: {
      id,
    },
    data: {
      ...rest,
      areas: {
        deleteMany: {},
        connectOrCreate: data.areas.map((areaId) => ({
          where: {
            profileId_areaId: { areaId, profileId: id },
          },
          create: {
            areaId,
          },
        })),
      },
      offers: {
        deleteMany: {},
        connectOrCreate: data.offers.map((offerId) => ({
          where: {
            profileId_offerId: { offerId, profileId: id },
          },
          create: {
            offerId,
          },
        })),
      },
      seekings: {
        deleteMany: {},
        connectOrCreate: data.seekings.map((offerId) => ({
          where: {
            profileId_offerId: { offerId, profileId: id },
          },
          create: {
            offerId,
          },
        })),
      },
      updatedAt: new Date(),
    },
  });
}

async function transformEventData(
  profile: NonNullable<Awaited<ReturnType<typeof getProfileByUsername>>>,
  key: keyof Pick<
    NonNullable<Awaited<ReturnType<typeof getProfileByUsername>>>,
    | "teamMemberOfEvents"
    | "participatedEvents"
    | "contributedEvents"
    | "waitingForEvents"
  >,
  mode: Mode
) {
  let transformedEventData:
    | Awaited<ReturnType<typeof getRootEvents>>
    | ReturnType<typeof sortEventsAlphabetically>;

  if (key === "participatedEvents" || key === "contributedEvents") {
    // Raw query in getRootEvents already filters published events and sorts them alphabetically
    transformedEventData = await getRootEvents(profile[key]);
  } else if (key === "teamMemberOfEvents" && mode === "owner") {
    // Profile owner who is team member of an event should also see unpublished events
    transformedEventData = sortEventsAlphabetically(profile[key]);
  } else {
    const publishedEvents = filterPublishedEvents(profile[key]);
    transformedEventData = sortEventsAlphabetically(publishedEvents);
  }

  return transformedEventData;
}

// TODO: Type issues, rework public fields
export async function filterProfileByMode(
  profile: NonNullable<Awaited<ReturnType<typeof getProfileByUsername>>>,
  mode: Mode
) {
  let data: Partial<typeof profile> = {};

  const publicFields = [
    "id",
    "username",
    "firstName",
    "lastName",
    "academicTitle",
    "areas",
    "avatar",
    "background",
    "memberOf",
    ...profile.publicFields,
  ];

  const eventRelationKeys = [
    "teamMemberOfEvents",
    "participatedEvents",
    "contributedEvents",
    "waitingForEvents",
  ];

  for (const key in profile) {
    // Only show public fields if user is anon, show all fields if user is not anon
    if (mode !== "anon" || publicFields.includes(key)) {
      // Event relations must be transformed
      if (eventRelationKeys.includes(key)) {
        // TODO: Type issue
        // @ts-ignore
        data[key] = await transformEventData(profile, key, mode);
      } else {
        // @ts-ignore <-- Partials allow undefined, Profile not
        data[key] = profile[key];
      }
    }
  }
  return data;
}
