import { prismaClient } from "~/prisma.server";

export async function updateFilterVectorOfEvent(eventId: string) {
  const event = await prismaClient.event.findFirst({
    where: { id: eventId },
    select: {
      id: true,
      slug: true,
      focuses: {
        select: {
          focus: {
            select: {
              slug: true,
            },
          },
        },
      },
      eventTargetGroups: {
        select: {
          eventTargetGroup: {
            select: {
              slug: true,
            },
          },
        },
      },
      stage: {
        select: {
          slug: true,
        },
      },
      responsibleOrganizations: {
        select: {
          organization: {
            select: {
              slug: true,
            },
          },
        },
      },
    },
  });

  if (event !== null) {
    if (
      event.focuses.length === 0 &&
      event.eventTargetGroups.length === 0 &&
      event.stage === null &&
      event.responsibleOrganizations.length === 0
    ) {
      await prismaClient.$queryRawUnsafe(
        `update events set filter_vector = NULL where id = '${event.id}'`
      );
    } else {
      const focusVectors = event.focuses.map(
        (relation) => `focus:${relation.focus.slug}`
      );
      const targetGroupVectors = event.eventTargetGroups.map(
        (relation) => `eventTargetGroup:${relation.eventTargetGroup.slug}`
      );
      const responsibleOrganizationVectors = event.responsibleOrganizations.map(
        (relation) => `responsibleOrganizations:${relation.organization.slug}`
      );
      const vectors = [
        ...focusVectors,
        ...targetGroupVectors,
        ...responsibleOrganizationVectors,
      ].concat(event.stage ? [`stage:${event.stage.slug}`] : []);
      const vectorString = `{"${vectors.join(`","`)}"}`;
      const query = `update events set filter_vector = array_to_tsvector('${vectorString}') where id = '${event.id}'`;

      await prismaClient.$queryRawUnsafe(query);
    }
  }
}
