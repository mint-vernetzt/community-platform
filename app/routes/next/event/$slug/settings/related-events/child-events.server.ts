import { type User, type SupabaseClient } from "@supabase/supabase-js";
import { BlurFactor, getImageURL, ImageSizes } from "~/images.server";
import { DefaultImages } from "~/images.shared";
import { prismaClient } from "~/prisma.server";
import { getPublicURL } from "~/storage.server";

export async function getEventBySlug(options: {
  authClient: SupabaseClient;
  sessionUser: User;
  slug: string;
}) {
  const { authClient, slug } = options;
  const event = await prismaClient.event.findUnique({
    where: {
      slug,
    },
    select: {
      id: true,
      parentEventId: true,
      sentParentEventJoinRequests: {
        select: {
          parentEventId: true,
        },
      },
      slug: true,
      startTime: true,
      endTime: true,
      childEvents: {
        select: {
          published: true,
          canceled: true,
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

  const enhancedChildEvents = event.childEvents.map((childEvent) => {
    let blurredBackground;
    let background =
      childEvent.backgroundImageMetaData === null
        ? null
        : childEvent.backgroundImageMetaData.path;
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
      ...childEvent,
      background,
      blurredBackground,
    };
  });

  const enhancedEvent = {
    ...event,
    childEvents: enhancedChildEvents,
  };

  return enhancedEvent;
}

export async function getChildEventsToAdd(options: {
  authClient: SupabaseClient;
  userId: string;
  event: {
    slug: string;
    startTime: Date;
    endTime: Date;
  };
}) {
  const { event, userId, authClient } = options;

  const childEventsToAdd = await prismaClient.event.findMany({
    where: {
      slug: {
        not: event.slug,
      },
      admins: {
        some: {
          profileId: userId,
        },
      },
      startTime: {
        gte: event.startTime,
      },
      endTime: {
        lte: event.endTime,
      },
    },
    select: {
      id: true,
      parentEventId: true,
      published: true,
      canceled: true,
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
          childEvents: true,
        },
      },
    },
    orderBy: {
      startTime: "asc",
    },
  });

  const enhancedChildEventsToAdd = childEventsToAdd.map((event) => {
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

  return enhancedChildEventsToAdd;
}

export async function getEventBySlugForAction(slug: string) {
  const event = await prismaClient.event.findUnique({
    where: {
      slug,
    },
    select: {
      id: true,
      slug: true,
      startTime: true,
      endTime: true,
      sentParentEventJoinRequests: {
        where: {
          status: "pending",
        },
        select: {
          parentEventId: true,
        },
      },
    },
  });

  return event;
}

export async function addChildEvent(options: {
  userId: string;
  event: {
    id: string;
    slug: string;
    startTime: Date;
    endTime: Date;
    sentParentEventJoinRequests: {
      parentEventId: string;
    }[];
  };
  childEventId: string;
}) {
  const { userId, event, childEventId } = options;

  if (event.sentParentEventJoinRequests.length > 0) {
    throw new Error(
      "You have already requested to join a parent event. While this request is pending, you cannot add a child event. If you want to add a child event instead, first withdraw your existing request."
    );
  }

  const childEvent = await prismaClient.event.findFirst({
    where: {
      id: childEventId,
      slug: {
        not: event.slug,
      },
      published: false,
      parentEventId: null,
      childEvents: {
        none: {},
      },
      admins: {
        some: {
          profileId: userId,
        },
      },
      startTime: {
        gte: event.startTime,
      },
      endTime: {
        lte: event.endTime,
      },
    },
    select: {
      slug: true,
    },
  });

  if (childEvent === null) {
    throw new Error("Child event not found or not eligible to be a child");
  }

  await prismaClient.event.update({
    where: {
      slug: childEvent.slug,
    },
    data: {
      parentEventId: event.id,
    },
  });
}

export async function removeChildEvent(options: {
  event: {
    id: string;
  };
  childEventId: string;
}) {
  const { event, childEventId } = options;

  const childEvent = await prismaClient.event.findFirst({
    where: {
      id: childEventId,
      parentEventId: {
        equals: event.id,
      },
      published: false,
    },
    select: {
      slug: true,
    },
  });

  if (childEvent === null) {
    throw new Error(
      "Child event not found or not eligible to be removed as a child"
    );
  }

  await prismaClient.event.update({
    where: {
      slug: childEvent.slug,
    },
    data: {
      parentEventId: null,
    },
  });
}
