import { type User, type SupabaseClient } from "@supabase/supabase-js";
import { BlurFactor, getImageURL, ImageSizes } from "~/images.server";
import { prismaClient } from "~/prisma.server";
import { getPublicURL } from "~/storage.server";
import { type supportedCookieLanguages } from "~/i18n.shared";
import { type ArrayElement } from "~/lib/utils/types";
import { type languageModuleMap } from "~/locales/.server";
import { DefaultImages } from "~/images.shared";
import { quitProjectSchema } from "./projects";
import { parseWithZod } from "@conform-to/zod-v1";
import { insertParametersIntoLocale } from "~/lib/utils/i18n";

export type MyProjectsLocales = (typeof languageModuleMap)[ArrayElement<
  typeof supportedCookieLanguages
>]["my/projects"];

export async function getProjects(options: {
  profileId: string;
  authClient: SupabaseClient;
}) {
  const { profileId, authClient } = options;

  const select = {
    id: true,
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
    } else {
      background = DefaultImages.Project.Background;
      blurredBackground = DefaultImages.Project.BlurredBackground;
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
    } else {
      background = DefaultImages.Project.Background;
      blurredBackground = DefaultImages.Project.BlurredBackground;
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

export async function quitProject(options: {
  formData: FormData;
  locales: MyProjectsLocales;
  sessionUser: User;
}) {
  const { formData, locales, sessionUser } = options;
  const submission = await parseWithZod(formData, {
    schema: () =>
      quitProjectSchema.transform(async (data, ctx) => {
        // TODO:
        // project id from form data
        // Check if the session user is admin or team member of the project
        // Check if the session user is last admin or team member of the project
        // If so -> return custom issue -> locales.route.quit.lastAdminOrTeamMember
        // If not, remove the connections (admin and team member)

        // Old
        // see quit.tsx
        return { ...data };
      }),
    async: true,
  });
  if (submission.status !== "success") {
    return {
      submission: submission.reply(),
    };
  }
  return {
    submission: submission.reply(),
    toast: {
      id: "quit-project-toast",
      key: `${new Date().getTime()}`,
      message: insertParametersIntoLocale(locales.route.quit.success, {
        project: "TODO: project name from database",
      }),
    },
  };
}
