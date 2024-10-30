import { type SupabaseClient } from "@supabase/supabase-js";
import { BlurFactor, getImageURL, ImageSizes } from "~/images.server";
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

  const [adminProjects, teamMemberProjects] = await prismaClient.$transaction([
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

  const enhancedAdminProjects = adminProjects.map((project) => {
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
        blur: BlurFactor,
      });
    }

    let logo = project.logo;
    let blurredLogo;
    if (logo !== null) {
      const publicURL = getPublicURL(authClient, logo);
      logo = getImageURL(publicURL, {
        resize: { type: "fill", ...ImageSizes.Project.Card.Logo },
      });
      blurredLogo = getImageURL(publicURL, {
        resize: { type: "fill", ...ImageSizes.Project.Card.BlurredLogo },
        blur: BlurFactor,
      });
    }

    const responsibleOrganizations = project.responsibleOrganizations.map(
      (responsibleOrganization) => {
        let logo = responsibleOrganization.organization.logo;
        let blurredLogo;
        if (logo !== null) {
          const publicURL = getPublicURL(authClient, logo);
          logo = getImageURL(publicURL, {
            resize: {
              type: "fill",
              ...ImageSizes.Organization.CardFooter.Logo,
            },
          });
          blurredLogo = getImageURL(publicURL, {
            resize: {
              type: "fill",
              ...ImageSizes.Organization.CardFooter.BlurredLogo,
            },
            blur: BlurFactor,
          });
        }
        return {
          ...responsibleOrganization,
          organization: {
            ...responsibleOrganization.organization,
            logo,
            blurredLogo,
          },
        };
      }
    );

    return {
      ...project,
      responsibleOrganizations,
      logo,
      blurredLogo,
      background,
      blurredBackground,
    };
  });

  const enhancedTeamMemberProjects = teamMemberProjects.map((project) => {
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
        blur: BlurFactor,
      });
    }

    let logo = project.logo;
    let blurredLogo;
    if (logo !== null) {
      const publicURL = getPublicURL(authClient, logo);
      logo = getImageURL(publicURL, {
        resize: { type: "fill", ...ImageSizes.Project.Card.Logo },
      });
      blurredLogo = getImageURL(publicURL, {
        resize: { type: "fill", ...ImageSizes.Project.Card.BlurredLogo },
        blur: BlurFactor,
      });
    }

    const responsibleOrganizations = project.responsibleOrganizations.map(
      (responsibleOrganization) => {
        let logo = responsibleOrganization.organization.logo;
        let blurredLogo;
        if (logo !== null) {
          const publicURL = getPublicURL(authClient, logo);
          logo = getImageURL(publicURL, {
            resize: {
              type: "fill",
              ...ImageSizes.Organization.CardFooter.Logo,
            },
          });
          blurredLogo = getImageURL(publicURL, {
            resize: {
              type: "fill",
              ...ImageSizes.Organization.CardFooter.BlurredLogo,
            },
            blur: BlurFactor,
          });
        }
        return {
          ...responsibleOrganization,
          organization: {
            ...responsibleOrganization.organization,
            logo,
            blurredLogo,
          },
        };
      }
    );

    return {
      ...project,
      responsibleOrganizations,
      logo,
      blurredLogo,
      background,
      blurredBackground,
    };
  });

  return {
    adminProjects: enhancedAdminProjects,
    teamMemberProjects: enhancedTeamMemberProjects,
    count: {
      adminProjects: adminProjects.length,
      teamMemberProjects: teamMemberProjects.length,
    },
  };
}
