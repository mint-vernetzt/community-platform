import { prismaClient } from "../../../app/prisma";

export async function connectProfileWithOrganization(
  profileId: string,
  organizationId: string,
  isPrivileged: boolean
) {
  await prismaClient.memberOfOrganization.create({
    data: {
      organizationId: organizationId,
      profileId: profileId,
      isPrivileged: isPrivileged,
    },
  });
}

export async function connectProfileWithProject(
  profileId: string,
  projectId: string,
  isPrivileged: boolean
) {
  await prismaClient.teamMemberOfProject.create({
    data: {
      projectId: projectId,
      profileId: profileId,
      isPrivileged: isPrivileged,
    },
  });
}

export async function connectProfileWithEventAsMember(
  profileId: string,
  eventId: string,
  isPrivileged: boolean
) {
  await prismaClient.teamMemberOfEvent.create({
    data: {
      eventId: eventId,
      profileId: profileId,
      isPrivileged: isPrivileged,
    },
  });
}

export async function connectProfileWithEventAsSpeaker(
  profileId: string,
  eventId: string
) {
  await prismaClient.speakerOfEvent.create({
    data: {
      eventId: eventId,
      profileId: profileId,
    },
  });
}

export async function connectProfileWithEventAsParticipant(
  profileId: string,
  eventId: string
) {
  await prismaClient.participantOfEvent.create({
    data: {
      eventId: eventId,
      profileId: profileId,
    },
  });
}

export async function connectProfileWithEventAsWaitingParticipant(
  profileId: string,
  eventId: string
) {
  await prismaClient.waitingParticipantOfEvent.create({
    data: {
      eventId: eventId,
      profileId: profileId,
    },
  });
}

export async function connectProfileWithArea(
  profileId: string,
  areaId: string
) {
  await prismaClient.areasOnProfiles.create({
    data: {
      areaId: areaId,
      profileId: profileId,
    },
  });
}

export async function connectProfileWithOffer(
  profileId: string,
  offerId: string
) {
  await prismaClient.offersOnProfiles.create({
    data: {
      offerId: offerId,
      profileId: profileId,
    },
  });
}

export async function connectProfileWithSeeking(
  profileId: string,
  offerId: string
) {
  await prismaClient.seekingsOnProfiles.create({
    data: {
      offerId: offerId,
      profileId: profileId,
    },
  });
}

export async function connectOrganizationWithNetwork(
  organizationId: string,
  networkOrganizationId: string
) {
  await prismaClient.memberOfNetwork.create({
    data: {
      networkId: networkOrganizationId,
      networkMemberId: organizationId,
    },
  });
}

export async function connectOrganizationWithProject(
  organizationId: string,
  projectId: string
) {
  await prismaClient.responsibleOrganizationOfProject.create({
    data: {
      projectId: projectId,
      organizationId: organizationId,
    },
  });
}

export async function connectOrganizationWithEvent(
  organizationId: string,
  eventId: string
) {
  await prismaClient.responsibleOrganizationOfEvent.create({
    data: {
      eventId: eventId,
      organizationId: organizationId,
    },
  });
}

export async function connectOrganizationWithArea(
  organizationId: string,
  areaId: string
) {
  await prismaClient.areasOnOrganizations.create({
    data: {
      areaId: areaId,
      organizationId: organizationId,
    },
  });
}

export async function connectOrganizationWithFocus(
  organizationId: string,
  focusId: string
) {
  await prismaClient.focusesOnOrganizations.create({
    data: {
      focusId: focusId,
      organizationId: organizationId,
    },
  });
}

export async function connectOrganizationWithOrganizationType(
  organizationId: string,
  organizationTypeId: string
) {
  await prismaClient.organizationTypesOnOrganizations.create({
    data: {
      organizationTypeId: organizationTypeId,
      organizationId: organizationId,
    },
  });
}

export async function connectChildEventWithParentEvent(
  childEventId: string,
  parentEventId: string
) {
  await prismaClient.event.update({
    where: {
      id: childEventId,
    },
    data: {
      parentEventId: parentEventId,
    },
  });
}

export async function connectEventWithDocument(
  eventId: string,
  documentId: string
) {
  await prismaClient.documentOfEvent.create({
    data: {
      documentId: documentId,
      eventId: eventId,
    },
  });
}

export async function connectEventWithArea(eventId: string, areaId: string) {
  await prismaClient.areaOfEvent.create({
    data: {
      areaId: areaId,
      eventId: eventId,
    },
  });
}

export async function connectEventWithFocus(eventId: string, focusId: string) {
  await prismaClient.focusOfEvent.create({
    data: {
      focusId: focusId,
      eventId: eventId,
    },
  });
}

export async function connectEventWithEventType(
  eventId: string,
  eventTypeId: string
) {
  await prismaClient.typeOfEvent.create({
    data: {
      eventTypeId: eventTypeId,
      eventId: eventId,
    },
  });
}

export async function connectEventWithExperienceLevel(
  eventId: string,
  experienceLevelId: string
) {
  await prismaClient.event.update({
    where: {
      id: eventId,
    },
    data: {
      experienceLevelId: experienceLevelId,
    },
  });
}

export async function connectEventWithStage(eventId: string, stageId: string) {
  await prismaClient.event.update({
    where: {
      id: eventId,
    },
    data: {
      stageId: stageId,
    },
  });
}

export async function connectEventWithTag(eventId: string, tagId: string) {
  await prismaClient.tagOfEvent.create({
    data: {
      tagId: tagId,
      eventId: eventId,
    },
  });
}

export async function connectEventWithTargetGroup(
  eventId: string,
  targetGroupId: string
) {
  await prismaClient.targetGroupOfEvent.create({
    data: {
      targetGroupId: targetGroupId,
      eventId: eventId,
    },
  });
}

export async function connectProjectWithAward(
  projectId: string,
  awardId: string
) {
  await prismaClient.awardOfProject.create({
    data: {
      awardId: awardId,
      projectId: projectId,
    },
  });
}

export async function connectProjectWithDiscipline(
  projectId: string,
  disciplineId: string
) {
  await prismaClient.disciplineOfProject.create({
    data: {
      disciplineId: disciplineId,
      projectId: projectId,
    },
  });
}

export async function connectProjectWithTargetGroup(
  projectId: string,
  targetGroupId: string
) {
  await prismaClient.targetGroupOfProject.create({
    data: {
      targetGroupId: targetGroupId,
      projectId: projectId,
    },
  });
}
