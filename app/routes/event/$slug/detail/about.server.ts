import { parseWithZod } from "@conform-to/zod";
import { type SupabaseClient, type User } from "@supabase/supabase-js";
import { utcToZonedTime } from "date-fns-tz";
import { BlurFactor, getImageURL, ImageSizes } from "~/images.server";
import { invariantResponse } from "~/lib/utils/response";
import { filterProfileByVisibility } from "~/next-public-fields-filtering.server";
import { prismaClient } from "~/prisma.server";
import { getPublicURL } from "~/storage.server";
import { deriveModeForEvent, getIsMember } from "../detail.server";
import { filterEventConferenceLink } from "../utils.server";
import {
  getSearchResponsibleOrganizationsSchema,
  getSearchSpeakersSchema,
  getSearchTeamMembersSchema,
  SEARCH_RESPONSIBLE_ORGANIZATIONS_SEARCH_PARAM,
  SEARCH_SPEAKERS_SEARCH_PARAM,
  SEARCH_TEAM_MEMBERS_SEARCH_PARAM,
} from "./about.shared";

export async function getEventBySlug(options: {
  slug: string;
  authClient: SupabaseClient;
  sessionUser: User | null;
  searchParams: URLSearchParams;
  locales: {
    eventNotFound: string;
  };
}) {
  const { slug, authClient, sessionUser, searchParams, locales } = options;

  const teamMembersSubmission = parseWithZod(searchParams, {
    schema: getSearchTeamMembersSchema(),
  });

  const responsibleOrganizationsSubmission = parseWithZod(searchParams, {
    schema: getSearchResponsibleOrganizationsSchema(),
  });

  const speakersSubmission = parseWithZod(searchParams, {
    schema: getSearchSpeakersSchema(),
  });

  let teamMembersWhere;
  let responsibleOrganizationsWhere;
  let speakersWhere;

  if (
    teamMembersSubmission.status === "success" &&
    typeof teamMembersSubmission.value[SEARCH_TEAM_MEMBERS_SEARCH_PARAM] !==
      "undefined"
  ) {
    const query =
      teamMembersSubmission.value[
        SEARCH_TEAM_MEMBERS_SEARCH_PARAM
      ].trim().split(" ");
    teamMembersWhere = {
      profile: {
        OR: query.map((term) => {
          return {
            OR: [
              { firstName: { contains: term, mode: "insensitive" as const } },
              { lastName: { contains: term, mode: "insensitive" as const } },
              { username: { contains: term, mode: "insensitive" as const } },
            ],
          };
        }),
      },
    };
  }

  if (
    responsibleOrganizationsSubmission.status === "success" &&
    typeof responsibleOrganizationsSubmission.value[
      SEARCH_RESPONSIBLE_ORGANIZATIONS_SEARCH_PARAM
    ] !== "undefined"
  ) {
    const query =
      responsibleOrganizationsSubmission.value[
        SEARCH_RESPONSIBLE_ORGANIZATIONS_SEARCH_PARAM
      ].trim().split(" ");
    responsibleOrganizationsWhere = {
      organization: {
        OR: query.map((term) => {
          return {
            OR: [
              { name: { contains: term, mode: "insensitive" as const } },
              { slug: { contains: term, mode: "insensitive" as const } },
            ],
          };
        }),
      },
    };
  }

  if (
    speakersSubmission.status === "success" &&
    typeof speakersSubmission.value[SEARCH_SPEAKERS_SEARCH_PARAM] !==
      "undefined"
  ) {
    const query =
      speakersSubmission.value[SEARCH_SPEAKERS_SEARCH_PARAM].trim().split(" ");
    speakersWhere = {
      profile: {
        OR: query.map((term) => {
          return {
            OR: [
              { firstName: { contains: term, mode: "insensitive" as const } },
              { lastName: { contains: term, mode: "insensitive" as const } },
              { username: { contains: term, mode: "insensitive" as const } },
            ],
          };
        }),
      },
    };
  }

  const event = await prismaClient.event.findUnique({
    where: { slug },
    select: {
      id: true,
      slug: true,
      types: {
        select: {
          eventType: {
            select: {
              slug: true,
            },
          },
        },
      },
      subline: true,
      description: true,
      venueName: true,
      venueStreet: true,
      venueZipCode: true,
      venueCity: true,
      conferenceLink: true,
      conferenceCode: true,
      startTime: true,
      endTime: true,
      participationFrom: true,
      participationUntil: true,
      participantLimit: true,
      canceled: true,
      accessibilityInformation: true,
      privacyInformation: true,
      eventTargetGroups: {
        select: {
          eventTargetGroup: {
            select: {
              slug: true,
            },
          },
        },
      },
      focuses: {
        select: {
          focus: {
            select: {
              slug: true,
            },
          },
        },
      },
      experienceLevel: {
        select: {
          slug: true,
        },
      },
      tags: {
        select: {
          tag: {
            select: {
              slug: true,
            },
          },
        },
      },
      teamMembers: {
        where: teamMembersWhere,
        select: {
          profile: {
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
          },
        },
      },
      responsibleOrganizations: {
        where: responsibleOrganizationsWhere,
        select: {
          organization: {
            select: {
              id: true,
              name: true,
              slug: true,
              logo: true,
              types: {
                select: {
                  organizationType: {
                    select: {
                      slug: true,
                    },
                  },
                },
              },
              networkTypes: {
                select: {
                  networkType: {
                    select: {
                      slug: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
      speakers: {
        where: speakersWhere,
        select: {
          profile: {
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
          },
        },
      },
      childEvents: {
        where: {
          OR: [
            { published: true },
            sessionUser !== null
              ? {
                  teamMembers: {
                    some: { profileId: sessionUser?.id },
                  },
                  admins: {
                    some: { profileId: sessionUser?.id },
                  },
                  speakers: {
                    some: { profileId: sessionUser?.id },
                  },
                }
              : {},
          ],
        },
        select: {
          speakers: {
            where: speakersWhere,
            select: {
              profile: {
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
              },
            },
          },
        },
      },
      documents: {
        select: {
          document: {
            select: {
              id: true,
              filename: true,
              sizeInMB: true,
              title: true,
              credits: true,
              mimeType: true,
              path: true,
            },
          },
        },
      },
      stage: {
        select: {
          slug: true,
        },
      },
      _count: {
        select: {
          participants: true,
        },
      },
    },
  });

  invariantResponse(event, locales.eventNotFound, { status: 404 });

  const now = utcToZonedTime(new Date(), "Europe/Berlin");
  const endTime = utcToZonedTime(event.endTime, "Europe/Berlin");
  const participationFrom = utcToZonedTime(
    event.participationFrom,
    "Europe/Berlin"
  );
  const participationUntil = utcToZonedTime(
    event.participationUntil,
    "Europe/Berlin"
  );

  const beforeParticipationPeriod = now < participationFrom;
  const afterParticipationPeriod = now > participationUntil;
  const inPast = now > endTime;

  const mode = await deriveModeForEvent(sessionUser, {
    ...event,
    participantCount: event._count.participants,
    beforeParticipationPeriod,
    afterParticipationPeriod,
    inPast,
  });

  const isMember = await getIsMember(sessionUser, event);
  const { conferenceLink, conferenceCode, conferenceLinkToBeAnnounced } =
    await filterEventConferenceLink({
      event,
      mode,
      isMember,
      inPast,
    });

  const teamMembers = event.teamMembers.map((relation) => {
    let filteredProfile;
    if (sessionUser === null) {
      filteredProfile = filterProfileByVisibility<typeof relation.profile>(
        relation.profile
      );
    } else {
      filteredProfile = relation.profile;
    }
    let avatar = filteredProfile.avatar;
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
      ...filteredProfile,
      avatar,
      blurredAvatar,
    };
  });

  const responsibleOrganizations = event.responsibleOrganizations.map(
    (relation) => {
      let logo = relation.organization.logo;
      let blurredLogo;
      if (logo !== null) {
        const publicURL = getPublicURL(authClient, logo);
        if (publicURL !== null) {
          logo = getImageURL(publicURL, {
            resize: {
              type: "fill",
              ...ImageSizes.Organization.ListItem.Logo,
            },
          });
          blurredLogo = getImageURL(publicURL, {
            resize: {
              type: "fill",
              ...ImageSizes.Organization.ListItem.BlurredLogo,
            },
            blur: BlurFactor,
          });
        }
      }
      return {
        ...relation.organization,
        logo,
        blurredLogo,
      };
    }
  );

  const eventSpeakers = event.speakers.map((relation) => relation.profile);
  const childEventSpeakers = event.childEvents.flatMap((childEvent) =>
    childEvent.speakers.map((relation) => relation.profile)
  );

  const combinedUniqueSpeakers = [
    ...new Map(
      [...eventSpeakers, ...childEventSpeakers].map((profile) => [
        profile.id,
        profile,
      ])
    ).values(),
  ];

  const speakers = combinedUniqueSpeakers.map((profile) => {
    let filteredProfile;
    if (sessionUser === null) {
      filteredProfile = filterProfileByVisibility<typeof profile>(profile);
    } else {
      filteredProfile = profile;
    }
    let avatar = filteredProfile.avatar;
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
      ...filteredProfile,
      avatar,
      blurredAvatar,
    };
  });
  let documents = event.documents;
  if (sessionUser === null) {
    documents = [];
  }

  return {
    teamMembersSubmission: teamMembersSubmission.reply(),
    speakersSubmission: speakersSubmission.reply(),
    responsibleOrganizationsSubmission:
      responsibleOrganizationsSubmission.reply(),
    event: {
      ...event,
      documents,
      teamMembers,
      responsibleOrganizations,
      speakers,
      conferenceLink,
      conferenceCode,
      conferenceLinkToBeAnnounced,
    },
  };
}
