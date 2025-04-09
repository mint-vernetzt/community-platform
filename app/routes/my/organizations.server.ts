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
import * as Sentry from "@sentry/node";
import { z } from "zod";
import { invariantResponse } from "~/lib/utils/response";
import {
  getCompiledMailTemplate,
  mailer,
  mailerOptions,
} from "~/mailer.server";

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
          const [profile, organization] = await prismaClient.$transaction([
            prismaClient.profile.findFirst({
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
              where: {
                id: sessionUser.id,
              },
            }),
            prismaClient.organization.findFirst({
              select: {
                id: true,
                name: true,
                teamMembers: {
                  select: {
                    profileId: true,
                  },
                },
                admins: {
                  select: {
                    profile: {
                      select: {
                        id: true,
                        firstName: true,
                        email: true,
                      },
                    },
                  },
                },
              },
              where: {
                id: data.organizationId,
              },
            }),
          ]);

          invariantResponse(
            organization !== null,
            locales.route.error.notFound,
            {
              status: 404,
            }
          );
          invariantResponse(
            organization.teamMembers.every((relation) => {
              return relation.profileId !== sessionUser.id;
            }) &&
              organization.admins.every((relation) => {
                return relation.profile.id !== sessionUser.id;
              }),
            locales.route.error.alreadyMember,
            { status: 403 }
          );
          invariantResponse(profile !== null, locales.route.error.notFound, {
            status: 404,
          });

          try {
            await prismaClient.requestToOrganizationToAddProfile.upsert({
              where: {
                profileId_organizationId: {
                  profileId: sessionUser.id,
                  organizationId: data.organizationId,
                },
              },
              create: {
                profileId: sessionUser.id,
                organizationId: data.organizationId,
                status:
                  intent === "createOrganizationMemberRequest"
                    ? "pending"
                    : "canceled",
              },
              update: {
                status:
                  intent === "createOrganizationMemberRequest"
                    ? "pending"
                    : "canceled",
              },
            });

            await Promise.all(
              organization.admins.map(async (admin) => {
                const sender = process.env.SYSTEM_MAIL_SENDER;
                const subject =
                  intent === "createOrganizationMemberRequest"
                    ? locales.route.requestOrganizationMembership.email.subject
                        .requested
                    : locales.route.requestOrganizationMembership.email.subject
                        .canceled;
                const recipient = admin.profile.email;

                const text =
                  intent === "createOrganizationMemberRequest"
                    ? getCompiledMailTemplate<"mail-templates/requests/organization-to-add-profile/text.hbs">(
                        "mail-templates/requests/organization-to-add-profile/text.hbs",
                        {
                          firstName: admin.profile.firstName,
                          profile: {
                            firstName: profile.firstName,
                            lastName: profile.lastName,
                          },
                          organization: {
                            name: organization.name,
                          },
                          button: {
                            url: `${process.env.COMMUNITY_BASE_URL}/my/organizations`,
                            text: locales.route.requestOrganizationMembership
                              .email.button.text,
                          },
                        },
                        "text"
                      )
                    : getCompiledMailTemplate<"mail-templates/requests/organization-to-add-profile/canceled-text.hbs">(
                        "mail-templates/requests/organization-to-add-profile/canceled-text.hbs",
                        {
                          firstName: admin.profile.firstName,
                          profile: {
                            firstName: profile.firstName,
                            lastName: profile.lastName,
                          },
                          organization: {
                            name: organization.name,
                          },
                        },
                        "text"
                      );
                const html =
                  intent === "createOrganizationMemberRequest"
                    ? getCompiledMailTemplate<"mail-templates/requests/organization-to-add-profile/html.hbs">(
                        "mail-templates/requests/organization-to-add-profile/html.hbs",
                        {
                          firstName: admin.profile.firstName,
                          profile: {
                            firstName: profile.firstName,
                            lastName: profile.lastName,
                          },
                          organization: {
                            name: organization.name,
                          },
                          button: {
                            url: `${process.env.COMMUNITY_BASE_URL}/my/organizations`,
                            text: locales.route.requestOrganizationMembership
                              .email.button.text,
                          },
                        },
                        "html"
                      )
                    : getCompiledMailTemplate<"mail-templates/requests/organization-to-add-profile/canceled-html.hbs">(
                        "mail-templates/requests/organization-to-add-profile/canceled-html.hbs",
                        {
                          firstName: admin.profile.firstName,
                          profile: {
                            firstName: profile.firstName,
                            lastName: profile.lastName,
                          },
                          organization: {
                            name: organization.name,
                          },
                        },
                        "html"
                      );

                try {
                  await mailer(
                    mailerOptions,
                    sender,
                    recipient,
                    subject,
                    text,
                    html
                  );
                } catch (error) {
                  Sentry.captureException(error);
                  ctx.addIssue({
                    code: "custom",
                    message:
                      intent === "createOrganizationMemberRequest"
                        ? locales.route.error.requestFailed
                        : locales.route.error.cancelRequestFailed,
                  });
                  return z.NEVER;
                }
              })
            );
          } catch (error) {
            Sentry.captureException(error);
            ctx.addIssue({
              code: "custom",
              message:
                intent === "createOrganizationMemberRequest"
                  ? locales.route.error.requestFailed
                  : locales.route.error.cancelRequestFailed,
            });
            return z.NEVER;
          }
          return { ...data, name: organization.name };
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
          name: submission.value.name,
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
        const invite =
          await prismaClient.inviteForProfileToJoinOrganization.findFirst({
            select: {
              organization: {
                select: {
                  id: true,
                  name: true,
                  admins: {
                    select: {
                      profile: {
                        select: {
                          id: true,
                          firstName: true,
                          email: true,
                        },
                      },
                    },
                  },
                  teamMembers: {
                    select: {
                      profileId: true,
                    },
                  },
                },
              },
              profile: {
                select: {
                  firstName: true,
                  lastName: true,
                },
              },
            },
            where: {
              profileId: sessionUser.id,
              organizationId: data.organizationId,
              role: data.role,
              status: "pending",
            },
          });
        invariantResponse(invite !== null, locales.route.error.notFound, {
          status: 404,
        });
        try {
          await prismaClient.inviteForProfileToJoinOrganization.update({
            where: {
              profileId_organizationId_role: {
                profileId: sessionUser.id,
                organizationId: data.organizationId,
                role: data.role,
              },
            },
            data: {
              status:
                intent === "acceptOrganizationMemberInvite"
                  ? "accepted"
                  : "rejected",
            },
          });
          if (intent === "acceptOrganizationMemberInvite") {
            const correspondingPendingRequest =
              await prismaClient.requestToOrganizationToAddProfile.findFirst({
                select: {
                  profileId: true,
                  organizationId: true,
                },
                where: {
                  profileId: sessionUser.id,
                  organizationId: data.organizationId,
                  status: "pending",
                },
              });
            if (correspondingPendingRequest !== null) {
              await prismaClient.requestToOrganizationToAddProfile.update({
                where: {
                  profileId_organizationId: {
                    profileId: sessionUser.id,
                    organizationId: data.organizationId,
                  },
                },
                data: {
                  status: "accepted",
                },
              });
            }
            if (
              data.role === "admin" &&
              invite.organization.admins.every((relation) => {
                return relation.profile.id !== sessionUser.id;
              })
            ) {
              await prismaClient.adminOfOrganization.create({
                data: {
                  organizationId: data.organizationId,
                  profileId: sessionUser.id,
                },
              });
            }
            if (
              data.role === "member" &&
              invite.organization.teamMembers.every((relation) => {
                return relation.profileId !== sessionUser.id;
              })
            ) {
              await prismaClient.memberOfOrganization.create({
                data: {
                  organizationId: data.organizationId,
                  profileId: sessionUser.id,
                },
              });
            }
          } else {
            await prismaClient.inviteForProfileToJoinOrganization.update({
              where: {
                profileId_organizationId_role: {
                  profileId: sessionUser.id,
                  organizationId: data.organizationId,
                  role: data.role,
                },
              },
              data: {
                status: "rejected",
              },
            });
          }

          await Promise.all(
            invite.organization.admins.map(async (admin) => {
              const sender = process.env.SYSTEM_MAIL_SENDER;
              const subject =
                intent === "acceptOrganizationMemberInvite"
                  ? locales.route.organizationMemberInvites.email.subject
                      .accepted
                  : locales.route.organizationMemberInvites.email.subject
                      .rejected;
              const recipient = admin.profile.email;

              const text =
                intent === "acceptOrganizationMemberInvite"
                  ? data.role === "member"
                    ? getCompiledMailTemplate<"mail-templates/invites/profile-to-join-organization/accepted-text.hbs">(
                        "mail-templates/invites/profile-to-join-organization/accepted-text.hbs",
                        {
                          firstName: admin.profile.firstName,
                          profile: {
                            firstName: invite.profile.firstName,
                            lastName: invite.profile.lastName,
                          },
                          organization: {
                            name: invite.organization.name,
                          },
                        },
                        "text"
                      )
                    : getCompiledMailTemplate<"mail-templates/invites/profile-to-join-organization/as-admin-accepted-text.hbs">(
                        "mail-templates/invites/profile-to-join-organization/as-admin-accepted-text.hbs",
                        {
                          firstName: admin.profile.firstName,
                          profile: {
                            firstName: invite.profile.firstName,
                            lastName: invite.profile.lastName,
                          },
                          organization: {
                            name: invite.organization.name,
                          },
                        },
                        "text"
                      )
                  : data.role === "member"
                  ? getCompiledMailTemplate<"mail-templates/invites/profile-to-join-organization/rejected-text.hbs">(
                      "mail-templates/invites/profile-to-join-organization/rejected-text.hbs",
                      {
                        firstName: admin.profile.firstName,
                        profile: {
                          firstName: invite.profile.firstName,
                          lastName: invite.profile.lastName,
                        },
                        organization: {
                          name: invite.organization.name,
                        },
                      },
                      "text"
                    )
                  : getCompiledMailTemplate<"mail-templates/invites/profile-to-join-organization/as-admin-rejected-text.hbs">(
                      "mail-templates/invites/profile-to-join-organization/as-admin-rejected-text.hbs",
                      {
                        firstName: admin.profile.firstName,
                        profile: {
                          firstName: invite.profile.firstName,
                          lastName: invite.profile.lastName,
                        },
                        organization: {
                          name: invite.organization.name,
                        },
                      },
                      "text"
                    );
              const html =
                intent === "acceptOrganizationMemberInvite"
                  ? data.role === "member"
                    ? getCompiledMailTemplate<"mail-templates/invites/profile-to-join-organization/accepted-html.hbs">(
                        "mail-templates/invites/profile-to-join-organization/accepted-html.hbs",
                        {
                          firstName: admin.profile.firstName,
                          profile: {
                            firstName: invite.profile.firstName,
                            lastName: invite.profile.lastName,
                          },
                          organization: {
                            name: invite.organization.name,
                          },
                        },
                        "html"
                      )
                    : getCompiledMailTemplate<"mail-templates/invites/profile-to-join-organization/as-admin-accepted-html.hbs">(
                        "mail-templates/invites/profile-to-join-organization/as-admin-accepted-html.hbs",
                        {
                          firstName: admin.profile.firstName,
                          profile: {
                            firstName: invite.profile.firstName,
                            lastName: invite.profile.lastName,
                          },
                          organization: {
                            name: invite.organization.name,
                          },
                        },
                        "html"
                      )
                  : data.role === "member"
                  ? getCompiledMailTemplate<"mail-templates/invites/profile-to-join-organization/rejected-html.hbs">(
                      "mail-templates/invites/profile-to-join-organization/rejected-html.hbs",
                      {
                        firstName: admin.profile.firstName,
                        profile: {
                          firstName: invite.profile.firstName,
                          lastName: invite.profile.lastName,
                        },
                        organization: {
                          name: invite.organization.name,
                        },
                      },
                      "html"
                    )
                  : getCompiledMailTemplate<"mail-templates/invites/profile-to-join-organization/as-admin-rejected-html.hbs">(
                      "mail-templates/invites/profile-to-join-organization/as-admin-rejected-html.hbs",
                      {
                        firstName: admin.profile.firstName,
                        profile: {
                          firstName: invite.profile.firstName,
                          lastName: invite.profile.lastName,
                        },
                        organization: {
                          name: invite.organization.name,
                        },
                      },
                      "html"
                    );

              try {
                await mailer(
                  mailerOptions,
                  sender,
                  recipient,
                  subject,
                  text,
                  html
                );
              } catch (error) {
                Sentry.captureException(error);
                ctx.addIssue({
                  code: "custom",
                  message:
                    intent === "acceptOrganizationMemberInvite"
                      ? locales.route.error.acceptInviteFailed
                      : locales.route.error.rejectInviteFailed,
                });
                return z.NEVER;
              }
            })
          );
        } catch (error) {
          Sentry.captureException(error);
          ctx.addIssue({
            code: "custom",
            message:
              intent === "acceptOrganizationMemberInvite"
                ? locales.route.error.acceptInviteFailed
                : locales.route.error.rejectInviteFailed,
          });
          return z.NEVER;
        }

        return { ...data, name: invite.organization.name };
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
          ? submission.value.role === "admin"
            ? locales.route.organizationMemberInvites.adminAccepted
            : locales.route.organizationMemberInvites.memberAccepted
          : locales.route.organizationMemberInvites.rejected,
        {
          name: submission.value.name,
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
        const invite =
          await prismaClient.inviteForOrganizationToJoinNetwork.findFirst({
            select: {
              organization: {
                select: {
                  id: true,
                  name: true,
                  admins: {
                    select: {
                      profileId: true,
                    },
                  },
                },
              },
              network: {
                select: {
                  name: true,
                  networkMembers: {
                    select: {
                      networkMemberId: true,
                    },
                  },
                  admins: {
                    select: {
                      profile: {
                        select: {
                          id: true,
                          firstName: true,
                          email: true,
                        },
                      },
                    },
                  },
                },
              },
            },
            where: {
              networkId: data.networkId,
              organizationId: data.organizationId,
              status: "pending",
            },
          });
        invariantResponse(invite !== null, locales.route.error.notFound, {
          status: 404,
        });
        invariantResponse(
          invite.organization.admins.some((relation) => {
            return relation.profileId === sessionUser.id;
          }),
          locales.route.error.notAdmin,
          {
            status: 403,
          }
        );
        try {
          await prismaClient.inviteForOrganizationToJoinNetwork.update({
            where: {
              organizationId_networkId: {
                organizationId: data.organizationId,
                networkId: data.networkId,
              },
            },
            data: {
              status:
                intent === "acceptNetworkInvite" ? "accepted" : "rejected",
            },
          });
          if (intent === "acceptNetworkInvite") {
            const correspondingPendingRequest =
              await prismaClient.requestToNetworkToAddOrganization.findFirst({
                select: {
                  networkId: true,
                  organizationId: true,
                },
                where: {
                  networkId: data.networkId,
                  organizationId: data.organizationId,
                  status: "pending",
                },
              });
            if (correspondingPendingRequest !== null) {
              await prismaClient.requestToNetworkToAddOrganization.update({
                where: {
                  networkId_organizationId: {
                    networkId: data.networkId,
                    organizationId: data.organizationId,
                  },
                },
                data: {
                  status: "accepted",
                },
              });
            }
            if (
              invite.network.networkMembers.every((relation) => {
                return relation.networkMemberId !== data.organizationId;
              })
            ) {
              await prismaClient.memberOfNetwork.create({
                data: {
                  networkId: data.networkId,
                  networkMemberId: data.organizationId,
                },
              });
            }
          } else {
            await prismaClient.inviteForOrganizationToJoinNetwork.update({
              where: {
                organizationId_networkId: {
                  organizationId: data.organizationId,
                  networkId: data.networkId,
                },
              },
              data: {
                status: "rejected",
              },
            });
          }

          await Promise.all(
            invite.network.admins.map(async (admin) => {
              const sender = process.env.SYSTEM_MAIL_SENDER;
              const subject =
                intent === "acceptNetworkInvite"
                  ? locales.route.networkInvites.email.subject.accepted
                  : locales.route.networkInvites.email.subject.rejected;
              const recipient = admin.profile.email;

              const text =
                intent === "acceptNetworkInvite"
                  ? getCompiledMailTemplate<"mail-templates/invites/organization-to-join-network/accepted-text.hbs">(
                      "mail-templates/invites/organization-to-join-network/accepted-text.hbs",
                      {
                        firstName: admin.profile.firstName,
                        organization: {
                          name: invite.organization.name,
                        },
                        network: {
                          name: invite.network.name,
                        },
                      },
                      "text"
                    )
                  : getCompiledMailTemplate<"mail-templates/invites/organization-to-join-network/rejected-text.hbs">(
                      "mail-templates/invites/organization-to-join-network/rejected-text.hbs",
                      {
                        firstName: admin.profile.firstName,
                        organization: {
                          name: invite.organization.name,
                        },
                        network: {
                          name: invite.network.name,
                        },
                      },
                      "text"
                    );
              const html =
                intent === "acceptNetworkInvite"
                  ? getCompiledMailTemplate<"mail-templates/invites/organization-to-join-network/accepted-html.hbs">(
                      "mail-templates/invites/organization-to-join-network/accepted-html.hbs",
                      {
                        firstName: admin.profile.firstName,
                        organization: {
                          name: invite.organization.name,
                        },
                        network: {
                          name: invite.network.name,
                        },
                      },
                      "html"
                    )
                  : getCompiledMailTemplate<"mail-templates/invites/organization-to-join-network/rejected-html.hbs">(
                      "mail-templates/invites/organization-to-join-network/rejected-html.hbs",
                      {
                        firstName: admin.profile.firstName,
                        organization: {
                          name: invite.organization.name,
                        },
                        network: {
                          name: invite.network.name,
                        },
                      },
                      "html"
                    );

              try {
                await mailer(
                  mailerOptions,
                  sender,
                  recipient,
                  subject,
                  text,
                  html
                );
              } catch (error) {
                Sentry.captureException(error);
                ctx.addIssue({
                  code: "custom",
                  message:
                    intent === "acceptNetworkInvite"
                      ? locales.route.error.acceptInviteFailed
                      : locales.route.error.rejectInviteFailed,
                });
                return z.NEVER;
              }
            })
          );
        } catch (error) {
          Sentry.captureException(error);
          ctx.addIssue({
            code: "custom",
            message:
              intent === "acceptNetworkInvite"
                ? locales.route.error.acceptInviteFailed
                : locales.route.error.rejectInviteFailed,
          });
          return z.NEVER;
        }

        return {
          ...data,
          organizationName: invite.organization.name,
          networkName: invite.network.name,
        };
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
          organizationName: submission.value.organizationName,
          networkName: submission.value.networkName,
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
          // organization id and profile id from form data
          // Check if the session user is admin of the organization id
          // Get the request with those ids
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
        // organization id and network id from form data
        // Check if the session user is admin of the network id
        // Get the request with those ids
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
        // Check if the session user is last admin or team member of the organization
        // If so, return custom issue -> locales.route.quit.lastAdminOrTeamMember
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
      id: "quit-organization-toast",
      key: `${new Date().getTime()}`,
      message: insertParametersIntoLocale(locales.route.quit.success, {
        name: "TODO: organization name from database",
      }),
    },
  };
}
