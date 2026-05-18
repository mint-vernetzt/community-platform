import { type SupabaseClient } from "@supabase/supabase-js";
import { prismaClient } from "~/prisma.server";
import {
  getSearchSpeakersSchema,
  SEARCH_SPEAKERS_SEARCH_PARAM,
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

export async function getSpeakersOfEvent(options: {
  slug: string;
  authClient: SupabaseClient;
  searchParams: URLSearchParams;
}) {
  const { slug, authClient, searchParams } = options;

  const submission = parseWithZod(searchParams, {
    schema: getSearchSpeakersSchema(),
  });

  let speakers = [];

  if (
    submission.status !== "success" ||
    typeof submission.value[SEARCH_SPEAKERS_SEARCH_PARAM] === "undefined"
  ) {
    speakers = await prismaClient.profile.findMany({
      where: {
        contributedEvents: { some: { event: { slug } } },
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
      submission.value[SEARCH_SPEAKERS_SEARCH_PARAM].trim().split(" ");

    speakers = await prismaClient.profile.findMany({
      where: {
        contributedEvents: { some: { event: { slug } } },
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

  const enhancedSpeakers = speakers.map((speaker) => {
    let avatar = speaker.avatar;
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

    return { ...speaker, avatar, blurredAvatar };
  });

  return { submission: submission.reply(), speakers: enhancedSpeakers };
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

export async function removeSpeakerFromEvent(options: {
  eventId: string;
  speakerId: string;
  locales: {
    mail: {
      subject: string;
    };
  };
}) {
  const { eventId, speakerId } = options;

  const result = await prismaClient.speakerOfEvent.delete({
    where: {
      profileId_eventId: {
        eventId: eventId,
        profileId: speakerId,
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
  const subject = insertParametersIntoLocale(options.locales.mail.subject, {
    eventName: result.event.name,
  });
  const textTemplatePath =
    "mail-templates/general-notification/remove-speaker-from-event-text.hbs";
  const htmlTemplatePath =
    "mail-templates/general-notification/remove-speaker-from-event-html.hbs";

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
