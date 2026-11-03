import { z } from "zod";

export const manageSchema = z.object({
  organizationTypes: z.array(z.uuid().trim()),
  networkTypes: z.array(z.uuid().trim()),
});

export const updateNetworkSchema = z.object({
  organizationId: z.uuid().trim(),
});
