import { createClient } from "@supabase/supabase-js";
import { getImageURL, getPublicURL } from "../images.server";
import { prismaClient } from "../prisma";
import type { Request } from "express";
import { decorate } from "../lib/matomoUrlDecorator";

type Events = Awaited<ReturnType<typeof getEvents>>;

async function getEvents(request: Request, skip: number, take: number) {
  const publicEvents = await prismaClient.event.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
      background: true,
      description: true,
      subline: true,
      startTime: true,
      endTime: true,
      participationFrom: true,
      participationUntil: true,
      participantLimit: true,
      venueName: true,
      venueStreet: true,
      venueStreetNumber: true,
      venueCity: true,
      venueZipCode: true,
      canceled: true,
      areas: {
        select: {
          area: {
            select: {
              name: true,
            },
          },
        },
      },
      types: {
        select: {
          eventType: {
            select: {
              title: true,
            },
          },
        },
      },
      focuses: {
        select: {
          focus: {
            select: {
              title: true,
            },
          },
        },
      },
      tags: {
        select: {
          tag: {
            select: {
              title: true,
            },
          },
        },
      },
      targetGroups: {
        select: {
          targetGroup: {
            select: {
              title: true,
            },
          },
        },
      },
      experienceLevel: {
        select: {
          title: true,
        },
      },
      stage: {
        select: {
          title: true,
        },
      },
    },
    where: {
      published: true,
    },
    skip,
    take,
  });

  let authClient: ReturnType<typeof createClient> | undefined;
  if (
    process.env.SUPABASE_URL !== undefined &&
    process.env.SERVICE_ROLE_KEY !== undefined
  ) {
    authClient = createClient(
      process.env.SUPABASE_URL,
      process.env.SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );
  }

  const enhancedEvents = publicEvents.map((event) => {
    const { slug, background, ...rest } = event;

    let publicBackground: string | null = null;
    if (authClient !== undefined) {
      if (background !== null) {
        const publicURL = getPublicURL(authClient, background);
        if (publicURL !== null) {
          publicBackground = getImageURL(publicURL, {
            resize: { type: "fill", width: 1488, height: 480, enlarge: true },
          });
        }
      }
    }

    let url: string | null = null;
    if (process.env.COMMUNITY_BASE_URL !== undefined) {
      url = decorate(request, `${process.env.COMMUNITY_BASE_URL}event/${slug}`);
    }

    return {
      ...rest,
      url: url,
      background: publicBackground,
    };
  });

  return enhancedEvents;
}

export async function getAllEvents(
  request: Request,
  skip: number,
  take: number
): Promise<{ skip: number; take: number; result: Events }> {
  const publicEvents = await getEvents(request, skip, take);
  return { skip, take, result: publicEvents };
}
