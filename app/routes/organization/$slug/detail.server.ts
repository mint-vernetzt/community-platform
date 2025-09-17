import { type SupabaseClient } from "@supabase/supabase-js";
import { BlurFactor, getImageURL, ImageSizes } from "~/images.server";
import { filterOrganizationByVisibility } from "~/next-public-fields-filtering.server";
import { prismaClient } from "~/prisma.server";
import { getPublicURL, uploadFileToStorage } from "~/storage.server";
import { type SUPPORTED_COOKIE_LANGUAGES } from "~/i18n.shared";
import { type ArrayElement } from "~/lib/utils/types";
import { type languageModuleMap } from "~/locales/.server";
import { parseWithZod } from "@conform-to/zod-v1";
import {
  createImageUploadSchema,
  disconnectImageSchema,
} from "~/components/ImageCropper/ImageCropper";
import { captureException } from "@sentry/node";
import { FILE_FIELD_NAME } from "~/storage.shared";
import { z } from "zod";
import { insertParametersIntoLocale } from "~/lib/utils/i18n";
import { DefaultImages } from "~/images.shared";
import { triggerEntityScore } from "~/utils.server";
import { CLAIM_REQUEST_INTENTS, claimRequestSchema } from "./detail.shared";
import { invariantResponse } from "~/lib/utils/response";
import {
  getCompiledMailTemplate,
  mailer,
  mailerOptions,
} from "~/mailer.server";

export type OrganizationDetailLocales = (typeof languageModuleMap)[ArrayElement<
  typeof SUPPORTED_COOKIE_LANGUAGES
>]["organization/$slug/detail"];

export async function getOrganization(slug: string) {
  const organization = await prismaClient.organization.findUnique({
    select: {
      id: true,
      slug: true,
      name: true,
      bio: true,
      background: true,
      logo: true,
      email: true,
      phone: true,
      website: true,
      city: true,
      street: true,
      streetNumber: true,
      zipCode: true,
      facebook: true,
      linkedin: true,
      twitter: true,
      xing: true,
      instagram: true,
      youtube: true,
      mastodon: true,
      tiktok: true,
      supportedBy: true,
      shadow: true,
      types: {
        select: {
          organizationType: {
            select: {
              slug: true,
            },
          },
        },
      },
      networkTypes: {
        select: {
          networkType: {
            select: {
              slug: true,
            },
          },
        },
      },
      networkMembers: {
        select: {
          networkMember: {
            select: {
              id: true,
              slug: true,
              logo: true,
              name: true,
              organizationVisibility: {
                select: {
                  id: true,
                  slug: true,
                  logo: true,
                  name: true,
                },
              },
            },
          },
        },
      },
      _count: {
        select: {
          areas: true,
          focuses: true,
          networkMembers: true,
          memberOf: true,
          teamMembers: true,
          responsibleForEvents: {
            where: {
              event: {
                published: true,
              },
            },
          },
          responsibleForProject: {
            where: {
              project: {
                published: true,
              },
            },
          },
        },
      },
      organizationVisibility: {
        select: {
          name: true,
          slug: true,
          bio: true,
          background: true,
          logo: true,
          email: true,
          phone: true,
          website: true,
          city: true,
          street: true,
          streetNumber: true,
          zipCode: true,
          facebook: true,
          linkedin: true,
          twitter: true,
          xing: true,
          instagram: true,
          youtube: true,
          mastodon: true,
          tiktok: true,
          supportedBy: true,
          shadow: true,
          types: true,
          networkTypes: true,
          networkMembers: true,
        },
      },
    },
    where: {
      slug: slug,
    },
  });
  return organization;
}

export function filterOrganization(
  organization: NonNullable<Awaited<ReturnType<typeof getOrganization>>>
) {
  const filteredOrganization =
    filterOrganizationByVisibility<typeof organization>(organization);
  const networkMembers = filteredOrganization.networkMembers.map((relation) => {
    const filteredNetworkMember = filterOrganizationByVisibility<
      typeof relation.networkMember
    >(relation.networkMember);
    return {
      ...relation,
      networkMember: filteredNetworkMember,
    };
  });
  return {
    ...filteredOrganization,
    networkMembers,
  };
}

export function addImgUrls(
  authClient: SupabaseClient,
  organization: NonNullable<Awaited<ReturnType<typeof getOrganization>>>
) {
  let background = organization.background;
  let blurredBackground;
  if (background !== null) {
    const publicURL = getPublicURL(authClient, background);
    background = getImageURL(publicURL, {
      resize: { type: "fill", ...ImageSizes.Organization.Detail.Background },
    });
    blurredBackground = getImageURL(publicURL, {
      resize: {
        type: "fill",
        ...ImageSizes.Organization.Detail.BlurredBackground,
      },
      blur: BlurFactor,
    });
  } else {
    background = DefaultImages.Organization.Background;
    blurredBackground = DefaultImages.Organization.BlurredBackground;
  }

  let logo = organization.logo;
  let blurredLogo;
  if (logo !== null) {
    const publicURL = getPublicURL(authClient, logo);
    logo = getImageURL(publicURL, {
      resize: { type: "fill", ...ImageSizes.Organization.Detail.Logo },
    });
    blurredLogo = getImageURL(publicURL, {
      resize: { type: "fill", ...ImageSizes.Organization.Detail.BlurredLogo },
      blur: BlurFactor,
    });
  }
  const networkMembers = organization.networkMembers.map((relation) => {
    let logo = relation.networkMember.logo;
    let blurredLogo;
    if (logo !== null) {
      const publicURL = getPublicURL(authClient, logo);
      logo = getImageURL(publicURL, {
        resize: { type: "fill", ...ImageSizes.Organization.Detail.NetworkLogo },
      });
      blurredLogo = getImageURL(publicURL, {
        resize: {
          type: "fill",
          ...ImageSizes.Organization.Detail.BlurredNetworkLogo,
        },
        blur: BlurFactor,
      });
    }
    return {
      ...relation,
      networkMember: {
        ...relation.networkMember,
        logo,
        blurredLogo,
      },
    };
  });
  return {
    ...organization,
    networkMembers,
    background,
    blurredBackground,
    logo,
    blurredLogo,
  };
}

export async function uploadImage(options: {
  request: Request;
  formData: FormData;
  authClient: SupabaseClient;
  slug: string;
  locales: OrganizationDetailLocales;
}) {
  const { request, formData, authClient, slug, locales } = options;
  const submission = await parseWithZod(formData, {
    schema: createImageUploadSchema(locales).transform(async (data, ctx) => {
      const { file, bucket, uploadKey } = data;
      const { fileMetadataForDatabase, error } = await uploadFileToStorage({
        file,
        authClient,
        bucket,
      });
      if (error !== null) {
        console.error({ error });
        captureException(error);
        ctx.addIssue({
          code: "custom",
          message: locales.route.error.onStoring,
          path: [FILE_FIELD_NAME],
        });
        return z.NEVER;
      }
      if (uploadKey !== "background" && uploadKey !== "logo") {
        ctx.addIssue({
          code: "custom",
          message: locales.route.error.onStoring,
          path: [FILE_FIELD_NAME],
        });
        return z.NEVER;
      }
      try {
        const organization = await prismaClient.organization.update({
          where: {
            slug,
          },
          data: {
            [uploadKey]: fileMetadataForDatabase.path,
          },
          select: {
            id: true,
          },
        });
        triggerEntityScore({
          entity: "organization",
          where: { id: organization.id },
        });
      } catch (error) {
        console.error({ error });
        captureException(error);
        ctx.addIssue({
          code: "custom",
          message: locales.route.error.onStoring,
          path: [FILE_FIELD_NAME],
        });
        return z.NEVER;
      }

      return { ...data, uploadKey: uploadKey };
    }),
    async: true,
  });

  if (submission.status !== "success") {
    return { submission, toast: null, redirectUrl: null };
  }

  // Close modal after redirect
  const redirectUrl = new URL(request.url);
  redirectUrl.searchParams.delete(`modal-${submission.value.uploadKey}`);
  return {
    submission: null,
    toast: {
      id: "change-image",
      key: `${new Date().getTime()}`,
      message: insertParametersIntoLocale(locales.upload.success.imageAdded, {
        imageType:
          locales.upload.success.imageTypes[submission.value.uploadKey],
      }),
    },
    redirectUrl: redirectUrl.toString(),
  };
}

export async function disconnectImage(options: {
  request: Request;
  formData: FormData;
  slug: string;
  locales: OrganizationDetailLocales;
}) {
  const { request, formData, slug, locales } = options;
  const submission = await parseWithZod(formData, {
    schema: disconnectImageSchema.transform(async (data, ctx) => {
      const { uploadKey } = data;
      try {
        if (uploadKey !== "background" && uploadKey !== "logo") {
          ctx.addIssue({
            code: "custom",
            message: locales.route.error.onStoring,
            path: [FILE_FIELD_NAME],
          });
          return z.NEVER;
        }
        const organization = await prismaClient.organization.update({
          where: {
            slug,
          },
          data: {
            [uploadKey]: null,
          },
          select: {
            id: true,
          },
        });
        triggerEntityScore({
          entity: "organization",
          where: { id: organization.id },
        });
      } catch (error) {
        console.error({ error });
        captureException(error);
        ctx.addIssue({
          code: "custom",
          message: locales.route.error.onStoring,
          path: [FILE_FIELD_NAME],
        });
        return z.NEVER;
      }

      return { ...data, uploadKey: uploadKey };
    }),
    async: true,
  });

  if (submission.status !== "success") {
    return { submission, toast: null, redirectUrl: null };
  }

  // Close modal after redirect
  const redirectUrl = new URL(request.url);
  redirectUrl.searchParams.delete(`modal-${submission.value.uploadKey}`);
  return {
    submission: null,
    toast: {
      id: "disconnect-image",
      key: `${new Date().getTime()}`,
      message: insertParametersIntoLocale(locales.upload.success.imageRemoved, {
        imageType:
          locales.upload.success.imageTypes[submission.value.uploadKey],
      }),
    },
    redirectUrl: redirectUrl.toString(),
  };
}

const claimRequestTimeouts = new Map<string, NodeJS.Timeout>();

export async function handleClaimRequest(options: {
  formData: FormData;
  sessionUserId: string;
  slug: string;
  locales: OrganizationDetailLocales;
}) {
  const { formData, sessionUserId, slug, locales } = options;
  const organization = await prismaClient.organization.findUnique({
    where: { slug, shadow: true },
    select: {
      id: true,
      name: true,
      slug: true,
      claimRequests: {
        select: {
          status: true,
        },
        where: {
          claimerId: sessionUserId,
        },
      },
    },
  });
  invariantResponse(organization !== null, locales.route.error.notShadow, {
    status: 400,
  });

  const submission = await parseWithZod(formData, {
    schema: claimRequestSchema.transform(async (data, ctx) => {
      if (data.intent === CLAIM_REQUEST_INTENTS.create) {
        if (
          organization.claimRequests.some(
            (claimRequest) =>
              claimRequest.status === "accepted" ||
              claimRequest.status === "open" ||
              claimRequest.status === "rejected"
          )
        ) {
          ctx.addIssue({
            code: "custom",
            message: locales.route.error.alreadyClaimed,
          });
        }
        await prismaClient.organizationClaimRequest.upsert({
          where: {
            claimerId_organizationId: {
              claimerId: sessionUserId,
              organizationId: organization.id,
            },
          },
          create: {
            claimerId: sessionUserId,
            organizationId: organization.id,
            status: "open",
          },
          update: {
            status: "open",
          },
        });
        // Send mail to support after delay
        const timeoutKey = `${sessionUserId}:${organization.id}`;
        const existingTimeout = claimRequestTimeouts.get(timeoutKey);
        if (typeof existingTimeout !== "undefined") {
          clearTimeout(existingTimeout);
        }
        const timeoutId = setTimeout(async () => {
          const openClaimRequest =
            await prismaClient.organizationClaimRequest.findFirst({
              where: {
                claimerId: sessionUserId,
                organizationId: organization.id,
                status: "open",
              },
            });
          if (openClaimRequest !== null) {
            const claimer = await prismaClient.profile.findUnique({
              where: { id: sessionUserId },
              select: {
                firstName: true,
                lastName: true,
                username: true,
              },
            });
            if (claimer === null) {
              console.error(
                `Claimer with id ${sessionUserId} not found when sending claim request mail`
              );
              captureException(
                new Error(
                  `Claimer with id ${sessionUserId} not found when sending claim request mail`
                )
              );
            } else {
              const sender = process.env.SYSTEM_MAIL_SENDER;
              const recipient = process.env.SUPPORT_MAIL;
              const subject = "Anfrage zur Übernahme einer Organisation";
              const textTemplatePath =
                "mail-templates/claim-organization/created-text.hbs";
              const htmlTemplatePath =
                "mail-templates/claim-organization/created-html.hbs";
              const content = {
                headline: "Anfrage zur Übernahme einer Organisation",
                claimer: {
                  firstName: claimer.firstName,
                  lastName: claimer.lastName,
                },
                organization: {
                  name: organization.name,
                },
                supportMail: process.env.SUPPORT_MAIL,
                profileButtonText: "Zum Personenprofil",
                profileButtonUrl: `${process.env.COMMUNITY_BASE_URL}/profile/${claimer.username}`,
                organizationButtonText: "Zum Organisationsprofil",
                organizationButtonUrl: `${process.env.COMMUNITY_BASE_URL}/organization/${organization.slug}/detail/about`,
              };

              const text = getCompiledMailTemplate<typeof textTemplatePath>(
                textTemplatePath,
                content,
                "text"
              );
              const html = getCompiledMailTemplate<typeof htmlTemplatePath>(
                htmlTemplatePath,
                content,
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
                console.error(
                  "Error sending mail: Create organization claim request",
                  error
                );
                captureException(error, {
                  data: "Error sending mail: Create organization claim request",
                });
              }
            }
          }
          claimRequestTimeouts.delete(timeoutKey);
        }, 60000);
        claimRequestTimeouts.set(timeoutKey, timeoutId);
      } else {
        if (
          organization.claimRequests.some(
            (claimRequest) =>
              claimRequest.status === "accepted" ||
              claimRequest.status === "withdrawn" ||
              claimRequest.status === "rejected"
          )
        ) {
          ctx.addIssue({
            code: "custom",
            message: locales.route.error.alreadyWithdrawn,
          });
        }
        await prismaClient.organizationClaimRequest.upsert({
          where: {
            claimerId_organizationId: {
              claimerId: sessionUserId,
              organizationId: organization.id,
            },
          },
          create: {
            claimerId: sessionUserId,
            organizationId: organization.id,
            status: "withdrawn",
          },
          update: {
            status: "withdrawn",
          },
        });
        const timeoutKey = `${sessionUserId}:${organization.id}`;
        const existingTimeout = claimRequestTimeouts.get(timeoutKey);
        if (typeof existingTimeout === "undefined") {
          const claimer = await prismaClient.profile.findUnique({
            where: { id: sessionUserId },
            select: {
              firstName: true,
              lastName: true,
              username: true,
            },
          });
          if (claimer === null) {
            console.error(
              `Claimer with id ${sessionUserId} not found when sending claim request mail`
            );
            captureException(
              new Error(
                `Claimer with id ${sessionUserId} not found when sending claim request mail`
              )
            );
          } else {
            const sender = process.env.SYSTEM_MAIL_SENDER;
            const recipient = process.env.SUPPORT_MAIL;
            const subject =
              "Anfrage zur Übernahme einer Organisation zurückgezogen";
            const textTemplatePath =
              "mail-templates/claim-organization/withdrawn-text.hbs";
            const htmlTemplatePath =
              "mail-templates/claim-organization/withdrawn-html.hbs";
            const content = {
              headline:
                "Anfrage zur Übernahme einer Organisation zurückgezogen",
              claimer: {
                firstName: claimer.firstName,
                lastName: claimer.lastName,
              },
              organization: {
                name: organization.name,
              },
              profileButtonUrl: `${process.env.COMMUNITY_BASE_URL}/profile/${claimer.username}`,
              organizationButtonUrl: `${process.env.COMMUNITY_BASE_URL}/organization/${organization.slug}/detail/about`,
            };

            const text = getCompiledMailTemplate<typeof textTemplatePath>(
              textTemplatePath,
              content,
              "text"
            );
            const html = getCompiledMailTemplate<typeof htmlTemplatePath>(
              htmlTemplatePath,
              content,
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
              console.error(
                "Error sending mail: Create organization claim request",
                error
              );
              captureException(error, {
                data: "Error sending mail: Create organization claim request",
              });
            }
          }
        }
      }
      return { ...data };
    }),
    async: true,
  });

  if (submission.status !== "success") {
    return { submission, toast: null, redirectUrl: null };
  }

  return {
    submission: null,
    toast: {
      id: "claim-request",
      key: `${new Date().getTime()}`,
      message:
        submission.value.intent === CLAIM_REQUEST_INTENTS.create
          ? locales.route.claimRequest.created.success
          : locales.route.claimRequest.withdrawn.success,
      level:
        submission.value.intent === CLAIM_REQUEST_INTENTS.create
          ? "positive"
          : "neutral",
    },
    redirectUrl: null,
  };
}
