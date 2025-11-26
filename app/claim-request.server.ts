import { parseWithZod } from "@conform-to/zod-v1";
import { invariantResponse } from "./lib/utils/response";
import { prismaClient } from "./prisma.server";
import { type OrganizationDetailLocales } from "./routes/organization/$slug/detail.server";
import { type CreateOrganizationLocales } from "./routes/organization/create.server";
import {
  CLAIM_REQUEST_INTENTS,
  claimRequestSchema,
} from "./claim-request.shared";
import {
  getCompiledMailTemplate,
  mailer,
  mailerOptions,
} from "~/mailer.server";
import { captureException } from "@sentry/node";
import { type MyOrganizationsLocales } from "./routes/my/organizations.server";
import { type ToastLevel } from "@mint-vernetzt/components/src/molecules/Toast";

const claimRequestTimeouts = new Map<string, NodeJS.Timeout>();

export async function handleClaimRequest(options: {
  formData: FormData;
  sessionUserId: string;
  slug: string;
  locales:
    | OrganizationDetailLocales
    | CreateOrganizationLocales
    | MyOrganizationsLocales;
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
              claimRequest.status === "rejected" ||
              claimRequest.status === "acceptedAndSeen"
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
              claimRequest.status === "acceptedAndSeen" ||
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
    return { submission, toast: null, redirectUrl: null, alert: null };
  }

  return {
    submission,
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
          : ("neutral" as ToastLevel),
    },
    redirectUrl: submission.value.redirectTo || null,
    alert: null,
  };
}
