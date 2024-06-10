import { createClient } from "@supabase/supabase-js";
import { prismaClient } from "../prisma";
import type { Request } from "express";
import { decorate } from "../lib/matomoUrlDecorator";
import { getBaseURL } from "../../src/utils";
import { filterEventByVisibility } from "../public-fields-filtering.server";
import { getPublicURL } from "../storage.server";
import { getImageURL } from "../images.server";

type Events = Awaited<ReturnType<typeof getEvents>>;

async function getEvents(request: Request, skip: number, take: number) {
  const events = await prismaClient.event.findMany({
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
      parentEventId: true,
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
      responsibleOrganizations: {
        select: {
          organization: {
            select: {
              name: true,
              slug: true,
              logo: true,
            },
          },
        },
      },
      _count: {
        select: {
          participants: true,
          waitingList: true,
          childEvents: true,
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

  const enhancedEvents = await Promise.all(
    events.map(async (event) => {
      const { slug, background, responsibleOrganizations, ...rest } = event;

      let publicBackground: string | null = null;
      if (authClient !== undefined) {
        if (background !== null) {
          const publicURL = getPublicURL(authClient, background);
          if (publicURL !== null) {
            publicBackground = getImageURL(publicURL);
          }
        }
      }

      let baseURL = getBaseURL(process.env.COMMUNITY_BASE_URL);

      const url =
        baseURL !== undefined
          ? decorate(request, `${baseURL}/event/${slug}`)
          : null;

      const enhancedResponsibleOrganizations = responsibleOrganizations.map(
        (relation) => {
          const { slug, logo, ...rest } = relation.organization;
          let publicLogo: string | null = null;
          if (authClient !== undefined) {
            if (logo !== null) {
              const publicURL = getPublicURL(authClient, logo);
              if (publicURL !== null) {
                publicLogo = getImageURL(publicURL);
              }
            }
          }
          let baseURL = getBaseURL(process.env.COMMUNITY_BASE_URL);
          const url =
            baseURL !== undefined
              ? decorate(request, `${baseURL}/organization/${slug}`)
              : null;
          return {
            organization: {
              ...rest,
              logo: publicLogo,
              slug,
              url,
            },
          };
        }
      );

      const enhancedEvent = {
        ...rest,
        background: publicBackground,
        slug,
        responsibleOrganizations: enhancedResponsibleOrganizations,
      };

      const filteredEvent = await filterEventByVisibility(enhancedEvent);

      return {
        ...filteredEvent,
        url: url,
      };
    })
  );

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
