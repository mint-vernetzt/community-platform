import type { $ZodConfig } from "zod/v4/core";

export const ZOD_GLOBAL_CONFIG_KEY = "__zod_globalConfig";
export const ZOD_CONFIG: $ZodConfig = {
  jitless: true,
};
