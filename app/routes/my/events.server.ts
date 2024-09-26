import { SupabaseClient } from "@supabase/supabase-js";
import {
  BlurredBackgroundScale,
  getImageURL,
  ImageSizes,
} from "~/images.server";
import { prismaClient } from "~/prisma.server";
import { getPublicURL } from "~/storage.server";

export async function getUpcomingEvents(
  profileId: string,
  authClient: SupabaseClient
) {
  const whereBase = {
    endTime: { gt: new Date() },
  };
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
        title: true,
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
          ...whereBase,
          admins: {
            some: {
              profileId: profileId,
            },
          },
        },
        select: { ...selectBase, published: true },
      }),
      prismaClient.event.findMany({
        where: {
          ...whereBase,
          teamMembers: {
            some: {
              profileId: profileId,
            },
          },
        },
        select: { ...selectBase, published: true },
      }),
      prismaClient.event.findMany({
        where: {
          ...whereBase,
          speakers: {
            some: {
              profileId: profileId,
            },
          },
        },
        select: { ...selectBase, published: true },
      }),
      prismaClient.event.findMany({
        where: {
          ...whereBase,
          participants: {
            some: {
              profileId: profileId,
            },
          },
        },
        select: { ...selectBase },
      }),
      prismaClient.event.findMany({
        where: {
          ...whereBase,
          waitingList: {
            some: {
              profileId: profileId,
            },
          },
        },
        select: { ...selectBase },
      }),
    ]);

  // TODO: generate general utils function for this (had ts problems)
  const enhancedAdmin = admin.map((event) => {
    let background = event.background;
    let blurredBackground;
    if (background !== null) {
      const publicURL = getPublicURL(authClient, background);
      background = getImageURL(publicURL, {
        resize: { type: "fill", ...ImageSizes.Event.ListItem },
      });
      blurredBackground = getImageURL(publicURL, {
        resize: {
          type: "fill",
          width: ImageSizes.Event.ListItem.width * BlurredBackgroundScale,
          height: ImageSizes.Event.ListItem.height * BlurredBackgroundScale,
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
        resize: { type: "fill", ...ImageSizes.Event.ListItem },
      });
      blurredBackground = getImageURL(publicURL, {
        resize: {
          type: "fill",
          width: ImageSizes.Event.ListItem.width * BlurredBackgroundScale,
          height: ImageSizes.Event.ListItem.height * BlurredBackgroundScale,
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
        resize: { type: "fill", ...ImageSizes.Event.ListItem },
      });
      blurredBackground = getImageURL(publicURL, {
        resize: {
          type: "fill",
          width: ImageSizes.Event.ListItem.width * BlurredBackgroundScale,
          height: ImageSizes.Event.ListItem.height * BlurredBackgroundScale,
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
        resize: { type: "fill", ...ImageSizes.Event.ListItem },
      });
      blurredBackground = getImageURL(publicURL, {
        resize: {
          type: "fill",
          width: ImageSizes.Event.ListItem.width * BlurredBackgroundScale,
          height: ImageSizes.Event.ListItem.height * BlurredBackgroundScale,
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
        resize: { type: "fill", ...ImageSizes.Event.ListItem },
      });
      blurredBackground = getImageURL(publicURL, {
        resize: {
          type: "fill",
          width: ImageSizes.Event.ListItem.width * BlurredBackgroundScale,
          height: ImageSizes.Event.ListItem.height * BlurredBackgroundScale,
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
