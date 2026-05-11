import { type SupabaseClient } from "@supabase/supabase-js";
import { BlurFactor, getImageURL, ImageSizes } from "~/images.server";
import { prismaClient } from "~/prisma.server";
import { getPublicURL, uploadFileToStorage } from "~/storage.server";
import { BUCKET_NAME_IMAGES } from "~/storage.shared";

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

export async function changeEventBackground(options: {
  slug: string;
  authClient: SupabaseClient;
  data: {
    file: File;
    description?: string;
    credits?: string;
  };
}) {
  const { slug, authClient, data } = options;
  const { file, ...rest } = data;

  const { fileMetadataForDatabase, error } = await uploadFileToStorage({
    file,
    authClient,
    bucket: BUCKET_NAME_IMAGES,
  });

  if (error !== null) {
    throw error;
  }
  if (fileMetadataForDatabase === null) {
    throw new Error("File metadata is null after upload");
  }

  await prismaClient.event.update({
    where: {
      slug,
    },
    data: {
      backgroundImage: {
        upsert: {
          create: {
            ...fileMetadataForDatabase,
            ...rest,
          },
          update: {
            ...fileMetadataForDatabase,
            ...rest,
          },
        },
      },
    },
  });
}
