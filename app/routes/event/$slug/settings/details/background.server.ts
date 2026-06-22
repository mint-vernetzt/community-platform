import { type SupabaseClient } from "@supabase/supabase-js";
import { BlurFactor, getImageURL, ImageSizes } from "~/images.server";
import { prismaClient } from "~/prisma.server";
import { getPublicURL, uploadFileToStorage } from "~/storage.server";
import { BUCKET_NAME_IMAGES } from "~/storage.shared";

export async function getEventBySlugWithBackground(
  slug: string,
  authClient: SupabaseClient
) {
  const event = await prismaClient.event.findUnique({
    where: { slug },
    select: {
      id: true,
      publishIntended: true,
      backgroundImageMetaData: {
        select: {
          path: true,
          credits: true,
          description: true,
        },
      },
    },
  });

  if (event === null) {
    return null;
  }

  if (event.backgroundImageMetaData === null) {
    return {
      ...event,
      background: null,
    };
  }

  let enhancedBackground = event.backgroundImageMetaData.path;
  let blurredBackground;
  const publicURL = getPublicURL(
    authClient,
    event.backgroundImageMetaData.path
  );
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
    ...event,
    background: {
      ...event.backgroundImageMetaData,
      path: enhancedBackground,
      blurredPath: blurredBackground,
    },
  };
}

export async function changeEventBackground(options: {
  slug: string;
  authClient: SupabaseClient;
  data: {
    file?: File;
    description: string | null;
    credits?: string | null;
  };
}) {
  const { slug, authClient, data } = options;
  const { file, ...rest } = data;

  if (typeof file === "undefined") {
    await prismaClient.event.update({
      where: {
        slug,
      },
      data: {
        backgroundImageMetaData: {
          update: {
            ...rest,
          },
        },
      },
    });
    return;
  }

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
      backgroundImageMetaData: {
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

export async function removeEventBackground(options: { slug: string }) {
  const { slug } = options;

  await prismaClient.event.update({
    where: {
      slug,
    },
    data: {
      backgroundImageMetaData: {
        delete: true,
      },
    },
  });
}
