import { type Prisma } from "@prisma/client";
import { type User } from "@supabase/supabase-js";
import { createAuthClient } from "~/auth.server";
import { BlurFactor, getImageURL, ImageSizes } from "~/images.server";
import { prismaClient } from "~/prisma.server";
import { getPublicURL } from "~/storage.server";

export const GetOrganizationsToAdd = { SearchParam: "add-organization" };

export async function getOrganizationsToAdd(
  request: Request,
  sessionUser: User
) {
  const { authClient } = createAuthClient(request);

  const url = new URL(request.url);
  const searchParams = url.searchParams;

  const query = searchParams.get(GetOrganizationsToAdd.SearchParam);

  if (query === null || query === "" || query.length < 3) {
    return null;
  }

  const queryWords = query.split(" ");
  const whereQueries: {
    name: {
      contains: string;
      mode: Prisma.QueryMode;
    };
  }[] = queryWords
    .filter((word) => {
      return word.length > 0;
    })
    .map((word) => {
      return {
        name: {
          contains: word,
          mode: "insensitive",
        },
      };
    });

  const organizations = await prismaClient.organization.findMany({
    where: {
      teamMembers: {
        none: {
          profileId: sessionUser.id,
        },
      },
      profileJoinInvites: {
        none: {
          profileId: sessionUser.id,
          status: "pending",
        },
      },
      profileJoinRequests: {
        none: {
          profileId: sessionUser.id,
          status: "pending",
        },
      },
      OR: whereQueries,
    },
    select: {
      id: true,
      slug: true,
      name: true,
      logo: true,
      types: {
        select: {
          organizationType: {
            select: {
              slug: true,
            },
          },
        },
      },
    },
  });

  const withImage = organizations.map((organization) => {
    let logo = organization.logo;
    let blurredLogo;
    if (logo !== null) {
      const publicURL = getPublicURL(authClient, logo);
      if (publicURL !== null) {
        logo = getImageURL(publicURL, {
          resize: {
            type: "fill",
            width: ImageSizes.Organization.ListItem.Logo.width,
            height: ImageSizes.Organization.ListItem.Logo.height,
          },
        });
        blurredLogo = getImageURL(publicURL, {
          resize: {
            type: "fill",
            width: ImageSizes.Organization.ListItem.BlurredLogo.width,
            height: ImageSizes.Organization.ListItem.BlurredLogo.height,
          },
          blur: BlurFactor,
        });
      }
    }
    return {
      ...organization,
      logo,
      blurredLogo,
    };
  });

  return withImage;
}
