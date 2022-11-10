import { Profile } from "@prisma/client";
import { badRequest, forbidden } from "remix-utils";
import { getUserByRequest } from "~/auth.server";
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

export async function getProfileEventsByMode(username: string, mode: Mode) {
  let teamMemberWhere;
  if (mode === "owner") {
    teamMemberWhere = {
      event: {
        startTime: {
          gte: new Date(),
        },
      },
    };
  } else {
    teamMemberWhere = {
      event: {
        startTime: {
          gte: new Date(),
        },
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
          event: {
            startTime: "asc",
          },
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
          event: {
            startTime: "asc",
          },
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
          event: {
            startTime: "asc",
          },
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
          event: {
            startTime: "asc",
          },
        },
      },
    },
    where: {
      username,
    },
  });

  return profileEvents;
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
