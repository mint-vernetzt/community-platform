import { type SupabaseClient } from "@supabase/supabase-js";
import { getImageURL, ImageSizes } from "~/images.server";
import {
  filterOrganizationByVisibility,
  filterProjectByVisibility,
} from "~/next-public-fields-filtering.server";
import { prismaClient } from "~/prisma.server";
import { getPublicURL } from "~/storage.server";

export async function getOrganization(slug: string) {
  const organization = await prismaClient.organization.findUnique({
    select: {
      id: true,
      responsibleForProject: {
        select: {
          project: {
            select: {
              id: true,
              slug: true,
              logo: true,
              name: true,
              responsibleOrganizations: {
                select: {
                  organization: {
                    select: {
                      slug: true,
                      name: true,
                    },
                  },
                },
              },
              projectVisibility: {
                select: {
                  id: true,
                  slug: true,
                  logo: true,
                  name: true,
                  responsibleOrganizations: true,
                },
              },
            },
          },
        },
        orderBy: {
          project: {
            name: "asc",
          },
        },
      },
      organizationVisibility: {
        select: {
          responsibleForProject: true,
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

  const responsibleForProject = filteredOrganization.responsibleForProject.map(
    (relation) => {
      const filteredProject = filterProjectByVisibility<
        typeof relation.project
      >(relation.project);
      return {
        ...relation,
        project: filteredProject,
      };
    }
  );

  return {
    ...filteredOrganization,
    responsibleForProject,
  };
}

export function addImgUrls(
  authClient: SupabaseClient,
  organization: NonNullable<Awaited<ReturnType<typeof getOrganization>>>
) {
  const responsibleForProject = organization.responsibleForProject.map(
    (relation) => {
      let logo = relation.project.logo;
      if (logo !== null) {
        const publicURL = getPublicURL(authClient, logo);
        logo = getImageURL(publicURL, {
          resize: { type: "fill", ...ImageSizes.Project.ListItem.Logo },
        });
      }
      return {
        ...relation,
        project: {
          ...relation.project,
          logo,
        },
      };
    }
  );

  return {
    ...organization,
    responsibleForProject,
  };
}
