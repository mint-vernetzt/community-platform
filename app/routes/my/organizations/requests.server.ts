import { SupabaseClient } from "@supabase/supabase-js";
import { getImageURL } from "~/images.server";
import { prismaClient } from "~/prisma.server";
import { getPublicURL } from "~/storage.server";

export async function getRequestsToOrganizations(
  profileId: string,
  authClient: SupabaseClient
) {
  const requests = (
    await prismaClient.requestToOrganizationToAddProfile.findMany({
      where: {
        profileId,
      },
      select: {
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
            logo: true,
            types: {
              select: {
                organizationType: {
                  select: {
                    title: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })
  ).map((relation) => {
    return relation.organization;
  });

  const enhancedRequests = requests.map((request) => {
    let logo = request.logo;
    if (logo !== null) {
      const publicURL = getPublicURL(authClient, logo);
      if (publicURL !== null) {
        logo = getImageURL(publicURL, {
          resize: { type: "fill", width: 144, height: 144 },
        });
      }
    }
    return {
      ...request,
      logo,
    };
  });

  return enhancedRequests;
}
