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
    backgroundImageMetaData: {
      select: {
        path: true,
      },
    },
    canceled: true,
    external: true,
    openForRegistration: true,
    parentParticipationRequired: true,
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
    let background =
      event.backgroundImageMetaData === null
        ? null
        : event.backgroundImageMetaData.path;
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
    let background =
      event.backgroundImageMetaData === null
        ? null
        : event.backgroundImageMetaData.path;
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
    let background =
      event.backgroundImageMetaData === null
        ? null
        : event.backgroundImageMetaData.path;
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
    let background =
      event.backgroundImageMetaData === null
        ? null
        : event.backgroundImageMetaData.path;
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
    let background =
      event.backgroundImageMetaData === null
        ? null
        : event.backgroundImageMetaData.path;
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
      let background =
        event.backgroundImageMetaData === null
          ? null
          : event.backgroundImageMetaData.path;
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
            backgroundImageMetaData: {
              select: {
                path: true,
              },
            },
            subline: true,
            description: true,
            startTime: true,
            endTime: true,
            participantLimit: true,
            external: true,
            openForRegistration: true,
            parentParticipationRequired: true,
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

  const participantOnEventInvites =
    await prismaClient.inviteForProfileToParticipateOnEvent.findMany({
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
            backgroundImageMetaData: {
              select: {
                path: true,
              },
            },
            subline: true,
            description: true,
            startTime: true,
            endTime: true,
            participantLimit: true,
            external: true,
            openForRegistration: true,
            parentParticipationRequired: true,
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
            backgroundImageMetaData: {
              select: {
                path: true,
              },
            },
            subline: true,
            description: true,
            startTime: true,
            endTime: true,
            participantLimit: true,
            external: true,
            openForRegistration: true,
            parentParticipationRequired: true,
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
    | (ArrayElement<typeof participantOnEventInvites> & {
        role: "participant";
      })[]
    | (Omit<ArrayElement<typeof organizationInvites>, "organizationId"> & {
        organizationId?: string;
        role: string;
      })[] = [
    ...profileInvites,
    ...participantOnEventInvites.map((invite) => {
      return { ...invite, role: "participant" };
    }),
    ...organizationInvites.map((invite) => {
      return {
        ...invite,
        role: "responsibleOrganization",
      };
    }),
  ];

  const enhancedInvites = mergedInvites.map((invite) => {
    let background =
      invite.event.backgroundImageMetaData === null
        ? null
        : invite.event.backgroundImageMetaData.path;
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
  const participantInvites = enhancedInvites.filter((invite) => {
    return invite.role === "participant";
  });
  const responsibleOrganizationInvites = enhancedInvites.filter((invite) => {
    return invite.role === "responsibleOrganization";
  });

  return {
    adminInvites,
    teamMemberInvites,
    speakerInvites,
    responsibleOrganizationInvites,
    participantInvites,
    count: {
      adminInvites: adminInvites.length,
      teamMemberInvites: teamMemberInvites.length,
      speakerInvites: speakerInvites.length,
      responsibleOrganizationInvites: responsibleOrganizationInvites.length,
      participantInvites: participantInvites.length,
    },
  };
}

export async function getEventsWithPendingRequests(
  id: string,
  authClient: SupabaseClient
) {
  const events = await prismaClient.event.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
      receivedParentEventJoinRequests: {
        select: {
          childEvent: {
            select: {
              id: true,
              name: true,
              slug: true,
              backgroundImageMetaData: {
                select: {
                  path: true,
                },
              },
              subline: true,
              description: true,
              stage: {
                select: {
                  slug: true,
                },
              },
              startTime: true,
              endTime: true,
              participantLimit: true,
              external: true,
              openForRegistration: true,
              parentParticipationRequired: true,
              _count: {
                select: {
                  participants: true,
                },
              },
            },
          },
          status: true,
        },
      },
    },
    where: {
      receivedParentEventJoinRequests: {
        some: {
          status: "pending",
        },
      },
      admins: {
        some: {
          profileId: id,
        },
      },
    },
    orderBy: {
      name: "asc",
    },
  });

  const enhancedEvents = events.map((event) => {
    const receivedParentEventJoinRequests =
      event.receivedParentEventJoinRequests.filter((relation) => {
        return relation.status === "pending";
      });
    const enhancedReceivedParentEventJoinRequests =
      receivedParentEventJoinRequests.map((request) => {
        let blurredBackground;
        let background =
          request.childEvent.backgroundImageMetaData === null
            ? null
            : request.childEvent.backgroundImageMetaData.path;
        if (background !== null) {
          const publicURL = getPublicURL(authClient, background);
          if (publicURL) {
            background = getImageURL(publicURL, {
              resize: {
                type: "fill",
                width: ImageSizes.Event.ListItem.Background.width,
                height: ImageSizes.Event.ListItem.Background.height,
              },
            });
            blurredBackground = getImageURL(publicURL, {
              resize: {
                type: "fill",
                width: ImageSizes.Event.ListItem.BlurredBackground.width,
                height: ImageSizes.Event.ListItem.BlurredBackground.height,
              },
              blur: BlurFactor,
            });
          }
        } else {
          background = DefaultImages.Event.Background;
          blurredBackground = DefaultImages.Event.BlurredBackground;
        }

        return {
          ...request,
          childEvent: {
            ...request.childEvent,
            background,
            blurredBackground,
          },
        };
      });
    return {
      ...event,
      receivedParentEventJoinRequests: enhancedReceivedParentEventJoinRequests,
    };
  });

  return enhancedEvents;
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

  const recipients = result.event.admins.filter((admin) => {
    return admin.profile.id !== userId;
  });

  // Do not block main thread while sending the mail
  void Promise.all(
    recipients.map(async (admin) => {
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

  const recipients = result.event.admins.filter((admin) => {
    return admin.profile.id !== userId;
  });

  // Do not block main thread while sending the mail
  void Promise.all(
    recipients.map(async (admin) => {
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

export async function acceptInviteAsParticipant(options: {
  userId: string;
  eventId: string;
  locales: {
    mail: {
      subject: string;
    };
  };
}) {
  const { userId, eventId } = options;

  const invite =
    await prismaClient.inviteForProfileToParticipateOnEvent.findUnique({
      where: {
        profileId_eventId: {
          eventId,
          profileId: userId,
        },
        status: "pending",
      },
      select: {
        event: {
          select: {
            parentParticipationRequired: true,
            parentEvent: {
              select: {
                id: true,
                parentParticipationRequired: true,
                participants: {
                  select: {
                    profileId: true,
                  },
                },
              },
            },
          },
        },
      },
    });

  if (invite === null) {
    throw new Error("Invite not found");
  }

  const transactions = [
    prismaClient.participantOfEvent.create({
      data: {
        eventId,
        profileId: userId,
      },
    }),
  ];

  if (
    invite.event.parentEvent !== null &&
    invite.event.parentEvent.parentParticipationRequired &&
    invite.event.parentEvent.participants.some(
      (relation) => relation.profileId === userId
    ) === false &&
    invite.event.parentParticipationRequired === true
  ) {
    transactions.push(
      prismaClient.participantOfEvent.create({
        data: {
          eventId: invite.event.parentEvent.id,
          profileId: userId,
        },
      })
    );
  }

  await prismaClient.$transaction(transactions);

  const result = await prismaClient.inviteForProfileToParticipateOnEvent.update(
    {
      where: {
        profileId_eventId: {
          eventId,
          profileId: userId,
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
    }
  );

  const sender = process.env.SYSTEM_MAIL_SENDER;
  const subject = options.locales.mail.subject;
  const textTemplatePath =
    "mail-templates/invites/profile-to-join-event/as-participant-accepted-text.hbs";
  const htmlTemplatePath =
    "mail-templates/invites/profile-to-join-event/as-participant-accepted-html.hbs";

  const recipients = result.event.admins.filter((admin) => {
    return admin.profile.id !== userId;
  });

  // Do not block main thread while sending the mail
  void Promise.all(
    recipients.map(async (admin) => {
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

export async function rejectInviteAsParticipant(options: {
  userId: string;
  eventId: string;
  locales: {
    mail: {
      subject: string;
    };
  };
}) {
  const { userId, eventId } = options;

  const invite =
    await prismaClient.inviteForProfileToParticipateOnEvent.findUnique({
      where: {
        profileId_eventId: {
          eventId,
          profileId: userId,
        },
        status: "pending",
      },
    });

  if (invite === null) {
    throw new Error("Invite not found");
  }

  const result = await prismaClient.inviteForProfileToParticipateOnEvent.update(
    {
      where: {
        profileId_eventId: {
          eventId,
          profileId: userId,
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
    }
  );

  const sender = process.env.SYSTEM_MAIL_SENDER;
  const subject = options.locales.mail.subject;
  const textTemplatePath =
    "mail-templates/invites/profile-to-join-event/as-participant-rejected-text.hbs";
  const htmlTemplatePath =
    "mail-templates/invites/profile-to-join-event/as-participant-rejected-html.hbs";

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

  const recipients = result.event.admins.filter((admin) => {
    return admin.profile.id !== userId;
  });

  // Do not block main thread while sending the mail
  void Promise.all(
    recipients.map(async (admin) => {
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

export async function acceptRequestAsParentEvent(options: {
  userId: string;
  childEventId: string;
  eventId: string;
  locales: {
    mail: {
      subject: string;
    };
  };
}) {
  const { userId, childEventId, eventId } = options;

  // check if request exists
  const request =
    await prismaClient.requestToParentEventToAddChildEvent.findUnique({
      where: {
        parentEventId_childEventId: {
          parentEventId: eventId,
          childEventId,
        },
        parentEvent: {
          admins: {
            some: {
              profileId: userId,
            },
          },
        },
        status: "pending",
      },
      select: {
        parentEvent: {
          select: {
            id: true,
            name: true,
            parentParticipationRequired: true,
            admins: {
              select: {
                profileId: true,
              },
            },
          },
        },
        childEvent: {
          select: {
            admins: {
              select: {
                profileId: true,
              },
            },
          },
        },
      },
    });

  if (request === null) {
    throw new Error("Request not found");
  }

  const missingAdmins = request.parentEvent.admins.filter((parentAdmin) => {
    return !request.childEvent.admins.some((childAdmin) => {
      return childAdmin.profileId === parentAdmin.profileId;
    });
  });

  const transactions =
    request.parentEvent.parentParticipationRequired === null
      ? [
          prismaClient.event.update({
            where: {
              id: request.parentEvent.id,
            },
            data: {
              parentParticipationRequired: true,
            },
          }),
        ]
      : [];

  const [childEvent] = await prismaClient.$transaction([
    prismaClient.event.update({
      where: {
        id: childEventId,
      },
      data: {
        parentEventId: eventId,
        sentParentEventJoinRequests: {
          updateMany: {
            where: {
              parentEventId: eventId,
              status: "pending",
            },
            data: {
              status: "accepted",
            },
          },
        },
      },
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
    }),
    prismaClient.adminOfEvent.createMany({
      data: missingAdmins.map((admin) => {
        return {
          profileId: admin.profileId,
          eventId: childEventId,
        };
      }),
    }),
    ...transactions,
  ]);

  const sender = process.env.SYSTEM_MAIL_SENDER;
  const subject = options.locales.mail.subject;
  const textTemplatePath =
    "mail-templates/requests/parent-event-to-add-child-event/accepted-text.hbs";
  const htmlTemplatePath =
    "mail-templates/requests/parent-event-to-add-child-event/accepted-html.hbs";

  const recipients = childEvent.admins.filter((admin) => {
    return admin.profile.id !== userId;
  });

  // Do not block main thread while sending the mail
  void Promise.all(
    recipients.map(async (admin) => {
      try {
        const recipient = admin.profile.email;
        const text = getCompiledMailTemplate<typeof textTemplatePath>(
          textTemplatePath,
          {
            firstName: admin.profile.firstName,
            event: { name: childEvent.name },
            parentEvent: {
              name: request.parentEvent.name,
            },
          },
          "text"
        );
        const html = getCompiledMailTemplate<typeof htmlTemplatePath>(
          htmlTemplatePath,
          {
            firstName: admin.profile.firstName,
            event: { name: childEvent.name },
            parentEvent: {
              name: request.parentEvent.name,
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

export async function rejectRequestAsParentEvent(options: {
  userId: string;
  childEventId: string;
  eventId: string;
  locales: {
    mail: {
      subject: string;
    };
  };
}) {
  const { userId, childEventId, eventId } = options;

  // check if request exists
  const request =
    await prismaClient.requestToParentEventToAddChildEvent.findUnique({
      where: {
        parentEventId_childEventId: {
          parentEventId: eventId,
          childEventId,
        },
        parentEvent: {
          admins: {
            some: {
              profileId: userId,
            },
          },
        },
        status: "pending",
      },
      select: {
        parentEvent: {
          select: {
            name: true,
          },
        },
      },
    });

  if (request === null) {
    throw new Error("Request not found");
  }

  const childEvent = await prismaClient.event.update({
    where: {
      id: childEventId,
    },
    data: {
      sentParentEventJoinRequests: {
        updateMany: {
          where: {
            parentEventId: eventId,
            status: "pending",
          },
          data: {
            status: "rejected",
          },
        },
      },
    },
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
  });

  const sender = process.env.SYSTEM_MAIL_SENDER;
  const subject = options.locales.mail.subject;
  const textTemplatePath =
    "mail-templates/requests/parent-event-to-add-child-event/rejected-text.hbs";
  const htmlTemplatePath =
    "mail-templates/requests/parent-event-to-add-child-event/rejected-html.hbs";

  const recipients = childEvent.admins.filter((admin) => {
    return admin.profile.id !== userId;
  });

  // Do not block main thread while sending the mail
  void Promise.all(
    recipients.map(async (admin) => {
      try {
        const recipient = admin.profile.email;
        const text = getCompiledMailTemplate<typeof textTemplatePath>(
          textTemplatePath,
          {
            firstName: admin.profile.firstName,
            event: { name: childEvent.name },
            parentEvent: {
              name: request.parentEvent.name,
            },
          },
          "text"
        );
        const html = getCompiledMailTemplate<typeof htmlTemplatePath>(
          htmlTemplatePath,
          {
            firstName: admin.profile.firstName,
            event: { name: childEvent.name },
            parentEvent: {
              name: request.parentEvent.name,
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
