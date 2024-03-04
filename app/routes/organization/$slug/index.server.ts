import type { SupabaseClient } from "@supabase/supabase-js";
import { GravityType, getImageURL } from "~/images.server";
import {
  filterEventByVisibility,
  filterOrganizationByVisibility,
  filterProfileByVisibility,
  filterProjectByVisibility,
} from "~/next-public-fields-filtering.server";
import { prismaClient } from "~/prisma.server";
import { getPublicURL } from "~/storage.server";

export type OrganizationQuery = NonNullable<
  Awaited<ReturnType<typeof getOrganizationBySlug>>
>;

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
              profileVisibility: {
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
              organizationVisibility: {
                select: {
                  id: true,
                  slug: true,
                  logo: true,
                  name: true,
                  types: true,
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
              organizationVisibility: {
                select: {
                  id: true,
                  slug: true,
                  logo: true,
                  name: true,
                  types: true,
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
                      organizationVisibility: {
                        select: {
                          id: true,
                          name: true,
                        },
                      },
                    },
                  },
                },
              },
              projectVisibility: {
                select: {
                  id: true,
                  slug: true,
                  logo: true,
                  name: true,
                  awards: true,
                  responsibleOrganizations: true,
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
              eventVisibility: {
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
                  stage: true,
                  canceled: true,
                  subline: true,
                  description: true,
                  background: true,
                },
              },
            },
          },
        },
        where: {
          event: {
            published: true,
          },
        },
      },
      organizationVisibility: {
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
          types: true,
          focuses: true,
          teamMembers: true,
          memberOf: true,
          networkMembers: true,
          areas: true,
          responsibleForProject: true,
          responsibleForEvents: true,
        },
      },
    },
  });

  return organization;
}

export function filterOrganization(organization: OrganizationQuery) {
  let enhancedOrganization = {
    ...organization,
  };
  // Filter organization
  enhancedOrganization =
    filterOrganizationByVisibility<typeof enhancedOrganization>(
      enhancedOrganization
    );
  // Filter networks where this organization is member of
  enhancedOrganization.memberOf = enhancedOrganization.memberOf.map(
    (relation) => {
      const filteredNetwork = filterOrganizationByVisibility<
        typeof relation.network
      >(relation.network);
      return { ...relation, network: filteredNetwork };
    }
  );
  // Filter network members of this organization
  enhancedOrganization.networkMembers = enhancedOrganization.networkMembers.map(
    (relation) => {
      const filteredNetworkMember = filterOrganizationByVisibility<
        typeof relation.networkMember
      >(relation.networkMember);
      return { ...relation, networkMember: filteredNetworkMember };
    }
  );
  // Filter team members
  enhancedOrganization.teamMembers = enhancedOrganization.teamMembers.map(
    (relation) => {
      const filteredProfile = filterProfileByVisibility<
        typeof relation.profile
      >(relation.profile);
      return { ...relation, profile: filteredProfile };
    }
  );
  // Filter projects and responsible organizations of projects where this organization is responsible for
  enhancedOrganization.responsibleForProject =
    enhancedOrganization.responsibleForProject.map((projectRelation) => {
      const filteredProject = filterProjectByVisibility<
        typeof projectRelation.project
      >(projectRelation.project);
      const responsibleOrganizations =
        projectRelation.project.responsibleOrganizations.map(
          (organizationRelation) => {
            const filteredOrganization = filterOrganizationByVisibility<
              typeof organizationRelation.organization
            >(organizationRelation.organization);
            return {
              ...organizationRelation,
              organization: filteredOrganization,
            };
          }
        );
      return {
        ...projectRelation,
        project: { ...filteredProject, responsibleOrganizations },
      };
    });
  // Filter events where organization is responsible for
  enhancedOrganization.responsibleForEvents =
    enhancedOrganization.responsibleForEvents.map((relation) => {
      const filteredEvent = filterEventByVisibility<typeof relation.event>(
        relation.event
      );
      return { ...relation, event: filteredEvent };
    });

  return enhancedOrganization;
}

export function addImgUrls(
  authClient: SupabaseClient,
  organization: OrganizationQuery
) {
  let logo = null;
  if (organization.logo !== null) {
    const publicURL = getPublicURL(authClient, organization.logo);
    if (publicURL) {
      logo = getImageURL(publicURL, {
        resize: { type: "fit", width: 144, height: 144 },
      });
    }
  }
  let background = null;
  if (organization.background !== null) {
    const publicURL = getPublicURL(authClient, organization.background);
    if (publicURL) {
      background = getImageURL(publicURL, {
        resize: { type: "fit", width: 1488, height: 480 },
      });
    }
  }

  const memberOf = organization.memberOf.map((relation) => {
    let logo = relation.network.logo;
    if (logo !== null) {
      const publicURL = getPublicURL(authClient, logo);
      if (publicURL !== null) {
        logo = getImageURL(publicURL, {
          resize: { type: "fit", width: 64, height: 64 },
        });
      }
    }
    return { ...relation, network: { ...relation.network, logo } };
  });

  const networkMembers = organization.networkMembers.map((relation) => {
    let logo = relation.networkMember.logo;
    if (logo !== null) {
      const publicURL = getPublicURL(authClient, logo);
      if (publicURL !== null) {
        logo = getImageURL(publicURL, {
          resize: { type: "fit", width: 64, height: 64 },
        });
      }
    }
    return {
      ...relation,
      networkMember: { ...relation.networkMember, logo },
    };
  });

  const teamMembers = organization.teamMembers.map((relation) => {
    let avatar = relation.profile.avatar;
    if (avatar !== null) {
      const publicURL = getPublicURL(authClient, avatar);
      if (publicURL !== null) {
        avatar = getImageURL(publicURL, {
          resize: { type: "fill", width: 64, height: 64 },
          gravity: GravityType.center,
        });
      }
    }
    return { ...relation, profile: { ...relation.profile, avatar } };
  });

  const responsibleForProject = organization.responsibleForProject.map(
    (projectRelation) => {
      let projectLogo = projectRelation.project.logo;
      if (projectLogo !== null) {
        const publicURL = getPublicURL(authClient, projectLogo);
        if (publicURL !== null) {
          projectLogo = getImageURL(publicURL, {
            resize: { type: "fit", width: 64, height: 64 },
            gravity: GravityType.center,
          });
        }
      }
      const awards = projectRelation.project.awards.map((awardRelation) => {
        let awardLogo = awardRelation.award.logo;
        if (awardLogo !== null) {
          const publicURL = getPublicURL(authClient, awardLogo);
          if (publicURL !== null) {
            awardLogo = getImageURL(publicURL, {
              resize: { type: "fit", width: 64, height: 64 },
              gravity: GravityType.center,
            });
          }
        }
        return {
          ...awardRelation,
          award: { ...awardRelation.award, logo: awardLogo },
        };
      });
      return {
        ...projectRelation,
        project: { ...projectRelation.project, awards, logo: projectLogo },
      };
    }
  );

  const responsibleForEvents = organization.responsibleForEvents.map(
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

  return {
    ...organization,
    logo,
    background,
    memberOf,
    networkMembers,
    teamMembers,
    responsibleForProject,
    responsibleForEvents,
  };
}

export function splitEventsIntoFutureAndPast<
  T extends OrganizationQuery["responsibleForEvents"]
>(events: OrganizationQuery["responsibleForEvents"]) {
  const futureEvents = [];
  const pastEvents = [];
  const now = new Date();

  for (const relation of events) {
    if (relation.event.endTime >= now) {
      futureEvents.push(relation);
    } else {
      pastEvents.push(relation);
    }
  }
  return {
    futureEvents,
    pastEvents,
  } as { futureEvents: T; pastEvents: T };
}

export function sortEvents<T extends OrganizationQuery["responsibleForEvents"]>(
  events: OrganizationQuery["responsibleForEvents"],
  inFuture: boolean
) {
  const sortedEvents = events.sort((a, b) => {
    if (inFuture) {
      return a.event.startTime >= b.event.startTime ? 1 : -1;
    }
    return a.event.startTime >= b.event.startTime ? -1 : 1;
  });
  return sortedEvents as T;
}
