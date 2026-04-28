import { parseWithZod } from "@conform-to/zod";
import { type SupabaseClient } from "@supabase/supabase-js";
import { BlurFactor, getImageURL, ImageSizes } from "~/images.server";
import {
  getCompiledMailTemplate,
  mailer,
  mailerOptions,
} from "~/mailer.server";
import { prismaClient } from "~/prisma.server";
import { getPublicURL } from "~/storage.server";
import {
  createSearchInvitedOrganizationsSchema,
  INVITED_ORGANIZATIONS_SEARCH_PARAM,
} from "./invites.shared";
import { captureException } from "@sentry/node";

export async function getEventIdBySlug(slug: string) {
  const event = await prismaClient.event.findUnique({
    where: { slug },
    select: {
      id: true,
    },
  });

  if (event === null) {
    return null;
  }

  return event.id;
}

export async function getInvitedOrganizations(options: {
  request: Request;
  eventId: string;
  authClient: SupabaseClient;
  locales: {
    validation: {
      min: string;
    };
  };
}) {
  const { request, eventId, authClient, locales } = options;
  const url = new URL(request.url);
  const searchParams = url.searchParams;

  const submission = parseWithZod(searchParams, {
    schema: createSearchInvitedOrganizationsSchema(locales),
  });

  let result = [];

  if (
    submission.status !== "success" ||
    typeof submission.value[INVITED_ORGANIZATIONS_SEARCH_PARAM] === "undefined"
  ) {
    result =
      await prismaClient.inviteForOrganizationToBeResponsibleForEvent.findMany({
        where: {
          eventId,
          status: "pending",
        },
        select: {
          organization: {
            select: {
              id: true,
              name: true,
              slug: true,
              logo: true,
            },
          },
          createdAt: true,
        },
      });
  } else {
    const query =
      submission.value[INVITED_ORGANIZATIONS_SEARCH_PARAM].trim().split(" ");

    result =
      await prismaClient.inviteForOrganizationToBeResponsibleForEvent.findMany({
        where: {
          eventId,
          status: "pending",
          organization: {
            OR: query.map((term) => {
              return {
                OR: [{ name: { contains: term, mode: "insensitive" } }],
              };
            }),
          },
        },
        select: {
          organization: {
            select: {
              id: true,
              name: true,
              slug: true,
              logo: true,
            },
          },
          createdAt: true,
        },
      });
  }

  const organizations = result.map((item) => {
    let logo = item.organization.logo;
    let blurredLogo;
    if (logo !== null) {
      const publicURL = getPublicURL(authClient, logo);
      if (publicURL !== null) {
        logo = getImageURL(publicURL, {
          resize: {
            type: "fill",
            ...ImageSizes.Organization.ListItem.Logo,
          },
        });
        blurredLogo = getImageURL(publicURL, {
          resize: {
            type: "fill",
            ...ImageSizes.Organization.ListItem.BlurredLogo,
          },
          blur: BlurFactor,
        });
      }
    }

    return {
      ...item.organization,
      logo,
      blurredLogo,
      invitedAt: item.createdAt,
    };
  });
  return { submission: submission.reply(), organizations };
}

export async function revokeOrganizationInvite(options: {
  eventId: string;
  organizationId: string;
  userId: string;
  locales: {
    mail: {
      subject: string;
    };
  };
}) {
  const { eventId, organizationId, userId } = options;

  const invite =
    await prismaClient.inviteForOrganizationToBeResponsibleForEvent.findUnique({
      where: {
        organizationId_eventId: {
          eventId,
          organizationId,
        },
        status: "pending",
      },
    });

  if (invite === null) {
    return null;
  }

  const result =
    await prismaClient.inviteForOrganizationToBeResponsibleForEvent.update({
      where: {
        organizationId_eventId: {
          eventId,
          organizationId,
        },
      },
      data: {
        status: "canceled",
      },
      select: {
        organization: {
          select: {
            admins: {
              select: {
                profile: {
                  select: {
                    id: true,
                    email: true,
                    firstName: true,
                  },
                },
              },
            },
          },
        },
        event: {
          select: {
            name: true,
          },
        },
      },
    });

  const sender = process.env.SYSTEM_MAIL_SENDER;
  const subject = options.locales.mail.subject;
  const textTemplatePath =
    "mail-templates/invites/organization-to-join-event/canceled-text.hbs";
  const htmlTemplatePath =
    "mail-templates/invites/organization-to-join-event/canceled-html.hbs";

  const recipents = result.organization.admins.filter((admin) => {
    return admin.profile.id !== userId;
  });

  // Do not block main thread while sending the mail
  void Promise.all(
    recipents.map(async (admin) => {
      try {
        const recipient = admin.profile.email;
        const text = getCompiledMailTemplate<typeof textTemplatePath>(
          textTemplatePath,
          {
            firstName: admin.profile.firstName,
            event: { name: result.event.name },
          },
          "text"
        );
        const html = getCompiledMailTemplate<typeof htmlTemplatePath>(
          htmlTemplatePath,
          {
            firstName: admin.profile.firstName,
            event: { name: result.event.name },
          },
          "html"
        );

        await mailer(mailerOptions, sender, recipient, subject, text, html);
      } catch (error) {
        captureException(error);
      }
    })
  );

  return result;
}
