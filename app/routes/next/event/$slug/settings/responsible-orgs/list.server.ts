import { type SupabaseClient } from "@supabase/supabase-js";
import { prismaClient } from "~/prisma.server";
import {
  getSearchResponsibleOrgsSchema,
  SEARCH_RESPONSIBLE_ORGS_SEARCH_PARAM,
} from "./list.shared";
import { parseWithZod } from "@conform-to/zod";
import { getPublicURL } from "~/storage.server";
import { BlurFactor, getImageURL, ImageSizes } from "~/images.server";
import {
  getCompiledMailTemplate,
  mailer,
  mailerOptions,
} from "~/mailer.server";
import { insertParametersIntoLocale } from "~/lib/utils/i18n";
import { captureException } from "@sentry/node";

export async function getResponsibleOrgsOfEvent(options: {
  slug: string;
  authClient: SupabaseClient;
  searchParams: URLSearchParams;
}) {
  const { slug, authClient, searchParams } = options;

  const submission = parseWithZod(searchParams, {
    schema: getSearchResponsibleOrgsSchema(),
  });

  let responsibleOrgs = [];

  if (
    submission.status !== "success" ||
    typeof submission.value[SEARCH_RESPONSIBLE_ORGS_SEARCH_PARAM] ===
      "undefined"
  ) {
    responsibleOrgs = await prismaClient.organization.findMany({
      where: {
        responsibleForEvents: { some: { event: { slug } } },
      },
      select: {
        id: true,
        name: true,
        slug: true,
        logo: true,
      },
    });
  } else {
    const query =
      submission.value[SEARCH_RESPONSIBLE_ORGS_SEARCH_PARAM].trim().split(" ");

    responsibleOrgs = await prismaClient.organization.findMany({
      where: {
        responsibleForEvents: { some: { event: { slug } } },
        OR: query.map((term) => {
          return {
            OR: [{ name: { contains: term, mode: "insensitive" } }],
          };
        }),
      },
      select: {
        id: true,
        name: true,
        slug: true,
        logo: true,
      },
    });
  }

  const enhancedResponsibleOrgs = responsibleOrgs.map((organization) => {
    let logo = organization.logo;
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

    return { ...organization, logo, blurredLogo };
  });

  return {
    submission: submission.reply(),
    responsibleOrgs: enhancedResponsibleOrgs,
  };
}

export async function getEventBySlug(slug: string) {
  const event = await prismaClient.event.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
    },
  });
  return event;
}

export async function removeResponsibleOrgFromEvent(options: {
  eventId: string;
  responsibleOrgId: string;
  userId: string;
  locales: {
    mail: {
      subject: string;
    };
  };
}) {
  const { eventId, responsibleOrgId, userId } = options;

  const result = await prismaClient.responsibleOrganizationOfEvent.delete({
    where: {
      eventId_organizationId: {
        eventId: eventId,
        organizationId: responsibleOrgId,
      },
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
  const subject = insertParametersIntoLocale(options.locales.mail.subject, {
    eventName: result.event.name,
  });
  const textTemplatePath =
    "mail-templates/general-notification/remove-responsible-org-from-event-text.hbs";
  const htmlTemplatePath =
    "mail-templates/general-notification/remove-responsible-org-from-event-html.hbs";

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
