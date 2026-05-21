import { type User, type SupabaseClient } from "@supabase/supabase-js";
import { BlurFactor, getImageURL, ImageSizes } from "~/images.server";
import { DefaultImages } from "~/images.shared";
import { prismaClient } from "~/prisma.server";
import { getPublicURL } from "~/storage.server";
import { isAdminOfEvent } from "../../settings.server";

export async function getEventBySlug(options: {
  authClient: SupabaseClient;
  sessionUser: User;
  slug: string;
}) {
  const { authClient, sessionUser, slug } = options;
  const event = await prismaClient.event.findUnique({
    where: {
      slug,
    },
    select: {
      parentEventId: true,
    },
  });

  return event;
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
      published: true,
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
    published: boolean;
  };
  parentEventId: string;
}) {
  const { userId, event, parentEventId } = options;

  if (event.published === true) {
    throw new Error("Cannot add parent event to a published event");
  }

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

export async function removeParentEvent(options: {
  event: {
    slug: string;
    published: boolean;
  };
}) {
  const { event } = options;

  if (event.published === true) {
    throw new Error("Cannot remove parent event from a published event");
  }

  await prismaClient.event.update({
    where: {
      slug: event.slug,
    },
    data: {
      parentEventId: null,
    },
  });
}
