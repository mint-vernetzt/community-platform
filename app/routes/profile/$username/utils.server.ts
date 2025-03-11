import type { Profile } from "@prisma/client";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { BlurFactor, getImageURL, ImageSizes } from "~/images.server";
import { DefaultImages } from "~/images.shared";
import { invariantResponse } from "~/lib/utils/response";
import {
  filterEventByVisibility,
  filterOrganizationByVisibility,
  filterProfileByVisibility,
  filterProjectByVisibility,
} from "~/next-public-fields-filtering.server";
import { prismaClient } from "~/prisma.server";
import { getPublicURL } from "~/storage.server";
import { deriveMode, triggerEntityScore, type Mode } from "~/utils.server";
import { type ProfileQuery } from "./index.server";

export type ProfileMode = Mode | "owner";

export async function deriveProfileMode(
  sessionUser: User | null,
  username: string
): Promise<ProfileMode> {
  const mode = deriveMode(sessionUser);
  const profile = await prismaClient.profile.findFirst({
    where: {
      username,
      id: sessionUser?.id || "",
    },
    select: {
      id: true,
    },
  });
  if (profile !== null) {
    return "owner";
  }
  return mode;
}

export async function getRedirectPathOnProtectedProfileRoute(args: {
  request: Request;
  username: string;
  sessionUser: User | null;
  authClient?: SupabaseClient;
}) {
  const { request, username, sessionUser } = args;
  // redirect to login if not logged in
  if (sessionUser === null) {
    // redirect to target after login
    // TODO: Maybe rename login_redirect to redirect_to everywhere?
    const url = new URL(request.url);
    return `/login?login_redirect=${url.pathname}`;
  }

  // check if owner of profile and redirect to profile details if not
  const mode = await deriveProfileMode(sessionUser, username);
  if (mode !== "owner") {
    return `/profile/${username}`;
  }

  return null;
}

export async function getWholeProfileFromUsername(username: string) {
  const result = await prismaClient.profile.findFirst({
    where: { username },
    select: {
      id: true,
      academicTitle: true,
      position: true,
      firstName: true,
      lastName: true,
      email: true,
      email2: true,
      phone: true,
      bio: true,
      skills: true,
      interests: true,
      website: true,
      linkedin: true,
      twitter: true,
      xing: true,
      instagram: true,
      youtube: true,
      facebook: true,
      mastodon: true,
      tiktok: true,
      areas: { select: { area: { select: { id: true } } } },
      offers: { select: { offer: { select: { id: true } } } },
      seekings: { select: { offer: { select: { id: true } } } },
    },
  });
  return result;
}

export async function getProfileVisibilitiesById(id: string) {
  const result = await prismaClient.profileVisibility.findFirst({
    where: {
      profile: {
        id,
      },
    },
  });
  return result;
}

export async function updateProfileById(
  id: string,
  profileData: Omit<
    Profile,
    | "id"
    | "username"
    | "avatar"
    | "background"
    | "createdAt"
    | "updatedAt"
    | "termsAccepted"
    | "termsAcceptedAt"
  > & {
    areas: string[];
  } & {
    offers: string[];
  } & {
    seekings: string[];
  },
  privateFields: string[]
) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { email: _email, ...rest } = profileData;

  const profileVisibility = await prismaClient.profileVisibility.findFirst({
    where: {
      profile: {
        id,
      },
    },
  });
  if (profileVisibility === null) {
    invariantResponse(false, "Profile visibilities not found", { status: 404 });
  }

  let visibility: keyof typeof profileVisibility;
  for (visibility in profileVisibility) {
    if (
      visibility !== "id" &&
      visibility !== "profileId" &&
      visibility in profileVisibility
    ) {
      profileVisibility[visibility] = !privateFields.includes(`${visibility}`);
    }
  }
  await prismaClient.$transaction([
    prismaClient.profile.update({
      where: {
        id,
      },
      data: {
        ...rest,
        areas: {
          deleteMany: {},
          connectOrCreate: profileData.areas.map((areaId) => ({
            where: {
              profileId_areaId: { areaId, profileId: id },
            },
            create: {
              areaId,
            },
          })),
        },
        offers: {
          deleteMany: {},
          connectOrCreate: profileData.offers.map((offerId) => ({
            where: {
              profileId_offerId: { offerId, profileId: id },
            },
            create: {
              offerId,
            },
          })),
        },
        seekings: {
          deleteMany: {},
          connectOrCreate: profileData.seekings.map((offerId) => ({
            where: {
              profileId_offerId: { offerId, profileId: id },
            },
            create: {
              offerId,
            },
          })),
        },
        updatedAt: new Date(),
      },
    }),
    prismaClient.profileVisibility.update({
      where: {
        id: profileVisibility.id,
      },
      data: profileVisibility,
    }),
  ]);

  triggerEntityScore({ entity: "profile", where: { id } });

  updateFilterVectorOfProfile(id);
}

export async function updateFilterVectorOfProfile(profileId: string) {
  const profile = await prismaClient.profile.findFirst({
    where: { id: profileId },
    select: {
      id: true,
      username: true,
      offers: { select: { offer: { select: { slug: true } } } },
      areas: { select: { area: { select: { slug: true } } } },
    },
  });
  if (profile !== null) {
    if (profile.offers.length === 0 && profile.areas.length === 0) {
      await prismaClient.$queryRawUnsafe(
        `update profiles set filter_vector = NULL where id = '${profile.id}'`
      );
    } else {
      const offerVectors = profile.offers.map(
        (relation) => `offer:${relation.offer.slug}`
      );
      const areaVectors = profile.areas.map(
        (relation) => `area:${relation.area.slug}`
      );
      const vectors = [...offerVectors, ...areaVectors];
      const vectorString = `{"${vectors.join(`","`)}"}`;
      const query = `update profiles set filter_vector = array_to_tsvector('${vectorString}') where id = '${profile.id}'`;
      await prismaClient.$queryRawUnsafe(query);
    }
  }
}

export function addImgUrls(authClient: SupabaseClient, profile: ProfileQuery) {
  let avatar = profile.avatar;
  let blurredAvatar;
  if (avatar !== null) {
    const publicURL = getPublicURL(authClient, avatar);
    if (publicURL !== null) {
      avatar = getImageURL(publicURL, {
        resize: { type: "fill", ...ImageSizes.Profile.Detail.Avatar },
      });
      blurredAvatar = getImageURL(publicURL, {
        resize: { type: "fill", ...ImageSizes.Profile.Detail.BlurredAvatar },
        blur: BlurFactor,
      });
    }
  }
  let background = profile.background;
  let blurredBackground;
  if (background !== null) {
    const publicURL = getPublicURL(authClient, background);
    if (publicURL !== null) {
      background = getImageURL(publicURL, {
        resize: { type: "fill", ...ImageSizes.Profile.Detail.Background },
      });
      blurredBackground = getImageURL(publicURL, {
        resize: {
          type: "fill",
          ...ImageSizes.Profile.Detail.BlurredBackground,
        },
        blur: BlurFactor,
      });
    }
  }
  const memberOf = profile.memberOf.map((relation) => {
    let logo = relation.organization.logo;
    let blurredLogo;
    if (logo !== null) {
      const publicURL = getPublicURL(authClient, logo);
      if (publicURL !== null) {
        logo = getImageURL(publicURL, {
          resize: {
            type: "fill",
            ...ImageSizes.Organization.ListItemProfileDetail.Logo,
          },
        });
        blurredLogo = getImageURL(publicURL, {
          resize: {
            type: "fill",
            ...ImageSizes.Organization.ListItemProfileDetail.BlurredLogo,
          },
          blur: BlurFactor,
        });
      }
    }
    return {
      ...relation,
      organization: { ...relation.organization, logo, blurredLogo },
    };
  });
  const teamMemberOfProjects = profile.teamMemberOfProjects.map(
    (projectRelation) => {
      let projectLogo = projectRelation.project.logo;
      let blurredLogo;
      if (projectLogo !== null) {
        const publicURL = getPublicURL(authClient, projectLogo);
        if (publicURL !== null) {
          projectLogo = getImageURL(publicURL, {
            resize: {
              type: "fill",
              ...ImageSizes.Project.ListItemProfileDetail.Logo,
            },
          });
          blurredLogo = getImageURL(publicURL, {
            resize: {
              type: "fill",
              ...ImageSizes.Project.ListItemProfileDetail.BlurredLogo,
            },
            blur: BlurFactor,
          });
        }
      }
      return {
        ...projectRelation,
        project: { ...projectRelation.project, logo: projectLogo, blurredLogo },
      };
    }
  );

  const teamMemberOfEvents = profile.teamMemberOfEvents.map((relation) => {
    let background = relation.event.background;
    let blurredBackground;
    if (background !== null) {
      const publicURL = getPublicURL(authClient, background);
      if (publicURL) {
        background = getImageURL(publicURL, {
          resize: {
            type: "fill",
            ...ImageSizes.Event.ListItem.Background,
          },
        });
        blurredBackground = getImageURL(publicURL, {
          resize: {
            type: "fill",
            ...ImageSizes.Event.ListItem.BlurredBackground,
          },
          blur: BlurFactor,
        });
      }
    } else {
      background = DefaultImages.Event.Background;
      blurredBackground = DefaultImages.Event.BlurredBackground;
    }
    return {
      ...relation,
      event: { ...relation.event, background, blurredBackground },
    };
  });

  const contributedEvents = profile.contributedEvents.map((relation) => {
    let background = relation.event.background;
    let blurredBackground;
    if (background !== null) {
      const publicURL = getPublicURL(authClient, background);
      if (publicURL) {
        background = getImageURL(publicURL, {
          resize: {
            type: "fill",
            ...ImageSizes.Event.ListItem.Background,
          },
        });
        blurredBackground = getImageURL(publicURL, {
          resize: {
            type: "fill",
            ...ImageSizes.Event.ListItem.BlurredBackground,
          },
          blur: BlurFactor,
        });
      }
    } else {
      background = DefaultImages.Event.Background;
      blurredBackground = DefaultImages.Event.BlurredBackground;
    }
    return {
      ...relation,
      event: { ...relation.event, background, blurredBackground },
    };
  });

  const participatedEvents = profile.participatedEvents.map((relation) => {
    let background = relation.event.background;
    let blurredBackground;
    if (background !== null) {
      const publicURL = getPublicURL(authClient, background);
      if (publicURL) {
        background = getImageURL(publicURL, {
          resize: {
            type: "fill",
            ...ImageSizes.Event.ListItem.Background,
          },
        });
        blurredBackground = getImageURL(publicURL, {
          resize: {
            type: "fill",
            ...ImageSizes.Event.ListItem.BlurredBackground,
          },
          blur: BlurFactor,
        });
      }
    } else {
      background = DefaultImages.Event.Background;
      blurredBackground = DefaultImages.Event.BlurredBackground;
    }
    return {
      ...relation,
      event: { ...relation.event, background, blurredBackground },
    };
  });

  const waitingForEvents = profile.waitingForEvents.map((relation) => {
    let background = relation.event.background;
    let blurredBackground;
    if (background !== null) {
      const publicURL = getPublicURL(authClient, background);
      if (publicURL) {
        background = getImageURL(publicURL, {
          resize: {
            type: "fill",
            ...ImageSizes.Event.ListItem.Background,
          },
        });
        blurredBackground = getImageURL(publicURL, {
          resize: {
            type: "fill",
            ...ImageSizes.Event.ListItem.BlurredBackground,
          },
          blur: BlurFactor,
        });
      }
    } else {
      background = DefaultImages.Event.Background;
      blurredBackground = DefaultImages.Event.BlurredBackground;
    }
    return {
      ...relation,
      event: { ...relation.event, background, blurredBackground },
    };
  });

  const administeredEvents = profile.administeredEvents.map((relation) => {
    let background = relation.event.background;
    let blurredBackground;
    if (background !== null) {
      const publicURL = getPublicURL(authClient, background);
      if (publicURL) {
        background = getImageURL(publicURL, {
          resize: {
            type: "fill",
            ...ImageSizes.Event.ListItem.Background,
          },
        });
        blurredBackground = getImageURL(publicURL, {
          resize: {
            type: "fill",
            ...ImageSizes.Event.ListItem.BlurredBackground,
          },
          blur: BlurFactor,
        });
      }
    } else {
      background = DefaultImages.Event.Background;
      blurredBackground = DefaultImages.Event.BlurredBackground;
    }
    return {
      ...relation,
      event: { ...relation.event, background, blurredBackground },
    };
  });

  return {
    ...profile,
    avatar,
    blurredAvatar,
    background,
    blurredBackground,
    memberOf,
    teamMemberOfProjects,
    teamMemberOfEvents,
    contributedEvents,
    participatedEvents,
    waitingForEvents,
    administeredEvents,
  };
}

export function filterProfile(profile: ProfileQuery) {
  let enhancedProfile = {
    ...profile,
  };
  // Filter profile
  enhancedProfile =
    filterProfileByVisibility<typeof enhancedProfile>(enhancedProfile);

  // Filter organizations where profile is member of
  enhancedProfile.memberOf = enhancedProfile.memberOf.map((relation) => {
    const filteredOrganization = filterOrganizationByVisibility<
      typeof relation.organization
    >(relation.organization);
    return { ...relation, organization: filteredOrganization };
  });
  // Filter projects where this profile is team member
  enhancedProfile.teamMemberOfProjects =
    enhancedProfile.teamMemberOfProjects.map((relation) => {
      const filteredProject = filterProjectByVisibility<
        typeof relation.project
      >(relation.project);
      return { ...relation, project: filteredProject };
    });
  // Filter organizations that are responsible for projects where this profile is team member
  enhancedProfile.teamMemberOfProjects =
    enhancedProfile.teamMemberOfProjects.map((projectRelation) => {
      const responsibleOrganizations =
        projectRelation.project.responsibleOrganizations.map(
          (organizationRelation) => {
            const filteredOrganization = filterOrganizationByVisibility<
              typeof organizationRelation.organization
            >(organizationRelation.organization);
            return {
              ...organizationRelation,
              organization: filteredOrganization,
            };
          }
        );
      return {
        ...projectRelation,
        project: { ...projectRelation.project, responsibleOrganizations },
      };
    });
  // Filter events where profile is team member
  enhancedProfile.teamMemberOfEvents = enhancedProfile.teamMemberOfEvents.map(
    (relation) => {
      const filteredEvent = filterEventByVisibility<typeof relation.event>(
        relation.event
      );
      return { ...relation, event: filteredEvent };
    }
  );
  // Filter events where profile is speaker
  enhancedProfile.contributedEvents = enhancedProfile.contributedEvents.map(
    (relation) => {
      const filteredEvent = filterEventByVisibility<typeof relation.event>(
        relation.event
      );
      return { ...relation, event: filteredEvent };
    }
  );
  // Filter events where profile is participant
  enhancedProfile.participatedEvents = enhancedProfile.participatedEvents.map(
    (relation) => {
      const filteredEvent = filterEventByVisibility<typeof relation.event>(
        relation.event
      );
      return { ...relation, event: filteredEvent };
    }
  );
  // Filter events where profile is on waiting list
  enhancedProfile.waitingForEvents = enhancedProfile.waitingForEvents.map(
    (relation) => {
      const filteredEvent = filterEventByVisibility<typeof relation.event>(
        relation.event
      );
      return { ...relation, event: filteredEvent };
    }
  );
  // Filter events where profile is administrator
  enhancedProfile.administeredEvents = enhancedProfile.administeredEvents.map(
    (relation) => {
      const filteredEvent = filterEventByVisibility<typeof relation.event>(
        relation.event
      );
      return { ...relation, event: filteredEvent };
    }
  );

  return enhancedProfile;
}

export function splitEventsIntoFutureAndPast<
  T extends Pick<
    ProfileQuery,
    | "contributedEvents"
    | "teamMemberOfEvents"
    | "participatedEvents"
    | "administeredEvents"
  >
>(events: T) {
  const futureEvents: Pick<
    ProfileQuery,
    | "contributedEvents"
    | "teamMemberOfEvents"
    | "participatedEvents"
    | "administeredEvents"
  > = {
    contributedEvents: [],
    teamMemberOfEvents: [],
    participatedEvents: [],
    administeredEvents: [],
  };
  const pastEvents: Pick<
    ProfileQuery,
    | "contributedEvents"
    | "teamMemberOfEvents"
    | "participatedEvents"
    | "administeredEvents"
  > = {
    contributedEvents: [],
    teamMemberOfEvents: [],
    participatedEvents: [],
    administeredEvents: [],
  };
  const now = new Date();

  for (const relation of events.contributedEvents) {
    if (relation.event.endTime >= now) {
      futureEvents.contributedEvents.push(relation);
    } else {
      pastEvents.contributedEvents.push(relation);
    }
  }
  for (const relation of events.participatedEvents) {
    if (relation.event.endTime >= now) {
      futureEvents.participatedEvents.push(relation);
    } else {
      pastEvents.participatedEvents.push(relation);
    }
  }
  for (const relation of events.teamMemberOfEvents) {
    if (relation.event.endTime >= now) {
      futureEvents.teamMemberOfEvents.push(relation);
    } else {
      pastEvents.teamMemberOfEvents.push(relation);
    }
  }
  for (const relation of events.administeredEvents) {
    if (relation.event.endTime >= now) {
      futureEvents.administeredEvents.push(relation);
    } else {
      pastEvents.administeredEvents.push(relation);
    }
  }
  return {
    futureEvents,
    pastEvents,
  } as { futureEvents: T; pastEvents: T };
}

export function sortEvents<
  T extends Pick<
    ProfileQuery,
    | "contributedEvents"
    | "teamMemberOfEvents"
    | "participatedEvents"
    | "administeredEvents"
  >
>(
  events: Pick<
    ProfileQuery,
    | "contributedEvents"
    | "participatedEvents"
    | "teamMemberOfEvents"
    | "administeredEvents"
  >,
  inFuture: boolean
) {
  const sortedEvents = {
    contributedEvents: events.contributedEvents.sort((a, b) => {
      if (inFuture) {
        return a.event.startTime >= b.event.startTime ? 1 : -1;
      }
      return a.event.startTime >= b.event.startTime ? -1 : 1;
    }),
    participatedEvents: events.participatedEvents.sort((a, b) => {
      if (inFuture) {
        return a.event.startTime >= b.event.startTime ? 1 : -1;
      }
      return a.event.startTime >= b.event.startTime ? -1 : 1;
    }),
    teamMemberOfEvents: events.teamMemberOfEvents.sort((a, b) => {
      if (inFuture) {
        return a.event.startTime >= b.event.startTime ? 1 : -1;
      }
      return a.event.startTime >= b.event.startTime ? -1 : 1;
    }),
    administeredEvents: events.administeredEvents.sort((a, b) => {
      if (inFuture) {
        return a.event.startTime >= b.event.startTime ? 1 : -1;
      }
      return a.event.startTime >= b.event.startTime ? -1 : 1;
    }),
  };
  return sortedEvents as T;
}
