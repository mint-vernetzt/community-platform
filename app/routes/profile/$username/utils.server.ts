import type { Profile } from "@prisma/client";
import type { SupabaseClient, User } from "@supabase/auth-helpers-remix";
import { forbidden, notFound, unauthorized } from "remix-utils";
import { getImageURL } from "~/images.server";
import {
  addUserParticipationStatus,
  combineEventsSortChronologically,
} from "~/lib/event/utils";
import { prismaClient } from "~/prisma";
import type { getProfileByUsername } from "~/profile.server";
import { getPublicURL } from "~/storage.server";
import { triggerEntityScore } from "~/utils.server";

export type Mode = "anon" | "authenticated" | "owner";

export function deriveMode(profileId: string, sessionUser: User | null): Mode {
  if (sessionUser === null) {
    return "anon";
  }

  return profileId === sessionUser.id ? "owner" : "authenticated";
}

export async function handleAuthorization(
  sessionUserId: string,
  profileId: string
) {
  if (sessionUserId !== profileId) {
    throw forbidden({ message: "not allowed" });
  }
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

export async function getWholeProfileFromUsername(username: string) {
  const result = await prismaClient.profile.findFirst({
    where: { username },
    include: {
      areas: { select: { area: { select: { id: true } } } },
      offers: { select: { offer: { select: { id: true } } } },
      seekings: { select: { offer: { select: { id: true } } } },
    },
  });
  return result;
}

export async function getProfileVisibilitiesById(id: string) {
  const result = await prismaClient.profileVisibility.findFirst({
    where: {
      profileId: id,
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

  await triggerEntityScore({ entity: "profile", where: { id } });
}

export async function updateProfileVisibilitiesById(
  id: string,
  publicFields: string[]
) {
  let profileVisibilities = await prismaClient.profileVisibility.findFirst({
    where: {
      profileId: id,
    },
  });
  if (profileVisibilities === null) {
    throw new Error("Profile visibilities not found");
  }

  let visibility: keyof typeof profileVisibilities;
  for (visibility in profileVisibilities) {
    if (visibility !== "id" && visibility !== "profileId") {
      profileVisibilities[visibility] = publicFields.includes(`${visibility}`);
    }
  }
  await prismaClient.profileVisibility.update({
    where: {
      id: profileVisibilities.id,
    },
    data: {
      ...profileVisibilities,
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
        endTime: inFuture
          ? {
              gte: new Date(),
            }
          : { lte: new Date() },
      },
    };
  } else {
    teamMemberWhere = {
      event: {
        endTime: inFuture
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
              participationFrom: true,
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
              participationFrom: true,
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
            endTime: inFuture
              ? {
                  gte: new Date(),
                }
              : { lte: new Date() },
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
              participationFrom: true,
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
            endTime: inFuture
              ? {
                  gte: new Date(),
                }
              : { lte: new Date() },
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
              participationFrom: true,
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
            endTime: inFuture
              ? {
                  gte: new Date(),
                }
              : { lte: new Date() },
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
  authClient: SupabaseClient,
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
        const publicURL = getPublicURL(authClient, item.event.background);
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
        const publicURL = getPublicURL(authClient, item.event.background);
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
        const publicURL = getPublicURL(authClient, item.event.background);
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
        const publicURL = getPublicURL(authClient, item.event.background);
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
