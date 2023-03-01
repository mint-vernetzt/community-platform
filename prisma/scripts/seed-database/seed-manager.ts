import type { SupabaseClient } from "@supabase/auth-helpers-remix";
import { getScoreOfEntity } from "../update-score/utils";
import type { AwardBucketData } from "./award-seeder";
import { getAwardData, seedAward } from "./award-seeder";
import type { DocumentBucketData } from "./document-seeder";
import { getDocumentData, seedDocument } from "./document-seeder";
import {
  connectOrganizationWithArea,
  connectOrganizationWithFocus,
  connectOrganizationWithOrganizationType,
  connectProfileWithArea,
  connectProfileWithOffer,
  connectProfileWithSeeking,
  connectProfileWithOrganization,
  connectOrganizationWithNetwork,
  connectEventWithArea,
  connectEventWithFocus,
  connectEventWithEventType,
  connectEventWithExperienceLevel,
  connectEventWithStage,
  connectEventWithTag,
  connectEventWithTargetGroup,
} from "./entity-connector";
import type { EventBucketData } from "./event-seeder";
import { getEventData, seedEvent } from "./event-seeder";
import type { OrganizationBucketData } from "./organization-seeder";
import { getOrganizationData, seedOrganization } from "./organization-seeder";
import type { ProfileBucketData } from "./profile-seeder";
import { getProfileData, seedProfile } from "./profile-seeder";
import type { ProjectBucketData } from "./project-seeder";
import { getProjectData, seedProject } from "./project-seeder";
import type {
  EntitiesContainer,
  uploadDocumentBucketData,
  uploadImageBucketData,
} from "./utils-new";
import {
  getAllAreas,
  getAllDisciplines,
  getAllEventTypes,
  getAllExperienceLevels,
  getAllFocuses,
  getAllOffersAndSeekings,
  getAllOrganizationTypes,
  getAllStages,
  getAllTags,
  getAllTargetGroups,
  getRandomAvatar,
  getRandomBackground,
  getRandomDocument,
  getRandomLogo,
  getSomeRandomEntities,
  initializeEntitiesContainer,
} from "./utils-new";

export async function seedAllEntities(
  imageBucketData: Awaited<ReturnType<typeof uploadImageBucketData>>,
  documentBucketData: Awaited<ReturnType<typeof uploadDocumentBucketData>>,
  authClient: SupabaseClient<any, "public", any>,
  defaultPassword: string,
  useRealNames: boolean,
  numberOfEventsPerStructure: number,
  numberOfStandardEntities: number
) {
  let entities: EntitiesContainer = initializeEntitiesContainer();
  entities.areas = await getAllAreas();
  entities.offersAndSeekings = await getAllOffersAndSeekings();
  entities.organizationTypes = await getAllOrganizationTypes();
  entities.focuses = await getAllFocuses();
  entities.targetGroups = await getAllTargetGroups();
  entities.experienceLevels = await getAllExperienceLevels();
  entities.eventTypes = await getAllEventTypes();
  entities.tags = await getAllTags();
  entities.stages = await getAllStages();
  entities.disciplines = await getAllDisciplines();
  entities.profiles = await seedAllProfileStructures(
    entities.profiles,
    imageBucketData,
    numberOfStandardEntities,
    useRealNames,
    authClient,
    defaultPassword
  );
  entities.organizations = await seedAllOrganizationStructures(
    entities.organizations,
    imageBucketData,
    numberOfStandardEntities,
    useRealNames
  );
  entities.events = await seedAllEventStructures(
    entities.events,
    imageBucketData,
    numberOfStandardEntities,
    useRealNames,
    numberOfEventsPerStructure
  );
  entities.projects = await seedAllProjectStructures(
    entities.projects,
    imageBucketData,
    numberOfStandardEntities,
    useRealNames
  );
  entities.documents = await seedAllDocumentStructures(
    entities.documents,
    documentBucketData,
    numberOfStandardEntities
  );
  entities.awards = await seedAllAwardStructures(
    entities.awards,
    imageBucketData,
    numberOfStandardEntities
  );
  return entities;
}

export async function connectAllEntities(entities: EntitiesContainer) {
  await connectAllProfiles(entities);
  await connectAllOrganizations(entities);
  await connectAllEvents(entities);
}

async function seedAllProfileStructures(
  profilesContainer: EntitiesContainer["profiles"],
  imageBucketData: Awaited<ReturnType<typeof uploadImageBucketData>>,
  numberOfStandardEntities: number,
  useRealNames: boolean,
  authClient: SupabaseClient<any, "public", any>,
  defaultPassword: string
) {
  const seededProfilesContainer = profilesContainer;
  let entityData;
  let id;
  let score;

  for (let structureIterator in profilesContainer) {
    const structure = structureIterator as keyof typeof profilesContainer;
    let bucketData: ProfileBucketData = {
      avatar: {
        path: getRandomAvatar(imageBucketData.avatars),
      },
      background: {
        path: getRandomBackground(imageBucketData.backgrounds),
      },
    };
    let iterations = 1;
    if (structure === "standard") {
      iterations = numberOfStandardEntities;
    }
    if (structure === "smallest") {
      bucketData = undefined;
    }
    for (let i = 0; i < iterations; i++) {
      entityData = getProfileData(structure, i, bucketData, useRealNames);
      score = getScoreOfEntity(entityData);
      id = await seedProfile(
        { ...entityData, score },
        authClient,
        defaultPassword
      );
      if (id !== undefined) {
        seededProfilesContainer[structure].push({
          id,
          email: entityData.email,
        });
      }
    }
  }
  return seededProfilesContainer;
}

async function seedAllOrganizationStructures(
  organizationsContainer: EntitiesContainer["organizations"],
  imageBucketData: Awaited<ReturnType<typeof uploadImageBucketData>>,
  numberOfStandardEntities: number,
  useRealNames: boolean
) {
  const seededOrganizationsContainer = organizationsContainer;
  let entityData;
  let id;
  let score;

  for (let structureIterator in organizationsContainer) {
    const structure = structureIterator as keyof typeof organizationsContainer;
    let bucketData: OrganizationBucketData = {
      logo: {
        path: getRandomLogo(imageBucketData.logos),
      },
      background: {
        path: getRandomBackground(imageBucketData.backgrounds),
      },
    };
    let iterations = 1;
    if (structure === "standard") {
      iterations = numberOfStandardEntities;
    }
    if (structure === "smallest") {
      bucketData = undefined;
    }
    for (let i = 0; i < iterations; i++) {
      entityData = getOrganizationData(structure, bucketData, useRealNames);
      score = getScoreOfEntity(entityData);
      id = await seedOrganization({ ...entityData, score });
      seededOrganizationsContainer[structure].push({ id });
    }
  }
  return seededOrganizationsContainer;
}

async function seedAllEventStructures(
  eventsContainer: EntitiesContainer["events"],
  imageBucketData: Awaited<ReturnType<typeof uploadImageBucketData>>,
  numberOfStandardEntities: number,
  useRealNames: boolean,
  numberOfEventsPerStructure: number
) {
  const seededEventsContainer = eventsContainer;
  let entityData;
  let id;

  for (let structureIterator in eventsContainer) {
    const structure = structureIterator as keyof typeof eventsContainer;
    let bucketData: EventBucketData = {
      background: {
        path: getRandomBackground(imageBucketData.backgrounds),
      },
    };
    let iterations = numberOfEventsPerStructure;
    if (structure === "smallest") {
      bucketData = undefined;
    }
    for (let i = 0; i < iterations; i++) {
      entityData = getEventData(
        structure,
        i,
        bucketData,
        useRealNames,
        numberOfStandardEntities
      );
      id = await seedEvent(entityData);
      seededEventsContainer[structure].push({ id });
    }
  }
  return seededEventsContainer;
}

async function seedAllProjectStructures(
  projectsContainer: EntitiesContainer["projects"],
  imageBucketData: Awaited<ReturnType<typeof uploadImageBucketData>>,
  numberOfStandardEntities: number,
  useRealNames: boolean
) {
  const seededProjectsContainer = projectsContainer;
  let entityData;
  let id;

  for (let structureIterator in projectsContainer) {
    const structure = structureIterator as keyof typeof projectsContainer;
    let bucketData: ProjectBucketData = {
      logo: {
        path: getRandomLogo(imageBucketData.logos),
      },
      background: {
        path: getRandomBackground(imageBucketData.backgrounds),
      },
    };
    let iterations = 1;
    if (structure === "standard") {
      iterations = numberOfStandardEntities;
    }
    if (structure === "smallest") {
      bucketData = undefined;
    }
    for (let i = 0; i < iterations; i++) {
      entityData = getProjectData(structure, bucketData, useRealNames);
      id = await seedProject(entityData);
      seededProjectsContainer[structure].push({ id });
    }
  }
  return seededProjectsContainer;
}

async function seedAllDocumentStructures(
  documentsContainer: EntitiesContainer["documents"],
  documentBucketData: Awaited<ReturnType<typeof uploadDocumentBucketData>>,
  numberOfStandardEntities: number
) {
  const seededDocumentsContainer = documentsContainer;
  let entityData;
  let id;

  for (let structureIterator in documentsContainer) {
    const structure = structureIterator as keyof typeof documentsContainer;
    const bucketData: DocumentBucketData = {
      document: getRandomDocument(documentBucketData.documents),
    };
    let iterations = 1;
    if (structure === "standard") {
      iterations = numberOfStandardEntities;
    }
    for (let i = 0; i < iterations; i++) {
      entityData = getDocumentData(structure, bucketData);
      id = await seedDocument(entityData);
      seededDocumentsContainer[structure].push({ id });
    }
  }
  return seededDocumentsContainer;
}

async function seedAllAwardStructures(
  awardsContainer: EntitiesContainer["awards"],
  imageBucketData: Awaited<ReturnType<typeof uploadImageBucketData>>,
  numberOfStandardEntities: number
) {
  const seededAwardsContainer = awardsContainer;
  let entityData;
  let id;

  for (let structureIterator in awardsContainer) {
    const structure = structureIterator as keyof typeof awardsContainer;
    const bucketData: AwardBucketData = {
      logo: {
        path: getRandomLogo(imageBucketData.logos),
      },
    };
    let iterations = 1;
    if (structure === "standard") {
      iterations = numberOfStandardEntities;
    }
    for (let i = 0; i < iterations; i++) {
      entityData = getAwardData(structure, i, bucketData);
      id = await seedAward(entityData);
      seededAwardsContainer[structure].push({ id });
    }
  }
  return seededAwardsContainer;
}

async function connectAllProfiles(entities: EntitiesContainer) {
  // Connecting profiles with areas/offers/seekings
  for (let structureIterator in entities.profiles) {
    const structure = structureIterator as keyof typeof entities.profiles;
    for (let profile of entities.profiles[structure]) {
      // All profile structures except largest and smallest connect with some areas/offers/seekings
      if (structure !== "smallest" && structure !== "largest") {
        const someAreas = getSomeRandomEntities(entities.areas, {
          min: 1,
          max: 3,
        });
        const someOffers = getSomeRandomEntities(entities.offersAndSeekings, {
          min: 1,
          max: 3,
        });
        const someSeekings = getSomeRandomEntities(entities.offersAndSeekings, {
          min: 1,
          max: 3,
        });
        for (let area of someAreas) {
          await connectProfileWithArea(profile.id, area.id);
        }
        for (let offer of someOffers) {
          await connectProfileWithOffer(profile.id, offer.id);
        }
        for (let seeking of someSeekings) {
          await connectProfileWithSeeking(profile.id, seeking.id);
        }
      } else {
        // Largest profile connects with all areas/offers/seekings
        if (structure === "largest") {
          for (let area of entities.areas) {
            await connectProfileWithArea(profile.id, area.id);
          }
          for (let offerAndSeeking of entities.offersAndSeekings) {
            await connectProfileWithOffer(profile.id, offerAndSeeking.id);
            await connectProfileWithSeeking(profile.id, offerAndSeeking.id);
          }
        }
        // else -> structure === "smallest" -> No relations for this structure
      }
    }
  }
}

async function connectAllOrganizations(entities: EntitiesContainer) {
  // Connecting organizations with areas/focuses/organizationTypes/profiles as members/organizations as networkMembers
  for (let structureIterator in entities.organizations) {
    const structure = structureIterator as keyof typeof entities.organizations;
    for (let organization of entities.organizations[structure]) {
      // All organization structures except largest and smallest connect with some areas/focuses/organizationTypes
      if (structure !== "smallest" && structure !== "largest") {
        const someAreas = getSomeRandomEntities(entities.areas, {
          min: 1,
          max: 3,
        });
        const someFocuses = getSomeRandomEntities(entities.focuses, {
          min: 1,
          max: 3,
        });
        const someOrganizationTypes = getSomeRandomEntities(
          entities.organizationTypes,
          {
            min: 1,
            max: 3,
          }
        );
        for (let area of someAreas) {
          await connectOrganizationWithArea(organization.id, area.id);
        }
        for (let focus of someFocuses) {
          await connectOrganizationWithFocus(organization.id, focus.id);
        }
        for (let organizationType of someOrganizationTypes) {
          await connectOrganizationWithOrganizationType(
            organization.id,
            organizationType.id
          );
        }
      } else {
        // Largest organization connects with all areas/focuses/organizationTypes
        if (structure === "largest") {
          for (let area of entities.areas) {
            await connectOrganizationWithArea(organization.id, area.id);
          }
          for (let focus of entities.focuses) {
            await connectOrganizationWithFocus(organization.id, focus.id);
          }
          for (let organizationType of entities.organizationTypes) {
            await connectOrganizationWithOrganizationType(
              organization.id,
              organizationType.id
            );
          }
        }
        // else -> structure === "smallest" -> No relations for this structure
      }
      // All organization structures connect with adminProfile as memberOfOrganization who is privileged
      let isPrivileged = true;
      for (let profile of entities.profiles.admin) {
        await connectProfileWithOrganization(
          profile.id,
          organization.id,
          isPrivileged
        );
      }
      // All organization structures except largest, smallest, largeTeam, smallTeam connect with some standardProfiles as membersOfOrganization
      isPrivileged = false;
      if (
        structure !== "smallest" &&
        structure !== "largest" &&
        structure !== "smallTeam" &&
        structure !== "largeTeam"
      ) {
        const someProfiles = getSomeRandomEntities(entities.profiles.standard, {
          min: 1,
          max: 10,
        });
        for (let profile of someProfiles) {
          await connectProfileWithOrganization(
            profile.id,
            organization.id,
            isPrivileged
          );
        }
      } else {
        // Largest and largeTeam organization connects with all standardProfiles as memberOfOrganization
        if (structure === "largest" || structure === "largeTeam") {
          for (let profile of entities.profiles.standard) {
            await connectProfileWithOrganization(
              profile.id,
              organization.id,
              isPrivileged
            );
          }
        }
        // smallTeam and smallest organization connects with one standardProfile as memberOfOrganization
        if (structure === "smallTeam" || structure === "smallest") {
          if (entities.profiles.standard[0] !== null) {
            await connectProfileWithOrganization(
              entities.profiles.standard[0].id,
              organization.id,
              isPrivileged
            );
          }
        }
      }
      // Specific organization structures connect with specific profiles as membersOfOrganization
      if (structure === "private") {
        for (let profile of entities.profiles.private) {
          await connectProfileWithOrganization(
            profile.id,
            organization.id,
            isPrivileged
          );
        }
      }
      if (structure === "public") {
        for (let profile of entities.profiles.public) {
          await connectProfileWithOrganization(
            profile.id,
            organization.id,
            isPrivileged
          );
        }
      }
      if (structure === "emptyStrings") {
        for (let profile of entities.profiles.emptyStrings) {
          await connectProfileWithOrganization(
            profile.id,
            organization.id,
            isPrivileged
          );
        }
      }
      if (structure === "eventCompanion") {
        for (let profile of entities.profiles.eventManager) {
          await connectProfileWithOrganization(
            profile.id,
            organization.id,
            isPrivileged
          );
        }
      }
      if (structure === "projectCompanion") {
        for (let profile of entities.profiles.maker) {
          await connectProfileWithOrganization(
            profile.id,
            organization.id,
            isPrivileged
          );
        }
      }
      if (structure === "network" || structure === "coordinator") {
        for (let profile of entities.profiles.coordinator) {
          await connectProfileWithOrganization(
            profile.id,
            organization.id,
            isPrivileged
          );
        }
        if (structure === "network") {
          const someNetworkMembers = getSomeRandomEntities(
            entities.organizations.standard,
            {
              min: 1,
              max: 10,
            }
          );
          for (let networkMember of someNetworkMembers) {
            await connectOrganizationWithNetwork(
              networkMember.id,
              organization.id
            );
          }
          for (let networkMember of entities.organizations.coordinator) {
            await connectOrganizationWithNetwork(
              networkMember.id,
              organization.id
            );
          }
        }
      }
      if (structure === "developer") {
        for (let profile of entities.profiles.developer) {
          await connectProfileWithOrganization(
            profile.id,
            organization.id,
            isPrivileged
          );
        }
      }
      if (structure === "smallest") {
        for (let profile of entities.profiles.smallest) {
          await connectProfileWithOrganization(
            profile.id,
            organization.id,
            isPrivileged
          );
        }
      }
      if (structure === "largest") {
        for (let profile of entities.profiles.largest) {
          await connectProfileWithOrganization(
            profile.id,
            organization.id,
            isPrivileged
          );
        }
      }
      if (structure === "unicode") {
        for (let profile of entities.profiles.unicode) {
          await connectProfileWithOrganization(
            profile.id,
            organization.id,
            isPrivileged
          );
        }
      }
    }
  }
}

async function connectAllEvents(entities: EntitiesContainer) {
  // Connecting events with areas/focuses/eventTypes/experienceLevels/stages/tags/targetGroups/profiles as participants/profiles as teamMembers/profiles as speaker/profiles as waitingParticipants/organizations as responsibleOrganizations/events as childEvents
  for (let structureIterator in entities.events) {
    const structure = structureIterator as keyof typeof entities.events;
    for (let event of entities.events[structure]) {
      // All events structures except largest and smallest connect with some areas/focuses/eventTypes/experienceLevels/stages/tags/targetGroups
      if (structure !== "smallest" && structure !== "largest") {
        const someAreas = getSomeRandomEntities(entities.areas, {
          min: 1,
          max: 3,
        });
        const someFocuses = getSomeRandomEntities(entities.focuses, {
          min: 1,
          max: 3,
        });
        const someEventTypes = getSomeRandomEntities(entities.eventTypes, {
          min: 1,
          max: 3,
        });
        const someExperienceLevel = getSomeRandomEntities(
          entities.experienceLevels,
          {
            min: 1,
            max: 1,
          }
        );
        const someStage = getSomeRandomEntities(entities.stages, {
          min: 1,
          max: 1,
        });
        const someTags = getSomeRandomEntities(entities.tags, {
          min: 1,
          max: 3,
        });
        const someTargetGroups = getSomeRandomEntities(entities.targetGroups, {
          min: 1,
          max: 3,
        });
        for (let area of someAreas) {
          await connectEventWithArea(event.id, area.id);
        }
        for (let focus of someFocuses) {
          await connectEventWithFocus(event.id, focus.id);
        }
        for (let eventType of someEventTypes) {
          await connectEventWithEventType(event.id, eventType.id);
        }
        for (let experienceLevel of someExperienceLevel) {
          await connectEventWithExperienceLevel(event.id, experienceLevel.id);
        }
        for (let stage of someStage) {
          await connectEventWithStage(event.id, stage.id);
        }
        for (let tag of someTags) {
          await connectEventWithTag(event.id, tag.id);
        }
        for (let targetGroup of someTargetGroups) {
          await connectEventWithTargetGroup(event.id, targetGroup.id);
        }
      } else {
        // Largest event connects with all areas/focuses/eventTypes/tags/targetGroups and one experienceLevel/stage
        if (structure === "largest") {
          const someExperienceLevel = getSomeRandomEntities(
            entities.experienceLevels,
            {
              min: 1,
              max: 1,
            }
          );
          const someStage = getSomeRandomEntities(entities.stages, {
            min: 1,
            max: 1,
          });
          for (let area of entities.areas) {
            await connectEventWithArea(event.id, area.id);
          }
          for (let focus of entities.focuses) {
            await connectEventWithFocus(event.id, focus.id);
          }
          for (let eventType of entities.eventTypes) {
            await connectEventWithEventType(event.id, eventType.id);
          }
          for (let experienceLevel of someExperienceLevel) {
            await connectEventWithExperienceLevel(event.id, experienceLevel.id);
          }
          for (let stage of someStage) {
            await connectEventWithStage(event.id, stage.id);
          }
          for (let tag of entities.tags) {
            await connectEventWithTag(event.id, tag.id);
          }
          for (let targetGroup of entities.targetGroups) {
            await connectEventWithTargetGroup(event.id, targetGroup.id);
          }
        }
        // else -> structure === "smallest" -> No relations for this structure
      }

      // TODO: Connect events with profiles/organizations/childEvents

      // All organization structures connect with adminProfile as memberOfOrganization who is privileged
      let isPrivileged = true;
      for (let profile of entities.profiles.admin) {
        await connectProfileWithOrganization(
          profile.id,
          event.id,
          isPrivileged
        );
      }
      // All organization structures except largest, smallest, largeTeam, smallTeam connect with some standardProfiles as membersOfOrganization
      isPrivileged = false;
      if (
        structure !== "smallest" &&
        structure !== "largest" &&
        structure !== "smallTeam" &&
        structure !== "largeTeam"
      ) {
        const someProfiles = getSomeRandomEntities(entities.profiles.standard, {
          min: 1,
          max: 10,
        });
        for (let profile of someProfiles) {
          await connectProfileWithOrganization(
            profile.id,
            event.id,
            isPrivileged
          );
        }
      } else {
        // Largest and largeTeam organization connects with all standardProfiles as memberOfOrganization
        if (structure === "largest" || structure === "largeTeam") {
          for (let profile of entities.profiles.standard) {
            await connectProfileWithOrganization(
              profile.id,
              event.id,
              isPrivileged
            );
          }
        }
        // smallTeam and smallest organization connects with one standardProfile as memberOfOrganization
        if (structure === "smallTeam" || structure === "smallest") {
          if (entities.profiles.standard[0] !== null) {
            await connectProfileWithOrganization(
              entities.profiles.standard[0].id,
              event.id,
              isPrivileged
            );
          }
        }
      }
      // Specific organization structures connect with specific profiles as membersOfOrganization
      if (structure === "private") {
        for (let profile of entities.profiles.private) {
          await connectProfileWithOrganization(
            profile.id,
            event.id,
            isPrivileged
          );
        }
      }
      if (structure === "public") {
        for (let profile of entities.profiles.public) {
          await connectProfileWithOrganization(
            profile.id,
            event.id,
            isPrivileged
          );
        }
      }
      if (structure === "emptyStrings") {
        for (let profile of entities.profiles.emptyStrings) {
          await connectProfileWithOrganization(
            profile.id,
            event.id,
            isPrivileged
          );
        }
      }
      if (structure === "eventCompanion") {
        for (let profile of entities.profiles.eventManager) {
          await connectProfileWithOrganization(
            profile.id,
            event.id,
            isPrivileged
          );
        }
      }
      if (structure === "projectCompanion") {
        for (let profile of entities.profiles.maker) {
          await connectProfileWithOrganization(
            profile.id,
            event.id,
            isPrivileged
          );
        }
      }
      if (structure === "network" || structure === "coordinator") {
        for (let profile of entities.profiles.coordinator) {
          await connectProfileWithOrganization(
            profile.id,
            event.id,
            isPrivileged
          );
        }
        if (structure === "network") {
          const someNetworkMembers = getSomeRandomEntities(
            entities.organizations.standard,
            {
              min: 1,
              max: 10,
            }
          );
          for (let networkMember of someNetworkMembers) {
            await connectOrganizationWithNetwork(networkMember.id, event.id);
          }
          for (let networkMember of entities.organizations.coordinator) {
            await connectOrganizationWithNetwork(networkMember.id, event.id);
          }
        }
      }
      if (structure === "developer") {
        for (let profile of entities.profiles.developer) {
          await connectProfileWithOrganization(
            profile.id,
            event.id,
            isPrivileged
          );
        }
      }
      if (structure === "smallest") {
        for (let profile of entities.profiles.smallest) {
          await connectProfileWithOrganization(
            profile.id,
            event.id,
            isPrivileged
          );
        }
      }
      if (structure === "largest") {
        for (let profile of entities.profiles.largest) {
          await connectProfileWithOrganization(
            profile.id,
            event.id,
            isPrivileged
          );
        }
      }
      if (structure === "unicode") {
        for (let profile of entities.profiles.unicode) {
          await connectProfileWithOrganization(
            profile.id,
            event.id,
            isPrivileged
          );
        }
      }
    }
  }
}
