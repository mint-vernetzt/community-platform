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
  createSearchOwnOrganizationsSchema,
  createSearchOrganizationsSchema,
  SEARCH_OWN_ORGANIZATIONS_SEARCH_PARAM,
  SEARCH_ORGANIZATIONS_SEARCH_PARAM,
} from "./add.shared";
import { captureException } from "@sentry/node";

export async function getEventBySlug(slug: string) {
  const event = await prismaClient.event.findUnique({
    where: { slug },
    select: {
      id: true,
    },
  });
  return event;
}

export async function getOwnOrganizationsOfEvent(options: {
  eventId: string;
  userId: string;
  authClient: SupabaseClient;
  request: Request;
  locales: {
    validation: {
      min: string;
    };
  };
}) {
  const { request, eventId, userId, authClient, locales } = options;
  const url = new URL(request.url);
  const searchParams = url.searchParams;
  const submission = parseWithZod(searchParams, {
    schema: createSearchOwnOrganizationsSchema(locales),
  });

  let ownOrganizations = [];

  if (
    submission.status !== "success" ||
    typeof submission.value[SEARCH_OWN_ORGANIZATIONS_SEARCH_PARAM] ===
      "undefined"
  ) {
    ownOrganizations = await prismaClient.organization.findMany({
      where: {
        admins: {
          some: {
            profileId: userId,
          },
        },
        responsibleForEvents: {
          none: {
            eventId,
          },
        },
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
      submission.value[SEARCH_OWN_ORGANIZATIONS_SEARCH_PARAM].trim().split(" ");

    ownOrganizations = await prismaClient.organization.findMany({
      where: {
        admins: {
          some: {
            profileId: userId,
          },
        },
        responsibleForEvents: {
          none: {
            eventId,
          },
        },
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

  const responsibleOrganizations =
    await prismaClient.responsibleOrganizationOfEvent.findMany({
      where: {
        eventId: eventId,
      },
      select: {
        organizationId: true,
      },
    });

  const invites =
    await prismaClient.inviteForOrganizationToBeResponsibleForEvent.findMany({
      where: {
        eventId: eventId,
        status: "pending",
      },
      select: {
        organizationId: true,
      },
    });

  const enhancedOwnOrganizations = ownOrganizations.map((ownOrganization) => {
    let logo = ownOrganization.logo;
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

    const alreadyResponsibleOrganization = responsibleOrganizations.some(
      (organization) => {
        return ownOrganization.id === organization.organizationId;
      }
    );
    const alreadyInvited = invites.some((invite) => {
      return ownOrganization.id === invite.organizationId;
    });

    return {
      ...ownOrganization,
      logo,
      blurredLogo,
      alreadyResponsibleOrganization,
      alreadyInvited,
    };
  });

  return { result: enhancedOwnOrganizations, submission: submission.reply() };
}

export async function searchOrganizations(options: {
  request: Request;
  locales: {
    validation: {
      min: string;
    };
  };
  authClient: SupabaseClient;
  eventId: string;
}) {
  const { request, locales, authClient, eventId } = options;
  const url = new URL(request.url);
  const searchParams = url.searchParams;
  const submission = parseWithZod(searchParams, {
    schema: createSearchOrganizationsSchema(locales),
  });

  if (
    submission.status !== "success" ||
    typeof submission.value[SEARCH_ORGANIZATIONS_SEARCH_PARAM] === "undefined"
  ) {
    return {
      result: [],
      submission: submission.reply(),
    };
  }

  const query =
    submission.value[SEARCH_ORGANIZATIONS_SEARCH_PARAM].trim().split(" ");
  const searchedOrganizations = await prismaClient.organization.findMany({
    where: {
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

  const responsibleOrganizations =
    await prismaClient.responsibleOrganizationOfEvent.findMany({
      where: {
        eventId: eventId,
      },
      select: {
        organizationId: true,
      },
    });

  const invites =
    await prismaClient.inviteForOrganizationToBeResponsibleForEvent.findMany({
      where: {
        eventId: eventId,
        status: "pending",
      },
      select: {
        organizationId: true,
      },
    });

  const enhancedOrganizations = searchedOrganizations.map(
    (searchedOrganization) => {
      let logo = searchedOrganization.logo;
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

      const alreadyResponsibleOrganization = responsibleOrganizations.some(
        (responsibleOrganization) => {
          return (
            searchedOrganization.id === responsibleOrganization.organizationId
          );
        }
      );
      const alreadyInvited = invites.some((invite) => {
        return searchedOrganization.id === invite.organizationId;
      });

      return {
        ...searchedOrganization,
        logo,
        blurredLogo,
        alreadyResponsibleOrganization,
        alreadyInvited,
      };
    }
  );

  return { result: enhancedOrganizations, submission: submission.reply() };
}

export async function inviteOrganizationToBeResponsibleForEvent(options: {
  eventId: string;
  organizationId: string;
  userId: string;
  locales: {
    mail: {
      buttonText: string;
      subject: string;
    };
  };
}) {
  const { eventId, organizationId, userId } = options;

  const result =
    await prismaClient.inviteForOrganizationToBeResponsibleForEvent.upsert({
      where: {
        organizationId_eventId: {
          eventId,
          organizationId,
        },
      },
      update: {
        status: "pending",
      },
      create: {
        eventId,
        organizationId,
        status: "pending",
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
    "mail-templates/invites/organization-to-join-event/text.hbs";
  const htmlTemplatePath =
    "mail-templates/invites/organization-to-join-event/html.hbs";
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
            button: {
              url: `${process.env.COMMUNITY_BASE_URL}/my/events`,
              text: options.locales.mail.buttonText,
            },
          },
          "text"
        );
        const html = getCompiledMailTemplate<typeof htmlTemplatePath>(
          htmlTemplatePath,
          {
            firstName: admin.profile.firstName,
            event: { name: result.event.name },
            button: {
              url: `${process.env.COMMUNITY_BASE_URL}/my/events`,
              text: options.locales.mail.buttonText,
            },
          },
          "html"
        );

        await mailer(mailerOptions, sender, recipient, subject, text, html);
      } catch (error) {
        captureException(error);
      }
    })
  );
}

export async function addOwnOrganizationToEvent(options: {
  eventId: string;
  organizationId: string;
}) {
  const { eventId, organizationId } = options;

  const result = await prismaClient.responsibleOrganizationOfEvent.create({
    data: {
      eventId,
      organizationId,
    },
  });

  return result;
}
