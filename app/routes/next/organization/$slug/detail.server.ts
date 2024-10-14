import { type SupabaseClient } from "@supabase/supabase-js";
import { getImageURL, ImageSizes } from "~/images.server";
import { prismaClient } from "~/prisma.server";
import { getPublicURL } from "~/storage.server";

export async function getOrganization(slug: string) {
  const organization = await prismaClient.organization.findUnique({
    select: {
      id: true,
      name: true,
      bio: true,
      background: true,
      email: true,
      phone: true,
      website: true,
      city: true,
      street: true,
      streetNumber: true,
      zipCode: true,
      facebook: true,
      linkedin: true,
      twitter: true,
      xing: true,
      instagram: true,
      youtube: true,
      mastodon: true,
      tiktok: true,
      supportedBy: true,
      _count: {
        select: {
          areas: true,
          focuses: true,
          networkMembers: true,
          memberOf: true,
          teamMembers: true,
          responsibleForEvents: {
            where: {
              event: {
                published: true,
              },
            },
          },
          responsibleForProject: {
            where: {
              project: {
                published: true,
              },
            },
          },
        },
      },
      organizationVisibility: {
        select: {
          name: true,
          bio: true,
          background: true,
          email: true,
          phone: true,
          website: true,
          city: true,
          street: true,
          streetNumber: true,
          zipCode: true,
          facebook: true,
          linkedin: true,
          twitter: true,
          xing: true,
          instagram: true,
          youtube: true,
          mastodon: true,
          tiktok: true,
          supportedBy: true,
        },
      },
    },
    where: {
      slug: slug,
    },
  });
  return organization;
}

export function addImgUrls(
  authClient: SupabaseClient,
  organization: NonNullable<Awaited<ReturnType<typeof getOrganization>>>
) {
  let background = organization.background;
  let blurredBackground;
  const { height, width, type, gravity } =
    ImageSizes.Organization.Detail.Background;
  const {
    height: blurredHeight,
    width: blurredWidth,
    type: blurredType,
    gravity: blurredGravity,
  } = ImageSizes.Organization.Detail.BlurredBackground;
  if (background !== null) {
    const publicURL = getPublicURL(authClient, background);
    background = getImageURL(publicURL, {
      resize: { type, height, width },
      gravity,
    });
    blurredBackground = getImageURL(publicURL, {
      resize: {
        type: blurredType,
        width: blurredWidth,
        height: blurredHeight,
      },
      gravity: blurredGravity,
      blur: 5,
    });
  }
  return {
    ...organization,
    background,
    blurredBackground,
  };
}
