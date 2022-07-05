import { Organization } from ".prisma/client";
import { prismaClient } from "./prisma";

export type OrganizationWithRelations = Organization & {
  types: {
    organizationType: {
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

  return organization as OrganizationWithRelations | null;
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
