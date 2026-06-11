import { parseWithZod } from "@conform-to/zod";
import { type SupabaseClient, type User } from "@supabase/supabase-js";
import { BlurFactor, getImageURL, ImageSizes } from "~/images.server";
import { DefaultImages } from "~/images.shared";
import { prismaClient } from "~/prisma.server";
import { getPublicURL } from "~/storage.server";
import { deriveModeForEvent, getIsMember } from "../detail.server";
import {
  getSearchChildEventsSchema,
  SEARCH_CHILD_EVENTS_SEARCH_PARAM,
} from "./child-events.shared";

export async function getChildEventsOfEvent(options: {
  slug: string;
  authClient: SupabaseClient;
  sessionUser: User | null;
  searchParams: URLSearchParams;
}) {
  const { slug, authClient, sessionUser, searchParams } = options;
  const submission = parseWithZod(searchParams, {
    schema: getSearchChildEventsSchema(),
  });

  let childEvents;

  const select = {
    id: true,
    slug: true,
    name: true,
    backgroundImageMetaData: {
      select: {
        path: true,
      },
    },
    description: true,
    subline: true,
    startTime: true,
    endTime: true,
    participantLimit: true,
    participationFrom: true,
    participationUntil: true,
    published: true,
    canceled: true,
    external: true,
    openForRegistration: true,
    parentParticipationRequired: true,
    parentEvent: {
      select: {
        parentParticipationRequired: true,
        participants: {
          select: {
            profileId: true,
          },
        },
      },
    },
    stage: {
      select: {
        slug: true,
      },
    },
    _count: {
      select: {
        participants: true,
        childEvents: true,
      },
    },
  };

  if (
    submission.status !== "success" ||
    typeof submission.value[SEARCH_CHILD_EVENTS_SEARCH_PARAM] === "undefined"
  ) {
    childEvents = await prismaClient.event.findMany({
      where: {
        parentEvent: { slug },
      },
      select,
      orderBy: {
        startTime: "asc",
      },
    });
  } else {
    const query =
      submission.value[SEARCH_CHILD_EVENTS_SEARCH_PARAM].trim().split(" ");

    childEvents = await prismaClient.event.findMany({
      where: {
        parentEvent: { slug },
        OR: query.map((term) => {
          return {
            OR: [
              { name: { contains: term, mode: "insensitive" } },
              { slug: { contains: term, mode: "insensitive" } },
            ],
          };
        }),
      },
      select,
      orderBy: {
        startTime: "asc",
      },
    });
  }

  const enhancedChildEvents = await Promise.all(
    childEvents.map(async (event) => {
      const now = new Date();
      const beforeParticipationPeriod = now < event.participationFrom;
      const afterParticipationPeriod = now > event.participationUntil;
      const inPast = now > event.endTime;

      const participantCount = event._count.participants;

      const mode = await deriveModeForEvent(sessionUser, {
        ...event,
        participantCount: event._count.participants,
        beforeParticipationPeriod,
        afterParticipationPeriod,
        inPast,
        hasChildEvents: event._count.childEvents > 0,
      });

      const isMember = await getIsMember(sessionUser, event);

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
        participantCount,
        background,
        blurredBackground,
        isMember,
        inPast,
        mode,
      };
    })
  );

  const filteredChildEvents = enhancedChildEvents.filter((event) => {
    if (event.published === false) {
      return event.isMember;
    }
    return true;
  });

  return { submission: submission.reply(), childEvents: filteredChildEvents };
}

export async function getEventByIdForAction(id: string) {
  const event = await prismaClient.event.findUnique({
    where: { id },
    select: {
      id: true,
      canceled: true,
      participantLimit: true,
      participationFrom: true,
      participationUntil: true,
      endTime: true,
      external: true,
      openForRegistration: true,
      parentParticipationRequired: true,
      parentEvent: {
        select: {
          parentParticipationRequired: true,
          participants: {
            select: {
              profileId: true,
            },
          },
        },
      },
      _count: {
        select: {
          participants: true,
          childEvents: true,
        },
      },
    },
  });

  return event;
}
