import { SupabaseClient } from "@supabase/supabase-js";
import { getImageURL, GravityType } from "~/images.server";
import { prismaClient } from "~/prisma.server";
import { getPublicURL } from "~/storage.server";

export async function getOrganization(slug: string) {
  return await prismaClient.organization.findUnique({
    select: {
      id: true,
      admins: {
        select: {
          profile: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
              avatar: true,
              position: true,
            },
          },
        },
      },
    },
    where: {
      slug,
    },
  });
}

export async function getInvitedProfilesOfOrganization(
  authClient: SupabaseClient,
  organizationId: string
) {
  const profiles =
    await prismaClient.inviteForProfileToJoinOrganization.findMany({
      where: {
        organizationId,
        status: "pending",
        role: "admin",
      },
      select: {
        profile: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            avatar: true,
            position: true,
          },
        },
      },
      orderBy: {
        profile: {
          firstName: "asc",
        },
      },
    });

  const enhancedMembers = profiles.map((relation) => {
    if (relation.profile.avatar !== null) {
      const publicURL = getPublicURL(authClient, relation.profile.avatar);
      if (publicURL !== null) {
        const avatar = getImageURL(publicURL, {
          resize: { type: "fill", width: 64, height: 64 },
          gravity: GravityType.center,
        });
        return {
          ...relation,
          profile: { ...relation.profile, avatar },
        };
      }
    }
    return relation;
  });

  const flat = enhancedMembers.map((relation) => {
    return relation.profile;
  });

  return flat;
}
