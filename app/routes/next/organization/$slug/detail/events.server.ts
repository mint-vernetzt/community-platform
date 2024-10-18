import { type SupabaseClient } from "@supabase/supabase-js";
import { DefaultImages, getImageURL, ImageSizes } from "~/images.server";
import {
  filterEventByVisibility,
  filterOrganizationByVisibility,
} from "~/next-public-fields-filtering.server";
import { prismaClient } from "~/prisma.server";
import { getPublicURL } from "~/storage.server";

export async function getOrganization(slug: string) {
  const [futureEventsOrganization, pastEventsOrganization] =
    await prismaClient.$transaction([
      prismaClient.organization.findUnique({
        select: {
          id: true,
          responsibleForEvents: {
            select: {
              event: {
                select: {
                  id: true,
                  slug: true,
                  background: true,
                  name: true,
                  subline: true,
                  description: true,
                  startTime: true,
                  endTime: true,
                  participantLimit: true,
                  canceled: true,
                  published: true,
                  _count: {
                    select: {
                      participants: true,
                      waitingList: true,
                    },
                  },
                  stage: {
                    select: {
                      slug: true,
                    },
                  },
                  eventVisibility: {
                    select: {
                      slug: true,
                      background: true,
                      name: true,
                      subline: true,
                      description: true,
                      startTime: true,
                      endTime: true,
                      participantLimit: true,
                      canceled: true,
                      published: true,
                      stage: true,
                    },
                  },
                },
              },
            },
            where: {
              event: {
                published: true,
                endTime: { gte: new Date() },
              },
            },
            orderBy: {
              event: { startTime: "asc" },
            },
          },
          organizationVisibility: {
            select: {
              responsibleForEvents: true,
            },
          },
        },
        where: {
          slug: slug,
        },
      }),
      prismaClient.organization.findUnique({
        select: {
          id: true,
          responsibleForEvents: {
            select: {
              event: {
                select: {
                  id: true,
                  slug: true,
                  background: true,
                  name: true,
                  subline: true,
                  description: true,
                  startTime: true,
                  endTime: true,
                  participantLimit: true,
                  canceled: true,
                  published: true,
                  _count: {
                    select: {
                      participants: true,
                      waitingList: true,
                    },
                  },
                  stage: {
                    select: {
                      slug: true,
                    },
                  },
                  eventVisibility: {
                    select: {
                      slug: true,
                      background: true,
                      name: true,
                      subline: true,
                      description: true,
                      startTime: true,
                      endTime: true,
                      participantLimit: true,
                      canceled: true,
                      published: true,
                      stage: true,
                    },
                  },
                },
              },
            },
            where: {
              event: {
                published: true,
                endTime: { lt: new Date() },
              },
            },
            orderBy: {
              event: { endTime: "desc" },
            },
          },
          organizationVisibility: {
            select: {
              responsibleForEvents: true,
            },
          },
        },
        where: {
          slug: slug,
        },
      }),
    ]);

  if (futureEventsOrganization === null || pastEventsOrganization === null) {
    return null;
  }

  const { responsibleForEvents: responsibleForFutureEvents, ...rest } =
    futureEventsOrganization;

  return {
    ...rest,
    futureEvents: responsibleForFutureEvents,
    pastEvents: pastEventsOrganization.responsibleForEvents,
  };
}

export function filterOrganization(
  organization: NonNullable<Awaited<ReturnType<typeof getOrganization>>>
) {
  const { futureEvents, pastEvents, ...rest } = organization;
  const filteredOrganization =
    filterOrganizationByVisibility<typeof rest>(rest);

  const filteredFutureEvents = futureEvents.map((relation) => {
    const filteredEvent = filterEventByVisibility<typeof relation.event>(
      relation.event
    );
    return {
      ...relation,
      event: filteredEvent,
    };
  });
  const filteredPastEvents = pastEvents.map((relation) => {
    const filteredEvent = filterEventByVisibility<typeof relation.event>(
      relation.event
    );
    return {
      ...relation,
      event: filteredEvent,
    };
  });

  return {
    ...filteredOrganization,
    futureEvents: filteredFutureEvents,
    pastEvents: filteredPastEvents,
  };
}

export function addImgUrls(
  authClient: SupabaseClient,
  organization: NonNullable<Awaited<ReturnType<typeof getOrganization>>>
) {
  const futureEvents = organization.futureEvents.map((relation) => {
    let background = relation.event.background;
    let blurredBackground;
    if (background !== null) {
      const publicURL = getPublicURL(authClient, background);
      background = getImageURL(publicURL, {
        resize: {
          type: "fill",
          ...ImageSizes.Event.ListItem.Background,
        },
      });
      blurredBackground = getImageURL(publicURL, {
        resize: {
          type: "fill",
          ...ImageSizes.Event.ListItem.BlurredBackground,
        },
      });
    }
    return {
      ...relation,
      event: {
        ...relation.event,
        background,
        blurredBackground,
      },
    };
  });

  const pastEvents = organization.pastEvents.map((relation) => {
    let background = relation.event.background;
    let blurredBackground;
    if (background !== null) {
      const publicURL = getPublicURL(authClient, background);
      background = getImageURL(publicURL, {
        resize: {
          type: "fill",
          ...ImageSizes.Event.ListItem.Background,
        },
      });
      blurredBackground = getImageURL(publicURL, {
        resize: {
          type: "fill",
          ...ImageSizes.Event.ListItem.BlurredBackground,
        },
      });
    } else {
      background = DefaultImages.Event.Background;
      blurredBackground = DefaultImages.Event.BlurredBackground;
    }
    return {
      ...relation,
      event: {
        ...relation.event,
        background,
        blurredBackground,
      },
    };
  });

  return {
    ...organization,
    futureEvents,
    pastEvents,
  };
}
