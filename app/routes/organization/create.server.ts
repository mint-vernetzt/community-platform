import { parseWithZod } from "@conform-to/zod-v1";
import { type User, type SupabaseClient } from "@supabase/supabase-js";
import { type supportedCookieLanguages } from "~/i18n.shared";
import { BlurFactor, getImageURL, ImageSizes } from "~/images.server";
import { DefaultImages } from "~/images.shared";
import { type ArrayElement } from "~/lib/utils/types";
import { type languageModuleMap } from "~/locales/.server";
import { prismaClient } from "~/prisma.server";
import { getPublicURL } from "~/storage.server";
import { createOrganizationMemberRequestSchema, createSchema } from "./create";
import { invariantResponse } from "~/lib/utils/response";
import {
  getCompiledMailTemplate,
  mailer,
  mailerOptions,
} from "~/mailer.server";
import { z } from "zod";
import { insertParametersIntoLocale } from "~/lib/utils/i18n";
import * as Sentry from "@sentry/node";

export type CreateOrganizationLocales = (typeof languageModuleMap)[ArrayElement<
  typeof supportedCookieLanguages
>]["organization/create"];

export async function createOrganizationOnProfile(
  profileId: string,
  submissionValues: {
    organizationName: string;
    networkTypes: string[];
    organizationTypes: string[];
  },
  organizationSlug: string
) {
  const { organizationName, networkTypes, organizationTypes } =
    submissionValues;
  const [profile] = await prismaClient.$transaction([
    prismaClient.profile.update({
      where: {
        id: profileId,
      },
      data: {
        memberOf: {
          create: {
            organization: {
              create: {
                name: organizationName,
                slug: organizationSlug,
                types: {
                  create: organizationTypes.map((typeId) => ({
                    organizationType: {
                      connect: {
                        id: typeId,
                      },
                    },
                  })),
                },
                networkTypes: {
                  create: networkTypes.map((typeId) => ({
                    networkType: {
                      connect: {
                        id: typeId,
                      },
                    },
                  })),
                },
                organizationVisibility: {
                  create: {},
                },
              },
            },
          },
        },
      },
    }),
    prismaClient.organization.update({
      where: {
        slug: organizationSlug,
      },
      data: {
        admins: {
          create: {
            profileId: profileId,
          },
        },
      },
    }),
  ]);
  return profile;
}

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

export async function getPendingRequestsToOrganizations(
  profileId: string,
  authClient: SupabaseClient
) {
  const requests = (
    await prismaClient.requestToOrganizationToAddProfile.findMany({
      where: {
        profileId,
        status: "pending",
      },
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
                    slug: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })
  ).map((relation) => {
    return relation.organization;
  });

  const enhancedRequests = requests.map((request) => {
    let logo = request.logo;
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
      ...request,
      logo,
      blurredLogo,
    };
  });

  return enhancedRequests;
}

export async function getAllOrganizationTypes() {
  const allOrganizationTypes = await prismaClient.organizationType.findMany({
    select: {
      id: true,
      slug: true,
    },
  });
  return allOrganizationTypes;
}

export async function getAllNetworkTypes() {
  const allNetworkTypes = await prismaClient.networkType.findMany({
    select: {
      id: true,
      slug: true,
    },
  });
  return allNetworkTypes;
}

export async function getOrganizationTypesWithSlugs() {
  const organizationTypeNetwork = await prismaClient.organizationType.findFirst(
    {
      select: {
        id: true,
      },
      where: {
        slug: "network",
      },
    }
  );
  return organizationTypeNetwork;
}

export async function createOrganizationMemberRequest(options: {
  formData: FormData;
  locales: CreateOrganizationLocales;
  sessionUser: User;
}) {
  const { formData, locales, sessionUser } = options;
  const submission = await parseWithZod(formData, {
    schema: () =>
      createOrganizationMemberRequestSchema.transform(async (data, ctx) => {
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

        invariantResponse(organization !== null, locales.route.error.notFound, {
          status: 404,
        });
        invariantResponse(
          organization.teamMembers.every((relation) => {
            return relation.profileId !== sessionUser.id;
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
              status: "pending",
            },
            update: {
              status: "pending",
            },
          });

          await Promise.all(
            organization.admins.map(async (admin) => {
              const sender = process.env.SYSTEM_MAIL_SENDER;
              const subject =
                locales.route.form.organizationName
                  .requestOrganizationMembership.email.subject.requested;
              const recipient = admin.profile.email;

              const text =
                getCompiledMailTemplate<"mail-templates/requests/organization-to-add-profile/text.hbs">(
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
                      text: locales.route.form.organizationName
                        .requestOrganizationMembership.email.button.text,
                    },
                  },
                  "text"
                );
              const html =
                getCompiledMailTemplate<"mail-templates/requests/organization-to-add-profile/html.hbs">(
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
                      text: locales.route.form.organizationName
                        .requestOrganizationMembership.email.button.text,
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
                  message: locales.route.error.requestFailed,
                });
                return z.NEVER;
              }
            })
          );
        } catch (error) {
          Sentry.captureException(error);
          ctx.addIssue({
            code: "custom",
            message: locales.route.error.requestFailed,
          });
          return z.NEVER;
        }
        return { ...data, name: organization.name };
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
      id: "create-organization-member-request-toast",
      key: `${new Date().getTime()}`,
      message: insertParametersIntoLocale(
        locales.route.form.organizationName.requestOrganizationMembership
          .createOrganizationMemberRequest,
        {
          name: submission.value.name,
        }
      ),
    },
  };
}

export async function createOrganization(options: {
  formData: FormData;
  locales: CreateOrganizationLocales;
  sessionUser: User;
}) {
  const { formData, locales, sessionUser } = options;

  // TODO: Same structure as above
  const submission = parseWithZod(formData, { schema: createSchema(locales) });

  if (submission.status !== "success") {
    return {
      submission: submission.reply(),
    };
  }

  const { organizationName } = submission.value;

  const slug = generateOrganizationSlug(organizationName);
  const organizationTypeNetwork = await getOrganizationTypeNetwork();
  invariantResponse(
    organizationTypeNetwork !== null,
    locales.route.validation.organizationTypeNetworkNotFound,
    { status: 404 }
  );
  const isNetwork = submission.value.organizationTypes.some(
    (id) => id === organizationTypeNetwork.id
  );
  invariantResponse(
    (isNetwork === false && submission.value.networkTypes.length > 0) === false,
    locales.route.validation.notANetwork,
    { status: 400 }
  );
  if (isNetwork === true && submission.value.networkTypes.length === 0) {
    const newSubmission = parseWithZod(formData, {
      schema: () =>
        createSchema(locales).transform(async (data, ctx) => {
          ctx.addIssue({
            code: "custom",
            message: locales.route.validation.networkTypesRequired,
            path: ["networkTypes"],
          });
          return z.NEVER;
        }),
    });
    return {
      submission: newSubmission.reply(),
      currentTimestamp: Date.now(),
    };
  }
  await createOrganizationOnProfile(sessionUser.id, submission.value, slug);
}
