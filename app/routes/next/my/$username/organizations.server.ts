import { type SupabaseClient } from "@supabase/supabase-js";
import { getImageURL } from "~/images.server";
import { prismaClient } from "~/prisma.server";
import { getPublicURL } from "~/storage.server";

export async function getOrganizationsFromProfile(username: string) {
  const [adminOrganizations, teamMemberOrganizations] =
    await prismaClient.$transaction([
      prismaClient.organization.findMany({
        select: {
          id: true,
          slug: true,
          name: true,
          bio: true,
          logo: true,
          background: true,
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
          areas: {
            select: {
              area: {
                select: {
                  name: true,
                },
              },
            },
          },
          teamMembers: {
            select: {
              profile: {
                select: {
                  firstName: true,
                  lastName: true,
                  avatar: true,
                  username: true,
                  id: true,
                },
              },
            },
          },
        },
        where: {
          admins: {
            some: {
              profile: {
                username: username,
              },
            },
          },
        },
        orderBy: {
          name: "asc",
        },
      }),
      prismaClient.organization.findMany({
        select: {
          id: true,
          slug: true,
          name: true,
          bio: true,
          logo: true,
          background: true,
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
          areas: {
            select: {
              area: {
                select: {
                  name: true,
                },
              },
            },
          },
          teamMembers: {
            select: {
              profile: {
                select: {
                  firstName: true,
                  lastName: true,
                  avatar: true,
                  username: true,
                  id: true,
                },
              },
            },
          },
        },
        where: {
          teamMembers: {
            some: {
              profile: {
                username: username,
              },
            },
          },
        },
        orderBy: {
          name: "asc",
        },
      }),
    ]);

  return { adminOrganizations, teamMemberOrganizations };
}

export function addImageUrlToOrganizations(
  authClient: SupabaseClient,
  result: Awaited<ReturnType<typeof getOrganizationsFromProfile>>
) {
  const adminOrganizations = result.adminOrganizations.map((organization) => {
    let background = organization.background;
    let logo = organization.logo;
    if (background !== null) {
      const publicURL = getPublicURL(authClient, background);
      if (publicURL !== null) {
        background = getImageURL(publicURL, {
          resize: { type: "fill", width: 348, height: 160 },
        });
      }
    }
    if (logo !== null) {
      const publicURL = getPublicURL(authClient, logo);
      if (publicURL !== null) {
        logo = getImageURL(publicURL, {
          resize: { type: "fill", width: 136, height: 136 },
        });
      }
    }
    return {
      ...organization,
      logo,
      background,
    };
  });

  const teamMemberOrganizations = result.teamMemberOrganizations.map(
    (organization) => {
      let background = organization.background;
      let logo = organization.logo;
      if (background !== null) {
        const publicURL = getPublicURL(authClient, background);
        if (publicURL !== null) {
          background = getImageURL(publicURL, {
            resize: { type: "fill", width: 348, height: 160 },
          });
        }
      }
      if (logo !== null) {
        const publicURL = getPublicURL(authClient, logo);
        if (publicURL !== null) {
          logo = getImageURL(publicURL, {
            resize: { type: "fill", width: 136, height: 136 },
          });
        }
      }
      return {
        ...organization,
        logo,
        background,
      };
    }
  );

  return { adminOrganizations, teamMemberOrganizations };
}
