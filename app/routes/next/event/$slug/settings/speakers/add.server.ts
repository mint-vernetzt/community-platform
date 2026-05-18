import { parseWithZod } from "@conform-to/zod";
import { prismaClient } from "~/prisma.server";
import {
  createSearchSpeakersSchema,
  SEARCH_SPEAKERS_SEARCH_PARAM,
} from "./add.shared";
import { getPublicURL } from "~/storage.server";
import { type SupabaseClient } from "@supabase/supabase-js";
import { BlurFactor, getImageURL, ImageSizes } from "~/images.server";
import {
  getCompiledMailTemplate,
  mailer,
  mailerOptions,
} from "~/mailer.server";
import { insertParametersIntoLocale } from "~/lib/utils/i18n";

export async function getEventBySlug(slug: string) {
  const event = await prismaClient.event.findUnique({
    where: { slug },
    select: {
      id: true,
    },
  });
  return event;
}

export async function searchProfiles(options: {
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
    schema: createSearchSpeakersSchema(locales),
  });

  if (
    submission.status !== "success" ||
    typeof submission.value[SEARCH_SPEAKERS_SEARCH_PARAM] === "undefined"
  ) {
    return {
      result: [],
      submission: submission.reply(),
    };
  }

  const query =
    submission.value[SEARCH_SPEAKERS_SEARCH_PARAM].trim().split(" ");
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
      avatar: true,
    },
  });

  const speakers = await prismaClient.speakerOfEvent.findMany({
    where: {
      eventId: eventId,
    },
    select: {
      profileId: true,
    },
  });

  const invites = await prismaClient.inviteForProfileToJoinEvent.findMany({
    where: {
      eventId: eventId,
      role: "speaker",
      status: "pending",
    },
    select: {
      profileId: true,
    },
  });

  const enhancedProfiles = profiles.map((relation) => {
    let avatar = relation.avatar;
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

    const alreadySpeaker = speakers.some((admin) => {
      return admin.profileId === relation.id;
    });
    const alreadyInvited = invites.some((invite) => {
      return invite.profileId === relation.id;
    });

    return {
      ...relation,
      avatar,
      blurredAvatar,
      alreadySpeaker,
      alreadyInvited,
    };
  });

  return { result: enhancedProfiles, submission: submission.reply() };
}

export async function inviteProfileToJoinEventAsSpeaker(options: {
  eventId: string;
  profileId: string;
  locales: {
    mail: {
      buttonText: string;
      subject: string;
    };
  };
}) {
  const { eventId, profileId } = options;

  const result = await prismaClient.inviteForProfileToJoinEvent.upsert({
    where: {
      profileId_eventId_role: {
        eventId,
        profileId,
        role: "speaker",
      },
    },
    update: {
      status: "pending",
    },
    create: {
      eventId,
      profileId,
      role: "speaker",
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
  });

  const sender = process.env.SYSTEM_MAIL_SENDER;
  const recipient = result.profile.email;
  const subject = insertParametersIntoLocale(options.locales.mail.subject, {
    eventName: result.event.name,
  });
  const textTemplatePath =
    "mail-templates/invites/profile-to-join-event/as-speaker-text.hbs";
  const htmlTemplatePath =
    "mail-templates/invites/profile-to-join-event/as-speaker-html.hbs";

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
