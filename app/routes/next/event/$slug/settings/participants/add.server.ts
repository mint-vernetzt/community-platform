import { type SupabaseClient } from "@supabase/supabase-js";
import { prismaClient } from "~/prisma.server";
import {
  createSearchParticipantsSchema,
  SEARCH_PARTICIPANTS_SEARCH_PARAM,
} from "./add.shared";
import { parseWithZod } from "@conform-to/zod";
import { getPublicURL } from "~/storage.server";
import { BlurFactor, getImageURL, ImageSizes } from "~/images.server";
import { insertParametersIntoLocale } from "~/lib/utils/i18n";
import {
  getCompiledMailTemplate,
  mailer,
  mailerOptions,
} from "~/mailer.server";

export async function getEventBySlug(slug: string) {
  const event = await prismaClient.event.findUnique({
    where: {
      slug,
    },
    select: {
      id: true,
      published: true,
      external: true,
    },
  });
  return event;
}

export async function searchProfiles(options: {
  eventId: string;
  authClient: SupabaseClient;
  searchParams: URLSearchParams;
  locales: {
    validation: {
      min: string;
    };
  };
}) {
  const { eventId, authClient, searchParams } = options;

  const submission = parseWithZod(searchParams, {
    schema: createSearchParticipantsSchema(options.locales),
  });

  if (
    submission.status !== "success" ||
    typeof submission.value[SEARCH_PARTICIPANTS_SEARCH_PARAM] === "undefined"
  ) {
    return {
      result: [],
      submission: submission.reply(),
    };
  }

  const query =
    submission.value[SEARCH_PARTICIPANTS_SEARCH_PARAM].trim().split(" ");
  const profiles = await prismaClient.profile.findMany({
    where: {
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
      avatarImageMetaData: {
        select: {
          path: true,
        },
      },
    },
  });

  const participants = await prismaClient.participantOfEvent.findMany({
    where: {
      eventId,
    },
    select: {
      profileId: true,
    },
  });

  const invites =
    await prismaClient.inviteForProfileToParticipateOnEvent.findMany({
      where: {
        eventId,
        status: "pending",
      },
      select: {
        profileId: true,
      },
    });

  const enhancedProfiles = profiles.map((profile) => {
    let avatar =
      profile.avatarImageMetaData !== null
        ? profile.avatarImageMetaData.path
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

    const alreadyParticipant = participants.some(
      (participant) => participant.profileId === profile.id
    );
    const alreadyInvited = invites.some(
      (invite) => invite.profileId === profile.id
    );

    return {
      ...profile,
      avatar,
      blurredAvatar,
      alreadyParticipant,
      alreadyInvited,
    };
  });

  return { result: enhancedProfiles, submission: submission.reply() };
}

export async function inviteProfileToParticipateOnEvent(options: {
  eventId: string;
  profileId: string;
  locales: {
    mail: {
      subject: string;
      buttonText: string;
    };
  };
}) {
  const { eventId, profileId } = options;

  const result = await prismaClient.inviteForProfileToParticipateOnEvent.upsert(
    {
      where: {
        profileId_eventId: {
          eventId,
          profileId,
        },
      },
      update: {
        status: "pending",
      },
      create: {
        eventId,
        profileId,
        status: "pending",
      },
      select: {
        profile: {
          select: {
            firstName: true,
            email: true,
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
  const subject = insertParametersIntoLocale(options.locales.mail.subject, {
    eventName: result.event.name,
  });
  const textTemplatePath =
    "mail-templates/invites/profile-to-join-event/as-participant-text.hbs";
  const htmlTemplatePath =
    "mail-templates/invites/profile-to-join-event/as-participant-html.hbs";

  const text = getCompiledMailTemplate<typeof textTemplatePath>(
    textTemplatePath,
    {
      firstName: result.profile.firstName,
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
      firstName: result.profile.firstName,
      event: { name: result.event.name },
      button: {
        url: `${process.env.COMMUNITY_BASE_URL}/my/events`,
        text: options.locales.mail.buttonText,
      },
    },
    "html"
  );

  await mailer(mailerOptions, sender, recipient, subject, text, html);
}
