import { notFound } from "remix-utils";
import { prismaClient } from "~/prisma.server";

export async function getProjectBySlug(slug: string) {
  const result = await prismaClient.project.findFirst({
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
      twitter: true,
      xing: true,
      instagram: true,
      youtube: true,
      facebook: true,
      street: true,
      streetNumber: true,
      zipCode: true,
      city: true,
      headline: true,
      excerpt: true,
      description: true,
      targetGroups: {
        select: {
          targetGroupId: true,
          targetGroup: {
            select: {
              title: true,
            },
          },
        },
      },
      disciplines: {
        select: {
          disciplineId: true,
          discipline: {
            select: {
              title: true,
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
              logo: true,
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
      teamMembers: {
        select: {
          profile: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              username: true,
              position: true,
              avatar: true,
            },
          },
        },
        orderBy: {
          profile: {
            firstName: "asc",
          },
        },
      },
      awards: {
        select: {
          awardId: true,
          award: {
            select: {
              title: true,
              shortTitle: true,
              date: true,
              subline: true,
              logo: true,
            },
          },
        },
      },
    },
  });
  return result;
}

export async function getProjectBySlugOrThrow(slug: string) {
  const result = await getProjectBySlug(slug);
  if (result === null) {
    throw notFound({ message: "Project not found" });
  }
  return result;
}

export async function getProjectVisibilitiesBySlugOrThrow(slug: string) {
  const result = await prismaClient.projectVisibility.findFirst({
    where: {
      project: {
        slug,
      },
    },
  });
  if (result === null) {
    throw notFound({ message: "Project visbilities not found." });
  }
  return result;
}
