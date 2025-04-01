import { parseWithZod } from "@conform-to/zod-v1";
import { type User, type SupabaseClient } from "@supabase/supabase-js";
import { type supportedCookieLanguages } from "~/i18n.shared";
import { BlurFactor, getImageURL, ImageSizes } from "~/images.server";
import { DefaultImages } from "~/images.shared";
import { insertParametersIntoLocale } from "~/lib/utils/i18n";
import { type ArrayElement } from "~/lib/utils/types";
import { type languageModuleMap } from "~/locales/.server";
import { prismaClient } from "~/prisma.server";
import { getPublicURL } from "~/storage.server";
import {
  acceptOrRejectOrganizationMemberRequestSchema,
  createOrCancelOrganizationMemberRequestSchema,
  quitOrganizationSchema,
  updateNetworkInviteSchema,
  updateNetworkRequestSchema,
  updateOrganizationMemberInviteSchema,
} from "./organizations";

export type MyOrganizationsLocales = (typeof languageModuleMap)[ArrayElement<
  typeof supportedCookieLanguages
>]["my/organizations"];

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
                  slug: true,
                },
              },
            },
          },
          focuses: {
            select: {
              focus: {
                select: {
                  slug: true,
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
                  slug: true,
                },
              },
            },
          },
          focuses: {
            select: {
              focus: {
                select: {
                  slug: true,
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
      let blurredBackground;
      let logo = organization.logo;
      let blurredLogo;
      if (background !== null) {
        const publicURL = getPublicURL(authClient, background);
        if (publicURL !== null) {
          background = getImageURL(publicURL, {
            resize: {
              type: "fill",
              width: ImageSizes.Organization.Card.Background.width,
              height: ImageSizes.Organization.Card.Background.height,
            },
          });
          blurredBackground = getImageURL(publicURL, {
            resize: {
              type: "fill",
              width: ImageSizes.Organization.Card.BlurredBackground.width,
              height: ImageSizes.Organization.Card.BlurredBackground.height,
            },
            blur: BlurFactor,
          });
        }
      } else {
        background = DefaultImages.Organization.Background;
        blurredBackground = DefaultImages.Organization.BlurredBackground;
      }

      if (logo !== null) {
        const publicURL = getPublicURL(authClient, logo);
        if (publicURL !== null) {
          logo = getImageURL(publicURL, {
            resize: {
              type: "fill",
              width: ImageSizes.Organization.Card.Logo.width,
              height: ImageSizes.Organization.Card.Logo.height,
            },
          });
          blurredLogo = getImageURL(publicURL, {
            resize: {
              type: "fill",
              width: ImageSizes.Organization.Card.BlurredLogo.width,
              height: ImageSizes.Organization.Card.BlurredLogo.height,
            },
            blur: BlurFactor,
          });
        }
      }
      const teamMembers = organization.teamMembers.map((relation) => {
        let avatar = relation.profile.avatar;
        let blurredAvatar;
        if (avatar !== null) {
          const publicURL = getPublicURL(authClient, avatar);
          if (publicURL !== null) {
            avatar = getImageURL(publicURL, {
              resize: {
                type: "fill",
                width: ImageSizes.Profile.CardFooter.Avatar.width,
                height: ImageSizes.Profile.CardFooter.Avatar.height,
              },
            });
            blurredAvatar = getImageURL(publicURL, {
              resize: {
                type: "fill",
                width: ImageSizes.Profile.CardFooter.BlurredAvatar.width,
                height: ImageSizes.Profile.CardFooter.BlurredAvatar.height,
              },
              blur: BlurFactor,
            });
          }
        }
        return {
          ...relation,
          profile: {
            ...relation.profile,
            avatar,
            blurredAvatar,
          },
        };
      });
      return {
        ...organization,
        logo,
        blurredLogo,
        background,
        blurredBackground,
        teamMembers,
      };
    }
  );

  const teamMemberOrganizations = organizations.teamMemberOrganizations.map(
    (organization) => {
      let background = organization.background;
      let blurredBackground;
      let logo = organization.logo;
      let blurredLogo;
      if (background !== null) {
        const publicURL = getPublicURL(authClient, background);
        if (publicURL !== null) {
          background = getImageURL(publicURL, {
            resize: {
              type: "fill",
              width: ImageSizes.Organization.Card.Background.width,
              height: ImageSizes.Organization.Card.Background.height,
            },
          });
          blurredBackground = getImageURL(publicURL, {
            resize: {
              type: "fill",
              width: ImageSizes.Organization.Card.BlurredBackground.width,
              height: ImageSizes.Organization.Card.BlurredBackground.height,
            },
            blur: BlurFactor,
          });
        }
      } else {
        background = DefaultImages.Organization.Background;
        blurredBackground = DefaultImages.Organization.BlurredBackground;
      }

      if (logo !== null) {
        const publicURL = getPublicURL(authClient, logo);
        if (publicURL !== null) {
          logo = getImageURL(publicURL, {
            resize: {
              type: "fill",
              width: ImageSizes.Organization.Card.Logo.width,
              height: ImageSizes.Organization.Card.Logo.height,
            },
          });
          blurredLogo = getImageURL(publicURL, {
            resize: {
              type: "fill",
              width: ImageSizes.Organization.Card.BlurredLogo.width,
              height: ImageSizes.Organization.Card.BlurredLogo.height,
            },
            blur: BlurFactor,
          });
        }
      }
      const teamMembers = organization.teamMembers.map((relation) => {
        let avatar = relation.profile.avatar;
        let blurredAvatar;
        if (avatar !== null) {
          const publicURL = getPublicURL(authClient, avatar);
          if (publicURL !== null) {
            avatar = getImageURL(publicURL, {
              resize: {
                type: "fill",
                width: ImageSizes.Profile.CardFooter.Avatar.width,
                height: ImageSizes.Profile.CardFooter.Avatar.height,
              },
            });
            blurredAvatar = getImageURL(publicURL, {
              resize: {
                type: "fill",
                width: ImageSizes.Profile.CardFooter.BlurredAvatar.width,
                height: ImageSizes.Profile.CardFooter.BlurredAvatar.height,
              },
              blur: BlurFactor,
            });
          }
        }
        return {
          ...relation,
          profile: {
            ...relation.profile,
            avatar,
            blurredAvatar,
          },
        };
      });
      return {
        ...organization,
        logo,
        blurredLogo,
        background,
        blurredBackground,
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
          return relation.organizationType.slug;
        }),
        focuses: organization.focuses.map((relation) => {
          return relation.focus.slug;
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
          return relation.organizationType.slug;
        }),
        focuses: organization.focuses.map((relation) => {
          return relation.focus.slug;
        }),
        areas: organization.areas.map((relation) => {
          return relation.area.name;
        }),
      };
    }
  );

  return { adminOrganizations, teamMemberOrganizations };
}

export async function getOrganizationMemberInvites(id: string) {
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
                    slug: true,
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
                    slug: true,
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

export function addImageUrlToOrganizationMemberInvites(
  authClient: SupabaseClient,
  invites: Awaited<ReturnType<typeof getOrganizationMemberInvites>>
) {
  const adminInvites = invites.adminInvites.map((invite) => {
    let logo = invite.organization.logo;
    let blurredLogo;
    if (logo !== null) {
      const publicURL = getPublicURL(authClient, logo);
      if (publicURL !== null) {
        logo = getImageURL(publicURL, {
          resize: {
            type: "fill",
            width: ImageSizes.Organization.ListItem.Logo.width,
            height: ImageSizes.Organization.ListItem.Logo.width,
          },
        });
        blurredLogo = getImageURL(publicURL, {
          resize: {
            type: "fill",
            width: ImageSizes.Organization.ListItem.BlurredLogo.width,
            height: ImageSizes.Organization.ListItem.BlurredLogo.height,
          },
          blur: BlurFactor,
        });
      }
    }
    return {
      ...invite,
      organization: {
        ...invite.organization,
        logo,
        blurredLogo,
      },
    };
  });

  const teamMemberInvites = invites.teamMemberInvites.map((invite) => {
    let logo = invite.organization.logo;
    let blurredLogo;
    if (logo !== null) {
      const publicURL = getPublicURL(authClient, logo);
      if (publicURL !== null) {
        logo = getImageURL(publicURL, {
          resize: {
            type: "fill",
            width: ImageSizes.Organization.ListItem.Logo.width,
            height: ImageSizes.Organization.ListItem.Logo.height,
          },
        });
        blurredLogo = getImageURL(publicURL, {
          resize: {
            type: "fill",
            width: ImageSizes.Organization.ListItem.BlurredLogo.width,
            height: ImageSizes.Organization.ListItem.BlurredLogo.height,
          },
          blur: BlurFactor,
        });
      }
    }
    return {
      ...invite,
      organization: {
        ...invite.organization,
        logo,
        blurredLogo,
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
                  firstName: true,
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

export async function getOrganizationMemberRequests(id: string) {
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

export function addImageUrlToOrganizationMemberRequests(
  authClient: SupabaseClient,
  organizationsWithRequests: Awaited<
    ReturnType<typeof getOrganizationMemberRequests>
  >
) {
  const enhancedOrganizations = organizationsWithRequests.map(
    (organization) => {
      const profileJoinRequests = organization.profileJoinRequests.map(
        (relation) => {
          let avatar = relation.profile.avatar;
          let blurredAvatar;
          if (avatar !== null) {
            const publicURL = getPublicURL(authClient, avatar);
            if (publicURL !== null) {
              avatar = getImageURL(publicURL, {
                resize: {
                  type: "fill",
                  width: ImageSizes.Profile.ListItem.Avatar.width,
                  height: ImageSizes.Profile.ListItem.Avatar.height,
                },
              });
              blurredAvatar = getImageURL(publicURL, {
                resize: {
                  type: "fill",
                  width: ImageSizes.Profile.ListItem.BlurredAvatar.width,
                  height: ImageSizes.Profile.ListItem.BlurredAvatar.height,
                },
                blur: BlurFactor,
              });
            }
          }
          return {
            ...relation,
            profile: {
              ...relation.profile,
              avatar,
              blurredAvatar,
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

export async function getNetworkRequests(id: string) {
  const organizations = await prismaClient.organization.findMany({
    select: {
      id: true,
      name: true,
      receivedNetworkJoinRequests: {
        select: {
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
                      slug: true,
                    },
                  },
                },
              },
            },
          },
          status: true,
        },
      },
    },
    where: {
      receivedNetworkJoinRequests: {
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
    const receivedNetworkJoinRequests =
      organization.receivedNetworkJoinRequests.filter((relation) => {
        return relation.status === "pending";
      });
    return {
      ...organization,
      receivedNetworkJoinRequests,
    };
  });

  return enhancedOrganizations;
}

export function addImageUrlToNetworkRequests(
  authClient: SupabaseClient,
  organizationsWithNetworkRequests: Awaited<
    ReturnType<typeof getNetworkRequests>
  >
) {
  const enhancedOrganizations = organizationsWithNetworkRequests.map(
    (organization) => {
      const receivedNetworkJoinRequests =
        organization.receivedNetworkJoinRequests.map((relation) => {
          let logo = relation.organization.logo;
          let blurredLogo;
          if (logo !== null) {
            const publicURL = getPublicURL(authClient, logo);
            if (publicURL !== null) {
              logo = getImageURL(publicURL, {
                resize: {
                  type: "fill",
                  width: ImageSizes.Organization.ListItem.Logo.width,
                  height: ImageSizes.Organization.ListItem.Logo.height,
                },
              });
              blurredLogo = getImageURL(publicURL, {
                resize: {
                  type: "fill",
                  width: ImageSizes.Organization.ListItem.BlurredLogo.width,
                  height: ImageSizes.Organization.ListItem.BlurredLogo.height,
                },
                blur: BlurFactor,
              });
            }
          }
          return {
            ...relation,
            organization: {
              ...relation.organization,
              logo,
              blurredLogo,
            },
          };
        });
      return {
        ...organization,
        receivedNetworkJoinRequests,
      };
    }
  );

  return enhancedOrganizations;
}

export async function getNetworkInvites(id: string) {
  const organizations = await prismaClient.organization.findMany({
    select: {
      id: true,
      name: true,
      receivedNetworkJoinInvites: {
        select: {
          network: {
            select: {
              id: true,
              slug: true,
              name: true,
              logo: true,
              types: {
                select: {
                  organizationType: {
                    select: {
                      slug: true,
                    },
                  },
                },
              },
            },
          },
          status: true,
        },
      },
    },
    where: {
      receivedNetworkJoinInvites: {
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
    const receivedNetworkJoinInvites =
      organization.receivedNetworkJoinInvites.filter((relation) => {
        return relation.status === "pending";
      });
    return {
      ...organization,
      receivedNetworkJoinInvites,
    };
  });

  return enhancedOrganizations;
}

export function addImageUrlToNetworkInvites(
  authClient: SupabaseClient,
  organizationsWithNetworkInvites: Awaited<ReturnType<typeof getNetworkInvites>>
) {
  const enhancedOrganizations = organizationsWithNetworkInvites.map(
    (organization) => {
      const receivedNetworkJoinInvites =
        organization.receivedNetworkJoinInvites.map((relation) => {
          let logo = relation.network.logo;
          let blurredLogo;
          if (logo !== null) {
            const publicURL = getPublicURL(authClient, logo);
            if (publicURL !== null) {
              logo = getImageURL(publicURL, {
                resize: {
                  type: "fill",
                  width: ImageSizes.Organization.ListItem.Logo.width,
                  height: ImageSizes.Organization.ListItem.Logo.height,
                },
              });
              blurredLogo = getImageURL(publicURL, {
                resize: {
                  type: "fill",
                  width: ImageSizes.Organization.ListItem.BlurredLogo.width,
                  height: ImageSizes.Organization.ListItem.BlurredLogo.height,
                },
                blur: BlurFactor,
              });
            }
          }
          return {
            ...relation,
            network: {
              ...relation.network,
              logo,
              blurredLogo,
            },
          };
        });
      return {
        ...organization,
        receivedNetworkJoinInvites,
      };
    }
  );

  return enhancedOrganizations;
}

export async function createOrCancelOrganizationMemberRequest(options: {
  formData: FormData;
  intent: "createOrganizationMemberRequest" | "cancelOrganizationMemberRequest";
  locales: MyOrganizationsLocales;
  sessionUser: User;
}) {
  const { formData, intent, locales, sessionUser } = options;
  const submission = await parseWithZod(formData, {
    schema: () =>
      createOrCancelOrganizationMemberRequestSchema.transform(
        async (data, ctx) => {
          // TODO:
          // profile id from session user and organization id from form data
          // Send corresponding email

          // Old
          // see requests.tsx
          return { ...data };
        }
      ),
    async: true,
  });
  if (submission.status !== "success") {
    return {
      submission: submission.reply(),
    };
  }
  return {
    submission: submission.reply(),
    toast: {
      id: "create-or-cancel-organization-member-request-toast",
      key: `${new Date().getTime()}`,
      message: insertParametersIntoLocale(
        intent === "createOrganizationMemberRequest"
          ? locales.route.requestOrganizationMembership
              .createOrganizationMemberRequest
          : locales.route.requestOrganizationMembership
              .cancelOrganizationMemberRequest,
        {
          name: "TODO: organization name from database",
        }
      ),
    },
  };
}

export async function updateOrganizationMemberInvite(options: {
  formData: FormData;
  intent: "acceptOrganizationMemberInvite" | "rejectOrganizationMemberInvite";
  locales: MyOrganizationsLocales;
  sessionUser: User;
}) {
  const { formData, intent, locales, sessionUser } = options;
  const submission = await parseWithZod(formData, {
    schema: () =>
      updateOrganizationMemberInviteSchema.transform(async (data, ctx) => {
        // TODO:
        // invite id from form data
        // Check if the connected profile id is the session user id
        // Check if the invite is pending
        // Set the invite to accepted or rejected
        // Get the role from the invite
        // On accept check if the connection already exists (admin or member depending on role)
        // If not create the connection (admin or member depending on role)
        // If it exists, do nothing
        // Send corresponding email

        // Old
        // // Even if typescript claims that role and intent has the correct type i needed to add the below typecheck to make the compiler happy when running npm run typecheck
        // invariantResponse(
        //   submission.value.role === "admin" || submission.value.role === "member",
        //   "Only admin and member are valid roles.",
        //   { status: 400 }
        // );
        // invariantResponse(
        //   submission.value.intent === "accepted" ||
        //     submission.value.intent === "rejected",
        //   "Only accepted and rejected are valid intents.",
        //   { status: 400 }
        // );

        // const pendingInvite = await getPendingOrganizationInvite(
        //   submission.value.organizationId,
        //   sessionUser.id,
        //   submission.value.role
        // );
        // invariantResponse(pendingInvite !== null, "Pending invite not found.", {
        //   status: 404,
        // });

        // const invite = await updateOrganizationInvite({
        //   profileId: sessionUser.id,
        //   organizationId: submission.value.organizationId,
        //   role: submission.value.role,
        //   intent: submission.value.intent,
        // });

        // const sender = process.env.SYSTEM_MAIL_SENDER;
        // try {
        //   await Promise.all(
        //     invite.organization.admins.map(async (admin) => {
        //       let textTemplatePath:
        //         | "mail-templates/invites/profile-to-join-organization/accepted-text.hbs"
        //         | "mail-templates/invites/profile-to-join-organization/rejected-text.hbs"
        //         | "mail-templates/invites/profile-to-join-organization/as-admin-accepted-text.hbs"
        //         | "mail-templates/invites/profile-to-join-organization/as-admin-rejected-text.hbs";
        //       let htmlTemplatePath:
        //         | "mail-templates/invites/profile-to-join-organization/accepted-html.hbs"
        //         | "mail-templates/invites/profile-to-join-organization/rejected-html.hbs"
        //         | "mail-templates/invites/profile-to-join-organization/as-admin-accepted-html.hbs"
        //         | "mail-templates/invites/profile-to-join-organization/as-admin-rejected-html.hbs";

        //       let subject: string;

        //       if (submission.value.intent === "accepted") {
        //         textTemplatePath =
        //           submission.value.role === "admin"
        //             ? "mail-templates/invites/profile-to-join-organization/as-admin-accepted-text.hbs"
        //             : "mail-templates/invites/profile-to-join-organization/accepted-text.hbs";
        //         htmlTemplatePath =
        //           submission.value.role === "admin"
        //             ? "mail-templates/invites/profile-to-join-organization/as-admin-accepted-html.hbs"
        //             : "mail-templates/invites/profile-to-join-organization/accepted-html.hbs";
        //         subject =
        //           submission.value.role === "admin"
        //             ? locales.route.email.inviteAsAdminAccepted.subject
        //             : locales.route.email.inviteAccepted.subject;
        //       } else {
        //         textTemplatePath =
        //           submission.value.role === "admin"
        //             ? "mail-templates/invites/profile-to-join-organization/as-admin-rejected-text.hbs"
        //             : "mail-templates/invites/profile-to-join-organization/rejected-text.hbs";
        //         htmlTemplatePath =
        //           submission.value.role === "admin"
        //             ? "mail-templates/invites/profile-to-join-organization/as-admin-rejected-html.hbs"
        //             : "mail-templates/invites/profile-to-join-organization/rejected-html.hbs";
        //         subject =
        //           submission.value.role === "admin"
        //             ? locales.route.email.inviteAsAdminRejected.subject
        //             : locales.route.email.inviteRejected.subject;
        //       }

        //       const content = {
        //         firstName: admin.profile.firstName,
        //         organization: {
        //           name: invite.organization.name,
        //         },
        //         profile: {
        //           firstName: invite.profile.firstName,
        //           lastName: invite.profile.lastName,
        //         },
        //       };

        //       const text = getCompiledMailTemplate<typeof textTemplatePath>(
        //         textTemplatePath,
        //         content,
        //         "text"
        //       );
        //       const html = getCompiledMailTemplate<typeof htmlTemplatePath>(
        //         htmlTemplatePath,
        //         content,
        //         "html"
        //       );

        //       await mailer(
        //         mailerOptions,
        //         sender,
        //         admin.profile.email,
        //         subject,
        //         text,
        //         html
        //       );
        //     })
        //   );
        // } catch (error) {
        //   console.error({ error });
        //   invariantResponse(false, "Server Error: Mailer", { status: 500 });
        // }
        return { ...data };
      }),
    async: true,
  });
  if (submission.status !== "success") {
    return {
      submission: submission.reply(),
    };
  }
  return {
    submission: submission.reply(),
    toast: {
      id: "update-organization-member-invite-toast",
      key: `${new Date().getTime()}`,
      message: insertParametersIntoLocale(
        intent === "acceptOrganizationMemberInvite"
          ? locales.route.organizationMemberInvites.accepted
          : locales.route.organizationMemberInvites.rejected,
        {
          name: "TODO: organization name from database",
        }
      ),
    },
  };
}

export async function updateNetworkInvite(options: {
  formData: FormData;
  intent: "acceptNetworkInvite" | "rejectNetworkInvite";
  locales: MyOrganizationsLocales;
  sessionUser: User;
}) {
  const { formData, intent, locales, sessionUser } = options;
  const submission = await parseWithZod(formData, {
    schema: () =>
      updateNetworkInviteSchema.transform(async (data, ctx) => {
        // TODO:
        // invite id from form data
        // Check if the session user is admin of the connected organization id
        // Check if the invite is pending
        // Set the invite to accepted or rejected
        // On accept check if the connection already exists
        // If not create the connection
        // If it exists, do nothing
        // Send corresponding email

        return { ...data };
      }),
    async: true,
  });
  if (submission.status !== "success") {
    return {
      submission: submission.reply(),
    };
  }
  return {
    submission: submission.reply(),
    toast: {
      id: "update-network-invite-toast",
      key: `${new Date().getTime()}`,
      message: insertParametersIntoLocale(
        intent === "acceptNetworkInvite"
          ? locales.route.networkInvites.acceptNetworkInvite
          : locales.route.networkInvites.rejectNetworkInvite,
        {
          organizationName: "TODO: organization name from database",
          networkName: "TODO: network name from database",
        }
      ),
    },
  };
}

export async function acceptOrRejectOrganizationMemberRequest(options: {
  formData: FormData;
  intent: "acceptOrganizationMemberRequest" | "rejectOrganizationMemberRequest";
  locales: MyOrganizationsLocales;
  sessionUser: User;
}) {
  const { formData, intent, locales, sessionUser } = options;
  const submission = await parseWithZod(formData, {
    schema: () =>
      acceptOrRejectOrganizationMemberRequestSchema.transform(
        async (data, ctx) => {
          // TODO:
          // request id from form data
          // Check if the session user is admin of the connected organization id
          // Check if the request is pending
          // Set the request to accepted or rejected
          // On accept check if the connection already exists
          // If not create the connection
          // If it exists, do nothing
          // Send corresponding email

          // Old
          // see requests.tsx
          return { ...data };
        }
      ),
    async: true,
  });
  if (submission.status !== "success") {
    return {
      submission: submission.reply(),
    };
  }
  return {
    submission: submission.reply(),
    toast: {
      id: "accept-or-reject-organization-member-request-toast",
      key: `${new Date().getTime()}`,
      message: insertParametersIntoLocale(
        intent === "acceptOrganizationMemberRequest"
          ? locales.route.organizationMemberRequests
              .acceptOrganizationMemberRequest
          : locales.route.organizationMemberRequests
              .rejectOrganizationMemberRequest,
        {
          academicTitle: "TODO: from database",
          firstName: "TODO: from database",
          lastName: "TODO: from database",
        }
      ),
    },
  };
}

export async function updateNetworkRequest(options: {
  formData: FormData;
  intent: "acceptNetworkRequest" | "rejectNetworkRequest";
  locales: MyOrganizationsLocales;
  sessionUser: User;
}) {
  const { formData, intent, locales, sessionUser } = options;
  const submission = await parseWithZod(formData, {
    schema: () =>
      updateNetworkRequestSchema.transform(async (data, ctx) => {
        // TODO:
        // request id from form data
        // Check if the session user is admin of the connected network id
        // Check if the request is pending
        // Set the request to accepted or rejected
        // On accept check if the connection already exists
        // If not create the connection
        // If it exists, do nothing
        // Send corresponding email
        return { ...data };
      }),
    async: true,
  });
  if (submission.status !== "success") {
    return {
      submission: submission.reply(),
    };
  }
  return {
    submission: submission.reply(),
    toast: {
      id: "accept-or-reject-organization-member-request-toast",
      key: `${new Date().getTime()}`,
      message: insertParametersIntoLocale(
        intent === "acceptNetworkRequest"
          ? locales.route.networkRequests.acceptNetworkRequest
          : locales.route.networkRequests.rejectNetworkRequest,
        {
          organizationName: "TODO: organization name from database",
          networkName: "TODO: network name from database",
        }
      ),
    },
  };
}

export async function quitOrganization(options: {
  formData: FormData;
  locales: MyOrganizationsLocales;
  sessionUser: User;
}) {
  const { formData, locales, sessionUser } = options;
  const submission = await parseWithZod(formData, {
    schema: () =>
      quitOrganizationSchema.transform(async (data, ctx) => {
        // TODO:
        // organization id from form data
        // Check if the session user is admin or team member of the organization
        // Check if the session user is last admin of the organization
        // If so, return custom issue -> locales.route.quit.lastAdmin
        // If not, remove the connections (admin and team member)

        // Old
        // see quit.tsx
        return { ...data };
      }),
    async: true,
  });
  if (submission.status !== "success") {
    return {
      submission: submission.reply(),
    };
  }
  return {
    submission: submission.reply(),
    toast: {
      id: "accept-or-reject-organization-member-request-toast",
      key: `${new Date().getTime()}`,
      message: insertParametersIntoLocale(locales.route.quit.success, {
        name: "TODO: organization name from database",
      }),
    },
  };
}
