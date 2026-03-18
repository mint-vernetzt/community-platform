import { type SupabaseClient } from "@supabase/supabase-js";
import { parseWithZod } from "node_modules/@conform-to/zod/dist/default/parse";
import {
  getSearchTeamMembersSchema,
  SEARCH_TEAM_MEMBERS_SEARCH_PARAM,
} from "./list.shared";
import { prismaClient } from "~/prisma.server";
import { getPublicURL } from "~/storage.server";
import { BlurFactor, getImageURL, ImageSizes } from "~/images.server";
import {
  getCompiledMailTemplate,
  mailer,
  mailerOptions,
} from "~/mailer.server";

export async function getTeamMembersOfEvent(options: {
  slug: string;
  authClient: SupabaseClient;
  searchParams: URLSearchParams;
}) {
  const { slug, authClient, searchParams } = options;

  const submission = parseWithZod(searchParams, {
    schema: getSearchTeamMembersSchema(),
  });

  let teamMembers = [];

  if (
    submission.status !== "success" ||
    typeof submission.value[SEARCH_TEAM_MEMBERS_SEARCH_PARAM] === "undefined"
  ) {
    teamMembers = await prismaClient.profile.findMany({
      where: {
        teamMemberOfEvents: { some: { event: { slug } } },
      },
      select: {
        id: true,
        username: true,
        academicTitle: true,
        firstName: true,
        lastName: true,
        avatar: true,
        position: true,
      },
    });
  } else {
    const query =
      submission.value[SEARCH_TEAM_MEMBERS_SEARCH_PARAM].trim().split(" ");

    teamMembers = await prismaClient.profile.findMany({
      where: {
        teamMemberOfEvents: { some: { event: { slug } } },
        OR: query.map((term) => {
          return {
            OR: [
              { firstName: { contains: term, mode: "insensitive" } },
              { lastName: { contains: term, mode: "insensitive" } },
              { email: { contains: term, mode: "insensitive" } },
            ],
          };
        }),
      },
      select: {
        id: true,
        username: true,
        academicTitle: true,
        firstName: true,
        lastName: true,
        avatar: true,
        position: true,
        profileVisibility: {
          select: {
            id: true,
            username: true,
            academicTitle: true,
            firstName: true,
            lastName: true,
            avatar: true,
            position: true,
          },
        },
      },
    });
  }

  const contactPersons = await prismaClient.contactPersonOfEvent.findMany({
    where: { event: { slug } },
    select: {
      profile: {
        select: {
          id: true,
        },
      },
    },
  });

  const contactPersonIds = contactPersons.map((contactPerson) => {
    return contactPerson.profile.id;
  });

  const enhancedTeamMembers = teamMembers.map((teamMember) => {
    let avatar = teamMember.avatar;
    let blurredAvatar;
    if (avatar !== null) {
      const publicURL = getPublicURL(authClient, avatar);
      if (publicURL !== null) {
        avatar = getImageURL(publicURL, {
          resize: {
            type: "fill",
            ...ImageSizes.Profile.ListItem.Avatar,
          },
        });
        blurredAvatar = getImageURL(publicURL, {
          resize: {
            type: "fill",
            ...ImageSizes.Profile.ListItem.BlurredAvatar,
          },
          blur: BlurFactor,
        });
      }
    }

    const isContactPerson = contactPersonIds.includes(teamMember.id);

    return { ...teamMember, avatar, blurredAvatar, isContactPerson };
  });

  return { submission: submission.reply(), teamMembers: enhancedTeamMembers };
}

export async function getEventBySlug(slug: string) {
  const event = await prismaClient.event.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      _count: {
        select: {
          teamMembers: true,
        },
      },
    },
  });
  return event;
}

export async function removeTeamMemberFromEvent(options: {
  eventId: string;
  teamMemberId: string;
  locales: {
    mail: {
      subject: string;
    };
  };
}) {
  const { eventId, teamMemberId } = options;

  const result = await prismaClient.teamMemberOfEvent.delete({
    where: {
      eventId_profileId: {
        eventId: eventId,
        profileId: teamMemberId,
      },
    },
    select: {
      profile: {
        select: {
          email: true,
          firstName: true,
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
  const recipient = result.profile.email;
  const subject = options.locales.mail.subject;
  const textTemplatePath =
    "mail-templates/general-notification/remove-team-member-from-event-text.hbs";
  const htmlTemplatePath =
    "mail-templates/general-notification/remove-team-member-from-event-html.hbs";

  const text = getCompiledMailTemplate<typeof textTemplatePath>(
    textTemplatePath,
    {
      firstName: result.profile.firstName,
      event: { name: result.event.name },
    },
    "text"
  );
  const html = getCompiledMailTemplate<typeof htmlTemplatePath>(
    htmlTemplatePath,
    {
      firstName: result.profile.firstName,
      event: { name: result.event.name },
    },
    "html"
  );

  await mailer(mailerOptions, sender, recipient, subject, text, html);

  return result;
}

export async function addContactPersonToEvent(options: {
  eventId: string;
  teamMemberId: string;
  locales: {
    mail: {
      subject: string;
    };
  };
}) {
  const { eventId, teamMemberId } = options;

  const result = await prismaClient.contactPersonOfEvent.create({
    data: {
      eventId,
      profileId: teamMemberId,
    },
    select: {
      profile: {
        select: {
          email: true,
          firstName: true,
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
  const recipient = result.profile.email;
  const subject = options.locales.mail.subject;
  const textTemplatePath =
    "mail-templates/general-notification/add-contact-person-from-event-text.hbs";
  const htmlTemplatePath =
    "mail-templates/general-notification/add-contact-person-from-event-html.hbs";

  const text = getCompiledMailTemplate<typeof textTemplatePath>(
    textTemplatePath,
    {
      firstName: result.profile.firstName,
      event: { name: result.event.name },
    },
    "text"
  );
  const html = getCompiledMailTemplate<typeof htmlTemplatePath>(
    htmlTemplatePath,
    {
      firstName: result.profile.firstName,
      event: { name: result.event.name },
    },
    "html"
  );

  await mailer(mailerOptions, sender, recipient, subject, text, html);

  return result;
}

export async function removeContactPersonFromEvent(options: {
  eventId: string;
  teamMemberId: string;
  locales: {
    mail: {
      subject: string;
    };
  };
}) {
  const { eventId, teamMemberId } = options;

  const result = await prismaClient.contactPersonOfEvent.delete({
    where: {
      eventId_profileId: {
        eventId,
        profileId: teamMemberId,
      },
    },
    select: {
      profile: {
        select: {
          email: true,
          firstName: true,
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
  const recipient = result.profile.email;
  const subject = options.locales.mail.subject;
  const textTemplatePath =
    "mail-templates/general-notification/remove-contact-person-from-event-text.hbs";
  const htmlTemplatePath =
    "mail-templates/general-notification/remove-contact-person-from-event-html.hbs";

  const text = getCompiledMailTemplate<typeof textTemplatePath>(
    textTemplatePath,
    {
      firstName: result.profile.firstName,
      event: { name: result.event.name },
    },
    "text"
  );
  const html = getCompiledMailTemplate<typeof htmlTemplatePath>(
    htmlTemplatePath,
    {
      firstName: result.profile.firstName,
      event: { name: result.event.name },
    },
    "html"
  );

  await mailer(mailerOptions, sender, recipient, subject, text, html);

  return result;
}
