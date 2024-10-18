import { type SupabaseClient } from "@supabase/supabase-js";
import { getImageURL, ImageSizes } from "~/images.server";
import {
  filterOrganizationByVisibility,
  filterProfileByVisibility,
} from "~/next-public-fields-filtering.server";
import { prismaClient } from "~/prisma.server";
import { getPublicURL } from "~/storage.server";

export async function getOrganization(slug: string) {
  const organization = await prismaClient.organization.findUnique({
    select: {
      id: true,
      teamMembers: {
        select: {
          profile: {
            select: {
              id: true,
              username: true,
              avatar: true,
              firstName: true,
              lastName: true,
              academicTitle: true,
              position: true,
              profileVisibility: {
                select: {
                  username: true,
                  avatar: true,
                  firstName: true,
                  lastName: true,
                  academicTitle: true,
                  position: true,
                },
              },
            },
          },
        },
        orderBy: {
          profile: {
            firstName: "asc",
          },
        },
      },
      organizationVisibility: {
        select: {
          teamMembers: true,
        },
      },
    },
    where: {
      slug: slug,
    },
  });

  return organization;
}

export function filterOrganization(
  organization: NonNullable<Awaited<ReturnType<typeof getOrganization>>>
) {
  const filteredOrganization =
    filterOrganizationByVisibility<typeof organization>(organization);

  const teamMembers = filteredOrganization.teamMembers.map((relation) => {
    const filteredProfile = filterProfileByVisibility<typeof relation.profile>(
      relation.profile
    );
    return {
      ...relation,
      profile: filteredProfile,
    };
  });

  return {
    ...filteredOrganization,
    teamMembers,
  };
}

export function addImgUrls(
  authClient: SupabaseClient,
  organization: NonNullable<Awaited<ReturnType<typeof getOrganization>>>
) {
  const teamMembers = organization.teamMembers.map((relation) => {
    let avatar = relation.profile.avatar;
    if (avatar !== null) {
      const publicURL = getPublicURL(authClient, avatar);
      avatar = getImageURL(publicURL, {
        resize: { type: "fill", ...ImageSizes.Profile.ListItem.Avatar },
      });
    }
    return {
      ...relation,
      profile: {
        ...relation.profile,
        avatar,
      },
    };
  });

  return {
    ...organization,
    teamMembers,
  };
}
