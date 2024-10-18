import { type SupabaseClient } from "@supabase/supabase-js";
import { getImageURL, ImageSizes } from "~/images.server";
import { prismaClient } from "~/prisma.server";
import { getPublicURL } from "~/storage.server";

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

  const [admin, teamMember, speaker, participant, waitingList] =
    await prismaClient.$transaction([
      prismaClient.event.findMany({
        where: {
          ...where,
          admins: {
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
        },
        select: { ...selectBase },
        orderBy,
      }),
    ]);

  // TODO: generate general utils function for this (had ts problems)
  const enhancedAdmin = admin.map((event) => {
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
        blur: 5,
      });
    }
    return {
      ...event,
      background,
      blurredBackground,
    };
  });
  const enhancedTeamMembers = teamMember.map((event) => {
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
        blur: 5,
      });
    }
    return {
      ...event,
      background,
      blurredBackground,
    };
  });
  const enhancedSpeaker = speaker.map((event) => {
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
        blur: 5,
      });
    }
    return {
      ...event,
      background,
      blurredBackground,
    };
  });
  const enhancedParticipant = participant.map((event) => {
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
        blur: 5,
      });
    }
    return {
      ...event,
      background,
      blurredBackground,
    };
  });
  const enhancedWaitingList = waitingList.map((event) => {
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
        blur: 5,
      });
    }
    return {
      ...event,
      background,
      blurredBackground,
    };
  });

  return {
    admin: enhancedAdmin,
    teamMember: enhancedTeamMembers,
    speaker: enhancedSpeaker,
    participant: enhancedParticipant,
    waitingList: enhancedWaitingList,
    count: {
      admin: admin.length,
      teamMember: teamMember.length,
      speaker: speaker.length,
      participant: participant.length,
      waitingList: waitingList.length,
    },
  };
}
