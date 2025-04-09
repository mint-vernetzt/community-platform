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
import { invariantResponse } from "~/lib/utils/response";
import { z } from "zod";

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
  role: "admin" | "teamMember";
}) {
  const { formData, locales, sessionUser, role } = options;
  const submission = await parseWithZod(formData, {
    schema: () =>
      quitProjectSchema.transform(async (data, ctx) => {
        const project = await prismaClient.project.findFirst({
          select: {
            id: true,
            name: true,
            _count: {
              select: {
                admins: true,
                teamMembers: true,
              },
            },
          },
          where:
            role === "admin"
              ? {
                  id: data.projectId,
                  admins: {
                    some: {
                      profileId: sessionUser.id,
                    },
                  },
                }
              : {
                  id: data.projectId,
                  teamMembers: {
                    some: {
                      profileId: sessionUser.id,
                    },
                  },
                },
        });
        invariantResponse(project !== null, locales.route.error.notFound, {
          status: 404,
        });
        if (role === "admin" && project._count.admins <= 1) {
          ctx.addIssue({
            code: "custom",
            message: locales.route.error.lastAdmin,
          });
          return z.NEVER;
        }
        if (role === "teamMember" && project._count.teamMembers <= 1) {
          ctx.addIssue({
            code: "custom",
            message: locales.route.error.lastTeamMember,
          });
          return z.NEVER;
        }
        if (role === "admin") {
          await prismaClient.adminOfProject.delete({
            where: {
              profileId_projectId: {
                profileId: sessionUser.id,
                projectId: data.projectId,
              },
            },
          });
        } else {
          await prismaClient.teamMemberOfProject.delete({
            where: {
              profileId_projectId: {
                profileId: sessionUser.id,
                projectId: data.projectId,
              },
            },
          });
        }
        return { ...data, name: project.name };
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
      id: "quit-organization-toast",
      key: `${new Date().getTime()}`,
      message: insertParametersIntoLocale(
        role === "admin"
          ? locales.route.quit.successAdmin
          : locales.route.quit.successMember,
        {
          name: submission.value.name,
        }
      ),
    },
  };
}
