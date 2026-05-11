import { type SupabaseClient } from "@supabase/supabase-js";
import { BlurFactor, getImageURL, ImageSizes } from "~/images.server";
import { prismaClient } from "~/prisma.server";
import { getPublicURL } from "~/storage.server";

export async function getEventBackground(
  slug: string,
  authClient: SupabaseClient
) {
  const background = await prismaClient.imageMetaData.findFirst({
    where: {
      backgroundOfEvent: {
        slug: slug,
      },
    },
    select: {
      path: true,
      credits: true,
      description: true,
    },
  });

  if (background === null) {
    return background;
  }

  let enhancedBackground = background.path;
  let blurredBackground;
  const publicURL = getPublicURL(authClient, background.path);
  if (publicURL !== null) {
    enhancedBackground = getImageURL(publicURL, {
      resize: {
        type: "fill",
        ...ImageSizes.Event.Detail.Background,
      },
    });
    blurredBackground = getImageURL(publicURL, {
      resize: {
        type: "fill",
        ...ImageSizes.Event.Detail.BlurredBackground,
      },
      blur: BlurFactor,
    });
  }

  return {
    ...background,
    path: enhancedBackground,
    blurredPath: blurredBackground,
  };
}
