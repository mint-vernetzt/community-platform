import { prismaClient } from "~/prisma.server";

export async function getParticipantsOfEvent(slug: string) {
  const event = await prismaClient.event.findUnique({
    where: { slug },
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
        orderBy: {
          profile: {
            firstName: "asc",
          },
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
        },
      },
    },
  });

  if (event === null) {
    return [];
  }

  const aggregatedParticipants = [
    ...event.participants.map((participant) => {
      return { ...participant.profile, event: event.name };
    }),
    ...event.childEvents
      .map((childEvent) => {
        const participants = childEvent.participants.map((participant) => {
          return { ...participant.profile, event: childEvent.name };
        });
        return participants;
      })
      .flat(),
  ];

  const uniqueParticipants = aggregatedParticipants.filter(
    (participant, index, array) => {
      const firstIndex = array.findIndex((item) => {
        return item.id === participant.id;
      });
      return index === firstIndex;
    }
  );

  const sortedParticipants = uniqueParticipants.sort((a, b) => {
    const nameA = a.firstName.toLowerCase();
    const nameB = b.firstName.toLowerCase();
    if (nameA < nameB) {
      return -1;
    }
    if (nameA > nameB) {
      return 1;
    }
    return 0;
  });

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
