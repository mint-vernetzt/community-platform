import { type SupabaseClient } from "@supabase/supabase-js";
import { BlurFactor, getImageURL, ImageSizes } from "~/images.server";
import {
  filterOrganizationByVisibility,
  filterProjectByVisibility,
} from "~/next-public-fields-filtering.server";
import { prismaClient } from "~/prisma.server";
import { getPublicURL } from "~/storage.server";
import { type supportedCookieLanguages } from "~/i18n.shared";
import { type ArrayElement } from "~/lib/utils/types";
import { type languageModuleMap } from "~/locales/.server";

export type OrganizationProjectsLocales =
  (typeof languageModuleMap)[ArrayElement<
    typeof supportedCookieLanguages
  >]["organization/$slug/detail/projects"];

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
        where: {
          project: {
            published: true,
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
      let blurredLogo;
      if (logo !== null) {
        const publicURL = getPublicURL(authClient, logo);
        logo = getImageURL(publicURL, {
          resize: { type: "fill", ...ImageSizes.Project.ListItem.Logo },
        });
        blurredLogo = getImageURL(publicURL, {
          resize: { type: "fill", ...ImageSizes.Project.ListItem.BlurredLogo },
          blur: BlurFactor,
        });
      }
      return {
        ...relation,
        project: {
          ...relation.project,
          logo,
          blurredLogo,
        },
      };
    }
  );

  return {
    ...organization,
    responsibleForProject,
  };
}
