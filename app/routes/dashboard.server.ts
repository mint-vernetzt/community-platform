import { type SupabaseClient, type User } from "@supabase/supabase-js";
import { type supportedCookieLanguages } from "~/i18n.shared";
import {
  BlurFactor,
  getImageURL,
  GravityType,
  ImageSizes,
} from "~/images.server";
import { DefaultImages } from "~/images.shared";
import { type ArrayElement } from "~/lib/utils/types";
import { type languageModuleMap } from "~/locales/.server";
import { prismaClient } from "~/prisma.server";
import { getPublicURL } from "~/storage.server";

export type DashboardLocales = (typeof languageModuleMap)[ArrayElement<
  typeof supportedCookieLanguages
>]["dashboard"];

export async function getProfileById(id: string, authClient?: SupabaseClient) {
  const profile = await prismaClient.profile.findUnique({
    where: { id },
    select: {
      firstName: true,
      lastName: true,
      username: true,
      avatar: true,
    },
  });

  if (profile === null) {
    return null;
  }

  if (
    typeof authClient !== "undefined" &&
    profile !== null &&
    profile.avatar !== null
  ) {
    const publicURL = getPublicURL(authClient, profile.avatar);
    if (publicURL !== null) {
      const avatar = getImageURL(publicURL, {
        resize: {
          type: "fill",
          width: ImageSizes.Profile.Dashboard.Avatar.width,
          height: ImageSizes.Profile.Dashboard.Avatar.height,
        },
        gravity: GravityType.center,
      });
      const blurredAvatar = getImageURL(publicURL, {
        resize: {
          type: "fill",
          width: ImageSizes.Profile.Dashboard.BlurredAvatar.width,
          height: ImageSizes.Profile.Dashboard.BlurredAvatar.height,
        },
        blur: BlurFactor,
      });
      return {
        ...profile,
        avatar,
        blurredAvatar,
      };
    }
  }

  return { ...profile, blurredAvatar: null, avatar: null };
}

export async function getProfilesForCards(take: number) {
  const profiles = await prismaClient.profile.findMany({
    select: {
      academicTitle: true,
      username: true,
      firstName: true,
      lastName: true,
      position: true,
      avatar: true,
      background: true,
      offers: { select: { offer: { select: { slug: true } } } },
      areas: { select: { area: { select: { name: true } } } },
      memberOf: {
        select: {
          organization: {
            select: {
              slug: true,
              logo: true,
              name: true,
            },
          },
        },
        orderBy: {
          organization: {
            updatedAt: "asc",
          },
        },
      },
      _count: {
        select: {
          memberOf: true,
        },
      },
    },
    take,
    orderBy: { createdAt: "desc" },
  });

  return profiles;
}

export async function getOrganizationsForCards(take: number) {
  const profiles = await prismaClient.organization.findMany({
    select: {
      slug: true,
      name: true,
      logo: true,
      background: true,
      focuses: { select: { focus: { select: { slug: true } } } },
      areas: { select: { area: { select: { name: true } } } },
      types: { select: { organizationType: { select: { slug: true } } } },
      networkTypes: { select: { networkType: { select: { slug: true } } } },
      teamMembers: {
        select: {
          profile: {
            select: {
              username: true,
              avatar: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: {
          profile: {
            updatedAt: "asc",
          },
        },
      },
      _count: {
        select: {
          memberOf: true,
        },
      },
    },
    take,
    orderBy: { createdAt: "desc" },
  });

  return profiles;
}

export async function getProjectsForCards(take: number) {
  const projects = await prismaClient.project.findMany({
    select: {
      slug: true,
      name: true,
      logo: true,
      subline: true,
      excerpt: true,
      background: true,
      responsibleOrganizations: {
        select: {
          organization: {
            select: {
              slug: true,
              logo: true,
              name: true,
            },
          },
        },
        orderBy: {
          organization: {
            updatedAt: "asc",
          },
        },
      },
    },
    where: {
      published: true,
    },
    take,
    orderBy: { createdAt: "desc" },
  });

  return projects;
}

export async function getEventsForCards(take: number) {
  const events = await prismaClient.event.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
      parentEventId: true,
      startTime: true,
      endTime: true,
      participationUntil: true,
      participationFrom: true,
      participantLimit: true,
      background: true,
      published: true,
      stage: {
        select: {
          slug: true,
        },
      },
      canceled: true,
      subline: true,
      description: true,
      _count: {
        select: {
          childEvents: true,
          participants: true,
          responsibleOrganizations: true,
          waitingList: true,
        },
      },
      responsibleOrganizations: {
        select: {
          organization: {
            select: {
              slug: true,
              name: true,
              logo: true,
            },
          },
        },
      },
    },
    where: {
      published: true,
      endTime: { gte: new Date() },
    },
    take,
    orderBy: { startTime: "asc" },
  });

  return events;
}

export async function enhanceEventsWithParticipationStatus(
  sessionUser: User | null,
  events: Awaited<ReturnType<typeof getEventsForCards>>
) {
  if (sessionUser === null) {
    const enhancedEvents = events.map((item) => {
      const isParticipant = false;
      const isOnWaitingList = false;
      const isSpeaker = false;
      const isTeamMember = false;

      return {
        ...item,
        isParticipant,
        isOnWaitingList,
        isSpeaker,
        isTeamMember,
      };
    });
    return enhancedEvents;
  } else {
    const eventIdsWhereParticipant = (
      await prismaClient.participantOfEvent.findMany({
        where: {
          profileId: sessionUser.id,
        },
        select: {
          eventId: true,
        },
      })
    ).map((event) => event.eventId);
    const eventIdsWhereOnWaitingList = (
      await prismaClient.waitingParticipantOfEvent.findMany({
        where: {
          profileId: sessionUser.id,
        },
        select: {
          eventId: true,
        },
      })
    ).map((event) => event.eventId);
    const eventIdsWhereSpeaker = (
      await prismaClient.speakerOfEvent.findMany({
        where: {
          profileId: sessionUser.id,
        },
        select: {
          eventId: true,
        },
      })
    ).map((event) => event.eventId);
    const eventIdsWhereTeamMember = (
      await prismaClient.teamMemberOfEvent.findMany({
        where: {
          profileId: sessionUser.id,
        },
        select: {
          eventId: true,
        },
      })
    ).map((event) => event.eventId);

    const enhancedEvents = events.map((item) => {
      const isParticipant = eventIdsWhereParticipant.includes(item.id);
      const isOnWaitingList = eventIdsWhereOnWaitingList.includes(item.id);
      const isSpeaker = eventIdsWhereSpeaker.includes(item.id);
      const isTeamMember = eventIdsWhereTeamMember.includes(item.id);

      return {
        ...item,
        isParticipant,
        isOnWaitingList,
        isSpeaker,
        isTeamMember,
      };
    });
    return enhancedEvents;
  }
}

export async function getOrganizationMemberInvites(
  authClient: SupabaseClient,
  profileId: string
) {
  const organizationMemberInvites =
    await prismaClient.inviteForProfileToJoinOrganization.findMany({
      where: {
        profileId,
        status: "pending",
      },
      select: {
        organization: {
          select: {
            name: true,
            logo: true,
            slug: true,
          },
        },
      },
    });

  const enhancedOrganizationMemberInvites = organizationMemberInvites.map(
    (relation) => {
      if (relation.organization.logo !== null) {
        const publicURL = getPublicURL(authClient, relation.organization.logo);
        if (publicURL !== null) {
          const logo = getImageURL(publicURL, {
            resize: {
              type: "fill",
              width: ImageSizes.Organization.ListItem.Logo.width,
              height: ImageSizes.Organization.ListItem.Logo.height,
            },
            gravity: GravityType.center,
          });
          const blurredLogo = getImageURL(publicURL, {
            resize: {
              type: "fill",
              width: ImageSizes.Organization.ListItem.BlurredLogo.width,
              height: ImageSizes.Organization.ListItem.BlurredLogo.height,
            },
            blur: BlurFactor,
          });
          return {
            ...relation,
            organization: { ...relation.organization, logo, blurredLogo },
          };
        }
      }
      return relation;
    }
  );

  const flat = enhancedOrganizationMemberInvites.map((relation) => {
    return {
      ...relation.organization,
    };
  });

  return flat;
}

export async function getOrganizationMemberRequests(
  authClient: SupabaseClient,
  profileId: string
) {
  const organizationMemberRequests =
    await prismaClient.requestToOrganizationToAddProfile.findMany({
      where: {
        organization: {
          admins: {
            some: {
              profileId,
            },
          },
        },
        status: "pending",
      },
      select: {
        profile: {
          select: {
            firstName: true,
            lastName: true,
            avatar: true,
            username: true,
          },
        },
      },
    });

  const enhancedOrganizationMemberRequests = organizationMemberRequests.map(
    (relation) => {
      if (relation.profile.avatar !== null) {
        const publicURL = getPublicURL(authClient, relation.profile.avatar);
        if (publicURL !== null) {
          const avatar = getImageURL(publicURL, {
            resize: {
              type: "fill",
              width: ImageSizes.Profile.ListItem.Avatar.width,
              height: ImageSizes.Profile.ListItem.Avatar.height,
            },
            gravity: GravityType.center,
          });
          const blurredAvatar = getImageURL(publicURL, {
            resize: {
              type: "fill",
              width: ImageSizes.Profile.ListItem.BlurredAvatar.width,
              height: ImageSizes.Profile.ListItem.BlurredAvatar.height,
            },
            blur: BlurFactor,
          });
          return {
            ...relation,
            profile: { ...relation.profile, avatar, blurredAvatar },
          };
        }
      }
      return relation;
    }
  );

  const flat = enhancedOrganizationMemberRequests.map((relation) => {
    return {
      ...relation.profile,
    };
  });

  return flat;
}

export async function getNetworkInvites(
  authClient: SupabaseClient,
  profileId: string
) {
  const adminOrganizations = await prismaClient.organization.findMany({
    where: {
      admins: {
        some: {
          profileId,
        },
      },
    },
    select: {
      id: true,
    },
  });

  const networkInvites =
    await prismaClient.inviteForOrganizationToJoinNetwork.findMany({
      where: {
        organizationId: {
          in: adminOrganizations.map((organization) => organization.id),
        },
        status: "pending",
      },
      select: {
        network: {
          select: {
            name: true,
            logo: true,
            slug: true,
          },
        },
      },
    });

  const enhancedNetworkInvites = networkInvites.map((relation) => {
    if (relation.network.logo !== null) {
      const publicURL = getPublicURL(authClient, relation.network.logo);
      if (publicURL !== null) {
        const logo = getImageURL(publicURL, {
          resize: {
            type: "fill",
            width: ImageSizes.Organization.ListItem.Logo.width,
            height: ImageSizes.Organization.ListItem.Logo.height,
          },
          gravity: GravityType.center,
        });
        const blurredLogo = getImageURL(publicURL, {
          resize: {
            type: "fill",
            width: ImageSizes.Organization.ListItem.BlurredLogo.width,
            height: ImageSizes.Organization.ListItem.BlurredLogo.height,
          },
          blur: BlurFactor,
        });
        return {
          ...relation,
          network: { ...relation.network, logo, blurredLogo },
        };
      }
    }
    return relation;
  });

  const flat = enhancedNetworkInvites.map((relation) => {
    return {
      ...relation.network,
    };
  });

  return flat;
}

export async function getNetworkRequests(
  authClient: SupabaseClient,
  profileId: string
) {
  const adminOrganizations = await prismaClient.organization.findMany({
    where: {
      admins: {
        some: {
          profileId,
        },
      },
    },
    select: {
      id: true,
    },
  });

  const networkRequests =
    await prismaClient.requestToNetworkToAddOrganization.findMany({
      where: {
        networkId: {
          in: adminOrganizations.map((organization) => organization.id),
        },
        status: "pending",
      },
      select: {
        organization: {
          select: {
            name: true,
            logo: true,
            slug: true,
          },
        },
      },
    });

  const enhancedNetworkRequests = networkRequests.map((relation) => {
    if (relation.organization.logo !== null) {
      const publicURL = getPublicURL(authClient, relation.organization.logo);
      if (publicURL !== null) {
        const logo = getImageURL(publicURL, {
          resize: {
            type: "fill",
            width: ImageSizes.Organization.ListItem.Logo.width,
            height: ImageSizes.Organization.ListItem.Logo.height,
          },
          gravity: GravityType.center,
        });
        const blurredLogo = getImageURL(publicURL, {
          resize: {
            type: "fill",
            width: ImageSizes.Organization.ListItem.BlurredLogo.width,
            height: ImageSizes.Organization.ListItem.BlurredLogo.height,
          },
          blur: BlurFactor,
        });
        return {
          ...relation,
          organization: { ...relation.organization, logo, blurredLogo },
        };
      }
    }
    return relation;
  });

  const flat = enhancedNetworkRequests.map((relation) => {
    return {
      ...relation.organization,
    };
  });

  return flat;
}

export async function getUpcomingCanceledEvents(
  authClient: SupabaseClient,
  sessionUser: User
) {
  const upcomingCanceledEvents = await prismaClient.event.findMany({
    select: {
      slug: true,
      name: true,
      background: true,
    },
    where: {
      canceled: true,
      startTime: { gte: new Date() },
      participants: {
        some: {
          profileId: sessionUser.id,
        },
      },
    },
    orderBy: { startTime: "asc" },
  });

  const enhancedEvents = upcomingCanceledEvents.map((event) => {
    let background = event.background;
    let blurredBackground;
    if (background !== null) {
      const publicURL = getPublicURL(authClient, background);
      background = getImageURL(publicURL, {
        resize: {
          type: "fill",
          ...ImageSizes.Event.ListItemDashboard.Background,
        },
      });
      blurredBackground = getImageURL(publicURL, {
        resize: {
          type: "fill",
          width: ImageSizes.Event.ListItemDashboard.BlurredBackground.width,
          height: ImageSizes.Event.ListItemDashboard.BlurredBackground.height,
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

  return enhancedEvents;
}
