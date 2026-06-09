import { type SupabaseClient } from "@supabase/supabase-js";
import { prismaClient } from "~/prisma.server";
import {
  createSearchInvitedProfilesToParticipateOnEventSchema,
  INVITED_PROFILES_SEARCH_PARAM,
} from "./invites.shared";
import { parseWithZod } from "@conform-to/zod";
import { getPublicURL } from "~/storage.server";
import { BlurFactor, getImageURL, ImageSizes } from "~/images.server";
import { utcToZonedTime } from "date-fns-tz";
import {
  getCompiledMailTemplate,
  mailer,
  mailerOptions,
} from "~/mailer.server";

export async function getEventBySlug(slug: string) {
  const event = await prismaClient.event.findUnique({
    where: { slug },
    select: {
      id: true,
      published: true,
      external: true,
    },
  });

  return event;
}

export async function getInvitedProfilesToParticipateOnEvent(options: {
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
    schema: createSearchInvitedProfilesToParticipateOnEventSchema(locales),
  });

  let invites = [];

  if (
    submission.status !== "success" ||
    typeof submission.value[INVITED_PROFILES_SEARCH_PARAM] !== "string"
  ) {
    invites = await prismaClient.inviteForProfileToParticipateOnEvent.findMany({
      where: {
        eventId,
        status: "pending",
      },
      select: {
        profile: {
          select: {
            id: true,
            username: true,
            academicTitle: true,
            firstName: true,
            lastName: true,
            avatarImageMetaData: {
              select: {
                path: true,
              },
            },
          },
        },
        createdAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  } else {
    const query =
      submission.value[INVITED_PROFILES_SEARCH_PARAM].trim().split(" ");

    invites = await prismaClient.inviteForProfileToParticipateOnEvent.findMany({
      where: {
        eventId,
        status: "pending",
        profile: {
          OR: query.map((term) => {
            return {
              OR: [
                { firstName: { contains: term, mode: "insensitive" } },
                { lastName: { contains: term, mode: "insensitive" } },
              ],
            };
          }),
        },
      },
      select: {
        profile: {
          select: {
            id: true,
            username: true,
            academicTitle: true,
            firstName: true,
            lastName: true,
            avatarImageMetaData: {
              select: {
                path: true,
              },
            },
          },
        },
        createdAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  const profiles = invites.map((invite) => {
    let avatar =
      invite.profile.avatarImageMetaData !== null
        ? invite.profile.avatarImageMetaData.path
        : null;
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

    return {
      ...invite.profile,
      avatar,
      blurredAvatar,
      invitedAt: utcToZonedTime(invite.createdAt, "Europe/Berlin"),
    };
  });
  return { submission: submission.reply(), profiles };
}

export async function revokeInviteOfProfileToParticipateOnEvent(options: {
  eventId: string;
  profileId: string;
  locales: {
    mail: {
      subject: string;
    };
  };
}) {
  const { eventId, profileId, locales } = options;

  const invite =
    await prismaClient.inviteForProfileToParticipateOnEvent.findFirst({
      where: {
        eventId,
        profileId,
        status: "pending",
      },
    });

  if (invite === null) {
    return null;
  }

  const result = await prismaClient.inviteForProfileToParticipateOnEvent.update(
    {
      where: {
        profileId_eventId: {
          eventId,
          profileId,
        },
      },
      data: {
        status: "canceled",
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
    }
  );

  const sender = process.env.SYSTEM_MAIL_SENDER;
  const recipient = result.profile.email;
  const subject = locales.mail.subject;
  const textTemplatePath =
    "mail-templates/invites/profile-to-join-event/as-participant-canceled-text.hbs";
  const htmlTemplatePath =
    "mail-templates/invites/profile-to-join-event/as-participant-canceled-html.hbs";

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
