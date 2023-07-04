import type { Profile } from "@prisma/client";
import type { SupabaseClient, User } from "@supabase/auth-helpers-remix";
import { forbidden, notFound, unauthorized } from "remix-utils";
import { getImageURL } from "~/images.server";
import {
  addUserParticipationStatus,
  combineEventsSortChronologically,
} from "~/lib/event/utils";
import type { ArrayElement } from "~/lib/utils/types";
import { prismaClient } from "~/prisma";
import {
  filterEventDataByVisibilitySettings,
  filterProfileDataByVisibilitySettings,
} from "~/public-fields-filtering.server";
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
  let profile = await getProfileWithEventsByMode(username, mode, inFuture);
  if (profile === null) {
    throw notFound({ message: "Profile with events not found" });
  }

  // Filtering by visbility settings
  if (sessionUser === null) {
    // Filter profile holding event relations
    const filteredProfile = (
      await filterProfileDataByVisibilitySettings<typeof profile>([profile])
    )[0];
    profile = filteredProfile;
    // Filter events where profile is team member
    const rawMemberEvents = profile.teamMemberOfEvents.map((relation) => {
      return relation.event;
    });
    const filteredMemberEvents = await filterEventDataByVisibilitySettings<
      ArrayElement<typeof rawMemberEvents>
    >(rawMemberEvents);
    profile.teamMemberOfEvents = profile.teamMemberOfEvents.map((relation) => {
      let filteredRelation = relation;
      for (let filteredEvent of filteredMemberEvents) {
        if (relation.event.slug === filteredEvent.slug) {
          filteredRelation.event = filteredEvent;
        }
      }
      return filteredRelation;
    });
    // Filter events where profile is speaker
    const rawContributedEvents = profile.contributedEvents.map((relation) => {
      return relation.event;
    });
    const filteredContributedEvents = await filterEventDataByVisibilitySettings<
      ArrayElement<typeof rawContributedEvents>
    >(rawContributedEvents);
    profile.contributedEvents = profile.contributedEvents.map((relation) => {
      let filteredRelation = relation;
      for (let filteredEvent of filteredContributedEvents) {
        if (relation.event.slug === filteredEvent.slug) {
          filteredRelation.event = filteredEvent;
        }
      }
      return filteredRelation;
    });
    // Filter events where profile is participant
    const rawParticipatedEvents = profile.participatedEvents.map((relation) => {
      return relation.event;
    });
    const filteredParticipatedEvents =
      await filterEventDataByVisibilitySettings<
        ArrayElement<typeof rawParticipatedEvents>
      >(rawParticipatedEvents);
    profile.participatedEvents = profile.participatedEvents.map((relation) => {
      let filteredRelation = relation;
      for (let filteredEvent of filteredParticipatedEvents) {
        if (relation.event.slug === filteredEvent.slug) {
          filteredRelation.event = filteredEvent;
        }
      }
      return filteredRelation;
    });
    // Filter events where profile is on waiting list
    const rawWaitingForEvents = profile.waitingForEvents.map((relation) => {
      return relation.event;
    });
    const filteredWaitingForEvents = await filterEventDataByVisibilitySettings<
      ArrayElement<typeof rawWaitingForEvents>
    >(rawWaitingForEvents);
    profile.waitingForEvents = profile.waitingForEvents.map((relation) => {
      let filteredRelation = relation;
      for (let filteredEvent of filteredWaitingForEvents) {
        if (relation.event.slug === filteredEvent.slug) {
          filteredRelation.event = filteredEvent;
        }
      }
      return filteredRelation;
    });
  }

  // Get images from image proxy
  profile.teamMemberOfEvents = profile.teamMemberOfEvents.map((item) => {
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

  profile.contributedEvents = profile.contributedEvents.map((item) => {
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

  profile.participatedEvents = profile.participatedEvents.map((item) => {
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

  profile.waitingForEvents = profile.waitingForEvents.map((item) => {
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

  const {
    teamMemberOfEvents,
    contributedEvents,
    participatedEvents,
    waitingForEvents,
    ...otherFields
  } = profile;
  const combinedParticipatedAndWaitingForEvents =
    combineEventsSortChronologically<
      typeof participatedEvents,
      typeof waitingForEvents
    >(participatedEvents, waitingForEvents);

  const enhancedEvents = {
    ...otherFields,
    teamMemberOfEvents: await addUserParticipationStatus<
      typeof teamMemberOfEvents
    >(teamMemberOfEvents, sessionUser?.id),
    contributedEvents: await addUserParticipationStatus<
      typeof contributedEvents
    >(contributedEvents, sessionUser?.id),
    participatedEvents: await addUserParticipationStatus<
      typeof combinedParticipatedAndWaitingForEvents
    >(combinedParticipatedAndWaitingForEvents, sessionUser?.id),
  };

  return enhancedEvents;
}
