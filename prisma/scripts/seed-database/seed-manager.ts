import type { SupabaseClient } from "@supabase/auth-helpers-remix";
import { getScoreOfEntity } from "../update-score/utils";
import type { AwardBucketData } from "./award-seeder";
import { getAwardData, seedAward } from "./award-seeder";
import type { DocumentBucketData } from "./document-seeder";
import { getDocumentData, seedDocument } from "./document-seeder";
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
  let entityData;
  let id;
  let score;
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

  for (let structureIterator in entities.profiles) {
    const structure = structureIterator as keyof typeof entities.profiles;
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
        entities.profiles[structure].push({ id, email: entityData.email });
      }
    }
  }

  for (let structureIterator in entities.organizations) {
    const structure = structureIterator as keyof typeof entities.organizations;
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
      entities.organizations[structure].push({ id });
    }
  }

  for (let structureIterator in entities.events) {
    const structure = structureIterator as keyof typeof entities.events;
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
      entities.events[structure].push({ id });
    }
  }

  for (let structureIterator in entities.projects) {
    const structure = structureIterator as keyof typeof entities.projects;
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
      entities.projects[structure].push({ id });
    }
  }

  for (let structureIterator in entities.documents) {
    const structure = structureIterator as keyof typeof entities.documents;
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
      entities.documents[structure].push({ id });
    }
  }

  for (let structureIterator in entities.awards) {
    const structure = structureIterator as keyof typeof entities.awards;
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
      entities.awards[structure].push({ id });
    }
  }
  return entities;
}

export async function connectAllEntities(entities: EntitiesContainer) {
  // TODO: utils.ts -> connecting entities with the new connector module
}
