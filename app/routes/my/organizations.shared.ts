import { z } from "zod";

export const createOrCancelOrganizationMemberRequestSchema = z.object({
  organizationId: z.string().trim().uuid(),
});

export const updateOrganizationMemberInviteSchema = z.object({
  organizationId: z.string().trim().uuid(),
  role: z.enum(["admin", "member"]),
});

export const updateNetworkInviteSchema = z.object({
  organizationId: z.string().trim().uuid(),
  networkId: z.string().trim().uuid(),
});

export const acceptOrRejectOrganizationMemberRequestSchema = z.object({
  organizationId: z.string().trim().uuid(),
  profileId: z.string().trim().uuid(),
});

export const updateNetworkRequestSchema = z.object({
  organizationId: z.string().trim().uuid(),
  networkId: z.string().trim().uuid(),
});

export const quitOrganizationSchema = z.object({
  organizationId: z.string().trim().uuid(),
});
