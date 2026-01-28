import { type SupabaseClient } from "@supabase/supabase-js";
import { BlurFactor, getImageURL, ImageSizes } from "~/images.server";
import { DefaultImages } from "~/images.shared";
import { prismaClient } from "~/prisma.server";
import { getPublicURL } from "~/storage.server";
import { type SUPPORTED_COOKIE_LANGUAGES } from "~/i18n.shared";
import { type ArrayElement } from "~/lib/utils/types";
import { type languageModuleMap } from "~/locales/.server";

export type MyEventsLocales = (typeof languageModuleMap)[ArrayElement<
  typeof SUPPORTED_COOKIE_LANGUAGES
>]["my/events"];

export async function getEvents(options: {
  profileId: string;
  authClient: SupabaseClient;
  where?: { [key: string]: any };
  orderBy?: { [key: string]: "asc" | "desc" };
}) {
  const {
    profileId,
    where = { endTime: { gte: new Date() } },
    orderBy = { startTime: "asc" },
    authClient,
  } = options;

  const selectBase = {
    name: true,
    slug: true,
    background: true,
    canceled: true,
    subline: true,
    description: true,
    startTime: true,
    endTime: true,
    participantLimit: true,
    stage: {
      select: {
        slug: true,
      },
    },
    _count: {
      select: {
        participants: true,
        waitingList: true,
      },
    },
  };

  const [
    adminEvents,
    teamMemberEvents,
    speakerEvents,
    participantEvents,
    waitingListEvents,
  ] = await prismaClient.$transaction([
    prismaClient.event.findMany({
      where: {
        ...where,
        admins: {
          some: {
            profileId: profileId,
          },
        },
      },
      select: { ...selectBase },
      orderBy,
    }),
    prismaClient.event.findMany({
      where: {
        ...where,
        teamMembers: {
          some: {
            profileId: profileId,
          },
        },
      },
      select: { ...selectBase, published: true },
      orderBy,
    }),
    prismaClient.event.findMany({
      where: {
        ...where,
        speakers: {
          some: {
            profileId: profileId,
          },
        },
        published: true,
      },
      select: { ...selectBase, published: true },
      orderBy,
    }),
    prismaClient.event.findMany({
      where: {
        ...where,
        participants: {
          some: {
            profileId: profileId,
          },
        },
        published: true,
      },
      select: { ...selectBase },
      orderBy,
    }),
    prismaClient.event.findMany({
      where: {
        ...where,
        waitingList: {
          some: {
            profileId: profileId,
          },
        },
        published: true,
      },
      select: { ...selectBase },
      orderBy,
    }),
  ]);

  // TODO: generate general utils function for this (had ts problems)
  const enhancedAdminEvents = adminEvents.map((event) => {
    let background = event.background;
    let blurredBackground;
    if (background !== null) {
      const publicURL = getPublicURL(authClient, background);
      background = getImageURL(publicURL, {
        resize: { type: "fill", ...ImageSizes.Event.ListItem.Background },
      });
      blurredBackground = getImageURL(publicURL, {
        resize: {
          type: "fill",
          width: ImageSizes.Event.ListItem.BlurredBackground.width,
          height: ImageSizes.Event.ListItem.BlurredBackground.height,
        },
        blur: BlurFactor,
      });
    } else {
      background = DefaultImages.Event.Background;
      blurredBackground = DefaultImages.Event.BlurredBackground;
    }
    return {
      ...event,
      background,
      blurredBackground,
    };
  });
  const enhancedTeamMemberEvents = teamMemberEvents.map((event) => {
    let background = event.background;
    let blurredBackground;
    if (background !== null) {
      const publicURL = getPublicURL(authClient, background);
      background = getImageURL(publicURL, {
        resize: { type: "fill", ...ImageSizes.Event.ListItem.Background },
      });
      blurredBackground = getImageURL(publicURL, {
        resize: {
          type: "fill",
          width: ImageSizes.Event.ListItem.BlurredBackground.width,
          height: ImageSizes.Event.ListItem.BlurredBackground.height,
        },
        blur: BlurFactor,
      });
    } else {
      background = DefaultImages.Event.Background;
      blurredBackground = DefaultImages.Event.BlurredBackground;
    }
    return {
      ...event,
      background,
      blurredBackground,
    };
  });
  const enhancedSpeakerEvents = speakerEvents.map((event) => {
    let background = event.background;
    let blurredBackground;
    if (background !== null) {
      const publicURL = getPublicURL(authClient, background);
      background = getImageURL(publicURL, {
        resize: { type: "fill", ...ImageSizes.Event.ListItem.Background },
      });
      blurredBackground = getImageURL(publicURL, {
        resize: {
          type: "fill",
          width: ImageSizes.Event.ListItem.BlurredBackground.width,
          height: ImageSizes.Event.ListItem.BlurredBackground.height,
        },
        blur: BlurFactor,
      });
    } else {
      background = DefaultImages.Event.Background;
      blurredBackground = DefaultImages.Event.BlurredBackground;
    }
    return {
      ...event,
      background,
      blurredBackground,
    };
  });
  const enhancedParticipantEvents = participantEvents.map((event) => {
    let background = event.background;
    let blurredBackground;
    if (background !== null) {
      const publicURL = getPublicURL(authClient, background);
      background = getImageURL(publicURL, {
        resize: { type: "fill", ...ImageSizes.Event.ListItem.Background },
      });
      blurredBackground = getImageURL(publicURL, {
        resize: {
          type: "fill",
          width: ImageSizes.Event.ListItem.BlurredBackground.width,
          height: ImageSizes.Event.ListItem.BlurredBackground.height,
        },
        blur: BlurFactor,
      });
    } else {
      background = DefaultImages.Event.Background;
      blurredBackground = DefaultImages.Event.BlurredBackground;
    }
    return {
      ...event,
      background,
      blurredBackground,
    };
  });
  const enhancedWaitingListEvents = waitingListEvents.map((event) => {
    let background = event.background;
    let blurredBackground;
    if (background !== null) {
      const publicURL = getPublicURL(authClient, background);
      background = getImageURL(publicURL, {
        resize: { type: "fill", ...ImageSizes.Event.ListItem.Background },
      });
      blurredBackground = getImageURL(publicURL, {
        resize: {
          type: "fill",
          width: ImageSizes.Event.ListItem.BlurredBackground.width,
          height: ImageSizes.Event.ListItem.BlurredBackground.height,
        },
        blur: BlurFactor,
      });
    } else {
      background = DefaultImages.Event.Background;
      blurredBackground = DefaultImages.Event.BlurredBackground;
    }
    return {
      ...event,
      background,
      blurredBackground,
    };
  });

  return {
    adminEvents: enhancedAdminEvents,
    teamMemberEvents: enhancedTeamMemberEvents,
    speakerEvents: enhancedSpeakerEvents,
    participantEvents: enhancedParticipantEvents,
    waitingListEvents: enhancedWaitingListEvents,
    count: {
      adminEvents: adminEvents.length,
      teamMemberEvents: teamMemberEvents.length,
      speakerEvents: speakerEvents.length,
      participantEvents: participantEvents.length,
      waitingListEvents: waitingListEvents.length,
    },
  };
}

export async function getEventInvites(options: {
  profileId: string;
  authClient: SupabaseClient;
}) {
  const { profileId, authClient } = options;

  const [adminInvites] = await prismaClient.$transaction([
    prismaClient.inviteForProfileToJoinEvent.findMany({
      where: {
        profileId: profileId,
        status: "pending",
      },
      select: {
        event: {
          select: {
            id: true,
            name: true,
            slug: true,
            background: true,
            subline: true,
            description: true,
            startTime: true,
            endTime: true,
            participantLimit: true,
            stage: {
              select: {
                slug: true,
              },
            },
            _count: {
              select: {
                participants: true,
                waitingList: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    }),
  ]);

  const enhancedAdminInvites = adminInvites.map((invite) => {
    let background = invite.event.background;
    let blurredBackground;
    if (background !== null) {
      const publicURL = getPublicURL(authClient, background);
      background = getImageURL(publicURL, {
        resize: { type: "fill", ...ImageSizes.Event.ListItem.Background },
      });
      blurredBackground = getImageURL(publicURL, {
        resize: {
          type: "fill",
          width: ImageSizes.Event.ListItem.BlurredBackground.width,
          height: ImageSizes.Event.ListItem.BlurredBackground.height,
        },
        blur: BlurFactor,
      });
    } else {
      background = DefaultImages.Event.Background;
      blurredBackground = DefaultImages.Event.BlurredBackground;
    }

    const event = {
      ...invite.event,
      background,
      blurredBackground,
      participantCount: invite.event._count.participants,
    };

    return {
      ...invite,
      event,
    };
  });

  return {
    adminInvites: enhancedAdminInvites,
    count: { adminInvites: enhancedAdminInvites.length },
  };
}

export async function acceptInviteAsAdmin(options: {
  userId: string;
  eventId: string;
}) {
  const { userId, eventId } = options;

  // check if invite exists
  const invite = await prismaClient.inviteForProfileToJoinEvent.findUnique({
    where: {
      profileId_eventId_role: {
        eventId,
        profileId: userId,
        role: "admin",
      },
    },
  });

  if (invite === null) {
    throw new Error("Invite not found");
  }

  await prismaClient.adminOfEvent.create({
    data: {
      eventId,
      profileId: userId,
    },
  });

  await prismaClient.inviteForProfileToJoinEvent.update({
    where: {
      profileId_eventId_role: {
        eventId,
        profileId: userId,
        role: "admin",
      },
    },
    data: {
      status: "accepted",
    },
  });
}

export async function rejectInviteAsAdmin(options: {
  userId: string;
  eventId: string;
}) {
  const { userId, eventId } = options;

  // check if invite exists
  const invite = await prismaClient.inviteForProfileToJoinEvent.findUnique({
    where: {
      profileId_eventId_role: {
        eventId,
        profileId: userId,
        role: "admin",
      },
    },
  });

  if (invite === null) {
    throw new Error("Invite not found");
  }

  await prismaClient.inviteForProfileToJoinEvent.update({
    where: {
      profileId_eventId_role: {
        eventId,
        profileId: userId,
        role: "admin",
      },
    },
    data: {
      status: "rejected",
    },
  });
}
