import { type SupabaseClient } from "@supabase/supabase-js";
import { getImageURL } from "~/images.server";
import { mailerOptions } from "~/lib/submissions/mailer/mailerOptions";
import { mailer } from "~/mailer.server";
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
            id: true,
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
        status: "pending",
      },
      orderBy: {
        organization: {
          name: "asc",
        },
      },
    }),
    prismaClient.inviteForProfileToJoinOrganization.findMany({
      select: {
        profileId: true,
        organizationId: true,
        organization: {
          select: {
            id: true,
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
        status: "pending",
      },
      orderBy: {
        organization: {
          name: "asc",
        },
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
          resize: { type: "fill", width: 144, height: 144 },
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
          resize: { type: "fill", width: 144, height: 144 },
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

export async function getPendingOrganizationInvite(
  organizationId: string,
  profileId: string,
  role: "admin" | "member"
) {
  const invite =
    await prismaClient.inviteForProfileToJoinOrganization.findFirst({
      select: {
        profileId: true,
        organizationId: true,
        role: true,
      },
      where: {
        organizationId,
        profileId,
        role,
        status: "pending",
      },
    });
  return invite;
}

export async function updateOrganizationInvite(options: {
  profileId: string;
  organizationId: string;
  role: "admin" | "member";
  intent: "rejected" | "accepted";
}) {
  const { profileId, organizationId, role, intent } = options;
  const inviteQuery = prismaClient.inviteForProfileToJoinOrganization.update({
    select: {
      organization: {
        select: {
          slug: true,
          name: true,
          admins: {
            select: {
              profile: {
                select: {
                  email: true,
                },
              },
            },
          },
        },
      },
      profile: {
        select: {
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      role: true,
    },
    where: {
      profileId_organizationId_role: {
        organizationId,
        profileId,
        role,
      },
    },
    data: {
      status: intent,
    },
  });
  let connectToOrganizationQuery;
  if (intent === "accepted") {
    connectToOrganizationQuery =
      role === "admin"
        ? prismaClient.adminOfOrganization.create({
            data: {
              organizationId,
              profileId,
            },
          })
        : prismaClient.memberOfOrganization.create({
            data: {
              organizationId,
              profileId,
            },
          });
  }
  if (connectToOrganizationQuery) {
    const [invite] = await prismaClient.$transaction([
      inviteQuery,
      connectToOrganizationQuery,
    ]);
    return invite;
  }
  const invite = await inviteQuery;

  return invite;
}

export async function sendOrganizationInviteUpdatedEmail(
  intent: "accepted" | "rejected",
  invite: Awaited<ReturnType<typeof updateOrganizationInvite>>
) {
  const { organization, profile, role } = invite;
  const subject =
    intent === "accepted"
      ? `${profile.firstName} ${profile.lastName} accepted the invite to ${organization.name}`
      : `${profile.firstName} ${profile.lastName} rejected the invite to ${organization.name}`;
  const sender = process.env.SYSTEM_MAIL_SENDER;
  const recipient = organization.admins.map((admin) => {
    return admin.profile.email;
  });
  const text = `Hi admins of ${organization.name}, ${profile.firstName} ${profile.lastName} has ${intent} the invite to be ${role} of your organization. You can contact ${profile.firstName} ${profile.lastName} at ${profile.email}.`;
  const html = text;

  await mailer(mailerOptions, sender, recipient, subject, text, html);
}

export async function getAdminOrganizationsWithPendingRequests(id: string) {
  const organizations = await prismaClient.organization.findMany({
    select: {
      id: true,
      name: true,
      profileJoinRequests: {
        select: {
          profile: {
            select: {
              id: true,
              academicTitle: true,
              firstName: true,
              lastName: true,
              avatar: true,
              position: true,
              username: true,
            },
          },
          status: true,
        },
      },
    },
    where: {
      profileJoinRequests: {
        some: {
          status: "pending",
        },
      },
      admins: {
        some: {
          profileId: id,
        },
      },
    },
    orderBy: {
      name: "asc",
    },
  });

  const enhancedOrganizations = organizations.map((organization) => {
    const profileJoinRequests = organization.profileJoinRequests.filter(
      (relation) => {
        return relation.status === "pending";
      }
    );
    return {
      ...organization,
      profileJoinRequests,
    };
  });

  return enhancedOrganizations;
}

export function addImageUrlToRequests(
  authClient: SupabaseClient,
  organizationsWithRequests: Awaited<
    ReturnType<typeof getAdminOrganizationsWithPendingRequests>
  >
) {
  const enhancedOrganizations = organizationsWithRequests.map(
    (organization) => {
      const profileJoinRequests = organization.profileJoinRequests.map(
        (relation) => {
          let avatar = relation.profile.avatar;
          if (avatar !== null) {
            const publicURL = getPublicURL(authClient, avatar);
            if (publicURL !== null) {
              avatar = getImageURL(publicURL, {
                resize: { type: "fill", width: 144, height: 144 },
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
        }
      );
      return {
        ...organization,
        profileJoinRequests,
      };
    }
  );

  return enhancedOrganizations;
}
