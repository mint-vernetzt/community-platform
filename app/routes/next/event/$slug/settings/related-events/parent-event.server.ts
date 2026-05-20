import { type SupabaseClient } from "@supabase/supabase-js";
import { BlurFactor, getImageURL, ImageSizes } from "~/images.server";
import { DefaultImages } from "~/images.shared";
import { prismaClient } from "~/prisma.server";
import { getPublicURL } from "~/storage.server";

export async function getEventBySlug(options: {
  authClient: SupabaseClient;
  slug: string;
}) {
  const { authClient, slug } = options;
  const event = await prismaClient.event.findUnique({
    where: {
      slug,
    },
    select: {
      slug: true,
      startTime: true,
      endTime: true,
      parentEvent: {
        select: {
          id: true,
          name: true,
          slug: true,
          backgroundImageMetaData: {
            select: {
              path: true,
            },
          },
          subline: true,
          description: true,
          stage: {
            select: {
              slug: true,
            },
          },
          startTime: true,
          endTime: true,
          participantLimit: true,
          _count: {
            select: {
              participants: true,
            },
          },
        },
      },
    },
  });

  if (event === null) {
    return null;
  }

  if (event.parentEvent === null) {
    return event;
  }

  let blurredBackground;
  let background =
    event.parentEvent.backgroundImageMetaData === null
      ? null
      : event.parentEvent.backgroundImageMetaData.path;
  if (background !== null) {
    const publicURL = getPublicURL(authClient, background);
    if (publicURL) {
      background = getImageURL(publicURL, {
        resize: {
          type: "fill",
          width: ImageSizes.Event.ListItem.Background.width,
          height: ImageSizes.Event.ListItem.Background.height,
        },
      });
      blurredBackground = getImageURL(publicURL, {
        resize: {
          type: "fill",
          width: ImageSizes.Event.ListItem.BlurredBackground.width,
          height: ImageSizes.Event.ListItem.BlurredBackground.height,
        },
        blur: BlurFactor,
      });
    }
  } else {
    background = DefaultImages.Event.Background;
    blurredBackground = DefaultImages.Event.BlurredBackground;
  }

  return {
    ...event,
    parentEvent: {
      ...event.parentEvent,
      background,
      blurredBackground,
    },
  };
}

export async function getParentEventsToAdd(options: {
  authClient: SupabaseClient;
  userId: string;
  event: {
    slug: string;
    startTime: Date;
    endTime: Date;
  };
}) {
  const { event, userId, authClient } = options;

  const parentEventsToAdd = await prismaClient.event.findMany({
    where: {
      slug: {
        not: event.slug,
      },
      parentEventId: null,
      admins: {
        some: {
          profileId: userId,
        },
      },
      startTime: {
        lte: event.startTime,
      },
      endTime: {
        gte: event.endTime,
      },
    },
    select: {
      id: true,
      name: true,
      slug: true,
      backgroundImageMetaData: {
        select: {
          path: true,
        },
      },
      subline: true,
      description: true,
      stage: {
        select: {
          slug: true,
        },
      },
      startTime: true,
      endTime: true,
      participantLimit: true,
      _count: {
        select: {
          participants: true,
        },
      },
    },
    orderBy: {
      startTime: "asc",
    },
  });

  const enhancedParentEventsToAdd = parentEventsToAdd.map((event) => {
    let blurredBackground;
    let background =
      event.backgroundImageMetaData === null
        ? null
        : event.backgroundImageMetaData.path;
    if (background !== null) {
      const publicURL = getPublicURL(authClient, background);
      if (publicURL) {
        background = getImageURL(publicURL, {
          resize: {
            type: "fill",
            width: ImageSizes.Event.ListItem.Background.width,
            height: ImageSizes.Event.ListItem.Background.height,
          },
        });
        blurredBackground = getImageURL(publicURL, {
          resize: {
            type: "fill",
            width: ImageSizes.Event.ListItem.BlurredBackground.width,
            height: ImageSizes.Event.ListItem.BlurredBackground.height,
          },
          blur: BlurFactor,
        });
      }
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

  return enhancedParentEventsToAdd;
}

export async function getEventBySlugForAction(slug: string) {
  const event = await prismaClient.event.findUnique({
    where: {
      slug,
    },
    select: {
      slug: true,
      startTime: true,
      endTime: true,
    },
  });

  return event;
}

export async function addParentEvent(options: {
  userId: string;
  event: {
    slug: string;
    startTime: Date;
    endTime: Date;
  };
  parentEventId: string;
}) {
  const { userId, event, parentEventId } = options;

  const parentEvent = await prismaClient.event.findFirst({
    where: {
      id: parentEventId,
      slug: {
        not: event.slug,
      },
      parentEventId: null,
      admins: {
        some: {
          profileId: userId,
        },
      },
      startTime: {
        lte: event.startTime,
      },
      endTime: {
        gte: event.endTime,
      },
    },
  });

  if (parentEvent === null) {
    throw new Error("Parent event not found or not eligible to be a parent");
  }

  await prismaClient.event.update({
    where: {
      slug: event.slug,
    },
    data: {
      parentEventId,
    },
  });
}
