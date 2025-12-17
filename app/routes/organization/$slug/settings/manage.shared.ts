import { z } from "zod";

export const manageSchema = z.object({
  organizationTypes: z.array(z.string().trim().uuid()),
  networkTypes: z.array(z.string().trim().uuid()),
});

export const updateNetworkSchema = z.object({
  organizationId: z.string().trim().uuid(),
});
