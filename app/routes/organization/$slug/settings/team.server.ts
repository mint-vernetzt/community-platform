import { type SupabaseClient } from "@supabase/supabase-js";
import { BlurFactor, ImageSizes, getImageURL } from "~/images.server";
import { prismaClient } from "~/prisma.server";
import { getPublicURL } from "~/storage.server";

export async function getMembersOfOrganization(
  authClient: SupabaseClient,
  organizationId: string
) {
  const members = await prismaClient.memberOfOrganization.findMany({
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
    where: {
      organizationId: organizationId,
    },
    orderBy: {
      profile: {
        firstName: "asc",
      },
    },
  });

  const enhancedMembers = members.map((relation) => {
    let avatar = relation.profile.avatar;
    let blurredAvatar;
    if (avatar !== null) {
      const publicURL = getPublicURL(authClient, avatar);
      if (publicURL !== null) {
        avatar = getImageURL(publicURL, {
          resize: {
            type: "fill",
            width: ImageSizes.Profile.ListItemLegacy.Avatar.width,
            height: ImageSizes.Profile.ListItemLegacy.Avatar.height,
          },
        });
        blurredAvatar = getImageURL(publicURL, {
          resize: {
            type: "fill",
            width: ImageSizes.Profile.ListItemLegacy.BlurredAvatar.width,
            height: ImageSizes.Profile.ListItemLegacy.BlurredAvatar.height,
          },
          blur: BlurFactor,
        });
      }
    }
    return { ...relation.profile, avatar, blurredAvatar };
  });

  return enhancedMembers;
}

export async function getOrganizationBySlug(slug: string) {
  return await prismaClient.organization.findUnique({
    select: {
      id: true,
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
        role: "member",
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
    let avatar = relation.profile.avatar;
    let blurredAvatar;
    if (avatar !== null) {
      const publicURL = getPublicURL(authClient, avatar);
      if (publicURL !== null) {
        avatar = getImageURL(publicURL, {
          resize: {
            type: "fill",
            width: ImageSizes.Profile.ListItemLegacy.Avatar.width,
            height: ImageSizes.Profile.ListItemLegacy.Avatar.height,
          },
        });
        blurredAvatar = getImageURL(publicURL, {
          resize: {
            type: "fill",
            width: ImageSizes.Profile.ListItemLegacy.BlurredAvatar.width,
            height: ImageSizes.Profile.ListItemLegacy.BlurredAvatar.height,
          },
          blur: BlurFactor,
        });
      }
    }
    return { ...relation.profile, avatar, blurredAvatar };
  });

  return enhancedMembers;
}
