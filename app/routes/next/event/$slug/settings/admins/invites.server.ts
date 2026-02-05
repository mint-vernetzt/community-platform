import { parseWithZod } from "@conform-to/zod";
import { type SupabaseClient } from "@supabase/supabase-js";
import { BlurFactor, getImageURL, ImageSizes } from "~/images.server";
import { prismaClient } from "~/prisma.server";
import { getPublicURL } from "~/storage.server";
import {
  createSearchInvitedProfilesSchema,
  INVITED_PROFILES_SEARCH_PARAM,
} from "./invites.shared";
import {
  getCompiledMailTemplate,
  mailer,
  mailerOptions,
} from "~/mailer.server";

export async function getInvitedProfilesToJoinEventAsAdmin(options: {
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
    schema: createSearchInvitedProfilesSchema(locales),
  });

  let result = [];

  if (
    submission.status !== "success" ||
    typeof submission.value[INVITED_PROFILES_SEARCH_PARAM] === "undefined"
  ) {
    result = await prismaClient.inviteForProfileToJoinEvent.findMany({
      where: {
        eventId,
        role: "admin",
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
            avatar: true,
          },
        },
        createdAt: true,
      },
    });
  } else {
    const query =
      submission.value[INVITED_PROFILES_SEARCH_PARAM].trim().split(" ");

    result = await prismaClient.inviteForProfileToJoinEvent.findMany({
      where: {
        eventId,
        role: "admin",
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
            avatar: true,
          },
        },
        createdAt: true,
      },
    });
  }

  const profiles = result.map((item) => {
    let avatar = item.profile.avatar;
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
      ...item.profile,
      avatar,
      blurredAvatar,
      invitedAt: item.createdAt,
    };
  });
  return { submission: submission.reply(), profiles };
}

export async function revokeInviteOfProfileToJoinEventAsAdmin(options: {
  eventId: string;
  profileId: string;
  locales: {
    mail: {
      subject: string;
    };
  };
}) {
  const { eventId, profileId } = options;

  const invite = await prismaClient.inviteForProfileToJoinEvent.findUnique({
    where: {
      profileId_eventId_role: {
        eventId,
        profileId,
        role: "admin",
      },
      status: "pending",
    },
  });

  if (invite === null) {
    return null;
  }

  const result = await prismaClient.inviteForProfileToJoinEvent.update({
    where: {
      profileId_eventId_role: {
        eventId,
        profileId,
        role: "admin",
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
  });

  const sender = process.env.SYSTEM_MAIL_SENDER;
  const recipient = result.profile.email;
  const subject = options.locales.mail.subject;
  const textTemplatePath =
    "mail-templates/invites/profile-to-join-event/as-admin-canceled-text.hbs";
  const htmlTemplatePath =
    "mail-templates/invites/profile-to-join-event/as-admin-canceled-html.hbs";

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
