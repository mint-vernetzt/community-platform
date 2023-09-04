import type { Profile } from "@prisma/client";
import type { SupabaseClient, User } from "@supabase/auth-helpers-remix";
import { forbidden, notFound, unauthorized } from "remix-utils";
import { getImageURL } from "~/images.server";
import {
  addUserParticipationStatus,
  combineEventsSortChronologically,
} from "~/lib/event/utils";
import { prismaClient } from "~/prisma.server";
import {
  filterEventByVisibility,
  filterProfileByVisibility,
} from "~/public-fields-filtering.server";
import { getPublicURL } from "~/storage.server";
import { triggerEntityScore } from "~/utils.server";
import { deriveMode, type Mode } from "~/utils.server";

export type ProfileMode = Mode | "owner";

export async function deriveProfileMode(
  sessionUser: User | null,
  username: string
): Promise<ProfileMode> {
  const mode = deriveMode(sessionUser);
  const profile = await prismaClient.profile.findFirst({
    where: {
      username,
      id: sessionUser?.id || "",
    },
    select: {
      id: true,
    },
  });
  if (profile !== null) {
    return "owner";
  }
  return mode;
}

export type ModeLegacy = "anon" | "authenticated" | "owner";

export function deriveModeLegacy(
  profileId: string,
  sessionUser: User | null
): ModeLegacy {
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
    select: {
      id: true,
      academicTitle: true,
      position: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      bio: true,
      skills: true,
      interests: true,
      website: true,
      linkedin: true,
      twitter: true,
      xing: true,
      instagram: true,
      youtube: true,
      facebook: true,
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
      profile: {
        id,
      },
    },
  });
  return result;
}

export async function updateProfileById(
  id: string,
  profileData: Omit<
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
  },
  privateFields: string[]
) {
  const { email: _email, ...rest } = profileData;

  let profileVisibility = await prismaClient.profileVisibility.findFirst({
    where: {
      profile: {
        id,
      },
    },
  });
  if (profileVisibility === null) {
    throw notFound("Profile visibilities not found");
  }

  let visibility: keyof typeof profileVisibility;
  for (visibility in profileVisibility) {
    if (
      visibility !== "id" &&
      visibility !== "profileId" &&
      profileData.hasOwnProperty(visibility)
    ) {
      profileVisibility[visibility] = !privateFields.includes(`${visibility}`);
    }
  }
  await prismaClient.$transaction([
    prismaClient.profile.update({
      where: {
        id,
      },
      data: {
        ...rest,
        areas: {
          deleteMany: {},
          connectOrCreate: profileData.areas.map((areaId) => ({
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
          connectOrCreate: profileData.offers.map((offerId) => ({
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
          connectOrCreate: profileData.seekings.map((offerId) => ({
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
    }),
    prismaClient.profileVisibility.update({
      where: {
        id: profileVisibility.id,
      },
      data: profileVisibility,
    }),
  ]);

  await triggerEntityScore({ entity: "profile", where: { id } });
}

export async function getProfileWithEventsByMode(
  username: string,
  mode: ModeLegacy,
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
      id: true,
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
  const profile = await getProfileWithEventsByMode(username, mode, inFuture);
  if (profile === null) {
    throw notFound({ message: "Profile with events not found" });
  }

  let enhancedProfile = {
    ...profile,
  };

  // Filtering by visbility settings
  if (sessionUser === null) {
    // Filter profile holding event relations
    enhancedProfile = await filterProfileByVisibility<typeof enhancedProfile>(
      enhancedProfile
    );
    // Filter events where profile is team member
    enhancedProfile.teamMemberOfEvents = await Promise.all(
      enhancedProfile.teamMemberOfEvents.map(async (relation) => {
        const filteredEvent = await filterEventByVisibility<
          typeof relation.event
        >(relation.event);
        return { ...relation, event: filteredEvent };
      })
    );
    // Filter events where profile is speaker
    enhancedProfile.contributedEvents = await Promise.all(
      enhancedProfile.contributedEvents.map(async (relation) => {
        const filteredEvent = await filterEventByVisibility<
          typeof relation.event
        >(relation.event);
        return { ...relation, event: filteredEvent };
      })
    );
    // Filter events where profile is participant
    enhancedProfile.participatedEvents = await Promise.all(
      enhancedProfile.participatedEvents.map(async (relation) => {
        const filteredEvent = await filterEventByVisibility<
          typeof relation.event
        >(relation.event);
        return { ...relation, event: filteredEvent };
      })
    );
    // Filter events where profile is on waiting list
    enhancedProfile.waitingForEvents = await Promise.all(
      enhancedProfile.waitingForEvents.map(async (relation) => {
        const filteredEvent = await filterEventByVisibility<
          typeof relation.event
        >(relation.event);
        return { ...relation, event: filteredEvent };
      })
    );
  }

  // Get images from image proxy
  enhancedProfile.teamMemberOfEvents = enhancedProfile.teamMemberOfEvents.map(
    (relation) => {
      let background = relation.event.background;
      if (background !== null) {
        const publicURL = getPublicURL(authClient, background);
        if (publicURL) {
          background = getImageURL(publicURL, {
            resize: { type: "fit", width: 160, height: 160 },
          });
        }
      }
      return { ...relation, event: { ...relation.event, background } };
    }
  );

  enhancedProfile.contributedEvents = enhancedProfile.contributedEvents.map(
    (relation) => {
      let background = relation.event.background;
      if (background !== null) {
        const publicURL = getPublicURL(authClient, background);
        if (publicURL) {
          background = getImageURL(publicURL, {
            resize: { type: "fit", width: 160, height: 160 },
          });
        }
      }
      return { ...relation, event: { ...relation.event, background } };
    }
  );

  enhancedProfile.participatedEvents = enhancedProfile.participatedEvents.map(
    (relation) => {
      let background = relation.event.background;
      if (background !== null) {
        const publicURL = getPublicURL(authClient, background);
        if (publicURL) {
          background = getImageURL(publicURL, {
            resize: { type: "fit", width: 160, height: 160 },
          });
        }
      }
      return { ...relation, event: { ...relation.event, background } };
    }
  );

  enhancedProfile.waitingForEvents = enhancedProfile.waitingForEvents.map(
    (relation) => {
      let background = relation.event.background;
      if (background !== null) {
        const publicURL = getPublicURL(authClient, background);
        if (publicURL) {
          background = getImageURL(publicURL, {
            resize: { type: "fit", width: 160, height: 160 },
          });
        }
      }
      return { ...relation, event: { ...relation.event, background } };
    }
  );

  const combinedParticipatedAndWaitingForEvents =
    combineEventsSortChronologically<
      typeof enhancedProfile.participatedEvents,
      typeof enhancedProfile.waitingForEvents
    >(enhancedProfile.participatedEvents, enhancedProfile.waitingForEvents);

  const enhancedProfileWithParticipationStatus = {
    ...enhancedProfile,
    teamMemberOfEvents: await addUserParticipationStatus<
      typeof enhancedProfile.teamMemberOfEvents
    >(enhancedProfile.teamMemberOfEvents, sessionUser?.id),
    contributedEvents: await addUserParticipationStatus<
      typeof enhancedProfile.contributedEvents
    >(enhancedProfile.contributedEvents, sessionUser?.id),
    participatedEvents: await addUserParticipationStatus<
      typeof combinedParticipatedAndWaitingForEvents
    >(combinedParticipatedAndWaitingForEvents, sessionUser?.id),
    waitingForEvents: undefined,
  };

  return enhancedProfileWithParticipationStatus;
}
