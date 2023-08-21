import { prismaClient } from "~/prisma.server";

export async function connectProfileToEvent(
  eventId: string,
  profileId: string
) {
  await prismaClient.teamMemberOfEvent.create({
    data: {
      eventId,
      profileId,
    },
  });
}

export async function disconnectProfileFromEvent(
  eventId: string,
  profileId: string
) {
  await prismaClient.teamMemberOfEvent.delete({
    where: {
      eventId_profileId: {
        eventId,
        profileId,
      },
    },
  });
}

export async function updateEventTeamMemberPrivilege(
  eventId: string,
  teamMemberId: string,
  isPrivileged: boolean
) {
  await prismaClient.teamMemberOfEvent.update({
    where: {
      eventId_profileId: {
        eventId,
        profileId: teamMemberId,
      },
    },
    data: {
      isPrivileged,
    },
  });
}
