import { parseWithZod } from "@conform-to/zod-v1";
import { type User, type SupabaseClient } from "@supabase/supabase-js";
import { type supportedCookieLanguages } from "~/i18n.shared";
import { BlurFactor, getImageURL, ImageSizes } from "~/images.server";
import { type ArrayElement } from "~/lib/utils/types";
import { type languageModuleMap } from "~/locales/.server";
import { prismaClient } from "~/prisma.server";
import { getPublicURL } from "~/storage.server";
import {
  createOrganizationMemberRequestSchema,
  createOrganizationSchema,
} from "./create";
import { invariantResponse } from "~/lib/utils/response";
import {
  getCompiledMailTemplate,
  mailer,
  mailerOptions,
} from "~/mailer.server";
import { z } from "zod";
import { insertParametersIntoLocale } from "~/lib/utils/i18n";
import * as Sentry from "@sentry/node";
import { generateOrganizationSlug } from "~/utils.server";

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
  const organizations = await prismaClient.organization.findMany({
    select: {
      id: true,
      slug: true,
      name: true,
      bio: true,
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
  });

  return organizations;
}

export function addImageUrlToOrganizations(
  authClient: SupabaseClient,
  organizations: Awaited<ReturnType<typeof getOrganizationsFromProfile>>
) {
  const enhancedOrganizations = organizations.map((organization) => {
    let logo = organization.logo;
    let blurredLogo;

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
    return {
      ...organization,
      logo,
      blurredLogo,
    };
  });

  return enhancedOrganizations;
}

export function flattenOrganizationRelations(
  organizations: Awaited<ReturnType<typeof getOrganizationsFromProfile>>
) {
  const flattendOrganizations = organizations.map((organization) => {
    return {
      ...organization,
      types: organization.types.map((relation) => {
        return relation.organizationType.slug;
      }),
    };
  });

  return flattendOrganizations;
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
    alert: undefined,
  };
}

export async function createOrganization(options: {
  formData: FormData;
  locales: CreateOrganizationLocales;
  sessionUser: User;
}) {
  const { formData, locales, sessionUser } = options;

  // TODO: Same structure as above
  const submission = await parseWithZod(formData, {
    schema: () =>
      createOrganizationSchema(locales).transform(async (data, ctx) => {
        const organizationTypeNetwork =
          await prismaClient.organizationType.findFirst({
            select: {
              id: true,
            },
            where: {
              slug: "network",
            },
          });
        invariantResponse(
          organizationTypeNetwork !== null,
          locales.route.validation.organizationTypeNetworkNotFound,
          { status: 404 }
        );
        const isNetwork = data.organizationTypes.some(
          (id) => id === organizationTypeNetwork.id
        );
        invariantResponse(
          (isNetwork === false && data.networkTypes.length > 0) === false,
          locales.route.validation.notANetwork,
          { status: 400 }
        );
        if (isNetwork === true && data.networkTypes.length === 0) {
          ctx.addIssue({
            code: "custom",
            message: locales.route.validation.networkTypesRequired,
            path: ["networkTypes"],
          });
          return z.NEVER;
        }
        const slug = generateOrganizationSlug(data.organizationName);
        try {
          await createOrganizationOnProfile(sessionUser.id, data, slug);
        } catch (error) {
          Sentry.captureException(error);
          ctx.addIssue({
            code: "custom",
            message: locales.route.error.requestFailed,
          });
          return z.NEVER;
        }
        return { ...data, slug };
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
    redirectUrl: `/organization/${submission.value.slug}/detail/about`,
    alert: {
      message: insertParametersIntoLocale(locales.route.successAlert, {
        name: submission.value.organizationName,
        slug: submission.value.slug,
      }),
      isRichtext: true,
    },
    toast: undefined,
  };
}
