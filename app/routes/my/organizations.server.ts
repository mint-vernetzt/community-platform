import { type SupabaseClient } from "@supabase/supabase-js";
import { getImageURL } from "~/images.server";
import { prismaClient } from "~/prisma.server";
import { getPublicURL } from "~/storage.server";

export async function getOrganizationsFromProfile(id: string) {
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
                id: id,
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
                id: id,
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
  organizations: Awaited<ReturnType<typeof getOrganizationsFromProfile>>
) {
  const adminOrganizations = organizations.adminOrganizations.map(
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
      const teamMembers = organization.teamMembers.map((relation) => {
        let avatar = relation.profile.avatar;
        if (avatar !== null) {
          const publicURL = getPublicURL(authClient, avatar);
          if (publicURL !== null) {
            avatar = getImageURL(publicURL, {
              resize: { type: "fill", width: 64, height: 64 },
            });
          }
        }
        return {
          ...relation,
          profile: {
            ...relation.profile,
            avatar,
          },
        };
      });
      return {
        ...organization,
        logo,
        background,
        teamMembers,
      };
    }
  );

  const teamMemberOrganizations = organizations.teamMemberOrganizations.map(
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
      const teamMembers = organization.teamMembers.map((relation) => {
        let avatar = relation.profile.avatar;
        if (avatar !== null) {
          const publicURL = getPublicURL(authClient, avatar);
          if (publicURL !== null) {
            avatar = getImageURL(publicURL, {
              resize: { type: "fill", width: 64, height: 64 },
            });
          }
        }
        return {
          ...relation,
          profile: {
            ...relation.profile,
            avatar,
          },
        };
      });
      return {
        ...organization,
        logo,
        background,
        teamMembers,
      };
    }
  );

  return { adminOrganizations, teamMemberOrganizations };
}

export function flattenOrganizationRelations(
  organizations: Awaited<ReturnType<typeof getOrganizationsFromProfile>>
) {
  const adminOrganizations = organizations.adminOrganizations.map(
    (organization) => {
      return {
        ...organization,
        teamMembers: organization.teamMembers.map((relation) => {
          return relation.profile;
        }),
        types: organization.types.map((relation) => {
          return relation.organizationType.title;
        }),
        focuses: organization.focuses.map((relation) => {
          return relation.focus.title;
        }),
        areas: organization.areas.map((relation) => {
          return relation.area.name;
        }),
      };
    }
  );

  const teamMemberOrganizations = organizations.teamMemberOrganizations.map(
    (organization) => {
      return {
        ...organization,
        teamMembers: organization.teamMembers.map((relation) => {
          return relation.profile;
        }),
        types: organization.types.map((relation) => {
          return relation.organizationType.title;
        }),
        focuses: organization.focuses.map((relation) => {
          return relation.focus.title;
        }),
        areas: organization.areas.map((relation) => {
          return relation.area.name;
        }),
      };
    }
  );

  return { adminOrganizations, teamMemberOrganizations };
}
// TODO: Get invites -> transaction of two queries -> getInvitesForProfile(sessionUser.id) -> returns {adminInvites, teamMemberInvites}
// Select fields: slug, logo, name, organizationType
export async function getOrganizationInvitesForProfile(id: string) {
  const [adminInvites, teamMemberInvites] = await prismaClient.$transaction([
    prismaClient.inviteForProfileToJoinOrganization.findMany({
      select: {
        profileId: true,
        organizationId: true,
        organization: {
          select: {
            slug: true,
            name: true,
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
      where: {
        profileId: id,
        role: "admin",
      },
    }),
    prismaClient.inviteForProfileToJoinOrganization.findMany({
      select: {
        profileId: true,
        organizationId: true,
        organization: {
          select: {
            slug: true,
            name: true,
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
      where: {
        profileId: id,
        role: "member",
      },
    }),
  ]);

  return { adminInvites, teamMemberInvites };
}

export function addImageUrlToInvites(
  authClient: SupabaseClient,
  invites: Awaited<ReturnType<typeof getOrganizationInvitesForProfile>>
) {
  const adminInvites = invites.adminInvites.map((invite) => {
    let logo = invite.organization.logo;
    if (logo !== null) {
      const publicURL = getPublicURL(authClient, logo);
      if (publicURL !== null) {
        logo = getImageURL(publicURL, {
          resize: { type: "fill", width: 136, height: 136 },
        });
      }
    }
    return {
      ...invite,
      organization: {
        ...invite.organization,
        logo,
      },
    };
  });

  const teamMemberInvites = invites.teamMemberInvites.map((invite) => {
    let logo = invite.organization.logo;
    if (logo !== null) {
      const publicURL = getPublicURL(authClient, logo);
      if (publicURL !== null) {
        logo = getImageURL(publicURL, {
          resize: { type: "fill", width: 136, height: 136 },
        });
      }
    }
    return {
      ...invite,
      organization: {
        ...invite.organization,
        logo,
      },
    };
  });

  return { adminInvites, teamMemberInvites };
}
