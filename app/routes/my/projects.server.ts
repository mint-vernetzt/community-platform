import { type SupabaseClient } from "@supabase/supabase-js";
import { getImageURL, ImageSizes } from "~/images.server";
import { prismaClient } from "~/prisma.server";
import { getPublicURL } from "~/storage.server";

export async function getProjects(options: {
  profileId: string;
  authClient: SupabaseClient;
}) {
  const { profileId, authClient } = options;

  const select = {
    name: true,
    slug: true,
    description: true,
    excerpt: true,
    background: true,
    logo: true,
    published: true,
    responsibleOrganizations: {
      select: {
        organization: {
          select: {
            name: true,
            slug: true,
            logo: true,
          },
        },
      },
    },
  };

  const [admin, teamMember] = await prismaClient.$transaction([
    prismaClient.project.findMany({
      where: {
        admins: {
          some: {
            profileId,
          },
        },
      },
      select,
      orderBy: {
        name: "asc",
      },
    }),
    prismaClient.project.findMany({
      where: {
        teamMembers: {
          some: {
            profileId,
          },
        },
      },
      select,
      orderBy: {
        name: "asc",
      },
    }),
  ]);

  const enhancedAdmin = admin.map((project) => {
    let background = project.background;
    let blurredBackground;

    if (background !== null) {
      const publicURL = getPublicURL(authClient, background);
      background = getImageURL(publicURL, {
        resize: { type: "fill", ...ImageSizes.Project.Card.Background },
      });
      blurredBackground = getImageURL(publicURL, {
        resize: {
          type: "fill",
          ...ImageSizes.Project.Card.BlurredBackground,
        },
        blur: 5,
      });
    }

    let logo = project.logo;
    if (logo !== null) {
      const publicURL = getPublicURL(authClient, logo);
      logo = getImageURL(publicURL, {
        resize: { type: "fill", ...ImageSizes.Project.Card.Logo },
      });
    }

    const responsibleOrganizations = project.responsibleOrganizations.map(
      (responsibleOrganization) => {
        let logo = responsibleOrganization.organization.logo;
        if (logo !== null) {
          const publicURL = getPublicURL(authClient, logo);
          logo = getImageURL(publicURL, {
            resize: {
              type: "fill",
              ...ImageSizes.Project.Card.ResponsibleOrganizationLogo,
            },
          });
        }
        return {
          ...responsibleOrganization,
          organization: {
            ...responsibleOrganization.organization,
            logo,
          },
        };
      }
    );

    return {
      ...project,
      responsibleOrganizations,
      logo,
      background,
      blurredBackground,
    };
  });

  const enhancedTeamMembers = teamMember.map((project) => {
    let background = project.background;
    let blurredBackground;

    if (background !== null) {
      const publicURL = getPublicURL(authClient, background);
      background = getImageURL(publicURL, {
        resize: { type: "fill", ...ImageSizes.Project.Card.Background },
      });
      blurredBackground = getImageURL(publicURL, {
        resize: {
          type: "fill",
          ...ImageSizes.Project.Card.BlurredBackground,
        },
        blur: 5,
      });
    }

    let logo = project.logo;
    if (logo !== null) {
      const publicURL = getPublicURL(authClient, logo);
      logo = getImageURL(publicURL, {
        resize: { type: "fill", ...ImageSizes.Project.Card.Logo },
      });
    }

    const responsibleOrganizations = project.responsibleOrganizations.map(
      (responsibleOrganization) => {
        let logo = responsibleOrganization.organization.logo;
        if (logo !== null) {
          const publicURL = getPublicURL(authClient, logo);
          logo = getImageURL(publicURL, {
            resize: {
              type: "fill",
              ...ImageSizes.Project.Card.ResponsibleOrganizationLogo,
            },
          });
        }
        return {
          ...responsibleOrganization,
          organization: {
            ...responsibleOrganization.organization,
            logo,
          },
        };
      }
    );

    return {
      ...project,
      responsibleOrganizations,
      logo,
      background,
      blurredBackground,
    };
  });

  return {
    admin: enhancedAdmin,
    teamMember: enhancedTeamMembers,
    count: {
      admin: admin.length,
      teamMember: teamMember.length,
    },
  };
}
