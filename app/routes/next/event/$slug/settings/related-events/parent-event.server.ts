import { type User, type SupabaseClient } from "@supabase/supabase-js";
import { BlurFactor, getImageURL, ImageSizes } from "~/images.server";
import { DefaultImages } from "~/images.shared";
import { prismaClient } from "~/prisma.server";
import { getPublicURL } from "~/storage.server";
import { isAdminOfEvent } from "../../settings.server";
import {
  getCompiledMailTemplate,
  mailer,
  mailerOptions,
} from "~/mailer.server";
import { captureException } from "@sentry/node";

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
      slug: true,
      published: true,
      startTime: true,
      endTime: true,
      sentParentEventJoinRequests: {
        where: {
          status: "pending",
        },
        select: {
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
      },
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
      _count: {
        select: {
          childEvents: true,
        },
      },
    },
  });

  if (event === null) {
    return null;
  }

  const enhancedSentParentEventJoinRequests =
    event.sentParentEventJoinRequests.map((request) => {
      let blurredBackground;
      let background =
        request.parentEvent.backgroundImageMetaData === null
          ? null
          : request.parentEvent.backgroundImageMetaData.path;
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
        ...request,
        parentEvent: {
          ...request.parentEvent,
          background,
          blurredBackground,
        },
      };
    });

  if (event.parentEvent === null) {
    const enhancedEventWithoutParentEvent = {
      ...event,
      sentParentEventJoinRequests: enhancedSentParentEventJoinRequests,
    };
    return enhancedEventWithoutParentEvent as typeof enhancedEventWithoutParentEvent & {
      parentEvent: null;
    };
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

  const enhancedParentEvent = {
    ...event.parentEvent,
    background,
    blurredBackground,
    isAdmin: await isAdminOfEvent(sessionUser, event.parentEvent.slug),
  };

  const enhancedEvent = {
    ...event,
    parentEvent: enhancedParentEvent,
    sentParentEventJoinRequests: enhancedSentParentEventJoinRequests,
  };

  return enhancedEvent;
}

export async function getParentEventsToAdd(options: {
  authClient: SupabaseClient;
  sessionUser: User;
  event: {
    slug: string;
    startTime: Date;
    endTime: Date;
  };
}) {
  const { event, sessionUser, authClient } = options;

  const parentEventsToAdd = await prismaClient.event.findMany({
    where: {
      slug: {
        not: event.slug,
      },
      OR: [
        {
          admins: {
            some: {
              profileId: sessionUser.id,
            },
          },
        },
        { published: true },
      ],
      startTime: {
        lte: event.startTime,
      },
      endTime: {
        gte: event.endTime,
      },
    },
    select: {
      id: true,
      parentEventId: true,
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

  const enhancedParentEventsToAdd = await Promise.all(
    parentEventsToAdd.map(async (event) => {
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
        isAdmin: await isAdminOfEvent(sessionUser, event.slug),
      };
    })
  );

  return enhancedParentEventsToAdd;
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

export async function requestToJoinParentEvent(options: {
  event: {
    id: string;
    slug: string;
    startTime: Date;
    endTime: Date;
    published: boolean;
  };
  parentEventId: string;
  locales: {
    mail: {
      buttonText: string;
      subject: string;
    };
  };
}) {
  const { event, parentEventId } = options;

  if (event.published === true) {
    throw new Error("Cannot request to join parent event on a published event");
  }

  const parentEvent = await prismaClient.event.findFirst({
    where: {
      id: parentEventId,
      slug: {
        not: event.slug,
      },
      parentEventId: null,
      published: true,
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

  // TODO: Implement request to join logic
  const result = await prismaClient.requestToParentEventToAddChildEvent.upsert({
    where: {
      parentEventId_childEventId: {
        parentEventId,
        childEventId: event.id,
      },
    },
    update: {
      status: "pending",
    },
    create: {
      parentEventId,
      childEventId: event.id,
      status: "pending",
    },
    select: {
      parentEvent: {
        select: {
          admins: {
            select: {
              profile: {
                select: {
                  id: true,
                  email: true,
                  firstName: true,
                },
              },
            },
          },
        },
      },
      childEvent: {
        select: {
          name: true,
        },
      },
    },
  });

  const sender = process.env.SYSTEM_MAIL_SENDER;
  const subject = options.locales.mail.subject;
  const textTemplatePath =
    "mail-templates/requests/parent-event-to-add-child-event/text.hbs";
  const htmlTemplatePath =
    "mail-templates/requests/parent-event-to-add-child-event/html.hbs";

  // Do not block main thread while sending the mail
  void Promise.all(
    result.parentEvent.admins.map(async (admin) => {
      try {
        const recipient = admin.profile.email;
        const text = getCompiledMailTemplate<typeof textTemplatePath>(
          textTemplatePath,
          {
            firstName: admin.profile.firstName,
            event: { name: result.childEvent.name },
            button: {
              url: `${process.env.COMMUNITY_BASE_URL}/my/events`,
              text: options.locales.mail.buttonText,
            },
          },
          "text"
        );
        const html = getCompiledMailTemplate<typeof htmlTemplatePath>(
          htmlTemplatePath,
          {
            firstName: admin.profile.firstName,
            event: { name: result.childEvent.name },
            button: {
              url: `${process.env.COMMUNITY_BASE_URL}/my/events`,
              text: options.locales.mail.buttonText,
            },
          },
          "html"
        );

        await mailer(mailerOptions, sender, recipient, subject, text, html);
      } catch (error) {
        captureException(error);
      }
    })
  );
}

export async function cancelParentEventJoinRequest(options: {
  event: {
    id: string;
  };
  parentEventId: string;
  locales: {
    mail: {
      buttonText: string;
      subject: string;
    };
  };
}) {
  const { event, parentEventId } = options;

  const pendingRequest =
    await prismaClient.requestToParentEventToAddChildEvent.findUnique({
      where: {
        parentEventId_childEventId: {
          parentEventId,
          childEventId: event.id,
        },
        status: "pending",
      },
    });

  if (pendingRequest === null) {
    throw new Error("No pending request found to cancel");
  }

  const result = await prismaClient.requestToParentEventToAddChildEvent.update({
    where: {
      parentEventId_childEventId: {
        parentEventId,
        childEventId: event.id,
      },
    },
    data: {
      status: "canceled",
    },
    select: {
      parentEvent: {
        select: {
          admins: {
            select: {
              profile: {
                select: {
                  id: true,
                  email: true,
                  firstName: true,
                },
              },
            },
          },
        },
      },
      childEvent: {
        select: {
          name: true,
        },
      },
    },
  });

  const sender = process.env.SYSTEM_MAIL_SENDER;
  const subject = options.locales.mail.subject;
  const textTemplatePath =
    "mail-templates/requests/parent-event-to-add-child-event/canceled-text.hbs";
  const htmlTemplatePath =
    "mail-templates/requests/parent-event-to-add-child-event/canceled-html.hbs";

  // Do not block main thread while sending the mail
  void Promise.all(
    result.parentEvent.admins.map(async (admin) => {
      try {
        const recipient = admin.profile.email;
        const text = getCompiledMailTemplate<typeof textTemplatePath>(
          textTemplatePath,
          {
            firstName: admin.profile.firstName,
            event: { name: result.childEvent.name },
            button: {
              url: `${process.env.COMMUNITY_BASE_URL}/my/events`,
              text: options.locales.mail.buttonText,
            },
          },
          "text"
        );
        const html = getCompiledMailTemplate<typeof htmlTemplatePath>(
          htmlTemplatePath,
          {
            firstName: admin.profile.firstName,
            event: { name: result.childEvent.name },
            button: {
              url: `${process.env.COMMUNITY_BASE_URL}/my/events`,
              text: options.locales.mail.buttonText,
            },
          },
          "html"
        );

        await mailer(mailerOptions, sender, recipient, subject, text, html);
      } catch (error) {
        captureException(error);
      }
    })
  );
}

export async function removeParentEvent(options: {
  userId: string;
  event: {
    slug: string;
  };
  locales: {
    mail: {
      subject: string;
    };
  };
}) {
  const { event, userId, locales } = options;

  const currentEvent = await prismaClient.event.findFirst({
    where: {
      slug: event.slug,
    },
    select: {
      parentEvent: {
        select: {
          name: true,
          admins: {
            select: {
              profile: {
                select: {
                  id: true,
                  email: true,
                  firstName: true,
                },
              },
            },
          },
        },
      },
      name: true,
    },
  });

  if (currentEvent === null) {
    throw new Error("Event not found");
  }

  if (currentEvent.parentEvent === null) {
    throw new Error("No parent event to remove");
  }

  const isAdminOfParentEvent = currentEvent.parentEvent.admins.some(
    (admin) => admin.profile.id === userId
  );

  if (isAdminOfParentEvent === false) {
    const sender = process.env.SYSTEM_MAIL_SENDER;
    const subject = locales.mail.subject;
    const textTemplatePath =
      "mail-templates/general-notification/disconnect-from-parent-event-text.hbs";
    const htmlTemplatePath =
      "mail-templates/general-notification/disconnect-from-parent-event-html.hbs";

    // Do not block main thread while sending the mail
    void Promise.all(
      currentEvent.parentEvent.admins.map(async (admin) => {
        if (currentEvent.parentEvent === null) {
          return;
        }
        try {
          const recipient = admin.profile.email;
          const text = getCompiledMailTemplate<typeof textTemplatePath>(
            textTemplatePath,
            {
              firstName: admin.profile.firstName,
              event: { name: currentEvent.name },
              parentEvent: { name: currentEvent.parentEvent.name },
            },
            "text"
          );
          const html = getCompiledMailTemplate<typeof htmlTemplatePath>(
            htmlTemplatePath,
            {
              firstName: admin.profile.firstName,
              event: { name: currentEvent.name },
              parentEvent: { name: currentEvent.parentEvent.name },
            },
            "html"
          );

          await mailer(mailerOptions, sender, recipient, subject, text, html);
        } catch (error) {
          captureException(error);
        }
      })
    );
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
