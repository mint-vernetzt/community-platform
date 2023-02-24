import type { SupabaseClient } from "@supabase/auth-helpers-remix";
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
  initializeEntitiesContainer,
} from "./utils-new";
import type {
  EntitiesContainer,
  uploadDocumentBucketData,
  uploadImageBucketData,
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

  // TODO: utils.ts -> seedAllEntities() in a compact way with the new seeder modules
}

// TODO: Type
export async function connectAllEntities(entities: EntitiesContainer) {
  // TODO: utils.ts -> connecting entities with the new connector module
}
