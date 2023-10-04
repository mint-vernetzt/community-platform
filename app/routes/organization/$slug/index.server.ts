import type { SupabaseClient } from "@supabase/auth-helpers-remix";
import type { User } from "@supabase/supabase-js";
import { notFound } from "remix-utils";
import { getImageURL } from "~/images.server";
import { addUserParticipationStatus } from "~/lib/event/utils";
import { prismaClient } from "~/prisma.server";
import {
  filterEventByVisibility,
  filterOrganizationByVisibility,
} from "~/public-fields-filtering.server";
import { getPublicURL } from "~/storage.server";

export async function getOrganizationBySlug(slug: string) {
  const organization = await prismaClient.organization.findUnique({
    where: { slug },
    select: {
      id: true,
      slug: true,
      logo: true,
      background: true,
      name: true,
      email: true,
      phone: true,
      website: true,
      linkedin: true,
      facebook: true,
      youtube: true,
      instagram: true,
      xing: true,
      twitter: true,
      street: true,
      streetNumber: true,
      zipCode: true,
      city: true,
      createdAt: true,
      quote: true,
      quoteAuthor: true,
      quoteAuthorInformation: true,
      bio: true,
      supportedBy: true,
      types: {
        select: {
          organizationType: {
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
      teamMembers: {
        select: {
          profileId: true,
          profile: {
            select: {
              id: true,
              username: true,
              avatar: true,
              firstName: true,
              lastName: true,
              academicTitle: true,
              position: true,
            },
          },
        },
        orderBy: {
          profile: {
            firstName: "asc",
          },
        },
      },
      memberOf: {
        select: {
          network: {
            select: {
              id: true,
              slug: true,
              logo: true,
              name: true,
              types: {
                select: {
                  organizationType: {
                    select: {
                      title: true,
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: {
          network: {
            name: "asc",
          },
        },
      },
      networkMembers: {
        select: {
          networkMember: {
            select: {
              id: true,
              slug: true,
              logo: true,
              name: true,
              types: {
                select: {
                  organizationType: {
                    select: {
                      title: true,
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: {
          networkMember: {
            name: "asc",
          },
        },
      },
      areas: {
        select: {
          area: {
            select: {
              name: true,
            },
          },
        },
      },
      responsibleForProject: {
        where: {
          project: {
            published: true,
          },
        },
        select: {
          project: {
            select: {
              id: true,
              slug: true,
              logo: true,
              name: true,
              awards: {
                select: {
                  award: {
                    select: {
                      id: true,
                      title: true,
                      shortTitle: true,
                      date: true,
                      logo: true,
                    },
                  },
                },
              },
              responsibleOrganizations: {
                select: {
                  organization: {
                    select: {
                      id: true,
                      name: true,
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: {
          project: {
            name: "asc",
          },
        },
      },
    },
  });

  return organization;
}

export async function getOrganizationWithEvents(
  slug: string,
  inFuture: boolean
) {
  const organizationEvents = await prismaClient.organization.findFirst({
    select: {
      id: true,
      responsibleForEvents: {
        select: {
          event: {
            select: {
              id: true,
              name: true,
              slug: true,
              published: true,
              parentEventId: true,
              startTime: true,
              endTime: true,
              participationUntil: true,
              participationFrom: true,
              participantLimit: true,
              stage: {
                select: {
                  title: true,
                },
              },
              canceled: true,
              subline: true,
              description: true,
              _count: {
                select: {
                  participants: true,
                  waitingList: true,
                },
              },
              background: true,
            },
          },
        },
        where: {
          event: {
            endTime: inFuture
              ? {
                  gte: new Date(),
                }
              : { lte: new Date() },
            published: true,
          },
        },
        orderBy: {
          event: inFuture
            ? {
                startTime: "asc",
              }
            : { startTime: "desc" },
        },
      },
    },
    where: {
      slug,
    },
  });

  return organizationEvents;
}

export async function prepareOrganizationEvents(
  authClient: SupabaseClient,
  slug: string,
  sessionUser: User | null,
  inFuture: boolean
) {
  const organization = await getOrganizationWithEvents(slug, inFuture);

  if (organization === null) {
    throw notFound({ message: "Organization with events not found" });
  }

  let enhancedOrganization = {
    ...organization,
  };

  // Filtering by visbility settings
  if (sessionUser === null) {
    // Filter organization holding event relations
    enhancedOrganization = await filterOrganizationByVisibility<
      typeof enhancedOrganization
    >(enhancedOrganization);
    // Filter events where organization is responsible for
    enhancedOrganization.responsibleForEvents = await Promise.all(
      enhancedOrganization.responsibleForEvents.map(async (relation) => {
        const filteredEvent = await filterEventByVisibility<
          typeof relation.event
        >(relation.event);
        return { ...relation, event: filteredEvent };
      })
    );
  }

  // Get images from image proxy
  const imageEnhancedEvents = enhancedOrganization.responsibleForEvents.map(
    (relation) => {
      let background = relation.event.background;
      let blurredBackground;
      if (background !== null) {
        const publicURL = getPublicURL(authClient, background);
        if (publicURL) {
          background = getImageURL(publicURL, {
            resize: { type: "fill", width: 144, height: 96 },
          });
        }
        blurredBackground = getImageURL(publicURL, {
          resize: { type: "fill", width: 18, height: 12 },
          blur: 5,
        });
      }
      return {
        ...relation,
        event: { ...relation.event, background, blurredBackground },
      };
    }
  );

  const imageEnhancedOrganization = {
    ...enhancedOrganization,
    responsibleForEvents: imageEnhancedEvents,
  };

  const enhancedOrganizationWithParticipationStatus = {
    ...imageEnhancedOrganization,
    responsibleForEvents: await addUserParticipationStatus<
      typeof imageEnhancedOrganization.responsibleForEvents
    >(imageEnhancedOrganization.responsibleForEvents, sessionUser?.id),
  };

  return enhancedOrganizationWithParticipationStatus;
}
