import { Profile } from "@prisma/client";
import { User } from "@supabase/supabase-js";
import { badRequest, forbidden, serverError } from "remix-utils";
import { getUserByRequest } from "~/auth.server";
import { ArrayElement } from "~/lib/utils/types";
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

function transformEventData(
  profile: NonNullable<Awaited<ReturnType<typeof getProfileByUsername>>>,
  key: keyof Pick<
    NonNullable<Awaited<ReturnType<typeof getProfileByUsername>>>,
    | "teamMemberOfEvents"
    | "participatedEvents"
    | "contributedEvents"
    | "waitingForEvents"
  >,
  mode: Mode,
  sessionUser: User | null
) {
  let transformedEventData = profile[key];

  let events;
  if (key === "participatedEvents") {
    const participatedEventsWithParticipationStatus = profile[
      "participatedEvents"
    ].map((item) => {
      const eventWithParticipationStatus = {
        event: {
          ...item.event,
          ownerIsOnWaitingList: false,
        },
      };
      return eventWithParticipationStatus;
    });
    const waitingForEventsWithParticipationStatus = profile[
      "waitingForEvents"
    ].map((item) => {
      const eventWithParticipationStatus = {
        event: {
          ...item.event,
          ownerIsOnWaitingList: true,
        },
      };
      return eventWithParticipationStatus;
    });
    events = [
      ...participatedEventsWithParticipationStatus,
      ...waitingForEventsWithParticipationStatus,
    ];
  } else {
    events = profile[key];
  }
  // TODO: Outsource this to prisma call (Problem was combining the include statement with a where statement)
  // e.g. include: { event: { select: { name: true, }, where: { startTime: { gte: new Date() }, }, }, },
  let currentTime = new Date();
  const futureEvents = events.filter(function filterFutureEvents(item) {
    if (item.event.startTime >= currentTime) {
      return item;
    }
    return null;
  });
  const chronologicalEvents = futureEvents.sort(
    function sortEventsChronologically(a, b) {
      return a.event.startTime >= b.event.startTime ? 1 : -1;
    }
  );
  const publishedEvents = chronologicalEvents.filter(
    function filterPublishedEvents(item) {
      return item.event.published;
    }
  );

  if (mode === "owner") {
    if (key === "teamMemberOfEvents") {
      transformedEventData = chronologicalEvents;
    }
    if (key === "contributedEvents" || key === "participatedEvents") {
      transformedEventData = publishedEvents;
    }
  }
  if (mode === "authenticated") {
    transformedEventData = publishedEvents.map((item) => {
      const eventWithParticipationStatus = {
        event: {
          ...item.event,
          userIsParticipating: item.event.participants.some(
            function isSessionUserOnParticipantsList(participant) {
              if (sessionUser === null) {
                return false;
              }
              return participant.profileId === sessionUser.id;
            }
          ),
          userIsOnWaitingList: item.event.waitingList.some(
            function isSessionUserOnWaitingList(participant) {
              if (sessionUser === null) {
                return false;
              }
              return participant.profileId === sessionUser.id;
            }
          ),
        },
      };
      return eventWithParticipationStatus;
    });
  }
  return transformedEventData;
}

// TODO: Type issues, rework public fields
export async function filterProfileByMode(
  profile: NonNullable<Awaited<ReturnType<typeof getProfileByUsername>>>,
  mode: Mode,
  sessionUser: User | null
) {
  let data = profile;

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

  let includedKeys: string[] = [];
  for (const key in profile) {
    // Only show public fields if user is anon, show all fields if user is not anon
    if (mode !== "anon" || publicFields.includes(key)) {
      // Event relations must be transformed
      if (eventRelationKeys.includes(key)) {
        // TODO: Type issue
        // @ts-ignore
        data[key] = transformEventData(profile, key, mode, sessionUser);
      } else {
        // @ts-ignore <-- Partials allow undefined, Profile not
        data[key] = profile[key];
        includedKeys.push(key);
      }
    }
  }

  return data;
  // return data as Pick<typeof profile, keyof typeof publicFields.keys> & {
  //   participatedEvents: ReturnType<typeof transformEventData>;
  //   waitingForEvents: ReturnType<typeof transformEventData>;
  //   contributedEvents: ReturnType<typeof transformEventData>;
  //   teamMemberOfEvents: ReturnType<typeof transformEventData>;
  // };
}
