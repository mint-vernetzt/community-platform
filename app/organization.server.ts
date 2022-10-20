import { Organization } from ".prisma/client";
import { AreaType } from "@prisma/client";
import { prismaClient } from "./prisma";

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
              username: true,
              avatar: true,
              firstName: true,
              lastName: true,
              academicTitle: true,
              position: true,
            },
          },
        },
      },
      memberOf: {
        select: {
          network: {
            select: {
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
      },
      networkMembers: {
        select: {
          networkMember: {
            select: {
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

  return organization;
}

export async function getOrganizationEvents(slug: string) {
  const organizationEvents = await prismaClient.organization.findFirst({
    select: {
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
              participantLimit: true,
              stage: {
                select: {
                  title: true,
                },
              },
              canceled: true,
              subline: true,
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
            startTime: {
              gte: new Date(),
            },
            published: true,
          },
        },
        orderBy: {
          event: {
            startTime: "asc",
          },
        },
      },
    },
    where: {
      slug,
    },
  });

  return organizationEvents;
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
  return await prismaClient.organization.delete({ where: { slug: slug } });
}

export async function getAllOrganizations() {
  const organizations = await prismaClient.organization.findMany({
    select: {
      name: true,
      slug: true,
      logo: true,
      bio: true,
      publicFields: true,
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
