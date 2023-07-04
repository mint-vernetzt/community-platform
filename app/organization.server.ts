import type { Organization } from ".prisma/client";
import type { AreaType } from "@prisma/client";
import type { SupabaseClient } from "@supabase/auth-helpers-remix";
import type { User } from "@supabase/supabase-js";
import { notFound } from "remix-utils";
import { addUserParticipationStatus } from "~/lib/event/utils";
import { getImageURL } from "./images.server";
import type { ArrayElement } from "./lib/utils/types";
import { prismaClient } from "./prisma";
import {
  filterEventDataByVisibilitySettings,
  filterOrganizationDataByVisibilitySettings,
} from "./public-fields-filtering.server";
import { getPublicURL } from "./storage.server";

export type OrganizationWithRelations = Organization & {
  types: {
    organizationType: {
      title: string;
    };
  }[];
  focuses: {
    focus: {
      title: string;
    };
  }[];
  teamMembers: {
    profileId: string;
    isPrivileged: boolean;
    profile: {
      username: string;
      avatar: string | null;
      firstName: string;
      lastName: string;
      academicTitle: string | null;
      position: string | null;
    };
  }[];
  memberOf: {
    network: {
      slug: string;
      logo: string | null;
      name: string;
      types: {
        organizationType: {
          title: string;
        };
      }[];
    };
  }[];
  networkMembers: {
    networkMember: {
      slug: string;
      logo: string | null;
      name: string;
      types: {
        organizationType: {
          title: string;
        };
      }[];
    };
  }[];
  areas: {
    area: {
      name: string;
    };
  }[];
};

export async function getOrganizationBySlug(slug: string) {
  const organization = await prismaClient.organization.findUnique({
    where: { slug },
    include: {
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
          isPrivileged: true,
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
                      slug: true,
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
                  childEvents: true,
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
  let organization = await getOrganizationWithEvents(slug, inFuture);

  if (organization === null) {
    throw notFound({ message: "Organization with events not found" });
  }

  // Filtering by visbility settings
  if (sessionUser === null) {
    // Filter organization holding event relations
    const filteredOrganization = (
      await filterOrganizationDataByVisibilitySettings<typeof organization>([
        organization,
      ])
    )[0];
    organization = filteredOrganization;
    // Filter events where organization is responsible for
    const rawResponsibleEvents = organization.responsibleForEvents.map(
      (event) => {
        return event.event;
      }
    );
    const filteredResponsibleEvents = await filterEventDataByVisibilitySettings<
      ArrayElement<typeof rawResponsibleEvents>
    >(rawResponsibleEvents);
    organization.responsibleForEvents = organization.responsibleForEvents.map(
      (event) => {
        let filteredEvent = event;
        for (let filteredResponsibleEvent of filteredResponsibleEvents) {
          if (event.event.slug === filteredResponsibleEvent.slug) {
            filteredEvent.event = filteredResponsibleEvent;
          }
        }
        return filteredEvent;
      }
    );
  }

  // Get images from image proxy
  organization.responsibleForEvents = organization.responsibleForEvents.map(
    (item) => {
      if (item.event.background !== null) {
        const publicURL = getPublicURL(authClient, item.event.background);
        if (publicURL) {
          item.event.background = getImageURL(publicURL, {
            resize: { type: "fit", width: 160, height: 160 },
          });
        }
      }
      return item;
    }
  );

  const enhancedEvents = {
    responsibleForEvents: await addUserParticipationStatus<
      typeof organization.responsibleForEvents
    >(organization.responsibleForEvents, sessionUser?.id),
  };
  return enhancedEvents;
}

export async function getOrganizationMembersBySlug(slug: string) {
  const organization = await prismaClient.organization.findUnique({
    where: { slug },
    select: {
      teamMembers: true,
    },
  });

  return organization;
}

export async function deleteOrganizationBySlug(slug: string) {
  await prismaClient.organization.delete({ where: { slug: slug } });
}

export async function getAllOrganizations() {
  const organizations = await prismaClient.organization.findMany({
    select: {
      name: true,
      slug: true,
      logo: true,
      bio: true,
      types: {
        select: {
          organizationType: {
            select: {
              title: true,
            },
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
    },
  });
  return organizations;
}

export async function getFilteredOrganizations(
  areaToFilter:
    | { id: string; type: AreaType; stateId: string | null }
    | null
    | undefined
) {
  let areaQuery = {};

  if (areaToFilter !== null && areaToFilter !== undefined) {
    if (areaToFilter.type === "country") {
      areaQuery = {
        areas: {
          some: {},
        },
      };
      // TODO: Order by area type: country -> state -> district
    }
    if (areaToFilter.type === "state") {
      areaQuery = {
        OR: [
          {
            areas: {
              some: {
                area: {
                  stateId: areaToFilter.stateId,
                },
              },
            },
          },
          {
            areas: {
              some: {
                area: {
                  type: "country",
                },
              },
            },
          },
        ],
      };
      // TODO: Order by area type: state -> district -> country
    }
    if (areaToFilter.type === "district") {
      areaQuery = {
        OR: [
          {
            areas: {
              some: {
                area: {
                  id: areaToFilter.id,
                },
              },
            },
          },
          {
            areas: {
              some: {
                area: {
                  type: "state",
                  stateId: areaToFilter.stateId,
                },
              },
            },
          },
          {
            areas: {
              some: {
                area: {
                  type: "country",
                },
              },
            },
          },
        ],
      };
      // TODO: Order by area type: district -> state -> country
    }
  }
  if (areaQuery === undefined) {
    return [];
  }

  const result = await prismaClient.organization.findMany({
    where: areaQuery,
    select: {
      name: true,
      slug: true,
      logo: true,
      bio: true,
      types: {
        select: {
          organizationType: {
            select: {
              title: true,
            },
          },
        },
      },
      areas: {
        select: {
          area: {
            select: {
              name: true,
              type: true,
              stateId: true,
            },
          },
        },
      },
    },
    // TODO: Add orderBy
  });
  return result;
}
