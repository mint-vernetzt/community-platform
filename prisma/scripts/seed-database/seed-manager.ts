import type { SupabaseClient } from "@supabase/auth-helpers-remix";
import { initializeEntitiesContainer } from "./utils-new";
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

  // TODO: utils.ts -> seedAllEntities() in a compact way with the new seeder modules
}

// TODO: Type
export async function connectAllEntities(entities: EntitiesContainer) {
  // TODO: utils.ts -> connecting entities with the new connector module
}
