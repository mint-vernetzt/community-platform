import { Profile } from "@prisma/client";
import { User } from "@supabase/supabase-js";
import { badRequest, forbidden, notFound } from "remix-utils";
import { getUserByRequest } from "~/auth.server";
import { getImageURL } from "~/images.server";
import {
  addUserParticipationStatus,
  combineEventsSortChronologically,
} from "~/lib/event/utils";
import { prismaClient } from "~/prisma";
import { getProfileByUsername } from "~/profile.server";
import { getPublicURL } from "~/storage.server";

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

export async function getProfileEventsByMode(
  username: string,
  mode: Mode,
  inFuture: boolean
) {
  let teamMemberWhere;
  if (mode === "owner") {
    teamMemberWhere = {
      event: {
        startTime: inFuture
          ? {
              gte: new Date(),
            }
          : { lte: new Date() },
      },
    };
  } else {
    teamMemberWhere = {
      event: {
        startTime: inFuture
          ? {
              gte: new Date(),
            }
          : { lte: new Date() },
        published: true,
      },
    };
  }

  const profileEvents = await prismaClient.profile.findFirst({
    select: {
      teamMemberOfEvents: {
        select: {
          event: {
            select: {
              id: true,
              name: true,
              slug: true,
              published: true,
              parentEventId: true,
              startTime: true,
              endTime: true,
              participationUntil: true,
              participantLimit: true,
              stage: {
                select: {
                  title: true,
                },
              },
              canceled: true,
              subline: true,
              description: true,
              _count: {
                select: {
                  childEvents: true,
                  participants: true,
                  waitingList: true,
                },
              },
              background: true,
            },
          },
        },
        where: teamMemberWhere,
        orderBy: {
          event: inFuture
            ? {
                startTime: "asc",
              }
            : { startTime: "desc" },
        },
      },
      participatedEvents: {
        select: {
          event: {
            select: {
              id: true,
              name: true,
              slug: true,
              published: true,
              parentEventId: true,
              startTime: true,
              endTime: true,
              participationUntil: true,
              participantLimit: true,
              stage: {
                select: {
                  title: true,
                },
              },
              canceled: true,
              subline: true,
              description: true,
              _count: {
                select: {
                  childEvents: true,
                  participants: true,
                  waitingList: true,
                },
              },
              background: true,
            },
          },
        },
        where: {
          event: {
            startTime: {
              gte: new Date(),
            },
            published: true,
          },
        },
        orderBy: {
          event: inFuture
            ? {
                startTime: "asc",
              }
            : { startTime: "desc" },
        },
      },
      contributedEvents: {
        select: {
          event: {
            select: {
              id: true,
              name: true,
              slug: true,
              published: true,
              parentEventId: true,
              startTime: true,
              endTime: true,
              participationUntil: true,
              participantLimit: true,
              stage: {
                select: {
                  title: true,
                },
              },
              canceled: true,
              subline: true,
              description: true,
              _count: {
                select: {
                  childEvents: true,
                  participants: true,
                  waitingList: true,
                },
              },
              background: true,
            },
          },
        },
        where: {
          event: {
            startTime: {
              gte: new Date(),
            },
            published: true,
          },
        },
        orderBy: {
          event: inFuture
            ? {
                startTime: "asc",
              }
            : { startTime: "desc" },
        },
      },
      waitingForEvents: {
        select: {
          event: {
            select: {
              id: true,
              name: true,
              slug: true,
              published: true,
              parentEventId: true,
              startTime: true,
              endTime: true,
              participationUntil: true,
              participantLimit: true,
              stage: {
                select: {
                  title: true,
                },
              },
              canceled: true,
              subline: true,
              description: true,
              _count: {
                select: {
                  childEvents: true,
                  participants: true,
                  waitingList: true,
                },
              },
              background: true,
            },
          },
        },
        where: {
          event: {
            startTime: {
              gte: new Date(),
            },
            published: true,
          },
        },
        orderBy: {
          event: inFuture
            ? {
                startTime: "asc",
              }
            : { startTime: "desc" },
        },
      },
    },
    where: {
      username,
    },
  });

  return profileEvents;
}

export async function prepareProfileEvents(
  username: string,
  mode: Mode,
  sessionUser: User | null,
  inFuture: boolean
) {
  const profileFutureEvents = await getProfileEventsByMode(
    username,
    mode,
    inFuture
  );
  if (profileFutureEvents === null) {
    throw notFound({ message: "Events not found" });
  }

  profileFutureEvents.teamMemberOfEvents =
    profileFutureEvents.teamMemberOfEvents.map((item) => {
      if (item.event.background !== null) {
        const publicURL = getPublicURL(item.event.background);
        if (publicURL) {
          item.event.background = getImageURL(publicURL, {
            resize: { type: "fit", width: 160, height: 160 },
          });
        }
      }
      return item;
    });

  profileFutureEvents.contributedEvents =
    profileFutureEvents.contributedEvents.map((item) => {
      if (item.event.background !== null) {
        const publicURL = getPublicURL(item.event.background);
        if (publicURL) {
          item.event.background = getImageURL(publicURL, {
            resize: { type: "fit", width: 160, height: 160 },
          });
        }
      }
      return item;
    });

  profileFutureEvents.participatedEvents =
    profileFutureEvents.participatedEvents.map((item) => {
      if (item.event.background !== null) {
        const publicURL = getPublicURL(item.event.background);
        if (publicURL) {
          item.event.background = getImageURL(publicURL, {
            resize: { type: "fit", width: 160, height: 160 },
          });
        }
      }
      return item;
    });

  profileFutureEvents.waitingForEvents =
    profileFutureEvents.waitingForEvents.map((item) => {
      if (item.event.background !== null) {
        const publicURL = getPublicURL(item.event.background);
        if (publicURL) {
          item.event.background = getImageURL(publicURL, {
            resize: { type: "fit", width: 160, height: 160 },
          });
        }
      }
      return item;
    });

  const combinedFutureEvents = combineEventsSortChronologically<
    typeof profileFutureEvents.participatedEvents,
    typeof profileFutureEvents.waitingForEvents
  >(
    profileFutureEvents.participatedEvents,
    profileFutureEvents.waitingForEvents
  );

  const enhancedFutureEvents = {
    teamMemberOfEvents: await addUserParticipationStatus<
      typeof profileFutureEvents.teamMemberOfEvents
    >(profileFutureEvents.teamMemberOfEvents, sessionUser?.id),
    contributedEvents: await addUserParticipationStatus<
      typeof profileFutureEvents.contributedEvents
    >(profileFutureEvents.contributedEvents, sessionUser?.id),
    participatedEvents:
      mode !== "anon"
        ? await addUserParticipationStatus<typeof combinedFutureEvents>(
            combinedFutureEvents,
            sessionUser?.id
          )
        : undefined,
  };
  return enhancedFutureEvents;
}

// TODO: Type issues, rework public fields
export async function filterProfileByMode(
  profile: NonNullable<Awaited<ReturnType<typeof getProfileByUsername>>>,
  mode: Mode
) {
  let data = {};

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
    "teamMemberOfProjects",
    ...profile.publicFields,
  ];

  for (const key in profile) {
    // Only show public fields if user is anon, show all fields if user is not anon
    if (mode !== "anon" || publicFields.includes(key)) {
      // @ts-ignore <-- Partials allow undefined, Profile not
      data[key] = profile[key];
    }
  }

  return data as Partial<typeof profile>;
}
