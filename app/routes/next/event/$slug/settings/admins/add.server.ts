import { parseWithZod } from "@conform-to/zod";
import { prismaClient } from "~/prisma.server";
import {
  createSearchAdminsSchema,
  createSearchTeamMembersSchema,
  SEARCH_ADMINS_SEARCH_PARAM,
  SEARCH_TEAM_MEMBERS_SEARCH_PARAM,
} from "./add.shared";
import { getPublicURL } from "~/storage.server";
import { type SupabaseClient } from "@supabase/supabase-js";
import { BlurFactor, getImageURL, ImageSizes } from "~/images.server";
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
    },
  });
  return event;
}

export async function getTeamMembersOfEventToAddAsAdmins(options: {
  eventId: string;
  authClient: SupabaseClient;
  request: Request;
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
    schema: createSearchTeamMembersSchema(locales),
  });

  let teamMembers = [];

  if (
    submission.status !== "success" ||
    typeof submission.value[SEARCH_TEAM_MEMBERS_SEARCH_PARAM] === "undefined"
  ) {
    teamMembers = await prismaClient.teamMemberOfEvent.findMany({
      where: {
        eventId: eventId,
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
      },
    });
  } else {
    const query =
      submission.value[SEARCH_TEAM_MEMBERS_SEARCH_PARAM].trim().split(" ");

    teamMembers = await prismaClient.teamMemberOfEvent.findMany({
      where: {
        eventId: eventId,
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
      },
    });
  }

  const admins = await prismaClient.adminOfEvent.findMany({
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
      role: "admin",
      status: "pending",
    },
    select: {
      profileId: true,
    },
  });

  const enhancedProfiles = teamMembers.map((relation) => {
    let avatar = relation.profile.avatar;
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

    const alreadyAdmin = admins.some((admin) => {
      return admin.profileId === relation.profile.id;
    });
    const alreadyInvited = invites.some((invite) => {
      return invite.profileId === relation.profile.id;
    });

    return {
      ...relation.profile,
      avatar,
      blurredAvatar,
      alreadyAdmin,
      alreadyInvited,
    };
  });

  return { result: enhancedProfiles, submission: submission.reply() };
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
    schema: createSearchAdminsSchema(locales),
  });

  if (
    submission.status !== "success" ||
    typeof submission.value[SEARCH_ADMINS_SEARCH_PARAM] === "undefined"
  ) {
    return {
      result: [],
      submission: submission.reply(),
    };
  }

  const query = submission.value[SEARCH_ADMINS_SEARCH_PARAM].trim().split(" ");
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

  const admins = await prismaClient.adminOfEvent.findMany({
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
      role: "admin",
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

    const alreadyAdmin = admins.some((admin) => {
      return admin.profileId === relation.id;
    });
    const alreadyInvited = invites.some((invite) => {
      return invite.profileId === relation.id;
    });

    return { ...relation, avatar, blurredAvatar, alreadyAdmin, alreadyInvited };
  });

  return { result: enhancedProfiles, submission: submission.reply() };
}

export async function inviteProfileToJoinEventAsAdmin(options: {
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
        role: "admin",
      },
    },
    update: {
      status: "pending",
    },
    create: {
      eventId,
      profileId,
      role: "admin",
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
  const subject = options.locales.mail.subject;
  const textTemplatePath =
    "mail-templates/invites/profile-to-join-event/as-admin-text.hbs";
  const htmlTemplatePath =
    "mail-templates/invites/profile-to-join-event/as-admin-html.hbs";

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

  // Do not block main thread while sending the mail
  void mailer(mailerOptions, sender, recipient, subject, text, html);
}

export async function addTeamMemberAsAdminToEvent(options: {
  eventId: string;
  profileId: string;
}) {
  const { eventId, profileId } = options;

  const result = await prismaClient.adminOfEvent.create({
    data: {
      eventId,
      profileId,
    },
  });

  return result;
}
