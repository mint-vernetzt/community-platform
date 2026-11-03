import { z } from "zod";

export const createOrCancelOrganizationMemberRequestSchema = z.object({
  organizationId: z.uuid().trim(),
});

export const updateOrganizationMemberInviteSchema = z.object({
  organizationId: z.uuid().trim(),
  role: z.enum(["admin", "member"]),
});

export const updateNetworkInviteSchema = z.object({
  organizationId: z.uuid().trim(),
  networkId: z.uuid().trim(),
});

export const acceptOrRejectOrganizationMemberRequestSchema = z.object({
  organizationId: z.uuid().trim(),
  profileId: z.uuid().trim(),
});

export const updateNetworkRequestSchema = z.object({
  organizationId: z.uuid().trim(),
  networkId: z.uuid().trim(),
});

export const quitOrganizationSchema = z.object({
  organizationId: z.uuid().trim(),
});
