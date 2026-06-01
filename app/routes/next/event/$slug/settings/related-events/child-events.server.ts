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
        where: {
          status: "pending",
        },
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

  const select = {
    id: true,
    parentEventId: true,
    sentParentEventJoinRequests: {
      select: {
        status: true,
      },
    },
    receivedParentEventJoinRequests: {
      select: {
        status: true,
      },
    },
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
  };

  const basicWhere = {
    slug: {
      not: event.slug,
    },
    admins: {
      some: {
        profileId: userId,
      },
    },
  };

  const orderBy = {
    startTime: "asc",
  } as const;

  const childEventsToAddWithinTimeframe = await prismaClient.event.findMany({
    where: {
      ...basicWhere,
      startTime: {
        gte: event.startTime,
      },
      endTime: {
        lte: event.endTime,
      },
    },
    select,
    orderBy,
  });

  const now = new Date();

  const childEventsToAddOutOfTimeframe = await prismaClient.event.findMany({
    where: {
      ...basicWhere,
      OR: [
        {
          startTime: {
            lt: event.startTime,
            gte: now,
          },
        },
        {
          endTime: {
            gt: event.endTime,
            gte: now,
          },
        },
      ],
    },
    select,
    orderBy,
  });

  const childEventsToAdd = [
    ...childEventsToAddWithinTimeframe,
    ...childEventsToAddOutOfTimeframe,
  ];

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

export async function addChildEvent(options: {
  userId: string;
  slug: string;
  childEventId: string;
}) {
  const { userId, childEventId, slug } = options;

  const event = await prismaClient.event.findFirst({
    where: {
      slug,
    },
    select: {
      id: true,
      parentEventId: true,
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

  if (event === null) {
    throw new Error("Event not found");
  }

  if (event.sentParentEventJoinRequests.length > 0) {
    throw new Error(
      "You have already requested to join a parent event. While this request is pending, you cannot add a child event. If you want to add a child event instead, first withdraw your existing request."
    );
  }

  const childEvent = await prismaClient.event.findFirst({
    where: {
      id: childEventId,
      slug: {
        not: slug,
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
      sentParentEventJoinRequests: {
        none: {
          status: "pending",
        },
      },
      receivedParentEventJoinRequests: {
        none: {
          status: "pending",
        },
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
  slug: string;
  childEventId: string;
}) {
  const { slug, childEventId } = options;

  const event = await prismaClient.event.findFirst({
    where: {
      slug,
    },
    select: {
      id: true,
    },
  });

  if (event === null) {
    throw new Error("Event not found");
  }

  const childEvent = await prismaClient.event.findFirst({
    where: {
      id: childEventId,
      parentEventId: {
        equals: event.id,
      },
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
