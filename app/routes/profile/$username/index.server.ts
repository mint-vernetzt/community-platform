import { prismaClient } from "~/prisma.server";
import { type ProfileMode } from "./utils.server";

export type ProfileQuery = NonNullable<
  Awaited<ReturnType<typeof getProfileByUsername>>
>;

export async function getProfileByUsername(
  username: string,
  mode: ProfileMode
) {
  const profile = await prismaClient.profile.findUnique({
    where: { username },
    select: {
      id: true,
      username: true,
      avatar: true,
      background: true,
      email: true,
      phone: true,
      facebook: true,
      linkedin: true,
      twitter: true,
      xing: true,
      website: true,
      youtube: true,
      instagram: true,
      mastodon: true,
      tiktok: true,
      firstName: true,
      lastName: true,
      academicTitle: true,
      createdAt: true,
      position: true,
      bio: true,
      skills: true,
      interests: true,
      areas: { select: { area: { select: { name: true } } } },
      offers: { select: { offer: { select: { title: true } } } },
      seekings: { select: { offer: { select: { title: true } } } },
      memberOf: {
        select: {
          organization: {
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
          organization: {
            name: "asc",
          },
        },
      },
      teamMemberOfProjects: {
        where:
          mode !== "owner"
            ? {
                project: {
                  published: true,
                },
              }
            : {},
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
      teamMemberOfEvents: {
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
      participatedEvents: {
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
      contributedEvents: {
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
      waitingForEvents: {
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
      administeredEvents: {
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
      },
      profileVisibility: {
        select: {
          id: true,
          username: true,
          avatar: true,
          background: true,
          email: true,
          phone: true,
          facebook: true,
          linkedin: true,
          twitter: true,
          xing: true,
          website: true,
          youtube: true,
          instagram: true,
          firstName: true,
          lastName: true,
          academicTitle: true,
          createdAt: true,
          position: true,
          bio: true,
          skills: true,
          interests: true,
          areas: true,
          offers: true,
          seekings: true,
          memberOf: true,
          teamMemberOfProjects: true,
          teamMemberOfEvents: true,
          waitingForEvents: true,
          participatedEvents: true,
          contributedEvents: true,
        },
      },
    },
  });

  return profile;
}
