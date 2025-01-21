import { prismaClient } from "~/prisma.server";
import { type supportedCookieLanguages } from "~/i18n.shared";
import { type ArrayElement } from "~/lib/utils/types";
import { type languageModuleMap } from "~/locales/.server";
import { getFullDepthProfiles } from "../utils.server";
import { invariantResponse } from "~/lib/utils/response";

export type EventCsvDownloadLocales = (typeof languageModuleMap)[ArrayElement<
  typeof supportedCookieLanguages
>]["event/$slug/settings/csv-download"];

export async function getEventBySlug(slug: string) {
  return await prismaClient.event.findUnique({
    select: {
      id: true,
      name: true,
      participants: {
        select: {
          profile: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              position: true,
              memberOf: {
                select: {
                  organization: {
                    select: {
                      name: true,
                    },
                  },
                },
              },
              areas: {
                select: {
                  area: {
                    select: {
                      name: true,
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: {
          profile: {
            firstName: "asc",
          },
        },
      },
      waitingList: {
        select: {
          profile: {
            select: {
              id: true,
              createdAt: true,
              firstName: true,
              lastName: true,
              email: true,
              position: true,
              memberOf: {
                select: {
                  organization: {
                    select: {
                      name: true,
                    },
                  },
                },
              },
              areas: {
                select: {
                  area: {
                    select: {
                      name: true,
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: "asc",
        },
      },
    },
    where: {
      slug,
    },
  });
}

export async function getProfilesBySearchParams(
  event: NonNullable<Awaited<ReturnType<typeof getEventBySlug>>>,
  depth: string | null,
  type: string | null,
  locales: EventCsvDownloadLocales
) {
  let profiles;

  const groupBy = "events";
  if (type === "participants") {
    if (depth === "full") {
      profiles = await getFullDepthProfiles(event.id, "participants", groupBy);
    } else if (depth === "single") {
      profiles = event.participants.map((participant) => {
        return { ...participant.profile, participatedEvents: event.name };
      });
    } else {
      invariantResponse(false, locales.error.badRequest.depth, { status: 400 });
    }
  } else if (type === "waitingList") {
    if (depth === "full") {
      profiles = await getFullDepthProfiles(event.id, "waitingList", groupBy);
    } else if (depth === "single") {
      profiles = event.waitingList.map((waitingParticipant) => {
        return {
          ...waitingParticipant.profile,
          participatedEvents: event.name,
        };
      });
    } else {
      invariantResponse(false, locales.error.badRequest.depth, { status: 400 });
    }
  } else {
    invariantResponse(false, locales.error.badRequest.type, { status: 400 });
  }

  if (profiles === null) {
    invariantResponse(false, locales.error.notFound, {
      status: 400,
    });
  }

  return profiles;
}

export function getFilenameBySearchParams(
  event: NonNullable<Awaited<ReturnType<typeof getEventBySlug>>>,
  depth: string | null,
  type: string | null
) {
  let filename = event.name;

  if (type === "participants") {
    filename += " Teilnehmende";
  }
  if (type === "waitingList") {
    filename += " Warteliste";
  }
  if (depth === "full") {
    filename += " inklusive Subveranstaltungen";
  }
  filename += ".csv";

  return filename;
}

export function createCsvString(
  profiles: Awaited<ReturnType<typeof getProfilesBySearchParams>>
) {
  let csv =
    "VORNAME,NACHNAME,EMAIL,POSITION,ORGANISATIONEN,AKTIVITÄTSGEBIETE,VERANSTALTUNG\n";

  for (const profile of profiles) {
    const ref = "profile" in profile ? profile.profile : profile;
    const data = [];
    data.push(`"${ref.firstName}"`);
    data.push(`"${ref.lastName}"`);
    data.push(typeof ref.email === "string" ? `"${ref.email}"` : "");
    data.push(`"${ref.position}"`);
    data.push(
      Array.isArray(ref.memberOf)
        ? `"${ref.memberOf
            .map((rel) => {
              return typeof rel === "string" ? rel : rel.organization.name;
            })
            .join(", ")}"`
        : ""
    );
    data.push(
      Array.isArray(ref.areas)
        ? `"${ref.areas
            .map((rel) => {
              return typeof rel === "string" ? rel : rel.area.name;
            })
            .join(", ")}"`
        : ""
    );
    data.push(
      typeof ref.participatedEvents === "string"
        ? `"${ref.participatedEvents}"`
        : ""
    );
    csv += data.join(",") + "\n";
  }

  return csv;
}
