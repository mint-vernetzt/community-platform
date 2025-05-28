import { z } from "zod";

export const createOrCancelOrganizationMemberRequestSchema = z.object({
  organizationId: z.string(),
});

export const updateOrganizationMemberInviteSchema = z.object({
  organizationId: z.string(),
  role: z.enum(["admin", "member"]),
});

export const updateNetworkInviteSchema = z.object({
  organizationId: z.string(),
  networkId: z.string(),
});

export const acceptOrRejectOrganizationMemberRequestSchema = z.object({
  organizationId: z.string(),
  profileId: z.string(),
});

export const updateNetworkRequestSchema = z.object({
  organizationId: z.string(),
  networkId: z.string(),
});

export const quitOrganizationSchema = z.object({
  organizationId: z.string(),
});
