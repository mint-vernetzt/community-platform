import { prismaClient } from "~/prisma.server";
import { type ProfileMode } from "./utils.server";

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

  return profile;
}
