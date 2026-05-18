import { type SupabaseClient } from "@supabase/supabase-js";
import { BlurFactor, getImageURL, ImageSizes } from "~/images.server";
import { DefaultImages } from "~/images.shared";
import { prismaClient } from "~/prisma.server";
import { getPublicURL } from "~/storage.server";
import { type SUPPORTED_COOKIE_LANGUAGES } from "~/i18n.shared";
import { type ArrayElement } from "~/lib/utils/types";
import { type languageModuleMap } from "~/locales/.server";
import {
  getCompiledMailTemplate,
  mailer,
  mailerOptions,
} from "~/mailer.server";
import { captureException } from "@sentry/node";

export type MyEventsLocales = (typeof languageModuleMap)[ArrayElement<
  typeof SUPPORTED_COOKIE_LANGUAGES
>]["my/events"];

export async function getEvents(options: {
  profileId: string;
  authClient: SupabaseClient;
  where?: { [key: string]: any };
  orderBy?: { [key: string]: "asc" | "desc" };
}) {
  const {
    profileId,
    where = { endTime: { gte: new Date() } },
    orderBy = { startTime: "asc" },
    authClient,
  } = options;

  const selectBase = {
    name: true,
    slug: true,
    background: true,
    canceled: true,
    subline: true,
    description: true,
    startTime: true,
    endTime: true,
    participantLimit: true,
    stage: {
      select: {
        slug: true,
      },
    },
    _count: {
      select: {
        participants: true,
        waitingList: true,
      },
    },
  };

  const [
    adminEvents,
    teamMemberEvents,
    speakerEvents,
    participantEvents,
    waitingListEvents,
    responsibleOrganizationEvents,
  ] = await prismaClient.$transaction([
    prismaClient.event.findMany({
      where: {
        ...where,
        admins: {
          some: {
            profileId: profileId,
          },
        },
      },
      select: { ...selectBase, published: true },
      orderBy,
    }),
    prismaClient.event.findMany({
      where: {
        ...where,
        teamMembers: {
          some: {
            profileId: profileId,
          },
        },
      },
      select: { ...selectBase, published: true },
      orderBy,
    }),
    prismaClient.event.findMany({
      where: {
        ...where,
        speakers: {
          some: {
            profileId: profileId,
          },
        },
      },
      select: { ...selectBase, published: true },
      orderBy,
    }),
    prismaClient.event.findMany({
      where: {
        ...where,
        participants: {
          some: {
            profileId: profileId,
          },
        },
        published: true,
      },
      select: { ...selectBase },
      orderBy,
    }),
    prismaClient.event.findMany({
      where: {
        ...where,
        waitingList: {
          some: {
            profileId: profileId,
          },
        },
        published: true,
      },
      select: { ...selectBase },
      orderBy,
    }),
    prismaClient.event.findMany({
      where: {
        ...where,
        responsibleOrganizations: {
          some: {
            organization: {
              admins: {
                some: {
                  profileId: profileId,
                },
              },
            },
          },
        },
      },
      select: { ...selectBase, published: true },
      orderBy,
    }),
  ]);

  // TODO: generate general utils function for this (had ts problems)
  const enhancedAdminEvents = adminEvents.map((event) => {
    let background = event.background;
    let blurredBackground;
    if (background !== null) {
      const publicURL = getPublicURL(authClient, background);
      background = getImageURL(publicURL, {
        resize: { type: "fill", ...ImageSizes.Event.ListItem.Background },
      });
      blurredBackground = getImageURL(publicURL, {
        resize: {
          type: "fill",
          width: ImageSizes.Event.ListItem.BlurredBackground.width,
          height: ImageSizes.Event.ListItem.BlurredBackground.height,
        },
        blur: BlurFactor,
      });
    } else {
      background = DefaultImages.Event.Background;
      blurredBackground = DefaultImages.Event.BlurredBackground;
    }
    return {
      ...event,
      background,
      blurredBackground,
    };
  });
  const enhancedTeamMemberEvents = teamMemberEvents.map((event) => {
    let background = event.background;
    let blurredBackground;
    if (background !== null) {
      const publicURL = getPublicURL(authClient, background);
      background = getImageURL(publicURL, {
        resize: { type: "fill", ...ImageSizes.Event.ListItem.Background },
      });
      blurredBackground = getImageURL(publicURL, {
        resize: {
          type: "fill",
          width: ImageSizes.Event.ListItem.BlurredBackground.width,
          height: ImageSizes.Event.ListItem.BlurredBackground.height,
        },
        blur: BlurFactor,
      });
    } else {
      background = DefaultImages.Event.Background;
      blurredBackground = DefaultImages.Event.BlurredBackground;
    }
    return {
      ...event,
      background,
      blurredBackground,
    };
  });
  const enhancedSpeakerEvents = speakerEvents.map((event) => {
    let background = event.background;
    let blurredBackground;
    if (background !== null) {
      const publicURL = getPublicURL(authClient, background);
      background = getImageURL(publicURL, {
        resize: { type: "fill", ...ImageSizes.Event.ListItem.Background },
      });
      blurredBackground = getImageURL(publicURL, {
        resize: {
          type: "fill",
          width: ImageSizes.Event.ListItem.BlurredBackground.width,
          height: ImageSizes.Event.ListItem.BlurredBackground.height,
        },
        blur: BlurFactor,
      });
    } else {
      background = DefaultImages.Event.Background;
      blurredBackground = DefaultImages.Event.BlurredBackground;
    }
    return {
      ...event,
      background,
      blurredBackground,
    };
  });
  const enhancedParticipantEvents = participantEvents.map((event) => {
    let background = event.background;
    let blurredBackground;
    if (background !== null) {
      const publicURL = getPublicURL(authClient, background);
      background = getImageURL(publicURL, {
        resize: { type: "fill", ...ImageSizes.Event.ListItem.Background },
      });
      blurredBackground = getImageURL(publicURL, {
        resize: {
          type: "fill",
          width: ImageSizes.Event.ListItem.BlurredBackground.width,
          height: ImageSizes.Event.ListItem.BlurredBackground.height,
        },
        blur: BlurFactor,
      });
    } else {
      background = DefaultImages.Event.Background;
      blurredBackground = DefaultImages.Event.BlurredBackground;
    }
    return {
      ...event,
      background,
      blurredBackground,
    };
  });
  const enhancedWaitingListEvents = waitingListEvents.map((event) => {
    let background = event.background;
    let blurredBackground;
    if (background !== null) {
      const publicURL = getPublicURL(authClient, background);
      background = getImageURL(publicURL, {
        resize: { type: "fill", ...ImageSizes.Event.ListItem.Background },
      });
      blurredBackground = getImageURL(publicURL, {
        resize: {
          type: "fill",
          width: ImageSizes.Event.ListItem.BlurredBackground.width,
          height: ImageSizes.Event.ListItem.BlurredBackground.height,
        },
        blur: BlurFactor,
      });
    } else {
      background = DefaultImages.Event.Background;
      blurredBackground = DefaultImages.Event.BlurredBackground;
    }
    return {
      ...event,
      background,
      blurredBackground,
    };
  });
  const enhancedResponsibleOrganizationEvents =
    responsibleOrganizationEvents.map((event) => {
      let background = event.background;
      let blurredBackground;
      if (background !== null) {
        const publicURL = getPublicURL(authClient, background);
        background = getImageURL(publicURL, {
          resize: { type: "fill", ...ImageSizes.Event.ListItem.Background },
        });
        blurredBackground = getImageURL(publicURL, {
          resize: {
            type: "fill",
            width: ImageSizes.Event.ListItem.BlurredBackground.width,
            height: ImageSizes.Event.ListItem.BlurredBackground.height,
          },
          blur: BlurFactor,
        });
      } else {
        background = DefaultImages.Event.Background;
        blurredBackground = DefaultImages.Event.BlurredBackground;
      }
      return {
        ...event,
        background,
        blurredBackground,
      };
    });

  return {
    adminEvents: enhancedAdminEvents,
    teamMemberEvents: enhancedTeamMemberEvents,
    speakerEvents: enhancedSpeakerEvents,
    participantEvents: enhancedParticipantEvents,
    waitingListEvents: enhancedWaitingListEvents,
    responsibleOrganizationEvents: enhancedResponsibleOrganizationEvents,
    count: {
      adminEvents: adminEvents.length,
      teamMemberEvents: teamMemberEvents.length,
      speakerEvents: speakerEvents.length,
      participantEvents: participantEvents.length,
      waitingListEvents: waitingListEvents.length,
      responsibleOrganizationEvents: responsibleOrganizationEvents.length,
    },
  };
}

export async function getEventInvites(options: {
  profileId: string;
  authClient: SupabaseClient;
}) {
  const { profileId, authClient } = options;

  const profileInvites =
    await prismaClient.inviteForProfileToJoinEvent.findMany({
      where: {
        profileId: profileId,
        status: "pending",
      },
      select: {
        event: {
          select: {
            id: true,
            name: true,
            slug: true,
            background: true,
            subline: true,
            description: true,
            startTime: true,
            endTime: true,
            participantLimit: true,
            stage: {
              select: {
                slug: true,
              },
            },
            _count: {
              select: {
                participants: true,
                waitingList: true,
              },
            },
          },
        },
        role: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

  const organizationInvites =
    await prismaClient.inviteForOrganizationToBeResponsibleForEvent.findMany({
      where: {
        organization: {
          admins: {
            some: {
              profileId: profileId,
            },
          },
        },
        status: "pending",
      },
      select: {
        event: {
          select: {
            id: true,
            name: true,
            slug: true,
            background: true,
            subline: true,
            description: true,
            startTime: true,
            endTime: true,
            participantLimit: true,
            stage: {
              select: {
                slug: true,
              },
            },
            _count: {
              select: {
                participants: true,
                waitingList: true,
              },
            },
          },
        },
        organizationId: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

  const mergedInvites:
    | (ArrayElement<typeof profileInvites> & {
        organizationId?: string;
      })[]
    | (Omit<ArrayElement<typeof organizationInvites>, "organizationId"> & {
        organizationId?: string;
        role: string;
      })[] = [
    ...profileInvites,
    ...organizationInvites.map((invite) => {
      return {
        ...invite,
        role: "responsibleOrganization",
      };
    }),
  ];

  const enhancedInvites = mergedInvites.map((invite) => {
    let background = invite.event.background;
    let blurredBackground;
    if (background !== null) {
      const publicURL = getPublicURL(authClient, background);
      background = getImageURL(publicURL, {
        resize: { type: "fill", ...ImageSizes.Event.ListItem.Background },
      });
      blurredBackground = getImageURL(publicURL, {
        resize: {
          type: "fill",
          width: ImageSizes.Event.ListItem.BlurredBackground.width,
          height: ImageSizes.Event.ListItem.BlurredBackground.height,
        },
        blur: BlurFactor,
      });
    } else {
      background = DefaultImages.Event.Background;
      blurredBackground = DefaultImages.Event.BlurredBackground;
    }

    const event = {
      ...invite.event,
      background,
      blurredBackground,
      participantCount: invite.event._count.participants,
    };

    return {
      ...invite,
      event,
    };
  });

  const adminInvites = enhancedInvites.filter((invite) => {
    return invite.role === "admin";
  });
  const teamMemberInvites = enhancedInvites.filter((invite) => {
    return invite.role === "member";
  });
  const speakerInvites = enhancedInvites.filter((invite) => {
    return invite.role === "speaker";
  });
  const responsibleOrganizationInvites = enhancedInvites.filter((invite) => {
    return invite.role === "responsibleOrganization";
  });

  return {
    adminInvites,
    teamMemberInvites,
    speakerInvites,
    responsibleOrganizationInvites,
    count: {
      adminInvites: adminInvites.length,
      teamMemberInvites: teamMemberInvites.length,
      speakerInvites: speakerInvites.length,
      responsibleOrganizationInvites: responsibleOrganizationInvites.length,
    },
  };
}

export async function acceptInviteAsAdmin(options: {
  userId: string;
  eventId: string;
  locales: {
    mail: {
      subject: string;
    };
  };
}) {
  const { userId, eventId } = options;

  // check if invite exists
  const invite = await prismaClient.inviteForProfileToJoinEvent.findUnique({
    where: {
      profileId_eventId_role: {
        eventId,
        profileId: userId,
        role: "admin",
      },
      status: "pending",
    },
  });

  if (invite === null) {
    throw new Error("Invite not found");
  }

  await prismaClient.adminOfEvent.create({
    data: {
      eventId,
      profileId: userId,
    },
  });

  const result = await prismaClient.inviteForProfileToJoinEvent.update({
    where: {
      profileId_eventId_role: {
        eventId,
        profileId: userId,
        role: "admin",
      },
    },
    data: {
      status: "accepted",
    },
    select: {
      profile: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
      event: {
        select: {
          name: true,
          admins: {
            select: {
              profile: {
                select: {
                  id: true,
                  firstName: true,
                  email: true,
                },
              },
            },
          },
        },
      },
    },
  });

  const sender = process.env.SYSTEM_MAIL_SENDER;
  const subject = options.locales.mail.subject;
  const textTemplatePath =
    "mail-templates/invites/profile-to-join-event/as-admin-accepted-text.hbs";
  const htmlTemplatePath =
    "mail-templates/invites/profile-to-join-event/as-admin-accepted-html.hbs";

  const recipents = result.event.admins.filter((admin) => {
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
            profile: {
              firstName: result.profile.firstName,
              lastName: result.profile.lastName,
            },
          },
          "text"
        );
        const html = getCompiledMailTemplate<typeof htmlTemplatePath>(
          htmlTemplatePath,
          {
            firstName: admin.profile.firstName,
            event: { name: result.event.name },
            profile: {
              firstName: result.profile.firstName,
              lastName: result.profile.lastName,
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

export async function rejectInviteAsAdmin(options: {
  userId: string;
  eventId: string;
  locales: {
    mail: {
      subject: string;
    };
  };
}) {
  const { userId, eventId } = options;

  // check if invite exists
  const invite = await prismaClient.inviteForProfileToJoinEvent.findUnique({
    where: {
      profileId_eventId_role: {
        eventId,
        profileId: userId,
        role: "admin",
      },
      status: "pending",
    },
  });

  if (invite === null) {
    throw new Error("Invite not found");
  }

  const result = await prismaClient.inviteForProfileToJoinEvent.update({
    where: {
      profileId_eventId_role: {
        eventId,
        profileId: userId,
        role: "admin",
      },
    },
    data: {
      status: "rejected",
    },
    select: {
      profile: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
      event: {
        select: {
          name: true,
          admins: {
            select: {
              profile: {
                select: {
                  firstName: true,
                  email: true,
                },
              },
            },
          },
        },
      },
    },
  });

  const sender = process.env.SYSTEM_MAIL_SENDER;
  const subject = options.locales.mail.subject;
  const textTemplatePath =
    "mail-templates/invites/profile-to-join-event/as-admin-rejected-text.hbs";
  const htmlTemplatePath =
    "mail-templates/invites/profile-to-join-event/as-admin-rejected-html.hbs";

  // Do not block main thread while sending the mail
  void Promise.all(
    result.event.admins.map(async (admin) => {
      try {
        const recipient = admin.profile.email;
        const text = getCompiledMailTemplate<typeof textTemplatePath>(
          textTemplatePath,
          {
            firstName: admin.profile.firstName,
            event: { name: result.event.name },
            profile: {
              firstName: result.profile.firstName,
              lastName: result.profile.lastName,
            },
          },
          "text"
        );
        const html = getCompiledMailTemplate<typeof htmlTemplatePath>(
          htmlTemplatePath,
          {
            firstName: admin.profile.firstName,
            event: { name: result.event.name },
            profile: {
              firstName: result.profile.firstName,
              lastName: result.profile.lastName,
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

export async function acceptInviteAsTeamMember(options: {
  userId: string;
  eventId: string;
  locales: {
    mail: {
      subject: string;
    };
  };
}) {
  const { userId, eventId } = options;

  // check if invite exists
  const invite = await prismaClient.inviteForProfileToJoinEvent.findUnique({
    where: {
      profileId_eventId_role: {
        eventId,
        profileId: userId,
        role: "member",
      },
      status: "pending",
    },
  });

  if (invite === null) {
    throw new Error("Invite not found");
  }

  await prismaClient.teamMemberOfEvent.create({
    data: {
      eventId,
      profileId: userId,
    },
  });

  const result = await prismaClient.inviteForProfileToJoinEvent.update({
    where: {
      profileId_eventId_role: {
        eventId,
        profileId: userId,
        role: "member",
      },
    },
    data: {
      status: "accepted",
    },
    select: {
      profile: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
      event: {
        select: {
          name: true,
          admins: {
            select: {
              profile: {
                select: {
                  id: true,
                  firstName: true,
                  email: true,
                },
              },
            },
          },
        },
      },
    },
  });

  const sender = process.env.SYSTEM_MAIL_SENDER;
  const subject = options.locales.mail.subject;
  const textTemplatePath =
    "mail-templates/invites/profile-to-join-event/as-member-accepted-text.hbs";
  const htmlTemplatePath =
    "mail-templates/invites/profile-to-join-event/as-member-accepted-html.hbs";

  const recipents = result.event.admins.filter((admin) => {
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
            profile: {
              firstName: result.profile.firstName,
              lastName: result.profile.lastName,
            },
          },
          "text"
        );
        const html = getCompiledMailTemplate<typeof htmlTemplatePath>(
          htmlTemplatePath,
          {
            firstName: admin.profile.firstName,
            event: { name: result.event.name },
            profile: {
              firstName: result.profile.firstName,
              lastName: result.profile.lastName,
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

export async function rejectInviteAsTeamMember(options: {
  userId: string;
  eventId: string;
  locales: {
    mail: {
      subject: string;
    };
  };
}) {
  const { userId, eventId } = options;

  // check if invite exists
  const invite = await prismaClient.inviteForProfileToJoinEvent.findUnique({
    where: {
      profileId_eventId_role: {
        eventId,
        profileId: userId,
        role: "member",
      },
      status: "pending",
    },
  });

  if (invite === null) {
    throw new Error("Invite not found");
  }

  const result = await prismaClient.inviteForProfileToJoinEvent.update({
    where: {
      profileId_eventId_role: {
        eventId,
        profileId: userId,
        role: "member",
      },
    },
    data: {
      status: "rejected",
    },
    select: {
      profile: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
      event: {
        select: {
          name: true,
          admins: {
            select: {
              profile: {
                select: {
                  firstName: true,
                  email: true,
                },
              },
            },
          },
        },
      },
    },
  });

  const sender = process.env.SYSTEM_MAIL_SENDER;
  const subject = options.locales.mail.subject;
  const textTemplatePath =
    "mail-templates/invites/profile-to-join-event/as-member-rejected-text.hbs";
  const htmlTemplatePath =
    "mail-templates/invites/profile-to-join-event/as-member-rejected-html.hbs";

  // Do not block main thread while sending the mail
  void Promise.all(
    result.event.admins.map(async (admin) => {
      try {
        const recipient = admin.profile.email;
        const text = getCompiledMailTemplate<typeof textTemplatePath>(
          textTemplatePath,
          {
            firstName: admin.profile.firstName,
            event: { name: result.event.name },
            profile: {
              firstName: result.profile.firstName,
              lastName: result.profile.lastName,
            },
          },
          "text"
        );
        const html = getCompiledMailTemplate<typeof htmlTemplatePath>(
          htmlTemplatePath,
          {
            firstName: admin.profile.firstName,
            event: { name: result.event.name },
            profile: {
              firstName: result.profile.firstName,
              lastName: result.profile.lastName,
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

export async function acceptInviteAsSpeaker(options: {
  userId: string;
  eventId: string;
  locales: {
    mail: {
      subject: string;
    };
  };
}) {
  const { userId, eventId } = options;

  // check if invite exists
  const invite = await prismaClient.inviteForProfileToJoinEvent.findUnique({
    where: {
      profileId_eventId_role: {
        eventId,
        profileId: userId,
        role: "speaker",
      },
      status: "pending",
    },
  });

  if (invite === null) {
    throw new Error("Invite not found");
  }

  await prismaClient.speakerOfEvent.create({
    data: {
      eventId,
      profileId: userId,
    },
  });

  const result = await prismaClient.inviteForProfileToJoinEvent.update({
    where: {
      profileId_eventId_role: {
        eventId,
        profileId: userId,
        role: "speaker",
      },
    },
    data: {
      status: "accepted",
    },
    select: {
      profile: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
      event: {
        select: {
          name: true,
          admins: {
            select: {
              profile: {
                select: {
                  id: true,
                  firstName: true,
                  email: true,
                },
              },
            },
          },
        },
      },
    },
  });

  const sender = process.env.SYSTEM_MAIL_SENDER;
  const subject = options.locales.mail.subject;
  const textTemplatePath =
    "mail-templates/invites/profile-to-join-event/as-speaker-accepted-text.hbs";
  const htmlTemplatePath =
    "mail-templates/invites/profile-to-join-event/as-speaker-accepted-html.hbs";

  const recipents = result.event.admins.filter((admin) => {
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
            profile: {
              firstName: result.profile.firstName,
              lastName: result.profile.lastName,
            },
          },
          "text"
        );
        const html = getCompiledMailTemplate<typeof htmlTemplatePath>(
          htmlTemplatePath,
          {
            firstName: admin.profile.firstName,
            event: { name: result.event.name },
            profile: {
              firstName: result.profile.firstName,
              lastName: result.profile.lastName,
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

export async function rejectInviteAsSpeaker(options: {
  userId: string;
  eventId: string;
  locales: {
    mail: {
      subject: string;
    };
  };
}) {
  const { userId, eventId } = options;

  // check if invite exists
  const invite = await prismaClient.inviteForProfileToJoinEvent.findUnique({
    where: {
      profileId_eventId_role: {
        eventId,
        profileId: userId,
        role: "speaker",
      },
      status: "pending",
    },
  });

  if (invite === null) {
    throw new Error("Invite not found");
  }

  const result = await prismaClient.inviteForProfileToJoinEvent.update({
    where: {
      profileId_eventId_role: {
        eventId,
        profileId: userId,
        role: "speaker",
      },
    },
    data: {
      status: "rejected",
    },
    select: {
      profile: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
      event: {
        select: {
          name: true,
          admins: {
            select: {
              profile: {
                select: {
                  firstName: true,
                  email: true,
                },
              },
            },
          },
        },
      },
    },
  });

  const sender = process.env.SYSTEM_MAIL_SENDER;
  const subject = options.locales.mail.subject;
  const textTemplatePath =
    "mail-templates/invites/profile-to-join-event/as-speaker-rejected-text.hbs";
  const htmlTemplatePath =
    "mail-templates/invites/profile-to-join-event/as-speaker-rejected-html.hbs";

  // Do not block main thread while sending the mail
  void Promise.all(
    result.event.admins.map(async (admin) => {
      try {
        const recipient = admin.profile.email;
        const text = getCompiledMailTemplate<typeof textTemplatePath>(
          textTemplatePath,
          {
            firstName: admin.profile.firstName,
            event: { name: result.event.name },
            profile: {
              firstName: result.profile.firstName,
              lastName: result.profile.lastName,
            },
          },
          "text"
        );
        const html = getCompiledMailTemplate<typeof htmlTemplatePath>(
          htmlTemplatePath,
          {
            firstName: admin.profile.firstName,
            event: { name: result.event.name },
            profile: {
              firstName: result.profile.firstName,
              lastName: result.profile.lastName,
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

export async function acceptInviteAsResponsibleOrganization(options: {
  userId: string;
  organizationId: string;
  eventId: string;
  locales: {
    mail: {
      subject: string;
    };
  };
}) {
  const { userId, organizationId, eventId } = options;

  // check if invite exists
  const invite =
    await prismaClient.inviteForOrganizationToBeResponsibleForEvent.findUnique({
      where: {
        organizationId_eventId: {
          eventId,
          organizationId,
        },
        organization: {
          admins: {
            some: {
              profileId: userId,
            },
          },
        },
        status: "pending",
      },
    });

  if (invite === null) {
    throw new Error("Invite not found");
  }

  await prismaClient.responsibleOrganizationOfEvent.create({
    data: {
      eventId,
      organizationId,
    },
  });

  const result =
    await prismaClient.inviteForOrganizationToBeResponsibleForEvent.update({
      where: {
        organizationId_eventId: {
          eventId,
          organizationId,
        },
      },
      data: {
        status: "accepted",
      },
      select: {
        organization: {
          select: {
            name: true,
          },
        },
        event: {
          select: {
            name: true,
            admins: {
              select: {
                profile: {
                  select: {
                    id: true,
                    firstName: true,
                    email: true,
                  },
                },
              },
            },
          },
        },
      },
    });

  const sender = process.env.SYSTEM_MAIL_SENDER;
  const subject = options.locales.mail.subject;
  const textTemplatePath =
    "mail-templates/invites/organization-to-join-event/accepted-text.hbs";
  const htmlTemplatePath =
    "mail-templates/invites/organization-to-join-event/accepted-html.hbs";

  const recipents = result.event.admins.filter((admin) => {
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
            organization: {
              name: result.organization.name,
            },
          },
          "text"
        );
        const html = getCompiledMailTemplate<typeof htmlTemplatePath>(
          htmlTemplatePath,
          {
            firstName: admin.profile.firstName,
            event: { name: result.event.name },
            organization: {
              name: result.organization.name,
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

export async function rejectInviteAsResponsibleOrganization(options: {
  userId: string;
  organizationId: string;
  eventId: string;
  locales: {
    mail: {
      subject: string;
    };
  };
}) {
  const { userId, organizationId, eventId } = options;

  // check if invite exists
  const invite =
    await prismaClient.inviteForOrganizationToBeResponsibleForEvent.findUnique({
      where: {
        organizationId_eventId: {
          eventId,
          organizationId,
        },
        organization: {
          admins: {
            some: {
              profileId: userId,
            },
          },
        },
        status: "pending",
      },
    });

  if (invite === null) {
    throw new Error("Invite not found");
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
        status: "rejected",
      },
      select: {
        organization: {
          select: {
            name: true,
          },
        },
        event: {
          select: {
            name: true,
            admins: {
              select: {
                profile: {
                  select: {
                    id: true,
                    firstName: true,
                    email: true,
                  },
                },
              },
            },
          },
        },
      },
    });

  const sender = process.env.SYSTEM_MAIL_SENDER;
  const subject = options.locales.mail.subject;
  const textTemplatePath =
    "mail-templates/invites/organization-to-join-event/rejected-text.hbs";
  const htmlTemplatePath =
    "mail-templates/invites/organization-to-join-event/rejected-html.hbs";

  // Do not block main thread while sending the mail
  void Promise.all(
    result.event.admins.map(async (admin) => {
      try {
        const recipient = admin.profile.email;
        const text = getCompiledMailTemplate<typeof textTemplatePath>(
          textTemplatePath,
          {
            firstName: admin.profile.firstName,
            event: { name: result.event.name },
            organization: {
              name: result.organization.name,
            },
          },
          "text"
        );
        const html = getCompiledMailTemplate<typeof htmlTemplatePath>(
          htmlTemplatePath,
          {
            firstName: admin.profile.firstName,
            event: { name: result.event.name },
            organization: {
              name: result.organization.name,
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
