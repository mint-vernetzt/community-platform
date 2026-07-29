import { prismaClient } from "~/prisma.server";

export async function getParticipantsOfEvent(slug: string) {
  const event = await prismaClient.event.findUnique({
    where: { slug },
    select: {
      name: true,
      published: true,
      external: true,
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
      guests: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          organizationName: true,
        },
        orderBy: {
          firstName: "asc",
        },
      },
      childEvents: {
        select: {
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
          },
          guests: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              organizationName: true,
            },
          },
        },
      },
    },
  });

  if (event === null) {
    return [];
  }

  const participantsOfEvent = event.participants.map((participant) => ({
    ...participant.profile,
    event: event.name,
  }));

  const guestsOfEvent = event.guests.map((guest) => ({
    id: `guest:${guest.id}`,
    firstName: guest.firstName,
    lastName: guest.lastName,
    email: guest.email,
    position: "",
    memberOf:
      guest.organizationName !== null
        ? [{ organization: { name: guest.organizationName } }]
        : [],
    areas: [],
    event: event.name,
  }));

  const participantsAndGuestsOfChildEvents = event.childEvents.flatMap(
    (childEvent) => [
      ...childEvent.participants.map((participant) => ({
        ...participant.profile,
        event: childEvent.name,
      })),
      ...childEvent.guests.map((guest) => ({
        id: `guest:${guest.id}`,
        firstName: guest.firstName,
        lastName: guest.lastName,
        email: guest.email,
        position: "",
        memberOf:
          guest.organizationName !== null
            ? [{ organization: { name: guest.organizationName } }]
            : [],
        areas: [],
        event: childEvent.name,
      })),
    ]
  );

  const aggregatedParticipants = [
    ...participantsOfEvent,
    ...guestsOfEvent,
    ...participantsAndGuestsOfChildEvents,
  ];

  const uniqueParticipants = aggregatedParticipants.filter(
    (participant, index, array) => {
      const firstIndex = array.findIndex((item) => {
        return item.id === participant.id;
      });
      return index === firstIndex;
    }
  );

  const enhancedParticipantsWithListOfEvents = uniqueParticipants.map(
    (participant) => {
      const eventsOfParticipant = aggregatedParticipants
        .filter((item) => {
          return item.id === participant.id;
        })
        .map((item) => {
          return item.event;
        });
      return { ...participant, event: eventsOfParticipant.join(", ") };
    }
  );

  const sortedParticipants = enhancedParticipantsWithListOfEvents.sort(
    (a, b) => {
      const nameA = a.firstName.toLowerCase();
      const nameB = b.firstName.toLowerCase();
      if (nameA < nameB) {
        return -1;
      }
      if (nameA > nameB) {
        return 1;
      }
      return 0;
    }
  );

  return sortedParticipants;
}

export function createCsvString(
  profiles: Awaited<ReturnType<typeof getParticipantsOfEvent>>
) {
  let csv =
    "VORNAME,NACHNAME,EMAIL,POSITION,ORGANISATIONEN,AKTIVITÄTSGEBIETE,VERANSTALTUNG\n";

  for (const profile of profiles) {
    const data = [];
    data.push(`"${profile.firstName}"`);
    data.push(`"${profile.lastName}"`);
    data.push(typeof profile.email === "string" ? `"${profile.email}"` : "");
    data.push(`"${profile.position}"`);
    data.push(
      Array.isArray(profile.memberOf)
        ? `"${profile.memberOf
            .map((rel) => {
              return typeof rel === "string" ? rel : rel.organization.name;
            })
            .join(", ")}"`
        : ""
    );
    data.push(
      Array.isArray(profile.areas)
        ? `"${profile.areas
            .map((rel) => {
              return typeof rel === "string" ? rel : rel.area.name;
            })
            .join(", ")}"`
        : ""
    );
    data.push(typeof profile.event === "string" ? `"${profile.event}"` : "");
    csv += data.join(",") + "\n";
  }

  return csv;
}

export async function getEventNameBySlug(slug: string) {
  const event = await prismaClient.event.findUnique({
    where: { slug },
    select: {
      name: true,
    },
  });

  if (event === null) {
    return null;
  }

  return event.name;
}
